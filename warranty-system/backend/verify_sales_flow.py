"""Kiểm chứng nhanh luồng bán hàng: đặt hàng → xuất kho → sinh serial."""

import json

import requests

BASE = "http://127.0.0.1:8000/api/v1"

checks = []


def check(label, condition, detail=""):
    checks.append((label, bool(condition), detail))
    mark = "PASS" if condition else "FAIL"
    print(f"[{mark}] {label}" + (f" — {detail}" if detail else ""))


# 1. Đăng nhập khách
r = requests.post(
    f"{BASE}/auth/login",
    json={"email": "demo@shop.vn", "password": "Demo@123"},
    timeout=10,
)
check("Đăng nhập khách demo@shop.vn", r.status_code == 200, r.text[:120])
token = r.json()["access_token"]
kh = {"Authorization": f"Bearer {token}"}

# 2. Lấy sản phẩm
r = requests.get(f"{BASE}/shop/products?limit=3", timeout=10)
check("GET /shop/products (public)", r.status_code == 200, f"total={r.json().get('total')}")
product = r.json()["items"][0]
print(f"       → SP đầu tiên: {product['name']} | giá {product['price']} | id={product['id']}")

# 3. Đặt hàng
r = requests.post(
    f"{BASE}/shop/orders",
    headers=kh,
    json={
        "items": [{"product_id": product["id"], "quantity": 2}],
        "receiver_name": "Nguyễn Văn A",
        "receiver_phone": "0900000000",
        "shipping_address": "123 Nguyễn Huệ, Q1, TP.HCM",
        "payment_method": "momo",
        "coupon_code": "WELCOME10",
    },
    timeout=10,
)
check("POST /shop/orders (đặt hàng)", r.status_code == 201, r.text[:200])
order = r.json()
print(
    f"       → {order['order_code']} | subtotal={order['subtotal']} "
    f"ship={order['shipping_fee']} discount={order['discount']} total={order['total']}"
)

# 4. Kiểm tra giá server-side (không tin client)
check(
    "Giá tính ở server (2 × price)",
    float(order["subtotal"]) == float(product["price"]) * 2,
    f"{order['subtotal']} == {float(product['price']) * 2}",
)

# 5. Khách huỷ đơn đã xuất kho → 400; chưa xuất kho → OK
r = requests.post(f"{BASE}/shop/orders/{order['id']}/cancel", headers=kh, timeout=10)
check("Khách huỷ đơn PENDING", r.status_code == 200, r.json().get("status", r.text[:120]))

# 6. Khách đổi trạng thái → 403
r = requests.post(
    f"{BASE}/shop/orders/{order['id']}/status",
    headers=kh,
    json={"status": "SHIPPED"},
    timeout=10,
)
check("Khách tự đổi trạng thái → 403", r.status_code == 403, f"HTTP {r.status_code}")

# 7. Nhân viên bán hàng xác nhận + xuất kho → sinh serial
r = requests.post(
    f"{BASE}/auth/login",
    json={"email": "staff@warranty.vn", "password": "Staff@123"},
    timeout=10,
)
check("Đăng nhập staff@warranty.vn", r.status_code == 200, r.text[:120])
staff_token = r.json()["access_token"]
staff = {"Authorization": f"Bearer {staff_token}"}

r = requests.post(
    f"{BASE}/shop/orders/{order['id']}/status",
    headers=staff,
    json={"status": "SHIPPED"},
    timeout=10,
)
check("Staff xuất kho (SHIPPED)", r.status_code == 200, r.text[:150])
shipped = r.json()
serial = shipped["items"][0]["serial_number"]
check("Serial được sinh khi xuất kho", bool(serial), str(serial))

# 8. Khách thấy sản phẩm trong "sản phẩm của tôi"
r = requests.get(f"{BASE}/shop/warranty/my-products", headers=kh, timeout=10)
serials = [i["serial_number"] for i in r.json()["items"]]
check("Serial xuất hiện trong Sản phẩm của tôi", serial in serials, str(serials[:5]))

# 9. Địa chỉ giao hàng
r = requests.post(
    f"{BASE}/shop/addresses",
    headers=kh,
    json={
        "label": "Nhà",
        "receiver_name": "Nguyễn Văn A",
        "phone": "0900000000",
        "address": "123 Nguyễn Huệ, Q1",
        "is_default": True,
    },
    timeout=10,
)
check("POST /shop/addresses", r.status_code == 201, r.text[:150])

# 10. Đánh giá
r = requests.post(
    f"{BASE}/shop/reviews?product_id={product['id']}",
    headers=kh,
    json={"rating": 5, "title": "Rất tốt", "content": "Dùng ổn"},
    timeout=10,
)
check("POST /shop/reviews", r.status_code == 201, r.text[:150])

# 11. Báo cáo seller
r = requests.get(f"{BASE}/shop/seller/stats", headers=staff, timeout=10)
check("GET /shop/seller/stats (staff)", r.status_code == 200, r.text[:200])

# 12. Khách không được gọi seller stats
r = requests.get(f"{BASE}/shop/seller/stats", headers=kh, timeout=10)
check("Khách gọi /seller/stats → 403", r.status_code == 403, f"HTTP {r.status_code}")

# 13. Khách không thấy đơn của người khác
r = requests.get(f"{BASE}/shop/orders", headers=kh, timeout=10)
orders = r.json()
check(
    "Khách chỉ thấy đơn của mình",
    all(o["user_id"] == r.json()[0]["user_id"] for o in orders) and len(orders) <= 3,
    f"{len(orders)} đơn",
)

print("\n" + "=" * 60)
passed = sum(1 for _, ok, _ in checks if ok)
print(f"KẾT QUẢ: {passed}/{len(checks)} kiểm tra pass")
print("=" * 60)
