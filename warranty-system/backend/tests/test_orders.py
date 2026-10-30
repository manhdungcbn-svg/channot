"""Pytest — luồng đặt hàng: tạo đơn, tính tiền server-side, serial sinh khi xuất kho,
phân quyền khách/nhân viên bán hàng.

Bao phủ:
- Khách đặt hàng → đơn tạo đúng, giá tính từ DB (không tin client).
- Phí ship + mã giảm giá.
- Nhân viên bán hàng chuyển đơn sang SHIPPED → sinh serial cho khách.
- Khách chỉ thấy đơn của mình; nhân viên thấy tất cả.
- Địa chỉ giao hàng: CRUD + quyền riêng tư.
- Đánh giá: 1 khách 1 đánh giá/sản phẩm, cập nhật rating sản phẩm.
"""
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.main import app
from app.models.product import Product
from app.models.user import User


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


def _make_user(email: str, role: str = "customer", name: str = "Test") -> User:
    db = SessionLocal()
    u = User(
        email=email,
        full_name=name,
        role=role,
        hashed_password=hash_password("Test@123"),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _make_product(serial: str, *, price: float = 1_000_000, customer_id=None) -> Product:
    db = SessionLocal()
    p = Product(
        name=f"SP {serial}",
        serial_number=serial,
        category="Tivi",
        warranty_months=12,
        manufacture_date=date.today() - timedelta(days=30),
        customer_id=customer_id,
        slug=f"sp-{serial.lower()}",
        brand="Acme",
        category_slug="tivi",
        price=price,
        stock=10,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def _login(client, email: str) -> str:
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "Test@123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _order_payload(product_id: int, **extra) -> dict:
    payload = {
        "items": [{"product_id": product_id, "quantity": 1}],
        "receiver_name": "Nguyễn Văn A",
        "shipping_address": "123 Nguyễn Huệ, Q1, TP.HCM",
        "payment_method": "cod",
    }
    payload.update(extra)
    return payload


# === Tạo đơn ===


def test_create_order_calculates_price_server_side(client):
    """Giá trong đơn lấy từ DB, không phải từ payload của client."""
    _make_user("buyer@shop.vn")
    product = _make_product("SN-ORD1", price=2_500_000)
    token = _login(client, "buyer@shop.vn")

    # Client cố gửi giá rác — server phải bỏ qua.
    payload = _order_payload(product.id)
    payload["items"][0]["unit_price"] = 1
    payload["items"][0]["quantity"] = 2

    r = client.post("/api/v1/shop/orders", json=payload, headers=_auth(token))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["subtotal"] == "5000000.00"
    assert body["total"] == "5000000.00"
    assert body["status"] == "PENDING"
    assert body["payment_status"] == "UNPAID"
    assert body["items"][0]["unit_price"] == "2500000.00"
    assert body["items"][0]["quantity"] == 2


def test_create_order_applies_shipping_fee(client):
    """Đơn dưới 500k → có phí ship 30k."""
    _make_user("buyer2@shop.vn")
    product = _make_product("SN-ORD2", price=100_000)
    token = _login(client, "buyer2@shop.vn")

    r = client.post("/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(token))
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["subtotal"] == "100000.00"
    assert body["shipping_fee"] == "30000.00"
    assert body["total"] == "130000.00"


def test_create_order_free_shipping_over_threshold(client):
    """Đơn từ 500k trở lên → miễn phí ship."""
    _make_user("buyer3@shop.vn")
    product = _make_product("SN-ORD3", price=600_000)
    token = _login(client, "buyer3@shop.vn")

    r = client.post("/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(token))
    assert r.status_code == 201
    assert r.json()["shipping_fee"] == "0.00"


def test_create_order_with_coupon(client):
    """Mã giảm giá WELCOME10 → giảm 10%."""
    _make_user("buyer4@shop.vn")
    product = _make_product("SN-ORD4", price=1_000_000)
    token = _login(client, "buyer4@shop.vn")

    r = client.post(
        "/api/v1/shop/orders",
        json=_order_payload(product.id, coupon_code="WELCOME10"),
        headers=_auth(token),
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["discount"] == "100000.00"
    assert body["total"] == "900000.00"


def test_create_order_requires_auth(client):
    """Đặt hàng phải đăng nhập."""
    product = _make_product("SN-ORD5")
    r = client.post("/api/v1/shop/orders", json=_order_payload(product.id))
    assert r.status_code in (401, 403)


def test_create_order_rejects_empty_items(client):
    """Đơn không có sản phẩm → 400."""
    _make_user("buyer5@shop.vn")
    token = _login(client, "buyer5@shop.vn")
    r = client.post(
        "/api/v1/shop/orders",
        json={"items": [], "receiver_name": "A", "shipping_address": "SĐ"},
        headers=_auth(token),
    )
    assert r.status_code in (400, 422)


def test_create_order_unknown_product(client):
    """Sản phẩm không tồn tại → 400, không tạo đơn rác."""
    _make_user("buyer6@shop.vn")
    token = _login(client, "buyer6@shop.vn")
    r = client.post(
        "/api/v1/shop/orders",
        json=_order_payload(999999),
        headers=_auth(token),
    )
    assert r.status_code == 400


# === Vòng đời đơn & serial ===


def test_shipping_order_generates_serial_for_customer(client):
    """Nhân viên xuất kho → sinh serial, gán sản phẩm cho khách mua."""
    _make_user("buyer7@shop.vn")
    _make_user("staff@shop.vn", role="staff")
    product = _make_product("SN-ORD7")
    token = _login(client, "buyer7@shop.vn")

    r = client.post("/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(token))
    order_id = r.json()["id"]

    staff_token = _login(client, "staff@shop.vn")
    r2 = client.post(
        f"/api/v1/shop/orders/{order_id}/status",
        json={"status": "SHIPPED"},
        headers=_auth(staff_token),
    )
    assert r2.status_code == 200, r2.text
    assert r2.json()["status"] == "SHIPPED"

    # Sản phẩm giờ thuộc về khách mua, có serial mới.
    db = SessionLocal()
    p = db.query(Product).filter(Product.id == product.id).first()
    assert p.customer_id is not None
    assert p.serial_number.startswith("SN-")
    serial = p.serial_number
    db.close()

    # Khách thấy sản phẩm trong "sản phẩm của tôi" (bảo hành kích hoạt tự động).
    r3 = client.get("/api/v1/shop/warranty/my-products", headers=_auth(token))
    assert r3.status_code == 200
    serials = [i["serial_number"] for i in r3.json()["items"]]
    assert serial in serials


def test_shipping_order_updates_item_serial(client):
    """Serial sinh ra được ghi vào dòng đơn để khách thấy trong "Đơn của tôi"."""
    _make_user("buyer8@shop.vn")
    _make_user("staff2@shop.vn", role="staff")
    product = _make_product("SN-ORD8")
    token = _login(client, "buyer8@shop.vn")

    r = client.post("/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(token))
    order_id = r.json()["id"]

    staff_token = _login(client, "staff2@shop.vn")
    client.post(
        f"/api/v1/shop/orders/{order_id}/status",
        json={"status": "SHIPPED"},
        headers=_auth(staff_token),
    )

    r2 = client.get(f"/api/v1/shop/orders/{order_id}", headers=_auth(token))
    assert r2.status_code == 200
    item = r2.json()["items"][0]
    assert item["serial_number"] is not None
    assert item["serial_number"].startswith("SN-")


def test_customer_cannot_change_order_status(client):
    """Khách không được đổi trạng thái đơn."""
    _make_user("buyer9@shop.vn")
    _make_user("staff3@shop.vn", role="staff")
    product = _make_product("SN-ORD9")
    token = _login(client, "buyer9@shop.vn")

    r = client.post("/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(token))
    order_id = r.json()["id"]

    staff_token = _login(client, "staff3@shop.vn")
    client.post(
        f"/api/v1/shop/orders/{order_id}/status",
        json={"status": "SHIPPED"},
        headers=_auth(staff_token),
    )

    r2 = client.post(
        f"/api/v1/shop/orders/{order_id}/status",
        json={"status": "DELIVERED"},
        headers=_auth(token),
    )
    assert r2.status_code == 403


def test_customer_can_cancel_own_pending_order(client):
    """Khách huỷ được đơn chưa xuất kho."""
    _make_user("buyer10@shop.vn")
    product = _make_product("SN-ORD10", price=100_000)
    token = _login(client, "buyer10@shop.vn")

    r = client.post("/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(token))
    order_id = r.json()["id"]

    r2 = client.post(f"/api/v1/shop/orders/{order_id}/cancel", headers=_auth(token))
    assert r2.status_code == 200, r2.text
    assert r2.json()["status"] == "CANCELLED"


def test_customer_cannot_cancel_shipped_order(client):
    """Đơn đã xuất kho → không huỷ được."""
    _make_user("buyer12@shop.vn")
    _make_user("staff4@shop.vn", role="staff")
    product = _make_product("SN-ORD11")
    token = _login(client, "buyer12@shop.vn")
    staff_token = _login(client, "staff4@shop.vn")

    r = client.post("/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(token))
    order_id = r.json()["id"]
    client.post(
        f"/api/v1/shop/orders/{order_id}/status",
        json={"status": "SHIPPED"},
        headers=_auth(staff_token),
    )

    r2 = client.post(f"/api/v1/shop/orders/{order_id}/cancel", headers=_auth(token))
    assert r2.status_code == 400


# === Phân quyền ===


def test_customer_only_sees_own_orders(client):
    """Khách chỉ thấy đơn của chính mình."""
    me = _make_user("me@shop.vn")
    _make_user("other@shop.vn")
    p1 = _make_product("SN-A1", price=100_000)
    p2 = _make_product("SN-A2", price=100_000)

    token = _login(client, "me@shop.vn")
    other_token = _login(client, "other@shop.vn")

    client.post("/api/v1/shop/orders", json=_order_payload(p1.id), headers=_auth(token))
    client.post("/api/v1/shop/orders", json=_order_payload(p2.id), headers=_auth(other_token))

    r = client.get("/api/v1/shop/orders", headers=_auth(token))
    assert r.status_code == 200
    orders = r.json()
    assert len(orders) == 1
    assert orders[0]["user_id"] == me.id


def test_customer_cannot_read_other_customers_order(client):
    """Khách không mở được chi tiết đơn của người khác → 403."""
    _make_user("other13@shop.vn")
    _make_user("me13@shop.vn")
    product = _make_product("SN-A4", price=100_000)

    other_token = _login(client, "other13@shop.vn")
    r = client.post(
        "/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(other_token)
    )
    order_id = r.json()["id"]

    token = _login(client, "me13@shop.vn")
    r2 = client.get(f"/api/v1/shop/orders/{order_id}", headers=_auth(token))
    assert r2.status_code == 403


def test_staff_sees_all_orders(client):
    """Nhân viên bán hàng thấy tất cả đơn."""
    _make_user("buyer14@shop.vn")
    _make_user("staff5@shop.vn", role="staff")
    product = _make_product("SN-A5", price=100_000)
    token = _login(client, "buyer14@shop.vn")

    client.post("/api/v1/shop/orders", json=_order_payload(product.id), headers=_auth(token))

    staff_token = _login(client, "staff5@shop.vn")
    r = client.get("/api/v1/shop/orders", headers=_auth(staff_token))
    assert r.status_code == 200
    assert len(r.json()) >= 1


# === Địa chỉ giao hàng ===


def test_address_crud_and_ownership(client):
    """Khách tạo/đọc/xoá được địa chỉ của chính mình."""
    _make_user("me15@shop.vn")
    token = _login(client, "me15@shop.vn")

    r = client.post(
        "/api/v1/shop/addresses",
        json={
            "label": "Nhà",
            "receiver_name": "Nguyễn Văn A",
            "phone": "0900000000",
            "address": "123 Nguyễn Huệ, Q1",
            "is_default": True,
        },
        headers=_auth(token),
    )
    assert r.status_code == 201, r.text
    address_id = r.json()["id"]
    assert r.json()["is_default"] is True

    r2 = client.get("/api/v1/shop/addresses", headers=_auth(token))
    assert r2.status_code == 200
    assert len(r2.json()) == 1

    r3 = client.delete(f"/api/v1/shop/addresses/{address_id}", headers=_auth(token))
    assert r3.status_code == 204

    r4 = client.get("/api/v1/shop/addresses", headers=_auth(token))
    assert r4.json() == []


def test_cannot_delete_other_customers_address(client):
    """Không xoá được địa chỉ của người khác."""
    owner = _make_user("owner16@shop.vn")
    _make_user("me16@shop.vn")
    token = _login(client, "me16@shop.vn")

    db = SessionLocal()
    from app.models.shop import ShippingAddress

    address = ShippingAddress(
        user_id=owner.id,
        receiver_name="Chủ",
        phone="0900",
        address="Địa chỉ riêng",
    )
    db.add(address)
    db.commit()
    address_id = address.id
    db.close()

    r = client.delete(f"/api/v1/shop/addresses/{address_id}", headers=_auth(token))
    assert r.status_code == 403


# === Đánh giá ===


def test_create_review_updates_product_rating(client):
    """Khách đánh giá → rating trung bình của sản phẩm được cập nhật."""
    _make_user("me17@shop.vn")
    product = _make_product("SN-RV1")
    token = _login(client, "me17@shop.vn")

    r = client.post(
        f"/api/v1/shop/reviews?product_id={product.id}",
        json={"rating": 4, "title": "Tốt", "content": "Dùng ổn"},
        headers=_auth(token),
    )
    assert r.status_code == 201, r.text
    assert r.json()["rating"] == 4

    db = SessionLocal()
    p = db.query(Product).filter(Product.id == product.id).first()
    assert float(p.rating) == 4.0
    assert int(p.review_count) == 1
    db.close()


def test_cannot_review_same_product_twice(client):
    """Mỗi khách chỉ đánh giá 1 lần / sản phẩm."""
    _make_user("me18@shop.vn")
    product = _make_product("SN-RV2")
    token = _login(client, "me18@shop.vn")

    r = client.post(
        f"/api/v1/shop/reviews?product_id={product.id}",
        json={"rating": 5},
        headers=_auth(token),
    )
    assert r.status_code == 201

    r2 = client.post(
        f"/api/v1/shop/reviews?product_id={product.id}",
        json={"rating": 3},
        headers=_auth(token),
    )
    assert r2.status_code == 400


def test_list_reviews_is_public(client):
    """Danh sách đánh giá công khai, không cần đăng nhập."""
    _make_user("me19@shop.vn")
    product = _make_product("SN-RV3")
    token = _login(client, "me19@shop.vn")
    client.post(
        f"/api/v1/shop/reviews?product_id={product.id}",
        json={"rating": 5, "content": "Tuyệt"},
        headers=_auth(token),
    )

    r = client.get(f"/api/v1/shop/reviews?product_id={product.id}")
    assert r.status_code == 200
    assert len(r.json()) == 1
