"""Shop endpoints — PUBLIC (không yêu cầu đăng nhập).

Phục vụ storefront `ecommerce-frontend`:
- Danh sách sản phẩm, chi tiết sản phẩm, danh mục, flash sale
- Tra cứu bảo hành theo serial (không lộ PII chủ sở hữu)

Shape response khớp CHÍNH XÁC contract `DEMO-NOTES.md` mục 1.1 / 1.2.
"""
from typing import Annotated, Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.schemas.schemas import RegisterWarrantyRequest, RegisterWarrantyResponse
from app.services import bridge_service, shop_service

router = APIRouter(prefix="/shop", tags=["Shop"])


# === Schemas ===
class WarrantyLookupRequest(BaseModel):
    serial: str = Field(default="", max_length=64)


class WarrantyLookupResponse(BaseModel):
    found: bool
    serial: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None
    within_warranty: str = "NO"
    warranty_end_date: Optional[str] = None
    warranty_months: int = 0
    message: str


# === 1. Danh sách sản phẩm ===
@router.get("/products")
def list_products(
    db: Annotated[Session, Depends(get_db)],
    category: Optional[str] = Query(None, description="Slug danh mục (vd: tivi)"),
    q: Optional[str] = Query(None, description="Từ khoá tìm kiếm"),
    sort: str = Query("featured", description="featured|price-asc|price-desc|rating|newest"),
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Danh sách sản phẩm storefront + tổng số kết quả."""
    items, total = shop_service.list_products(
        db, category_slug=category, q=q, sort=sort, limit=limit, offset=offset
    )
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# === 2. Chi tiết sản phẩm ===
@router.get("/products/{slug}")
def get_product(slug: str, db: Annotated[Session, Depends(get_db)]):
    """Chi tiết 1 sản phẩm theo slug (404 nếu không tồn tại)."""
    product = shop_service.get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    return product


# === 3. Danh mục ===
@router.get("/categories")
def list_categories(db: Annotated[Session, Depends(get_db)]):
    """Danh sách nhóm danh mục kèm số lượng sản phẩm."""
    return shop_service.list_categories(db)


# === 4. Flash sale ===
@router.get("/flash-sale")
def flash_sale(db: Annotated[Session, Depends(get_db)]):
    """Sản phẩm đang giảm giá + thời điểm kết thúc (23:59:59 hôm nay)."""
    return shop_service.get_flash_sale(db)


# === 5. Tra cứu bảo hành theo serial ===
@router.post("/warranty/lookup", response_model=WarrantyLookupResponse)
def warranty_lookup(
    payload: WarrantyLookupRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Tra cứu bảo hành theo serial — luôn trả 200, KHÔNG lộ PII chủ sở hữu."""
    result = shop_service.lookup_warranty(db, payload.serial)
    return WarrantyLookupResponse(**result)


# === 6. Đăng ký bảo hành (cần đăng nhập) ===
# Luồng: khách mua hàng trên storefront → nhập serial → sản phẩm được gán vào
# tài khoản → xuất hiện ở "Sản phẩm của tôi" trong app bảo hành.
@router.post("/warranty/register", response_model=RegisterWarrantyResponse)
def register_warranty(
    payload: RegisterWarrantyRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Đăng ký bảo hành theo serial cho tài khoản đang đăng nhập."""
    registered, message, product, already = bridge_service.register_warranty(
        db, current, payload.serial, payload.purchase_date
    )
    return RegisterWarrantyResponse(
        registered=registered,
        message=message,
        product=product,
        already_owned=already,
    )


# === 7. Sản phẩm của tôi (dùng bởi app bảo hành phía khách) ===
@router.get("/warranty/my-products")
def my_products(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Danh sách sản phẩm đã đăng ký bảo hành của tài khoản đang đăng nhập."""
    return bridge_service.list_owned_products(db, current)
