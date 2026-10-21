"""
VNPay Service - Xử lý logic tạo QR và webhook
"""

import hashlib
import hmac
import time
import random
import string
from datetime import datetime
from typing import Optional, Dict, Any
from urllib.parse import urlencode

# VNPay Configuration
VNPAY_CONFIG = {
    "vnp_Version": "2.1.0",
    "vnp_Command": "pay",
    "vnp_CurrCode": "VND",
    "vnp_Locale": "vn",
    "vnp_OrderType": "topup",
}


def generate_txn_ref(prefix: str = "TOPUP") -> str:
    """Generate unique transaction reference"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}-{timestamp}-{random_str}"


def create_payment_url(
    amount: int,
    txn_ref: str,
    order_info: str,
    return_url: str,
    ip_addr: str,
    client_id: str,
    api_key: str,
    base_url: str = "https://sandbox.vnpayment.vn/apis"
) -> str:
    """
    Tạo URL thanh toán VNPay với QR Code
    
    Args:
        amount: Số tiền (VND)
        txn_ref: Mã giao dịch duy nhất
        order_info: Thông tin đơn hàng
        return_url: URL callback sau khi thanh toán
        ip_addr: IP của khách hàng
        client_id: VNPay Client ID
        api_key: VNPay API Key
        base_url: VNPay API URL
    
    Returns:
        Payment URL để redirect user
    """
    
    # Build request parameters
    params = {
        "vnp_Version": VNPAY_CONFIG["vnp_Version"],
        "vnp_Command": VNPAY_CONFIG["vnp_Command"],
        "vnp_TmnCode": client_id,
        "vnp_Amount": str(amount * 100),  # VNPay yêu cầu * 100
        "vnp_CurrCode": VNPAY_CONFIG["vnp_CurrCode"],
        "vnp_TxnRef": txn_ref,
        "vnp_OrderInfo": order_info,
        "vnp_OrderType": VNPAY_CONFIG["vnp_OrderType"],
        "vnp_ReturnUrl": return_url,
        "vnp_IpAddr": ip_addr,
        "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        "vnp_ExpireDate": (datetime.now() + timedelta(minutes=15)).strftime("%Y%m%d%H%M%S"),
        "vnp_Locale": VNPAY_CONFIG["vnp_Locale"],
    }
    
    # Sort parameters alphabetically and build query string
    sorted_params = dict(sorted(params.items()))
    query_string = urlencode(sorted_params)
    
    # Calculate SecureHash
    hash_data = query_string
    secure_hash = hmac.new(
        api_key.encode('utf-8'),
        hash_data.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Build full payment URL
    payment_url = f"{base_url}/payment?{query_string}&vnp_SecureHash={secure_hash}"
    
    return payment_url


def verify_webhook(params: Dict[str, Any], checksum_key: str) -> bool:
    """
    Xác minh tính hợp lệ của webhook từ VNPay
    
    Args:
        params: Dictionary chứa tất cả params từ VNPay
        checksum_key: VNPay Checksum Key
    
    Returns:
        True nếu checksum hợp lệ
    """
    
    # Extract vnp_SecureHash từ params
    secure_hash_received = params.get("vnp_SecureHash", "")
    
    # Remove vnp_SecureHash from params to recalculate
    params_copy = {k: v for k, v in params.items() if k.startswith("vnp_") and k != "vnp_SecureHash"}
    
    # Sort by key
    sorted_params = dict(sorted(params_copy.items()))
    
    # Rebuild query string
    query_string = urlencode(sorted_params)
    
    # Calculate expected hash
    hash_data = query_string
    secure_hash_expected = hmac.new(
        checksum_key.encode('utf-8'),
        hash_data.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Compare
    return secure_hash_received.lower() == secure_hash_expected.lower()


def get_webhook_response(rsp_code: str, message: str) -> Dict[str, str]:
    """
    Tạo response object cho webhook VNPay
    
    Args:
        rsp_code: Mã phản hồi
        message: Thông điệp
    
    Returns:
        Response dict
    """
    return {
        "RspCode": rsp_code,
        "Message": message
    }


def parse_webhook_params(form_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse và validate params từ webhook
    
    Args:
        form_data: Raw form data từ request
    
    Returns:
        Parsed params với các trường chính
    """
    
    return {
        "txn_ref": form_data.get("vnp_TxnRef", ""),
        "amount": int(form_data.get("vnp_Amount", "0")) // 100,  # Convert back
        "bank_code": form_data.get("vnp_BankCode", ""),
        "bank_tran_no": form_data.get("vnp_BankTranNo", ""),
        "card_type": form_data.get("vnp_CardType", ""),
        "pay_date": form_data.get("vnp_PayDate", ""),
        "response_code": form_data.get("vnp_ResponseCode", ""),
        "transaction_no": form_data.get("vnp_TransactionNo", ""),
        "transaction_status": form_data.get("vnp_TransactionStatus", ""),
        "order_info": form_data.get("vnp_OrderInfo", ""),
        "secure_hash": form_data.get("vnp_SecureHash", ""),
    }


def is_payment_success(response_code: str, transaction_status: str) -> bool:
    """
    Kiểm tra xem thanh toán có thành công không
    
    Args:
        response_code: Mã phản hồi từ VNPay
        transaction_status: Trạng thái giao dịch
    
    Returns:
        True nếu thanh toán thành công
    """
    
    # Mã thành công của VNPay
    success_codes = ["00"]
    
    return (
        response_code in success_codes and 
        transaction_status in success_codes
    )


# Import timedelta for expiration calculation
from datetime import timedelta
