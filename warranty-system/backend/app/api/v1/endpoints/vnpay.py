"""
VNPay API Endpoints - Tạo QR, Webhook, Kiểm tra trạng thái
"""

from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import os

# Import services
from app.services.vnpay_service import (
    generate_txn_ref,
    create_payment_url,
    verify_webhook,
    get_webhook_response,
    parse_webhook_params,
    is_payment_success
)

# Import VietQR service
from app.services.vietqr_service import generate_vietqr, get_bank_list, BANK_CODES

# Import wallet functions
from app.api.v1.endpoints.wallet import get_or_create_wallet, add_transaction, WALLETS, TRANSACTIONS

router = APIRouter(prefix="/vnpay", tags=["VNPay"])

# ============ CONFIGURATION ============
# Load from environment or use default for development
VNPAY_CONFIG = {
    "client_id": os.getenv("VNPAY_CLIENT_ID", "4bb8dc72-dab4-4461-b948-68be413480fd"),
    "api_key": os.getenv("VNPAY_API_KEY", "aeab660f-2d60-4f69-b871-de9641db9b9a"),
    "checksum_key": os.getenv("VNPAY_CHECKSUM_KEY", "8e16554fbad0fcac2323104032c385b393cdcc7a27278daee9530b7acfbcebee"),
    "base_url": os.getenv("VNPAY_BASE_URL", "https://sandbox.vnpayment.vn/apis"),
    "return_url": os.getenv("VNPAY_RETURN_URL", "http://localhost:5173/wallet"),
    "webhook_url": os.getenv("VNPAY_WEBHOOK_URL", "http://localhost:8000/api/v1/wallet/vnpay/webhook"),
    "tmn_code": os.getenv("VNPAY_TMN_CODE", "4bb8dc72-dab4-4461-b948-68be413480fd"),
}

# Limits
MIN_AMOUNT = 10000    # 10,000 VND
MAX_AMOUNT = 50000000  # 50,000,000 VND
QR_EXPIRE_MINUTES = 15

# In-memory storage for VNPay transactions
VNPAY_TRANSACTIONS = {}  # txn_ref -> transaction info


# ============ PYDANTIC MODELS ============

class CreatePaymentRequest(BaseModel):
    """Request model for creating VNPay payment"""
    amount: int = Field(..., gt=0, description="Số tiền nạp (VND)")
    email: str = Field(default="admin@warranty.vn", description="Email người dùng")


class PaymentStatusResponse(BaseModel):
    """Response model for payment status"""
    txn_ref: str
    status: str  # pending, completed, failed, expired
    amount: int
    created_at: str
    paid_at: Optional[str] = None
    expires_at: Optional[str] = None
    vnp_transaction_no: Optional[str] = None
    bank_code: Optional[str] = None


class TransactionHistoryResponse(BaseModel):
    """Response model for transaction history"""
    transactions: List[dict]
    total: int


# ============ HELPER FUNCTIONS ============

def get_client_ip(request: Request) -> str:
    """Get client IP from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def create_vnpay_transaction(
    txn_ref: str,
    email: str,
    amount: int,
    ip_addr: str
) -> dict:
    """Create a new VNPay transaction record"""
    
    expires_at = datetime.now() + timedelta(minutes=QR_EXPIRE_MINUTES)
    
    transaction = {
        "txn_ref": txn_ref,
        "email": email,
        "amount": amount,
        "ip_addr": ip_addr,
        "status": "pending",  # pending, completed, failed, expired, cancelled
        "created_at": datetime.now().isoformat(),
        "expires_at": expires_at.isoformat(),
        "paid_at": None,
        "vnp_transaction_no": None,
        "vnp_response_code": None,
        "vnp_bank_code": None,
        "order_info": f"Nạp tiền ví {email}",
    }
    
    VNPAY_TRANSACTIONS[txn_ref] = transaction
    return transaction


def update_transaction_status(
    txn_ref: str,
    status: str,
    vnp_data: dict = None
):
    """Update transaction status"""
    
    if txn_ref not in VNPAY_TRANSACTIONS:
        return None
    
    txn = VNPAY_TRANSACTIONS[txn_ref]
    txn["status"] = status
    
    if vnp_data:
        txn["vnp_transaction_no"] = vnp_data.get("vnp_transaction_no")
        txn["vnp_response_code"] = vnp_data.get("vnp_response_code")
        txn["vnp_bank_code"] = vnp_data.get("vnp_bank_code")
    
    if status == "completed":
        txn["paid_at"] = datetime.now().isoformat()
    
    return txn


def check_expired_transactions():
    """Check and mark expired transactions"""
    now = datetime.now()
    expired = []
    
    for txn_ref, txn in VNPAY_TRANSACTIONS.items():
        if txn["status"] == "pending":
            expires_at = datetime.fromisoformat(txn["expires_at"])
            if now > expires_at:
                txn["status"] = "expired"
                expired.append(txn_ref)
    
    return expired


# ============ ENDPOINTS ============

@router.post("/create")
async def create_payment(
    request: Request,
    payment: CreatePaymentRequest
):
    """
    Tạo yêu cầu thanh toán VNPay QR Code
    
    Returns payment URL để redirect user đến VNPay
    """
    
    # Validate amount
    if payment.amount < MIN_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Số tiền tối thiểu là {MIN_AMOUNT:,} VND"
        )
    
    if payment.amount > MAX_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Số tiền tối đa là {MAX_AMOUNT:,} VND mỗi lần"
        )
    
    # Check if user wallet exists
    wallet = get_or_create_wallet(payment.email)
    
    # Generate transaction reference
    txn_ref = generate_txn_ref("TOPUP")
    
    # Get client IP
    ip_addr = get_client_ip(request)
    
    # Create transaction record
    transaction = create_vnpay_transaction(
        txn_ref=txn_ref,
        email=payment.email,
        amount=payment.amount,
        ip_addr=ip_addr
    )
    
    # Build order info
    order_info = f"Nạp tiền ví {payment.email}"
    
    # Create payment URL
    payment_url = create_payment_url(
        amount=payment.amount,
        txn_ref=txn_ref,
        order_info=order_info,
        return_url=VNPAY_CONFIG["return_url"],
        ip_addr=ip_addr,
        client_id=VNPAY_CONFIG["client_id"],
        api_key=VNPAY_CONFIG["api_key"],
        base_url=VNPAY_CONFIG["base_url"]
    )
    
    return {
        "success": True,
        "txn_ref": txn_ref,
        "payment_url": payment_url,
        "amount": payment.amount,
        "expires_at": transaction["expires_at"],
        "message": "Tạo QR thành công. Vui lòng thanh toán trong 15 phút."
    }


@router.get("/status/{txn_ref}")
async def get_payment_status(txn_ref: str):
    """
    Kiểm tra trạng thái thanh toán
    
    Returns status: pending, completed, failed, expired, cancelled
    """
    
    # Check for expired transactions first
    check_expired_transactions()
    
    if txn_ref not in VNPAY_TRANSACTIONS:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy giao dịch"
        )
    
    txn = VNPAY_TRANSACTIONS[txn_ref]
    
    return {
        "txn_ref": txn["txn_ref"],
        "status": txn["status"],
        "amount": txn["amount"],
        "email": txn["email"],
        "created_at": txn["created_at"],
        "expires_at": txn["expires_at"],
        "paid_at": txn["paid_at"],
        "vnp_transaction_no": txn["vnp_transaction_no"],
        "vnp_bank_code": txn["vnp_bank_code"],
    }


@router.post("/webhook")
async def vnpay_webhook(request: Request):
    """
    Webhook endpoint nhận thông báo từ VNPay
    
    Xử lý:
    1. Verify checksum
    2. Update transaction status
    3. Add balance to wallet if successful
    """
    
    # Get form data
    form_data = await request.form()
    params = dict(form_data)
    
    # Parse webhook params
    parsed = parse_webhook_params(params)
    
    # Verify checksum
    if not verify_webhook(params, VNPAY_CONFIG["checksum_key"]):
        return get_webhook_response("02", "Invalid checksum")
    
    txn_ref = parsed["txn_ref"]
    
    # Check if transaction exists
    if txn_ref not in VNPAY_TRANSACTIONS:
        return get_webhook_response("01", "Order not found")
    
    txn = VNPAY_TRANSACTIONS[txn_ref]
    
    # Check if already processed
    if txn["status"] in ["completed", "failed"]:
        return get_webhook_response("00", "Order already processed")
    
    # Check if expired
    if txn["status"] == "expired":
        return get_webhook_response("00", "Order already expired")
    
    # Check payment status
    is_success = is_payment_success(
        parsed["response_code"],
        parsed["transaction_status"]
    )
    
    vnp_data = {
        "vnp_transaction_no": parsed["transaction_no"],
        "vnp_response_code": parsed["response_code"],
        "vnp_bank_code": parsed["bank_code"],
    }
    
    if is_success:
        # Update transaction status
        update_transaction_status(txn_ref, "completed", vnp_data)
        
        # Add balance to wallet
        wallet = get_or_create_wallet(txn["email"])
        wallet["balance"] += txn["amount"]
        wallet["total_topup"] += txn["amount"]
        wallet["updated_at"] = datetime.now().isoformat()
        
        # Add transaction record
        add_transaction(
            wallet_id=wallet["id"],
            tx_type="topup",
            amount=txn["amount"],
            description=f"Nạp tiền qua VNPay (+{txn['amount']:,} VND) - Mã GD: {parsed['transaction_no']}",
            email=txn["email"]
        )
        
        return get_webhook_response("00", "Confirm Success")
    
    else:
        # Payment failed
        update_transaction_status(txn_ref, "failed", vnp_data)
        return get_webhook_response("00", "Payment failed but acknowledged")


@router.post("/cancel/{txn_ref}")
async def cancel_payment(txn_ref: str):
    """
    Hủy yêu cầu thanh toán đang chờ
    """
    
    if txn_ref not in VNPAY_TRANSACTIONS:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy giao dịch"
        )
    
    txn = VNPAY_TRANSACTIONS[txn_ref]
    
    if txn["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Không thể hủy giao dịch có trạng thái: {txn['status']}"
        )
    
    txn["status"] = "cancelled"
    
    return {
        "success": True,
        "message": "Đã hủy giao dịch thành công",
        "txn_ref": txn_ref
    }


@router.get("/history")
async def get_vnpay_history(email: str = "admin@warranty.vn"):
    """
    Lấy lịch sử giao dịch VNPay của user
    """
    
    # Filter transactions by email
    user_txns = [
        txn for txn in VNPAY_TRANSACTIONS.values()
        if txn["email"] == email
    ]
    
    # Sort by created_at descending
    user_txns.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "transactions": user_txns,
        "total": len(user_txns)
    }


@router.post("/simulate-complete/{txn_ref}")
async def simulate_payment_complete(txn_ref: str):
    """
    Simulate payment completion for testing/demo
    """
    
    if txn_ref not in VNPAY_TRANSACTIONS:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy giao dịch"
        )
    
    txn = VNPAY_TRANSACTIONS[txn_ref]
    
    if txn["status"] != "pending":
        return {
            "success": False,
            "message": f"Giao dịch đã có trạng thái: {txn['status']}"
        }
    
    # Mark as completed
    update_transaction_status(txn_ref, "completed", {
        "vnp_transaction_no": f"SIM-{txn_ref}",
        "vnp_response_code": "00",
        "vnp_bank_code": "VNPAY"
    })
    
    # Add balance to wallet
    wallet = get_or_create_wallet(txn["email"])
    wallet["balance"] += txn["amount"]
    wallet["total_topup"] += txn["amount"]
    wallet["updated_at"] = datetime.now().isoformat()
    
    # Add transaction record
    add_transaction(
        wallet_id=wallet["id"],
        tx_type="topup",
        amount=txn["amount"],
        description=f"Nạp tiền qua VNPay (+{txn['amount']:,} VND)",
        email=txn["email"]
    )
    
    return {
        "success": True,
        "message": "Thanh toán thành công",
        "amount": txn["amount"],
        "new_balance": wallet["balance"]
    }


@router.get("/return")
async def vnpay_return(request: Request):
    """
    Return URL - Redirect user back after payment
    
    VNPay sẽ redirect user về URL này sau khi thanh toán
    """
    
    # Get query params
    params = dict(request.query_params)
    
    # Parse params
    parsed = parse_webhook_params(params)
    
    txn_ref = parsed["txn_ref"]
    response_code = parsed["response_code"]
    amount = parsed["amount"]
    
    # Check if transaction exists
    if txn_ref in VNPAY_TRANSACTIONS:
        txn = VNPAY_TRANSACTIONS[txn_ref]
        
        # Build return URL with status
        status = "success" if response_code == "00" else "failed"
        return_url = f"{VNPAY_CONFIG['return_url']}?vnpay={status}&txn_ref={txn_ref}"
        
        return RedirectResponse(url=return_url, status_code=303)
    
    # Transaction not found
    return RedirectResponse(
        url=f"{VNPAY_CONFIG['return_url']}?vnpay=error&message=transaction_not_found",
        status_code=303
    )


# ============ VIETQR ENDPOINTS ============

@router.get("/vietqr/banks")
async def list_banks():
    """Lấy danh sách ngân hàng hỗ trợ VietQR"""
    return {
        "success": True,
        "banks": get_bank_list()
    }


class VietQRRequest(BaseModel):
    """Request model for VietQR"""
    bank_code: str = Field(..., description="Mã ngân hàng (VD: VCB, ICB, BIDV)")
    account_number: str = Field(..., description="Số tài khoản")
    account_name: str = Field(..., description="Tên chủ tài khoản")
    amount: int = Field(..., gt=0, description="Số tiền (VND)")
    content: str = Field(default="Nap tien vi bao hanh", description="Nội dung chuyển khoản")


@router.post("/vietqr/create")
async def create_vietqr(request: VietQRRequest):
    """
    Tạo VietQR chứa thông tin tài khoản ngân hàng
    
    QR này có thể quét được bằng app ngân hàng thật!
    """
    
    # Validate amount
    if request.amount < MIN_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Số tiền tối thiểu là {MIN_AMOUNT:,} VND"
        )
    
    if request.amount > MAX_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Số tiền tối đa là {MAX_AMOUNT:,} VND mỗi lần"
        )
    
    # Generate VietQR
    result = generate_vietqr(
        bank_code=request.bank_code,
        account_number=request.account_number,
        account_name=request.account_name,
        amount=request.amount,
        content=request.content
    )
    
    return {
        "success": True,
        "data": result,
        "message": "VietQR đã được tạo. Quét bằng app ngân hàng để thanh toán."
    }


# Thông tin tài khoản thật của người dùng
DEFAULT_BANK_ACCOUNT = {
    "bank_code": "BIDV",  # BIDV
    "account_number": "3300722488",
    "account_name": "Vu Manh Dung",  # Không dấu cho VietQR
    "bank_name": "BIDV"
}


@router.get("/vietqr/demo")
async def create_demo_vietqr(amount: int = 50000):
    """
    Tạo VietQR demo với tài khoản mẫu
    
    Để test nhanh. Thay đổi DEFAULT_BANK_ACCOUNT với thông tin thật của bạn.
    """
    
    if amount < MIN_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Số tiền tối thiểu là {MIN_AMOUNT:,} VND"
        )
    
    if amount > MAX_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Số tiền tối đa là {MAX_AMOUNT:,} VND"
        )
    
    # Generate VietQR với tài khoản mặc định
    result = generate_vietqr(
        bank_code=DEFAULT_BANK_ACCOUNT["bank_code"],
        account_number=DEFAULT_BANK_ACCOUNT["account_number"],
        account_name=DEFAULT_BANK_ACCOUNT["account_name"],
        amount=amount,
        content=f"Nap tien vi BH-{datetime.now().strftime('%Y%m%d%H%M')}"
    )
    
    return {
        "success": True,
        "data": result,
        "message": "Quét QR bằng app ngân hàng (ZaloPay, VNPay, MoMo, MB Bank, v.v.)",
        "note": "Đây là QR demo. Thay đổi DEFAULT_BANK_ACCOUNT trong code với thông tin thật."
    }


@router.get("/vietqr/test-page")
async def vietqr_test_page(amount: int = 50000):
    """
    Trang test VietQR - Hiển thị QR trực tiếp trong trình duyệt
    """
    
    if amount < MIN_AMOUNT:
        amount = MIN_AMOUNT
    if amount > MAX_AMOUNT:
        amount = MAX_AMOUNT
    
    # Generate VietQR
    result = generate_vietqr(
        bank_code=DEFAULT_BANK_ACCOUNT["bank_code"],
        account_number=DEFAULT_BANK_ACCOUNT["account_number"],
        account_name=DEFAULT_BANK_ACCOUNT["account_name"],
        amount=amount,
        content=f"Nap tien vi BH-{datetime.now().strftime('%Y%m%d%H%M')}"
    )
    
    # Tạo HTML page
    html = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VietQR Test - {amount:,} VND</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .container {{
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
            }}
            h1 {{
                color: #333;
                margin-bottom: 10px;
            }}
            .amount {{
                font-size: 36px;
                font-weight: bold;
                color: #e74c3c;
                margin: 20px 0;
            }}
            .bank-info {{
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: left;
            }}
            .bank-info p {{
                margin: 8px 0;
                color: #555;
            }}
            .bank-info strong {{
                color: #333;
            }}
            .qr-container {{
                margin: 20px 0;
                padding: 20px;
                background: white;
                border: 2px solid #eee;
                border-radius: 10px;
                display: inline-block;
            }}
            .qr-container img {{
                width: 250px;
                height: 250px;
            }}
            .instructions {{
                color: #666;
                font-size: 14px;
                margin-top: 20px;
                line-height: 1.6;
            }}
            .warning {{
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                margin-top: 15px;
            }}
            .success-note {{
                color: #28a745;
                font-weight: bold;
                margin-top: 15px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎉 VietQR Test</h1>
            
            <div class="amount">{amount:,} VND</div>
            
            <div class="bank-info">
                <p><strong>Ngân hàng:</strong> {result['bank_name']}</p>
                <p><strong>Số tài khoản:</strong> {result['account_number']}</p>
                <p><strong>Tên tài khoản:</strong> {result['account_name']}</p>
                <p><strong>Nội dung:</strong> {result['content']}</p>
            </div>
            
            <div class="qr-container">
                <img src="{result['qr_image']}" alt="VietQR Code">
            </div>
            
            <div class="instructions">
                <strong>Hướng dẫn:</strong><br>
                1. Mở app ngân hàng (BIDV, MB Bank, TPBank...)<br>
                2. Chọn "Quét QR"<br>
                3. Quét mã QR bên trên<br>
                4. Xác nhận thanh toán {amount:,} VND
            </div>
            
            <div class="warning">
                ⚠️ Đây là môi trường TEST. Quét QR để chuyển tiền thật!
            </div>
            
            <p class="success-note">💰 Tiền sẽ vào tài khoản BIDV của bạn</p>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html)


@router.post("/vietqr/confirm")
async def confirm_vietqr_payment(
    txn_ref: str,
    email: str = "admin@warranty.vn"
):
    """
    Xác nhận thanh toán VietQR (sau khi đã chuyển khoản thành công)
    
    Gọi API này để cộng tiền vào ví sau khi đã quét QR và thanh toán thực.
    """
    
    # Check if transaction exists in VNPAY_TRANSACTIONS
    if txn_ref in VNPAY_TRANSACTIONS:
        txn = VNPAY_TRANSACTIONS[txn_ref]
        if txn["status"] == "completed":
            return {
                "success": True,
                "message": "Giao dịch đã được xử lý trước đó",
                "txn_ref": txn_ref
            }
    
    # Get wallet
    wallet = get_or_create_wallet(email)
    
    # Get amount from request body
    # Parse amount from txn_ref if possible
    amount = 0
    for key in VNPAY_TRANSACTIONS:
        if key == txn_ref:
            amount = VNPAY_TRANSACTIONS[key]["amount"]
            break
    
    if amount <= 0:
        # Default amount for manual confirmation
        amount = 50000  # Default 50k
    
    # Create transaction record
    create_vnpay_transaction(
        txn_ref=txn_ref,
        email=email,
        amount=amount,
        ip_addr="manual"
    )
    
    # Mark as completed
    update_transaction_status(txn_ref, "completed", {
        "vnp_transaction_no": f"QR-{txn_ref}",
        "vnp_response_code": "00",
        "vnp_bank_code": "VietQR"
    })
    
    # Add balance to wallet
    wallet["balance"] += amount
    wallet["total_topup"] += amount
    wallet["updated_at"] = datetime.now().isoformat()
    
    # Add transaction record
    add_transaction(
        wallet_id=wallet["id"],
        tx_type="topup",
        amount=amount,
        description=f"Nạp tiền qua VietQR (+{amount:,} VND) - Mã GD: QR-{txn_ref}",
        email=email
    )
    
    return {
        "success": True,
        "message": f"Đã xác nhận thanh toán {amount:,} VND",
        "new_balance": wallet["balance"]
    }
