from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.core.security import hash_password
from app.models.user import User
from app.schemas.schemas import UserCreate, UserOut

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=List[UserOut])
def list_customers(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
    q: str = "",
):
    query = db.query(User).filter(User.role == "customer")
    if q:
        query = query.filter((User.full_name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%")))
    return query.order_by(User.id.desc()).limit(200).all()


@router.get("/technicians", response_model=List[UserOut])
def list_technicians(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    return db.query(User).filter(User.role == "technician", User.is_active == True).all()


@router.post("", response_model=UserOut, status_code=201)
def create_customer(
    payload: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin", "staff"))],
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email đã tồn tại")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        role="customer",
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user