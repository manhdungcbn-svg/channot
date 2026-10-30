"""Migration nhẹ cho SQLite — thêm cột mới vào bảng đã tồn tại.

SQLite không có `ALTER TABLE ... ADD COLUMN` tự động qua SQLAlchemy `create_all()`:
`Base.metadata.create_all()` chỉ tạo bảng mới, bỏ qua bảng đã có. Vì vậy các
cột storefront mới của bảng `products` cần được thêm thủ công.

Cơ chế: đọc `PRAGMA table_info(<table>)` để biết cột nào đã tồn tại, sau đó
`ALTER TABLE <table> ADD COLUMN <col> <type>` cho từng cột còn thiếu. Hàm
**idempotent** — chạy nhiều lần vẫn an toàn.

Chỉ hỗ trợ SQLite (dự án demo dùng SQLite). Với database khác (PostgreSQL),
hàm sẽ no-op an toàn vì `create_all` đã xử lý schema đầy đủ.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

# Danh sách cột mới của bảng `products` (định dạng SQL kiểu SQLite).
# Phải khớp với `app/models/product.py`.
PRODUCT_SHOP_COLUMNS = [
    ("slug", "VARCHAR"),
    ("brand", "VARCHAR"),
    ("category_slug", "VARCHAR"),
    ("original_price", "NUMERIC(12, 2)"),
    ("rating", "FLOAT"),
    ("review_count", "INTEGER"),
    ("sold", "INTEGER"),
    ("image_url", "VARCHAR"),
    ("attributes", "TEXT"),
    ("stock", "INTEGER"),
    ("status", "VARCHAR"),
    ("badge_label", "VARCHAR"),
    ("badge_tone", "VARCHAR"),
    ("installment_months", "INTEGER"),
    ("specs", "TEXT"),
    ("purchase_date", "DATE"),
]

# Index cần tạo sau khi cột đã tồn tại (SQLite không cho UNIQUE trong ADD COLUMN).
PRODUCT_SHOP_INDEXES = [
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_products_slug ON products (slug)",
    "CREATE INDEX IF NOT EXISTS ix_products_category_slug ON products (category_slug)",
]


def _existing_columns(conn, table: str) -> set:
    """Lấy tập tên cột hiện có của bảng (rỗng nếu bảng không tồn tại)."""
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def ensure_columns(engine: Engine) -> None:
    """Đảm bảo các cột shop của bảng `products` tồn tại trong DB đã có.

    An toàn để gọi ở `on_startup` — không ném exception, chỉ log cảnh báo.
    """
    if engine.dialect.name != "sqlite":
        # create_all đã đủ với các DB khác (PostgreSQL/MySQL).
        return

    with engine.begin() as conn:
        existing = _existing_columns(conn, "products")
        if not existing:
            # Bảng chưa tồn tại → create_all sẽ tạo đầy đủ, không cần migrate.
            return

        for name, sql_type in PRODUCT_SHOP_COLUMNS:
            if name in existing:
                continue
            try:
                conn.execute(text(f"ALTER TABLE products ADD COLUMN {name} {sql_type}"))
                logger.info("Migration: đã thêm cột products.%s", name)
            except Exception as exc:  # pragma: no cover - phụ thuộc trạng thái DB
                logger.warning("Migration: không thêm được cột products.%s (%s)", name, exc)

        for ddl in PRODUCT_SHOP_INDEXES:
            try:
                conn.execute(text(ddl))
            except Exception as exc:  # pragma: no cover
                logger.warning("Migration: không tạo được index (%s): %s", ddl, exc)


def table_exists(engine: Engine, table: str) -> bool:
    """Kiểm tra bảng có tồn tại không (dùng cho log/test)."""
    try:
        return table in inspect(engine).get_table_names()
    except Exception:  # pragma: no cover
        return False
