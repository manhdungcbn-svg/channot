"""Pytest — test các chức năng cốt lõi."""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.main import app
from app.models.product import Product
from app.models.user import User
from app.models.wallet import Wallet
from app.services import ai_service, warranty_service, wallet_service


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


def test_password_hash():
    h = hash_password("abc123")
    assert h != "abc123"
    from app.core.security import verify_password
    assert verify_password("abc123", h) is True
    assert verify_password("wrong", h) is False


def test_warranty_check_within():
    db = SessionLocal()
    p = Product(
        name="Test", serial_number="T-1", category="Network",
        warranty_months=12, manufacture_date=date.today() - timedelta(days=10),
    )
    db.add(p)
    db.commit()
    result = warranty_service.check_warranty(p)
    assert result.within is True


def test_warranty_check_expired():
    db = SessionLocal()
    p = Product(
        name="Test2", serial_number="T-2", category="Network",
        warranty_months=12, manufacture_date=date.today() - timedelta(days=400),
    )
    db.add(p)
    db.commit()
    result = warranty_service.check_warranty(p)
    assert result.within is False


def test_ai_classify_mock():
    assert ai_service.classify_issue("Router không lên nguồn, đèn tắt") == "HARDWARE"
    assert ai_service.classify_issue("Wifi mất kết nối, không vào mạng") == "NETWORK"
    assert ai_service.classify_issue("Vào nước do trần nhà dột") == "PHYSICAL"
    assert ai_service.classify_issue("Cục sạc nóng quá, có mùi khét") == "POWER"


def test_ai_anonymize():
    s = ai_service.anonymize("Liên hệ 0901234567 hoặc abc@gmail.com")
    assert "0901234567" not in s
    assert "abc@gmail.com" not in s
    assert "[REDACTED_PHONE]" in s
    assert "[REDACTED_EMAIL]" in s


def test_wallet_topup_and_payment_atomic():
    db = SessionLocal()
    u = User(email="x@x.vn", full_name="X", role="customer", hashed_password=hash_password("a"))
    db.add(u)
    db.commit()
    db.refresh(u)
    wallet_service.topup(db, u.id, Decimal("100000"))
    wallet = wallet_service.get_or_create_wallet(db, u.id)
    assert Decimal(str(wallet.balance)) == Decimal("100000")
    wallet_service.pay(db, u.id, Decimal("30000"), tx_type="PAYMENT_WARRANTY_REJECTED", reference="WR-1")
    db.refresh(wallet)
    assert Decimal(str(wallet.balance)) == Decimal("70000")


def test_wallet_insufficient_balance_raises():
    db = SessionLocal()
    u = User(email="y@y.vn", full_name="Y", role="customer", hashed_password=hash_password("a"))
    db.add(u)
    db.commit()
    db.refresh(u)
    wallet_service.topup(db, u.id, Decimal("10000"))
    with pytest.raises(wallet_service.InsufficientBalanceError):
        wallet_service.pay(db, u.id, Decimal("50000"), tx_type="PAYMENT_WARRANTY_REJECTED")


def test_ticket_status_transition():
    db = SessionLocal()
    u = User(email="a@a.vn", full_name="A", role="customer", hashed_password=hash_password("a"))
    p = Product(
        name="X", serial_number="S-1", category="Net",
        warranty_months=12, manufacture_date=date.today(),
    )
    db.add_all([u, p])
    db.commit()
    db.refresh(u)
    db.refresh(p)
    t = warranty_service.create_ticket(db, p, u.id, "Router không lên nguồn")
    assert t.status == "RECEIVED"
    # Invalid
    with pytest.raises(ValueError):
        warranty_service.update_status(db, t, "COMPLETED", "skip")
    # Valid
    warranty_service.update_status(db, t, "INSPECTION", "Bắt đầu kiểm tra")
    assert t.status == "INSPECTION"


def test_ticket_workflow_full():
    db = SessionLocal()
    u = User(email="b@b.vn", full_name="B", role="customer", hashed_password=hash_password("a"))
    p = Product(name="X", serial_number="S-2", category="Net", warranty_months=12, manufacture_date=date.today())
    db.add_all([u, p])
    db.commit()
    db.refresh(u); db.refresh(p)
    t = warranty_service.create_ticket(db, p, u.id, "Wifi yếu")
    tech = User(email="t@t.vn", full_name="T", role="technician", hashed_password=hash_password("a"))
    db.add(tech); db.commit(); db.refresh(tech)
    warranty_service.assign_technician(db, t, tech.id)
    warranty_service.update_status(db, t, "INSPECTION", "Inspect")
    warranty_service.update_status(db, t, "REPAIRING", "Replace chip")
    warranty_service.update_status(db, t, "COMPLETED", "Done")
    assert t.status == "COMPLETED"


def test_progress_message_for_statuses():
    assert "tiếp nhận" in ai_service.generate_progress_message(None, "WR-1", "RECEIVED").lower()
    assert "từ chối" in ai_service.generate_progress_message(None, "WR-1", "REJECTED").lower()


def test_auth_login_and_me(client):
    # tạo user
    client.post("/api/v1/auth/register", json={
        "email": "test@test.vn", "full_name": "Test User", "password": "Test@123", "role": "customer"
    })
    r = client.post("/api/v1/auth/login", json={"email": "test@test.vn", "password": "Test@123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    r2 = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert r2.json()["email"] == "test@test.vn"


def test_auth_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "test2@test.vn", "full_name": "T2", "password": "Test@123", "role": "customer"
    })
    r = client.post("/api/v1/auth/login", json={"email": "test2@test.vn", "password": "WRONG"})
    assert r.status_code == 401


def test_wallet_topup_via_api(client):
    client.post("/api/v1/auth/register", json={
        "email": "cust@c.vn", "full_name": "C", "password": "Cust@123", "role": "customer"
    })
    r = client.post("/api/v1/auth/login", json={"email": "cust@c.vn", "password": "Cust@123"})
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r2 = client.post("/api/v1/wallet/topup", json={"amount": 200000}, headers=headers)
    assert r2.status_code == 200
    r3 = client.get("/api/v1/wallet", headers=headers)
    assert Decimal(str(r3.json()["balance"])) == Decimal("200000")