"""Seed dữ liệu demo — xóa sạch DB cũ và tạo mới (idempotent).

CHẠY: python seed_data.py   (từ thư mục `backend`)

Nội dung demo:
- 8 user: admin/staff/tech1/tech2/kh1/kh2/manhdung + demo@shop.vn
- 16 sản phẩm catalog storefront (5 sản phẩm đã được khách hàng mua → `owned=True`)
- 8 phiếu bảo hành trải đủ 7 trạng thái
- Sổ tài chính + thông báo
- Sinh file SVG ảnh sản phẩm vào `static/shop/`
"""
import json
import os
import sys
from datetime import date, timedelta
from decimal import Decimal

# Fix encoding for Windows console
sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import Base, SessionLocal, engine
from app.core.datetime_utils import utcnow
from app.core.security import hash_password
from app.models import notification  # Import notification first!
from app.models.finance import FinanceTransaction
from app.models.notification import Notification
from app.models.product import Product
from app.models.user import User
from app.models.wallet import Wallet
from app.models.warranty import WarrantyHistory, WarrantyTicket
from app.services.shop_assets import write_svg

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# === Catalog storefront: ĐÚNG 16 sản phẩm ===
# (slug, name, brand, category, category_slug, price, original_price,
#  rating, review_count, sold, stock, badge_label, badge_tone, attrs, specs,
#  warranty_months, owned)
# `owned` = (serial, email_chủ_sở_hữu, số ngày trước ngày sản xuất) nếu SP đã
#            được khách hàng mua; None nếu chỉ là sản phẩm trong catalog.
CATALOG = [
    (
        "tivi-qled-4k-55-inch", "Tivi QLED 4K 55 inch Smart TV chính hàng", "Samsung",
        "Tivi & Âm thanh", "tivi", 12990000, 15490000, 4.7, 128, 2340, 12,
        "Giảm 16%", "flash",
        ["4K QLED", "Dolby Vision", "Smart TV"],
        {"Kích thước": "55 inch", "Độ phân giải": "3840x2160", "Tần số quét": "120Hz", "HDR": "HDR10+"},
        24, ("TND-AC10-001", "demo@shop.vn", 60),
    ),
    (
        "tivi-led-4k-50-inch", "Tivi LED 4K 50 inch Crystal UHD", "LG",
        "Tivi & Âm thanh", "tivi", 8990000, 10500000, 4.5, 86, 1520, 24,
        "Giảm 14%", "flash",
        ["4K UHD", "Crystal UHD", "HDR10"],
        {"Kích thước": "50 inch", "Độ phân giải": "3840x2160", "Tần số quét": "60Hz", "Cổng HDMI": "4 cổng"},
        24, None,
    ),
    (
        "may-loc-nuoc-ro-kang", "Máy lọc nước RO trong nhà 2 lõi 120L", "Karofi",
        "Máy lọc nước", "may-loc-nuoc", 8790000, 9990000, 4.6, 213, 1890, 18,
        "Giảm 12%", "flash",
        ["RO 2 lõi", "120L/ngày", "Tự động báo thay lõi"],
        {"Công suất lọc": "120 L/ngày", "Số lõi": "2", "Nguồn nước": "Nước máy", "Bộ nhớ": "4GB"},
        24, ("TND-MLN02-001", "demo@shop.vn", 40),
    ),
    (
        "quat-thap-quay-stand", "Quạt tháp quay điều khiển từ xa 60W", "Sunhouse",
        "Thiết bị gia dụng", "thiet-bi-gia-dung", 2290000, 2890000, 4.4, 178, 1430, 26,
        "Giảm 21%", "flash",
        ["60W", "Điều khiển từ xa", "3 tốc độ", "6 mức gió"],
        {"Công suất": "60W", "Đường kính quạt": "40cm", "Tốc độ": "3", "Pin": "Không dùng pin"},
        12, ("TND-FAN03-001", "demo@shop.vn", 400),
    ),
    (
        "tu-lanh-inverter-300l", "Tủ lạnh Inverter 300 lít No Frost", "Samsung",
        "Tủ lạnh & Điều hòa", "lam-lanh", 13990000, 16990000, 4.7, 142, 980, 9,
        "Giảm 17%", "flash",
        ["Inverter", "300L", "No Frost", "Lọc khí than"],
        {"Dung tích": "300 lít", "Tủ lạnh": "220 lít", "Tủ đông": "80 lít", "Tiết kiệm điện": "Cấp 1A"},
        24, ("TND-WMS04-001", "kh1@gmail.com", 90),
    ),
    (
        "loa-soundbar-ham-2-1ch", "Loa Soundbar 2.1ch 320W Dolby Atmos", "Sony",
        "Loa & Tai nghe", "am-thanh", 7490000, 8990000, 4.6, 61, 430, 14,
        "Giảm 17%", "flash",
        ["2.1 kênh", "320W", "Dolby Atmos", "Bluetooth 5.2"],
        {"Công suất": "320W", "Kênh": "2.1", "Kết nối": "HDMI eARC / Bluetooth", "Số loa": "3"},
        24, None,
    ),
    (
        "tai-nghe-chup-tai-khong-day", "Tai nghe chụp tai không dây ANC 500XM", "Sony",
        "Loa & Tai nghe", "am-thanh", 3990000, 4990000, 4.8, 234, 3210, 40,
        "Bán chạy #1", "success",
        ["ANC chủ động", "40 giờ", "Bluetooth 5.3", "Quick Charge"],
        {"Thời lượng pin": "40 giờ", "Sạc nhanh": "3 phút = 3 giờ", "Trọng lượng": "250g", "Kết nối": "Bluetooth 5.3"},
        12, None,
    ),
    (
        "may-lanh-inverter-2hp", "Điều hòa Inverter 2HP 12000 BTU", "Daikin",
        "Tủ lạnh & Điều hòa", "lam-lanh", 17990000, 20500000, 4.7, 156, 1120, 11,
        "Giảm 12%", "flash",
        ["Inverter", "2HP", "12000 BTU", "Làm lạnh nhanh"],
        {"Công suất": "12000 BTU", "Diện tích": "15-20 m²", "Tiết kiệm điện": "Cấp 1A", "Độ ồn": "19 dB"},
        24, ("TND-AC10-002", "demo@shop.vn", 30),
    ),
    (
        "robot-hut-bui-roborock-s8", "Robot hút bụi thông minh Roborock S8", "Roborock",
        "Thiết bị gia dụng", "thiet-bi-gia-dung", 14990000, 18990000, 4.8, 92, 760, 7,
        "Giảm 20%", "flash",
        ["Lidar", "Tự đổ rác", "Lau nhà tự động", "Điều khiển qua app"],
        {"Lực hút": "6000Pa", "Dung tích bụi": "400ml", "Dung tích nước": "270ml", "Thời lượng": "180 phút"},
        24, None,
    ),
    (
        "noi-chien-khong-dau-5l", "Nồi chiên không dầu 5.5L điện tử", "Midea",
        "Bếp & Đồ gia dụng", "gia-dung-bep", 1290000, 1690000, 4.5, 312, 2870, 45,
        "Bán chạy #2", "success",
        ["5.5L", "Điện tử", "8 chế độ nấu", "Chống dính"],
        {"Dung tích": "5.5 lít", "Công suất": "1500W", "Chế độ nấu": "8", "Chất liệu": "Nhựa ABS / Inox"},
        12, None,
    ),
    (
        "bep-tu-induction-3-vung", "Bếp từ hồng ngoại 3 vùng 7200W", "Midea",
        "Bếp & Đồ gia dụng", "gia-dung-bep", 5490000, 6990000, 4.4, 88, 520, 16,
        "Giảm 21%", "flash",
        ["3 vùng nấu", "7200W", "Hồng ngoại", "Tự nhận diện nồi"],
        {"Công suất": "7200W", "Số vùng": "3", "Chất liệu mặt kính": "Kính ceramic", "Điều khiển": "Cảm ứng"},
        24, None,
    ),
    (
        "am-sieu-toc-bo-1-7l", "Ấm siêu tốc inox 1.7L đun sôi 5 phút", "Philips",
        "Bếp & Đồ gia dụng", "gia-dung-bep", 890000, 1150000, 4.6, 401, 4120, 60,
        "Flash sale", "flash",
        ["1.7L", "Inox 316", "Tự tắt khi sôi", "Giữ ấm 60 phút"],
        {"Dung tích": "1.7 lít", "Công suất": "2200W", "Chất liệu": "Inox 316", "Thời gian đun sôi": "5 phút"},
        12, None,
    ),
    (
        "den-thong-minh-16m-led", "Đèn thông minh LED 16 triệu màu R9", "Yeelight",
        "Phụ kiện & Đèn", "phu-kien", 549000, 699000, 4.3, 128, 980, 80,
        "Flash sale", "flash",
        ["16 triệu màu", "Điều khiển app", "Hẹn giờ", "Hỗ trợ Alexa"],
        {"Công suất": "9W", "Kết nối": "Wi-Fi 2.4GHz", "Tuổi thọ": "25.000 giờ", "Ứng dụng": "Yeelight / Smart Life"},
        24, None,
    ),
    (
        "sac-du-phong-20000mah", "Sạc dự phòng 20000mAh sạc nhanh 65W", "Anker",
        "Phụ kiện & Đèn", "phu-kien", 1290000, 1590000, 4.7, 265, 1960, 33,
        "Giảm 19%", "flash",
        ["20000mAh", "PD 65W", "Sạc 3 thiết bị", "Màn hình LED"],
        {"Dung lượng": "20000 mAh", "Cổng": "2 USB-C + 1 USB-A", "Công suất": "65W", "Sạc nhanh": "2.5 giờ"},
        18, None,
    ),
    (
        "may-hut-bui-cam-tay-20k", "Máy hút bụi cầm tay 20.000Pa không dây", "Dyson",
        "Thiết bị gia dụng", "thiet-bi-gia-dung", 9490000, 11400000, 4.7, 143, 1680, 10,
        "Giảm 16%", "flash",
        ["20.000Pa", "Không dây", "60 phút", "5 đầu hút"],
        {"Lực hút": "20.000Pa", "Thời lượng": "60 phút", "Dung tích bụi": "0.76L", "Trọng lượng": "2.3kg"},
        24, None,
    ),
    (
        "may-giat-inverter-10kg", "Máy giặt Inverter 10kg cửa trước", "LG",
        "Máy giặt & Giặt sấy", "gia-dung-lai", 12990000, 15500000, 4.6, 189, 1340, 8,
        "Giảm 16%", "flash",
        ["Inverter", "10kg", "Steam", "Tiết kiệm 30% điện"],
        {"Tải giặt": "10 kg", "Tốc độ xoay": "1400 vòng/phút", "Lõi giặt": "Hình trụ + AI DD", "Tiết kiệm điện": "30%"},
        24, None,
    ),
]

# === 8 phiếu bảo hành — đủ 7 trạng thái ===
# (ticket_code, serial, customer_email, status, issue_description, ai_classification,
#  technician_email, repair_cost, payment_status)
TICKETS_SPEC = [
    (
        "WR-2026-0001", "TND-AC10-001", "demo@shop.vn", "RECEIVED",
        "Tivi màn hình nhấp nháy liên tục khi xem chương trình HD, có sọc ngang ở góc phải.",
        "screen_flicker", None, "0", "UNPAID",
    ),
    (
        "WR-2026-0002", "TND-MLN02-001", "demo@shop.vn", "INSPECTION",
        "Máy lọc nước báo đèn vàng, nước đầu ra có mùi và đục. Nghi ngờ lõi lọc RO bị tắc.",
        "software", "tech1", "0", "UNPAID",
    ),
    (
        "WR-2026-0003", "TND-AC10-002", "demo@shop.vn", "REPAIRING",
        "Máy điều hòa quá nhiệt, quạt tản nhiệt kêu to và tắt máy đột ngột khi chạy quá 30 phút.",
        "overheat", "tech1", "450000", "UNPAID",
    ),
    (
        "WR-2026-0004", "TND-AC10-001", "demo@shop.vn", "APPROVAL",
        "Tivi không lên nguồn, đèn nguồn không sáng sau khi cắm điện. Đã thử củ sạc khác.",
        "screen_black", "tech2", "1200000", "UNPAID",
    ),
    (
        "WR-2026-0005", "TND-AC10-001", "demo@shop.vn", "COMPLETED",
        "Loa soundbar mất tiếng hoàn toàn, không nghe được âm thanh qua Bluetooth.",
        "audio", "tech1", "0", "WAIVED",
    ),
    (
        "WR-2026-0006", "TND-AC10-002", "demo@shop.vn", "REJECTED",
        "Máy điều hòa vào nước, rò rỉ nước vào bo mạch sau khi trần nhà dột.",
        "water", "tech2", "850000", "UNPAID",
    ),
    (
        "WR-2026-0007", "TND-FAN03-001", "demo@shop.vn", "DELIVERED",
        "Quạt tháp không quay, đèn nguồn nhấp nháy và kêu réo. Pin chai nhanh, sạc không vào.",
        "battery", "tech2", "320000", "PAID",
    ),
    (
        "WR-2026-0008", "TND-WMS04-001", "kh1@gmail.com", "REPAIRING",
        "Tủ lạnh đông không đông, ổ cứng lỗi hiển thị E1 và báo đèn nhấp nháy.",
        "storage", "tech1", "0", "UNPAID",
    ),
]


def reset_db():
    """Xóa hoàn toàn database cũ rồi tạo lại schema (idempotent).

    Lưu ý: phải DỪNG server uvicorn trước khi chạy — tiến trình server giữ file
    SQLite nên Windows sẽ không cho xoá. `engine.dispose()` giải phóng kết nối
    của chính tiến trình này.
    """
    engine.dispose()
    for suffix in ("", "-journal", "-wal", "-shm"):
        path = f"warranty.db{suffix}"
        if not os.path.exists(path):
            continue
        try:
            os.remove(path)
        except PermissionError as exc:
            raise RuntimeError(
                f"Không xoá được {path}: file đang bị tiến trình khác giữ (uvicorn đang chạy?). "
                "Hãy dừng server trước rồi chạy lại `python seed_data.py`."
            ) from exc
    Base.metadata.create_all(bind=engine)


def _json(value):
    """Serialize danh sách/dict thành JSON string (lưu vào cột Text)."""
    return json.dumps(value, ensure_ascii=False)


def seed():
    db = SessionLocal()
    try:
        # === Users ===
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
        manhdung = User(email="manhdung@gmail.com", full_name="Vũ Mạnh Dũng", role="customer",
                        phone="0827461460", hashed_password=hash_password("Manhdung@123"), is_seed=True)
        # Tài khoản demo cho storefront/chatbot
        demo = User(email="demo@shop.vn", full_name="Nguyễn Minh Demo", role="customer",
                    phone="0933333333", hashed_password=hash_password("Demo@123"), is_seed=True)
        db.add_all([admin, staff, tech1, tech2, cust1, cust2, manhdung, demo])
        db.flush()

        users_by_email = {u.email: u for u in db.query(User).all()}

        # === Wallets ===
        db.add_all([
            Wallet(user_id=cust1.id, balance=Decimal("500000")),
            Wallet(user_id=cust2.id, balance=Decimal("200000")),
            Wallet(user_id=demo.id, balance=Decimal("1500000")),
            Wallet(user_id=manhdung.id, balance=Decimal("750000")),
        ])

        # === 16 sản phẩm catalog storefront (5 SP đã được khách mua) ===
        catalog_products = []
        owned_count = 0
        for (slug, name, brand, category, cat_slug, price, orig, rating, reviews,
             sold, stock, badge_label, badge_tone, attrs, specs, wmonths, owned) in CATALOG:
            img = write_svg(STATIC_DIR, slug, name, cat_slug)
            if owned:
                serial, owner_email, offset_days = owned
                owner = users_by_email.get(owner_email)
                customer_id = owner.id if owner else None
                manufacture_date = date.today() - timedelta(days=offset_days)
                owned_count += 1
                description = (
                    f"{name} — chính hãng, bảo hành {wmonths} tháng. "
                    f"Đặc điểm nổi bật: {', '.join(attrs)}. "
                    f"Sản phẩm đã được khách hàng sử dụng, serial {serial}."
                )
            else:
                serial = f"CAT-{slug[:8].upper()}-{sold % 90 + 10}"
                customer_id = None
                manufacture_date = date.today() - timedelta(days=30)
                description = (
                    f"{name} — chính hãng, bảo hành {wmonths} tháng. "
                    f"Đặc điểm nổi bật: {', '.join(attrs)}. "
                    "Giao hàng nhanh toàn quốc, hỗ trợ trả góp 0%."
                )

            p = Product(
                name=name,
                serial_number=serial,
                category=category,
                warranty_months=wmonths,
                manufacture_date=manufacture_date,
                customer_id=customer_id,
                price=Decimal(str(price)),
                description=description,
                slug=slug,
                brand=brand,
                category_slug=cat_slug,
                original_price=Decimal(str(orig)),
                rating=float(rating),
                review_count=int(reviews),
                sold=int(sold),
                image_url=img,
                attributes=_json(attrs),
                stock=int(stock),
                status="available",
                badge_label=badge_label,
                badge_tone=badge_tone,
                installment_months=12,
                specs=_json(specs),
            )
            catalog_products.append(p)
        db.add_all(catalog_products)
        db.flush()

        by_serial = {p.serial_number: p for p in catalog_products}

        # === 8 phiếu bảo hành ===
        created_tickets = []
        for (code, serial, email, status, issue, ai_class, tech_email, cost,
             payment) in TICKETS_SPEC:
            product = by_serial.get(serial)
            if not product:
                continue
            customer = users_by_email.get(email)
            tech = users_by_email.get(tech_email) if tech_email else None
            ticket = WarrantyTicket(
                ticket_code=code,
                product_id=product.id,
                customer_id=customer.id if customer else cust1.id,
                technician_id=tech.id if tech else None,
                issue_description=issue,
                status=status,
                ai_classification=ai_class,
                within_warranty="YES",
                warranty_check_reason="Còn bảo hành",
                repair_cost=Decimal(cost),
                payment_status=payment,
                ai_progress_message=f"Phiếu {code} — trạng thái {status}.",
            )
            created_tickets.append((ticket, tech, status, ai_class))
        db.add_all([t[0] for t in created_tickets])
        db.flush()

        # === Lịch sử xử lý cho từng phiếu ===
        history_rows = []
        for (ticket, tech, status, ai_class) in created_tickets:
            history_rows.append(
                WarrantyHistory(
                    ticket_id=ticket.id, technician_id=None,
                    action_note=f"Tiếp nhận phiếu. AI phân loại: {ai_class}.",
                    status_from=None, status_to="RECEIVED",
                )
            )
            if status != "RECEIVED":
                history_rows.append(
                    WarrantyHistory(
                        ticket_id=ticket.id, technician_id=tech.id if tech else None,
                        action_note="Kỹ thuật viên tiếp nhận, bắt đầu kiểm tra thiết bị.",
                        status_from="RECEIVED", status_to="INSPECTION",
                    )
                )
            if status in ("REPAIRING", "APPROVAL", "COMPLETED", "REJECTED", "DELIVERED"):
                history_rows.append(
                    WarrantyHistory(
                        ticket_id=ticket.id, technician_id=tech.id if tech else None,
                        action_note="Đã xác định nguyên nhân lỗi, chuyển sang xử lý sửa chữa.",
                        status_from="INSPECTION", status_to="REPAIRING",
                    )
                )
            if status == "APPROVAL":
                history_rows.append(
                    WarrantyHistory(
                        ticket_id=ticket.id, technician_id=tech.id if tech else None,
                        action_note="Đã gửi báo giá sửa chữa, chờ khách hàng phê duyệt.",
                        status_from="REPAIRING", status_to="APPROVAL",
                    )
                )
            if status in ("COMPLETED", "DELIVERED"):
                history_rows.append(
                    WarrantyHistory(
                        ticket_id=ticket.id, technician_id=tech.id if tech else None,
                        action_note="Đã sửa chữa xong, kiểm tra thiết bị hoạt động bình thường.",
                        status_from="REPAIRING", status_to="COMPLETED",
                    )
                )
            if status == "DELIVERED":
                history_rows.append(
                    WarrantyHistory(
                        ticket_id=ticket.id, technician_id=tech.id if tech else None,
                        action_note="Đã giao sản phẩm lại khách hàng.",
                        status_from="COMPLETED", status_to="DELIVERED",
                    )
                )
            if status == "REJECTED":
                history_rows.append(
                    WarrantyHistory(
                        ticket_id=ticket.id, technician_id=tech.id if tech else None,
                        action_note="Lỗi do người dùng (vào nước) — không áp dụng bảo hành miễn phí.",
                        status_from="INSPECTION", status_to="REJECTED",
                    )
                )
        db.add_all(history_rows)

        # === Sổ tài chính CPO ===
        now_iso = utcnow().isoformat()
        finance_rows = [
            ("TXN-001", "2026-09-29", "Thu phí sửa chữa - WR-2026-0006", Decimal("850000"), "credit", "Dịch vụ sửa chữa", "REF-2409-8821"),
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

        # === Thông báo ===
        db.add_all([
            Notification(user_id=demo.id, title="Phiếu WR-2026-0003 đang sửa chữa",
                         message="Kỹ thuật viên đã bắt đầu sửa chữa máy điều hòa của bạn.",
                         type="INFO", link="/tickets", created_at=utcnow()),
            Notification(user_id=demo.id, title="Cảnh báo bảo hành sắp hết hạn",
                         message="Sản phẩm quạt tháp TND-FAN03-001 đã hết thời hạn bảo hành.",
                         type="WARNING", link="/products", created_at=utcnow()),
            Notification(user_id=admin.id, title="Có phiếu bảo hành mới",
                         message="Phiếu WR-2026-0001 đang chờ tiếp nhận.",
                         type="INFO", link="/tickets", created_at=utcnow()),
        ])

        # === Đơn hàng mẫu (mảng bán hàng) ===
        # Tạo vài đơn ở các trạng thái khác nhau để demo storefront + khu
        # vực nhân viên bán hàng. Đơn "SHIPPED" sẽ có serial bảo hành gán sẵn.
        from app.models.shop import Order, OrderItem

        order_specs = [
            # (user, status, payment_status, [(product_name, qty)], coupon, days_ago)
            (demo, "PENDING", "UNPAID", ["Tivi QLED 4K 55 inch Smart TV chính hành"], None, 0),
            (demo, "CONFIRMED", "UNPAID", ["Máy lọc nước RO công suất 15L/h không vôi"], None, 1),
            (demo, "SHIPPED", "PAID", ["Quạt thông minh 3D gió thoải điều khiển qua app"], None, 2),
            (cust1, "DELIVERED", "PAID", ["Tủ lạnh inverter 2 cửa 356L cấp đông nhanh"], "WELCOME10", 5),
            (cust2, "CANCELLED", "UNPAID", ["Loa Bluetooth di động 40W chống nước IPX7"], None, 7),
        ]
        created_orders = 0
        for order_index, (buyer, o_status, pay_status, prod_names, coupon, days_ago) in enumerate(
            order_specs, start=1
        ):
            lines = []
            subtotal = Decimal("0")
            for pname in prod_names:
                product = db.query(Product).filter(Product.name == pname).first()
                if not product:
                    continue
                price = Decimal(str(product.price or 0))
                subtotal += price
                lines.append((product, price))

            if not lines:
                continue

            shipping = Decimal("0") if subtotal >= Decimal("500000") else Decimal("30000")
            discount = Decimal("0")
            if coupon == "WELCOME10":
                discount = min(subtotal * Decimal("0.10"), Decimal("200000"))

            order = Order(
                order_code=f"ORD-2026-{order_index:04d}",
                user_id=buyer.id,
                status=o_status,
                subtotal=subtotal,
                shipping_fee=shipping,
                discount=discount,
                total=subtotal - discount + shipping,
                payment_status=pay_status,
                payment_method="cod" if pay_status == "UNPAID" else "momo",
                receiver_name=buyer.full_name,
                receiver_phone=buyer.phone,
                shipping_address="123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                coupon_code=coupon,
                created_at=utcnow() - timedelta(days=days_ago),
            )
            db.add(order)
            db.flush()

            for product, price in lines:
                serial = None
                if o_status in {"SHIPPED", "DELIVERED"}:
                    serial = f"SN-{product.id}-{order_index:02d}{abs(hash(product.name)) % 900 + 100}"
                    product.serial_number = serial
                    product.customer_id = buyer.id
                    product.purchase_date = date.today() - timedelta(days=days_ago)
                db.add(
                    OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        name=product.name,
                        slug=product.slug,
                        serial_number=serial,
                        image_url=product.image_url,
                        unit_price=price,
                        quantity=1,
                    )
                )
            created_orders += 1

        db.commit()
        print("[OK] Seed data OK")
        print(f"   Sản phẩm catalog : {len(catalog_products)} (trong đó {owned_count} SP đã mua)")
        print(f"   Phiếu bảo hành    : {len(created_tickets)}")
        print(f"   Đơn hàng mẫu     : {created_orders}")
        print(f"   Ảnh SVG           : {len(catalog_products)} file trong static/shop/")
        print("   Admin:      admin@warranty.vn / Admin@123")
        print("   Staff:      staff@warranty.vn / Staff@123")
        print("   Technician: tech1@warranty.vn / Tech@123")
        print("   Customer:   kh1@gmail.com     / Khach@123")
        print("   Shop demo:  demo@shop.vn      / Demo@123")
    finally:
        db.close()


if __name__ == "__main__":
    reset_db()
    seed()
