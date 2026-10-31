from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Union

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    must_change_password: bool = False

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    # Hỗ trợ cả email hoặc số điện thoại (ví dụ "0827461460" hoặc "demo@shop.vn")
    email: str
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
    # Thông tin hiển thị dùng chung với storefront — optional, có thể null với
    # sản phẩm cũ chưa được seed ảnh/slug.
    slug: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    purchase_date: Optional[date] = None


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# === Shop: Order / Address / Review ===
class OrderItemIn(BaseModel):
    """Một dòng sản phẩm trong đơn hàng (gửi từ storefront).

    `product_id` nhận cả số (id backend) lẫn chuỗi (slug) để storefront dùng
    được cả khi dữ liệu lấy từ mock.
    """

    product_id: Optional[Union[int, str]] = None
    slug: Optional[str] = None
    quantity: int = Field(default=1, ge=1, le=99)


class OrderCreate(BaseModel):
    """Đặt hàng từ storefront."""

    items: List[OrderItemIn] = Field(min_length=1)
    receiver_name: str = Field(min_length=1, max_length=120)
    receiver_phone: Optional[str] = Field(default=None, max_length=20)
    shipping_address: str = Field(min_length=1, max_length=500)
    payment_method: str = Field(default="cod", max_length=30)
    note: Optional[str] = Field(default=None, max_length=1000)
    coupon_code: Optional[str] = Field(default=None, max_length=40)
    # Địa chỉ đã lưu (nếu chọn từ sổ địa chỉ)
    address_id: Optional[int] = None


class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    name: str
    slug: Optional[str] = None
    serial_number: Optional[str] = None
    image_url: Optional[str] = None
    unit_price: Decimal
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class OrderOut(BaseModel):
    id: int
    order_code: str
    user_id: int
    status: str
    subtotal: Decimal
    shipping_fee: Decimal
    discount: Decimal
    total: Decimal
    payment_status: str
    payment_method: Optional[str] = None
    receiver_name: str
    receiver_phone: Optional[str] = None
    shipping_address: str
    note: Optional[str] = None
    coupon_code: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []

    model_config = ConfigDict(from_attributes=True)


class AddressIn(BaseModel):
    label: Optional[str] = Field(default=None, max_length=40)
    receiver_name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=1, max_length=20)
    address: str = Field(min_length=1, max_length=500)
    is_default: bool = False


class AddressOut(BaseModel):
    id: int
    label: Optional[str] = None
    receiver_name: str
    phone: str
    address: str
    is_default: bool

    model_config = ConfigDict(from_attributes=True)


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=200)
    content: Optional[str] = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: Optional[str] = None
    rating: int
    title: Optional[str] = None
    content: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# === Storefront ↔ Warranty bridge ===
class RegisterWarrantyRequest(BaseModel):
    """Khách mua hàng trên storefront đăng ký bảo hành bằng serial."""

    serial: str = Field(min_length=1, max_length=64)
    # Ngày mua — storefront gửi kèm để tính hạn bảo hành đúng.
    purchase_date: Optional[date] = None


class RegisterWarrantyResponse(BaseModel):
    """Kết quả đăng ký bảo hành."""
    registered: bool
    message: str
    product: Optional[ProductOut] = None
    # True = sản phẩm đã thuộc về khách này (không cần đăng ký lại).
    already_owned: bool = False


# === WarrantyTicket ===
class TicketBase(BaseModel):
    product_id: int
    issue_description: str = Field(min_length=1, max_length=1000)
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    # Danh sách ảnh đính kèm (đường dẫn /static/uploads/...) — khách có thể gửi
    # ảnh chụp lỗi để nhân viên hiểu vấn đề ngay.
    attachments: List[str] = Field(default_factory=list, max_length=5)


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

    model_config = ConfigDict(from_attributes=True)


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
    # Tên hiển thị — được gán kèm khi list/join, giúp UI không cần gọi thêm API.
    product_name: Optional[str] = None
    product_serial: Optional[str] = None
    customer_name: Optional[str] = None
    # Ảnh khách gửi kèm (đường dẫn tĩnh). Trả dạng list đã parse JSON.
    attachments: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


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


class AuthenticatedPasswordChange(BaseModel):
    old_password: Optional[str] = None
    new_password: str = Field(min_length=6)


class ResetCodeRequest(BaseModel):
    email: EmailStr


class AvatarUploadResponse(BaseModel):
    avatar_url: str


# === Quản trị storefront (web bán hàng) ===
class AdminProductIn(BaseModel):
    """Dữ liệu sản phẩm do quản trị viên nhập khi thêm/sửa trong catalog.

    Tất cả trường đều optional — chỉ gửi những gì thực sự thay đổi khi sửa.
    """

    name: Optional[str] = Field(default=None, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    serial_number: Optional[str] = Field(default=None, max_length=64)
    brand: Optional[str] = Field(default=None, max_length=120)
    category: Optional[str] = Field(default=None, max_length=120)
    category_slug: Optional[str] = Field(default=None, max_length=120)
    price: Optional[Decimal] = Field(default=None, ge=0)
    original_price: Optional[Decimal] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    sold: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=4000)
    warranty_months: Optional[int] = Field(default=None, ge=0, le=240)
    attributes: Optional[List[str]] = None
    specs: Optional[dict] = None
    status: Optional[str] = Field(default=None, max_length=30)
    badge_label: Optional[str] = Field(default=None, max_length=60)
    badge_tone: Optional[str] = Field(default=None, max_length=20)
    installment_months: Optional[int] = Field(default=None, ge=0, le=60)


class AdminProductOut(BaseModel):
    """Sản phẩm trả về cho màn hình quản trị."""

    id: int
    name: str
    slug: Optional[str] = None
    serial_number: str
    brand: Optional[str] = None
    category: Optional[str] = None
    category_slug: Optional[str] = None
    price: Optional[Decimal] = None
    original_price: Optional[Decimal] = None
    stock: Optional[int] = None
    sold: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    warranty_months: Optional[int] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    status: Optional[str] = None
    badge_label: Optional[str] = None
    badge_tone: Optional[str] = None
    installment_months: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class AdminCustomerOut(BaseModel):
    """Khách hàng kèm thống kê mua hàng — màn hình "Quản lý khách hàng"."""

    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    order_count: int = 0
    total_spent: float = 0.0
