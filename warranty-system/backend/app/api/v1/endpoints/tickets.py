from decimal import Decimal
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.product import Product
from app.models.user import User
from app.models.warranty import WarrantyTicket
from app.schemas.schemas import (
    HistoryOut,
    ProductOut,
    StatsOut,
    TicketAssign,
    TicketCreate,
    TicketDetailOut,
    TicketOut,
    TicketStatusUpdate,
    UserOut,
)
from app.services import warranty_service
from app.services.wallet_service import InsufficientBalanceError, pay

router = APIRouter(prefix="/tickets", tags=["Tickets"])


def _attach_display_names(ticket: WarrantyTicket) -> None:
    """Gắn tên sản phẩm / khách hàng vào phiếu (để UI hiển thị)."""
    product = getattr(ticket, "product", None)
    customer = getattr(ticket, "customer", None)
    ticket.product_name = product.name if product else None
    ticket.product_serial = product.serial_number if product else None
    ticket.customer_name = customer.full_name if customer else None


@router.get("/public/{ticket_code}")
def get_ticket_public(
    ticket_code: str,
    db: Annotated[Session, Depends(get_db)],
):
    """Tra cứu công khai phiếu bảo hành theo mã - không cần đăng nhập"""
    t = db.query(WarrantyTicket).options(
        joinedload(WarrantyTicket.product),
        joinedload(WarrantyTicket.customer),
    ).filter(WarrantyTicket.ticket_code == ticket_code).first()
    
    if not t:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu bảo hành")
    
    # Trả về thông tin công khai (không có thông tin nhạy cảm)
    return {
        "id": t.id,
        "ticket_code": t.ticket_code,
        "status": t.status,
        "issue_description": t.issue_description,
        "ai_progress_message": t.ai_progress_message,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        "product": {
            "name": t.product.name if t.product else None,
            "serial_number": t.product.serial_number if t.product else None,
            "category": t.product.category if t.product else None,
        } if t.product else None,
        "customer": {
            "full_name": t.customer.full_name if t.customer else None,
            "phone": t.customer.phone[-4:] if t.customer and t.customer.phone else None,  # Chỉ 4 số cuối
        } if t.customer else None,
    }


@router.get("", response_model=List[TicketOut])
def list_tickets(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    status_filter: str = Query("", alias="status"),
    serial: str = Query(""),
):
    q = db.query(WarrantyTicket).options(
        joinedload(WarrantyTicket.product),
        joinedload(WarrantyTicket.customer),
    )
    if current.role == "customer":
        q = q.filter(WarrantyTicket.customer_id == current.id)
    if status_filter:
        q = q.filter(WarrantyTicket.status == status_filter)
    if serial:
        q = q.join(Product).filter(Product.serial_number == serial)
    tickets = q.order_by(WarrantyTicket.id.desc()).limit(200).all()
    # Gắn tên hiển thị để UI không phải gọi thêm API.
    for t in tickets:
        _attach_display_names(t)
    return tickets


@router.get("/{ticket_id}", response_model=TicketDetailOut)
def get_ticket(
    ticket_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    t = (
        db.query(WarrantyTicket)
        .options(joinedload(WarrantyTicket.history), joinedload(WarrantyTicket.product), joinedload(WarrantyTicket.customer), joinedload(WarrantyTicket.technician))
        .filter(WarrantyTicket.id == ticket_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Phiếu không tồn tại")
    if current.role == "customer" and t.customer_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem phiếu này")
    _attach_display_names(t)
    return t


@router.post("", response_model=TicketOut, status_code=201)
def create_ticket(
    payload: TicketCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Customer tạo phiếu của chính họ; staff/admin có thể tạo thay."""
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    if current.role == "customer" and product.customer_id and product.customer_id != current.id:
        raise HTTPException(status_code=403, detail="Sản phẩm này không thuộc sở hữu của bạn")
    customer_id = current.id if current.role == "customer" else (product.customer_id or current.id)
    ticket = warranty_service.create_ticket(
        db, product, customer_id, payload.issue_description,
        customer_name=payload.customer_name or current.full_name,
        customer_email=payload.customer_email or current.email,
        customer_phone=payload.customer_phone or current.phone,
    )
    _attach_display_names(ticket)
    return ticket


@router.post("/{ticket_id}/assign", response_model=TicketOut)
def assign(
    ticket_id: int,
    payload: TicketAssign,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    t = db.query(WarrantyTicket).filter(WarrantyTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Phiếu không tồn tại")
    tech = db.query(User).filter(User.id == payload.technician_id, User.role == "technician").first()
    if not tech:
        raise HTTPException(status_code=400, detail="Kỹ thuật viên không hợp lệ")
    return warranty_service.assign_technician(db, t, payload.technician_id, note=f"Phân công {tech.full_name}")


@router.post("/{ticket_id}/status", response_model=TicketOut)
def change_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(require_roles("admin", "staff", "technician"))],
):
    t = db.query(WarrantyTicket).filter(WarrantyTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Phiếu không tồn tại")
    # S5a fix: technician chỉ được sửa phiếu của mình (admin/staff OK)
    if current.role == "technician" and t.technician_id != current.id:
        raise HTTPException(
            status_code=403,
            detail="Bạn không được sửa phiếu của kỹ thuật viên khác",
        )
    try:
        # S5a fix: admin/staff sửa phiếu → technician_id=null lưu trong history
        #          technician sửa phiếu của mình → giữ current.id
        history_technician_id = current.id if current.role == "technician" else None
        return warranty_service.update_status(
            db, t, payload.new_status, payload.action_note,
            technician_id=history_technician_id, repair_cost=payload.repair_cost,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{ticket_id}/summarize")
def summarize(
    ticket_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    t = db.query(WarrantyTicket).filter(WarrantyTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Phiếu không tồn tại")
    # S5b fix: chỉ customer (của ticket), technician (được phân công), admin, staff mới xem được
    if current.role == "customer" and t.customer_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem tóm tắt phiếu này")
    if current.role == "technician" and t.technician_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không được tóm tắt phiếu của kỹ thuật viên khác")
    summary = warranty_service.summarize_for_technician(db, t)
    t.ai_summary = summary
    db.commit()
    return {"summary": summary}


@router.post("/{ticket_id}/pay")
def pay_ticket(
    ticket_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    t = db.query(WarrantyTicket).filter(WarrantyTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Phiếu không tồn tại")
    if current.role == "customer" and t.customer_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thanh toán phiếu này")
    if t.status not in ("REJECTED", "COMPLETED") or t.within_warranty == "YES":
        raise HTTPException(status_code=400, detail="Phiếu này không cần thanh toán")
    amount = Decimal(str(t.repair_cost or 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Phiếu không có chi phí sửa chữa")
    try:
        tx = pay(db, current.id, amount, tx_type="PAYMENT_WARRANTY_REJECTED", reference=t.ticket_code)
    except InsufficientBalanceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    t.payment_status = "PAID"
    db.commit()
    return {"ok": True, "balance_after": tx.balance_after, "transaction_id": tx.id}


@router.get("/stats/summary", response_model=StatsOut)
def stats(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    return warranty_service.get_stats(db)