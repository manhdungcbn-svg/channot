"""Bo sung seed demo — KHONG xoa du lieu hien co.

Chay: python seed_extra.py

Muc tieu them:
+ 3 customers (tong cong 5+ customers)
+ 6 products (tong cong 10+ products)
+ 6 warranty tickets (tong cong 8+ tickets)
+ 5 notifications (tong cong 5+ notifications)

Tinh idempotent: chay nhieu lan khong tao trung.
Loi~ cac product co san de phan cong ticket cho cac customer cu + moi.
"""
import sys
from datetime import date, timedelta
from decimal import Decimal

sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.notification import Notification
from app.models.product import Product
from app.models.user import User
from app.models.wallet import Wallet  # needed for User.wallet relationship
from app.models.warranty import WarrantyHistory, WarrantyTicket


def get_or_create_user(db, email, full_name, role, phone, password):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return existing
    u = User(
        email=email, full_name=full_name, role=role, phone=phone,
        hashed_password=hash_password(password), is_seed=True,
    )
    db.add(u)
    db.flush()
    return u


def get_or_create_product(db, serial, name, category, warranty_months, mfg, customer_id):
    existing = db.query(Product).filter(Product.serial_number == serial).first()
    if existing:
        return existing
    p = Product(
        name=name, serial_number=serial, category=category,
        warranty_months=warranty_months, manufacture_date=mfg,
        customer_id=customer_id,
    )
    db.add(p)
    db.flush()
    return p


def get_or_create_ticket(db, ticket_code, product_id, customer_id, technician_id,
                         issue, status, ai_class, within, cost, payment, ai_msg):
    existing = db.query(WarrantyTicket).filter(WarrantyTicket.ticket_code == ticket_code).first()
    if existing:
        return existing
    t = WarrantyTicket(
        ticket_code=ticket_code, product_id=product_id, customer_id=customer_id,
        technician_id=technician_id, issue_description=issue, status=status,
        ai_classification=ai_class, within_warranty=within, repair_cost=Decimal(str(cost)),
        payment_status=payment, ai_progress_message=ai_msg,
    )
    db.add(t)
    db.flush()
    return t


def get_or_create_notification(db, user_id, title, message, ntype, link):
    existing = db.query(Notification).filter(
        Notification.user_id == user_id, Notification.title == title
    ).first()
    if existing:
        return existing
    n = Notification(
        user_id=user_id, title=title, message=message, type=ntype,
        link=link, is_read=False,
    )
    db.add(n)
    return n


def main():
    db = SessionLocal()
    try:
        today = date.today()

        # === Them 3 customers (dat ten rieng de khong trung email cu) ===
        cust3 = get_or_create_user(db, "kh3@gmail.com", "Hoang Van Cuong", "customer", "0933333333", "Khach@123")
        cust4 = get_or_create_user(db, "kh4@gmail.com", "Vu Thi Dung", "customer", "0944444444", "Khach@123")
        cust5 = get_or_create_user(db, "kh5@gmail.com", "Do Van Em", "customer", "0955555555", "Khach@123")
        db.flush()

        # Lay customer cu (da co trong seed_data.py)
        cust1 = db.query(User).filter(User.email == "kh1@gmail.com").first()
        cust2 = db.query(User).filter(User.email == "kh2@gmail.com").first()

        # === Them 2 technicians de dat 4+ KTV (seed cu co 2) ===
        tech3 = get_or_create_user(db, "tech3@warranty.vn", "Le Van Phuc", "technician", "0966666666", "Tech@123")
        tech4 = get_or_create_user(db, "tech4@warranty.vn", "Pham Thi Hanh", "technician", "0977777777", "Tech@123")
        tech1 = db.query(User).filter(User.email == "tech1@warranty.vn").first()
        tech2 = db.query(User).filter(User.email == "tech2@warranty.vn").first()
        db.flush()

        # === Them 6 products (serial rieng de khong trung) ===
        p5 = get_or_create_product(db, "RWF-2026-0005", "Router WiFi 6 Pro", "Network",
                                   24, today - timedelta(days=45), cust3.id)
        p6 = get_or_create_product(db, "CAM-2026-0006", "Camera IP 8MP Pro", "Camera",
                                   18, today - timedelta(days=120), cust3.id)
        p7 = get_or_create_product(db, "SW-2026-0007", "Switch 16 cong Gigabit", "Network",
                                   36, today - timedelta(days=15), cust4.id)
        p8 = get_or_create_product(db, "MSH-2026-0008", "WiFi Mesh 3-pack", "Network",
                                   24, today - timedelta(days=5), cust4.id)
        p9 = get_or_create_product(db, "CAM-2026-0009", "Camera PTZ ngoai troi", "Camera",
                                   12, today - timedelta(days=300), cust5.id)
        p10 = get_or_create_product(db, "RWF-2026-0010", "Router WiFi 7", "Network",
                                    36, today - timedelta(days=8), cust5.id)
        db.flush()

        # Lay product cu
        p1 = db.query(Product).filter(Product.serial_number == "RWF-2026-0001").first()
        p2 = db.query(Product).filter(Product.serial_number == "CAM-2026-0001").first()
        p3 = db.query(Product).filter(Product.serial_number == "SW-2025-0001").first()
        p4 = db.query(Product).filter(Product.serial_number == "MSH-2026-0002").first()

        # === Them 6 warranty tickets (WR-2026-0003 den 0008) ===
        t3 = get_or_create_ticket(db, "WR-2026-0003", p5.id, cust3.id, tech1.id,
            "Router WiFi 6 Pro bi reboot lien tuc khi co nhieu thiet bi ket noi",
            "INSPECTION", "HARDWARE", "YES", 0, "UNPAID",
            "Phieu WR-2026-0003 dang kiem tra firmware va tan nhiet.")
        t4 = get_or_create_ticket(db, "WR-2026-0004", p6.id, cust3.id, tech2.id,
            "Camera IP 8MP Pro mat ket noi khi troi mua, hinh anh bi gian doan",
            "REPAIRING", "HARDWARE", "YES", 850000, "UNPAID",
            "Phieu WR-2026-0004 dang sua chan chong nuoc va cap nhat firmware.")
        t5 = get_or_create_ticket(db, "WR-2026-0005", p7.id, cust4.id, tech3.id,
            "Switch 16 cong khong nhan dien 4 cong SFP, chi hoat dong 12 cong",
            "RECEIVED", "HARDWARE", "YES", 0, "UNPAID",
            "Phieu WR-2026-0005 vua tiep nhan, cho ky thuat vien kiem tra.")
        t6 = get_or_create_ticket(db, "WR-2026-0006", p8.id, cust4.id, tech4.id,
            "WiFi Mesh mat node phu, chi con node chinh phat song",
            "INSPECTION", "HARDWARE", "YES", 0, "UNPAID",
            "Phieu WR-2026-0006 dang kiem tra cap nhat firmware va reset hardware.")
        t7 = get_or_create_ticket(db, "WR-2026-0007", p9.id, cust5.id, tech1.id,
            "Camera PTZ khong xoay duoc sang trai, chi xoay sang phai",
            "COMPLETED", "HARDWARE", "NO", 1200000, "WAIVED",
            "Phieu WR-2026-0007 hoan thanh, da thay the motor xoay.")
        t8 = get_or_create_ticket(db, "WR-2026-0008", p10.id, cust5.id, tech2.id,
            "Router WiFi 7 bi nong bat thuong, canh bao nhiet do lien tuc",
            "INSPECTION", "HARDWARE", "YES", 0, "UNPAID",
            "Phieu WR-2026-0008 dang kiem tra tan nhiet va thong gio.")
        db.flush()

        # === Them history cho cac ticket moi ===
        histories = [
            (t3, None, "Tiep nhan phieu. AI phan loai: HARDWARE.", None, "RECEIVED"),
            (t3, tech1.id, "Ky thuat vien Nguyen Van Ky tiep nhan, bat dau kiem tra.", "RECEIVED", "INSPECTION"),
            (t4, None, "Tiep nhan phieu. AI phan loai: HARDWARE.", None, "RECEIVED"),
            (t4, tech2.id, "Ky thuat vien Tran Thi Thuan tiep nhan, cho sua chan chong nuoc.", "RECEIVED", "INSPECTION"),
            (t4, tech2.id, "Bat dau sua chan, cho cap nhat firmware moi.", "INSPECTION", "REPAIRING"),
            (t5, None, "Tiep nhan phieu. AI phan loai: HARDWARE.", None, "RECEIVED"),
            (t6, None, "Tiep nhan phieu. AI phan loai: HARDWARE.", None, "RECEIVED"),
            (t6, tech4.id, "Ky thuat vien Pham Thi Hanh tiep nhan, dang kiem tra cap nhat.", "RECEIVED", "INSPECTION"),
            (t7, None, "Tiep nhan phieu. AI phan loai: HARDWARE.", None, "RECEIVED"),
            (t7, tech1.id, "Da thay the motor xoay, phieu hoan thanh.", "REPAIRING", "COMPLETED"),
        ]
        for t, tech_id, note, frm, to in histories:
            h = db.query(WarrantyHistory).filter(
                WarrantyHistory.ticket_id == t.id, WarrantyHistory.status_to == to
            ).first()
            if not h:
                db.add(WarrantyHistory(
                    ticket_id=t.id, technician_id=tech_id,
                    action_note=note, status_from=frm, status_to=to,
                ))

        # === Them 5 notifications (chia cho cac vai tro) ===
        admin_user = db.query(User).filter(User.email == "admin@warranty.vn").first()
        staff_user = db.query(User).filter(User.email == "staff@warranty.vn").first()

        notif_seeds = [
            (admin_user.id, "He thong", "Co 3 phieu bao hanh moi trong ngay hom nay.", "INFO", "/tickets"),
            (admin_user.id, "Canh bao", "Phieu WR-2026-0002 da bi tu choi bao hanh.", "WARNING", "/tickets/2"),
            (staff_user.id, "Phieu moi", "Phieu WR-2026-0005 vua tiep nhan tu khach hang.", "INFO", "/tickets/5"),
            (staff_user.id, "Thanh cong", "Phieu WR-2026-0007 da hoan thanh sua chua.", "SUCCESS", "/tickets/7"),
            (cust3.id, "Cap nhat phieu", "Phieu WR-2026-0003 dang duoc ky thuat vien kiem tra.", "INFO", "/my-tickets/3"),
        ]
        for uid, title, msg, ntype, link in notif_seeds:
            get_or_create_notification(db, uid, title, msg, ntype, link)

        db.commit()
        print("[OK] Seed bo sung thanh cong (idempotent).")
    except Exception as e:
        db.rollback()
        print(f"[ERR] Loi: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()