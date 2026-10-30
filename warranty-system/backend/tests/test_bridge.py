"""Pytest — luồng nối storefront ↔ app bảo hành (bridge) + phân quyền khách hàng.

Bao phủ:
- Đăng ký bảo hành theo serial từ storefront → sản phẩm vào "sản phẩm của tôi".
- Không ghi đè sản phẩm đã thuộc về khách khác.
- Khách hàng chỉ thấy / xem được dữ liệu của chính mình.
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


def _make_product(serial: str, customer_id=None, months: int = 12) -> Product:
    db = SessionLocal()
    p = Product(
        name=f"Sản phẩm {serial}",
        serial_number=serial,
        category="Tivi",
        warranty_months=months,
        manufacture_date=date.today() - timedelta(days=30),
        customer_id=customer_id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def _login(client, email: str) -> str:
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "Test@123"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


# === Đăng ký bảo hành từ storefront ===


def test_register_warranty_assigns_product_to_customer(client):
    """Khách mua hàng → đăng ký serial → sản phẩm gán về tài khoản."""
    _make_user("buyer@shop.vn")
    _make_product("SN-001")
    token = _login(client, "buyer@shop.vn")
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post(
        "/api/v1/shop/warranty/register",
        json={"serial": "SN-001"},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["registered"] is True
    assert body["already_owned"] is False
    assert "thành công" in body["message"].lower()

    # Sản phẩm phải xuất hiện ở "sản phẩm của tôi".
    r2 = client.get("/api/v1/shop/warranty/my-products", headers=headers)
    assert r2.status_code == 200
    items = r2.json()["items"]
    assert len(items) == 1
    assert items[0]["serial_number"] == "SN-001"


def test_register_warranty_requires_auth(client):
    """Endpoint đăng ký bảo hành phải đăng nhập."""
    _make_product("SN-002")
    r = client.post("/api/v1/shop/warranty/register", json={"serial": "SN-002"})
    assert r.status_code in (401, 403)


def test_register_warranty_unknown_serial(client):
    """Serial không tồn tại → báo lỗi, không tạo gì."""
    _make_user("buyer2@shop.vn")
    token = _login(client, "buyer2@shop.vn")
    r = client.post(
        "/api/v1/shop/warranty/register",
        json={"serial": "KHONG-CO-THAT"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["registered"] is False
    assert body["product"] is None


def test_register_warranty_idempotent(client):
    """Đăng ký lại cùng serial → báo đã sở hữu, không ghi đè."""
    user = _make_user("buyer3@shop.vn")
    _make_product("SN-003", customer_id=user.id)
    token = _login(client, "buyer3@shop.vn")

    r = client.post(
        "/api/v1/shop/warranty/register",
        json={"serial": "SN-003"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["registered"] is False
    assert body["already_owned"] is True


def test_register_warranty_does_not_steal_other_customers_product(client):
    """Sản phẩm đã thuộc về khách khác → KHÔNG ghi đè, không lộ PII."""
    owner = _make_user("owner@shop.vn")
    _make_product("SN-004", customer_id=owner.id)
    _make_user("thief@shop.vn")
    token = _login(client, "thief@shop.vn")

    r = client.post(
        "/api/v1/shop/warranty/register",
        json={"serial": "SN-004"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["registered"] is False
    assert body["already_owned"] is False
    # Không lộ tên chủ sở hữu.
    assert "owner@shop.vn" not in r.text

    # Chủ sở hữu vẫn sở hữu sản phẩm.
    db = SessionLocal()
    p = db.query(Product).filter(Product.serial_number == "SN-004").first()
    assert p.customer_id == owner.id


def test_register_warranty_with_purchase_date(client):
    """Ngày mua được cung cấp → dùng làm mốc tính hạn bảo hành."""
    _make_user("buyer4@shop.vn")
    _make_product("SN-005")
    token = _login(client, "buyer4@shop.vn")
    purchase = (date.today() - timedelta(days=10)).isoformat()

    r = client.post(
        "/api/v1/shop/warranty/register",
        json={"serial": "SN-005", "purchase_date": purchase},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["registered"] is True

    r2 = client.get("/api/v1/shop/warranty/my-products", headers={"Authorization": f"Bearer {token}"})
    item = r2.json()["items"][0]
    assert item["purchase_date"] == purchase
    assert item["within_warranty"] == "YES"
    assert item["warranty_end_date"] is not None


# === Phân quyền khách hàng ===


def test_my_products_only_returns_own(client):
    """Khách chỉ thấy sản phẩm của mình, không thấy của người khác."""
    me = _make_user("me@shop.vn")
    other = _make_user("other@shop.vn")
    _make_product("SN-MINE", customer_id=me.id)
    _make_product("SN-THEIRS", customer_id=other.id)

    token = _login(client, "me@shop.vn")
    r = client.get("/api/v1/shop/warranty/my-products", headers={"Authorization": f"Bearer {token}"})
    serials = [i["serial_number"] for i in r.json()["items"]]
    assert serials == ["SN-MINE"]


def test_customer_cannot_list_all_tickets(client):
    """Khách không xem được phiếu của người khác."""
    from app.services import warranty_service

    me = _make_user("me2@shop.vn")
    other = _make_user("other2@shop.vn")
    p_mine = _make_product("SN-T1", customer_id=me.id)
    p_theirs = _make_product("SN-T2", customer_id=other.id)

    db = SessionLocal()
    warranty_service.create_ticket(db, p_mine, me.id, "Lỗi của tôi")
    warranty_service.create_ticket(db, p_theirs, other.id, "Lỗi của người khác")
    db.close()

    token = _login(client, "me2@shop.vn")
    r = client.get("/api/v1/tickets", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    descriptions = [t["issue_description"] for t in r.json()]
    assert "Lỗi của tôi" in descriptions
    assert "Lỗi của người khác" not in descriptions


def test_customer_cannot_read_other_customers_ticket(client):
    """Khách không mở được chi tiết phiếu của người khác → 403."""
    from app.services import warranty_service

    other = _make_user("other3@shop.vn")
    _make_user("me3@shop.vn")
    p_theirs = _make_product("SN-T3", customer_id=other.id)

    db = SessionLocal()
    ticket = warranty_service.create_ticket(db, p_theirs, other.id, "Lỗi riêng")
    ticket_id = ticket.id
    db.close()

    token = _login(client, "me3@shop.vn")
    r = client.get(f"/api/v1/tickets/{ticket_id}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_customer_cannot_manage_customers_list(client):
    """Khách không được gọi endpoint danh sách khách hàng của quản trị."""
    _make_user("me4@shop.vn")
    token = _login(client, "me4@shop.vn")
    r = client.get("/api/v1/customers", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_customer_cannot_change_ticket_status(client):
    """Khách không được đổi trạng thái phiếu."""
    from app.services import warranty_service

    me = _make_user("me5@shop.vn")
    p = _make_product("SN-T4", customer_id=me.id)
    db = SessionLocal()
    ticket = warranty_service.create_ticket(db, p, me.id, "Lỗi")
    ticket_id = ticket.id
    db.close()

    token = _login(client, "me5@shop.vn")
    r = client.post(
        f"/api/v1/tickets/{ticket_id}/status",
        json={"new_status": "COMPLETED", "action_note": "tự tự đóng"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


def test_customer_creates_ticket_for_own_product(client):
    """Khách tạo được phiếu cho sản phẩm của chính mình."""
    me = _make_user("me6@shop.vn")
    p = _make_product("SN-T5", customer_id=me.id)
    token = _login(client, "me6@shop.vn")

    r = client.post(
        "/api/v1/tickets",
        json={"product_id": p.id, "issue_description": "Màn hình chớp"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["customer_id"] == me.id


def test_customer_cannot_create_ticket_for_others_product(client):
    """Khách không tạo được phiếu cho sản phẩm của người khác."""
    other = _make_user("other6@shop.vn")
    _make_user("me7@shop.vn")
    p_theirs = _make_product("SN-T6", customer_id=other.id)
    token = _login(client, "me7@shop.vn")

    r = client.post(
        "/api/v1/tickets",
        json={"product_id": p_theirs.id, "issue_description": "Cố tình"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


def test_public_warranty_lookup_does_not_leak_owner(client):
    """Tra cứu public không lộ thông tin chủ sở hữu."""
    owner = _make_user("owner7@shop.vn", name="Chủ Sở Hữu")
    _make_product("SN-LK", customer_id=owner.id)

    r = client.post("/api/v1/shop/warranty/lookup", json={"serial": "SN-LK"})
    assert r.status_code == 200
    body = r.json()
    assert body["found"] is True
    assert body["within_warranty"] == "YES"
    assert "owner7@shop.vn" not in r.text
    assert "Chủ Sở Hữu" not in r.text
