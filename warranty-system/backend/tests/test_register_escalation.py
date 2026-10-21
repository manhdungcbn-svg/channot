"""S1 fix — test chặn privilege escalation qua POST /auth/register."""
import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.main import app
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


@pytest.fixture
def admin_user():
    db = SessionLocal()
    try:
        admin = User(
            email="admin@test.vn",
            full_name="Test Admin",
            role="admin",
            hashed_password=hash_password("Admin@123"),
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return admin
    finally:
        db.close()


def _admin_token(client, admin_user):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.vn", "password": "Admin@123"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_register_public_ignores_admin_role(client):
    """S1: POST /auth/register với role=admin phải trả user role=customer."""
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": "attacker@evil.com",
            "full_name": "Attacker",
            "password": "Pass@123",
            "role": "admin",
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["role"] == "customer", (
        f"Privilege escalation: payload role=admin nhưng user tạo ra phải là customer. "
        f"Thực tế: {r.json()['role']}"
    )


def test_register_public_ignores_staff_role(client):
    """S1: role=staff trong payload cũng bị bỏ qua."""
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": "staff_fake@test.vn",
            "full_name": "Fake Staff",
            "password": "Pass@123",
            "role": "staff",
        },
    )
    assert r.status_code == 201
    assert r.json()["role"] == "customer"


def test_register_public_with_no_role_works(client):
    """Sanity check: đăng ký thường (không gửi role) vẫn hoạt động."""
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": "normal@test.vn",
            "full_name": "Normal User",
            "password": "Pass@123",
        },
    )
    assert r.status_code == 201
    assert r.json()["role"] == "customer"


def test_register_public_with_customer_role_works(client):
    """Sanity check: role=customer vẫn OK."""
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": "happy@test.vn",
            "full_name": "Happy Customer",
            "password": "Pass@123",
            "role": "customer",
        },
    )
    assert r.status_code == 201
    assert r.json()["role"] == "customer"


def test_admin_can_create_user_with_any_role(client, admin_user):
    """Endpoint mới: admin tạo được user với role bất kỳ."""
    token = _admin_token(client, admin_user)
    r = client.post(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "newstaff@test.vn",
            "full_name": "New Staff",
            "password": "Pass@123",
            "role": "staff",
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["role"] == "staff"


def test_admin_can_create_technician(client, admin_user):
    token = _admin_token(client, admin_user)
    r = client.post(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "newtech@test.vn",
            "full_name": "New Tech",
            "password": "Pass@123",
            "role": "technician",
        },
    )
    assert r.status_code == 201
    assert r.json()["role"] == "technician"


def test_non_admin_cannot_create_user(client):
    """Không phải admin gọi POST /auth/users phải bị 403."""
    # Tạo 1 user customer trước
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "noadmin@test.vn",
            "full_name": "No Admin",
            "password": "Pass@123",
        },
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "noadmin@test.vn", "password": "Pass@123"},
    )
    token = r.json()["access_token"]

    r = client.post(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "should_fail@test.vn",
            "full_name": "Should Fail",
            "password": "Pass@123",
            "role": "admin",
        },
    )
    assert r.status_code == 403, f"Phải 403 (Forbidden) nhưng thực tế {r.status_code}: {r.text}"


def test_unauthenticated_cannot_call_admin_endpoint(client):
    """Không có token gọi POST /auth/users phải bị 401."""
    r = client.post(
        "/api/v1/auth/users",
        json={
            "email": "noauth@test.vn",
            "full_name": "No Auth",
            "password": "Pass@123",
            "role": "admin",
        },
    )
    assert r.status_code == 401


def test_admin_create_user_rejects_invalid_role(client, admin_user):
    """role không nằm trong whitelist phải bị 400."""
    token = _admin_token(client, admin_user)
    r = client.post(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "email": "bogus@test.vn",
            "full_name": "Bogus",
            "password": "Pass@123",
            "role": "superadmin",  # không hợp lệ
        },
    )
    assert r.status_code == 400