"""S3 fix — tạo bảng login_attempts. Idempotent (chạy nhiều lần không lỗi).

CHẠY (1 lần sau khi merge S3): python -m scripts.create_login_attempts_table

Bảng này được Base.metadata.create_all() tự động tạo khi reset DB
(seed_data.py / fresh_db fixture). Script này chỉ cần cho DB production
đang chạy mà không muốn reset toàn bộ schema.
"""
import sys

from sqlalchemy import inspect

from app.core.database import Base, engine

# Import model để SQLAlchemy đăng ký vào Base.metadata
from app.models.login_attempt import LoginAttempt  # noqa: F401


def main():
    inspector = inspect(engine)
    if inspector.has_table("login_attempts"):
        print("[SKIP] Bảng login_attempts đã tồn tại.")
        return

    print("[INFO] Tạo bảng login_attempts ...")
    Base.metadata.create_all(bind=engine, tables=[LoginAttempt.__table__])
    print("[OK] Đã tạo bảng login_attempts.")


if __name__ == "__main__":
    # Cho phép chạy khi script nằm trong subfolder scripts/
    sys.path.insert(0, ".")
    main()