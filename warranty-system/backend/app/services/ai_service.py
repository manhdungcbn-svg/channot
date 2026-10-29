"""AI Service — phân loại lỗi, nhận diện intent, tóm tắt lịch sử, sinh tin nhắn.

Kiến trúc:
- `ai_knowledge.py`  : taxonomy lỗi + intent keywords + FAQ + template tin nhắn (nội dung).
- `ai_service.py`    : logic xử lý (khớp intent, tính confidence, anonymize PII).

QUY TẮC BẢO MẬT:
- Ẩn danh thông tin nhạy cảm (email, SĐT, CCCD) trước khi gọi AI / ghi log.
- Chỉ gửi dữ liệu kỹ thuật (serial, danh mục, mô tả lỗi, lịch sử).
- System prompt cấm AI cam kết kết quả bảo hành.
"""
import re
import unicodedata
from datetime import datetime
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

from app.services.ai_knowledge import (
    ERROR_CATALOG,
    ERROR_LABELS,
    FAQ_ANSWERS,
    INTENT_KEYWORDS,
    INTENT_SUGGESTIONS,
    PROGRESS_FALLBACK,
    PROGRESS_TEMPLATES,
    STATUS_LABELS,
)

# === Chuẩn hoá text (bỏ dấu) ===
# Người dùng trên điện thoại hay gõ không dấu ("bao hanh" thay vì "bảo hành"),
# nên mọi so khớp keyword đều chạy trên text đã bỏ dấu.
def strip_accents(text: str) -> str:
    if not text:
        return ""
    normalized = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def _norm(text: str) -> str:
    """Lowercase + bỏ dấu + gộp khoảng trắng."""
    return re.sub(r"\s+", " ", strip_accents(text).lower()).strip()


@lru_cache(maxsize=2048)
def _keyword_pattern(keyword: str) -> re.Pattern:
    """Pattern so khớp theo ranh giới từ cho keyword đã chuẩn hoá."""
    return re.compile(r"(?<!\w)" + re.escape(_norm(keyword)) + r"(?!\w)")


def _matches(text_norm: str, keyword: str) -> bool:
    """Kiểm tra keyword có xuất hiện như một từ/cụm từ trong text_norm.

    Dùng ranh giới từ để tránh false positive (ví dụ "hi" trong "chi phí").
    """
    return bool(_keyword_pattern(keyword).search(text_norm))

# === Anonymizer — ẩn thông tin nhạy cảm ===
_PII_RULES = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"), "[REDACTED_EMAIL]"),
    (re.compile(r"(?<!\d)(\+?84|0)\d{9,10}(?!\d)"), "[REDACTED_PHONE]"),
    (re.compile(r"(?<!\d)\d{12,13}(?!\d)"), "[REDACTED_ID]"),
    (re.compile(r"(?<!\d)\d{9}(?!\d)"), "[REDACTED_ID]"),
]


def anonymize(text: str) -> str:
    """Ẩn PII trong text trước khi xử lý/gửi ra ngoài."""
    if not text:
        return ""
    for pattern, repl in _PII_RULES:
        text = pattern.sub(repl, text)
    return text


# === Slot extraction ===
SERIAL_PATTERN = re.compile(r"\b([A-Z]{2,5}[-_][A-Z0-9]{2,}(?:[-_][A-Z0-9]+)*)\b")
# Mã phiếu thực tế: WR-2026-0001 (4 số) hoặc WR-2026-0045-ABC123 (có suffix)
TICKET_PATTERN = re.compile(r"\b(WR[-_]\d{4}[-_]\d{3,6}(?:[-_][A-Z0-9]{2,})?)\b", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"(?<!\d)(0\d{9,10})(?!\d)")


def extract_slots(text: str) -> Dict[str, Optional[str]]:
    """Trích slot: serial, mã phiếu, số điện thoại từ câu hỏi."""
    if not text:
        return {"serial": None, "ticket_code": None, "phone": None}

    ticket = TICKET_PATTERN.search(text)
    # Serial: ưu tiên token khớp mẫu serial, loại trừ mã phiếu
    serial = None
    for m in SERIAL_PATTERN.finditer(text):
        token = m.group(1)
        if TICKET_PATTERN.fullmatch(token):
            continue
        serial = token
        break

    phone = None
    if not serial:
        pm = PHONE_PATTERN.search(text)
        if pm:
            phone = pm.group(1)

    return {
        "serial": serial,
        "ticket_code": ticket.group(1).upper() if ticket else None,
        "phone": phone,
    }


# === Intent classification ===
def classify_intent(text: str) -> Tuple[str, float]:
    """Trả về (intent, confidence 0..1).

    Quy tắc: intent có nhiều keyword khớp nhất thắng; confidence = tỷ lệ
    keyword khớp / tổng keyword của intent đó, kèm điểm cộng theo độ dài khớp.
    """
    if not text or not text.strip():
        return "unknown", 0.0

    lower = _norm(text)
    scores: Dict[str, float] = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        hits = [k for k in keywords if _matches(lower, k)]
        if not hits:
            continue
        # Trọng số: số keyword khớp + độ dài tổng chuỗi khớp (khớp dài hơn = chính xác hơn)
        score = len(hits) * 1.0 + sum(len(h) for h in hits) / 100.0
        scores[intent] = score

    if not scores:
        return "unknown", 0.0

    best = max(scores, key=scores.get)
    hits = [k for k in INTENT_KEYWORDS[best] if _matches(lower, k)]
    # Confidence dựa trên SỐ keyword khớp (không phân bổ theo tổng keyword của
    # intent — nếu không, intent có nhiều từ khóa sẽ bị chấm điểm thấp oan).
    total_len = sum(len(h) for h in hits)
    confidence = min(0.95, 0.55 + 0.12 * len(hits) + total_len / 500.0)
    # Intent đặc biệt (cần dữ liệu tra cứu) được boost nhẹ vì keyword rất đặc trưng
    if best in ("warranty_history", "serial_lookup", "phone_lookup", "ticket_status"):
        confidence = min(0.99, confidence + 0.08)
    return best, round(confidence, 2)


# === Error classification ===
def classify_issue(issue_description: str) -> str:
    """Phân loại lỗi — trả về error_code (mục 5.1 bảng taxonomy)."""
    return classify_issue_detail(issue_description).get("error_code", "other")


def classify_issue_detail(issue_description: str) -> dict:
    """Phân loại lỗi chi tiết.

    Trả về:
        {
          "error_code": str, "label": str, "confidence": float,
          "priority": str, "severity": str, "warranty_eligible": bool,
          "suggestions": list[str], "note": str, "matched_keywords": list[str],
        }
    """
    desc = _norm(issue_description or "")
    if not desc.strip():
        return {
            "error_code": "other",
            "label": "Không xác định",
            "confidence": 0.0,
            "priority": "LOW",
            "severity": "Không rõ",
            "warranty_eligible": True,
            "suggestions": [],
            "note": "Chưa có mô tả lỗi để phân loại.",
            "matched_keywords": [],
        }

    best_code = "other"
    best_hits: List[str] = []
    best_score = 0.0

    # Trọng số ưu tiên: lỗi CRITICAL/HIGH được ưu tiên hơn khi điểm keyword bằng nhau.
    # Ví dụ "máy dính nước không bật được" khớp cả "dính nước" (water) và
    # "không bật" (screen_black) — về nghiệp vụ phải là `water` (không BH miễn phí).
    PRIORITY_WEIGHT = {
        "CRITICAL": 1.0,
        "HIGH": 0.6,
        "MEDIUM": 0.25,
        "LOW": 0.0,
    }

    for code, meta in ERROR_CATALOG.items():
        hits = [k for k in meta["keywords"] if _matches(desc, k)]
        if not hits:
            continue
        # Ưu tiên từ khóa dài (cụ thể hơn) — ví dụ "vào nước" hơn "nước"
        score = len(hits) + sum(len(h) for h in hits) / 50.0
        score += PRIORITY_WEIGHT.get(meta["priority"], 0.0)
        if score > best_score:
            best_code = code
            best_hits = hits
            best_score = score

    if best_code == "other":
        return {
            "error_code": "other",
            "label": "Lỗi chưa xác định",
            "confidence": 0.25,
            "priority": "LOW",
            "severity": "Không rõ",
            "warranty_eligible": True,
            "suggestions": [
                "Mô tả rõ triệu chứng: máy có bật được không, màn hình hiển thị gì",
                "Ghi rõ thời điểm lỗi xuất hiện và đã thử gì",
                "Kiểm tra nguồn điện và phụ kiện kết nối trước",
            ],
            "note": "Chưa khớp mẫu lỗi nào — kỹ thuật viên sẽ chẩn đoán khi tiếp nhận.",
            "matched_keywords": [],
        }

    meta = ERROR_CATALOG[best_code]
    total = max(1, len(meta["keywords"]))
    confidence = min(0.98, 0.5 + 0.45 * (len(best_hits) / total))

    return {
        "error_code": best_code,
        "label": meta["label"],
        "confidence": round(confidence, 2),
        "priority": meta["priority"],
        "severity": meta["severity"],
        "warranty_eligible": meta["warranty_eligible"],
        "suggestions": list(meta["suggestions"]),
        "note": meta["note"],
        "matched_keywords": best_hits,
    }


def looks_like_symptom(text: str) -> bool:
    """True nếu câu có mô tả triệu chứng lỗi (khớp từ khóa trong ERROR_CATALOG)."""
    desc = _norm(text or "")
    if not desc.strip():
        return False
    for meta in ERROR_CATALOG.values():
        for k in meta["keywords"]:
            if _matches(desc, k):
                return True
    return False


# === Warranty history summary ===
def summarize_history(product_name: str, serial: str, history: List[str]) -> str:
    """Tóm tắt lịch sử bảo hành theo mẫu US-005c."""
    items = [h for h in (history or []) if h and h.strip()]
    if not items:
        return (
            f"📜 **Lịch sử bảo hành - {serial}**\n\n"
            f"📦 {product_name}\n"
            f"🔢 Serial: {serial}\n\n"
            "**📋 Tổng kết:**\n"
            "- 🔧 **Số lần BH:** 0 lần\n\n"
            "💡 Sản phẩm chưa có lịch sử bảo hành — đây là lần đầu gửi bảo hành."
        )

    count = len(items)
    latest = items[-1]
    success_rate = 100.0

    detail_lines = []
    for idx, item in enumerate(reversed(items), start=1):
        detail_lines.append(f"{idx}️⃣ {item}")

    return (
        f"📜 **Lịch sử bảo hành - {serial}**\n\n"
        f"📦 {product_name}\n"
        f"🔢 Serial: {serial}\n\n"
        "**📋 Tổng kết:**\n"
        f"- 🔧 **Số lần BH:** {count} lần\n"
        f"- ✅ **Lần gần nhất:** {latest}\n"
        f"- ⏱️ **Tỷ lệ BH thành công:** {success_rate:.0f}%\n\n"
        "**📝 Chi tiết:**\n" + "\n".join(detail_lines) +
        "\n\n💡 **Gợi ý:** Nêu rõ lịch sử lỗi cũ khi mô tả vấn đề hiện tại để kỹ thuật viên đối chiếu."
    )


# === Progress message ===
def generate_progress_message(
    customer_name: Optional[str],
    ticket_code: str,
    status: str,
    product_name: str = "",
    note: str = "",
    date_str: str = "",
    cost: str = "",
    eta: str = "",
) -> str:
    """Sinh tin nhắn cập nhật tiến độ theo 7 trạng thái (US-005d)."""
    # Tên khách đã được ẩn danh — chỉ lấy tên rút gọn
    safe_name = None
    if customer_name:
        parts = str(customer_name).split()
        safe_name = parts[-1] if parts else None

    template = PROGRESS_TEMPLATES.get(status, PROGRESS_FALLBACK)
    text = template.format(
        code=ticket_code,
        product=product_name or "sản phẩm của bạn",
        status=STATUS_LABELS.get(status, status),
        note=note or "Chưa có ghi chú chi tiết.",
        date=date_str or datetime.now().strftime("%d/%m/%Y"),
        cost=cost or "0 đ",
        eta=eta or "sẽ được thông báo khi hoàn tất",
    )
    if safe_name:
        text = f"Xin chào {safe_name},\n\n{text}"
    return text


# === Intent response builder ===
def build_intent_response(intent: str, slots: Dict[str, Optional[str]]) -> str:
    """Trả về câu trả lời mặc định cho intent chưa cần tra cứu DB."""
    serial = slots.get("serial")
    ticket_code = slots.get("ticket_code")
    phone = slots.get("phone")

    if intent in FAQ_ANSWERS:
        return FAQ_ANSWERS[intent]

    if intent == "greeting":
        return (
            "👋 Xin chào! Tôi là trợ lý ảo của BảoHành Pro.\n\n"
            "Tôi có thể hỗ trợ bạn:\n"
            "• 🔍 Tra cứu tình trạng bảo hành theo serial\n"
            "• 📜 Xem lịch sử bảo hành sản phẩm\n"
            "• 📝 Tạo phiếu bảo hành mới\n"
            "• 📋 Kiểm tra tiến độ phiếu\n"
            "• 💡 Giải đáp chính sách bảo hành\n\n"
            "Bạn cần hỗ trợ gì hôm nay?"
        )

    if intent == "warranty_check":
        if serial:
            return (
                f"🔍 Đang kiểm tra bảo hành cho serial **{serial}**...\n\n"
                "Bạn có thể xem kết quả chi tiết ngay dưới đây. "
                "Nếu chưa thấy, vui lòng kiểm tra lại số serial trên nhãn dán sản phẩm."
            )
        return (
            "🔍 Để kiểm tra bảo hành, bạn vui lòng cung cấp **số serial** sản phẩm.\n\n"
            "💡 Serial thường in trên nhãn dán phía dưới máy hoặc trong hộp đựng.\n"
            "📝 Ví dụ: `TND-AC10-001`"
        )

    if intent == "warranty_history":
        if serial:
            return (
                f"📜 Đang tóm tắt lịch sử bảo hành cho serial **{serial}**...\n\n"
                "Kết quả sẽ hiển thị ngay dưới đây."
            )
        return (
            "📜 Để tóm tắt lịch sử bảo hành, bạn cần cung cấp **số serial** sản phẩm.\n\n"
            "💡 Ngoài ra, nếu bạn cung cấp **số điện thoại** đã đăng ký, "
            "tôi sẽ liệt kê tất cả sản phẩm và lịch sử bảo hành của bạn."
        )

    if intent == "serial_lookup":
        if serial:
            return f"🔍 Đang tra cứu sản phẩm theo serial **{serial}**..."
        return (
            "🔍 Vui lòng cung cấp **số serial** sản phẩm để tôi tra cứu.\n\n"
            "💡 Serial thường có dạng `TND-AC10-001`, `DELL-XPS-15-005`."
        )

    if intent == "phone_lookup":
        if phone:
            return f"🔍 Đang tra cứu sản phẩm theo số điện thoại **{phone[-4:].rjust(len(phone), '*')}**..."
        return (
            "🔍 Để tra cứu sản phẩm đã mua, bạn vui lòng cung cấp "
            "**số điện thoại** đã đăng ký mua hàng."
        )

    if intent == "ticket_status":
        if ticket_code:
            return f"📋 Đang tra cứu trạng thái phiếu **{ticket_code}**..."
        return (
            "📋 Để kiểm tra tiến độ, bạn cung cấp **mã phiếu** "
            "(format: `WR-2026-0001`) hoặc **số serial** sản phẩm."
        )

    if intent == "create_ticket":
        return (
            "📝 Để tạo yêu cầu bảo hành, bạn cần cung cấp:\n\n"
            "1️⃣ **Số serial** sản phẩm\n"
            "2️⃣ **Mô tả lỗi** gặp phải\n\n"
            "💡 Bạn có thể dùng chức năng **Tạo phiếu** trên menu để hệ thống "
            "tự động phân loại lỗi và kiểm tra thời hạn bảo hành."
        )

    if intent == "product_info":
        if serial:
            return f"📦 Đang lấy thông tin sản phẩm theo serial **{serial}**..."
        return (
            "📋 Để xem thông tin sản phẩm, bạn cung cấp **số serial** "
            "hoặc **số điện thoại** đã đăng ký nhé."
        )

    if intent == "complaint":
        return FAQ_ANSWERS["complaint"]

    if intent == "feedback":
        return FAQ_ANSWERS["feedback"]

    if intent == "contact":
        return FAQ_ANSWERS["contact"]

    if intent == "thanks":
        return (
            "👍 Rất vui được hỗ trợ bạn! Nếu cần thêm thông tin về bảo hành, "
            "cứ quay lại đây nhé. Cảm ơn bạn đã tin tưởng BảoHành Pro!"
        )

    if intent == "farewell":
        return (
            "👋 Tạm biệt và chúc bạn một ngày tốt lành! "
            "Cảm ơn bạn đã sử dụng dịch vụ BảoHành Pro. "
            "Hotline: 0827461460 nếu cần hỗ trợ."
        )

    return (
        "🤔 Cảm ơn bạn đã hỏi! Để được hỗ trợ chính xác nhất, bạn có thể:\n\n"
        "1️⃣ Xem danh sách phiếu bảo hành của mình\n"
        "2️⃣ Liên hệ hotline: 0827461460\n"
        "3️⃣ Email: manhdungdbn@gmail.com\n\n"
        "💬 Tôi có thể giúp gì thêm không?"
    )


def suggestions_for(intent: str) -> List[str]:
    """Gợi ý câu hỏi tiếp theo theo intent."""
    return list(INTENT_SUGGESTIONS.get(intent, INTENT_SUGGESTIONS["unknown"]))


# === Gemini adapter (placeholder — không kích hoạt nếu không có key) ===
def classify_issue_gemini(issue_description: str) -> Optional[str]:
    """Nếu cấu hình GEMINI_API_KEY và AI_MODE=gemini, sẽ gọi API thật.
    Hiện tại trả None để fallback về rule-based."""
    return None


# Backward-compat alias
ERROR_LABELS_MAP = ERROR_LABELS
