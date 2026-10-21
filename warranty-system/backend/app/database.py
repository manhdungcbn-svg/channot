"""
Database Module - Quản lý dữ liệu seed cho demo
Sử dụng in-memory storage thay vì SQLite để đơn giản hóa
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import random
import uuid

# ==============================================================================
# SEED DATA - Dữ liệu mẫu
# ==============================================================================

def init_seed_data():
    """Khởi tạo dữ liệu mẫu"""
    
    now = datetime.now()
    
    # Users
    global USERS
    USERS = [
        {"id": 1, "email": "admin@test.com", "password": "admin123", "name": "Administrator", "role": "admin"},
        {"id": 2, "email": "staff@test.com", "password": "staff123", "name": "Nguyễn Văn Staff", "role": "staff"},
        {"id": 3, "email": "tech@test.com", "password": "tech123", "name": "Trần Thị Kỹ Thuật", "role": "technician"},
        {"id": 4, "email": "user@test.com", "password": "user123", "name": "Lê Hoàng Khách", "role": "customer"},
    ]
    
    # Customers
    global CUSTOMERS
    CUSTOMERS = [
        {"id": 1, "name": "Nguyễn Văn Minh", "email": "minh.nguyen@email.com", "phone": "0901234567", "address": "123 Nguyễn Trãi, Q1, TP.HCM", "company": "Công ty ABC"},
        {"id": 2, "name": "Trần Thị Lan", "email": "lan.tran@email.com", "phone": "0912345678", "address": "456 Lê Lợi, Q3, TP.HCM", "company": "Công ty XYZ"},
        {"id": 3, "name": "Lê Hoàng Nam", "email": "nam.le@email.com", "phone": "0923456789", "address": "789 Điện Biên Phủ, Q.Bình Thạnh", "company": ""},
        {"id": 4, "name": "Phạm Thu Hà", "email": "ha.pham@email.com", "phone": "0934567890", "address": "321 Võ Văn Ngân, Q.Thủ Đức", "company": "Tập đoàn DEF"},
        {"id": 5, "name": "Hoàng Đức Anh", "email": "anh.hoang@email.com", "phone": "0945678901", "address": "654 Phạm Văn Đồng, Q.Gò Vấp", "company": ""},
        {"id": 6, "name": "Vũ Minh Tuấn", "email": "tuan.vu@email.com", "phone": "0956789012", "address": "987 Nguyễn Oanh, Q.Gò Vấp", "company": "Công ty GHI"},
        {"id": 7, "name": "Đặng Thị Mai", "email": "mai.dang@email.com", "phone": "0967890123", "address": "147 Quang Trung, Q.Go Vấp", "company": ""},
        {"id": 8, "name": "Bùi Đức Thắng", "email": "thang.bui@email.com", "phone": "0978901234", "address": "258 Lê Đức Thọ, Q.12", "company": "Công ty JKL"},
    ]
    
    # Products
    global PRODUCTS
    PRODUCTS = [
        {"id": 1, "serial_number": "TND-AC10-001", "name": "Router Tenda AC10", "category": "Network", "brand": "Tenda", "model": "AC10", "purchase_date": (now - timedelta(days=180)).strftime("%Y-%m-%d"), "warranty_months": 24, "warranty_expiry": (now + timedelta(days=550)).strftime("%Y-%m-%d"), "price": 450000, "status": "active", "customer_id": 1},
        {"id": 2, "serial_number": "TPL-WR841N-002", "name": "Router TP-Link WR841N", "category": "Network", "brand": "TP-Link", "model": "WR841N", "purchase_date": (now - timedelta(days=400)).strftime("%Y-%m-%d"), "warranty_months": 24, "warranty_expiry": (now - timedelta(days=35)).strftime("%Y-%m-%d"), "price": 380000, "status": "active", "customer_id": 2},
        {"id": 3, "serial_number": "CAM-HI3519-003", "name": "Camera Hikvision 5MP", "category": "Security", "brand": "Hikvision", "model": "HI3519", "purchase_date": (now - timedelta(days=120)).strftime("%Y-%m-%d"), "warranty_months": 24, "warranty_expiry": (now + timedelta(days=610)).strftime("%Y-%m-%d"), "price": 1800000, "status": "active", "customer_id": 3},
        {"id": 4, "serial_number": "CAM-DS2CD-004", "name": "Camera IP Dome DS-2CD", "category": "Security", "brand": "Hikvision", "model": "DS-2CD2043", "purchase_date": (now - timedelta(days=90)).strftime("%Y-%m-%d"), "warranty_months": 12, "warranty_expiry": (now + timedelta(days=275)).strftime("%Y-%m-%d"), "price": 2200000, "status": "active", "customer_id": 4},
        {"id": 5, "serial_number": "DELL-XPS-15-005", "name": "Laptop Dell XPS 15", "category": "Computer", "brand": "Dell", "model": "XPS 15", "purchase_date": (now - timedelta(days=300)).strftime("%Y-%m-%d"), "warranty_months": 24, "warranty_expiry": (now + timedelta(days=430)).strftime("%Y-%m-%d"), "price": 35000000, "status": "active", "customer_id": 1},
        {"id": 6, "serial_number": "HP-ENVY-006", "name": "Laptop HP Envy 13", "category": "Computer", "brand": "HP", "model": "Envy 13", "purchase_date": (now - timedelta(days=150)).strftime("%Y-%m-%d"), "warranty_months": 12, "warranty_expiry": (now - timedelta(days=15)).strftime("%Y-%m-%d"), "price": 22000000, "status": "active", "customer_id": 5},
        {"id": 7, "serial_number": "SAM-55U-007", "name": "Smart TV Samsung 55 inch 4K", "category": "Electronics", "brand": "Samsung", "model": "UA55TU8500", "purchase_date": (now - timedelta(days=400)).strftime("%Y-%m-%d"), "warranty_months": 24, "warranty_expiry": (now - timedelta(days=65)).strftime("%Y-%m-%d"), "price": 15000000, "status": "active", "customer_id": 4},
        {"id": 8, "serial_number": "LG-WM8-008", "name": "Máy giặt LG 8kg", "category": "Appliance", "brand": "LG", "model": "FC1408S2W", "purchase_date": (now - timedelta(days=45)).strftime("%Y-%m-%d"), "warranty_months": 36, "warranty_expiry": (now + timedelta(days=990)).strftime("%Y-%m-%d"), "price": 8500000, "status": "active", "customer_id": 6},
        {"id": 9, "serial_number": "APL-IP15-009", "name": "iPhone 15 Pro 256GB", "category": "Mobile", "brand": "Apple", "model": "iPhone 15 Pro", "purchase_date": (now - timedelta(days=280)).strftime("%Y-%m-%d"), "warranty_months": 12, "warranty_expiry": (now + timedelta(days=85)).strftime("%Y-%m-%d"), "price": 28000000, "status": "active", "customer_id": 7},
        {"id": 10, "serial_number": "SAM-S24-010", "name": "Samsung Galaxy S24 Ultra", "category": "Mobile", "brand": "Samsung", "model": "Galaxy S24 Ultra", "purchase_date": (now - timedelta(days=60)).strftime("%Y-%m-%d"), "warranty_months": 12, "warranty_expiry": (now + timedelta(days=305)).strftime("%Y-%m-%d"), "price": 25000000, "status": "active", "customer_id": 8},
    ]
    
    # Tickets
    statuses = ["received", "checking", "repairing", "completed", "rejected"]
    status_texts = {"received": "Tiếp nhận", "checking": "Đang kiểm tra", "repairing": "Đang sửa chữa", "completed": "Hoàn thành", "rejected": "Từ chối"}
    issues = [
        "Không kết nối được wifi", "Màn hình bị chớp, có vết sọc", "Loa không có tiếng",
        "Máy kêu to khi vắt, rung mạnh", "Không bật được, đèn power nhấp nháy",
        "Cảm ứng không nhạy", "Camera mờ vào ban đêm", "Tốc độ wifi chậm"
    ]
    
    global TICKETS
    TICKETS = []
    ticket_id = 1
    for i, product in enumerate(PRODUCTS[:8]):
        days_ago = random.randint(1, 15)
        created = now - timedelta(days=days_ago, hours=random.randint(8, 18))
        
        if i < 3:
            status = "received"
        elif i < 5:
            status = "checking"
        elif i < 6:
            status = "repairing"
        elif i < 7:
            status = "completed"
        else:
            status = random.choice(["received", "completed"])
        
        customer = next((c for c in CUSTOMERS if c["id"] == product["customer_id"]), CUSTOMERS[0])
        
        ticket = {
            "id": ticket_id,
            "ticket_code": f"WR-2026-{str(ticket_id).zfill(4)}",
            "product_id": product["id"],
            "product_serial": product["serial_number"],
            "product_name": product["name"],
            "customer_id": customer["id"],
            "customer_name": customer["name"],
            "customer_phone": customer["phone"],
            "issue_description": issues[i % len(issues)],
            "status": status,
            "status_text": status_texts[status],
            "technician_id": random.choice([2, 3, None]),
            "created_at": created.isoformat(),
            "updated_at": (created + timedelta(hours=random.randint(1, 24))).isoformat(),
            "notes": "",
            "repair_cost": random.randint(0, 500000) if status == "completed" else 0
        }
        TICKETS.append(ticket)
        ticket_id += 1
    
    # Wallets
    global WALLETS
    WALLETS = [
        {"id": 1, "user_id": 1, "balance": 5000000, "currency": "VND"},
        {"id": 2, "user_id": 2, "balance": 1000000, "currency": "VND"},
        {"id": 3, "user_id": 3, "balance": 2000000, "currency": "VND"},
        {"id": 4, "user_id": 4, "balance": 500000, "currency": "VND"},
    ]
    
    # Transactions
    global TRANSACTIONS
    TRANSACTIONS = []
    tx_id = 1
    for wallet in WALLETS:
        for _ in range(random.randint(3, 8)):
            tx_type = random.choice(["topup", "payment", "refund"])
            if tx_type == "topup":
                amount = random.choice([100000, 200000, 500000, 1000000, 2000000])
            elif tx_type == "payment":
                amount = -random.choice([50000, 100000, 200000, 300000])
            else:
                amount = random.choice([50000, 100000, 150000])
            
            tx = {
                "id": tx_id,
                "wallet_id": wallet["id"],
                "type": tx_type,
                "amount": amount,
                "description": {"topup": "Nạp tiền", "payment": "Thanh toán phí sửa chữa", "refund": "Hoàn tiền bảo hành"}[tx_type],
                "created_at": (now - timedelta(days=random.randint(1, 30))).isoformat(),
            }
            TRANSACTIONS.append(tx)
            tx_id += 1
    
    # Notifications
    global NOTIFICATIONS
    NOTIFICATIONS = []
    notif_id = 1
    for i, ticket in enumerate(TICKETS[:5]):
        notif = {
            "id": notif_id,
            "user_id": 1,
            "title": f"Phiếu {ticket['ticket_code']} được cập nhật",
            "message": f"Phiếu bảo hành {ticket['product_name']} đã chuyển sang trạng thái {ticket['status_text']}",
            "type": "ticket_update",
            "is_read": i < 2,
            "created_at": ticket["created_at"],
            "reference_id": ticket["id"]
        }
        NOTIFICATIONS.append(notif)
        notif_id += 1
    
    print("[OK] Database initialized with seed data")


# ==============================================================================
# IN-MEMORY STORAGE (Initialized on import)
# ==============================================================================

USERS = []
CUSTOMERS = []
PRODUCTS = []
TICKETS = []
WALLETS = []
TRANSACTIONS = []
NOTIFICATIONS = []

# Initialize on import
init_seed_data()


# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def get_next_id(items: List) -> int:
    """Get next ID for a collection"""
    if not items:
        return 1
    return max(item.get("id", 0) for item in items) + 1


def success_response(data: Any) -> Dict:
    """Format success response"""
    return {"success": True, "data": data}


def error_response(message: str) -> Dict:
    """Format error response"""
    return {"success": False, "error": message}


def check_warranty_status(product: Dict) -> Dict:
    """Check warranty status for a product"""
    now = datetime.now()
    expiry = datetime.strptime(product["warranty_expiry"], "%Y-%m-%d")
    days_remaining = (expiry - now).days
    
    if days_remaining < 0:
        return {"status": "expired", "days_remaining": days_remaining, "valid": False}
    return {"status": "valid", "days_remaining": days_remaining, "valid": True}
