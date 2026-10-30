"""Kiểm chứng: (1) luồng Gemini-enabled end-to-end (mock HTTP), (2) migration SQLite.

CHẠY: python verify_gemini_flow.py
"""
import io
import json
import os
import sys
import tempfile
import urllib.error

sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import create_engine, text

from app.core import migrations
from app.core.config import settings
from app.models.product import Product
from app.services import gemini_service, shop_chat_service
from app.core.database import SessionLocal

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


# ==================================================================
print("=== 1. Migration SQLite trên DB cũ (chỉ có cột cũ) ===")
tmpdir = tempfile.mkdtemp()
db_path = os.path.join(tmpdir, "old.db")
eng = create_engine(f"sqlite:///{db_path}")
with eng.begin() as conn:
    # Tạo bảng products đúng như schema CŨ (chưa có cột shop)
    conn.execute(text("""
        CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            name VARCHAR NOT NULL,
            serial_number VARCHAR NOT NULL UNIQUE,
            category VARCHAR NOT NULL,
            warranty_months INTEGER NOT NULL DEFAULT 12,
            manufacture_date DATE NOT NULL,
            customer_id INTEGER,
            price NUMERIC(12, 2),
            description TEXT
        )
    """))
    conn.execute(text(
        "INSERT INTO products (name, serial_number, category, warranty_months, manufacture_date) "
        "VALUES ('SP cũ', 'OLD-001', 'Tivi', 12, '2024-01-01')"
    ))

migrations.ensure_columns(eng)
with eng.connect() as conn:
    cols = {row[1] for row in conn.execute(text("PRAGMA table_info(products)")).fetchall()}
expected_new = {c[0] for c in migrations.PRODUCT_SHOP_COLUMNS}
check("tất cả cột shop mới đã được thêm", expected_new <= cols, expected_new - cols)
with eng.connect() as conn:
    cols = {row[1] for row in conn.execute(text("PRAGMA table_info(products)")).fetchall()}
    check("dữ liệu cũ vẫn còn", conn.execute(text("SELECT COUNT(*) FROM products")).scalar() == 1)

# Idempotent: chạy lần 2 không lỗi
migrations.ensure_columns(eng)
with eng.connect() as conn:
    cols2 = {row[1] for row in conn.execute(text("PRAGMA table_info(products)")).fetchall()}
check("chạy lần 2 idempotent (không đổi schema)", cols2 == cols)

# Đọc được cột mới qua SQL
with eng.connect() as conn:
    rows = conn.execute(text("SELECT name, slug, stock FROM products")).fetchall()
check("đọc được cột mới qua SQL", rows[0][1] is None and rows[0][2] is None, rows)

# ==================================================================
print("\n=== 2. Gemini-enabled end-to-end (mock HTTP) ===")
captured = {}


def fake_urlopen(request, timeout=None):
    captured["url"] = request.full_url
    captured["body"] = json.loads(request.data.decode("utf-8"))
    captured["timeout"] = timeout
    payload = {
        "candidates": [{
            "content": {"parts": [{"text": (
                "Mình gợi ý cho bạn tivi QLED 4K nhé!\n\n"
                "```json\n"
                '{"actions":[{"type":"add_to_cart","label":"Thêm vào giỏ",'
                '"payload":{"product_id":1,"slug":"tivi-qled-4k-55-inch","name":"Tivi QLED 4K 55 inch"}}]}\n'
                "```"
            )}]}
        }]
    }
    return io.BytesIO(json.dumps(payload).encode("utf-8"))


# Bật Gemini giả (không sửa .env)
settings.AI_MODE = "gemini"
settings.GEMINI_API_KEY = "test-key-123"
gemini_service.urllib.request.urlopen = fake_urlopen

db = SessionLocal()
try:
    result = shop_chat_service.chat(
        db=db,
        message="tivi 4k dưới 15 triệu",
        session_id="gem-1",
        history=[{"role": "user", "content": "chào"}, {"role": "assistant", "content": "chào bạn"}],
    )
    check("source == 'gemini'", result["source"] == "gemini", result["source"])
    check("reply lấy từ Gemini", "gợi ý" in result["reply"], result["reply"][:80])
    check("action add_to_cart parse từ reply Gemini",
          any(a["type"] == "add_to_cart" for a in result["actions"]), result["actions"])
    check("URL đúng endpoint Gemini + key",
          "generativelanguage.googleapis.com" in captured["url"]
          and "gemini-2.0-flash:generateContent" in captured["url"]
          and "key=test-key-123" in captured["url"], captured["url"])
    check("timeout = 20s", captured["timeout"] == 20, captured["timeout"])
    check("body có system_instruction", "system_instruction" in captured["body"], list(captured["body"]))
    check("body có history (user→user, assistant→model)",
          [c["role"] for c in captured["body"]["contents"]] == ["user", "model", "user"],
          [c["role"] for c in captured["body"]["contents"]])
    check("context có sản phẩm thật trong prompt",
          "tivi" in captured["body"]["contents"][-1]["parts"][0]["text"].lower())
    check("session_id trả về", result["session_id"] == "gem-1")

    # --- Gemini lỗi → fallback rule-based ---
    def failing_urlopen(request, timeout=None):
        raise urllib.error.URLError("Không có mạng")

    gemini_service.urllib.request.urlopen = failing_urlopen
    result2 = shop_chat_service.chat(db=db, message="tivi 4k dưới 15 triệu", session_id="gem-2")
    check("Gemini lỗi network -> source == 'rule'", result2["source"] == "rule", result2["source"])
    check("fallback vẫn có reply", bool(result2["reply"]))
    check("fallback vẫn có data.products", len(result2["data"].get("products", [])) > 0)

    # --- Gemini trả shape sai → fallback ---
    def bad_shape(request, timeout=None):
        return io.BytesIO(json.dumps({"unexpected": True}).encode("utf-8"))

    gemini_service.urllib.request.urlopen = bad_shape
    result3 = shop_chat_service.chat(db=db, message="tivi 4k dưới 15 triệu")
    check("Gemini shape sai -> source == 'rule'", result3["source"] == "rule", result3["source"])
    check("không sập request, có reply", bool(result3["reply"]))

    # --- Gemini HTTP 500 → fallback ---
    def http_500(request, timeout=None):
        raise urllib.error.HTTPError(request.full_url, 500, "Server Error", {}, None)

    gemini_service.urllib.request.urlopen = http_500
    result4 = shop_chat_service.chat(db=db, message="serial TND-AC10-001 còn bảo hành không")
    check("Gemini HTTP 500 -> source == 'rule'", result4["source"] == "rule", result4["source"])
    check("vẫn tra cứu được bảo hành", result4["data"].get("within_warranty") == "YES", result4["data"])
finally:
    db.close()
    # Khôi phục cấu hình
    settings.AI_MODE = "mock"
    settings.GEMINI_API_KEY = ""
    import urllib.request as _ur
    gemini_service.urllib.request.urlopen = _ur.urlopen

print(f"\n{'='*50}\nPASS: {PASS}   FAIL: {FAIL}\n{'='*50}")
sys.exit(1 if FAIL else 0)
