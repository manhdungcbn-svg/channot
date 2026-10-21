from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.wallet import Transaction
from app.schemas.schemas import TopupRequest, TransactionOut, WalletOut
from app.services import wallet_service

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("", response_model=WalletOut)
def my_wallet(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    return wallet_service.get_or_create_wallet(db, current.id)


@router.post("/topup", response_model=TransactionOut)
def topup(
    payload: TopupRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    # P0 hardening — chống top-up tự khai số tiền.
    # Nếu production không cho phép sandbox top-up, mọi request phải kèm
    # `payment_provider_ref` (chứng từ từ cổng thanh toán thật).
    if not settings.ALLOW_SANDBOX_TOPUP and not payload.payment_provider_ref:
        raise HTTPException(
            status_code=403,
            detail=(
                "Top-up tự do đã bị tắt. Vui lòng nạp qua cổng thanh toán và "
                "cung cấp `payment_provider_ref` (mã giao dịch)."
            ),
        )

    # Sandbox mode: ghi reference để dễ truy vết khi đối soát.
    reference = payload.payment_provider_ref or "SANDBOX_TOPUP"
    try:
        tx = wallet_service.topup(db, current.id, payload.amount, reference=reference)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return tx


@router.get("/transactions", response_model=List[TransactionOut])
def my_transactions(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
):
    wallet = wallet_service.get_or_create_wallet(db, current.id)
    rows = (
        db.query(Transaction)
        .filter(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.id.desc())
        .limit(100)
        .all()
    )
    return rows