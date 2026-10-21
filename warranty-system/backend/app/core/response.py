"""
Helper định dạng response theo envelope chuẩn rule TS ECC.

Envelope chỉ áp dụng cho RESPONSE LỖI (HTTPException). Response 200
giữ nguyên shape hiện tại để tránh phá 30+ call site ở frontend.
Đây là chiến lược Phase C an toàn — chỉ chuẩn hoá phần lỗi.
"""
from typing import Any, Optional


def error_envelope(
    message: str,
    status_code: int = 400,
    extra: Optional[dict] = None,
) -> dict:
    """Chuẩn hoá response lỗi. Frontend axios interceptor unwrap nếu gặp."""
    body = {
        "success": False,
        "error": {
            "message": message,
            "code": status_code,
        },
    }
    if extra:
        body["error"].update(extra)
    return body


def success_envelope(data: Any, meta: Optional[dict] = None) -> dict:
    """(Tuỳ chọn) Wrap response 200 nếu sau này muốn thống nhất.

    Hiện KHÔNG dùng ở main.py để tránh phá contract hiện tại.
    Để sẵn cho phase tiếp theo nếu frontend đồng ý đổi tất cả call site.
    """
    body = {"success": True, "data": data}
    if meta:
        body["meta"] = meta
    return body