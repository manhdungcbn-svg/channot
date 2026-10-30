"""API bán hàng: đơn hàng, địa chỉ giao hàng, đánh giá sản phẩm.

Router prefix: `/api/v1/shop/orders` (và `/api/v1/shop/addresses`, `/api/v1/shop/reviews`).
Cùng tên file này nằm trong `endpoints/`, mount trong `main.py` với prefix `/api/v1`.

Phân quyền:
- `customer` → chỉ thao tác trên dữ liệu **của chính mình**.
- `staff`/`admin` → quản lý vòng đời đơn (xác nhận, xuất kho → sinh serial, hoàn/hủy).
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.shop import Order, Review, ShippingAddress
from app.models.user import User
from app.schemas.schemas import (
    AddressIn,
    AddressOut,
    OrderCreate,
    OrderOut,
    ReviewIn,
    ReviewOut,
)
from app.services import order_service

router = APIRouter(prefix="/shop", tags=["Shop Orders"])


def _order_out(order: Order) -> OrderOut:
    """Chuyển model → schema (items đã được eager-load ở endpoint)."""
    return OrderOut.model_validate(order)


# === Orders ===
@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Đặt hàng. Tính tiền ở server, snapshot giá tại thời điểm đặt."""
    try:
        order = order_service.create_order(db, current, payload)
    except order_service.ShopError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return order


@router.get("/orders", response_model=List[OrderOut])
def list_my_orders(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    status_filter: Annotated[Optional[str], Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """Danh sách đơn. Customer thấy đơn của mình; staff/admin thấy tất cả."""
    query = db.query(Order)
    if current.role == "customer":
        # Khách chỉ thấy đơn của chính mình (kèm bộ lọc trạng thái nếu có).
        query = query.filter(Order.user_id == current.id)
    if status_filter:
        query = query.filter(Order.status == status_filter)

    orders = query.order_by(Order.id.desc()).offset(offset).limit(limit).all()
    return orders


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    if current.role == "customer" and order.user_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem đơn hàng này")
    return order


@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Khách huỷ đơn (chỉ khi chưa xuất kho) hoặc staff huỷ giúp."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    is_owner = order.user_id == current.id
    is_staff = current.role in {"admin", "staff"}
    if not is_owner and not is_staff:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thao tác đơn hàng này")
    if order.status in {"SHIPPED", "DELIVERED", "CANCELLED"}:
        raise HTTPException(status_code=400, detail="Đơn hàng không thể huỷ ở trạng thái hiện tại")

    order.status = "CANCELLED"
    for item in order.items:
        if item.product_id:
            from app.models.product import Product

            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.sold = max(0, (product.sold or 0) - item.quantity)
    db.commit()
    db.refresh(order)
    return order


@router.post("/orders/{order_id}/status", response_model=OrderOut)
def set_order_status(
    order_id: int,
    payload: dict,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    """Nhân viên bán hàng cập nhật vòng đời đơn.

    Khi chuyển sang `SHIPPED` → hệ thống **tự sinh serial** cho từng sản phẩm
    trong đơn, khách có thể kích hoạt bảo hành ngay trên storefront.
    """
    new_status = str(payload.get("status", "")).upper()
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    try:
        order = order_service.update_order_status(db, order, new_status)
    except order_service.ShopError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return order


@router.get("/seller/stats")
def seller_stats(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    """Tổng quan bán hàng cho nhân viên bán hàng / quản trị."""
    from decimal import Decimal

    from app.models.shop import OrderItem

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    by_status = {
        row[0]: row[1]
        for row in db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    }

    revenue_rows = (
        db.query(Order.status, func.sum(Order.total))
        .group_by(Order.status)
        .all()
    )
    revenue = sum(
        (Decimal(str(total)) for state, total in revenue_rows if state != "CANCELLED"),
        Decimal("0"),
    )

    product_rows = (
        db.query(OrderItem.name, func.sum(OrderItem.quantity))
        .group_by(OrderItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    return {
        "total_orders": total_orders,
        "by_status": by_status,
        "revenue": float(revenue),
        "top_products": [
            {"name": name, "quantity": int(quantity or 0)} for name, quantity in product_rows
        ],
    }


# === Shipping addresses ===
@router.get("/addresses", response_model=List[AddressOut])
def list_addresses(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    return (
        db.query(ShippingAddress)
        .filter(ShippingAddress.user_id == current.id)
        .order_by(ShippingAddress.is_default.desc(), ShippingAddress.id.desc())
        .all()
    )


@router.post("/addresses", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: AddressIn,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    if payload.is_default:
        db.query(ShippingAddress).filter(ShippingAddress.user_id == current.id).update(
            {"is_default": False}
        )
    address = ShippingAddress(user_id=current.id, **payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/addresses/{address_id}", response_model=AddressOut)
def update_address(
    address_id: int,
    payload: AddressIn,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    address = db.query(ShippingAddress).filter(ShippingAddress.id == address_id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Không tìm thấy địa chỉ")
    if address.user_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền sửa địa chỉ này")
    if payload.is_default:
        db.query(ShippingAddress).filter(ShippingAddress.user_id == current.id).update(
            {"is_default": False}
        )
    for key, value in payload.model_dump().items():
        setattr(address, key, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    address = db.query(ShippingAddress).filter(ShippingAddress.id == address_id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Không tìm thấy địa chỉ")
    if address.user_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xoá địa chỉ này")
    db.delete(address)
    db.commit()


# === Reviews ===
@router.get("/reviews", response_model=List[ReviewOut])
def list_reviews(
    db: Annotated[Session, Depends(get_db)],
    product_id: Optional[int] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    """Danh sách đánh giá (public) — có thể lọc theo sản phẩm."""
    query = db.query(Review).filter(Review.status == "APPROVED")
    if product_id:
        query = query.filter(Review.product_id == product_id)
    reviews = query.order_by(Review.id.desc()).limit(limit).all()
    return reviews


@router.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewIn,
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    """Khách đánh giá sản phẩm. Mỗi khách 1 đánh giá / sản phẩm."""
    from app.models.product import Product

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")

    exists = (
        db.query(Review)
        .filter(Review.product_id == product_id, Review.user_id == current.id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Bạn đã đánh giá sản phẩm này rồi")

    review = Review(
        product_id=product_id,
        user_id=current.id,
        rating=payload.rating,
        title=payload.title,
        content=payload.content,
        status="APPROVED",
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Cập nhật điểm trung bình + số lượt đánh giá trên sản phẩm.
    stats = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.product_id == product_id, Review.status == "APPROVED")
        .first()
    )
    product.rating = float(stats[0] or 0)
    product.review_count = int(stats[1] or 0)
    db.commit()
    return review


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
    if review.user_id != current.id and current.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xoá đánh giá này")
    db.delete(review)
    db.commit()
