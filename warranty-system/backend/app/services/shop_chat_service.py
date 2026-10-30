"""Shop Chat Service — chatbot storefront (public).

Luồng xử lý:
1. Nhận diện intent + slot (rule-based, nhanh & offline).
2. **Luôn** tra cứu DB cho các intent cần dữ liệu thật.
3. Nếu Gemini bật → gọi Gemini với system prompt + context (SP tìm được + kết quả tra cứu).
4. Nếu Gemini lỗi / thiếu key → fallback reply rule-based (`source = "rule"`).

Nguyên tắc: KHÔNG bịa giá/sản phẩm không có trong context, KHÔNG cam kết kết quả bảo hành,
KHÔNG tự tạo ticket (chỉ trả action `requires_confirmation=true`).
"""
import logging
import re
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.services import ai_service, gemini_service, shop_service

logger = logging.getLogger(__name__)

HOTLINE = gemini_service.DEFAULT_HOTLINE

# Cụm từ chắc chắn là intent thêm vào giỏ
CART_PHRASES = ("them vao gio", "mua ngay", "cho toi mua", "dat hang", "mua hang")

# Cụm từ chắc chắn là intent tư vấn/so sánh (ưu tiên cao hơn add_to_cart)
RECOMMEND_PHRASES = (
    "nen chon", "nen mua", "tu van", "goi y", "de xuat", "so sanh",
    "khac nhau", "nao tot hon", "nen mua cai nao", "tim san pham",
    "muon mua", "sp nao", "san pham nao", "tot nhat", "phao hop",
    "tivi nao", "mua cai nao", "co nen", "danh gia",
)

# Cụm từ yêu cầu tạo phiếu bảo hành
TICKET_PHRASES = (
    "tao phieu", "gui bao hanh", "yeu cau bao hanh", "tao yeu cau",
    "gui may", "bao hanh san pham", "tao ticket",
)

# Regex nhận diện ngân sách: "duoi 15 trieu", "tren 2 trieu", "15tr", "15 trieu"
_BUDGET_RE = re.compile(
    r"(duoi|tren|toi da|khong qua|duoi)\s*([\d.,]+)\s*(trieu|t\b|tr)\b"
)
_NUMBER_RE = re.compile(r"([\d.,]+)\s*(trieu|t\b|tr)\b")


def _norm(text: str) -> str:
    """Chuẩn hoá text (bỏ dấu, lowercase) — dùng `_norm` của ai_service."""
    return ai_service._norm(text or "")


def _extract_budget(text: str) -> Optional[int]:
    """Trích ngân sách (đồng) từ câu hỏi. Ví dụ 'dưới 15 triệu' → 15000000."""
    norm = _norm(text)
    match = _BUDGET_RE.search(norm)
    if not match:
        match = _NUMBER_RE.search(norm)
    if not match:
        return None
    try:
        amount = float(match.group(1).replace(".", "").replace(",", "."))
    except (TypeError, ValueError):
        return None
    return int(amount * 1_000_000)


def _is_cart_intent(text: str) -> bool:
    norm = _norm(text)
    if any(p in norm for p in RECOMMEND_PHRASES):
        return False
    return any(p in norm for p in CART_PHRASES) or "mua " in norm or norm.startswith("mua ")


def _is_ticket_intent(text: str) -> bool:
    norm = _norm(text)
    return any(p in norm for p in TICKET_PHRASES)


SYSTEM_PROMPT = """Bạn là trợ lý ảo của **Shopee Điện Tử** — website bán điện tử gia dụng.

QUY TẮC BẮT BUỘC:
1. Trả lời bằng **tiếng Việt**, thân thiện, ngắn gọn (Markdown: **bold**, `code`, emoji).
2. TUYỆT ĐỐI không bịa giá, không bịa tên sản phẩm, không bịa thông số. Chỉ dùng sản phẩm
   có trong CONTEXT được cung cấp. Nếu context rỗng, hãy nói rõ không tìm thấy và gợi ý từ khóa tìm kiếm khác.
3. TUYỆT ĐỐI không cam kết kết quả bảo hành (không nói "chắc chắn được bảo hành", "100% đổi mới").
   Chỉ dẫn chiếu thông tin tra cứu trong context và khuyên liên hệ trung tâm bảo hành.
4. Không tiết lộ thông tin cá nhân của chủ sở hữu sản phẩm (tên, email, số điện thoại).
5. Nếu người dùng muốn mua/thêm vào giỏ → kèm action JSON:
```json
{"actions": [{"type": "add_to_cart", "label": "Thêm vào giỏ", "payload": {"product_id": 1, "slug": "...", "name": "..."}, "requires_confirmation": false}]}
```
   Chỉ dùng `product_id`, `slug`, `name` LẤY TỪ CONTEXT.
6. Nếu người dùng muốn tạo phiếu bảo hành → dùng action `create_ticket` với
   `"requires_confirmation": true` (hệ thống sẽ hỏi xác nhận, KHÔNG tự tạo phiếu).
7. Danh sách action type được phép: add_to_cart, view_product, lookup_serial, create_ticket,
   navigate, call_hotline. Không dùng type ngoài danh sách này.
8. Action JSON phải nằm trong block ```json ... ``` ở CUỐI câu trả lời.
"""


def _build_context(products: List[Dict[str, Any]], warranty: Optional[Dict[str, Any]], extra: Dict[str, Any]) -> str:
    """Dựng phần context (dữ liệu thật) đưa cho Gemini."""
    import json

    lines: List[str] = []
    if warranty and warranty.get("found"):
        lines.append("=== KẾT QUẢ TRA CỨU BẢO HÀNH ===")
        lines.append(
            json.dumps(
                {
                    "serial": warranty.get("serial"),
                    "product_name": warranty.get("product_name"),
                    "category": warranty.get("category"),
                    "within_warranty": warranty.get("within_warranty"),
                    "warranty_end_date": warranty.get("warranty_end_date"),
                    "warranty_months": warranty.get("warranty_months"),
                },
                ensure_ascii=False,
            )
        )
    if products:
        lines.append("=== SẢN PHẨM TÌM ĐƯỢC (chỉ được phép nhắc các SP này) ===")
        for item in products:
            lines.append(
                json.dumps(
                    {
                        "id": item.get("id"),
                        "slug": item.get("slug"),
                        "name": item.get("name"),
                        "brand": item.get("brand"),
                        "category": item.get("category"),
                        "price": item.get("price"),
                        "original_price": item.get("original_price"),
                        "discount_percent": item.get("discount_percent"),
                        "rating": item.get("rating"),
                        "sold": item.get("sold"),
                        "stock": item.get("status"),
                        "warranty_label": item.get("warranty_label"),
                        "attributes": item.get("attributes"),
                    },
                    ensure_ascii=False,
                )
            )
    if extra:
        lines.append("=== THÔNG TIN BỔ SUNG ===")
        lines.append(str(extra))
    if not lines:
        lines.append("=== CONTEXT RỖNG — không có sản phẩm hay dữ liệu tra cứu nào ===")
    return "\n".join(lines)


def _match_target_product(
    message: str, products: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """Tìm sản phẩm mà người dùng đang nói đến (theo tên/slug trong câu)."""
    if not products:
        return None
    norm = _norm(message)

    # Khớp theo slug/tên nằm trong câu
    for item in products:
        slug = (item.get("slug") or "").lower()
        if slug and slug in norm.replace(" ", "-"):
            return item
    for item in products:
        name_norm = _norm(item.get("name") or "")
        if not name_norm:
            continue
        # khớp 2 từ đầu của tên (thường là tên thương hiệu + dòng sản phẩm)
        tokens = name_norm.split()
        if len(tokens) >= 2 and f"{tokens[0]} {tokens[1]}" in norm:
            return item
    # Không khớp rõ → lấy sản phẩm đầu tiên (đã sắp theo độ liên quan)
    return products[0]


def _build_action_add_to_cart(product: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "type": "add_to_cart",
        "label": "Thêm vào giỏ",
        "payload": {
            "product_id": product.get("id"),
            "slug": product.get("slug"),
            "name": product.get("name"),
        },
        "requires_confirmation": False,
    }


def _build_action_create_ticket(serial: Optional[str], issue: Optional[str]) -> Dict[str, Any]:
    return {
        "type": "create_ticket",
        "label": "Tạo phiếu bảo hành",
        "payload": {
            "serial": serial,
            "issue_description": issue or "",
        },
        "requires_confirmation": True,
    }


def _build_action_lookup_serial(serial: str) -> Dict[str, Any]:
    return {
        "type": "lookup_serial",
        "label": "Tra cứu bảo hành",
        "payload": {"serial": serial},
        "requires_confirmation": False,
    }


def chat(
    db: Session,
    message: str,
    session_id: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Xử lý 1 lượt chat storefront. Trả về dict đúng contract 1.3."""
    message = (message or "").strip()
    context = context or {}

    # === 1. Nhận diện intent + slot ===
    intent, confidence = ai_service.classify_intent(message)
    slots = ai_service.extract_slots(message)

    # Serial do client gửi kèm (context) được ưu tiên
    ctx_serial = context.get("serial") if isinstance(context, dict) else None
    if ctx_serial:
        slots["serial"] = str(ctx_serial).upper()

    # Ghi đè intent theo cụm từ rõ ràng (rule mạnh hơn điểm keyword)
    if _is_ticket_intent(message):
        intent = "create_ticket"
    elif _is_cart_intent(message):
        intent = "add_to_cart"

    products: List[Dict[str, Any]] = []
    warranty: Optional[Dict[str, Any]] = None
    actions: List[Dict[str, Any]] = []
    # `data` luôn có `products` + `serial` theo contract 1.3 (kể cả khi rỗng).
    data: Dict[str, Any] = {"products": [], "serial": slots.get("serial")}

    # === 2. Tra cứu DB (luôn làm cho intent cần data) ===
    if intent in ("warranty_check", "serial_lookup") and slots.get("serial"):
        warranty = shop_service.lookup_warranty(db, slots["serial"])
        data.update(
            {
                "found": warranty["found"],
                "within_warranty": warranty["within_warranty"],
                "product_name": warranty["product_name"],
                "category": warranty["category"],
                "warranty_end_date": warranty["warranty_end_date"],
                "warranty_months": warranty["warranty_months"],
                "warranty_message": warranty["message"],
                "serial": warranty["serial"],
            }
        )
        actions.append(_build_action_lookup_serial(warranty["serial"]))

    if intent in ("product_recommendation", "product_info", "product_compare", "add_to_cart"):
        products = shop_service.search_products_for_chat(db, message, limit=4)
        # Lọc theo ngân sách nếu câu có nhắc tới
        budget = _extract_budget(message)
        if budget:
            affordable = [p for p in products if (p.get("price") or 0) <= budget]
            if affordable:
                products = affordable
            else:
                # Không có SP nào trong ngân sách → lấy SP rẻ nhất trong tập tìm được
                products = sorted(products, key=lambda p: p.get("price") or 0)[:4]
        data["products"] = products

    if intent == "add_to_cart":
        target = _match_target_product(message, products)
        if target:
            data["target_product"] = target
            actions.append(_build_action_add_to_cart(target))
        else:
            # Không xác định được SP → hỏi lại (không có action, không show SP khác)
            products = []
            data["products"] = []

    if intent == "create_ticket":
        issue = message
        actions.append(_build_action_create_ticket(slots.get("serial"), issue))

    # === 3. Sinh reply ===
    reply = ""
    source = "rule"

    if gemini_service.is_enabled():
        try:
            ctx_text = _build_context(products, warranty, data.get("warranty_message", ""))
            user_prompt = (
                f"Câu hỏi của khách: {message}\n\n"
                f"CONTEXT (dữ liệu thật từ hệ thống):\n{ctx_text}\n\n"
                "Hãy trả lời khách hàng dựa trên CONTEXT ở trên."
            )
            reply = gemini_service.generate(SYSTEM_PROMPT, user_prompt, history=history)
            source = "gemini"
            # Action do Gemini đề xuất (chỉ giữ type hợp lệ)
            for act in gemini_service.parse_actions(reply):
                # Không cho Gemini tạo action add_to_cart sai sản phẩm ngoài context
                if act["type"] == "add_to_cart":
                    pid = (act.get("payload") or {}).get("product_id")
                    known = any(p.get("id") == pid for p in products)
                    if not known:
                        continue
                actions.append(act)
        except gemini_service.GeminiUnavailable as exc:
            logger.warning("Gemini không dùng được, fallback rule-based: %s", exc)
            reply = ""
        except Exception as exc:  # pragma: no cover - phòng thủ
            logger.warning("Lỗi Gemini không lường trước, fallback rule-based: %s", exc)
            reply = ""

    if not reply:
        source = "rule"
        reply = ai_service.build_shop_intent_response(
            intent, slots, {"products": products, "warranty": warranty or {}, "target_product": data.get("target_product")}
        )

    # Loại trùng action (cùng type + payload)
    unique_actions: List[Dict[str, Any]] = []
    seen = set()
    for act in actions:
        key = (act["type"], act.get("label"), str(sorted((act.get("payload") or {}).items())))
        if key in seen:
            continue
        seen.add(key)
        unique_actions.append(act)

    return {
        "reply": reply,
        "intent": intent,
        "confidence": confidence,
        "source": source,
        "suggestions": ai_service.suggestions_for(intent),
        "data": data,
        "actions": unique_actions,
        "session_id": session_id,
    }
