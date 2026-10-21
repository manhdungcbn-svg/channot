"""S3 fix — test chống brute-force login."""
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
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
def customer_user():
    db = SessionLocal()
    try:
        u = User(
            email="khach@test.vn",
            full_name="Test Khach",
            role="customer",
            hashed_password=hash_password("Dung@123"),
        )
        db.add(u)
        db.commit()
        db.refresh(u)
        return u
    finally:
        db.close()


def test_login_success_resets_attempts(client, customer_user):
    """Sanity: login đúng vẫn OK."""
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "khach@test.vn", "password": "Dung@123"},
    )
    assert r.status_code == 200


def test_login_lockout_after_max_attempts(client, customer_user):
    """S3: sai MAX_FAILED_LOGIN_ATTEMPTS lần → lần kế tiếp trả 423."""
    max_attempts = settings.MAX_FAILED_LOGIN_ATTEMPTS  # default 5

    # Sai max_attempts lần liên tiếp → mỗi lần phải trả 401
    for i in range(max_attempts):
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "khach@test.vn", "password": "wrong_password"},
        )
        assert r.status_code == 401, f"Lần {i+1}: phải 401 nhưng {r.status_code}"

    # Lần thứ (max+1) phải bị 423
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "khach@test.vn", "password": "Dung@123"},  # dù đúng password
    )
    assert r.status_code == 423, (
        f"Phải 423 (Locked) sau {max_attempts} lần sai nhưng thực tế {r.status_code}: {r.text}"
    )


def test_login_lockout_message_contains_remaining_seconds(client, customer_user):
    max_attempts = settings.MAX_FAILED_LOGIN_ATTEMPTS
    for _ in range(max_attempts):
        client.post(
            "/api/v1/auth/login",
            json={"email": "khach@test.vn", "password": "wrong"},
        )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "khach@test.vn", "password": "Dung@123"},
    )
    assert r.status_code == 423
    # Phase C: lỗi giờ trả envelope {success, error:{message, code}}
    body = r.json()
    assert body["success"] is False
    assert "giây" in body["error"]["message"], r.text


def test_login_attempts_isolated_per_email(client, customer_user):
    """S3: khóa email A không ảnh hưởng email B."""
    # Tạo email B
    db = SessionLocal()
    try:
        other = User(
            email="other@test.vn",
            full_name="Other",
            role="customer",
            hashed_password=hash_password("Other@123"),
        )
        db.add(other)
        db.commit()
    finally:
        db.close()

    max_attempts = settings.MAX_FAILED_LOGIN_ATTEMPTS
    # Khóa email A
    for _ in range(max_attempts):
        client.post(
            "/api/v1/auth/login",
            json={"email": "khach@test.vn", "password": "wrong"},
        )

    # Email B vẫn login bình thường
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "other@test.vn", "password": "Other@123"},
    )
    assert r.status_code == 200


def test_login_form_endpoint_also_rate_limited(client, customer_user):
    """S3: endpoint /login/form cũng bị rate-limit (OAuth2PasswordRequestForm)."""
    max_attempts = settings.MAX_FAILED_LOGIN_ATTEMPTS
    for _ in range(max_attempts):
        r = client.post(
            "/api/v1/auth/login/form",
            data={"username": "khach@test.vn", "password": "wrong"},
        )
        assert r.status_code == 401
    r = client.post(
        "/api/v1/auth/login/form",
        data={"username": "khach@test.vn", "password": "Dung@123"},
    )
    assert r.status_code == 423