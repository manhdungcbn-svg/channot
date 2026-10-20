"""
Wallet Endpoints - Ví điện tử
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

router = APIRouter(prefix="/wallet", tags=["Wallet"])

# In-memory storage (thay bằng database thực tế)
WALLETS = {}  # email -> wallet data
TRANSACTIONS = {}  # wallet_id -> list of transactions

class TopupRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Số tiền nạp (VND)")
    payment_method: str = Field(default="sandbox", description="Phương thức thanh toán")

class TransferRequest(BaseModel):
    to_email: str = Field(..., description="Email người nhận")
    amount: float = Field(..., gt=0, description="Số tiền chuyển")
    note: Optional[str] = None

class PaymentRequest(BaseModel):
    ticket_id: int = Field(..., description="ID phiếu bảo hành")
    amount: float = Field(..., gt=0, description="Số tiền thanh toán")
    description: Optional[str] = None

def get_or_create_wallet(email: str):
    """Get or create wallet for user"""
    if email not in WALLETS:
        WALLETS[email] = {
            "id": f"wallet_{len(WALLETS) + 1}",
            "email": email,
            "balance": 0.0,
            "frozen_balance": 0.0,
            "currency": "VND",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "tier": "basic",  # basic, silver, gold, platinum
            "daily_limit": 50000000,  # 50 triệu/ngày
            "monthly_limit": 200000000,  # 200 triệu/tháng
            "total_topup": 0.0,
            "total_spent": 0.0,
        }
        TRANSACTIONS[email] = []
    return WALLETS[email]

def add_transaction(wallet_id: str, tx_type: str, amount: float, description: str, email: str):
    """Add transaction to wallet history"""
    tx = {
        "id": f"tx_{len(TRANSACTIONS.get(email, [])) + 1}_{int(datetime.now().timestamp())}",
        "wallet_id": wallet_id,
        "type": tx_type,  # topup, payment, refund, transfer_in, transfer_out
        "amount": amount,
        "balance_after": WALLETS[email]["balance"],
        "description": description,
        "status": "completed",
        "created_at": datetime.now().isoformat(),
    }
    if email not in TRANSACTIONS:
        TRANSACTIONS[email] = []
    TRANSACTIONS[email].insert(0, tx)
    return tx

# ============ ENDPOINTS ============

@router.get("/me")
async def get_my_wallet(email: str = "admin@warranty.vn"):
    """Get current user's wallet info"""
    wallet = get_or_create_wallet(email)
    transactions = TRANSACTIONS.get(email, [])[:20]  # Latest 20 transactions
    
    return {
        "wallet": wallet,
        "transactions": transactions
    }

@router.post("/topup")
async def topup_wallet(request: TopupRequest, email: str = "admin@warranty.vn"):
    """Top up wallet (Sandbox mode)"""
    wallet = get_or_create_wallet(email)
    
    # Sandbox mode - instant topup without payment gateway
    wallet["balance"] += request.amount
    wallet["total_topup"] += request.amount
    wallet["updated_at"] = datetime.now().isoformat()
    
    # Add transaction
    add_transaction(
        wallet_id=wallet["id"],
        tx_type="topup",
        amount=request.amount,
        description=f"Nạp tiền qua {request.payment_method} (+{request.amount:,.0f} VND)",
        email=email
    )
    
    return {
        "success": True,
        "message": f"Nạp tiền thành công {request.amount:,.0f} VND",
        "new_balance": wallet["balance"],
        "transaction_id": f"tx_topup_{int(datetime.now().timestamp())}"
    }

@router.post("/transfer")
async def transfer_money(request: TransferRequest, email: str = "admin@warranty.vn"):
    """Transfer money to another user"""
    sender_wallet = get_or_create_wallet(email)
    
    if sender_wallet["balance"] < request.amount:
        raise HTTPException(status_code=400, detail="Số dư không đủ")
    
    if request.to_email == email:
        raise HTTPException(status_code=400, detail="Không thể chuyển tiền cho chính mình")
    
    receiver_wallet = get_or_create_wallet(request.to_email)
    
    # Deduct from sender
    sender_wallet["balance"] -= request.amount
    sender_wallet["total_spent"] += request.amount
    sender_wallet["updated_at"] = datetime.now().isoformat()
    
    # Add to receiver
    receiver_wallet["balance"] += request.amount
    receiver_wallet["total_topup"] += request.amount
    receiver_wallet["updated_at"] = datetime.now().isoformat()
    
    # Transactions
    add_transaction(
        wallet_id=sender_wallet["id"],
        tx_type="transfer_out",
        amount=request.amount,
        description=f"Chuyển tiền cho {request.to_email}" + (f" - {request.note}" if request.note else ""),
        email=email
    )
    
    add_transaction(
        wallet_id=receiver_wallet["id"],
        tx_type="transfer_in",
        amount=request.amount,
        description=f"Nhận tiền từ {email}" + (f" - {request.note}" if request.note else ""),
        email=request.to_email
    )
    
    return {
        "success": True,
        "message": f"Chuyển {request.amount:,.0f} VND cho {request.to_email} thành công",
        "new_balance": sender_wallet["balance"]
    }

@router.post("/payment")
async def make_payment(request: PaymentRequest, email: str = "admin@warranty.vn"):
    """Pay for warranty service"""
    wallet = get_or_create_wallet(email)
    
    if wallet["balance"] < request.amount:
        raise HTTPException(status_code=400, detail="Số dư không đủ")
    
    wallet["balance"] -= request.amount
    wallet["total_spent"] += request.amount
    wallet["updated_at"] = datetime.now().isoformat()
    
    add_transaction(
        wallet_id=wallet["id"],
        tx_type="payment",
        amount=request.amount,
        description=request.description or f"Thanh toán phiếu BH #{request.ticket_id}",
        email=email
    )
    
    return {
        "success": True,
        "message": f"Thanh toán {request.amount:,.0f} VND thành công",
        "new_balance": wallet["balance"]
    }

@router.post("/refund")
async def refund_payment(ticket_id: int, email: str = "admin@warranty.vn"):
    """Refund payment for a ticket"""
    wallet = get_or_create_wallet(email)
    
    # Mock refund amount
    refund_amount = 500000  # 500k mock
    
    wallet["balance"] += refund_amount
    wallet["total_topup"] += refund_amount
    wallet["updated_at"] = datetime.now().isoformat()
    
    add_transaction(
        wallet_id=wallet["id"],
        tx_type="refund",
        amount=refund_amount,
        description=f"Hoàn tiền phiếu BH #{ticket_id}",
        email=email
    )
    
    return {
        "success": True,
        "message": f"Hoàn {refund_amount:,.0f} VND thành công",
        "new_balance": wallet["balance"]
    }

@router.get("/history")
async def get_transaction_history(limit: int = 50, email: str = "admin@warranty.vn"):
    """Get transaction history"""
    transactions = TRANSACTIONS.get(email, [])[:limit]
    return {
        "transactions": transactions,
        "total": len(transactions)
    }

@router.get("/stats")
async def get_wallet_stats(email: str = "admin@warranty.vn"):
    """Get wallet statistics"""
    wallet = get_or_create_wallet(email)
    transactions = TRANSACTIONS.get(email, [])
    
    topup_total = sum(tx["amount"] for tx in transactions if tx["type"] == "topup")
    spent_total = sum(tx["amount"] for tx in transactions if tx["type"] == "payment")
    
    return {
        "wallet": wallet,
        "stats": {
            "total_topup": topup_total,
            "total_spent": spent_total,
            "transaction_count": len(transactions),
            "topup_count": len([t for t in transactions if t["type"] == "topup"]),
            "payment_count": len([t for t in transactions if t["type"] == "payment"]),
        }
    }
