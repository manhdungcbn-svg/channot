from decimal import Decimal
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_roles
from app.models.finance import FinanceTransaction
from app.models.user import User
from app.services import finance_service

router = APIRouter(prefix="/finance", tags=["Finance"])


class FinanceTxnOut(BaseModel):
    id: int
    txn_code: str
    date: str
    description: str
    amount: Decimal
    type: str
    category: str
    reference: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class FinanceSummaryOut(BaseModel):
    balance: Decimal
    total_credit: Decimal
    total_debit: Decimal
    by_category: list


class TransferRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    recipient: str = Field(min_length=1, max_length=120)
    note: str = ""
    category: str = "Chuyển khoản"


class CreditRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    description: str = Field(min_length=1, max_length=255)
    category: str = "Thu khác"


@router.get("/summary", response_model=FinanceSummaryOut)
def get_summary(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin"))],
):
    return finance_service.summary(db)


@router.get("/transactions", response_model=List[FinanceTxnOut])
def get_transactions(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin"))],
    type: Optional[str] = Query(None, pattern="^(credit|debit)$"),
):
    return finance_service.list_transactions(db, txn_type=type)


@router.post("/transfer", response_model=FinanceTxnOut, status_code=201)
def transfer(
    payload: TransferRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin"))],
):
    try:
        return finance_service.create_transfer(
            db,
            amount=payload.amount,
            recipient=payload.recipient,
            note=payload.note,
            category=payload.category,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/credit", response_model=FinanceTxnOut, status_code=201)
def credit(
    payload: CreditRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("admin"))],
):
    try:
        return finance_service.create_credit(
            db,
            amount=payload.amount,
            description=payload.description,
            category=payload.category,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
