from sqlalchemy import Column, Integer, Numeric, String

from app.core.database import Base


class FinanceTransaction(Base):
    """Sổ giao dịch tài chính công ty (màn Payment admin) — tách biệt ví khách hàng."""

    __tablename__ = "finance_transactions"

    id = Column(Integer, primary_key=True, index=True)
    txn_code = Column(String, unique=True, index=True, nullable=False)  # TXN-001
    date = Column(String, nullable=False)  # YYYY-MM-DD
    description = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    type = Column(String, nullable=False)  # credit | debit
    category = Column(String, nullable=False)
    reference = Column(String, nullable=True)
    created_at = Column(String, nullable=False)
