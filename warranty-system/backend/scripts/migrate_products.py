"""
Migration bổ sung 2 cột `price` (Numeric) + `description` (Text) vào bảng products.
- Không xóa dữ liệu cũ.
- Idempotent: bỏ qua nếu cột đã tồn tại.
- Không dùng DROP TABLE / DELETE.

Chạy bằng: python -m scripts.migrate_products
"""

from sqlalchemy import text

from app.core.database import SessionLocal, engine


def column_exists(db, table: str, column: str) -> bool:
    rows = db.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return any(r[1] == column for r in rows)


def main():
    db = SessionLocal()
    try:
        added = []
        if not column_exists(db, "products", "price"):
            db.execute(text("ALTER TABLE products ADD COLUMN price NUMERIC(12,2)"))
            added.append("price")
        if not column_exists(db, "products", "description"):
            db.execute(text("ALTER TABLE products ADD COLUMN description TEXT"))
            added.append("description")
        db.commit()
        if added:
            print(f"[OK] Added columns: {', '.join(added)}")
        else:
            print("[OK] Columns price/description already exist - no action.")
    finally:
        db.close()
        engine.dispose()


if __name__ == "__main__":
    main()