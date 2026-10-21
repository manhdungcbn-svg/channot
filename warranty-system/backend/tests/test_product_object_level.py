"""S5c fix — test object-level check cho /products."""
import datetime
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


def _make_user(email, role, password="Test@123"):
    db = SessionLocal()
    try:
        u = User(
            email=email,
            full_name=email.split("@")[0],
            role=role,
            hashed_password=hash_password(password),
        )
        db.add(u)
        db.commit()
        db.refresh(u)
        return u
    finally:
        db.close()


def _login(client, email, password="Test@123"):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _setup_world():
    cust_a = _make_user("a@kh.vn", "customer")
    cust_b = _make_user("b@kh.vn", "customer")
    staff = _make_user("staff@sys.vn", "staff")
    today = datetime.date.today()
    db = SessionLocal()
    try:
        p1 = Product(name="P1", serial_number="SN-001", category="X", warranty_months=12,
                      manufacture_date=today, customer_id=cust_a.id)
        p2 = Product(name="P2", serial_number="SN-002", category="X", warranty_months=12,
                      manufacture_date=today, customer_id=cust_b.id)
        p3 = Product(name="P3", serial_number="SN-003", category="X", warranty_months=12,
                      manufacture_date=today, customer_id=None)  # orphan
        db.add_all([p1, p2, p3])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        db.refresh(p3)
        return {"cust_a": cust_a.email, "cust_b": cust_b.email, "staff": staff.email,
                "p1_sn": p1.serial_number, "p2_sn": p2.serial_number, "p3_sn": p3.serial_number,
                "p1_id": p1.id, "p2_id": p2.id, "p3_id": p3.id}
    finally:
        db.close()


# ===== list =====

def test_customer_sees_only_own_products(client):
    """Customer A chỉ thấy sản phẩm của mình."""
    world = _setup_world()
    token = _login(client, world["cust_a"])
    r = client.get("/api/v1/products", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    items = r.json()
    assert len(items) == 1
    assert items[0]["serial_number"] == world["p1_sn"]


def test_customer_cannot_see_other_customer_products(client):
    """S5c: Customer A KHÔNG thấy sản phẩm của customer B trong list."""
    world = _setup_world()
    token = _login(client, world["cust_b"])
    r = client.get("/api/v1/products", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["serial_number"] == world["p2_sn"]


def test_staff_sees_all_products(client):
    """Staff thấy tất cả sản phẩm."""
    world = _setup_world()
    token = _login(client, world["staff"])
    r = client.get("/api/v1/products", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.json()) == 3


# ===== get-by-serial =====

def test_customer_can_get_own_product_by_serial(client):
    """Customer A xem được sản phẩm của mình qua serial."""
    world = _setup_world()
    token = _login(client, world["cust_a"])
    r = client.get(
        f"/api/v1/products/serial/{world['p1_sn']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text


def test_customer_cannot_get_other_product_by_serial(client):
    """S5c: Customer A xem sản phẩm của customer B qua serial → 403."""
    world = _setup_world()
    token = _login(client, world["cust_a"])
    r = client.get(
        f"/api/v1/products/serial/{world['p2_sn']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403, r.text


def test_staff_can_get_any_product_by_serial(client):
    """Staff xem được sản phẩm bất kỳ qua serial."""
    world = _setup_world()
    token = _login(client, world["staff"])
    r = client.get(
        f"/api/v1/products/serial/{world['p2_sn']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200


def test_get_nonexistent_serial_returns_404(client):
    """Serial không tồn tại → 404 (không phải 403)."""
    world = _setup_world()
    token = _login(client, world["cust_a"])
    r = client.get(
        "/api/v1/products/serial/SN-NONEXIST",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404