from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.datetime_utils import utcnow


# Workflow trạng thái
STATUSES = ["RECEIVED", "INSPECTION", "REPAIRING", "COMPLETED", "REJECTED"]
STATUS_FLOW = {
    "RECEIVED": ["INSPECTION", "REJECTED"],
    "INSPECTION": ["REPAIRING", "REJECTED"],
    "REPAIRING": ["COMPLETED", "REJECTED"],
    "COMPLETED": [],
    "REJECTED": [],
}


class WarrantyTicket(Base):
    __tablename__ = "warranty_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String, unique=True, index=True, nullable=False)  # WR-2026-001
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    issue_description = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="RECEIVED")

    # Ảnh khách gửi kèm khi tạo phiếu — JSON array đường dẫn /static/uploads/...
    attachments = Column(Text, nullable=True)

    # AI outputs
    ai_classification = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_progress_message = Column(Text, nullable=True)

    # Warranty check
    within_warranty = Column(String, nullable=True)  # YES | NO
    warranty_check_reason = Column(String, nullable=True)

    # Cost
    repair_cost = Column(Numeric(14, 2), nullable=True, default=0)
    payment_status = Column(String, nullable=False, default="UNPAID")  # UNPAID | PAID | WAIVED

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    product = relationship("Product", back_populates="tickets")
    customer = relationship("User", back_populates="tickets_created", foreign_keys=[customer_id])
    technician = relationship("User", back_populates="tickets_assigned", foreign_keys=[technician_id])
    history = relationship("WarrantyHistory", back_populates="ticket", cascade="all, delete-orphan", order_by="WarrantyHistory.id")


class WarrantyHistory(Base):
    __tablename__ = "warranty_history"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("warranty_tickets.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action_note = Column(Text, nullable=False)
    status_from = Column(String, nullable=True)
    status_to = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    ticket = relationship("WarrantyTicket", back_populates="history")
    technician = relationship("User", back_populates="history_entries")