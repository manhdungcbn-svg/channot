from typing import Annotated
from datetime import timedelta
import os
import uuid
import base64

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.datetime_utils import utcnow
from app.core.permissions import get_current_user, require_roles
from app.core.security import create_access_token, hash_password, verify_password
from app.models.login_attempt import LoginAttempt
from app.models.user import User
from app.schemas.schemas import (
    AuthenticatedPasswordChange,
    LoginRequest, LoginResponse,
    PasswordChangeRequest, ProfileUpdate, ResetCodeRequest,
    UserCreate, UserOut,
)
from app.services.wallet_service import get_or_create_wallet

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/supabase-token", response_model=LoginResponse)
def supabase_oauth(
    id_token: str,
    provider: str,
    db: Annotated[Session, Depends(get_db)],
):
    """S4 fix: Verify JWT signature bằng JWKS local thay vì gọi HTTP /verify.

    Hỗ trợ 2 loại token:
    - Supabase session: iss = https://{project_ref}.supabase.co/auth/v1, aud = "authenticated"
    - Google provider_token (qua Supabase OAuth): iss = accounts.google.com or https://accounts.google.com
    """
    from app.core.supabase_jwt import verify_supabase_jwt, JWTVerificationError

    settings.require_supabase_oauth_if_needed()

    # S4 fix: verify JWT signature locally
    try:
        supabase_user = verify_supabase_jwt(id_token)
    except JWTVerificationError as e:
        raise HTTPException(status_code=401, detail=f"Token không hợp lệ: {e}")

    email = supabase_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Supabase không trả về email")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=supabase_user.get("user_metadata", {}).get("full_name", email.split("@")[0]),
            phone=None,
            role="customer",
            hashed_password="",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        get_or_create_wallet(db, user.id)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị vô hiệu hóa")

    token = create_access_token(subject=user.id, extra={"role": user.role})
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """S1 fix: Endpoint public chỉ được tạo user với role=customer, bất kể payload có gửi role gì.
    Để tạo user với role khác (admin/staff/technician), gọi POST /auth/users (yêu cầu admin)."""
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        role="customer",  # S1 fix: ép role, bỏ qua payload.role
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    if user.role == "customer":
        get_or_create_wallet(db, user.id)
    return user


def _clean_phone(raw: str) -> str:
    """Chuẩn hoá số điện thoại về dạng số đơn giản (bỏ dấu cách, gạch nối, +84)."""
    digits = "".join(ch for ch in (raw or "") if ch.isdigit())
    if digits.startswith("84") and len(digits) >= 10:
        digits = "0" + digits[2:]
    return digits


def _find_user_by_identifier(db: Session, identifier: str) -> User | None:
    """Tìm user theo email HOẶC số điện thoại (hỗ trợ cả chuẩn hoá SĐT)."""
    raw = (identifier or "").strip()
    if not raw:
        return None
    # 1. Thử tìm theo email trước
    user = db.query(User).filter(User.email.ilike(raw)).first()
    if user:
        return user
    # 2. Thử tìm theo SĐT nguyên bản
    user = db.query(User).filter(User.phone == raw).first()
    if user:
        return user
    # 3. Thử tìm theo SĐT đã chuẩn hoá (bỏ khoảng trắng, +84)
    cleaned = _clean_phone(raw)
    if cleaned and cleaned != raw:
        user = db.query(User).filter(User.phone == cleaned).first()
        if user:
            return user
    return None


@router.post("/login", response_model=LoginResponse)
def login_json(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    # S3 fix: rate-limit theo identifier. Nếu đang bị khóa → trả 423.
    _enforce_login_rate_limit(db, payload.email)

    user = _find_user_by_identifier(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        _record_failed_attempt(db, payload.email)
        raise HTTPException(status_code=401, detail="Email/SĐT hoặc mật khẩu không đúng")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị vô hiệu hóa")

    # S3 fix: đăng nhập thành công → reset counter
    _reset_login_attempts(db, payload.email)

    token = create_access_token(subject=user.id, extra={"role": user.role})
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login/form", response_model=LoginResponse)
def login_form(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    # S3 fix: rate-limit theo form.username (có thể là email hoặc SĐT)
    _enforce_login_rate_limit(db, form.username)
    user = _find_user_by_identifier(db, form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        _record_failed_attempt(db, form.username)
        raise HTTPException(status_code=401, detail="Email/SĐT hoặc mật khẩu không đúng")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị vô hiệu hóa")
    _reset_login_attempts(db, form.username)
    token = create_access_token(subject=user.id, extra={"role": user.role})
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current: Annotated[User, Depends(get_current_user)]):
    return current


@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Cập nhật hồ sơ cá nhân: tên, số điện thoại"""
    if payload.full_name is not None:
        current.full_name = payload.full_name.strip()
    if payload.phone is not None:
        current.phone = payload.phone.strip() or None
    db.commit()
    db.refresh(current)
    return current


@router.post("/upload-avatar")
def upload_avatar(
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
):
    """Upload ảnh đại diện"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)"
        )
    
    # Validate file size (2MB)
    contents = file.file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File quá nặng. Tối đa 2MB")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    upload_dir = os.path.join("static", "uploads")
    filepath = os.path.join(upload_dir, filename)
    
    # Save file
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Update user avatar_url
    avatar_url = f"/static/uploads/{filename}"
    current.avatar_url = avatar_url
    db.commit()
    db.refresh(current)
    
    return {"avatar_url": avatar_url}


@router.post("/request-reset-code")
def request_reset_code(
    payload: ResetCodeRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Gửi mã xác nhận đặt lại mật khẩu qua email (mock)"""
    import random
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return {"message": "Nếu email tồn tại, mã xác nhận đã được gửi."}
    
    reset_codes = getattr(request_reset_code, '_codes', {})
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    reset_codes[payload.email] = {'code': code, 'expires': __import__('time').time() + 300}
    request_reset_code._codes = reset_codes
    
    print(f"[MOCK EMAIL] Mã đặt lại MK cho {payload.email}: {code}")
    return {"message": f"Nếu email tồn tại, mã xác nhận đã được gửi."}


@router.post("/reset-password")
def reset_password(
    payload: PasswordChangeRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Đặt lại mật khẩu với mã xác nhận"""
    from time import time
    reset_codes = getattr(request_reset_code, '_codes', {})
    
    stored = reset_codes.get(payload.email)
    if not stored or stored['code'] != payload.code:
        raise HTTPException(status_code=400, detail="Mã xác nhận không hợp lệ")
    if time() > stored['expires']:
        raise HTTPException(status_code=400, detail="Mã đã hết hạn")
    
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    del reset_codes[payload.email]

    return {"message": "Đổi mật khẩu thành công"}


@router.post("/change-password")
def change_password_authenticated(
    payload: AuthenticatedPasswordChange,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Đổi mật khẩu cho người dùng đang đăng nhập (bao gồm đổi từ pass tạm)."""
    # Nếu user không ở trạng thái must_change_password thì bắt buộc phải nhập đúng old_password
    if not current.must_change_password:
        if not payload.old_password or not verify_password(payload.old_password, current.hashed_password):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    else:
        # Nếu ở trạng thái must_change_password và có gửi old_password thì vẫn check
        if payload.old_password and not verify_password(payload.old_password, current.hashed_password):
            raise HTTPException(status_code=400, detail="Mật khẩu ban đầu không đúng")

    current.hashed_password = hash_password(payload.new_password)
    current.must_change_password = False
    db.commit()
    db.refresh(current)
    return {"message": "Đổi mật khẩu thành công", "user": UserOut.model_validate(current)}


# === S1 fix: Endpoint tạo user với role bất kỳ — chỉ dành cho admin ===
@router.post("/users", response_model=UserOut, status_code=201)
def create_user_by_admin(
    payload: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("admin"))],
):
    """S1 fix: Admin tạo user mới với role bất kỳ (admin/staff/technician/customer).
    Endpoint public POST /auth/register chỉ tạo customer. Không có cách nào khác để tạo user có role ≠ customer."""
    if payload.role not in ("admin", "staff", "technician", "customer"):
        raise HTTPException(status_code=400, detail="Vai trò không hợp lệ")
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")
    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role,
        hashed_password=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    if new_user.role == "customer":
        get_or_create_wallet(db, new_user.id)
    return new_user


# === S3 fix: Helper cho rate-limit login ===
def _enforce_login_rate_limit(db: Session, email: str) -> None:
    """Nếu email đang bị khóa → raise 423. Ngược lại OK."""
    record = db.query(LoginAttempt).filter(LoginAttempt.email == email).first()
    if record and record.is_locked():
        raise HTTPException(
            status_code=423,
            detail=(
                f"Tài khoản tạm thời bị khóa do nhập sai mật khẩu nhiều lần. "
                f"Vui lòng thử lại sau {record.remaining_seconds()} giây."
            ),
        )


def _record_failed_attempt(db: Session, email: str) -> None:
    """Ghi nhận 1 lần đăng nhập sai. Nếu đạt ngưỡng MAX → khóa LOCKOUT_DURATION phút."""
    max_attempts = settings.MAX_FAILED_LOGIN_ATTEMPTS
    lockout_minutes = settings.LOCKOUT_DURATION_MINUTES

    record = db.query(LoginAttempt).filter(LoginAttempt.email == email).first()
    if record is None:
        record = LoginAttempt(email=email, attempt_count=1, last_attempt_at=utcnow())
        db.add(record)
    else:
        # Nếu đã hết hạn khóa → reset counter
        if record.locked_until and not record.is_locked():
            record.attempt_count = 1
        else:
            record.attempt_count += 1
        record.last_attempt_at = utcnow()

    if record.attempt_count >= max_attempts:
        record.locked_until = utcnow() + timedelta(minutes=lockout_minutes)

    db.commit()


def _reset_login_attempts(db: Session, email: str) -> None:
    """Đăng nhập thành công → reset counter, xóa locked_until."""
    record = db.query(LoginAttempt).filter(LoginAttempt.email == email).first()
    if record:
        record.attempt_count = 0
        record.locked_until = None
        record.last_attempt_at = utcnow()
        db.commit()
