from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.endpoints import ai, auth, customers, finance, notifications, products, shop, shop_admin, shop_orders, tickets, wallet
from app.core.config import settings
from app.core.database import Base, engine
from app.core.migrations import ensure_columns
from app.core.response import error_envelope

# Import models để register tables
from app.models import finance as finance_model, notification, product, shop as shop_model, user, wallet as wallet_model, warranty  # noqa: F401
from app.models.finance import FinanceTransaction  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Migration nhẹ cho SQLite: thêm cột shop mới vào bảng `products` đã tồn tại.
    # Phải chạy TRƯỚC create_all để bảng cũ có đủ cột; create_all vẫn tạo bảng mới
    # (và bảng mới đã có đủ cột theo model nên không bị xung đột).
    ensure_columns(engine)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Phase C: Chuẩn hoá response lỗi theo envelope ===
@app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    """Wrap mọi HTTPException thành envelope {success, error:{message, code}}.

    Response 200 giữ nguyên (không wrap) để tránh phá 30+ frontend call site.
    Chỉ /docs (OpenAPI) được phép trả JSON thô.
    """
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=error_envelope(detail, exc.status_code),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Bắt mọi lỗi chưa handle để tránh trả HTML stack trace."""
    return JSONResponse(
        status_code=500,
        content=error_envelope("Lỗi hệ thống nội bộ", 500),
    )


API = settings.API_V1_STR


@app.get("/")
def root():
    return {"app": settings.PROJECT_NAME, "version": settings.VERSION, "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router, prefix=API)
app.include_router(products.router, prefix=API)
app.include_router(customers.router, prefix=API)
app.include_router(tickets.router, prefix=API)
app.include_router(wallet.router, prefix=API)
app.include_router(finance.router, prefix=API)
app.include_router(ai.router, prefix=API)
app.include_router(notifications.router, prefix=API)
# Storefront shop — PUBLIC (không yêu cầu đăng nhập)
app.include_router(shop.router, prefix=API)
# Storefront bán hàng — đơn hàng / địa chỉ / đánh giá
app.include_router(shop_orders.router, prefix=API)
# Storefront — khu vực quản trị (sản phẩm, khách hàng, thống kê, tỉnh/xã)
app.include_router(shop_admin.router, prefix=API)

# Serve uploaded files
app.mount("/static", StaticFiles(directory="static"), name="static")


