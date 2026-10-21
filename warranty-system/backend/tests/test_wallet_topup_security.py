"""P0 hardening — test chặn top-up tự khai số tiền ở production.

Quy tắc (xem SECURITY_ROADMAP.md mục 2 — Giai đoạn 1):
- ALLOW_SANDBOX_TOPUP=true  (mặc định dev/test) → endpoint chấp nhận request
  không có `payment_provider_ref` (sandbox, ghi reference = "SANDBOX_TOPUP").
- ALLOW_SANDBOX_TOPUP=false (production) → endpoint TỪ CHỐI request không có
  `payment_provider_ref`. Phải có chứng từ từ cổng thanh toán.
"""
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
            email="khach@topup.vn",
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


def _login(client, email="khach@topup.vn", password="Dung@123"):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


# ===== Sandbox mode (mặc định) =====

def test_sandbox_topup_without_ref_is_allowed(client, customer_user, monkeypatch):
    """Mặc định ALLOW_SANDBOX_TOPUP=true → request không có ref vẫn OK."""
    # Đảm bảo môi trường sandbox
    monkeypatch.setattr(settings, "ALLOW_SANDBOX_TOPUP", True)

    token = _login(client)
    r = client.post(
        "/api/v1/wallet/topup",
        json={"amount": 100000},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    # amount trả về dạng string "100000.00" (Numeric column → str)
    assert str(r.json()["amount"]) == "100000.00"


def test_sandbox_topup_with_explicit_ref(client, customer_user, monkeypatch):
    """Sandbox mode + có payment_provider_ref → vẫn OK, ghi reference thật."""
    monkeypatch.setattr(settings, "ALLOW_SANDBOX_TOPUP", True)

    token = _login(client)
    r = client.post(
        "/api/v1/wallet/topup",
        json={"amount": 100000, "payment_provider_ref": "PAY-12345"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["reference"] == "PAY-12345"


# ===== Production mode (ALLOW_SANDBOX_TOPUP=false) =====

def test_production_topup_without_ref_is_rejected(client, customer_user, monkeypatch):
    """P0: Production KHÔNG cho phép top-up không có payment_provider_ref."""
    monkeypatch.setattr(settings, "ALLOW_SANDBOX_TOPUP", False)

    token = _login(client)
    r = client.post(
        "/api/v1/wallet/topup",
        json={"amount": 999999999},  # tự khai số tiền lớn
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403, f"Phải 403 nhưng {r.status_code}: {r.text}"
    # Envelope: {"success": false, "error": {"message": "...", "code": 403}}
    body = r.json()
    assert body["success"] is False
    assert "payment_provider_ref" in body["error"]["message"]


def test_production_topup_with_ref_is_accepted(client, customer_user, monkeypatch):
    """Production + có payment_provider_ref → OK, ghi reference thật."""
    monkeypatch.setattr(settings, "ALLOW_SANDBOX_TOPUP", False)

    token = _login(client)
    r = client.post(
        "/api/v1/wallet/topup",
        json={"amount": 100000, "payment_provider_ref": "VNPAY-TXN-999"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["reference"] == "VNPAY-TXN-999"
    assert str(r.json()["amount"]) == "100000.00"


def test_production_topup_with_empty_string_ref_is_rejected(client, customer_user, monkeypatch):
    """Reference rỗng coi như không có → vẫn bị chặn."""
    monkeypatch.setattr(settings, "ALLOW_SANDBOX_TOPUP", False)

    token = _login(client)
    r = client.post(
        "/api/v1/wallet/topup",
        json={"amount": 50000, "payment_provider_ref": ""},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


# ===== Auth + validation vẫn giữ nguyên =====

def test_topup_unauthenticated_returns_401(client, monkeypatch):
    """Không có token vẫn bị 401 (auth check trước security check)."""
    monkeypatch.setattr(settings, "ALLOW_SANDBOX_TOPUP", False)
    r = client.post(
        "/api/v1/wallet/topup",
        json={"amount": 100, "payment_provider_ref": "X"},
    )
    assert r.status_code == 401


def test_topup_invalid_amount_returns_422(client, customer_user, monkeypatch):
    """amount <= 0 vẫn bị Pydantic reject 422."""
    monkeypatch.setattr(settings, "ALLOW_SANDBOX_TOPUP", True)
    token = _login(client)
    r = client.post(
        "/api/v1/wallet/topup",
        json={"amount": 0, "payment_provider_ref": "X"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422
