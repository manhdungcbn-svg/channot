from sqlalchemy import Column, Date, Float, ForeignKey, Integer, Numeric, String, Text
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
    # Ngày khách mua — dùng làm mốc tính hạn bảo hành khi đăng ký từ storefront.
    purchase_date = Column(Date, nullable=True)
    # Phần 2.5 bổ sung: thông tin thương mại (giá + mô tả). Cả 2 đều optional,
    # không migrate dữ liệu cũ - sản phẩm seed sẽ được fill khi chạy script bổ sung.
    price = Column(Numeric(12, 2), nullable=True)
    description = Column(Text, nullable=True)

    # === Trường storefront (shop) — nullable để không phá dữ liệu cũ ===
    slug = Column(String, unique=True, index=True, nullable=True)  # định danh URL
    brand = Column(String, nullable=True)
    category_slug = Column(String, index=True, nullable=True)  # nhóm danh mục gốc
    original_price = Column(Numeric(12, 2), nullable=True)  # giá gốc (trước giảm)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True, default=0)
    sold = Column(Integer, nullable=True, default=0)
    image_url = Column(String, nullable=True)  # đường dẫn tương đối tới /static/shop/*.svg
    attributes = Column(Text, nullable=True)  # JSON string: ["4K QLED", "Dolby Vision"]
    stock = Column(Integer, nullable=True, default=0)
    status = Column(String, nullable=True, default="available")  # available|low_stock|out_of_stock
    badge_label = Column(String, nullable=True)
    badge_tone = Column(String, nullable=True)  # flash|danger|warning|success|info|brand|neutral
    installment_months = Column(Integer, nullable=True)  # số tháng trả góp (null = không hỗ trợ)
    specs = Column(Text, nullable=True)  # JSON string: {"Kích thước": "55 inch"}

    tickets = relationship("WarrantyTicket", back_populates="product", cascade="all, delete-orphan")
