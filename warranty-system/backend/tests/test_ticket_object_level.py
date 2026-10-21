"""S5 fix — test object-level check (IDOR) cho /tickets."""
import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.main import app
from app.models.product import Product
from app.models.user import User
from app.models.warranty import WarrantyTicket


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
            phone="0900000000",
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
    """Tạo 2 customer + 2 technician + 1 staff + 1 admin + 2 ticket (mỗi customer một cái, gán technician riêng)."""
    cust_a = _make_user("a@kh.vn", "customer")  # role phải là "customer"
    cust_b = _make_user("b@kh.vn", "customer")  # role phải là "customer"
    tech_a = _make_user("ta@tech.vn", "technician")  # id = 3
    tech_b = _make_user("tb@tech.vn", "technician")  # id = 4
    staff = _make_user("staff@sys.vn", "staff")  # id = 5
    admin = _make_user("admin@sys.vn", "admin")  # id = 6

    # 2 product, mỗi customer một
    db = SessionLocal()
    try:
        p1 = Product(name="P1", serial_number="SN-001", category="X", warranty_months=12,
                      manufacture_date=__import__("datetime").date.today(),
                      customer_id=cust_a.id)
        p2 = Product(name="P2", serial_number="SN-002", category="X", warranty_months=12,
                      manufacture_date=__import__("datetime").date.today(),
                      customer_id=cust_b.id)
        db.add_all([p1, p2])
        db.flush()

        t_a = WarrantyTicket(
            ticket_code="WR-A", product_id=p1.id, customer_id=cust_a.id,
            technician_id=tech_a.id, issue_description="Lỗi A", payment_status="UNPAID",
            status="INSPECTION",  # để test chuyển INSPECTION → REPAIRING
        )
        t_b = WarrantyTicket(
            ticket_code="WR-B", product_id=p2.id, customer_id=cust_b.id,
            technician_id=tech_b.id, issue_description="Lỗi B", payment_status="UNPAID",
            status="INSPECTION",  # để test chuyển INSPECTION → REPAIRING
        )
        db.add_all([t_a, t_b])
        db.commit()
        db.refresh(t_a)
        db.refresh(t_b)
        return {"t_a_id": t_a.id, "t_b_id": t_b.id,
                "cust_a": cust_a.email, "cust_b": cust_b.email,
                "tech_a": tech_a.email, "tech_b": tech_b.email,
                "staff": staff.email, "admin": admin.email}
    finally:
        db.close()


# ===== S5a: /tickets/{id}/status =====

def test_tech_a_can_change_status_on_own_ticket(client):
    """Tech A được sửa phiếu của mình."""
    world = _setup_world()
    token = _login(client, world["tech_a"])
    r = client.post(
        f"/api/v1/tickets/{world['t_a_id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_status": "REPAIRING", "action_note": "Tech A sửa"},
    )
    assert r.status_code == 200, r.text


def test_tech_a_cannot_change_status_on_tech_b_ticket(client):
    """S5a: Tech A KHÔNG được sửa phiếu của tech B."""
    world = _setup_world()
    token = _login(client, world["tech_a"])
    r = client.post(
        f"/api/v1/tickets/{world['t_b_id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_status": "REPAIRING", "action_note": "hack"},
    )
    assert r.status_code == 403, f"Phải 403 nhưng {r.status_code}: {r.text}"


def test_staff_can_change_any_ticket_status(client):
    """Staff được sửa mọi phiếu (RBAC cao hơn)."""
    world = _setup_world()
    token = _login(client, world["staff"])
    r = client.post(
        f"/api/v1/tickets/{world['t_a_id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_status": "REPAIRING", "action_note": "staff edit"},
    )
    assert r.status_code == 200


def test_admin_can_change_any_ticket_status(client):
    """Admin được sửa mọi phiếu."""
    world = _setup_world()
    token = _login(client, world["admin"])
    r = client.post(
        f"/api/v1/tickets/{world['t_b_id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_status": "REPAIRING", "action_note": "admin done"},
    )
    assert r.status_code == 200, r.text


def test_customer_cannot_call_status_endpoint(client):
    """Customer không có quyền gọi endpoint status (RBAC)."""
    world = _setup_world()
    token = _login(client, world["cust_a"])
    r = client.post(
        f"/api/v1/tickets/{world['t_a_id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"new_status": "COMPLETED", "action_note": "hack"},
    )
    assert r.status_code == 403


# ===== S5b: /tickets/{id}/summarize =====

def test_customer_can_summarize_own_ticket(client, monkeypatch):
    """Customer xem được tóm tắt phiếu của mình."""
    # Mock summarize để không gọi AI thật
    from app.services import warranty_service
    monkeypatch.setattr(warranty_service, "summarize_for_technician",
                         lambda db, t: "Mock summary")

    world = _setup_world()
    token = _login(client, world["cust_a"])
    r = client.post(
        f"/api/v1/tickets/{world['t_a_id']}/summarize",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text


def test_customer_cannot_summarize_other_ticket(client, monkeypatch):
    """S5b: Customer A KHÔNG xem được tóm tắt phiếu của customer B."""
    from app.services import warranty_service
    monkeypatch.setattr(warranty_service, "summarize_for_technician",
                         lambda db, t: "Mock")

    world = _setup_world()
    token = _login(client, world["cust_a"])
    r = client.post(
        f"/api/v1/tickets/{world['t_b_id']}/summarize",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403, f"Phải 403 nhưng {r.status_code}: {r.text}"


def test_assigned_technician_can_summarize(client, monkeypatch):
    """Technician được phân công xem được tóm tắt phiếu."""
    from app.services import warranty_service
    monkeypatch.setattr(warranty_service, "summarize_for_technician",
                         lambda db, t: "Mock")

    world = _setup_world()
    token = _login(client, world["tech_a"])
    r = client.post(
        f"/api/v1/tickets/{world['t_a_id']}/summarize",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200


def test_unassigned_technician_cannot_summarize(client, monkeypatch):
    """S5b: Tech B KHÔNG xem được tóm tắt phiếu của tech A."""
    from app.services import warranty_service
    monkeypatch.setattr(warranty_service, "summarize_for_technician",
                         lambda db, t: "Mock")

    world = _setup_world()
    token = _login(client, world["tech_b"])
    r = client.post(
        f"/api/v1/tickets/{world['t_a_id']}/summarize",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


def test_staff_can_summarize_any_ticket(client, monkeypatch):
    """Staff xem được tóm tắt mọi phiếu."""
    from app.services import warranty_service
    monkeypatch.setattr(warranty_service, "summarize_for_technician",
                         lambda db, t: "Mock")

    world = _setup_world()
    token = _login(client, world["staff"])
    r = client.post(
        f"/api/v1/tickets/{world['t_a_id']}/summarize",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200