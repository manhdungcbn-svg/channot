"""Nghiệp vụ đơn hàng — dùng chung cho storefront (5175) và khu vực quản lý bán hàng.

Trách nhiệm:
- Tính tiền đơn (subtotal / phí ship / giảm giá / tổng) — **luôn tính lại ở server**,
  không tin giá do client gửi lên.
- Sinh mã đơn dạng `ORD-YYYY-NNNN`.
- Khi đơn chuyển sang `SHIPPED` → sinh serial cho từng sản phẩm, ghi vào
  `products` (để khách kích hoạt bảo hành) và `order_items.serial_number`.
"""
import logging
import secrets
from datetime import date
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.shop import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.services.wallet_service import get_or_create_wallet

logger = logging.getLogger(__name__)

# Phí giao hàng: 30.000đ cho đơn dưới 500k, miễn phí từ 500k trở lên.
FREE_SHIPPING_THRESHOLD = Decimal("500000")
SHIPPING_FEE = Decimal("30000")


class ShopError(Exception):
    """Lỗi nghiệp vụ bán hàng — được chuyển thành HTTPException ở tầng endpoint."""


def _next_order_code(db: Session) -> str:
    """Sinh mã đơn kế tiếp: ORD-2026-0001, ORD-2026-0002, ..."""
    year = date.today().year
    prefix = f"ORD-{year}-"
    count = (
        db.query(func.count(Order.id)).filter(Order.order_code.like(f"{prefix}%")).scalar()
        or 0
    )
    # Thử tăng dần cho tới khi mã chưa tồn tại (an toàn khi có đơn bị xoá).
    for offset in range(1, count + 20):
        code = f"{prefix}{offset:04d}"
        if not db.query(Order.id).filter(Order.order_code == code).first():
            return code
    return f"{prefix}{count + 1:04d}"


def _resolve_product(db: Session, item) -> Product:
    """Tìm sản phẩm theo `product_id` hoặc `slug`.

    `product_id` từ client có thể là số (backend) hoặc chuỗi slug (khi storefront
    dùng dữ liệu mock) → thử `product_id` trước, không có thì fallback sang `slug`.
    """
    product = None
    if item.product_id:
        try:
            product = db.query(Product).filter(Product.id == int(item.product_id)).first()
        except (TypeError, ValueError):
            product = None
        if not product and item.slug:
            product = db.query(Product).filter(Product.slug == item.slug).first()

    if not product and item.slug:
        product = db.query(Product).filter(Product.slug == item.slug).first()

    if not product:
        raise ShopError("Không tìm thấy sản phẩm trong đơn hàng")
    return product


def calculate_totals(subtotal: Decimal, coupon_code: str | None = None) -> dict:
    """Tính phí ship + giảm giá + tổng.

    Mã giảm giá demo (fixed, không cần bảng riêng):
    - `WELCOME10` → giảm 10% (tối đa 200k)
    - `FREESHIP` → miễn phí ship
    - `SAVE50` → giảm 50k
    """
    subtotal = Decimal(str(subtotal or 0))
    discount = Decimal("0")
    shipping = SHIPPING_FEE

    if coupon_code:
        code = coupon_code.strip().upper()
        if code == "WELCOME10":
            discount = min(subtotal * Decimal("0.10"), Decimal("200000"))
        elif code == "FREESHIP":
            shipping = Decimal("0")
        elif code == "SAVE50":
            discount = min(Decimal("50000"), subtotal)
        # Mã không hợp lệ → bỏ qua, không chặn đặt hàng.

    if subtotal >= FREE_SHIPPING_THRESHOLD:
        shipping = Decimal("0")

    total = subtotal - discount + shipping
    if total < 0:
        total = Decimal("0")
    return {
        "subtotal": subtotal,
        "discount": discount,
        "shipping_fee": shipping,
        "total": total,
    }


def create_order(
    db: Session,
    user: User,
    payload,
    *,
    serial_prefix: str = "SN",
) -> Order:
    """Tạo đơn hàng mới. Giá luôn tính ở server từ bảng `products`."""
    if not payload.items:
        raise ShopError("Đơn hàng không có sản phẩm")

    lines = []
    subtotal = Decimal("0")

    for item in payload.items:
        product = _resolve_product(db, item)
        qty = int(item.quantity or 1)
        if qty < 1:
            raise ShopError("Số lượng không hợp lệ")
        unit_price = Decimal(str(product.price or 0))
        if unit_price <= 0:
            raise ShopError(f"Giá sản phẩm \"{product.name}\" chưa được cấu hình")
        subtotal += unit_price * qty
        lines.append((product, qty, unit_price))

    totals = calculate_totals(subtotal, payload.coupon_code)

    order = Order(
        order_code=_next_order_code(db),
        user_id=user.id,
        status="PENDING",
        subtotal=totals["subtotal"],
        shipping_fee=totals["shipping_fee"],
        discount=totals["discount"],
        total=totals["total"],
        payment_status="UNPAID",
        payment_method=payload.payment_method or "cod",
        receiver_name=payload.receiver_name,
        receiver_phone=payload.receiver_phone,
        shipping_address=payload.shipping_address,
        note=payload.note,
        coupon_code=(payload.coupon_code or "").strip().upper() or None,
    )
    db.add(order)
    db.flush()  # gán order.id

    for product, qty, unit_price in lines:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                name=product.name,
                slug=product.slug,
                image_url=product.image_url,
                unit_price=unit_price,
                quantity=qty,
            )
        )
        # Cộng dồn lượt bán.
        product.sold = (product.sold or 0) + qty

    db.commit()
    db.refresh(order)
    logger.info("Đơn hàng %s đã tạo (%d dòng)", order.order_code, len(lines))
    return order


def generate_serials(db: Session, order: Order, serial_prefix: str = "SN") -> int:
    """Sinh serial cho từng dòng đơn khi xuất kho — trả về số serial đã sinh.

    Serial dùng format `SN-<product_id>-<random 6>` để chắc chắn unique
    (bảng `products.serial_number` có UNIQUE).
    """
    generated = 0
    for item in order.items:
        if item.serial_number:
            continue
        if not item.product_id:
            continue
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue

        candidate = None
        for _ in range(10):
            code = f"{serial_prefix}-{product.id}-{secrets.token_hex(3)}"
            if not db.query(Product.id).filter(Product.serial_number == code).first():
                candidate = code
                break
        if not candidate:
            continue

        product.serial_number = candidate
        product.customer_id = user_id_of_order(db, order)
        product.purchase_date = date.today()
        product.warranty_months = product.warranty_months or 12
        item.serial_number = candidate
        generated += 1

    db.commit()
    return generated


def user_id_of_order(db: Session, order: Order) -> int:
    """Lấy user_id của đơn (helper nhỏ cho generate_serials)."""
    return order.user_id


def list_orders(
    db: Session,
    user: User,
    *,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list:
    """Danh sách đơn hàng — customer chỉ thấy đơn của mình."""
    query = db.query(Order)
    if user.role == "customer":
        query = query.filter(Order.user_id == user.id)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.id.desc()).offset(offset).limit(limit).all()


def ensure_customer_account_for_order(db: Session, order: Order) -> User | None:
    """Tự động đảm bảo khách hàng có tài khoản khi nhận hàng (DELIVERED).

    Yêu cầu đề bài:
    - Tài khoản mặc định đăng nhập bằng SĐT, mật khẩu ban đầu là SĐT.
    - Đặt cờ `must_change_password = True` để hệ thống prompt đổi mật khẩu
      sau lần đăng nhập đầu tiên (có nút X bỏ qua).
    """
    phone = (order.receiver_phone or "").strip()
    if not phone:
        return None

    # Chuẩn hoá số điện thoại
    clean_phone = "".join(ch for ch in phone if ch.isdigit())
    if clean_phone.startswith("84") and len(clean_phone) >= 10:
        clean_phone = "0" + clean_phone[2:]
    phone_to_use = clean_phone or phone

    # Kiểm tra xem đã có user với SĐT này chưa
    existing = db.query(User).filter(User.phone == phone_to_use).first()
    if not existing:
        # Kiểm tra xem user_id trên đơn hàng đã có số điện thoại chưa
        if order.user_id:
            order_user = db.query(User).filter(User.id == order.user_id).first()
            if order_user:
                if not order_user.phone:
                    order_user.phone = phone_to_use
                    db.commit()
                return order_user

        # Tạo user mới: email tự sinh theo SĐT, pass là SĐT, role customer
        synthetic_email = f"{phone_to_use}@customer.shop.vn"
        # Đảm bảo email không trùng
        if db.query(User).filter(User.email == synthetic_email).first():
            synthetic_email = f"{phone_to_use}_{secrets.token_hex(2)}@customer.shop.vn"

        new_user = User(
            email=synthetic_email,
            phone=phone_to_use,
            full_name=order.receiver_name or f"Khách hàng {phone_to_use}",
            role="customer",
            hashed_password=hash_password(phone_to_use),
            must_change_password=True,
            is_active=True,
        )
        db.add(new_user)
        db.flush()
        get_or_create_wallet(db, new_user.id)
        order.user_id = new_user.id
        db.commit()
        db.refresh(new_user)
        logger.info(
            "Tự tạo tài khoản khách hàng khi nhận hàng: phone=%s, user_id=%d",
            phone_to_use,
            new_user.id,
        )
        return new_user

    # Nếu đã có user thì gán đơn hàng vào user đó nếu chưa gán
    if not order.user_id:
        order.user_id = existing.id
        db.commit()
    return existing


def update_order_status(db: Session, order: Order, new_status: str) -> Order:
    """Cập nhật trạng thái đơn. Khi sang SHIPPED → tự sinh serial; khi DELIVERED → đảm bảo tài khoản."""
    allowed = {"PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"}
    if new_status not in allowed:
        raise ShopError(f"Trạng thái không hợp lệ: {new_status}")

    order.status = new_status
    if new_status in ("SHIPPED", "DELIVERED"):
        generate_serials(db, order)
    if new_status == "DELIVERED":
        # Tự động tạo/gán tài khoản theo SĐT và mật khẩu là SĐT
        ensure_customer_account_for_order(db, order)
    if new_status == "CANCELLED":
        # Trừ lại lượt bán và huỷ bảo hành (nếu đã kích hoạt) — chỉ trừ lượt bán.
        for item in order.items:
            if item.product_id:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.sold = max(0, (product.sold or 0) - item.quantity)
    db.commit()
    db.refresh(order)
    return order
