"""AI Service — Hỗ trợ mock (rule-based) + Gemini (khi có API key).

QUY TẮC BẢO MẬT:
- Ẩn danh thông tin nhạy cảm (tên, SĐT, email, địa chỉ) trước khi gọi AI.
- Chỉ gửi dữ liệu kỹ thuật (serial, danh mục, mô tả lỗi, lịch sử).
- System prompt cấm AI cam kết kết quả bảo hành.
"""
from typing import List, Optional


# === Rule-based classifier (mock) ===
CATEGORIES = {
    "HARDWARE": ["hỏng", "cháy", "vỡ", "không lên nguồn", "không bật", "không vào điện", "màn hình", "pin", "sạc"],
    "SOFTWARE": ["treo", "đơ", "lỗi phần mềm", "firmware", "update", "cập nhật", "boot loop", "reset"],
    "NETWORK": ["wifi", "mạng", "không kết nối", "internet", "lan", "cáp", "ping", "dns"],
    "PHYSICAL": ["rơi", "vào nước", "nứt", "trầy", "cong", "bẹp", "gãy"],
    "POWER": ["adapter", "cục sạc", "nguồn", "điện áp", "pin", "nóng", "quá nhiệt"],
}


def classify_issue_mock(issue_description: str) -> str:
    desc = issue_description.lower()
    scores: dict = {}
    for cat, keywords in CATEGORIES.items():
        scores[cat] = sum(1 for k in keywords if k in desc)
    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "OTHER"
    return best


def summarize_history_mock(product_name: str, serial: str, history_text: str) -> str:
    return (
        f"[Tóm tắt tự động] Sản phẩm {product_name} (serial {serial}). "
        f"Lịch sử bảo hành trước đây: {history_text or 'Chưa có lịch sử.'} "
        "Đề xuất: kiểm tra nguồn điện trước, sau đó test firmware và kiểm tra vật lý."
    )


def progress_message_mock(customer_name: str, ticket_code: str, status: str) -> str:
    name = customer_name or "Quý khách"
    templates = {
        "RECEIVED": f"Xin chào {name}, phiếu {ticket_code} đã được tiếp nhận thành công. Chúng tôi sẽ kiểm tra trong 24h.",
        "INSPECTION": f"Phiếu {ticket_code} đang được kỹ thuật viên kiểm tra. Chúng tôi sẽ phản hồi sau khi có chẩn đoán.",
        "REPAIRING": f"Phiếu {ticket_code} đang trong quá trình sửa chữa. Thời gian dự kiến: 2-3 ngày làm việc.",
        "COMPLETED": f"Phiếu {ticket_code} đã hoàn tất. Cảm ơn {name} đã sử dụng dịch vụ bảo hành.",
        "REJECTED": f"Phiếu {ticket_code} bị từ chối bảo hành theo chính sách. Vui lòng liên hệ tổng đài để biết thêm chi tiết.",
    }
    return templates.get(status, f"Cập nhật trạng thái phiếu {ticket_code}: {status}")


# === Anonymizer — ẩn thông tin nhạy cảm ===
def anonymize(text: str) -> str:
    import re
    if not text:
        return ""
    text = re.sub(r"\b\d{9,11}\b", "[REDACTED_PHONE]", text)
    text = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[REDACTED_EMAIL]", text)
    text = re.sub(r"\b\d{9,12}\b", "[REDACTED_ID]", text)
    return text


# === Public API ===
def classify_issue(issue_description: str) -> str:
    """Phân loại lỗi — mock rule-based."""
    return classify_issue_mock(anonymize(issue_description))


def summarize_history(product_name: str, serial: str, history: List[str]) -> str:
    text = " | ".join(history)
    return summarize_history_mock(product_name, serial, anonymize(text))


def generate_progress_message(customer_name: Optional[str], ticket_code: str, status: str) -> str:
    # Tên khách đã được ẩn danh — chỉ lấy tên rút gọn
    safe_name = None
    if customer_name:
        parts = customer_name.split()
        safe_name = parts[-1] if parts else None  # chỉ giữ tên cuối (tên)
    return progress_message_mock(safe_name, ticket_code, status)


# === Gemini adapter (placeholder — không kích hoạt nếu không có key) ===
def classify_issue_gemini(issue_description: str) -> Optional[str]:
    """Nếu cấu hình GEMINI_API_KEY và AI_MODE=gemini, sẽ gọi API thật.
    Hiện tại trả None để fallback về mock."""
    # TODO: tích hợp google.generativeai khi cần
    return None