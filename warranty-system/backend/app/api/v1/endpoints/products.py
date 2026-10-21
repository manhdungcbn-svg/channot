from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.product import Product
from app.models.user import User
from app.schemas.schemas import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductOut])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    q: str = "",
):
    query = db.query(Product)
    # S5c fix: customer chỉ thấy sản phẩm của mình; admin/staff/technician thấy hết
    if current.role == "customer":
        query = query.filter(Product.customer_id == current.id)
    if q:
        query = query.filter((Product.name.ilike(f"%{q}%")) | (Product.serial_number.ilike(f"%{q}%")))
    return query.order_by(Product.id.desc()).limit(200).all()


@router.get("/serial/{serial}", response_model=ProductOut)
def get_by_serial(
    serial: str,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    p = db.query(Product).filter(Product.serial_number == serial).first()
    if not p:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm với serial này")
    # S5c fix: customer chỉ xem được sản phẩm của mình
    if current.role == "customer" and p.customer_id != current.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem sản phẩm này")
    return p


@router.post("", response_model=ProductOut, status_code=201)
def create(
    payload: ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    exists = db.query(Product).filter(Product.serial_number == payload.serial_number).first()
    if exists:
        raise HTTPException(status_code=400, detail="Serial đã tồn tại")
    p = Product(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}", status_code=204)
def delete(
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin"))],
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    db.delete(p)
    db.commit()