"""Bridge service — nối storefront (web bán hàng) với hệ thống bảo hành.

Luồng nghiệp vụ:
    Khách mua hàng trên storefront → bấm "Đăng ký bảo hành" → nhập serial
    → `register_warranty()` gán sản phẩm về tài khoản của khách → sản phẩm
    xuất hiện ở "Sản phẩm của tôi" trong app bảo hành → khách tạo phiếu BH.

Nguyên tắc an toàn:
- Không bao giờ tự ý ghi đè `product.customer_id` của người khác.
- Không lộ PII của chủ sở hữu hiện tại khi sản phẩm đã thuộc về người khác.
"""
from calendar import monthrange
from datetime import date, timedelta
from typing import Any, Dict, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.user import User
from app.services import warranty_service


def _warranty_end_date(product: Product) -> Optional[date]:
    """Ngày hết hạn = ngày sản xuất + số tháng bảo hành."""
    if not product.manufacture_date or not product.warranty_months:
        return None
    start = product.manufacture_date
    # Tổng số tháng kể từ tháng 0 năm 0 để xử lý vượt biên năm.
    total_months = (start.year * 12 + start.month - 1) + product.warranty_months
    year, month_idx = divmod(total_months, 12)
    month = month_idx + 1
    # Ngày cuối của tháng đích (xử lý tháng 2, năm nhuận...).
    last_day = monthrange(year, month)[1]
    return date(year, month, min(start.day, last_day))


def register_warranty(
    db: Session,
    user: User,
    serial: str,
    purchase_date: Optional[date] = None,
) -> Tuple[bool, str, Optional[Product], bool]:
    """Đăng ký bảo hành cho khách theo serial.

    Returns:
        (registered, message, product, already_owned)
    """
    serial = (serial or "").strip()
    if not serial:
        return False, "Vui lòng nhập mã serial sản phẩm.", None, False

    product = db.query(Product).filter(Product.serial_number == serial).first()
    if not product:
        return (
            False,
            f"Không tìm thấy sản phẩm với serial `{serial}`. "
            "Vui lòng kiểm tra lại tem trên hộp sản phẩm.",
            None,
            False,
        )

    # Đã thuộc về chính khách này → không cần đăng ký lại.
    if product.customer_id == user.id:
        end = _warranty_end_date(product)
        return (
            False,
            "Sản phẩm này đã được đăng ký bảo hành trong tài khoản của bạn."
            + (f" Hạn bảo hành đến {end.strftime('%d/%m/%Y')}." if end else ""),
            product,
            True,
        )

    # Thuộc về người khác → KHÔNG lộ thông tin, chỉ báo đã được đăng ký.
    if product.customer_id:
        return (
            False,
            "Sản phẩm này đã được đăng ký bảo hành. "
            "Vui lòng liên hệ hotline 1900 6868 nếu bạn cần hỗ trợ.",
            None,
            False,
        )

    # Chưa có chủ sở hữu → gán cho khách hiện tại.
    product.customer_id = user.id

    # Ngày mua được khách cung cấp → dùng làm mốc tính hạn bảo hành.
    # Ngày sản xuất không được sau ngày mua.
    if purchase_date:
        if purchase_date > date.today():
            purchase_date = None
        else:
            product.manufacture_date = purchase_date
            if not product.purchase_date:
                product.purchase_date = purchase_date

    db.commit()
    db.refresh(product)

    end = _warranty_end_date(product)
    check = warranty_service.check_warranty(product)
    msg = "Đăng ký bảo hành thành công."
    if end:
        msg += f" Hạn bảo hành đến {end.strftime('%d/%m/%Y')}."
    if not check.within:
        msg += " Sản phẩm hiện đã hết hạn bảo hành nhưng vẫn có thể gửi sửa chữa."
    return True, msg, product, False


def list_owned_products(db: Session, user: User) -> Dict[str, Any]:
    """Danh sách sản phẩm của khách, kèm trạng thái bảo hành."""
    products = (
        db.query(Product)
        .filter(Product.customer_id == user.id)
        .order_by(Product.id.desc())
        .all()
    )
    items = []
    for p in products:
        check = warranty_service.check_warranty(p)
        end = _warranty_end_date(p)
        items.append(
            {
                "id": p.id,
                "name": p.name,
                "serial_number": p.serial_number,
                "category": p.category,
                "warranty_months": p.warranty_months,
                "manufacture_date": p.manufacture_date.isoformat() if p.manufacture_date else None,
                "purchase_date": p.purchase_date.isoformat() if p.purchase_date else None,
                "within_warranty": "YES" if check.within else "NO",
                "warranty_end_date": end.isoformat() if end else None,
                "warranty_reason": check.reason,
                "image_url": p.image_url,
                "price": float(p.price) if p.price is not None else None,
            }
        )
    return {"items": items, "total": len(items)}
