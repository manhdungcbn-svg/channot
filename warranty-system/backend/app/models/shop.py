"""Model cho mảng bán hàng: đơn hàng, địa chỉ giao hàng, đánh giá sản phẩm.

Tách khỏi `warranty.py` vì đây là nghiệp vụ **bán hàng**, không phải bảo hành.
Cùng DB, cùng backend FastAPI → storefront (5175) và app bảo hành (5174) dùng chung.

Quy ước:
- `orders` — mỗi đơn 1 chủ sở hữu (`user_id`) + nhiều dòng (`order_items`).
- Khi đơn chuyển sang trạng thái "đã xuất kho" (SHIPPED) → hệ thống **sinh serial**
  cho từng sản phẩm trong đơn, để khách kích hoạt bảo hành ngay trên storefront.
- `reviews` — mỗi khách đánh giá 1 sản phẩm tối đa 1 lần.
- `addresses` — sổ địa chỉ giao hàng của khách.
"""
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.datetime_utils import utcnow


class Order(Base):
    """Đơn hàng của khách mua ở storefront."""

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String, unique=True, index=True, nullable=False)  # ORD-2026-0001
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Trạng thái: PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
    status = Column(String, nullable=False, default="PENDING", index=True)

    # Tiền
    subtotal = Column(Numeric(14, 2), nullable=False, default=0)
    shipping_fee = Column(Numeric(14, 2), nullable=False, default=0)
    discount = Column(Numeric(14, 2), nullable=False, default=0)
    total = Column(Numeric(14, 2), nullable=False, default=0)

    # Thanh toán: UNPAID | PAID | REFUNDED
    payment_status = Column(String, nullable=False, default="UNPAID")
    payment_method = Column(String, nullable=True)  # cod | momo | zalo_pay | card

    # Giao hàng
    receiver_name = Column(String, nullable=False)
    receiver_phone = Column(String, nullable=True)
    shipping_address = Column(String, nullable=False)
    note = Column(Text, nullable=True)

    # Mã giảm giá đã dùng (nếu có)
    coupon_code = Column(String, nullable=True)

    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.id",
    )


class OrderItem(Base):
    """Dòng chi tiết của đơn hàng."""

    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    # Snapshot tại thời điểm đặt hàng (giá/số lượng có thể đổi sau đó).
    name = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    serial_number = Column(String, nullable=True)  # serial sinh khi xuất kho
    image_url = Column(String, nullable=True)
    unit_price = Column(Numeric(14, 2), nullable=False, default=0)
    quantity = Column(Integer, nullable=False, default=1)

    order = relationship("Order", back_populates="items")


class ShippingAddress(Base):
    """Sổ địa chỉ giao hàng của khách."""

    __tablename__ = "shipping_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    label = Column(String, nullable=True)  # "Nhà", "Văn phòng"
    receiver_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    is_default = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, default=utcnow)


class Review(Base):
    """Đánh giá sản phẩm — mỗi khách 1 đánh giá / sản phẩm."""

    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("product_id", "user_id", name="uq_review_product_user"),)

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    rating = Column(Integer, nullable=False, default=5)  # 1..5
    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    # Trạng thái kiểm duyệt: PENDING | APPROVED | REJECTED
    status = Column(String, nullable=False, default="APPROVED", index=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
