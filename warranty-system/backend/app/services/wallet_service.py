"""Wallet Service — ACID-safe topup & payment.
Đảm bảo: balance >= 0, dùng pessimistic lock khi có thể (Postgres),
SQLite dùng check ở application + UNIQUE constraint."""
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.core.datetime_utils import iso, utcnow
from app.models.wallet import Transaction, Wallet


class InsufficientBalanceError(Exception):
    pass


def get_or_create_wallet(db: Session, user_id: int) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=Decimal("0"))
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet


def topup(db: Session, user_id: int, amount: Decimal, reference: Optional[str] = None) -> Transaction:
    """Nạp tiền sandbox — không âm tiền, atomic."""
    if amount <= 0:
        raise ValueError("Số tiền nạp phải > 0")
    wallet = get_or_create_wallet(db, user_id)
    # Pessimistic lock cho Postgres; SQLite bỏ qua
    try:
        wallet = db.query(Wallet).filter(Wallet.id == wallet.id).with_for_update().one()
    except Exception:
        pass
    new_balance = Decimal(str(wallet.balance)) + Decimal(str(amount))
    wallet.balance = new_balance
    tx = Transaction(
        wallet_id=wallet.id,
        type="TOPUP",
        amount=amount,
        balance_after=new_balance,
        reference=reference,
        created_at=iso(utcnow()),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def pay(db: Session, user_id: int, amount: Decimal, tx_type: str, reference: Optional[str] = None) -> Transaction:
    """Thanh toán từ ví — atomic, từ chối nếu không đủ tiền."""
    if amount <= 0:
        raise ValueError("Số tiền thanh toán phải > 0")
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        raise InsufficientBalanceError("Ví không tồn tại")
    try:
        wallet = db.query(Wallet).filter(Wallet.id == wallet.id).with_for_update().one()
    except Exception:
        pass
    if Decimal(str(wallet.balance)) < Decimal(str(amount)):
        raise InsufficientBalanceError(f"Số dư không đủ (hiện có {wallet.balance})")
    new_balance = Decimal(str(wallet.balance)) - Decimal(str(amount))
    wallet.balance = new_balance
    tx = Transaction(
        wallet_id=wallet.id,
        type=tx_type,
        amount=amount,
        balance_after=new_balance,
        reference=reference,
        created_at=iso(utcnow()),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx