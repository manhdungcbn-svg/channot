"""
Notification Service - Email, SMS, In-App Notifications
"""

from fastapi import APIRouter, BackgroundTasks, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging

router = APIRouter(prefix="/notifications", tags=["Notifications"])

logger = logging.getLogger(__name__)

# Mock notifications storage
NOTIFICATIONS = [
    {
        "id": 1,
        "user_id": 1,
        "type": "ticket",
        "title": "Phiếu #101 đã được xử lý",
        "message": "Phiếu bảo hành của bạn đã chuyển sang trạng thái Hoàn thành",
        "read": False,
        "created_at": "2026-10-17T10:00:00Z",
        "link": "/tickets/101"
    },
    {
        "id": 2,
        "user_id": 1,
        "type": "wallet",
        "title": "Nạp tiền thành công",
        "message": "Bạn đã nạp 500,000đ vào ví",
        "read": True,
        "created_at": "2026-10-16T15:30:00Z",
        "link": "/wallet"
    },
    {
        "id": 3,
        "user_id": 1,
        "type": "system",
        "title": "Cập nhật hệ thống",
        "message": "Hệ thống sẽ bảo trì vào 01:00 - 03:00 ngày 20/10/2026",
        "read": False,
        "created_at": "2026-10-17T09:00:00Z",
        "link": None
    },
]

# Email templates
EMAIL_TEMPLATES = {
    "ticket_created": {
        "subject": "Phiếu bảo hành #{ticket_id} đã được tạo",
        "body": """
        <h2>Xin chào {customer_name},</h2>
        <p>Phiếu bảo hành của bạn đã được tạo thành công.</p>
        <ul>
            <li><strong>Mã phiếu:</strong> #{ticket_id}</li>
            <li><strong>Sản phẩm:</strong> {product_name}</li>
            <li><strong>Serial:</strong> {serial_number}</li>
            <li><strong>Ngày tạo:</strong> {created_at}</li>
        </ul>
        <p>Chúng tôi sẽ thông báo cho bạn khi có cập nhật.</p>
        <p>Trân trọng,<br>BảoHành Pro</p>
        """
    },
    "ticket_updated": {
        "subject": "Cập nhật phiếu #{ticket_id} - Trạng thái: {new_status}",
        "body": """
        <h2>Xin chào {customer_name},</h2>
        <p>Phiếu bảo hành #{ticket_id} của bạn đã được cập nhật.</p>
        <ul>
            <li><strong>Trạng thái cũ:</strong> {old_status}</li>
            <li><strong>Trạng thái mới:</strong> {new_status}</li>
            <li><strong>Thời gian:</strong> {updated_at}</li>
        </ul>
        {notes}
        <p>Trân trọng,<br>BảoHành Pro</p>
        """
    },
    "ticket_completed": {
        "subject": "Phiếu #{ticket_id} đã hoàn thành",
        "body": """
        <h2>Xin chào {customer_name},</h2>
        <p>Rất vui thông báo phiếu bảo hành #{ticket_id} của bạn đã được xử lý xong.</p>
        <ul>
            <li><strong>Sản phẩm:</strong> {product_name}</li>
            <li><strong>Kết quả:</strong> {result}</li>
            <li><strong>Ngày hoàn thành:</strong> {completed_at}</li>
        </ul>
        {refund_info}
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        <p>Trân trọng,<br>BảoHành Pro</p>
        """
    },
}

# Schemas
class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str

class NotificationCreate(BaseModel):
    user_id: int
    type: str  # ticket, wallet, system, rma
    title: str
    message: str
    link: Optional[str] = None

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None

# Endpoints
@router.get("")
async def get_notifications(
    user_id: int = Query(1, description="User ID"),
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100)
):
    """Get user notifications"""
    notifications = [n for n in NOTIFICATIONS if n["user_id"] == user_id]
    
    if unread_only:
        notifications = [n for n in notifications if not n["read"]]
    
    unread_count = len([n for n in NOTIFICATIONS if n["user_id"] == user_id and not n["read"]])
    
    return {
        "notifications": notifications[:limit],
        "total": len(notifications),
        "unread_count": unread_count
    }

@router.get("/unread-count")
async def get_unread_count(user_id: int = Query(1)):
    """Get unread notification count"""
    count = len([n for n in NOTIFICATIONS if n["user_id"] == user_id and not n["read"]])
    return {"count": count}

@router.post("")
async def create_notification(data: NotificationCreate):
    """Create a new notification"""
    new_id = max([n["id"] for n in NOTIFICATIONS]) + 1 if NOTIFICATIONS else 1
    
    notification = {
        "id": new_id,
        "user_id": data.user_id,
        "type": data.type,
        "title": data.title,
        "message": data.message,
        "read": False,
        "created_at": datetime.now().isoformat(),
        "link": data.link
    }
    
    NOTIFICATIONS.insert(0, notification)
    
    return {
        "success": True,
        "notification": notification
    }

@router.put("/{notification_id}")
async def update_notification(notification_id: int, data: NotificationUpdate):
    """Update notification (mark as read)"""
    notification = next((n for n in NOTIFICATIONS if n["id"] == notification_id), None)
    if not notification:
        return {"success": False, "message": "Notification not found"}
    
    if data.read is not None:
        notification["read"] = data.read
    
    return {"success": True, "notification": notification}

@router.put("/read-all")
async def mark_all_as_read(user_id: int = Query(1)):
    """Mark all notifications as read"""
    for n in NOTIFICATIONS:
        if n["user_id"] == user_id:
            n["read"] = True
    return {"success": True, "message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: int):
    """Delete a notification"""
    global NOTIFICATIONS
    notification = next((n for n in NOTIFICATIONS if n["id"] == notification_id), None)
    if not notification:
        return {"success": False, "message": "Notification not found"}
    
    NOTIFICATIONS = [n for n in NOTIFICATIONS if n["id"] != notification_id]
    return {"success": True, "message": "Notification deleted"}

# Email sending (mock)
@router.post("/email/send")
async def send_email(request: EmailRequest, background_tasks: BackgroundTasks):
    """Send email notification (mock)"""
    logger.info(f"Sending email to {request.to}: {request.subject}")
    
    # In production, this would use SMTP, SendGrid, AWS SES, etc.
    return {
        "success": True,
        "message": f"Email sent to {request.to}",
        "message_id": f"msg_{int(datetime.now().timestamp())}"
    }

@router.post("/email/ticket-created")
async def notify_ticket_created(ticket_id: int, customer_email: str, customer_name: str):
    """Send email when ticket is created"""
    template = EMAIL_TEMPLATES["ticket_created"]
    
    body = template["body"].format(
        ticket_id=ticket_id,
        customer_name=customer_name,
        product_name="Sản phẩm",
        serial_number="SERIAL",
        created_at=datetime.now().strftime("%d/%m/%Y %H:%M")
    )
    
    return await send_email(EmailRequest(
        to=customer_email,
        subject=template["subject"].format(ticket_id=ticket_id),
        body=body
    ))

@router.post("/email/ticket-updated")
async def notify_ticket_updated(
    ticket_id: int,
    customer_email: str,
    customer_name: str,
    old_status: str,
    new_status: str,
    notes: Optional[str] = None
):
    """Send email when ticket status changes"""
    template = EMAIL_TEMPLATES["ticket_updated"]
    
    body = template["body"].format(
        ticket_id=ticket_id,
        customer_name=customer_name,
        old_status=old_status,
        new_status=new_status,
        updated_at=datetime.now().strftime("%d/%m/%Y %H:%M"),
        notes=f"<p><strong>Ghi chú:</strong> {notes}</p>" if notes else ""
    )
    
    return await send_email(EmailRequest(
        to=customer_email,
        subject=template["subject"].format(ticket_id=ticket_id, new_status=new_status),
        body=body
    ))

# SMS (mock)
@router.post("/sms/send")
async def send_sms(phone: str, message: str):
    """Send SMS notification (mock)"""
    logger.info(f"Sending SMS to {phone}: {message}")
    
    # In production, this would use VNPT, Viettel, Twilio, etc.
    return {
        "success": True,
        "message": f"SMS sent to {phone}",
        "sms_id": f"sms_{int(datetime.now().timestamp())}"
    }

# Templates
@router.get("/templates")
async def get_email_templates():
    """Get all email templates"""
    return {
        "templates": EMAIL_TEMPLATES
    }
