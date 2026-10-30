"""Kiểm chứng Gemini service: is_enabled, fallback, parse_actions (contract 1.3).

CHẠY: python verify_gemini.py
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")

from app.services import gemini_service as g

PASS = 0
FAIL = 0


def check(label, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  [OK]   {label}")
    else:
        FAIL += 1
        print(f"  [FAIL] {label} {detail}")


print("=== 1. is_enabled / fallback ===")
check("AI_MODE=mock -> is_enabled() False", g.is_enabled() is False)

try:
    g.generate("sys", "user")
    check("generate() raise GeminiUnavailable khi chưa bật", False, "không raise")
except g.GeminiUnavailable as e:
    check("generate() raise GeminiUnavailable khi chưa bật", True)
    print(f"       message: {str(e)[:80]}")

print("\n=== 2. parse_actions — JSON fenced ===")
reply = """Đây là gợi ý của bạn.

```json
{"actions":[{"type":"add_to_cart","label":"Thêm vào giỏ","payload":{"product_id":12,"slug":"tivi-qled","name":"Tivi QLED"}},{"type":"create_ticket","label":"Tạo phiếu","payload":{"serial":"TND-AC10-001","issue_description":"màn hình nhấp nháy"},"requires_confirmation":true}]}
```"""
acts = g.parse_actions(reply)
check("parse 2 action", len(acts) == 2, acts)
check("type add_to_cart", acts[0]["type"] == "add_to_cart")
check("add_to_cart.requires_confirmation False", acts[0]["requires_confirmation"] is False)
check("label giữ nguyên", acts[0]["label"] == "Thêm vào giỏ")
check("payload giữ nguyên", acts[0]["payload"] == {"product_id": 12, "slug": "tivi-qled", "name": "Tivi QLED"})
check("type create_ticket", acts[1]["type"] == "create_ticket")
check("create_ticket.requires_confirmation True", acts[1]["requires_confirmation"] is True)
check("mọi action có đủ 4 field",
      all(set(a.keys()) == {"type", "label", "payload", "requires_confirmation"} for a in acts))

print("\n=== 3. parse_actions — lọc type ngoài danh sách đóng ===")
reply2 = '```json\n{"actions":[{"type":"drop_database","payload":{}},{"type":"view_product","payload":{"slug":"x"}}]}\n```'
acts2 = g.parse_actions(reply2)
check("loại bỏ type không hợp lệ", [a["type"] for a in acts2] == ["view_product"], acts2)

print("\n=== 4. parse_actions — edge case ===")
check("reply thường -> []", g.parse_actions("xin chào, không có json") == [])
check("chuỗi rỗng -> []", g.parse_actions("") == [])
check("json hỏng -> []", g.parse_actions("```json\n{broken\n```") == [])
check("json thô không fenced -> vẫn parse",
      [a["type"] for a in g.parse_actions('{"actions":[{"type":"navigate","payload":{"href":"/x"}}]}')] == ["navigate"])
check("action thiếu payload -> payload {}",
      g.parse_actions('```json\n{"type":"call_hotline","payload":{"phone":"0827461460"}}\n```')[0]["payload"] == {"phone": "0827461460"})

print("\n=== 5. _extract_text ===")
data = {"candidates": [{"content": {"parts": [{"text": "Xin chào"}]}}]}
check("lấy candidates[0].content.parts[0].text", g._extract_text(data) == "Xin chào")
for bad, label in [
    ({}, "rỗng"),
    ({"candidates": []}, "candidates rỗng"),
    ({"candidates": [{}]}, "thiếu content"),
    ({"candidates": [{"content": {"parts": []}}]}, "parts rỗng"),
]:
    try:
        g._extract_text(bad)
        check(f"shape sai ({label}) -> raise", False)
    except g.GeminiUnavailable:
        check(f"shape sai ({label}) -> raise GeminiUnavailable", True)

print(f"\n{'='*50}\nPASS: {PASS}   FAIL: {FAIL}\n{'='*50}")
sys.exit(1 if FAIL else 0)
