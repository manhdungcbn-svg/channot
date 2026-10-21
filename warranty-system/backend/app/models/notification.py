from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.datetime_utils import utcnow


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="INFO")  # INFO | WARNING | SUCCESS | ERROR
    is_read = Column(Boolean, nullable=False, default=False)
    link = Column(String(255), nullable=True)  # e.g. /tickets/1
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="notifications")
