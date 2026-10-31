"""Shop Service — nghiệp vụ storefront (catalog, danh mục, flash sale, tra cứu bảo hành).

Nguyên tắc:
- Shape trả về phải khớp CHÍNH XÁC contract `DEMO-NOTES.md` mục 1.2 (`ShopProduct`).
- Giá luôn là số nguyên đồng (không phải string, không làm tròn lung lay).
- Tra cứu bảo hành KHÔNG lộ PII chủ sở hữu (tên/email/sđt/địa chỉ).
"""
import json
import re
import unicodedata
from calendar import monthrange
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func
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

# === Tìm kiếm không dấu + từ đồng nghĩa ===
# Khách hay gõ không dấu ("may lanh") hoặc dùng từ khác với tên danh mục
# ("điều hòa" thay vì "tủ lạnh & điều hòa"). Chuẩn hoá cả hai phía trước khi so.
CATEGORY_SEARCH_ALIASES: Dict[str, List[str]] = {
    "tivi": ["tivi"],
    "tv": ["tivi"],
    "am thanh": ["am-thanh", "tivi"],
    "loa": ["am-thanh"],
    "tai nghe": ["am-thanh"],
    "soundbar": ["am-thanh"],
    "may loc nuoc": ["may-loc-nuoc"],
    "loc nuoc": ["may-loc-nuoc"],
    "quat": ["thiet-bi-gia-dung"],
    "quat thap": ["thiet-bi-gia-dung"],
    "may hut bui": ["thiet-bi-gia-dung"],
    "hut bui": ["thiet-bi-gia-dung"],
    "robot": ["thiet-bi-gia-dung"],
    "dien gia dung": ["thiet-bi-gia-dung", "gia-dung-bep", "gia-dung-lai"],
    "do gia dung": ["thiet-bi-gia-dung", "gia-dung-bep", "gia-dung-lai"],
    "gia dung": ["thiet-bi-gia-dung", "gia-dung-bep", "gia-dung-lai"],
    "thiet bi gia dung": ["thiet-bi-gia-dung"],
    "may lanh": ["lam-lanh"],
    "dieu hoa": ["lam-lanh"],
    "tu lanh": ["lam-lanh"],
    "lanh": ["lam-lanh"],
    "may giat": ["gia-dung-lai"],
    "giat say": ["gia-dung-lai"],
    "bep": ["gia-dung-bep"],
    "nau an": ["gia-dung-bep"],
    "phu kien": ["phu-kien"],
    "den": ["phu-kien"],
    "sac du phong": ["phu-kien"],
    "pin": ["phu-kien"],
}

_TOKEN_SPLIT_RE = re.compile(r"[^a-z0-9]+")


def _strip_accents(text: str) -> str:
    """Bỏ dấu tiếng Việt, xử lý riêng đ/Đ (NFD không tách được)."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFD", text)
    without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return without_marks.replace("đ", "d").replace("Đ", "D")


def normalize_search_text(text: Optional[str]) -> str:
    """Chuẩn hoá text để so khớp: bỏ dấu, lowercase, gộp khoảng trắng."""
    return " ".join(_TOKEN_SPLIT_RE.split(_strip_accents(text or "").lower())).strip()


def _search_tokens(text: str) -> List[str]:
    """Tách token tìm kiếm, bỏ token quá ngắn gây nhiễu."""
    return [token for token in normalize_search_text(text).split() if len(token) >= 2]


def _alias_category_slugs(query_norm: str) -> List[str]:
    """Suy ra danh mục từ cụm từ đồng nghĩa (vd: "máy lạnh" → lam-lanh)."""
    slugs: List[str] = []
    if not query_norm:
        return slugs
    for phrase, mapped in CATEGORY_SEARCH_ALIASES.items():
        # Khớp theo cụm từ (tránh "lanh" khớp bừa trong "lạnh"... đã chuẩn hoá)
        if re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", query_norm):
            slugs.extend(mapped)
    # Giữ thứ tự, bỏ trùng
    return list(dict.fromkeys(slugs))


def _product_search_haystack(p: Product) -> str:
    """Gom các trường có thể tìm kiếm của sản phẩm thành 1 chuỗi đã chuẩn hoá."""
    parts = [
        p.name or "",
        p.brand or "",
        p.category or "",
        (p.category_slug or "").replace("-", " "),
        p.serial_number or "",
        " ".join(_parse_json_list(p.attributes)),
    ]
    return normalize_search_text(" ".join(parts))


def _score_direct_match(query_norm: str, p: Product) -> float:
    """Điểm khớp trực tiếp (0 = không khớp).

    Chỉ tính là khớp trực tiếp khi khớp NGUYÊN CỤM hoặc TOÀN BỘ token, tránh
    việc "máy lạnh" kéo về mọi sản phẩm có chữ "máy".
    """
    haystack = _product_search_haystack(p)
    if not query_norm or not haystack:
        return 0.0

    if query_norm in haystack:
        return 4.0 + (1.0 if haystack.startswith(query_norm) else 0.0)

    tokens = _search_tokens(query_norm)
    if not tokens or not all(token in haystack for token in tokens):
        return 0.0
    # Khớp đủ token: cụm càng nhiều từ càng đáng tin.
    return 3.0 + min(1.0, 0.25 * len(tokens))


def _score_partial_match(query_norm: str, p: Product) -> float:
    """Điểm khớp một phần — dùng trong phạm vi danh mục đồng nghĩa."""
    haystack = _product_search_haystack(p)
    tokens = _search_tokens(query_norm)
    if not haystack or not tokens:
        return 0.0
    name_norm = normalize_search_text(p.name)
    score = 0.0
    for index, token in enumerate(tokens):
        if token in haystack:
            score += (1.0 if index == 0 else 0.5) * (2.0 if token in name_norm else 1.0)
    return score


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
    """Lấy danh sách sản phẩm storefront + tổng số (không phân trang).

    Tìm kiếm `q` không phân biệt dấu ("may lanh" = "máy lạnh"), khớp theo
    từng token và mở rộng qua từ đồng nghĩa danh mục (xem
    `CATEGORY_SEARCH_ALIASES`). Catalog demo nhỏ nên chấm điểm liên quan
    trong Python; ở DB lớn có thể thay bằng full-text search.
    """
    query = db.query(Product).filter(Product.slug.isnot(None))

    if category_slug:
        query = query.filter(Product.category_slug == category_slug)

    query_norm = normalize_search_text(q)
    alias_slugs = _alias_category_slugs(query_norm)
    rows = query.all()

    if query_norm:
        scored: List[Tuple[float, Product]] = []
        for product in rows:
            score = _score_direct_match(query_norm, product)
            if score > 0:
                scored.append((score, product))

        if not scored and alias_slugs:
            # Không khớp trực tiếp → mở rộng theo danh mục đồng nghĩa, ưu tiên
            # sản phẩm khớp thêm token trong chính danh mục đó.
            for product in rows:
                if (product.category_slug or "") not in alias_slugs:
                    continue
                partial = _score_partial_match(query_norm, product)
                scored.append((1.0 + partial, product))

        if not scored:
            return [], 0

        scored.sort(key=lambda pair: pair[0], reverse=True)
        ordered = [product for _, product in scored]
        relevance_rank = {id(product): index for index, product in enumerate(ordered)}
    else:
        ordered = rows
        relevance_rank = {}

    def sort_key(product: Product):
        rank = relevance_rank.get(id(product), 0)
        price = _to_int(product.price) or 0
        if sort == "price-asc":
            return (0, price, rank, product.id)
        if sort == "price-desc":
            return (0, -price, rank, product.id)
        if sort == "rating":
            return (0, -(float(product.rating or 0)), -(_to_int(product.sold) or 0), rank)
        if sort == "newest":
            return (0, -(product.id or 0))
        # featured: khi tìm kiếm, độ liên quan quan trọng hơn lượng bán.
        if relevance_rank:
            return (0, rank)
        return (0, -(_to_int(product.sold) or 0), -(float(product.rating or 0)))

    ordered.sort(key=sort_key)

    total = len(ordered)
    limit = max(1, min(int(limit or 24), 100))
    offset = max(0, int(offset or 0))
    page = ordered[offset : offset + limit]
    return [to_shop_product(p) for p in page], total


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
            "serial": "",
            "product_name": None,
            "category": None,
            "within_warranty": "NO",
            "warranty_end_date": None,
            "warranty_months": 0,
            "image_url": None,
            "message": "Vui lòng nhập serial sản phẩm để tra cứu.",
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
            "image_url": None,
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
        "image_url": product.image_url,
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
