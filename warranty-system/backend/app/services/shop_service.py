"""Shop Service — nghiệp vụ storefront (catalog, danh mục, flash sale, tra cứu bảo hành).

Nguyên tắc:
- Shape trả về phải khớp CHÍNH XÁC contract `DEMO-NOTES.md` mục 1.2 (`ShopProduct`).
- Giá luôn là số nguyên đồng (không phải string, không làm tròn lung lay).
- Tra cứu bảo hành KHÔNG lộ PII chủ sở hữu (tên/email/sđt/địa chỉ).
"""
import json
from calendar import monthrange
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

# Import toàn bộ model để SQLAlchemy cấu hình đủ mapper (quan hệ User ↔ Wallet,
# Product ↔ WarrantyTicket...). Không cần thiết khi app đã import trong main.py,
# nhưng giúp service dùng độc lập (script seed / test) không bị lỗi mapper.
from app.models import finance as finance_model, notification as notification_model  # noqa: F401
from app.models import user as user_model, wallet as wallet_model, warranty as warranty_model  # noqa: F401
from app.models.product import Product
from app.services import warranty_service

# === Danh mục storefront ===
# slug -> (tên hiển thị, icon, tên file ảnh minh hoạ)
CATEGORY_META: Dict[str, Dict[str, Optional[str]]] = {
    "tivi": {"name": "Tivi & Âm thanh", "icon": "tv"},
    "may-loc-nuoc": {"name": "Máy lọc nước", "icon": "water"},
    "thiet-bi-gia-dung": {"name": "Thiết bị gia dụng", "icon": "fan"},
    "lam-lanh": {"name": "Tủ lạnh & Điều hòa", "icon": "snow"},
    "am-thanh": {"name": "Loa & Tai nghe", "icon": "speaker"},
    "gia-dung-bep": {"name": "Bếp & Đồ gia dụng", "icon": "kitchen"},
    "gia-dung-lai": {"name": "Máy giặt & Giặt sấy", "icon": "kitchen"},
    "phu-kien": {"name": "Phụ kiện & Đèn", "icon": "bulb"},
}

# Badge tone hợp lệ (contract mục 1.2)
VALID_BADGE_TONES = {"flash", "danger", "warning", "success", "info", "brand", "neutral"}

# Sắp xếp hợp lệ
VALID_SORTS = {"featured", "price-asc", "price-desc", "rating", "newest"}


def normalize_status(stock: Optional[int]) -> str:
    """Suy ra trạng thái kho từ số lượng tồn."""
    try:
        qty = int(stock or 0)
    except (TypeError, ValueError):
        qty = 0
    if qty > 5:
        return "available"
    if qty >= 1:
        return "low_stock"
    return "out_of_stock"


def _to_int(value: Any) -> Optional[int]:
    """Chuyển Decimal/float/str về int đồng (làm tròn xuống)."""
    if value is None:
        return None
    if isinstance(value, Decimal):
        return int(value.to_integral_value(rounding="ROUND_FLOOR"))
    if isinstance(value, (int, float)):
        return int(value)
    try:
        return int(Decimal(str(value)).to_integral_value(rounding="ROUND_FLOOR"))
    except Exception:
        return None


def _parse_json_list(raw: Optional[str]) -> List[str]:
    """Parse trường `attributes` (JSON string) → list[str]."""
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except (ValueError, TypeError):
        return []
    if isinstance(data, list):
        return [str(x) for x in data]
    if isinstance(data, dict):
        return [str(k) for k in data.keys()]
    return []


def _parse_json_dict(raw: Optional[str]) -> Dict[str, Any]:
    """Parse trường `specs` (JSON string) → dict."""
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except (ValueError, TypeError):
        return {}
    if isinstance(data, dict):
        return {str(k): v for k, v in data.items()}
    return {}


def _category_name(product: Product) -> str:
    """Tên danh mục hiển thị: ưu tiên tên đầy đủ của SP, fallback tên danh mục chuẩn."""
    if product.category:
        return product.category
    meta = CATEGORY_META.get(product.category_slug or "", {})
    return meta.get("name") or "Sản phẩm"


def to_shop_product(p: Product) -> Dict[str, Any]:
    """Chuyển model `Product` → dict theo shape `ShopProduct` (contract mục 1.2)."""
    price = _to_int(p.price) or 0
    original = _to_int(p.original_price) or 0

    # Chỉ có discount khi giá gốc > giá bán
    discount_percent = 0
    if original > price > 0:
        discount_percent = min(99, int(round((original - price) * 100 / original)))
    elif original == 0 and price > 0:
        discount_percent = 0

    stock = _to_int(p.stock) or 0
    status = p.status if p.status in ("available", "low_stock", "out_of_stock") else normalize_status(stock)
    # Nếu SP có status lưu sẵn nhưng stock thay đổi → ưu tiên suy ra từ stock cho khớp
    status = normalize_status(stock) if stock is not None else status

    installment_months = p.installment_months
    installment_monthly = None
    if installment_months and installment_months > 0 and price > 0:
        installment_monthly = price // 12

    # Badge
    badge = None
    if p.badge_label:
        badge = {
            "label": p.badge_label,
            "tone": p.badge_tone if p.badge_tone in VALID_BADGE_TONES else "neutral",
        }

    warranty_months = p.warranty_months or 0

    return {
        "id": p.id,
        "slug": p.slug,
        "name": p.name,
        "brand": p.brand,
        "category": _category_name(p),
        "category_slug": p.category_slug,
        "price": price,
        "original_price": original if original > 0 else price,
        "discount_percent": discount_percent,
        "rating": float(p.rating) if p.rating is not None else 0.0,
        "review_count": _to_int(p.review_count) or 0,
        "sold": _to_int(p.sold) or 0,
        "image_url": p.image_url,
        "attributes": _parse_json_list(p.attributes),
        "warranty_months": warranty_months,
        "warranty_label": f"Bảo hành {warranty_months} tháng" if warranty_months else "Bảo hành 0 tháng",
        "stock": stock,
        "status": status,
        "badge": badge,
        "installment_monthly": installment_monthly,
        "installment_months": installment_months,
        "owned": bool(p.customer_id),
        # Serial là thông tin công khai trên tem vỏ hộp — khách cần nó để
        # tự kích hoạt bảo hành. KHÔNG trả PII chủ sở hữu.
        "serial_number": p.serial_number or "",
        "description": p.description or "",
        "specs": _parse_json_dict(p.specs),
    }


def list_products(
    db: Session,
    category_slug: Optional[str] = None,
    q: Optional[str] = None,
    sort: str = "featured",
    limit: int = 24,
    offset: int = 0,
) -> Tuple[List[Dict[str, Any]], int]:
    """Lấy danh sách sản phẩm storefront + tổng số (không phân trang)."""
    query = db.query(Product).filter(Product.slug.isnot(None))

    if category_slug:
        query = query.filter(Product.category_slug == category_slug)

    if q and q.strip():
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(keyword),
                Product.brand.ilike(keyword),
                Product.category.ilike(keyword),
                Product.category_slug.ilike(keyword),
            )
        )

    total = query.count()

    if sort == "price-asc":
        query = query.order_by(Product.price.asc(), Product.id.asc())
    elif sort == "price-desc":
        query = query.order_by(Product.price.desc(), Product.id.asc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc(), Product.sold.desc())
    elif sort == "newest":
        query = query.order_by(Product.id.desc())
    else:  # featured: nổi bật + bán chạy
        query = query.order_by(Product.sold.desc(), Product.rating.desc())

    limit = max(1, min(int(limit or 24), 100))
    offset = max(0, int(offset or 0))
    rows = query.offset(offset).limit(limit).all()
    return [to_shop_product(p) for p in rows], total


def get_product_by_slug(db: Session, slug: str) -> Optional[Dict[str, Any]]:
    """Lấy 1 sản phẩm theo slug (None nếu không có)."""
    if not slug:
        return None
    p = db.query(Product).filter(Product.slug == slug).first()
    return to_shop_product(p) if p else None


def list_categories(db: Session) -> List[Dict[str, Any]]:
    """Danh sách nhóm danh mục kèm số lượng sản phẩm."""
    rows = (
        db.query(Product.category_slug, func.count(Product.id))
        .filter(Product.slug.isnot(None), Product.category_slug.isnot(None))
        .group_by(Product.category_slug)
        .all()
    )

    result = []
    for slug, count in rows:
        meta = CATEGORY_META.get(slug, {})
        result.append(
            {
                "slug": slug,
                "name": meta.get("name") or slug,
                "icon": meta.get("icon"),
                "count": int(count),
                "image_url": None,
            }
        )
    # Sắp xếp theo số SP giảm dần
    result.sort(key=lambda c: (-c["count"], c["slug"]))
    return result


def get_flash_sale(db: Session, limit: int = 8) -> Dict[str, Any]:
    """Flash sale: sản phẩm đang giảm giá, sắp theo số lượng đã bán."""
    rows = (
        db.query(Product)
        .filter(
            Product.slug.isnot(None),
            Product.original_price.isnot(None),
            Product.price.isnot(None),
            Product.original_price > Product.price,
        )
        .order_by(Product.sold.desc(), Product.id.asc())
        .limit(max(1, min(int(limit or 8), 50)))
        .all()
    )
    today = date.today()
    # Hết hạn flash sale = cuối ngày hôm nay theo múi giờ VN (+07:00) — contract mục 1.1
    ends_at = datetime.combine(today, time(23, 59, 59), tzinfo=timezone(timedelta(hours=7)))
    return {
        "ends_at": ends_at.isoformat(),
        "items": [to_shop_product(p) for p in rows],
    }


def lookup_warranty(db: Session, serial: Optional[str]) -> Dict[str, Any]:
    """Tra cứu bảo hành theo serial — KHÔNG trả PII chủ sở hữu.

    Luôn trả về dict (không raise) theo contract mục 1.1.
    """
    serial = (serial or "").strip()
    if not serial:
        return {
            "found": False,
            "serial": serial or None,
            "product_name": None,
            "category": None,
            "within_warranty": "NO",
            "warranty_end_date": None,
            "warranty_months": 0,
            "message": "Vui lòng nhập số serial sản phẩm để tra cứu bảo hành.",
        }

    product = db.query(Product).filter(Product.serial_number == serial).first()
    if not product:
        return {
            "found": False,
            "serial": serial,
            "product_name": None,
            "category": None,
            "within_warranty": "NO",
            "warranty_end_date": None,
            "warranty_months": 0,
            "message": (
                f"Không tìm thấy sản phẩm với serial `{serial}`. "
                "Vui lòng kiểm tra lại số serial trên nhãn dán sản phẩm."
            ),
        }

    check = warranty_service.check_warranty(product)
    end_date = _warranty_end_date(product)

    if check.within:
        message = f"Sản phẩm còn bảo hành đến {end_date.strftime('%d/%m/%Y')}." if end_date else check.reason
    else:
        message = (
            f"Sản phẩm đã hết thời hạn bảo hành"
            f"{f' từ {end_date.strftime('%d/%m/%Y')}' if end_date else ''}. "
            "Bạn vẫn có thể gửi sửa chữa, hệ thống sẽ báo giá trước khi tiến hành."
        )

    return {
        "found": True,
        "serial": product.serial_number,
        "product_name": product.name,
        "category": _category_name(product),
        "within_warranty": "YES" if check.within else "NO",
        "warranty_end_date": end_date.isoformat() if end_date else None,
        "warranty_months": product.warranty_months or 0,
        "message": message,
    }


def _warranty_end_date(product: Product) -> Optional[date]:
    """Tính ngày hết hạn bảo hành = ngày sản xuất + số tháng bảo hành."""
    if not product.manufacture_date or not product.warranty_months:
        return None
    start = product.manufacture_date
    total_months = (start.year * 12 + start.month - 1) + product.warranty_months
    year, month_idx = divmod(total_months, 12)
    month = month_idx + 1
    # Ngày cuối tháng đích (tháng 2, năm nhuận...).
    last_day = monthrange(year, month)[1]
    return date(year, month, min(start.day, last_day))


def search_products_for_chat(db: Session, message: str, limit: int = 4) -> List[Dict[str, Any]]:
    """Tìm sản phẩm phù hợp với câu hỏi chatbot (dùng để dựng context cho Gemini)."""
    from app.services.ai_service import _norm  # import cục bộ để tránh vòng lặp import

    text = _norm(message or "")
    tokens = [t for t in text.split() if len(t) > 1]

    # Từ khoá danh mục có trong câu
    category_slug = None
    for slug in CATEGORY_META:
        label = _norm(CATEGORY_META[slug]["name"] or "")
        if slug.replace("-", " ") in text or label in text:
            category_slug = slug
            break

    # Từ khoá sản phẩm (bỏ stop-word tiếng Việt)
    stop = {
        "tivi", "may", "gia", "dung", "ban", "mua", "chon", "nen", "co", "khong",
        "duoi", "tren", "trieu", "dong", "san", "pham", "hang", "gia", "re",
    }
    keywords = [t for t in tokens if t not in stop and len(t) > 2]

    results: List[Dict[str, Any]] = []
    seen = set()

    # 1) Khớp theo danh mục
    if category_slug:
        rows, _ = list_products(db, category_slug=category_slug, limit=limit * 2)
        for item in rows:
            if item["id"] not in seen:
                seen.add(item["id"])
                results.append(item)

    # 2) Khớp theo từ khoá tên/brand
    for kw in keywords:
        rows, _ = list_products(db, q=kw, limit=limit)
        for item in rows:
            if item["id"] not in seen:
                seen.add(item["id"])
                results.append(item)

    # 3) Không có gì khớp → lấy top bán chạy
    if not results:
        rows, _ = list_products(db, sort="featured", limit=limit)
        results = rows

    return results[:limit]
