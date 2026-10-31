from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.datetime_utils import utcnow


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="customer")  # admin | staff | technician | customer
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)  # URL to uploaded avatar image
    must_change_password = Column(Boolean, default=False, nullable=False)
    # S1 + cleanup script: True nếu user này tạo từ seed_data.py, False nếu tạo qua /register hoặc /auth/users.
    is_seed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    tickets_created = relationship("WarrantyTicket", back_populates="customer", foreign_keys="WarrantyTicket.customer_id")
    tickets_assigned = relationship("WarrantyTicket", back_populates="technician", foreign_keys="WarrantyTicket.technician_id")
    history_entries = relationship("WarrantyHistory", back_populates="technician")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", order_by="Notification.created_at.desc()")