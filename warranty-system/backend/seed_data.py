"""Seed dữ liệu mẫu — xóa sạch DB cũ và tạo mới.

CHẠY: python seed_data.py
"""
import os
import shutil
import sys
from datetime import date, timedelta
from decimal import Decimal

# Fix encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

from app.core.database import Base, SessionLocal, engine
from app.core.datetime_utils import utcnow
from app.core.security import hash_password
from app.models import notification  # Import notification first!
from app.models.finance import FinanceTransaction
from app.models.product import Product
from app.models.user import User
from app.models.wallet import Wallet
from app.models.warranty import WarrantyHistory, WarrantyTicket


def reset_db():
    # Xóa hoàn toàn database cũ
    if os.path.exists("warranty.db"):
        os.remove("warranty.db")
    if os.path.exists("warranty.db-journal"):
        os.remove("warranty.db-journal")
    # Tạo lại schema
    Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # Users — S1 cleanup: đánh dấu is_seed=True để script cleanup biết phân biệt
        admin = User(email="admin@warranty.vn", full_name="Quản trị viên", role="admin",
                     hashed_password=hash_password("Admin@123"), is_seed=True)
        staff = User(email="staff@warranty.vn", full_name="Lê Tiếp Nhận", role="staff",
                     phone="0900000001", hashed_password=hash_password("Staff@123"), is_seed=True)
        tech1 = User(email="tech1@warranty.vn", full_name="Nguyễn Văn Kỹ", role="technician",
                     phone="0900000002", hashed_password=hash_password("Tech@123"), is_seed=True)
        tech2 = User(email="tech2@warranty.vn", full_name="Trần Thị Thuận", role="technician",
                     phone="0900000003", hashed_password=hash_password("Tech@123"), is_seed=True)
        cust1 = User(email="kh1@gmail.com", full_name="Phạm Văn A", role="customer",
                     phone="0911111111", hashed_password=hash_password("Khach@123"), is_seed=True)
        cust2 = User(email="kh2@gmail.com", full_name="Lê Thị B", role="customer",
                     phone="0922222222", hashed_password=hash_password("Khach@123"), is_seed=True)
        # Demo customer account - manhdung
        manhdung = User(email="manhdung@gmail.com", full_name="Vũ Mạnh Dũng", role="customer",
                        phone="0827461460", hashed_password=hash_password("Manhdung@123"), is_seed=True)
        db.add_all([admin, staff, tech1, tech2, cust1, cust2, manhdung])
        db.flush()

        # Wallets for customers
        db.add_all([
            Wallet(user_id=cust1.id, balance=Decimal("500000")),
            Wallet(user_id=cust2.id, balance=Decimal("200000")),
        ])

        # Products
        today = date.today()
        products = [
            Product(name="Router WiFi 6", serial_number="RWF-2026-0001", category="Network",
                    warranty_months=24, manufacture_date=today - timedelta(days=30), customer_id=cust1.id),
            Product(name="Camera IP 4MP", serial_number="CAM-2026-0001", category="Camera",
                    warranty_months=12, manufacture_date=today - timedelta(days=200), customer_id=cust1.id),
            Product(name="Switch 8 cổng", serial_number="SW-2025-0001", category="Network",
                    warranty_months=24, manufacture_date=today - timedelta(days=600), customer_id=cust2.id),
            Product(name="Bộ phát WiFi Mesh", serial_number="MSH-2026-0002", category="Network",
                    warranty_months=36, manufacture_date=today - timedelta(days=10), customer_id=cust2.id),
        ]
        db.add_all(products)
        db.flush()

        # Sample tickets
        t1 = WarrantyTicket(
            ticket_code="WR-2026-0001",
            product_id=products[0].id,
            customer_id=cust1.id,
            technician_id=tech1.id,
            issue_description="Router không phát WiFi, đèn nguồn nhấp nháy liên tục",
            status="INSPECTION",
            ai_classification="HARDWARE",
            within_warranty="YES",
            warranty_check_reason="Còn bảo hành đến 2028-09",
            repair_cost=Decimal("0"),
            payment_status="UNPAID",
            ai_progress_message="Phiếu WR-2026-0001 đang được kỹ thuật viên kiểm tra.",
        )
        t2 = WarrantyTicket(
            ticket_code="WR-2026-0002",
            product_id=products[2].id,
            customer_id=cust2.id,
            technician_id=tech2.id,
            issue_description="Switch bị vào nước sau khi trần nhà dột, không lên nguồn",
            status="REJECTED",
            ai_classification="PHYSICAL",
            within_warranty="YES",
            warranty_check_reason="Còn bảo hành đến 2027-04",
            repair_cost=Decimal("350000"),
            payment_status="UNPAID",
            ai_progress_message="Phiếu WR-2026-0002 không được bảo hành theo chính sách.",
        )
        db.add_all([t1, t2])
        db.flush()

        db.add_all([
            WarrantyHistory(ticket_id=t1.id, technician_id=None,
                            action_note="Tiếp nhận phiếu. AI phân loại: HARDWARE.",
                            status_from=None, status_to="RECEIVED"),
            WarrantyHistory(ticket_id=t1.id, technician_id=tech1.id,
                            action_note="Kỹ thuật viên Nguyễn Văn Kỹ tiếp nhận, đang kiểm tra nguồn.",
                            status_from="RECEIVED", status_to="INSPECTION"),
            WarrantyHistory(ticket_id=t2.id, technician_id=None,
                            action_note="Tiếp nhận phiếu. AI phân loại: PHYSICAL.",
                            status_from=None, status_to="RECEIVED"),
            WarrantyHistory(ticket_id=t2.id, technician_id=tech2.id,
                            action_note="Vào nước do lỗi sử dụng — từ chối bảo hành theo chính sách.",
                            status_from="INSPECTION", status_to="REJECTED"),
        ])

        # Sổ tài chính CPO (màn Payment)
        now_iso = utcnow().isoformat()
        finance_rows = [
            ("TXN-001", "2026-09-29", "Thu phí sửa chữa - WR-2026-0002", Decimal("350000"), "credit", "Dịch vụ sửa chữa", "REF-2409-8821"),
            ("TXN-002", "2026-09-28", "Thanh toán linh kiện - Panel LCD", Decimal("3200000"), "debit", "Mua linh kiện", "REF-2409-7734"),
            ("TXN-003", "2026-09-25", "Thu phí dịch vụ - Bảo hành mở rộng", Decimal("1200000"), "credit", "Bảo hành mở rộng", "REF-2409-6612"),
            ("TXN-004", "2026-09-22", "Thanh toán nhà cung cấp - Parts", Decimal("1850000"), "debit", "Mua linh kiện", "REF-2409-5509"),
            ("TXN-005", "2026-09-20", "Hoàn tiền khách hàng", Decimal("500000"), "debit", "Hoàn tiền", "REF-2409-4421"),
            ("TXN-006", "2026-09-18", "Thu phí kiểm tra nhanh x5 đơn", Decimal("750000"), "credit", "Phí dịch vụ", "REF-2409-3318"),
            ("TXN-007", "2026-09-15", "Thanh toán lương kỹ thuật viên", Decimal("18000000"), "debit", "Lương", "REF-2409-2215"),
            ("TXN-008", "2026-09-12", "Thu phí bảo hành trong hạn", Decimal("0"), "credit", "Bảo hành", "REF-2409-1102"),
            ("TXN-009", "2026-09-10", "Mua vật tư tiêu hao", Decimal("2300000"), "debit", "Vật tư", "REF-2409-0091"),
            ("TXN-010", "2026-09-05", "Thu phí sửa chữa ngoài bảo hành x3", Decimal("6750000"), "credit", "Dịch vụ sửa chữa", "REF-2409-0055"),
            ("TXN-011", "2026-09-01", "Nạp vốn vận hành đầu kỳ", Decimal("50000000"), "credit", "Vốn vận hành", "REF-2409-0001"),
        ]
        db.add_all([
            FinanceTransaction(
                txn_code=code, date=d, description=desc, amount=amt,
                type=typ, category=cat, reference=ref, created_at=now_iso,
            )
            for code, d, desc, amt, typ, cat, ref in finance_rows
        ])

        db.commit()
        print("[OK] Seed data OK")
        print("   Admin:      admin@warranty.vn / Admin@123")
        print("   Staff:      staff@warranty.vn / Staff@123")
        print("   Technician: tech1@warranty.vn / Tech@123")
        print("   Customer:   kh1@gmail.com     / Khach@123")
    finally:
        db.close()


if __name__ == "__main__":
    reset_db()
    seed()