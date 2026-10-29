"""Pytest — AI endpoints: classify / warranty-history / progress-message / chat."""
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.main import app
from app.models.product import Product
from app.models.user import User
from app.models.warranty import WarrantyTicket
from app.services import warranty_service


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
def auth_headers(client):
    client.post("/api/v1/auth/register", json={
        "email": "ai@test.vn", "full_name": "Nguyễn Văn A", "password": "Test@123",
        "role": "customer",
    })
    r = client.post("/api/v1/auth/login", json={"email": "ai@test.vn", "password": "Test@123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def seed_product():
    db = SessionLocal()
    u = db.query(User).filter(User.email == "ai@test.vn").first()
    p = Product(
        name="TechNova Pro 15",
        serial_number="TND-AC10-001",
        category="Laptop",
        warranty_months=24,
        manufacture_date=date.today() - timedelta(days=30),
        customer_id=u.id if u else None,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    pid = p.id
    db.close()
    return pid


# === 1. Phân loại lỗi ===
def test_classify_endpoint_returns_frontend_contract(client, auth_headers):
    r = client.post(
        "/api/v1/ai/classify",
        json={"issue_description": "Máy bị dính nước và không bật được"},
        headers=auth_headers,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    # Frontend AIConsole đọc: classification, confidence, tags
    assert body["classification"] == "water"
    assert 0 < body["confidence"] <= 1
    assert isinstance(body["tags"], list) and len(body["tags"]) > 0
    assert body["label"]
    assert body["priority"] == "CRITICAL"
    assert body["warranty_eligible"] is False


def test_classify_requires_auth(client):
    r = client.post("/api/v1/ai/classify", json={"issue_description": "hỏng"})
    assert r.status_code in (401, 422)


def test_classify_rejects_empty_description(client, auth_headers):
    r = client.post("/api/v1/ai/classify", json={"issue_description": ""}, headers=auth_headers)
    assert r.status_code == 422


def test_error_catalog_endpoint(client, auth_headers):
    r = client.get("/api/v1/ai/error-catalog", headers=auth_headers)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 10
    codes = {i["code"] for i in items}
    assert "water" in codes and "screen_black" in codes


# === 2. Tóm tắt lịch sử bảo hành ===
def test_warranty_history_endpoint(client, auth_headers, seed_product):
    r = client.get("/api/v1/ai/warranty-history/TND-AC10-001", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["serial"] == "TND-AC10-001"
    assert body["warranty_status"] == "YES"
    assert body["ticket_count"] == 0
    assert "Lịch sử bảo hành" in body["summary"]


def test_warranty_history_404_unknown_serial(client, auth_headers):
    r = client.get("/api/v1/ai/warranty-history/NOPE-123", headers=auth_headers)
    assert r.status_code == 404


def test_warranty_history_forbidden_other_customer(client, seed_product):
    client.post("/api/v1/auth/register", json={
        "email": "other@test.vn", "full_name": "Other", "password": "Test@123",
        "role": "customer",
    })
    r = client.post("/api/v1/auth/login", json={"email": "other@test.vn", "password": "Test@123"})
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    r2 = client.get("/api/v1/ai/warranty-history/TND-AC10-001", headers=headers)
    assert r2.status_code == 403


# === 3. Tin nhắn tiến độ ===
def test_progress_message_endpoint(client, auth_headers):
    r = client.post(
        "/api/v1/ai/progress-message",
        json={
            "ticket_code": "WR-2026-0045",
            "status": "INSPECTION",
            "customer_name": "Nguyễn Văn A",
            "product_name": "TechNova Pro 15",
        },
        headers=auth_headers,
    )
    assert r.status_code == 200, r.text
    msg = r.json()["message"]
    assert "WR-2026-0045" in msg
    assert "TechNova Pro 15" in msg
    assert "Đang kiểm tra" in msg


def test_progress_message_all_statuses(client, auth_headers):
    for status in ["RECEIVED", "INSPECTION", "APPROVAL", "REPAIRING",
                   "COMPLETED", "REJECTED", "DELIVERED"]:
        r = client.post(
            "/api/v1/ai/progress-message",
            json={"ticket_code": "WR-1", "status": status},
            headers=auth_headers,
        )
        assert r.status_code == 200, status
        assert r.json()["message"], status


# === 4. Chatbot ===
def test_chat_intent_greeting(client, auth_headers):
    r = client.post("/api/v1/ai/chat", json={"message": "xin chào"}, headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["intent"] == "greeting"
    assert body["reply"]
    assert isinstance(body["suggestions"], list)


def test_chat_faq_cost(client, auth_headers):
    r = client.post("/api/v1/ai/chat", json={"message": "chi phi sua chua bao nhiu"}, headers=auth_headers)
    body = r.json()
    assert body["intent"] == "faq_cost"
    assert "Miễn phí" in body["reply"]


def test_chat_error_classification(client, auth_headers):
    r = client.post(
        "/api/v1/ai/chat",
        json={"message": "máy bị dính nước và không bật được"},
        headers=auth_headers,
    )
    body = r.json()
    assert body["intent"] == "error_classification"
    assert "Vào nước" in body["reply"]
    assert body["data"]["error_code"] == "water"


def test_chat_warranty_lookup_by_serial(client, auth_headers, seed_product):
    r = client.post(
        "/api/v1/ai/chat",
        json={"message": "serial TND-AC10-001 còn bảo hành không"},
        headers=auth_headers,
    )
    body = r.json()
    assert "TechNova Pro 15" in body["reply"]
    assert body["data"]["within_warranty"] == "YES"


def test_chat_ticket_status_by_code(client, auth_headers, seed_product):
    db = SessionLocal()
    p = db.query(Product).filter(Product.serial_number == "TND-AC10-001").first()
    u = db.query(User).filter(User.email == "ai@test.vn").first()
    t = warranty_service.create_ticket(db, p, u.id, "Màn hình nhấp nháy")
    code = t.ticket_code
    db.close()

    r = client.post(
        "/api/v1/ai/chat",
        json={"message": f"phiếu {code} xử lý thế nào rồi"},
        headers=auth_headers,
    )
    body = r.json()
    assert body["intent"] == "ticket_status"
    assert code in body["reply"]
    assert body["data"]["status"] == "RECEIVED"


def test_chat_unknown_serial_graceful(client, auth_headers):
    r = client.post(
        "/api/v1/ai/chat",
        json={"message": "serial TND-UNKNOWN-999 còn bảo hành không"},
        headers=auth_headers,
    )
    body = r.json()
    assert "Không tìm thấy" in body["reply"]


def test_chat_requires_auth(client):
    r = client.post("/api/v1/ai/chat", json={"message": "xin chào"})
    assert r.status_code in (401, 422)
