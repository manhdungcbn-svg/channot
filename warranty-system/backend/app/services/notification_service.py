"""Notification service — gửi thông báo đến user."""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification


NOTIF_TYPES = {
    "INFO": "INFO",
    "WARNING": "WARNING",
    "SUCCESS": "SUCCESS",
    "ERROR": "ERROR",
}


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str = "INFO",
    link: Optional[str] = None,
) -> Notification:
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        link=link,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def notify_ticket_created(db: Session, ticket_code: str, customer_name: str, staff_user_id: int):
    """Thông báo cho admin/staff khi có phiếu mới."""
    create_notification(
        db,
        user_id=staff_user_id,
        title="Phiếu bảo hành mới",
        message=f"Khách hàng {customer_name} vừa tạo phiếu {ticket_code}.",
        notif_type="INFO",
        link=f"/tickets",
    )


def notify_status_changed(
    db: Session,
    customer_id: int,
    ticket_code: str,
    new_status: str,
    action_note: str,
):
    """Thông báo cho khách hàng khi trạng thái phiếu thay đổi."""
    STATUS_LABELS = {
        "RECEIVED": "Đã tiếp nhận",
        "INSPECTION": "Đang kiểm tra",
        "REPAIRING": "Đang sửa chữa",
        "COMPLETED": "Đã hoàn tất",
        "REJECTED": "Từ chối bảo hành",
    }
    label = STATUS_LABELS.get(new_status, new_status)
    create_notification(
        db,
        user_id=customer_id,
        title=f"Phiếu {ticket_code} — {label}",
        message=action_note or f"Phiếu của bạn đã được cập nhật sang trạng thái: {label}.",
        notif_type="SUCCESS" if new_status in ("COMPLETED",) else "INFO",
        link=f"/tickets",
    )


def notify_assigned(db: Session, technician_id: int, ticket_code: str, product_name: str):
    """Thông báo cho kỹ thuật viên khi được phân công."""
    create_notification(
        db,
        user_id=technician_id,
        title=f"Phân công xử lý {ticket_code}",
        message=f"Bạn được phân công xử lý phiếu {ticket_code} — {product_name}.",
        notif_type="WARNING",
        link=f"/tickets",
    )
