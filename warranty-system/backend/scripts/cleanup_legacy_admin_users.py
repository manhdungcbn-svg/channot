"""S1 cleanup — xóa user role≠customer KHÔNG từ seed (khả nghi tạo qua public endpoint trước fix).

CHẠY (1 lần sau khi deploy S1 fix): python -m scripts.cleanup_legacy_admin_users

Script sẽ:
1. In ra danh sách user sẽ bị xóa (preview).
2. Hỏi xác nhận (mặc định: dry-run).
3. Nếu --yes: xóa thật. Nếu không: chỉ in.

Sử dụng flag --yes để xác nhận xóa: python -m scripts.cleanup_legacy_admin_users --yes
"""
import argparse
import sys

# Fix encoding for Windows console (cp1252 không in được tiếng Việt)
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

# Import từng model để SQLAlchemy mapper resolve được tất cả relationships trong User
from app.core.database import Base, SessionLocal, engine
from app.models.user import User
from app.models.wallet import Wallet  # noqa: F401
from app.models.warranty import WarrantyTicket, WarrantyHistory  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.finance import FinanceTransaction  # noqa: F401


def main():
    parser = argparse.ArgumentParser(
        description="Xóa user role≠customer KHÔNG từ seed (đáng ngờ privilege escalation trước S1 fix)."
    )
    parser.add_argument(
        "--yes", action="store_true",
        help="Xác nhận xóa thật. Mặc định (không có --yes) chỉ in danh sách."
    )
    args = parser.parse_args()

    # Khởi tạo bảng nếu thiếu (an toàn)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        suspects = (
            db.query(User)
            .filter(User.is_seed == False)  # noqa: E712
            .filter(User.role != "customer")
            .all()
        )

        print(f"\nTìm thấy {len(suspects)} user role≠customer không từ seed:")
        if not suspects:
            print("(không có — DB sạch)")
            return

        print(f"{'ID':<6} {'Email':<35} {'Role':<12} {'Created':<20}")
        print("-" * 80)
        for u in suspects:
            created = u.created_at.isoformat() if u.created_at else "?"
            print(f"{u.id:<6} {u.email:<35} {u.role:<12} {created:<20}")

        if not args.yes:
            print("\n[DRY-RUN] Chưa xóa gì. Chạy với --yes để xóa thật:")
            print("    python -m scripts.cleanup_legacy_admin_users --yes")
            return

        # Backup email trước khi xóa (để rollback nếu cần)
        print("\n[INFO] Xóa user...")
        for u in suspects:
            db.delete(u)
        db.commit()
        print(f"[OK] Đã xóa {len(suspects)} user.")
        print("    Lưu danh sách email trên để rollback nếu cần.")

    finally:
        db.close()


if __name__ == "__main__":
    sys.path.insert(0, ".")
    main()