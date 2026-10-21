"""
VietQR Service - Tạo QR chứa thông tin tài khoản ngân hàng
Chuẩn VietQR 2.0 theo EMVCo Specification
"""

import qrcode
import io
import base64
from typing import Optional, Dict, Any
from datetime import datetime

# Danh sách mã ngân hàng VietQR
BANK_CODES = {
    "VCB": {"id": "970436", "name": "Vietcombank"},
    "ICB": {"id": "970415", "name": "VietinBank"},
    "BIDV": {"id": "970418", "name": "BIDV"},
    "AGRI": {"id": "970428", "name": "Agribank"},
    "TCB": {"id": "970407", "name": "Techcombank"},
    "VPB": {"id": "970432", "name": "VPBank"},
    "MB": {"id": "970422", "name": "MB Bank"},
    "ACB": {"id": "970416", "name": "ACB"},
    "TPB": {"id": "970423", "name": "TPBank"},
    "NCB": {"id": "970419", "name": "NCB"},
    "OCB": {"id": "970448", "name": "OCB"},
    "SCB": {"id": "970429", "name": "SCB"},
    "EXIM": {"id": "970431", "name": "Eximbank"},
    "HDB": {"id": "970437", "name": "HDBank"},
    "MSB": {"id": "970426", "name": "MSB"},
    "SHB": {"id": "970443", "name": "SHB"},
    "ABB": {"id": "970425", "name": "ABBank"},
    "VAB": {"id": "970427", "name": "VietABank"},
    "VIB": {"id": "970441", "name": "VIB"},
    "SSB": {"id": "970440", "name": "SeABank"},
    "STB": {"id": "970403", "name": "Sacombank"},
    "PGB": {"id": "970430", "name": "PGBank"},
    "GPB": {"id": "970408", "name": "GPBank"},
    "KLB": {"id": "970452", "name": "Kienlongbank"},
    "DOB": {"id": "970406", "name": "DongA Bank"},
    "CAKE": {"id": "546888", "name": "CAKE"},
    "Ubank": {"id": "546035", "name": "Ubank"},
    "TIMO": {"id": "963388", "name": "Timo"},
    "Shinhan": {"id": "970424", "name": "Shinhan Bank"},
}


def crc16_xmodem(data: str) -> str:
    """
    Tính CRC16 theo chuẩn XModem cho VietQR
    """
    crc = 0x0000
    for char in data:
        crc ^= ord(char) << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return format(crc, '04X')


def emv_field(id: str, value: str) -> str:
    """
    Tạo EMV field theo format: ID + length (2 digits) + value
    
    Args:
        id: Field ID (2 digits)
        value: Giá trị field
    
    Returns:
        String theo format EMV
    """
    return f"{id}{len(value):02d}{value}"


def build_vietqr_string(
    bank_code: str,
    account_number: str,
    account_name: str,
    amount: int,
    content: str = ""
) -> str:
    """
    Build VietQR string theo chuẩn VietQR 2.0 (EMVCo)
    
    Format EMVCo QR:
    - 00: Payload Format Indicator
    - 01: Point of Initiation Method (11 = QR tĩnh)
    - 38: Merchant ID / Bank ID
    - 02: Account Number
    - 03: Account Type
    - 04: Merchant Name
    - 05: Currency (VND = 704)
    - 06: Amount
    - 08: Country Code
    - 10: Additional Data (bill number / content)
    - 63: CRC
    """
    
    # Get bank info
    bank_info = BANK_CODES.get(bank_code.upper())
    if not bank_info:
        raise ValueError(f"Mã ngân hàng không hỗ trợ: {bank_code}")
    
    bank_id = bank_info["id"]
    
    # Chuyển tên sang không dấu cho VietQR
    account_name_ascii = remove_accents(account_name)
    
    # Nội dung mặc định
    if not content:
        content = "Nap tien vi BH"
    
    # Xây dựng các EMV fields
    fields = []
    
    # 00: Payload Format Indicator (01 = VietQR)
    fields.append(emv_field("00", "01"))
    
    # 01: Point of Initiation Method (11 = QR tĩnh)
    fields.append(emv_field("01", "11"))
    
    # 38: Merchant ID (Bank ID)
    fields.append(emv_field("38", bank_id))
    
    # 02: Account Number
    fields.append(emv_field("02", account_number))
    
    # 03: Account Type (01 = Default)
    fields.append(emv_field("03", "01"))
    
    # 04: Merchant Name
    fields.append(emv_field("04", account_name_ascii))
    
    # 05: Currency (704 = VND)
    fields.append(emv_field("05", "704"))
    
    # 06: Amount (nếu có)
    if amount > 0:
        fields.append(emv_field("06", str(amount)))
    
    # 08: Country Code
    fields.append(emv_field("08", "VN"))
    
    # 10: Additional Data - Bill Number / Reference
    fields.append(emv_field("10", content))
    
    # Ghép tất cả fields
    raw_data = "".join(fields)
    
    # Thêm CRC16
    crc = crc16_xmodem(raw_data)
    vietqr = raw_data + crc
    
    return vietqr


def remove_accents(text: str) -> str:
    """
    Chuyển chuỗi có dấu thành không dấu (ASCII)
    """
    import unicodedata
    
    # Chuẩn hóa Unicode và loại bỏ dấu
    normalized = unicodedata.normalize('NFD', text)
    ascii_text = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    
    # Thay thế các ký tự đặc biệt
    replacements = {
        'Đ': 'D', 'đ': 'd',
        'Ư': 'U', 'ư': 'u',
        'Ô': 'O', 'ô': 'o',
        'Ơ': 'O', 'ơ': 'o',
        'Â': 'A', 'â': 'a',
        'Ă': 'A', 'ă': 'a',
        'Ê': 'E', 'ê': 'e',
    }
    
    for special, normal in replacements.items():
        ascii_text = ascii_text.replace(special, normal)
    
    return ascii_text


def generate_qr_base64(data: str) -> str:
    """
    Generate QR code từ string và return as base64 PNG
    """
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_bytes = buffer.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    
    return img_base64


def generate_vietqr(
    bank_code: str,
    account_number: str,
    account_name: str,
    amount: int,
    content: str = None
) -> Dict[str, Any]:
    """
    Tạo VietQR hoàn chỉnh theo chuẩn VietQR 2.0
    
    Args:
        bank_code: Mã ngân hàng (VD: VCB, BIDV)
        account_number: Số tài khoản
        account_name: Tên chủ tài khoản (có thể có dấu)
        amount: Số tiền (VND)
        content: Nội dung chuyển khoản
    
    Returns:
        Dict với QR string, base64 image, và thông tin ngân hàng
    """
    
    # Default content
    if not content:
        content = f"Nap tien BH-{datetime.now().strftime('%Y%m%d%H%M')}"
    
    # Build VietQR string
    qr_string = build_vietqr_string(
        bank_code=bank_code,
        account_number=account_number,
        account_name=account_name,
        amount=amount,
        content=content
    )
    
    # Generate QR image
    qr_base64 = generate_qr_base64(qr_string)
    
    # Get bank info
    bank_info = BANK_CODES.get(bank_code.upper(), {})
    
    return {
        "qr_string": qr_string,
        "qr_image": f"data:image/png;base64,{qr_base64}",
        "bank_code": bank_code.upper(),
        "bank_name": bank_info.get("name", ""),
        "bank_id": bank_info.get("id", ""),
        "account_number": account_number,
        "account_name": account_name,
        "account_name_ascii": remove_accents(account_name),
        "amount": amount,
        "content": content,
        "created_at": datetime.now().isoformat()
    }


def get_bank_list() -> list:
    """
    Lấy danh sách các ngân hàng hỗ trợ VietQR
    """
    return [
        {"code": code, "id": info["id"], "name": info["name"]}
        for code, info in BANK_CODES.items()
    ]


# Test nếu chạy trực tiếp
if __name__ == "__main__":
    # Test với BIDV
    result = generate_vietqr(
        bank_code="BIDV",
        account_number="3300722488",
        account_name="Vu Manh Dung",  # Không dấu
        amount=50000,
        content="Test VietQR"
    )
    
    print("QR String:", result["qr_string"])
    print("Bank:", result["bank_name"])
    print("Account:", result["account_number"])
    print("Amount:", result["amount"])
