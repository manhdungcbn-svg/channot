"""Sổ cái tài chính CPO — ACID khi ghi chuyển khoản / ghi nhận thu chi."""
from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.datetime_utils import utcnow
from app.models.finance import FinanceTransaction


def _next_code(db: Session) -> str:
    n = db.query(FinanceTransaction).count() + 1
    return f"TXN-{n:03d}"


def list_transactions(db: Session, txn_type: str | None = None, limit: int = 100):
    q = db.query(FinanceTransaction)
    if txn_type in ("credit", "debit"):
        q = q.filter(FinanceTransaction.type == txn_type)
    return q.order_by(FinanceTransaction.id.desc()).limit(limit).all()


def summary(db: Session) -> dict:
    rows = db.query(FinanceTransaction).all()
    total_credit = sum((r.amount for r in rows if r.type == "credit"), Decimal("0"))
    total_debit = sum((r.amount for r in rows if r.type == "debit"), Decimal("0"))
    balance = total_credit - total_debit

    by_category: dict = {}
    for r in rows:
        item = by_category.setdefault(r.category, {"category": r.category, "net": Decimal("0"), "count": 0})
        delta = r.amount if r.type == "credit" else -r.amount
        item["net"] += delta
        item["count"] += 1

    categories = sorted(by_category.values(), key=lambda x: abs(x["net"]), reverse=True)
    return {
        "balance": balance,
        "total_credit": total_credit,
        "total_debit": total_debit,
        "by_category": [
            {"category": c["category"], "net": c["net"], "count": c["count"]} for c in categories
        ],
    }


def create_transfer(
    db: Session,
    *,
    amount: Decimal,
    recipient: str,
    note: str = "",
    category: str = "Chuyển khoản",
) -> FinanceTransaction:
    if amount <= 0:
        raise ValueError("Số tiền phải lớn hơn 0")
    s = summary(db)
    if amount > s["balance"]:
        raise ValueError("Số dư tài chính không đủ")

    now = utcnow()
    txn = FinanceTransaction(
        txn_code=_next_code(db),
        date=date.today().isoformat(),
        description=f"Chuyển tiền tới {recipient}" + (f" — {note}" if note else ""),
        amount=amount,
        type="debit",
        category=category,
        reference=f"REF-{now.strftime('%y%m%d%H%M%S')}",
        created_at=now.isoformat(),
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def create_credit(
    db: Session,
    *,
    amount: Decimal,
    description: str,
    category: str = "Thu khác",
) -> FinanceTransaction:
    if amount <= 0:
        raise ValueError("Số tiền phải lớn hơn 0")
    now = utcnow()
    txn = FinanceTransaction(
        txn_code=_next_code(db),
        date=date.today().isoformat(),
        description=description,
        amount=amount,
        type="credit",
        category=category,
        reference=f"REF-{now.strftime('%y%m%d%H%M%S')}",
        created_at=now.isoformat(),
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn
