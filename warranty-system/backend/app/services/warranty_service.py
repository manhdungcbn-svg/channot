"""Warranty business logic."""
from datetime import date
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.warranty import STATUS_FLOW, WarrantyHistory, WarrantyTicket
from app.models.user import User
from app.services import ai_service, notification_service


class WarrantyCheckResult:
    def __init__(self, within: bool, reason: str):
        self.within = within
        self.reason = reason


def check_warranty(product: Product) -> WarrantyCheckResult:
    """Kiểm tra điều kiện bảo hành: trong thời hạn + sản phẩm còn active."""
    if product.warranty_months <= 0:
        return WarrantyCheckResult(False, "Sản phẩm không có chính sách bảo hành")
    end_date = date(
        product.manufacture_date.year + (product.manufacture_date.month + product.warranty_months - 1) // 12,
        (product.manufacture_date.month + product.warranty_months - 1) % 12 + 1,
        min(product.manufacture_date.day, 28),
    )
    today = date.today()
    if today <= end_date:
        return WarrantyCheckResult(True, f"Còn bảo hành đến {end_date.isoformat()}")
    return WarrantyCheckResult(False, f"Đã hết hạn bảo hành từ {end_date.isoformat()}")


def generate_ticket_code(db: Session) -> str:
    import secrets
    import string
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(secrets.choice(chars) for _ in range(6))
    year = date.today().year
    count = db.query(func.count(WarrantyTicket.id)).scalar() or 0
    return f"WR-{year}-{count + 1:04d}-{suffix}"


def create_ticket(
    db: Session,
    product: Product,
    customer_id: int,
    issue_description: str,
    customer_name: Optional[str] = None,
    customer_email: Optional[str] = None,
    customer_phone: Optional[str] = None,
) -> WarrantyTicket:
    check = check_warranty(product)
    ai_class = ai_service.classify_issue(issue_description)
    code = generate_ticket_code(db)
    ticket = WarrantyTicket(
        ticket_code=code,
        product_id=product.id,
        customer_id=customer_id,
        issue_description=issue_description,
        status="RECEIVED",
        ai_classification=ai_class,
        within_warranty="YES" if check.within else "NO",
        warranty_check_reason=check.reason,
        repair_cost=Decimal("0"),
        payment_status="UNPAID",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    # History entry đầu tiên
    db.add(
        WarrantyHistory(
            ticket_id=ticket.id,
            technician_id=None,
            action_note=f"Tiếp nhận phiếu. AI phân loại: {ai_class}. Kiểm tra bảo hành: {check.reason}",
            status_from=None,
            status_to="RECEIVED",
        )
    )
    db.commit()
    db.refresh(ticket)
    # AI progress message
    ticket.ai_progress_message = ai_service.generate_progress_message(
        customer_name=None, ticket_code=code, status="RECEIVED"
    )
    db.commit()
    db.refresh(ticket)
    # Notify admins/staff about new ticket
    _notify_admins_new_ticket(db, ticket)
    return ticket


def _notify_admins_new_ticket(db: Session, ticket: WarrantyTicket):
    """Gửi thông báo cho admin/staff khi có phiếu mới."""
    try:
        customer = db.query(User).filter(User.id == ticket.customer_id).first()
        customer_name = customer.full_name if customer else "Khách hàng"
        admins = db.query(User).filter(User.role.in_(["admin", "staff"])).all()
        for admin in admins:
            notification_service.notify_ticket_created(db, ticket.ticket_code, customer_name, admin.id)
    except Exception:
        pass  # Non-critical — don't fail ticket creation


def assign_technician(db: Session, ticket: WarrantyTicket, technician_id: int, note: str = "") -> WarrantyTicket:
    ticket.technician_id = technician_id
    db.add(
        WarrantyHistory(
            ticket_id=ticket.id,
            technician_id=technician_id,
            action_note=note or f"Phân công kỹ thuật viên #{technician_id}",
            status_from=ticket.status,
            status_to=ticket.status,
        )
    )
    db.commit()
    db.refresh(ticket)
    # Notify technician about assignment
    try:
        notification_service.notify_assigned(
            db,
            technician_id=technician_id,
            ticket_code=ticket.ticket_code,
            product_name=ticket.product.name if ticket.product else "",
        )
    except Exception:
        pass
    return ticket


def update_status(
    db: Session,
    ticket: WarrantyTicket,
    new_status: str,
    note: str,
    technician_id: Optional[int] = None,
    repair_cost: Optional[Decimal] = None,
) -> WarrantyTicket:
    if new_status not in STATUS_FLOW.get(ticket.status, []):
        raise ValueError(f"Không thể chuyển từ {ticket.status} sang {new_status}")
    old = ticket.status
    ticket.status = new_status
    if repair_cost is not None:
        ticket.repair_cost = repair_cost
    if new_status == "REJECTED":
        ticket.payment_status = "UNPAID"
    db.add(
        WarrantyHistory(
            ticket_id=ticket.id,
            technician_id=technician_id or ticket.technician_id,
            action_note=note,
            status_from=old,
            status_to=new_status,
        )
    )
    # AI progress message cho khách
    ticket.ai_progress_message = ai_service.generate_progress_message(
        customer_name=None, ticket_code=ticket.ticket_code, status=new_status
    )
    db.commit()
    db.refresh(ticket)
    # Notify customer about status change
    _notify_customer_status_change(db, ticket, new_status, note)
    return ticket


def _notify_customer_status_change(db: Session, ticket: WarrantyTicket, new_status: str, note: str):
    """Thông báo cho khách hàng khi trạng thái thay đổi."""
    try:
        notification_service.notify_status_changed(
            db,
            customer_id=ticket.customer_id,
            ticket_code=ticket.ticket_code,
            new_status=new_status,
            action_note=note,
        )
    except Exception:
        pass  # Non-critical


def get_history_text(db: Session, product: Product) -> List[str]:
    rows = (
        db.query(WarrantyHistory)
        .join(WarrantyTicket, WarrantyTicket.id == WarrantyHistory.ticket_id)
        .filter(WarrantyTicket.product_id == product.id)
        .all()
    )
    return [f"[{h.status_from or '-'}→{h.status_to}] {h.action_note}" for h in rows]


def summarize_for_technician(db: Session, ticket: WarrantyTicket) -> str:
    history_text = get_history_text(db, ticket.product)
    return ai_service.summarize_history(
        product_name=ticket.product.name, serial=ticket.product.serial_number, history=history_text
    )


def get_stats(db: Session) -> dict:
    total = db.query(func.count(WarrantyTicket.id)).scalar() or 0
    by_status_rows = db.query(WarrantyTicket.status, func.count(WarrantyTicket.id)).group_by(WarrantyTicket.status).all()
    by_status = {s: c for s, c in by_status_rows}

    cat_rows = (
        db.query(WarrantyTicket.ai_classification, func.count(WarrantyTicket.id))
        .filter(WarrantyTicket.ai_classification.isnot(None))
        .group_by(WarrantyTicket.ai_classification)
        .all()
    )
    top_cats = [{"category": c, "count": n} for c, n in sorted(cat_rows, key=lambda x: -x[1])]

    rejected = by_status.get("REJECTED", 0)
    rejection_rate = (rejected / total) if total else 0.0

    # Avg processing hours for COMPLETED
    completed = (
        db.query(WarrantyTicket)
        .filter(WarrantyTicket.status == "COMPLETED")
        .all()
    )
    if completed:
        from datetime import datetime

        durations = [
            (t.updated_at - t.created_at).total_seconds() / 3600.0
            for t in completed
            if t.updated_at and t.created_at
        ]
        avg_hours = sum(durations) / len(durations) if durations else 0.0
    else:
        avg_hours = 0.0

    return {
        "total_tickets": total,
        "by_status": by_status,
        "top_issue_categories": top_cats,
        "rejection_rate": rejection_rate,
        "avg_processing_hours": avg_hours,
    }