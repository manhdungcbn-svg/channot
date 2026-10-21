"""S4 fix — verify Supabase JWT signature local bằng JWKS, không gọi HTTP /verify.

Hỗ trợ 2 loại token:
1. Supabase session JWT: iss = https://{project_ref}.supabase.co/auth/v1, aud = "authenticated"
2. Google provider_token (qua Supabase OAuth): iss = accounts.google.com (RS256, audience = Google client ID)

JWKS cache trong memory với TTL 1 giờ.
"""
import time
from typing import Any

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import settings


# Cache JWKS trong memory: { kid: (public_key, fetched_at) }
_JWKS_CACHE: dict[str, tuple[Any, float]] = {}
_JWKS_TTL_SECONDS = 3600


class JWTVerificationError(Exception):
    """Raised khi JWT không hợp lệ (signature, audience, issuer, exp)."""


def _extract_project_ref() -> str:
    """Lấy project ref từ SUPABASE_URL. Ví dụ: https://abcxyz.supabase.co → abcxyz"""
    url = settings.SUPABASE_URL.rstrip("/")
    host = url.split("//")[-1].split("/")[0]
    if not host.endswith(".supabase.co"):
        raise JWTVerificationError(f"SUPABASE_URL không hợp lệ: {host}")
    return host.replace(".supabase.co", "")


def _fetch_jwks() -> dict:
    """Fetch JWKS từ Supabase. Cache 1 giờ theo kid."""
    project_ref = _extract_project_ref()
    jwks_url = f"https://{project_ref}.supabase.co/auth/v1/.well-known/jwks.json"

    try:
        resp = httpx.get(jwks_url, timeout=10.0)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPError as e:
        raise JWTVerificationError(f"Không fetch được JWKS: {e}")


def _get_public_key(kid: str) -> Any:
    """Lấy public key từ cache, nếu hết hạn thì fetch lại."""
    if kid in _JWKS_CACHE:
        key, fetched_at = _JWKS_CACHE[kid]
        if time.time() - fetched_at < _JWKS_TTL_SECONDS:
            return key

    jwks = _fetch_jwks()
    for jwk in jwks.get("keys", []):
        if jwk.get("kid") == kid:
            from jose.utils import base64url_decode  # noqa: F401
            # jose chấp nhận dict JWK trực tiếp qua jwt.decode(..., key=...)
            _JWKS_CACHE[kid] = (jwk, time.time())
            return jwk
    raise JWTVerificationError(f"kid={kid} không có trong JWKS")


def _verify_google_token(token: str) -> dict:
    """Verify Google provider_token. iss = accounts.google.com, aud = Google client ID."""
    google_client_id = getattr(settings, "SUPABASE_GOOGLE_CLIENT_ID", "")
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise JWTVerificationError(f"Token format không hợp lệ: {e}")

    kid = unverified_header.get("kid")
    if not kid:
        raise JWTVerificationError("Token thiếu kid header")

    public_key = _get_public_key(kid)
    try:
        return jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=google_client_id or None,  # nếu không cấu hình thì skip aud check
            options={"verify_aud": bool(google_client_id)},
        )
    except JWTError as e:
        raise JWTVerificationError(f"Google JWT không hợp lệ: {e}")


def _verify_supabase_session_token(token: str, project_ref: str) -> dict:
    """Verify Supabase session JWT. iss = https://{ref}.supabase.co/auth/v1, aud = 'authenticated'."""
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise JWTVerificationError(f"Token format không hợp lệ: {e}")

    kid = unverified_header.get("kid")
    if not kid:
        raise JWTVerificationError("Token thiếu kid header")

    public_key = _get_public_key(kid)
    try:
        return jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=f"https://{project_ref}.supabase.co/auth/v1",
        )
    except JWTError as e:
        raise JWTVerificationError(f"Supabase JWT không hợp lệ: {e}")


def verify_supabase_jwt(token: str) -> dict:
    """Verify JWT từ Supabase OAuth. Trả về dict payload (có email, sub, user_metadata)."""
    if not token or not isinstance(token, str):
        raise JWTVerificationError("Token rỗng hoặc không phải chuỗi")

    # Peek issuer để quyết định verify theo Supabase hay Google
    try:
        unverified_claims = jwt.get_unverified_claims(token)
    except JWTError as e:
        raise JWTVerificationError(f"Token không parse được: {e}")

    iss = unverified_claims.get("iss", "")
    project_ref = _extract_project_ref()
    expected_supabase_iss = f"https://{project_ref}.supabase.co/auth/v1"

    if iss == expected_supabase_iss:
        payload = _verify_supabase_session_token(token, project_ref)
    elif iss in ("accounts.google.com", "https://accounts.google.com"):
        payload = _verify_google_token(token)
    else:
        raise JWTVerificationError(f"Issuer không hợp lệ: {iss}")

    # Map sang format giống response của Supabase /verify cũ
    return {
        "email": payload.get("email"),
        "sub": payload.get("sub"),
        "user_metadata": payload.get("user_metadata", {}),
    }