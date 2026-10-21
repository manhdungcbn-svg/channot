"""S4 fix — test verify Supabase JWT signature local.

Test strategy: không gọi Supabase thật. Tạo RSA keypair trong test, fake Supabase endpoint
hoặc monkeypatch _fetch_jwks() để trả về JWK của keypair.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from jose import jwt
from jose.utils import long_to_base64

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.supabase_jwt import (
    JWTVerificationError,
    _extract_project_ref,
    _get_public_key,
    verify_supabase_jwt,
)
from app.main import app
from app.models.user import User


@pytest.fixture(autouse=True)
def fresh_db():
    # conftest.py đã set env (SECRET_KEY, SUPABASE_URL, AI_MODE) trước khi
    # app.core.config được import. Settings instance đã load đúng.
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def rsa_keys():
    """Tạo RSA keypair cho cả test session."""
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_numbers = public_key.public_numbers()
    jwk = {
        "kty": "RSA",
        "kid": "test-key-1",
        "use": "sig",
        "alg": "RS256",
        "n": long_to_base64(public_numbers.n).decode(),
        "e": long_to_base64(public_numbers.e).decode(),
    }
    return {"private_pem": private_pem, "jwk": jwk, "kid": "test-key-1"}


def _build_token(rsa_keys, claims: dict, headers: dict | None = None) -> str:
    """Build JWT ký bằng private key trong fixture."""
    headers = headers or {"kid": rsa_keys["kid"]}
    return jwt.encode(
        claims,
        rsa_keys["private_pem"],
        algorithm="RS256",
        headers=headers,
    )


@pytest.fixture
def patched_jwks(rsa_keys):
    """Monkeypatch _fetch_jwks để trả về JWK giả."""
    with patch(
        "app.core.supabase_jwt._fetch_jwks",
        return_value={"keys": [rsa_keys["jwk"]]},
    ):
        # Clear cache để test fetch lại
        from app.core import supabase_jwt
        supabase_jwt._JWKS_CACHE.clear()
        yield rsa_keys


# ===== Unit tests cho verify_supabase_jwt =====

def test_verify_supabase_session_token_valid(patched_jwks):
    """Token Supabase session hợp lệ → verify OK."""
    project_ref = _extract_project_ref()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-abc",
        "email": "khach@supabase.vn",
        "aud": "authenticated",
        "iss": f"https://{project_ref}.supabase.co/auth/v1",
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "iat": int(now.timestamp()),
    }
    token = _build_token(patched_jwks, claims)

    payload = verify_supabase_jwt(token)
    assert payload["email"] == "khach@supabase.vn"
    assert payload["sub"] == "user-abc"


def test_verify_supabase_token_wrong_audience(patched_jwks):
    """Token có audience sai → raise JWTVerificationError."""
    project_ref = _extract_project_ref()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-abc",
        "email": "khach@supabase.vn",
        "aud": "wrong-audience",  # SAI
        "iss": f"https://{project_ref}.supabase.co/auth/v1",
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    token = _build_token(patched_jwks, claims)
    with pytest.raises(JWTVerificationError):
        verify_supabase_jwt(token)


def test_verify_supabase_token_wrong_issuer(patched_jwks):
    """Token có issuer sai → raise."""
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-abc",
        "email": "khach@supabase.vn",
        "aud": "authenticated",
        "iss": "https://attacker.supabase.co/auth/v1",  # SAI
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    token = _build_token(patched_jwks, claims)
    with pytest.raises(JWTVerificationError):
        verify_supabase_jwt(token)


def test_verify_supabase_token_expired(patched_jwks):
    """Token hết hạn → raise."""
    project_ref = _extract_project_ref()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-abc",
        "email": "khach@supabase.vn",
        "aud": "authenticated",
        "iss": f"https://{project_ref}.supabase.co/auth/v1",
        "exp": int((now - timedelta(hours=1)).timestamp()),  # HẾT HẠN
    }
    token = _build_token(patched_jwks, claims)
    with pytest.raises(JWTVerificationError):
        verify_supabase_jwt(token)


def test_verify_token_with_wrong_signature(patched_jwks, rsa_keys):
    """Token ký bằng key khác → raise."""
    # Tạo key khác
    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    other_pem = other_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()

    project_ref = _extract_project_ref()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-abc",
        "email": "khach@supabase.vn",
        "aud": "authenticated",
        "iss": f"https://{project_ref}.supabase.co/auth/v1",
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    # Ký bằng key khác, nhưng header kid vẫn test-key-1 (giả mạo)
    token = jwt.encode(claims, other_pem, algorithm="RS256", headers={"kid": rsa_keys["kid"]})
    with pytest.raises(JWTVerificationError):
        verify_supabase_jwt(token)


def test_verify_token_not_rs256(patched_jwks):
    """Token HS256 (không phải RS256) → raise."""
    project_ref = _extract_project_ref()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-abc",
        "email": "khach@supabase.vn",
        "aud": "authenticated",
        "iss": f"https://{project_ref}.supabase.co/auth/v1",
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    # Ký HS256 bằng secret key
    token = jwt.encode(claims, settings.SECRET_KEY, algorithm="HS256",
                        headers={"kid": "test-key-1"})
    with pytest.raises(JWTVerificationError):
        verify_supabase_jwt(token)


def test_verify_token_garbage(patched_jwks):
    """Token không phải JWT → raise."""
    with pytest.raises(JWTVerificationError):
        verify_supabase_jwt("not-a-jwt-at-all")


def test_verify_token_empty():
    """Token rỗng → raise."""
    with pytest.raises(JWTVerificationError):
        verify_supabase_jwt("")


# ===== Endpoint integration tests =====

def test_supabase_endpoint_rejects_unsigned_token(client):
    """Endpoint /auth/supabase-token từ chối token không hợp lệ."""
    # id_token là query param trong FastAPI signature
    r = client.post(
        "/api/v1/auth/supabase-token?id_token=garbage&provider=google",
    )
    assert r.status_code == 401, r.text


def test_supabase_endpoint_rejects_expired_token(client, patched_jwks):
    """Endpoint từ chối token hết hạn."""
    project_ref = _extract_project_ref()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-abc",
        "email": "khach_new@supabase.vn",
        "aud": "authenticated",
        "iss": f"https://{project_ref}.supabase.co/auth/v1",
        "exp": int((now - timedelta(hours=1)).timestamp()),
    }
    token = _build_token(patched_jwks, claims)
    r = client.post(
        f"/api/v1/auth/supabase-token?id_token={token}&provider=google",
    )
    assert r.status_code == 401, r.text


def test_supabase_endpoint_creates_user_from_valid_token(client, patched_jwks):
    """Token hợp lệ → tạo user + trả access_token."""
    project_ref = _extract_project_ref()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-abc-new",
        "email": "khanh_new@supabase.vn",
        "aud": "authenticated",
        "iss": f"https://{project_ref}.supabase.co/auth/v1",
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "user_metadata": {"full_name": "Khách Mới"},
    }
    token = _build_token(patched_jwks, claims)
    r = client.post(
        f"/api/v1/auth/supabase-token?id_token={token}&provider=google",
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["user"]["email"] == "khanh_new@supabase.vn"
    assert body["user"]["role"] == "customer"
    assert "access_token" in body

    # Verify user đã tạo trong DB
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == "khanh_new@supabase.vn").first()
        assert u is not None
        assert u.role == "customer"
        assert u.is_seed == False  # noqa: E712
    finally:
        db.close()


def test_supabase_endpoint_logs_in_existing_user(client, patched_jwks):
    """Token hợp lệ cho user đã tồn tại → đăng nhập luôn."""
    # Tạo user trước
    db = SessionLocal()
    try:
        u = User(
            email="existing@supabase.vn",
            full_name="Existing",
            role="customer",
            hashed_password="x",
        )
        db.add(u)
        db.commit()
    finally:
        db.close()

    project_ref = _extract_project_ref()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "user-existing",
        "email": "existing@supabase.vn",
        "aud": "authenticated",
        "iss": f"https://{project_ref}.supabase.co/auth/v1",
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    token = _build_token(patched_jwks, claims)
    r = client.post(
        f"/api/v1/auth/supabase-token?id_token={token}&provider=google",
    )
    assert r.status_code == 200, r.text
    assert r.json()["user"]["email"] == "existing@supabase.vn"