"""Script kiểm chứng contract API shop + chatbot (chạy tay, không phải test pytest).

CHẠY: python verify_shop.py   (cần uvicorn đang chạy ở port 8000)
"""
import json
import sys

import requests

sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://127.0.0.1:8000"
API = f"{BASE}/api/v1"

PASS = 0
FAIL = 0


def check(label, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [OK]   {label}")
    else:
        FAIL += 1
        print(f"  [FAIL] {label} {detail}")


def section(title):
    print(f"\n=== {title} ===")


# === 1. Health ===
section("1. Health")
r = requests.get(f"{BASE}/health", timeout=10)
check("GET /health -> 200", r.status_code == 200, r.text)
check("status == ok", r.json().get("status") == "ok", r.text)

# === 2. Shop products ===
section("2. GET /shop/products")
r = requests.get(f"{API}/shop/products", params={"limit": 3}, timeout=10)
check("-> 200", r.status_code == 200, r.text)
body = r.json()
check("có items/total/limit/offset", set(body.keys()) == {"items", "total", "limit", "offset"}, list(body.keys()))
check("total == 16", body["total"] == 16, body["total"])
check("len(items) == 3", len(body["items"]) == 3, len(body["items"]))
check("limit == 3", body["limit"] == 3)
check("offset == 0", body["offset"] == 0)

# Shape ShopProduct (contract 1.2)
REQUIRED = {
    "id", "slug", "name", "brand", "category", "category_slug", "price",
    "original_price", "discount_percent", "rating", "review_count", "sold",
    "image_url", "attributes", "warranty_months", "warranty_label", "stock",
    "status", "badge", "installment_monthly", "installment_months", "owned",
    "description", "specs",
}
item = body["items"][0]
missing = REQUIRED - set(item.keys())
check("ShopProduct đủ field theo contract 1.2", not missing, f"thiếu {missing}")
check("price là int", isinstance(item["price"], int), type(item["price"]))
check("original_price là int", isinstance(item["original_price"], int))
check("discount_percent 0-99", 0 <= item["discount_percent"] <= 99, item["discount_percent"])
check("attributes là list", isinstance(item["attributes"], list))
check("specs là dict", isinstance(item["specs"], dict))
check("status hợp lệ", item["status"] in ("available", "low_stock", "out_of_stock"), item["status"])
check("installment_monthly == price // 12", item["installment_monthly"] == item["price"] // 12,
      f"{item['installment_monthly']} vs {item['price'] // 12}")
if item["badge"]:
    check("badge.tone hợp lệ",
          item["badge"]["tone"] in {"flash", "danger", "warning", "success", "info", "brand", "neutral"},
          item["badge"])

# Sort
r = requests.get(f"{API}/shop/products", params={"sort": "price-asc", "limit": 5}, timeout=10)
prices = [i["price"] for i in r.json()["items"]]
check("sort=price-asc tăng dần", prices == sorted(prices), prices)

# Filter category + q
r = requests.get(f"{API}/shop/products", params={"category": "tivi"}, timeout=10)
check("filter category=tivi trả về SP tivi",
      all(i["category_slug"] == "tivi" for i in r.json()["items"]), r.json()["total"])
r = requests.get(f"{API}/shop/products", params={"q": "samsung"}, timeout=10)
check("filter q=samsung có kết quả", r.json()["total"] >= 1, r.json()["total"])

# === 3. Product detail ===
section("3. GET /shop/products/{slug}")
r = requests.get(f"{API}/shop/products/tivi-qled-4k-55-inch", timeout=10)
check("-> 200", r.status_code == 200, r.text)
detail = r.json()
check("đủ field chi tiết", not (REQUIRED - set(detail.keys())))
check("có specs không rỗng", bool(detail["specs"]))
check("có description", bool(detail["description"]))
check("image_url trỏ /static/shop/", detail["image_url"].startswith("/static/shop/"), detail["image_url"])
r = requests.get(f"{API}/shop/products/khong-ton-tai-xyz", timeout=10)
check("slug không tồn tại -> 404", r.status_code == 404, r.status_code)

# === 4. Categories ===
section("4. GET /shop/categories")
r = requests.get(f"{API}/shop/categories", timeout=10)
check("-> 200", r.status_code == 200, r.text)
cats = r.json()
check("là list", isinstance(cats, list))
check("mỗi cat có slug/name/icon/count/image_url",
      all(set(c.keys()) == {"slug", "name", "icon", "count", "image_url"} for c in cats))
check("tổng count == 16", sum(c["count"] for c in cats) == 16, sum(c["count"] for c in cats))

# === 5. Flash sale ===
section("5. GET /shop/flash-sale")
r = requests.get(f"{API}/shop/flash-sale", timeout=10)
check("-> 200", r.status_code == 200, r.text)
fs = r.json()
check("có ends_at + items", set(fs.keys()) == {"ends_at", "items"}, list(fs.keys()))
check("items không rỗng", len(fs["items"]) > 0, len(fs["items"]))
check("mọi item có discount_percent > 0", all(i["discount_percent"] > 0 for i in fs["items"]))
check("items <= 8", len(fs["items"]) <= 8, len(fs["items"]))
print(f"       ends_at = {fs['ends_at']}")

# === 6. Warranty lookup ===
section("6. POST /shop/warranty/lookup")
r = requests.post(f"{API}/shop/warranty/lookup", json={"serial": "TND-AC10-001"}, timeout=10)
check("-> 200", r.status_code == 200, r.text)
wl = r.json()
check("đủ field theo contract 1.1",
      set(wl.keys()) == {"found", "serial", "product_name", "category", "within_warranty",
                         "warranty_end_date", "warranty_months", "message"}, list(wl.keys()))
check("found == True", wl["found"] is True, wl)
check("within_warranty == YES", wl["within_warranty"] == "YES", wl["within_warranty"])
check("warranty_months == 24", wl["warranty_months"] == 24, wl["warranty_months"])
check("không lộ PII (không có email/sđt/tên chủ)",
      not any(k in wl for k in ("customer_name", "email", "phone", "owner", "customer_id")))
print(f"       message = {wl['message']}")

# Sản phẩm đã hết bảo hành
r = requests.post(f"{API}/shop/warranty/lookup", json={"serial": "TND-FAN03-001"}, timeout=10)
wl2 = r.json()
check("SP quá hạn -> within_warranty == NO", wl2["within_warranty"] == "NO", wl2)

# Serial không tồn tại -> 200 + found=false
r = requests.post(f"{API}/shop/warranty/lookup", json={"serial": "TND-XXX-999"}, timeout=10)
check("serial lạ -> 200", r.status_code == 200, r.status_code)
check("serial lạ -> found == False", r.json()["found"] is False, r.text)
check("serial lạ -> có message", bool(r.json()["message"]))

# === 7. Shop chat ===
section("7. POST /ai/shop-chat")
r = requests.post(f"{API}/ai/shop-chat",
                  json={"message": "tivi 4k dưới 15 triệu", "session_id": "demo-1"}, timeout=30)
check("-> 200", r.status_code == 200, r.text)
chat = r.json()
check("đủ field theo contract 1.3",
      set(chat.keys()) >= {"reply", "intent", "confidence", "source", "suggestions", "data", "actions"},
      list(chat.keys()))
check("reply không rỗng", bool(chat["reply"]))
check("source hợp lệ", chat["source"] in ("gemini", "rule"), chat["source"])
check("suggestions là list", isinstance(chat["suggestions"], list) and len(chat["suggestions"]) > 0)
check("data là dict", isinstance(chat["data"], dict))
check("actions là list", isinstance(chat["actions"], list))
check("data.products có sản phẩm", len(chat["data"].get("products", [])) > 0,
      chat["data"].get("products"))
print(f"       intent={chat['intent']} source={chat['source']} confidence={chat['confidence']}")
print(f"       reply: {chat['reply'][:160]}")

# Tra cứu bảo hành qua chat
r = requests.post(f"{API}/ai/shop-chat",
                  json={"message": "serial TND-AC10-001 còn bảo hành không", "session_id": "demo-1"},
                  timeout=30)
chat2 = r.json()
check("-> 200", r.status_code == 200, r.text)
check("data.within_warranty == YES", chat2["data"].get("within_warranty") == "YES", chat2["data"])
check("intent nhận diện warranty_check/serial_lookup",
      chat2["intent"] in ("warranty_check", "serial_lookup"), chat2["intent"])
print(f"       intent={chat2['intent']} source={chat2['source']} within={chat2['data'].get('within_warranty')}")

# Add to cart
r = requests.post(f"{API}/ai/shop-chat",
                  json={"message": "mua tivi này", "session_id": "demo-1"}, timeout=30)
chat3 = r.json()
check("-> 200", r.status_code == 200, r.text)
cart_actions = [a for a in chat3["actions"] if a["type"] == "add_to_cart"]
check("có action add_to_cart", len(cart_actions) > 0, chat3["actions"])
if cart_actions:
    a = cart_actions[0]
    check("action có type/label/payload/requires_confirmation",
          set(a.keys()) == {"type", "label", "payload", "requires_confirmation"}, list(a.keys()))
    check("payload có product_id/slug/name",
          set(a["payload"].keys()) == {"product_id", "slug", "name"}, list(a["payload"].keys()))
    check("requires_confirmation == False", a["requires_confirmation"] is False)
print(f"       intent={chat3['intent']} actions={[a['type'] for a in chat3['actions']]}")

# Create ticket -> requires_confirmation true
r = requests.post(f"{API}/ai/shop-chat",
                  json={"message": "tôi muốn tạo phiếu bảo hành cho serial TND-AC10-001"}, timeout=30)
chat4 = r.json()
tk = [a for a in chat4["actions"] if a["type"] == "create_ticket"]
check("có action create_ticket", len(tk) > 0, chat4["actions"])
if tk:
    check("create_ticket.requires_confirmation == True", tk[0]["requires_confirmation"] is True, tk[0])
    check("create_ticket.payload có serial/issue_description",
          set(tk[0]["payload"].keys()) == {"serial", "issue_description"}, list(tk[0]["payload"].keys()))

# Action type nằm trong danh sách đóng
ALLOWED = {"add_to_cart", "view_product", "lookup_serial", "create_ticket", "navigate", "call_hotline"}
all_actions = chat["actions"] + chat2["actions"] + chat3["actions"] + chat4["actions"]
check("mọi action.type nằm trong danh sách đóng",
      all(a["type"] in ALLOWED for a in all_actions), [a["type"] for a in all_actions])

# === 8. Static SVG ===
section("8. Static SVG")
r = requests.get(f"{BASE}/static/shop/tivi-qled-4k-55-inch.svg", timeout=10)
check("/static/shop/<slug>.svg -> 200", r.status_code == 200, r.status_code)
check("content-type svg", "svg" in r.headers.get("content-type", ""), r.headers.get("content-type"))
check("nội dung có <svg", "<svg" in r.text)

# === 9. Auth chat (POST /ai/chat) ===
section("9. POST /ai/chat (có auth)")
r = requests.post(f"{API}/auth/login",
                  json={"email": "demo@shop.vn", "password": "Demo@123"}, timeout=10)
check("login demo@shop.vn -> 200", r.status_code == 200, r.text)
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

r = requests.post(f"{API}/ai/chat",
                  json={"message": "serial TND-AC10-001 còn bảo hành không", "session_id": "s-1"},
                  headers=headers, timeout=30)
check("-> 200", r.status_code == 200, r.text)
ach = r.json()
check("có source", ach.get("source") in ("gemini", "rule"), ach.get("source"))
check("có actions", isinstance(ach.get("actions"), list))
check("data.session_id == s-1", ach.get("data", {}).get("session_id") == "s-1", ach.get("data"))
check("reply không rỗng", bool(ach.get("reply")))
print(f"       intent={ach.get('intent')} source={ach.get('source')}")

r = requests.post(f"{API}/ai/chat", json={"message": "xin chào"}, timeout=10)
check("/ai/chat yêu cầu auth -> 401/422", r.status_code in (401, 422), r.status_code)

# === Tổng kết ===
print(f"\n{'='*50}")
print(f"PASS: {PASS}   FAIL: {FAIL}")
print(f"{'='*50}")
sys.exit(1 if FAIL else 0)
