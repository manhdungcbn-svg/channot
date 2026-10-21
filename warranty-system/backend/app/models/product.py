from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    serial_number = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=False)  # e.g. Router, Camera, Switch
    warranty_months = Column(Integer, nullable=False, default=12)
    manufacture_date = Column(Date, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # chủ sở hữu
    # Phần 2.5 bổ sung: thông tin thương mại (giá + mô tả). Cả 2 đều optional,
    # không migrate dữ liệu cũ - sản phẩm seed sẽ được fill khi chạy script bổ sung.
    price = Column(Numeric(12, 2), nullable=True)
    description = Column(Text, nullable=True)

    tickets = relationship("WarrantyTicket", back_populates="product", cascade="all, delete-orphan")