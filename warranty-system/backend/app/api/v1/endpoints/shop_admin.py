"""API quản trị cho storefront (web bán hàng) — dành cho admin/staff.

Router prefix: `/api/v1/shop/admin`.

Bổ sung cho `shop_orders.py` (vốn chỉ có phần đơn hàng/địa chỉ/đánh giá):

- Danh mục hành chính (tỉnh/phường) cho form địa chỉ giao hàng.
- Quản lý sản phẩm trong catalog (thêm/sửa/xoá/tồn kho).
- Xem & quản lý khách hàng + lịch sử đơn của từng khách.
- Thống kê bán hàng tổng quan.

Phân quyền: chỉ `admin` / `staff`. Khách hàng (`customer`) bị chặn 403.
"""
import json
import re
import time
import unicodedata
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_roles
from app.models.product import Product
from app.models.shop import Order, OrderItem
from app.models.user import User
from app.schemas.schemas import AdminCustomerOut, AdminProductIn, AdminProductOut, OrderOut

router = APIRouter(prefix="/shop/admin", tags=["Shop Admin"])


def slugify(text: str) -> str:
    """Chuyển chuỗi thành slug URL (không dấu, gạch nối)."""
    normalized = unicodedata.normalize("NFD", text or "")
    ascii_text = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    ascii_text = ascii_text.replace("đ", "d").replace("Đ", "D")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text).strip("-").lower()
    return slug or "san-pham"


def _resolve_image_url(image_url: Optional[str]) -> Optional[str]:
    """Chuẩn hoá đường dẫn ảnh — giữ nguyên URL tuyệt đối, thêm `/` nếu thiếu."""
    if not image_url:
        return None
    value = str(image_url).strip()
    if not value:
        return None
    if value.startswith(("http://", "https://", "/")):
        return value
    return f"/static/shop/{value}"


# === Danh mục hành chính (public — ai cũng gọi được để điền địa chỉ) ===
@router.get("/provinces")
def list_provinces():
    """Danh sách tỉnh/thành phố — dùng cho form địa chỉ giao hàng."""
    from app.core import vn_address

    return vn_address.list_provinces()


@router.get("/wards")
def list_wards(
    province_code: Annotated[Optional[str], Query(alias="province_code")] = None,
):
    """Danh sách phường/xã — lọc theo tỉnh."""
    from app.core import vn_address

    return vn_address.list_wards(province_code)


# === Quản lý sản phẩm (catalog) ===
@router.get("/products", response_model=List[AdminProductOut])
def list_admin_products(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
    q: str = "",
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """Danh sách sản phẩm trong catalog (kèm tồn kho + giá)."""
    query = db.query(Product)
    if q:
        query = query.filter(
            (Product.name.ilike(f"%{q}%"))
            | (Product.brand.ilike(f"%{q}%"))
            | (Product.serial_number.ilike(f"%{q}%"))
        )
    return query.order_by(Product.id.desc()).offset(offset).limit(limit).all()


@router.post("/products", response_model=AdminProductOut, status_code=status.HTTP_201_CREATED)
def create_admin_product(
    payload: AdminProductIn,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    """Thêm sản phẩm mới vào catalog."""
    data = payload.model_dump(exclude_unset=True)
    data.pop("id", None)

    slug = data.get("slug") or slugify(data.get("name", ""))
    if db.query(Product).filter(Product.slug == slug).first():
        slug = f"{slug}-{int(time.time())}"
    data["slug"] = slug

    serial = data.get("serial_number") or f"SN-{slug.upper()[:20]}"
    if db.query(Product).filter(Product.serial_number == serial).first():
        raise HTTPException(status_code=400, detail="Serial đã tồn tại")
    data["serial_number"] = serial

    data["image_url"] = _resolve_image_url(data.get("image_url"))
    if isinstance(data.get("attributes"), list):
        data["attributes"] = json.dumps(data["attributes"], ensure_ascii=False)
    if isinstance(data.get("specs"), dict):
        data["specs"] = json.dumps(data["specs"], ensure_ascii=False)

    product = Product(**{k: v for k, v in data.items() if hasattr(Product, k)})
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=AdminProductOut)
def update_admin_product(
    product_id: int,
    payload: AdminProductIn,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    """Cập nhật sản phẩm (giá, tồn kho, mô tả...)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

    data = payload.model_dump(exclude_unset=True)
    data.pop("id", None)

    if "image_url" in data:
        data["image_url"] = _resolve_image_url(data["image_url"])
    if isinstance(data.get("attributes"), list):
        data["attributes"] = json.dumps(data["attributes"], ensure_ascii=False)
    if isinstance(data.get("specs"), dict):
        data["specs"] = json.dumps(data["specs"], ensure_ascii=False)
    if data.get("slug"):
        data["slug"] = slugify(data["slug"])
    if data.get("serial_number"):
        clash = (
            db.query(Product.id)
            .filter(
                Product.serial_number == data["serial_number"],
                Product.id != product_id,
            )
            .first()
        )
        if clash:
            raise HTTPException(status_code=400, detail="Serial đã tồn tại")

    for key, value in data.items():
        if hasattr(product, key):
            setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_product(
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    """Xoá sản phẩm khỏi catalog."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    db.delete(product)
    db.commit()


# === Quản lý khách hàng ===
@router.get("/customers", response_model=List[AdminCustomerOut])
def list_admin_customers(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
    q: str = "",
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """Danh sách khách hàng kèm số đơn / tổng chi tiêu."""
    query = db.query(User).filter(User.role == "customer")
    if q:
        query = query.filter(
            (User.full_name.ilike(f"%{q}%"))
            | (User.email.ilike(f"%{q}%"))
            | (User.phone.ilike(f"%{q}%"))
        )

    customers = query.order_by(User.id.desc()).offset(offset).limit(limit).all()

    # Gom thống kê đơn hàng theo khách trong 1 vòng truy vấn.
    stats = {
        row[0]: (int(row[1] or 0), float(row[2] or 0))
        for row in db.query(
            Order.user_id, func.count(Order.id), func.sum(Order.total)
        )
        .filter(Order.status != "CANCELLED")
        .group_by(Order.user_id)
        .all()
    }

    result = []
    for customer in customers:
        order_count, total_spent = stats.get(customer.id, (0, 0.0))
        result.append(
            AdminCustomerOut(
                id=customer.id,
                email=customer.email,
                full_name=customer.full_name,
                phone=customer.phone,
                is_active=customer.is_active,
                created_at=customer.created_at,
                order_count=order_count,
                total_spent=total_spent,
            )
        )
    return result


@router.get("/customers/{customer_id}/orders", response_model=List[OrderOut])
def list_customer_orders(
    customer_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    """Lịch sử đơn hàng của 1 khách — dùng khi quản trị viên "đặt hàng hộ" khách."""
    orders = (
        db.query(Order)
        .filter(Order.user_id == customer_id)
        .order_by(Order.id.desc())
        .all()
    )
    return [OrderOut.model_validate(order) for order in orders]


# === Thống kê ===
@router.get("/stats")
def admin_stats(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    """Tổng quan vận hành: doanh thu, đơn, khách, sản phẩm bán chạy."""
    total_customers = db.query(func.count(User.id)).filter(User.role == "customer").scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    by_status = {
        row[0]: int(row[1] or 0)
        for row in db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    }

    revenue = float(
        db.query(func.sum(Order.total)).filter(Order.status != "CANCELLED").scalar() or 0
    )

    top_products = [
        {"name": name, "quantity": int(qty or 0)}
        for name, qty in db.query(OrderItem.name, func.sum(OrderItem.quantity))
        .group_by(OrderItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(8)
        .all()
    ]

    low_stock = [
        {"id": pid, "name": name, "stock": int(stock or 0)}
        for pid, name, stock in db.query(Product.id, Product.name, Product.stock)
        .filter((Product.stock.isnot(None)) & (Product.stock <= 5))
        .order_by(Product.stock.asc())
        .limit(10)
        .all()
    ]

    return {
        "total_customers": int(total_customers),
        "total_products": int(total_products),
        "total_orders": int(total_orders),
        "by_status": by_status,
        "revenue": revenue,
        "top_products": top_products,
        "low_stock": low_stock,
    }
