"""Sinh ảnh SVG cho sản phẩm storefront — không cần thư viện ngoài.

Mỗi sản phẩm có 1 file `static/shop/<slug>.svg`:
- Nền gradient (màu suy ra từ hash slug → ảnh đồng đều giữa các lần seed).
- Icon đơn giản theo nhóm danh mục.
- Tên sản phẩm (text SVG, tự cắt gọn nếu quá dài).

Dùng chung cho `seed_data.py` (sinh file khi seed) và script bổ sung.
"""
import hashlib
import os
from typing import Dict, Optional

# Kích thước chuẩn của ảnh sản phẩm
SVG_WIDTH = 800
SVG_HEIGHT = 800

# Icon theo nhóm danh mục (đường dẫn SVG, vẽ trong khung 200x200, điểm neo 0,0)
CATEGORY_ICONS: Dict[str, str] = {
    "tivi": (
        '<rect x="10" y="30" width="180" height="110" rx="12" fill="none" stroke="{color}" stroke-width="10"/>'
        '<path d="M60 160 L100 185 L140 160" fill="none" stroke="{color}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    "may-loc-nuoc": (
        '<rect x="50" y="20" width="100" height="160" rx="18" fill="none" stroke="{color}" stroke-width="10"/>'
        '<path d="M70 60 L130 60 M70 95 L130 95" stroke="{color}" stroke-width="10" stroke-linecap="round"/>'
        '<circle cx="100" cy="140" r="16" fill="none" stroke="{color}" stroke-width="8"/>'
    ),
    "thiet-bi-gia-dung": (
        '<circle cx="100" cy="100" r="55" fill="none" stroke="{color}" stroke-width="10"/>'
        '<circle cx="100" cy="100" r="12" fill="{color}"/>'
        '<path d="M100 25 L100 45 M100 155 L100 175 M25 100 L45 100 M155 100 L175 100" stroke="{color}" stroke-width="10" stroke-linecap="round"/>'
    ),
    "lam-lanh": (
        '<rect x="35" y="20" width="130" height="160" rx="16" fill="none" stroke="{color}" stroke-width="10"/>'
        '<path d="M35 80 L165 80" stroke="{color}" stroke-width="10"/>'
        '<path d="M80 45 L120 45 M80 110 L120 110" stroke="{color}" stroke-width="8" stroke-linecap="round"/>'
    ),
    "am-thanh": (
        '<rect x="55" y="35" width="90" height="120" rx="16" fill="none" stroke="{color}" stroke-width="10"/>'
        '<circle cx="100" cy="80" r="22" fill="none" stroke="{color}" stroke-width="9"/>'
        '<circle cx="100" cy="130" r="12" fill="none" stroke="{color}" stroke-width="9"/>'
    ),
    "robot-vacuum": (
        '<circle cx="100" cy="115" r="60" fill="none" stroke="{color}" stroke-width="10"/>'
        '<circle cx="78" cy="105" r="9" fill="{color}"/><circle cx="122" cy="105" r="9" fill="{color}"/>'
        '<path d="M100 55 L100 30 M85 30 L115 30" stroke="{color}" stroke-width="9" stroke-linecap="round"/>'
    ),
    "gia-dung-bep": (
        '<rect x="30" y="30" width="140" height="120" rx="16" fill="none" stroke="{color}" stroke-width="10"/>'
        '<path d="M30 75 L170 75" stroke="{color}" stroke-width="9"/>'
        '<circle cx="70" cy="115" r="16" fill="none" stroke="{color}" stroke-width="8"/>'
        '<circle cx="130" cy="115" r="16" fill="none" stroke="{color}" stroke-width="8"/>'
    ),
    "phu-kien": (
        '<path d="M70 40 L130 40 L120 90 L120 165 L80 165 L80 90 Z" fill="none" stroke="{color}" stroke-width="10" stroke-linejoin="round"/>'
        '<path d="M85 25 L115 25" stroke="{color}" stroke-width="9" stroke-linecap="round"/>'
    ),
}

DEFAULT_ICON = (
    '<rect x="40" y="40" width="120" height="120" rx="16" fill="none" stroke="{color}" stroke-width="10"/>'
)

# Bảng màu nền gradient (cặp màu tương phản, dùng cho nền sáng)
PALETTES = [
    ("#EEF2FF", "#C7D2FE"),
    ("#F0FDF4", "#BBF7D0"),
    ("#FFF7ED", "#FED7AA"),
    ("#FDF4FF", "#F5D0FE"),
    ("#EFF6FF", "#BFDBFE"),
    ("#FEF2F2", "#FECACA"),
    ("#F0FDFA", "#99F6E4"),
    ("#FAF5FF", "#E9D5FF"),
]


def _hash_int(text: str) -> int:
    """Hash ổn định (không phụ thuộc PYTHONHASHSEED) → int."""
    return int(hashlib.sha1((text or "").encode("utf-8")).hexdigest()[:8], 16)


def _escape(text: str) -> str:
    """Escape ký tự đặc biệt cho XML."""
    return (
        (text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _shorten(text: str, max_len: int = 34) -> str:
    """Cắt tên sản phẩm cho vừa 2 dòng chữ trong SVG."""
    text = (text or "").strip()
    if len(text) <= max_len:
        return text
    cut = text[:max_len].rsplit(" ", 1)[0]
    return cut + "…"


def build_svg(name: str, category_slug: str, slug: Optional[str] = None) -> str:
    """Trả về nội dung SVG cho 1 sản phẩm."""
    slug = slug or name
    seed = _hash_int(slug)
    start, end = PALETTES[seed % len(PALETTES)]
    icon_color = "#4F46E5" if seed % 2 == 0 else "#0F766E"
    icon = CATEGORY_ICONS.get(category_slug or "", DEFAULT_ICON).format(color=icon_color)

    title = _shorten(name)
    subtitle = _shorten((category_slug or "").replace("-", " ").upper(), 28)

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{SVG_WIDTH}" height="{SVG_HEIGHT}" viewBox="0 0 800 800" role="img" aria-label="{_escape(name)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{start}"/>
      <stop offset="100%" stop-color="{end}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <g transform="translate(300,240) scale(1.0)">
    {icon}
  </g>
  <text x="400" y="600" text-anchor="middle" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="40" font-weight="700" fill="#1F2937">{_escape(title)}</text>
  <text x="400" y="652" text-anchor="middle" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="24" letter-spacing="3" fill="#6B7280">{_escape(subtitle)}</text>
</svg>
"""


def write_svg(static_dir: str, slug: str, name: str, category_slug: str) -> str:
    """Ghi file SVG dự phòng và trả về đường dẫn ảnh phù hợp.

    Nếu đã có ảnh JPG thật trong `static/shop/<slug>.jpg`, ưu tiên dùng JPG.
    Vẫn sinh SVG để làm fallback khi cần.
    """
    shop_dir = os.path.join(static_dir, "shop")
    os.makedirs(shop_dir, exist_ok=True)
    svg_path = os.path.join(shop_dir, f"{slug}.svg")
    with open(svg_path, "w", encoding="utf-8") as fh:
        fh.write(build_svg(name, category_slug, slug))

    jpg_path = os.path.join(shop_dir, f"{slug}.jpg")
    if os.path.exists(jpg_path) and os.path.getsize(jpg_path) > 0:
        return f"/static/shop/{slug}.jpg"
    return f"/static/shop/{slug}.svg"


def write_all(static_dir: str, products) -> int:
    """Sinh SVG cho danh sách sản phẩm. `products` là iterable dict/object có
    `slug`, `name`, `category_slug`."""
    count = 0
    for item in products:
        if isinstance(item, dict):
            slug = item.get("slug")
            name = item.get("name")
            cat = item.get("category_slug")
        else:
            slug = getattr(item, "slug", None)
            name = getattr(item, "name", None)
            cat = getattr(item, "category_slug", None)
        if not slug:
            continue
        write_svg(static_dir, slug, name or slug, cat or "")
        count += 1
    return count
