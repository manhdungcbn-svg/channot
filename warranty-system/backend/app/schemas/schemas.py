from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# === User ===
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str = "customer"


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# === Product ===
class ProductBase(BaseModel):
    name: str
    serial_number: str
    category: str
    warranty_months: int = 12
    manufacture_date: date
    customer_id: Optional[int] = None
    # Phần 2.5 bổ sung: thông tin thương mại (giá + mô tả) — optional.
    price: Optional[Decimal] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=2000)


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True


# === WarrantyTicket ===
class TicketBase(BaseModel):
    product_id: int
    issue_description: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None


class TicketCreate(TicketBase):
    pass


class TicketAssign(BaseModel):
    technician_id: int


class TicketStatusUpdate(BaseModel):
    new_status: str
    action_note: str
    repair_cost: Optional[Decimal] = None


class TicketPaymentRequest(BaseModel):
    amount: Decimal


class HistoryOut(BaseModel):
    id: int
    action_note: str
    status_from: Optional[str]
    status_to: str
    technician_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class TicketOut(BaseModel):
    id: int
    ticket_code: str
    product_id: int
    customer_id: int
    technician_id: Optional[int]
    issue_description: str
    status: str
    ai_classification: Optional[str]
    ai_summary: Optional[str]
    ai_progress_message: Optional[str]
    within_warranty: Optional[str]
    warranty_check_reason: Optional[str]
    repair_cost: Optional[Decimal]
    payment_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TicketDetailOut(TicketOut):
    history: List[HistoryOut] = []
    product: ProductOut
    customer: UserOut
    technician: Optional[UserOut] = None


# === Wallet ===
class WalletOut(BaseModel):
    id: int
    user_id: int
    balance: Decimal

    class Config:
        from_attributes = True


class TopupRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    # Bắt buộc khi production không cho phép top-up sandbox.
    # Nếu thiếu và ALLOW_SANDBOX_TOPUP=false → endpoint trả 403.
    payment_provider_ref: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    type: str
    amount: Decimal
    balance_after: Decimal
    reference: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


# === Stats ===
class StatItem(BaseModel):
    label: str
    value: Decimal | int | str


class StatsOut(BaseModel):
    total_tickets: int
    by_status: dict
    top_issue_categories: List[dict]
    rejection_rate: float
    avg_processing_hours: float


# === Settings / Profile ===
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1)
    phone: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6)


class ResetCodeRequest(BaseModel):
    email: EmailStr


class AvatarUploadResponse(BaseModel):
    avatar_url: str