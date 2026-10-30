"""Gemini Service — gọi Gemini API thật bằng `urllib.request` (stdlib, không thêm dependency).

Nguyên tắc an toàn:
- Mọi lỗi (thiếu key, timeout, HTTP error, JSON sai shape) → raise `GeminiUnavailable`.
- Caller BẮT BUỘC bắt exception này và fallback về rule-based.
- Không bao giờ để lỗi AI làm sập request.

Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=<KEY>
"""
import json
import logging
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
)
REQUEST_TIMEOUT = 20  # giây

# Danh sách action type đóng (contract DEMO-NOTES mục 1.3)
ALLOWED_ACTION_TYPES = {
    "add_to_cart",
    "view_product",
    "lookup_serial",
    "create_ticket",
    "navigate",
    "call_hotline",
}

# Action cần người dùng xác nhận (không được tự thực hiện)
CONFIRM_ACTION_TYPES = {"create_ticket"}

# Hotline mặc định của shop
DEFAULT_HOTLINE = "0827461460"


class GeminiUnavailable(Exception):
    """Raised khi Gemini không dùng được — caller phải fallback rule-based."""


def is_enabled() -> bool:
    """Gemini có được bật không (AI_MODE=gemini + có key)."""
    return (settings.AI_MODE or "").strip().lower() == "gemini" and bool(
        (settings.GEMINI_API_KEY or "").strip()
    )


def _build_payload(system_prompt: str, user_prompt: str, history: Optional[List[Dict[str, str]]]) -> Dict[str, Any]:
    """Dựng body JSON theo Gemini REST API (generateContent)."""
    contents: List[Dict[str, Any]] = []

    # Lịch sử hội thoại (bỏ qua system, chỉ giữ user/assistant)
    for item in (history or []):
        role = (item.get("role") or "").strip().lower()
        content = (item.get("content") or "").strip()
        if not content:
            continue
        if role not in ("user", "assistant"):
            continue
        gemini_role = "user" if role == "user" else "model"
        contents.append({"role": gemini_role, "parts": [{"text": content}]})

    contents.append({"role": "user", "parts": [{"text": user_prompt}]})

    return {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "topP": 0.9,
            "maxOutputTokens": 2048,
        },
    }


def generate(
    system_prompt: str,
    user_prompt: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """Gọi Gemini và trả về text sinh ra.

    Raises:
        GeminiUnavailable: mọi lỗi (thiếu key / network / timeout / HTTP / shape sai).
    """
    if not is_enabled():
        raise GeminiUnavailable("Gemini chưa được bật (AI_MODE != 'gemini' hoặc thiếu GEMINI_API_KEY).")

    key = (settings.GEMINI_API_KEY or "").strip()
    url = f"{GEMINI_ENDPOINT}?key={key}"
    payload = _build_payload(system_prompt, user_prompt, history)
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
            raw = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", errors="replace")[:300]
        except Exception:
            pass
        raise GeminiUnavailable(f"Gemini HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise GeminiUnavailable(f"Không kết nối được Gemini: {exc.reason}") from exc
    except TimeoutError as exc:
        raise GeminiUnavailable(f"Gemini timeout sau {REQUEST_TIMEOUT}s.") from exc
    except Exception as exc:  # pragma: no cover - lỗi lạ (socket, SSL...)
        raise GeminiUnavailable(f"Lỗi gọi Gemini: {exc}") from exc

    try:
        data = json.loads(raw)
    except (ValueError, TypeError) as exc:
        raise GeminiUnavailable("Gemini trả về JSON không hợp lệ.") from exc

    return _extract_text(data)


def _extract_text(data: Dict[str, Any]) -> str:
    """Lấy `candidates[0].content.parts[0].text` — raise nếu shape sai."""
    candidates = data.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise GeminiUnavailable("Gemini không trả về candidate nào.")

    first = candidates[0]
    if not isinstance(first, dict):
        raise GeminiUnavailable("Gemini trả về candidate sai shape.")

    content = first.get("content")
    if not isinstance(content, dict):
        raise GeminiUnavailable("Gemini trả về content thiếu.")

    parts = content.get("parts")
    if not isinstance(parts, list) or not parts:
        raise GeminiUnavailable("Gemini trả về parts rỗng.")

    texts = [p.get("text", "") for p in parts if isinstance(p, dict) and p.get("text")]
    if not texts:
        raise GeminiUnavailable("Gemini không sinh ra nội dung text.")

    return "\n".join(texts).strip()


# === Parse action từ reply của Gemini ===
_FENCE_RE = re.compile(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", re.DOTALL)


def _coerce_action(raw: Any) -> Optional[Dict[str, Any]]:
    """Chuẩn hoá 1 action — chỉ giữ type nằm trong danh sách đóng."""
    if not isinstance(raw, dict):
        return None

    action_type = str(raw.get("type") or "").strip().lower()
    if action_type not in ALLOWED_ACTION_TYPES:
        return None

    payload = raw.get("payload")
    if not isinstance(payload, dict):
        payload = {}

    label = raw.get("label")
    label = str(label).strip() if label else _default_label(action_type)

    requires_confirmation = raw.get("requires_confirmation")
    if not isinstance(requires_confirmation, bool):
        requires_confirmation = action_type in CONFIRM_ACTION_TYPES
    # An toàn: `create_ticket` LUÔN cần xác nhận, không tin giá trị do AI gửi lên
    if action_type in CONFIRM_ACTION_TYPES:
        requires_confirmation = True

    return {
        "type": action_type,
        "label": label,
        "payload": payload,
        "requires_confirmation": requires_confirmation,
    }


def _default_label(action_type: str) -> str:
    return {
        "add_to_cart": "Thêm vào giỏ",
        "view_product": "Xem sản phẩm",
        "lookup_serial": "Tra cứu bảo hành",
        "create_ticket": "Tạo phiếu bảo hành",
        "navigate": "Xem thêm",
        "call_hotline": "Gọi hotline",
    }.get(action_type, "Thực hiện")


def parse_actions(reply_text: str) -> List[Dict[str, Any]]:
    """Trích action từ reply Gemini (JSON fenced ```json {...}```).

    Trả về list action đã chuẩn hoá (chỉ giữ type hợp lệ). Không ném exception.
    """
    if not reply_text:
        return []

    candidates: List[Any] = []

    # 1) fenced block
    for match in _FENCE_RE.finditer(reply_text):
        block = match.group(1)
        try:
            parsed = json.loads(block)
        except (ValueError, TypeError):
            continue
        if isinstance(parsed, list):
            candidates.extend(parsed)
        elif isinstance(parsed, dict):
            if isinstance(parsed.get("actions"), list):
                candidates.extend(parsed["actions"])
            else:
                candidates.append(parsed)

    # 2) JSON thô nhúng trong text (fallback)
    if not candidates:
        for match in re.finditer(r"\{.*\}", reply_text, re.DOTALL):
            try:
                parsed = json.loads(match.group(0))
            except (ValueError, TypeError):
                continue
            if isinstance(parsed, dict):
                if isinstance(parsed.get("actions"), list):
                    candidates.extend(parsed["actions"])
                else:
                    candidates.append(parsed)
            elif isinstance(parsed, list):
                candidates.extend(parsed)

    actions: List[Dict[str, Any]] = []
    for item in candidates:
        action = _coerce_action(item)
        if action:
            actions.append(action)
    return actions
