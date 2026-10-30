# BảoHành Pro + Shopee Điện Tử — Demo Notes & API Contract

> File nhật ký công việc + hợp đồng API chuẩn dùng chung giữa backend, storefront và warranty app.
> Cập nhật liên tục trong quá trình làm.

---

## 0. Kiến trúc tổng thể

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  warranty-system/frontend   │        │   ecommerce-frontend/        │
│  (Admin + Khách hàng)       │        │   (Storefront)               │
│  port 5174                  │        │   port 5175                  │
│  AdminLTE + Tailwind        │        │   Tailwind indigo design sys │
│  16 route, Chat AI          │        │   Hero/Grid/Footer + Chat AI │
└──────────────┬──────────────┘        └──────────────┬───────────────┘
               │  proxy /api → 8000                   │  proxy /api → 8000
               └───────────────┬──────────────────────┘
                               ▼
                 ┌─────────────────────────────┐
                 │  warranty-system/backend     │
                 │  FastAPI + SQLAlchemy        │
                 │  port 8000                   │
                 │  /api/v1/{auth,products,     │
                 │   customers,tickets,wallet,  │
                 │   finance,ai,notifications,  │
                 │   shop}                      │
                 └──────────────┬──────────────┘
                                ▼
                    ┌───────────────────┐
                    │  Gemini API       │  (AI_MODE=gemini)
                    │  fallback: rule   │  (AI_MODE=mock, mặc định)
                    └───────────────────┘
```

**Quyết định đã chốt (phiên họp 30/10/2026):**
- Chatbot AI: **Gemini API thật** với **fallback rule-based** → demo luôn chạy được kể cả chưa có key.
- Chatbot xuất hiện ở **cả 2**: storefront (khách chưa đăng nhập) + warranty app (khách đã đăng nhập, tra cứu dữ liệu thật).
- Chatbot **được phép thực hiện hành động** qua nút bấm xác nhận trong chat (action payload → frontend gọi API).
- Dữ liệu demo: **seed mới** phong pháp hơn (nhiều sản phẩm điện tử, phiếu ở mọi trạng thái).

### Phạm vi demo — đã chốt lại sau phản hồi của chủ dự án

> Chủ dự án nhấn mạnh: *"dự án của tôi là hệ thống quản trị bảo hành thiết bị"*.

| Quyết định | Hệ quả |
|---|---|
| **Demo 2 tab song song, ngang nhau** | Tab 1 = storefront (5175), Tab 2 = app bảo hành (5174) |
| **Storefront giữ nguyên** như hiện tại | Chỉ bổ sung liên kết chéo sang app bảo hành, không mở rộng thêm |
| **Chatbot = FAB nổi trên MỌI trang app bảo hành** | Khách vào trang nào cũng hỏi được ngay, không phải rời trang |

**Cách trình bày demo (kịch bản):**
1. Mở tab **app bảo hành** → đăng nhập `kh1@gmail.com` / `Khach@123` → Dashboard (thống kê phiếu, doanh thu, sản phẩm).
2. **FAB chatbot** góc phải → hỏi *"serial TND-WMS04-001 còn bảo hành không"* → bot trả lời kèm **card trạng thái bảo hành** thật từ DB (Tủ lạnh Inverter 300 lít, còn BH đến 2028-08-01).
3. Hỏi *"máy tôi màn hình nhấp nháy"* → bot **phân loại lỗi** ra `screen_flicker` + mức độ + gợi ý kiểm tra + action "Tạo phiếu bảo hành" (cần xác nhận).
4. Menu **Phiếu bảo hành → Tạo phiếu** (modal 4 bước có sẵn) → tạo phiếu thật → thấy ngay trong danh sách + AI tự tóm tắt cho kỹ thuật viên.
5. Kỹ thuật viên đổi trạng thái phiếu → **AI tự sinh tin nhắn cập nhật** → khách nhận qua Notification.
6. Chuyển sang tab **storefront** → chatbot tư vấn mua hàng → thêm vào giỏ → trang chi tiết SP → ô tra cứu bảo hành dùng chung hệ thống.

---

## 1. Hợp đồng API chuẩn (contract)

> **Nguồn sự thật duy nhất cho cả 3 agent.** Không được tự ý đổi shape response — nếu cần, sửa ở đây trước.

### 1.1 Shop endpoints — PUBLIC (không cần đăng nhập)

#### `GET /api/v1/shop/products`
Query: `category` (slug, optional) · `q` (tìm kiếm, optional) · `sort` (`featured|price-asc|price-desc|rating|newest`, optional) · `limit` (default 24, max 100) · `offset` (default 0)

```json
{
  "items": [ /* ShopProduct */ ],
  "total": 16,
  "limit": 24,
  "offset": 0
}
```

#### `GET /api/v1/shop/products/{slug}`
Trả về 1 `ShopProduct` đầy đủ (kèm `specs`, `description`, `warranty_terms`). 404 nếu không có.

#### `GET /api/v1/shop/categories`
```json
[{ "slug": "tivi", "name": "Tivi & Âm thanh", "icon": "tv", "count": 3, "image_url": null }]
```

#### `GET /api/v1/shop/flash-sale`
```json
{
  "ends_at": "2026-10-30T23:59:59+07:00",
  "items": [ /* ShopProduct */ ]
}
```

#### `POST /api/v1/shop/warranty/lookup`
Body: `{ "serial": "TND-AC10-001" }`
```json
{
  "found": true,
  "serial": "TND-AC10-001",
  "product_name": "Tivi QLED 4K 55 inch",
  "category": "Tivi",
  "within_warranty": "YES",
  "warranty_end_date": "2028-08-15",
  "warranty_months": 24,
  "message": "Sản phẩm còn bảo hành đến 15/08/2028."
}
```
> Không lộ thông tin chủ sở hữu. `found: false` → `message` giải thích, không raise 404.

### 1.2 Object `ShopProduct` (shape bắt buộc)

```json
{
  "id": 12,
  "slug": "tivi-qled-4k-55-inch",
  "name": "Tivi QLED 4K 55 inch Smart TV chính hành",
  "brand": "Samsung",
  "category": "Tivi & Âm thanh",
  "category_slug": "tivi",
  "price": 12990000,
  "original_price": 15490000,
  "discount_percent": 16,
  "rating": 4.7,
  "review_count": 128,
  "sold": 2340,
  "image_url": "/static/shop/tivi-qled.svg",
  "attributes": ["4K QLED", "Dolby Vision", "Smart TV"],
  "warranty_months": 24,
  "warranty_label": "Bảo hành 24 tháng",
  "stock": 12,
  "status": "available",
  "badge": { "label": "Giảm 16%", "tone": "flash" },
  "installment_monthly": 1082500,
  "installment_months": 12,
  "owned": false,
  "description": "...",
  "specs": { "Kích thước": "55 inch", "Độ phân giải": "3840x2160" }
}
```

**Ràng buộc giá trị:**
- `price` / `original_price`: **số nguyên đồng** (không phải string, không làm tròn).
- `discount_percent`: int 0–99, chỉ có khi `original_price > price`, ngược lại `0`.
- `installment_monthly`: int = `price / 12` (làm tròn xuống), `null` nếu không hỗ trợ trả góp.
- `status`: một trong `available` | `low_stock` | `out_of_stock`.
- `badge.tone`: một trong `flash` | `danger` | `warning` | `success` | `info` | `brand` | `neutral`.
- `image_url`: đường dẫn tương đối tới `/static/shop/*.svg` — file SVG **phải tồn tại thật** trên disk.

### 1.3 Chatbot — `POST /api/v1/ai/shop-chat` (PUBLIC)

Body:
```json
{
  "message": "tivi 4k dưới 15 triệu",
  "session_id": "abc-123",
  "history": [{ "role": "user|assistant", "content": "..." }],
  "context": { "serial": null, "ticket_code": null }
}
```

Response:
```json
{
  "reply": "Markdown. Dùng **bold**, `code`, emoji.",
  "intent": "product_recommendation",
  "confidence": 0.87,
  "source": "gemini",
  "suggestions": ["So sánh 3 tivi", "Xem máy lọc nước"],
  "data": { "products": [ /* ShopProduct */ ], "serial": null },
  "actions": [
    {
      "type": "add_to_cart",
      "label": "Thêm vào giỏ",
      "payload": { "product_id": 12, "slug": "tivi-qled-4k-55-inch", "name": "Tivi QLED 4K 55 inch" },
      "requires_confirmation": false
    }
  ]
}
```

**`actions[].type` — danh sách đóng (thêm type mới phải cập nhật file này + frontend):**

| type | payload | requires_confirmation | Ý nghĩa |
|---|---|---|---|
| `add_to_cart` | `{product_id, slug, name}` | false | Thêm SP vào giỏ |
| `view_product` | `{slug, name}` | false | Điều hướng tới trang chi tiết |
| `lookup_serial` | `{serial}` | false | Mở panel tra cứu bảo hành |
| `create_ticket` | `{serial, issue_description}` | **true** | Tạo phiếu bảo hành — cần user xác nhận |
| `navigate` | `{href, label}` | false | Điều hướng nội bộ |
| `call_hotline` | `{phone}` | false | Hiện số hotline |

> `requires_confirmation: true` → frontend **phải** hiện nút "Xác nhận" và **không** tự gọi API.

### 1.4 Chatbot — `POST /api/v1/ai/chat` (AUTH, warranty app)

Giữ nguyên request/response hiện tại (`message`, `serial`, `ticket_code` → `reply`, `intent`, `confidence`, `suggestions`, `data`), **bổ sung**:
- `source`: `"gemini"` | `"rule"`
- `actions`: cùng shape như 1.3
- `data.session_id`: string để frontend giữ ngữ cảnh nhiều lượt

### 1.5 Endpoint tra cứu bảo hành (warranty app, PUBLIC)
`GET /api/v1/tickets/public/{ticket_code}` — **đã có sẵn**, giữ nguyên.

---

## 2. Nhật ký công việc

### 2026-10-30 — Phiên 1: Chuẩn bị nền tảng demo

| # | Hạng mục | File | Trạng thái |
|---|---|---|---|
| 1 | Tạo `backend/.env` (SECRET_KEY sinh tự động, AI_MODE=mock, CORS 5173/5174/5175) | `warranty-system/backend/.env` | ✅ xong |
| 2 | Sửa trùng port: e-commerce 5174 → **5175** | `ecommerce-frontend/vite.config.js` | ✅ xong |
| 3 | Thêm proxy `/api` → `127.0.0.1:8000` cho storefront | `ecommerce-frontend/vite.config.js` | ✅ xong |
| 4 | Viết API contract dùng chung | file này | ✅ xong |
| 5 | Backend: model `Product` mở rộng trường shop + endpoint `/shop/*` + Gemini engine + `/ai/shop-chat` | `warranty-system/backend/**` | ✅ xong |
| 6 | Backend: seed data phong pháp (16 sản phẩm catalog + 5 SP của khách + 8 phiếu mọi trạng thái) | `backend/seed_data.py` | ✅ xong |
| 7 | Storefront: ChatWidget + các section còn lại + ComingSoon + trang chi tiết SP + giỏ hàng | `ecommerce-frontend/src/**` | ⏳ đang làm |
| 8 | Warranty app: nâng cấp `CustomerChat` (actions + nguồn Gemini/rule + streaming) | `warranty-system/frontend/src/**` | ⏳ đang làm |

### 2026-10-30 — Phiên 2: Backend (AI 3) hoàn tất

**File đã TẠO:**
| File | Nội dung |
|---|---|
| `backend/app/core/migrations.py` | `ensure_columns(engine)` — thêm cột shop mới vào bảng `products` đã tồn tại (SQLite `PRAGMA table_info` + `ALTER TABLE ADD COLUMN`, idempotent). Gọi trong `on_startup` **trước** `create_all`. |
| `backend/app/services/shop_service.py` | `list_products`, `get_product_by_slug`, `list_categories`, `get_flash_sale`, `lookup_warranty`, `to_shop_product`, `normalize_status`, `search_products_for_chat`. |
| `backend/app/services/gemini_service.py` | `is_enabled()`, `generate()` (urllib stdlib, timeout 20s, Gemini REST `gemini-2.0-flash`), `parse_actions()`, `GeminiUnavailable`. |
| `backend/app/services/shop_chat_service.py` | `chat()` — intent → tra cứu DB → Gemini → fallback rule-based. Trả đúng shape 1.3. |
| `backend/app/services/shop_assets.py` | Sinh SVG ảnh sản phẩm (gradient + icon + tên) vào `static/shop/`. |
| `backend/app/api/v1/endpoints/shop.py` | Router PUBLIC `/shop/*`. |
| `backend/verify_shop.py`, `verify_gemini.py`, `verify_gemini_flow.py` | Script kiểm chứng contract (75 + 21 + 20 assert). |

**File đã SỬA:**
| File | Thay đổi |
|---|---|
| `backend/app/models/product.py` | +15 trường shop (nullable): `slug` (unique+index), `brand`, `category_slug`, `original_price`, `rating`, `review_count`, `sold`, `image_url`, `attributes` (JSON str), `stock`, `status`, `badge_label`, `badge_tone`, `installment_months`, `specs` (JSON str). |
| `backend/app/main.py` | Import + `include_router(shop.router, prefix=API)`; `on_startup` gọi `ensure_columns(engine)`. |
| `backend/app/services/ai_knowledge.py` | +4 intent shop: `product_recommendation`, `product_compare`, `shop_policies`, `add_to_cart` + `INTENT_SUGGESTIONS` tương ứng. |
| `backend/app/services/ai_service.py` | **Bổ sung** `build_shop_intent_response(intent, slots, data)`. Hàm cũ **không đổi**. |
| `backend/app/api/v1/endpoints/ai.py` | `ChatRequest` + `session_id`; `ChatResponse` + `actions` + `session_id`; `POST /ai/chat` ưu tiên Gemini (giữ nguyên logic tra cứu DB) fallback rule-based; **thêm** `POST /ai/shop-chat` (PUBLIC). |
| `backend/seed_data.py` | Viết lại: 8 user (thêm `demo@shop.vn`), 16 SP catalog (5 SP đã mua → `owned=true`, 4 còn BH + 1 hết BH), 8 phiếu đủ 7 trạng thái, sổ tài chính + notification, sinh 16 file SVG. Idempotent (xoá DB cũ → tạo lại). |

**Kết quả kiểm chứng:**
- `python seed_data.py` → OK, 16 SP / 8 phiếu / 16 file SVG.
- `python -m pytest tests/ -q` → **87 passed** (không phá test cũ).
- `python verify_shop.py` → **75/75 pass** (đúng shape contract 1.1/1.2/1.3).
- `python verify_gemini.py` → **21/21 pass** (parse_actions + fallback).
- `python verify_gemini_flow.py` → **20/20 pass** (migration SQLite + luồng Gemini có mock HTTP + 3 kiểu lỗi → fallback).
- `GET /static/shop/<slug>.svg` → **200** cho tất cả 16 SP.

**Ghi chú Gemini:** máy demo **có** mạng tới `generativelanguage.googleapis.com` (đã xác nhận endpoint trả `API_KEY_INVALID` khi dùng key sai — tức URL/body đúng). Chưa có key thật nên `AI_MODE=mock` → chatbot dùng rule-based 100%. Bật Gemini: sửa `.env` → `AI_MODE=gemini` + `GEMINI_API_KEY=<key>` → restart backend.
| 9 | Warranty app: **FAB chatbot nổi trên MỌI trang** — click mở panel chat overlay ngay tại chỗ, không rời trang | `warranty-system/frontend/src/components/**` | ✅ xong |
| 10 | Dọn port trùng: e-commerce 5174 → 5175; dừng 1 backend trùng port 8000 | `vite.config.js` | ✅ xong |
| 11 | Storefront: **ChatWidget AI** (FAB + panel, quick prompts, action add_to_cart / view_product / navigate, link mở app BảoHành Pro) | `ecommerce-frontend/src/components/sections/ChatWidget.jsx` | ✅ xong |
| 12 | Fix trang trắng storefront: thiếu `<CartProvider>` / `<ToastProvider>` trong `App.jsx` | `ecommerce-frontend/src/App.jsx` | ✅ xong |
| 13 | Fix lỗi cú pháp build storefront: key object chứa dấu tiếng Việt (`Công suất:`, `CADR:`) → quote lại | `ecommerce-frontend/src/data/mockProducts.js` | ✅ xong |
| 14 | Tách `CustomerChat.jsx` → `ChatPanel.jsx` (dùng chung cho trang `/chat` và FAB overlay) + `ChatFab.jsx` | `warranty-system/frontend/src/components/**` | ✅ xong |
| 15 | Storefront: trang `/coming-soon` render danh sách tính năng tương lai từ `featureProposals.js` + 5 icon mới (`Compare`, `Calendar`, `Gift`, `Leaf`, `Wallet`) + link trong Footer | `ecommerce-frontend/src/pages/ComingSoonPage.jsx` | ✅ xong |

---

## 3. Tài khoản demo (sẽ cập nhật sau khi seed)

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@warranty.vn` | `Admin@123` |
| Staff | `staff@warranty.vn` | `Staff@123` |
| Kỹ thuật viên | `tech1@warranty.vn` | `Tech@123` |
| Khách hàng | `kh1@gmail.com` | `Khach@123` |
| **Demo storefront** | **`demo@shop.vn`** | **`Demo@123`** |

> `demo@shop.vn` có **5 sản phẩm đã mua** và **7 phiếu bảo hành** để demo chatbot.

### 3.1. Serial demo (tra cứu bảo hành)

| Serial | Sản phẩm | Chủ | Bảo hành |
|---|---|---|---|
| `TND-AC10-001` | Tivi QLED 4K 55 inch | demo@shop.vn | ✅ Còn (24 tháng) |
| `TND-MLN02-001` | Máy lọc nước RO 2 lõi | demo@shop.vn | ✅ Còn (24 tháng) |
| `TND-AC10-002` | Điều hòa Inverter 2HP | demo@shop.vn | ✅ Còn (24 tháng) |
| `TND-WMS04-001` | Tủ lạnh Inverter 300L | kh1@gmail.com | ✅ Còn (24 tháng) |
| `TND-FAN03-001` | Quạt tháp 60W | demo@shop.vn | ❌ **Hết hạn** (12 tháng) |

---

## 4. Cách chạy demo

```powershell
# 1) Backend
cd warranty-system\backend
python -m uvicorn app.main:app --reload --port 8000

# 2) Storefront (tab trình duyệt 1)
cd ecommerce-frontend
npm run dev          # http://localhost:5175

# 3) Warranty app (tab trình duyệt 2)
cd warranty-system\frontend
npm run dev          # http://localhost:5174
```

**Bật chatbot Gemini thật:** sửa `warranty-system/backend/.env` → `AI_MODE=gemini` + `GEMINI_API_KEY=<key của bạn>` → restart backend. Không có key → chatbot tự dùng rule-based, demo vẫn chạy đầy đủ.

---

## 5. Trạng thái kiểm chứng (30/10/2026 — sau khi sửa lỗi runtime)

### 5.1. Build

| Project | Lệnh | Kết quả |
|---|---|---|
| `warranty-system/frontend` | `npx vite build` | ✅ `✓ built in 4.51s` — 531 kB / gzip 148 kB |
| `ecommerce-frontend` | `npx vite build` | ✅ `✓ built in 2.67s` — 238 kB / gzip 77 kB |
| `warranty-system/backend` | `python -m pytest tests/ -q` | ✅ 87 passed |

### 5.2. Backend API (đã gọi thật qua cURL)

| Endpoint | Kết quả |
|---|---|
| `GET /health` | ✅ `{"status":"ok"}` |
| `POST /api/v1/auth/login` (kh1) | ✅ token + user `role=customer` |
| `POST /api/v1/ai/chat` — *"serial TND-WMS04-001 còn bảo hành không"* | ✅ `intent=warranty_check` → "Còn bảo hành đến 2028-08-01" |
| `POST /api/v1/ai/chat` — *"phiếu WR-2026-0008 đang thay nào"* | ✅ `intent=ticket_status` → "Đang sửa chữa" + mô tả lỗi |
| `POST /api/v1/ai/chat` — *"màn hình nhấp nháy không lên hình"* | ✅ `intent=error_classification` → mức độ HIGH + 3 gợi ý kiểm tra |
| `POST /api/v1/ai/shop-chat` — *"tivi 4k dưới 15 triệu"* | ✅ `intent=product_recommendation`, 2 SP + 4 gợi ý |
| `POST /api/v1/ai/shop-chat` — *"serial TND-AC10-001 còn bảo hành không"* | ✅ `intent=warranty_check`, còn BH đến 2028-08-28 |
| `POST /api/v1/shop/warranty/lookup` | ✅ `found=true` + message tiếng Việt đúng encoding |
| `GET /api/v1/shop/products?limit=2` | ✅ `items=2, total=24` |

### 5.3. Kiểm chứng trên trình duyệt (Chrome)

**App BảoHành Pro (`:5174`)** — đăng nhập `kh1@gmail.com / Khach@123`:
- ✅ Dashboard render, menu đủ 6 nhóm (Tổng quan / Nghiệp vụ / Tài chính / Dịch vụ KH / Khác / Tài khoản).
- ✅ **FAB "Mở trợ lý ảo"** hiện góc phải ở **mọi trang** (role customer).
- ✅ Click FAB → panel chat overlay mở **ngay tại chỗ** (không rời trang), có nút đóng riêng.
- ✅ Gõ *"serial TND-WMS04-001 con bao hanh khong"* → bot trả lời **dữ liệu thật từ DB**:
  "✅ Sản phẩm Tủ lạnh Inverter 300 lít No Frost · Còn bảo hành đến 2028-08-01" + card trạng thái.
- ✅ Gợi ý theo ngữ cảnh trả về từ backend: *"Xem lịch sử bảo hành"*, *"Tạo phiếu bảo hành mới"*, *"Chi phí sửa chữa bao nhiêu"*.

**Storefront (`:5175`)**:
- ✅ Trang chủ render đầy đủ: TopBar → Header → Hero carousel (4 slide, tự chuyển) → Flash sale → ProductGrid (8 SP) → Footer.
- ✅ Chat widget FAB + panel: quick prompts, gợi ý theo ngữ cảnh, badge nguồn (`🤖 Gemini` / `📋 Rule-based` + % tin cậy).
- ✅ Gõ *"serial TND-AC10-001 con bao hanh khong"* → bot trả lời **từ backend thật**:
  "✅ Kết quả tra cứu bảo hành · Tivi QLED 4K 55 inch · Còn bảo hành đến 28/08/2028 · Bảo hành 24 tháng".
- ✅ Link *"Mở hệ thống BảoHành Pro"* mở tab mới tới `:5174`.
- ✅ Trang `/coming-soon` render grid 10 tính năng tương lai, badge "Tính năng đang được cập nhật", click card → panel chi tiết + điều hướng `?feature=<slug>`.

### 5.4. Bug đã tìm & sửa trong quá trình verify

| # | Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|---|
| 1 | Storefront trắng hoàn toàn | `ProductGrid` gọi `useCart()` nhưng `App.jsx` không bọc `<CartProvider>` / `<ToastProvider>` | Bọc 2 provider trong `App.jsx` |
| 2 | `vite build` fail storefront | Object key chứa dấu tiếng Việt không quote: `Công suất:`, `CADR:` | Bọc key trong dấu nháy đơn |
| 3 | 2 dev server cùng port 5174 | Storefront còn process cũ từ lần chạy trước | Kill process cũ + `--strictPort` 5175 trong `package.json` |
| 4 | 2 backend cùng port 8000 | Tôi + agent backend cùng start | Kill 1 process, giữ 1 |
| 5 | Build fail sau khi tách `ChatPanel` | Script tách file cắt nhầm `return` trong `ActionButtons` (dùng `rindex`) | Khôi phục `CustomerChat.jsx` từ transcript agent, tách lại bằng marker chính xác |
| 6 | Import sai sau khi tách file | `components/` và `pages/` cùng cấp → `../../context` sai | Dùng `../context`, `../services`, `./StatusBadge` |

### 5.5. Seri mới dùng để demo

| Serial | Sản phẩm | Chủ | Kết quả tra cứu |
|---|---|---|---|
| `TND-WMS04-001` | Tủ lạnh Inverter 300 lít | kh1@gmail.com | ✅ Còn BH đến 2028-08-01 |
| `TND-AC10-001` | Tivi QLED 4K 55 inch | demo@shop.vn | ✅ Còn BH đến 2028-08-28 |
| `TND-FAN03-001` | Quạt tháp 60W | demo@shop.vn | ❌ Hết hạn (12 tháng) — demo trường hợp hết BH |

> ⚠️ Lưu ý: chatbot bảo hành chỉ thấy sản phẩm **của chính khách đang đăng nhập** (đúng bảo mật object-level). Khách `kh1` tra cứu serial của người khác sẽ nhận *"Không tìm thấy sản phẩm"* — đây là hành vi **đúng**, không phải lỗi.

---

## 6. Phiên 4 (30/10/2026) — Kết nối 2 web thành 1 hệ sinh thái, phân quyền khách hàng

### 6.1. Bối cảnh & yêu cầu

Chủ dự án yêu cầu:
1. Sửa lỗi wizard tạo phiếu bảo hành **kẹt ở bước 3, không sang được bước 4**.
2. **Đồng bộ trang login** giữa web bán hàng và web bảo hành.
3. **Kết nối 2 trang web lại** để truyền dữ liệu cho nhau như 1 website — có 1 nút dẫn tới web bảo hành.
4. Web bảo hành có **bên quản lý admin**; phía **khách hàng chỉ thao tác được phần khách hàng**.
5. Luồng dữ liệu: khách mua hàng → đăng ký bảo hành theo serial → sản phẩm nằm trong *"Sản phẩm của tôi"* → bấm nút tạo phiếu, **không phải nhập lại thông tin khách hàng**.

Quyết định kiến trúc đã chốt: **2 app tách biệt** (5175 / 5174) nhưng **dùng chung 1 backend FastAPI** (8000) + đồng bộ phiên qua cầu nối.

### 6.2. Bản đồ kiến trúc sau khi nối

```
┌────────────────────────┐        ┌────────────────────────────┐
│ Storefront  :5175      │        │ BảoHành Pro   :5174       │
│  - bán hàng            │        │  - quản trị (admin/staff) │
│  - kích hoạt bảo hành  │        │  - khu vực khách hàng     │
│  - link → app BH       │        │  - link → storefront      │
└───────────┬────────────┘        └──────────────┬─────────────┘
            │  /api/*  (vite proxy)              │  /api/*  (vite proxy)
            └──────────────┬──────────────────────┘
                           ▼
              ┌─────────────────────────┐
              │ FastAPI  :8000          │
              │  /api/v1/shop/*        │  ← public (storefront)
              │  /api/v1/shop/warranty │  ← bridge (đăng nhập)
              │  /api/v1/tickets/*     │  ← RBAC theo vai trò
              └─────────────────────────┘
```

### 6.3. Cầu nối phiên đăng nhập (sessionBridge.js)

> **Vấn đề thật:** `localStorage` **chia theo origin**. `localhost:5175` và `localhost:5174` là 2 origin khác nhau → **KHÔNG** dùng chung được storage. Dùng chung key `token`/`user` là không đủ.

**Giải pháp:** truyền token qua **fragment URL** (`#s=<base64url>`).
- Fragment **không được gửi lên server** → không rò rỉ vào access log.
- App đích nhận fragment → lưu vào `localStorage` → **xoá ngay khỏi URL** bằng `history.replaceState` (token không nằm lại trong lịch sử trình duyệt).

| File | Vai trò |
|---|---|
| `ecommerce-frontend/src/utils/sessionBridge.js` | encode/decode session, `buildCrossAppUrl()` |
| `warranty-system/frontend/src/utils/sessionBridge.js` | Bản sao — nhận session từ fragment |

Các link dùng `buildCrossAppUrl()`:
- Storefront → app BH: nút **"Bảo hành Pro"** (desktop + mobile), link trong modal đăng ký bảo hành.
- App BH → storefront: menu user **"Web bán hàng"**, nút ở trang *"Sản phẩm của tôi"* (empty state), link mở sản phẩm trong chatbot.

### 6.4. Bridge API (mới)

| Endpoint | Auth | Mô tả |
|---|---|---|
| `POST /api/v1/shop/warranty/register` | Bearer | Đăng ký bảo hành theo serial → gán `product.customer_id` cho khách |
| `GET /api/v1/shop/warranty/my-products` | Bearer | Danh sách sản phẩm của khách + hạn bảo hành đã tính |

Service: `warranty-system/backend/app/services/bridge_service.py`

Luật an toàn:
- Serial đã thuộc về **người khác** → không ghi đè, chỉ báo *"đã được đăng ký"*, **không lộ PII**.
- Serial không tồn tại → thông báo rõ ràng, không 500.
- Đăng ký lại sản phẩm của chính mình → idempotent (trả `already_owned=true`).

### 6.5. Phân quyền khách hàng (strict)

**Backend** (`app/core/permissions.py` + từng endpoint):

| Hành động | customer | technician | staff/admin |
|---|---|---|---|
| Xem `/tickets` | ✅ chỉ của mình | ✅ được giao | ✅ tất cả |
| Đổi trạng thái phiếu | ❌ 403 | ✅ phiếu của mình | ✅ |
| Xem `/customers` | ❌ 403 | ❌ | ✅ |
| Quản lý sản phẩm toàn hệ thống | ❌ | ❌ | ✅ |
| Thanh toán / ví | ❌ (chỉ trả tiền khi phiếu bị từ chối) | ❌ | ✅ |
| AI console | ❌ | ✅ | ✅ |

**Frontend** (`warranty-system/frontend/src/utils/permissions.js`):
- Menu sidebar ẩn: *Tổng quan, Khách hàng, Sản phẩm, Thanh toán, Trợ lý AI*.
- Route guard chuyển khách về `/my-tickets` hoặc `/my-products`.
- Wizard tạo phiếu: **bỏ bước 1 (Chọn khách hàng)** vì khách chính là chủ phiếu.
- Bước "Ghi chú nội bộ" ẩn với khách.

### 6.6. Sửa lỗi kẹt bước 3 → bước 4

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Chọn loại sự cố xong nhấn "Tiếp tục" không sang bước 4 | `Step3Issue.handleIssueSelect` set `description` vào **state nội bộ** nhưng không gửi `description` lên parent → `data.description` vẫn rỗng → `CreateTicketModal.handleNext` chặn | Gửi `onUpdate({ issue_type, description })` kèm giá trị mới |

Ngoài ra:
- Tính ngày hết hạn bảo hành dùng `calendar.monthrange` (backend) + clamp (frontend) → không còn lỗi *"day is out of range for month"* với ngày 29–31 / tháng 2.

### 6.7. Sửa lỗi dữ liệu hiển thị

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Cột "Sản phẩm" trong `/my-tickets` và `/tickets` hiện `—` | API `TicketOut` không trả tên sản phẩm/khách hàng | Thêm `product_name`, `product_serial`, `customer_name` vào `TicketOut` + `_attach_display_names()` trong `tickets.py` |
| Màn hình "Tạo phiếu thành công" hiện `—` cho khách/sản phẩm | `SuccessScreen` chỉ đọc `ticket.customer_name` / `ticket.product_name` (API không có) | Truyền thêm `product` / `customer` từ modal làm fallback |
| Khách không biết serial để kích hoạt bảo hành | API shop không trả serial | Thêm `serial_number` vào `ShopProduct` + hiện serial & nút **"Kích hoạt"** ngay trên thẻ sản phẩm |

### 6.8. Kiểm chứng (30/10/2026)

| Hạng mục | Kết quả |
|---|---|
| `warranty-system/backend` — `pytest tests/ -q` | ✅ **101 passed** (87 cũ + 14 test bridge mới) |
| `ecommerce-frontend` — `vite build` | ✅ built |
| `warranty-system/frontend` — `vite build` | ✅ built |
| Login tại storefront → bấm "Bảo hành Pro" | ✅ Vào thẳng `/my-products`, **không hỏi login lại**, fragment đã bị xoá |
| Modal kích hoạt bảo hành (đăng nhập + serial) | ✅ Toast *"Hạn bảo hành đếng ..."*, sản phẩm xuất hiện ở *"Sản phẩm của tôi"* |
| Wizard tạo phiếu: B1 → B2 → B3 → B4 | ✅ Tạo được phiếu `WR-2026-0011-QCTCQY` |
| Khách gọi `POST /tickets/{id}/status` | ✅ **403** |
| Khách gọi `GET /customers` | ✅ **403** |
| Khách xem `/my-tickets` | ✅ Chỉ thấy phiếu của mình, cột sản phẩm có tên |
| Admin xem `/` | ✅ Đủ menu: Tổng quan / Phiếu / Sản phẩm / Khách hàng / Tra cứu / AI / Ví / Thanh toán |

### 6.9. Tài khoản demo dùng cho luồng kết nối

| Vai trò | Email | Mật khẩu | Dùng để |
|---|---|---|---|
| Khách hàng | `demo@shop.vn` | `Demo@123` | 5 sản phẩm đã đăng ký bảo hành + 10 phiếu |
| Admin | `admin@warranty.vn` | `Admin@123` | Xem toàn bộ hệ thống |
| Kỹ thuật viên | `tech@warranty.vn` | `Tech@123` | Xử lý phiếu được phân công |

---

## 7. Phiên 5 (30/10/2026) — Hoàn thiện mảng **bán hàng**: khách mua + nhân viên bán hàng

> Yêu cầu: *"thêm các chức năng cho bên bán hàng"* — chốt triển khai **cả hai phía**: hoàn thiện mảng khách mua + thêm khu vực quản lý bán hàng cho nhân viên (staff/admin).

### 7.1. Backend — mảng bán hàng mới (cùng DB, cùng FastAPI)

**Model mới** (`backend/app/models/shop.py`):

| Bảng | Nội dung |
|---|---|
| `orders` | Đơn hàng: `order_code` (`ORD-2026-0001`), `user_id`, `status` (PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED), `subtotal`/`shipping_fee`/`discount`/`total`, `payment_status`, `payment_method`, thông tin giao hàng, `coupon_code` |
| `order_items` | Dòng đơn: snapshot `name`/`unit_price`/`quantity` tại thời điểm đặt + `serial_number` (cấp khi xuất kho) |
| `shipping_addresses` | Sổ địa chỉ giao hàng của khách (`is_default`) |
| `reviews` | Đánh giá sản phẩm — unique `(product_id, user_id)`, có `status` để kiểm duyệt |

**Service** (`backend/app/services/order_service.py`):
- `calculate_totals()` — **luôn tính tiền ở server** (không tin giá client gửi lên).
- Phí ship: 30.000₫ cho đơn < 500k, **miễn phí từ 500k**.
- Mã giảm giá demo: `WELCOME10` (10%, tối đa 200k) · `FREESHIP` · `SAVE50` (50k).
- `generate_serials()` — khi đơn → `SHIPPED`: sinh serial `SN-<product_id>-<hex>`, gán `product.customer_id` = người mua + `purchase_date` → **khách tự kích hoạt bảo hành được ngay**.

**Endpoint mới** (`backend/app/api/v1/endpoints/shop_orders.py`):

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/shop/orders` | Bearer | Đặt hàng (tính tiền server-side) |
| GET | `/api/v1/shop/orders` | Bearer | Danh sách đơn — customer chỉ thấy đơn mình, staff/admin thấy tất cả |
| GET | `/api/v1/shop/orders/{id}` | Bearer | Chi tiết đơn (403 nếu không phải chủ) |
| POST | `/api/v1/shop/orders/{id}/cancel` | Bearer | Khách huỷ đơn chưa xuất kho |
| POST | `/api/v1/shop/orders/{id}/status` | staff/admin | Chuyển trạng thái → xuất kho sinh serial |
| GET/POST/PUT/DELETE | `/api/v1/shop/addresses` | Bearer | CRUD sổ địa chỉ (object-level) |
| GET | `/api/v1/shop/reviews` | Public | Danh sách đánh giá (lọc `product_id`) |
| POST | `/api/v1/shop/reviews` | Bearer | Đánh giá (1 khách / 1 sản phẩm) → cập nhật `product.rating` |
| GET | `/api/v1/shop/seller/stats` | staff/admin | Tổng quan: doanh thu, đơn theo trạng thái, top sản phẩm |

**Schema mới** (`backend/app/schemas/schemas.py`): `OrderCreate` · `OrderOut` · `OrderItemIn/Out` · `AddressIn/Out` · `ReviewIn/Out`.

**Seed** (`backend/seed_data.py`): thêm **5 đơn hàng mẫu** ở các trạng thái (PENDING / CONFIRMED / SHIPPED / DELIVERED / CANCELLED), đơn SHIPPED & DELIVERED có **serial bảo hành gán sẵn** cho khách.

### 7.2. Storefront — trang mới

| Route | Trang | Chức năng |
|---|---|---|
| `/product/:slug` | `ProductDetailPage` | Ảnh + giá + **bộ tính trả góp** (3/6/12/24 tháng) + số lượng + thông số + **viết đánh giá** + kích hoạt bảo hành theo serial |
| `/search` · `/category/:slug` | `SearchPage` | Tìm kiếm + bộ lọc (danh mục · khoảng giá · thương hiệu · đánh giá tối thiểu · chỉ sản phẩm giảm giá) + sắp xếp 5 kiểu |
| `/cart` | `CartPage` | Giỏ hàng (đổi số lượng, xoá) + **checkout inline**: mã giảm giá, chọn địa chỉ đã lưu, người nhận, 4 phương thức thanh toán, đặt hàng |
| `/wishlist` | `WishlistPage` | Danh sách yêu thích (lưu localStorage, đồng bộ với thẻ sản phẩm) |
| `/orders` | `OrdersPage` | Lịch sử đơn của tôi + lọc trạng thái + huỷ đơn + **serial bảo hành hiển thị trên từng dòng** + panel "Sản phẩm đã bảo hành" |
| `/account` | `AccountPage` | Thông tin cá nhân + **sổ địa chỉ** (thêm/xoá/đặt mặc định) + sản phẩm đã bảo hành |
| `/seller/orders` | `SellerOrdersPage` | **Khu vực nhân viên bán hàng** (staff/admin): thống kê doanh thu + danh sách toàn bộ đơn + nút **Xác nhận / Xuất kho (cấp serial) / Đã giao** |

**Hạ tầng frontend mới:**
- `src/context/WishlistContext.jsx` — wishlist dùng chung (thay vì local state rời rạc trong `ProductCard`).
- `src/api/orders.js` — tầng API cho orders/addresses/reviews + `normalizeOrder()`.
- `src/layouts/StoreLayout.jsx` — layout dùng chung (TopBar → SiteHeader → content → Footer → ChatWidget).
- Header bổ sung link **Đơn hàng** / **Tài khoản** / **Quản lý bán hàng** (chỉ hiện với staff/admin).
- `ChatWidget` chuyển từ `window.location.href` → `useNavigate()` (không reload trang).

### 7.3. Luồng liên kết bán hàng ↔ bảo hành

```
Khách đặt hàng (PENDING)
   → Nhân viên xác nhận (CONFIRMED)
   → Nhân viên xuất kho (SHIPPED) ──► hệ thống TỰ SINH serial
   → Khách mở "Đơn của tôi" thấy serial
   → Bấm "Kích hoạt bảo hành" → sản phẩm vào "Sản phẩm của tôi" (app Bảo hành Pro)
   → Tạo phiếu bảo hành, không phải nhập lại thông tin
```

### 7.4. Kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `backend` — `pytest tests/test_orders.py -q` | ✅ **20 passed** (tính tiền server-side, phí ship, mã giảm giá, sinh serial khi xuất kho, phân quyền khách/nhân viên, CRUD địa chỉ, đánh giá) |
| `backend` — `pytest tests/ -q` | ✅ toàn bộ suite xanh |
| `ecommerce-frontend` — `vite build` | ✅ built (328 kB / gzip 97 kB) |

### 7.5. Tài khoản demo cho mảng bán hàng

| Vai trò | Email | Mật khẩu | Dùng để |
|---|---|---|---|
| Khách hàng | `demo@shop.vn` | `Demo@123` | Đặt hàng, xem đơn, đánh giá, quản lý địa chỉ |
| **Nhân viên bán hàng** | **`staff@warranty.vn`** | **`Staff@123`** | **`/seller/orders` — xác nhận, xuất kho, cấp serial** |
| Quản trị | `admin@warranty.vn` | `Admin@123` | Xem toàn bộ đơn + báo cáo doanh thu |
