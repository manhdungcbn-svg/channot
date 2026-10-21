# SECURITY AUDIT — Báo cáo kiểm tra bảo mật hệ thống BảoHành Pro

> **Phiên bản:** v1.0
> **Ngày audit:** 2026-10-03
> **Phạm vi:** Backend Python/FastAPI + SQLAlchemy + JWT
> **Chế độ:** READ ONLY — không sửa code, không chạy migration, không seed dữ liệu
> **Liên kết:** Liên quan `docs/USER_STORIES.md` (US-01 → US-12) và `docs/OPEN_QUESTIONS.md`

---

## 1. Tóm tắt kiến trúc đã xác minh (CONFIRMED)

| Hạng mục | Giá trị | Bằng chứng |
|---|---|---|
| Framework | FastAPI | `backend/app/main.py:14` |
| ORM | SQLAlchemy | `backend/app/core/database.py` |
| DB mặc định (dev) | SQLite (`sqlite:///./warranty.db`) | `backend/app/core/config.py:13` |
| JWT algorithm | HS256 | `backend/app/core/config.py:17` |
| Token TTL | 1440 phút (24 giờ) | `backend/app/core/config.py:16` |
| Password hashing | bcrypt | `backend/app/core/security.py:9` |
| Auth dependency | `OAuth2PasswordBearer` + `get_current_user` | `backend/app/core/permissions.py:9-30` |
| Role-based | `require_roles(*allowed)` | `backend/app/core/permissions.py:33-43` |
| Public lookup | `GET /tickets/public/{code}` chỉ trả trường công khai | `backend/app/api/v1/endpoints/tickets.py:28-66` |

### Stack endpoint (9 file)

| Prefix | File | Endpoint count (xác minh) |
|---|---|---|
| `/auth` | `endpoints/auth.py` | 11 (register, login, login/form, me, profile, supabase-token, request-reset-code, reset-password, upload-avatar, users, change-password) |
| `/products` | `endpoints/products.py` | 4 (list, by serial, create, delete) |
| `/customers` | `endpoints/customers.py` | 3 (list, technicians, create) |
| `/tickets` | `endpoints/tickets.py` | 8 (public, list, get, create, assign, status, summarize, pay, stats) |
| `/ai` | `endpoints/ai.py` | 2 (classify, progress-message) |
| `/wallet` | `endpoints/wallet.py` | 3 (me, topup, transactions) |
| `/finance` | `endpoints/finance.py` | 4 (summary, transactions, transfer, credit) |
| `/notifications` | `endpoints/notifications.py` | 3 (list, mark-read, mark-all-read) |

**Tổng cộng: 38 endpoint** (đếm từ `main.py` import + đọc từng file).

---

## 2. Authentication & Authorization (CONFIRMED)

### 2.1. S1 fix — Role escalation qua `/auth/register`

**Trạng thái:** ✅ ĐÃ SỬA (CONFIRMED)

- `backend/app/api/v1/endpoints/auth.py:80-92` ép `role="customer"`, bỏ qua `payload.role`.
- Endpoint tạo user có role khác phải qua `POST /auth/users` (line 244-265), yêu cầu `require_roles("admin")`.
- **Đánh giá:** CẦN XÁC NHẬN 5 (super-admin) — phân tích ở §3.

### 2.2. S3 fix — Brute force protection

**Trạng thái:** ✅ ĐÃ SỬA (CONFIRMED)

- `backend/app/api/v1/endpoints/auth.py:99-105` (login) và `121-127` (login/form) gọi `_enforce_login_rate_limit`.
- `_enforce_login_rate_limit` (line 274-283) check `record.is_locked()` → trả `HTTP 423`.
- `MAX_FAILED_LOGIN_ATTEMPTS = 5`, `LOCKOUT_DURATION_MINUTES = 15` (`config.py:38-39`).
- `_record_failed_attempt` tăng counter; khi đạt ngưỡng → set `locked_until`.
- **Đánh giá:** Đầy đủ. Tuy nhiên khóa theo email, không theo IP — kẻ tấn công có thể brute-force nhiều email cùng lúc. Mức rủi ro: THẤP (P2).

### 2.3. S4 fix — Supabase JWT verification

**Trạng thái:** ✅ ĐÃ SỬA (CONFIRMED)

- `backend/app/api/v1/endpoints/auth.py:46-50` gọi `verify_supabase_jwt` (signature local, không gọi HTTP).
- 2 loại token được hỗ trợ: Supabase session + Google provider_token.
- **Đánh giá:** OK.

### 2.4. Token hết hạn / vô hiệu hóa tài khoản

**Trạng thái:** ✅ ĐÃ SỬA (CONFIRMED)

- `decode_token` (security.py:29-32) trả `None` nếu JWT hết hạn / sai chữ ký → 401.
- `get_current_user` (permissions.py:17-30) load user mỗi request, check `is_active` → 403 nếu bị khóa.
- **Đánh giá:** OK.

### 2.5. Refresh token / thu hồi phiên

**Trạng thái:** ❌ CHƯA CÓ (CONFIRMED)

- Không tìm thấy cơ chế refresh token, blacklist, hoặc session table.
- Khi user đổi mật khẩu, JWT cũ vẫn valid đến khi hết hạn (24h).
- **Mức rủi ro:** TRUNG BÌNH (P1). Khuyến nghị: thêm token version trên User, hoặc deny list.

---

## 3. Tenant Isolation (POTENTIAL RISK)

### 3.1. Có `organization_id` trong schema không?

**Kết quả kiểm tra (CONFIRMED):** **KHÔNG CÓ**.

Đã đọc 7 model: `user.py`, `product.py`, `warranty.py`, `wallet.py`, `finance.py`, `notification.py`, `login_attempt.py`. Không bảng nào có cột `organization_id`.

```
$ grep -rn "organization_id" backend/app/models/
(0 matches)
```

### 3.2. Tác động

- Mọi role-based check hiện tại (`customer` / `staff` / `technician` / `admin`) chỉ phân quyền chức năng, không cô lập dữ liệu giữa các tổ chức.
- Nếu triển khai multi-tenant thật, cần thêm `organization_id` vào: `users`, `products`, `warranty_tickets`, `warranty_history`, `notifications`, `finance_transactions`.
- Ví vẫn toàn cục theo `user_id` (đúng theo kiến trúc đã chốt).

### 3.3. IDOR check (CONFIRMED an toàn cho pattern hiện tại)

Các endpoint sau đã kiểm tra ownership:

- `GET /products/serial/{serial}`: customer chỉ xem sản phẩm `customer_id == current.id` (products.py:38-43).
- `GET /tickets/{id}`: customer chỉ xem phiếu `customer_id == current.id` (tickets.py:96-99).
- `POST /tickets`: customer không tạo được phiếu cho sản phẩm không thuộc sở hữu (tickets.py:109-112).
- `POST /tickets/{id}/status`: technician chỉ sửa phiếu `technician_id == current.id` (S5a fix, tickets.py:148-154).
- `POST /tickets/{id}/summarize`: customer/technician chỉ xem được phiếu của mình (S5b fix, tickets.py:172-178).
- `POST /tickets/{id}/pay`: customer chỉ trả phiếu của mình (tickets.py:192-195).
- `GET /wallet`, `/wallet/transactions`: `current.id` (wallet.py:18-22, 38-44).
- `GET /notifications`, `/notifications/{id}/read`: `user_id == current.id` (notifications.py:32-39, 46-52).

**Đánh giá:** Pattern hiện tại **an toàn với 1 tổ chức**. Nếu thêm multi-tenant, phải thêm `organization_id` filter vào tất cả query trên.

### 3.4. `/tickets/public/{code}` (CONFIRMED — privacy OK)

`backend/app/api/v1/endpoints/tickets.py:28-66`:

- Không yêu cầu đăng nhập.
- Chỉ trả: `id`, `ticket_code`, `status`, `issue_description`, `ai_progress_message`, `created_at`, `updated_at`, `product.{name, serial, category}`, `customer.{full_name, phone[-4:]}`.
- **Không trả** `repair_cost`, `payment_status`, `customer_id`, `technician_id`, `warranty_history`, `ai_summary`.
- **Đánh giá:** OK cho lookup công khai. Có thể làm giảm nguy cơ enumeration bằng rate limit.

---

## 4. Wallet & Payment (US-09)

### 4.1. ACID (CONFIRMED)

`backend/app/services/wallet_service.py`:

- `topup` (line 27-53) và `pay` (line 56-79) dùng `with_for_update()` (pessimistic lock) — `try/except` để fallback khi SQLite không hỗ trợ.
- `pay` check `balance < amount` SAU khi lock (line 62-64) → race condition trên cùng user bị chặn.
- Tất cả amount dùng `Decimal` (line 32, 38, 60, 67, 69).

### 4.2. Idempotency (POTENTIAL RISK)

- **KHÔNG có** `idempotency_key` ở `Transaction` model (`backend/app/models/wallet.py:19-26`).
- Client retry sau khi timeout → có thể tạo 2 transaction TOPUP/PAY, gây trừ tiền 2 lần.
- **Mức rủi ro:** TRUNG BÌNH (P1). Khuyến nghị: thêm cột `idempotency_key` UNIQUE trên `transactions`.

### 4.3. Server-side amount (CONFIRMED)

- `POST /tickets/{id}/pay` (tickets.py:189-209): `amount = Decimal(str(t.repair_cost or 0))` → server tính, KHÔNG tin client.
- **Đánh giá:** OK.

### 4.4. Top-up tùy ý (POTENTIAL RISK)

- `POST /wallet/topup` (wallet.py:25-34): client gửi `payload.amount` trong body, server ghi nhận ngay.
- Theo US-09 v1.0 mới: "không cho client tự tăng số dư tùy ý" — đây là rủi ro.
- **Ghi chú:** Hiện tại gắn nhãn `reference="SANDBOX_TOPUP"` (line 33) → ngầm thừa nhận là sandbox. Nếu lên production, phải đổi flow (qua payment gateway).
- **Mức rủi ro:** CAO cho production, OK cho dev/sandbox.

### 4.5. Payment KHÔNG tự chuyển COMPLETED (CONFIRMED)

- `tickets.py:188-209`: payment chỉ set `t.payment_status = "PAID"`, KHÔNG đổi `t.status` → trạng thái `COMPLETED` phải do admin/technician chuyển qua `/tickets/{id}/status`.
- **Đánh giá:** Đúng theo US-09 v1.0 mới (Tách thanh toán khỏi hoàn thành nghiệp vụ).

### 4.6. Status filter cho pay (CONFIRMED)

- `tickets.py:196-199`: chỉ cho thanh toán khi `t.status in ("REJECTED", "COMPLETED")` AND `t.within_warranty != "YES"`. Tránh trả tiền cho phiếu còn bảo hành.
- **Đánh giá:** OK logic.

---

## 5. Workflow trạng thái (US-05)

### 5.1. STATUS_FLOW (CONFIRMED)

`backend/app/models/warranty.py:9-17`:

```python
STATUS_FLOW = {
    "RECEIVED": ["INSPECTION", "REJECTED"],
    "INSPECTION": ["REPAIRING", "REJECTED"],
    "REPAIRING": ["COMPLETED", "REJECTED"],
    "COMPLETED": [],
    "REJECTED": [],
}
```

**So sánh với USER_STORIES v1.0 Phụ lục:**
- US-05 bảng chuyển trạng thái ✅ khớp 100% (RECEIVED→INSPECTION/REJECTED, INSPECTION→REPAIRING/REJECTED, REPAIRING→COMPLETED/REJECTED, COMPLETED/REJECTED kết thúc).
- `warranty_service.update_status` (line 141-143) dùng đúng `STATUS_FLOW` để validate.

### 5.2. Optimistic locking (POTENTIAL RISK)

- `WarrantyTicket` KHÔNG có cột `version` hoặc `updated_at` được dùng cho optimistic check.
- `update_status` chỉ check `STATUS_FLOW`, không check "ai đổi trước".
- Hai admin cùng chuyển trạng thái: cái sau thắng (last write wins), không có audit phát hiện.
- **Mức rủi ro:** TRUNG BÌNH (P1). Khuyến nghị: thêm `version` column + WHERE `version = ?` khi UPDATE.

### 5.3. Repair cost override (POTENTIAL RISK)

- `tickets.py:155-161`: `repair_cost` được phép cập nhật trong `update_status` (từ `payload.repair_cost`).
- Cho phép `admin/staff/technician` đặt giá trị bất kỳ → có thể gian lận nếu thiếu audit.
- Hiện tại `WarrantyHistory` không lưu `old_repair_cost` → mất dấu vết thay đổi.
- **Mức rủi ro:** TRUNG BÌNH. Khuyến nghị: lưu history riêng cho `repair_cost` hoặc thêm audit log (US-16).

### 5.4. Technician có thể tự sửa phiếu không phân công (CONFIRMED SAFE)

- `tickets.py:148-154`: chỉ `current.role == "technician"` mới check `t.technician_id != current.id` → 403.
- Admin/staff không bị check này (đúng — họ có quyền tổng quát).

---

## 6. API protection matrix (CONFIRMED)

| Endpoint | Method | Auth required | Role check | Tenant isolation | Validation | IDOR check |
|---|---|---|---|---|---|---|
| `/auth/register` | POST | ❌ | ép role=customer | n/a | email/phone | n/a |
| `/auth/login` | POST | ❌ | n/a | n/a | rate-limit | n/a |
| `/auth/me` | GET | ✅ | any | n/a | n/a | n/a |
| `/auth/users` | POST | ✅ | admin | n/a | role enum | n/a |
| `/products` | GET | ✅ | any (customer filtered) | none | n/a | n/a (filter theo customer_id) |
| `/products/serial/{s}` | GET | ✅ | any (customer filtered) | none | serial path param | customer chỉ thấy của mình |
| `/products` | POST | ✅ | admin/staff | none | serial unique | n/a |
| `/products/{id}` | DELETE | ✅ | admin | none | n/a | n/a |
| `/customers` | GET | ✅ | admin/staff | none | n/a | n/a |
| `/customers/technicians` | GET | ✅ | admin/staff | none | is_active=True | n/a |
| `/tickets/public/{code}` | GET | ❌ | n/a | none | code path | trả limited fields |
| `/tickets` | GET | ✅ | any (customer filtered) | none | status, serial filter | n/a |
| `/tickets/{id}` | GET | ✅ | any | none | n/a | customer phải là owner |
| `/tickets` | POST | ✅ | any | none | product_id, issue_description | customer phải sở hữu product |
| `/tickets/{id}/assign` | POST | ✅ | admin/staff | none | technician_id | n/a |
| `/tickets/{id}/status` | POST | ✅ | admin/staff/technician | none | STATUS_FLOW + ownership | technician chỉ sửa phiếu của mình |
| `/tickets/{id}/summarize` | POST | ✅ | any | none | ticket ownership | customer/tech phải match |
| `/tickets/{id}/pay` | POST | ✅ | any | none | status, warranty, repair_cost | customer phải là owner |
| `/tickets/stats/summary` | GET | ✅ | admin/staff | none | n/a | n/a |
| `/ai/classify` | POST | ✅ | any | none | text | n/a |
| `/ai/progress-message` | POST | ✅ | any | none | status enum | n/a |
| `/wallet` | GET | ✅ | any | n/a | n/a | current.id |
| `/wallet/topup` | POST | ✅ | any | n/a | amount > 0 | current.id |
| `/wallet/transactions` | GET | ✅ | any | n/a | limit 100 | wallet_id = current |
| `/finance/summary` | GET | ✅ | admin | none | n/a | n/a |
| `/finance/transactions` | GET | ✅ | admin | none | type filter | n/a |
| `/finance/transfer` | POST | ✅ | admin | none | amount > 0, recipient | n/a |
| `/finance/credit` | POST | ✅ | admin | none | amount > 0, description | n/a |
| `/notifications` | GET | ✅ | any | n/a | n/a | user_id = current |
| `/notifications/{id}/read` | POST | ✅ | any | n/a | notification_id | user_id = current |

---

## 7. Validation chi tiết (CONFIRMED)

| Trường | Validate | Bằng chứng |
|---|---|---|
| Role enum | "admin/staff/technician/customer" | auth.py:251-253 |
| Serial trùng | check + HTTP 400 | products.py:50-54 (chưa 409 như US-02 mới yêu cầu) |
| Status transition | STATUS_FLOW | warranty.py:9-17 |
| Ticket status before pay | `status in (REJECTED, COMPLETED) and within_warranty != "YES"` | tickets.py:196-199 |
| Repair cost > 0 | `amount = Decimal(str(t.repair_cost or 0)); if amount <= 0: 400` | tickets.py:200-202 |
| Topup amount > 0 | `if amount <= 0: raise ValueError` | wallet_service.py:30-32 |
| Email unique | check trước insert | auth.py:84, 254 |
| File upload type | whitelist content_type | auth.py:163-167 |
| File upload size | ≤ 2MB | auth.py:171-173 |
| Reset code TTL | 300s | auth.py:209 |
| Login lockout | 5 attempts / 15 min | config.py:38-39 + auth.py:300 |

---

## 8. Phát hiện bảo mật

### P0 — Nghiêm trọng (cần xử lý trước khi production)

| # | Phát hiện | Bằng chứng | Tác động | Hướng khắc phục |
|---|---|---|---|---|
| 1 | **Multi-tenant chưa có `organization_id`** | 0 match trong `models/` | Tất cả user thấy dữ liệu của nhau nếu có >1 tổ chức | Thêm cột + filter, migration, audit |
| 2 | **Top-up client tự khai amount** | `wallet.py:25-34` | Production có thể bị tạo số dư giả | Bắt buộc qua payment gateway, sandbox chỉ dùng dev |
| 3 | **Không có idempotency key cho payment** | `Transaction` model không có cột | Retry có thể trừ tiền 2 lần | Thêm `idempotency_key` UNIQUE |

### P1 — Trung bình (cần xử lý trong vòng sprint tiếp)

| # | Phát hiện | Bằng chứng | Tác động | Hướng khắc phục |
|---|---|---|---|---|
| 4 | **Không có refresh token / deny list** | Không tìm thấy cơ chế thu hồi | Token cũ valid 24h sau khi đổi MK / khóa TK | Thêm `token_version` hoặc deny list |
| 5 | **Không có optimistic locking** | `WarrantyTicket` không có `version` | Hai admin cùng đổi status → mất dấu vết | Thêm `version` + WHERE check |
| 6 | **Repair cost thay đổi không có history** | `update_status` ghi đè không log | Gian lận giá khó phát hiện | Lưu old/new vào `WarrantyHistory` |
| 7 | **`serial_number` 400 thay vì 409** | `products.py:53` | Nhầm lẫn với lỗi validation | Đổi thành `HTTP 409 Conflict` |
| 8 | **`/tickets/public/{code}` không rate-limit** | `tickets.py:28-66` | Enumeration khả thi (dù khó) | Thêm rate-limit |
| 9 | **Login rate-limit theo email, không theo IP** | `auth.py:274-283` | Brute-force nhiều email cùng lúc | Thêm rate-limit theo IP |

### P2 — Thấp (cải tiến)

| # | Phát hiện | Bằng chứng | Tác động | Hướng khắc phục |
|---|---|---|---|---|
| 10 | **`ticket_code` có thể trùng (count-based)** | `warranty_service.py:42-45` | Sequence race condition | Thêm UNIQUE constraint, retry-on-conflict |
| 11 | **`S1 fix` super-admin chưa phân biệt rõ với admin** | `auth.py:248-265` | Có thể nhầm super-admin với org-admin | Đợi xác nhận CẦN XÁC NHẬN 5 |
| 12 | **`/customers/technicians` URL không chuẩn REST** | `customers.py:28-34` | Có thể nhầm với tài nguyên customer | Đợi xác nhận CẦN XÁC NHẬN 3 |
| 13 | **Brute force không có captcha** | chỉ rate-limit theo email | Bot có thể retry với email rotation | Thêm captcha sau N lần fail |

---

## 9. Điểm chưa thể xác minh (NOT VERIFIED)

1. **Test hiện có:** chưa đọc `backend/tests/`. Cần kiểm tra trước khi đánh giá "test coverage".
2. **Migration Alembic:** chưa đọc `alembic/versions/`. Có thể có constraint/index mà code Python không thể hiện.
3. **RLS (Row Level Security):** SQLite không hỗ trợ; nếu chuyển Postgres có thể đã được cấu hình.
4. **Storage file avatar:** file lưu ở `static/uploads/` — kiểm tra quyền filesystem chưa thực hiện.
5. **AI history/log cache:** chưa đọc `ai_service.py`. Có thể có cache chứa dữ liệu user chưa filter tenant.
6. **Background jobs:** không tìm thấy, nhưng cần xác nhận `notification_service` không có async task ngoài request scope.

---

## 10. Cập nhật câu hỏi OPEN_QUESTIONS.md (chốt từ bằng chứng)

| Câu hỏi | Trước audit | Sau audit | Đề xuất |
|---|---|---|---|
| **CẦN XÁC NHẬN 1** (quy tắc hạn BH) | OPEN | CONFIRMED chỉ dùng `manufacture_date + warranty_months` (`warranty_service.py:20-31`) | Vẫn OPEN. Cần chủ dự án quyết trước khi thêm `sell_date`/`activation_date`. |
| **CẦN XÁC NHẬN 2** (serial unique) | OPEN | CONFIRMED unique TOÀN HỆ THỐNG (`models/product.py:11`) | Đề xuất: giữ unique toàn hệ thống nếu không có multi-tenant; nếu có → unique theo `organization_id`. |
| **CẦN XÁC NHẬN 3** (endpoint tech) | OPEN | CONFIRMED `/customers/technicians` (`customers.py:28-34`) | Đề xuất: thêm `/technicians` (alias) → deprecate dần `/customers/technicians`. |
| **CẦN XÁC NHẬN 4** (hiệu năng) | OPEN | NOT VERIFIED — chưa benchmark | Cần script benchmark với dữ liệu đại diện. |
| **CẦN XÁC NHẬN 5** (super-admin) | OPEN | CONFIRMED chỉ có `admin` (org scope) trong code | Đề xuất: KHÔNG cần super-admin ở giai đoạn này. Nếu sau cần, tạo role `super_admin` riêng với audit bắt buộc. |

---

## 11. Test tenant isolation cần viết tiếp

Khi CẦN XÁC NHẬN 5 (super-admin) và CẦN XÁC NHẬN 2 (serial unique) được chốt:

1. **Tạo 2 user thuộc 2 organization khác nhau (mock).**
2. **Test A:** User A tạo sản phẩm `serial=X`. User B cố tạo `serial=X` → 409 (nếu unique global) hoặc thành công (nếu unique per-org).
3. **Test B:** User A (org A) truy cập `GET /tickets/{id}` của phiếu org B → 403.
4. **Test C:** User A gọi `GET /finance/summary` → chỉ thấy dữ liệu org A.
5. **Test D:** IDOR test: thay đổi `id` trong URL → backend trả 403/404.
6. **Test E:** Race condition pay: 2 request pay đồng thời với cùng `idempotency_key` → chỉ 1 thành công.
7. **Test F:** Login lockout: 6 lần sai liên tiếp → request thứ 6 trả 423.

---

## 12. File dự kiến cần sửa sau audit (chỉ đề xuất, KHÔNG sửa trong bước này)

| File | Lý do sửa | Mức ưu tiên |
|---|---|---|
| `backend/app/models/user.py` | Thêm `organization_id` (FK) nếu multi-tenant | P0 |
| `backend/app/models/product.py` | Đổi `serial_number` unique constraint (theo tenant) | P0 |
| `backend/app/models/warranty.py` | Thêm `organization_id`, `version` | P0 |
| `backend/app/models/wallet.py` | Thêm `idempotency_key` UNIQUE | P1 |
| `backend/app/api/v1/endpoints/products.py` | Đổi `400` → `409` cho trùng serial | P1 |
| `backend/app/api/v1/endpoints/wallet.py` | Thêm rate-limit, giới hạn amount/ngày cho topup | P1 |
| `backend/app/services/warranty_service.py` | Optimistic locking update_status, history cho repair_cost | P1 |
| `backend/app/core/permissions.py` | Thêm `token_version` check | P1 |
| `backend/app/api/v1/endpoints/tickets.py` | Rate-limit cho `/tickets/public/{code}` | P2 |
| Migration Alembic mới | Thêm cột mới + index | P0 (khi triển khai multi-tenant) |

---

## 13. Verification Matrix — Giai đoạn A (2026-10-03)

Kết quả xác minh từng phát hiện bằng test thực tế và đọc code.

### 13.1. Test thực tế (sau khi hoàn tất Giai đoạn 1 P0)

**Lệnh chạy:** `cd backend && .venv\Scripts\python.exe -m pytest tests\ -v`

**Kết quả (sau hardening Giai đoạn 1):**
- ✅ **67/67 test PASSED** trong 67.3 giây (60 cũ + 7 mới trong `test_wallet_topup_security.py`)
- 0 test failed, 0 test error
- Chỉ có warning Pydantic/Starlette về `class-based config` (deprecation, không phải lỗi)

| File test | Số test | Trạng thái | Phủ finding |
|---|---|---|---|
| `test_cleanup_legacy.py` | 4 | ✅ PASSED | Hỗ trợ xóa user nghi ngờ |
| `test_login_lockout.py` | 5 | ✅ PASSED | S3 brute force (P0 #3) |
| `test_product_object_level.py` | 8 | ✅ PASSED | S5c ownership (P0 #2) |
| `test_register_escalation.py` | 9 | ✅ PASSED | S1 role escalation (P0 #1) |
| `test_supabase_jwt.py` | 13 | ✅ PASSED | S4 JWT verification (P0 #1) |
| `test_ticket_object_level.py` | 11 | ✅ PASSED | S5a/S5b IDOR (P0 #2) |
| `test_warranty.py` | 14 | ✅ PASSED | Workflow + wallet atomic |
| `test_wallet_topup_security.py` | 7 | ✅ PASSED (MỚI) | P0 hardening top-up |

### 13.2. Xác minh từng phát hiện P0

| # | Phát hiện (ban đầu) | Trạng thái xác minh | Bằng chứng |
|---|---|---|---|
| 1 | Role escalation qua `/auth/register` | ✅ **MITIGATED** (giữ nguyên, không thay đổi) | `test_register_escalation.py:54-63` test với `role=admin/staff` → assert role=customer |
| 2 | Customer A xem data customer B | ✅ **MITIGATED** | `test_product_object_level.py:91-100, 122-131` + `test_ticket_object_level.py:104-114, 178-188, 209-216` đều PASSED |
| 3 | Brute force login | ✅ **MITIGATED** | `test_login_lockout.py:56-74` test 5 lần sai → 401, lần 6 → 423 PASSED |
| 4 | Topup client tự khai amount | ✅ **MITIGATED** | `wallet.py:30-46` chặn khi `ALLOW_SANDBOX_TOPUP=false` + không có `payment_provider_ref`. Test: `test_wallet_topup_security.py` 7/7 PASSED. |
| 5 | Không idempotency_key cho payment | ⚠️ **NOT FIXED** (chưa xử lý) | `Transaction` model không có cột. Đã chuyển vào Giai đoạn 2 theo roadmap. |

### 13.3. Xác minh cấu hình

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| `.env.example` | ✅ CREATED (2026-10-03) | `backend/.env.example` liệt kê 12 env bắt buộc, không chứa secret. Đã dùng để xác minh thiếu SUPABASE_URL/ANON_KEY trong `.env` thật. |
| Alembic/migrations | ❌ **KHÔNG CÓ** | Dùng `Base.metadata.create_all()` qua `app/main.py`. Đổi schema = sửa model + recreate. Có rủi ro mất dữ liệu khi thay đổi. |
| `SECRET_KEY` enforce | ✅ OK | `config.py:45-51` validator yêu cầu SECRET_KEY không rỗng |
| `SUPABASE_URL/ANON_KEY` | ⚠️ thiếu trong `.env` thật | Có trong `conftest.py` cho test, nhưng `.env` production thiếu → OAuth Google sẽ raise RuntimeError. Cần điền trước khi bật nút Google login. |
| CORS whitelist | ✅ OK | `config.py:19-27` whitelist localhost:5173/5174 |
| `BACKEND_CORS_ORIGINS` parsing | ⚠️ NOT VERIFIED | pydantic-settings parse env có thể fail khi format JSON phức tạp — cần verify khi deploy |

### 13.4. Xác minh AI service (đọc chi tiết)

`backend/app/services/ai_service.py`:

- ✅ `anonymize()` (line 53-63) ẩn SĐT 9-11 số, email, CMND 9-12 số
- ✅ `classify_issue` chạy `anonymize()` trước khi phân loại (line 66-69)
- ✅ `summarize_history` chạy `anonymize()` trên history (line 71-74)
- ✅ `generate_progress_message` chỉ giữ tên cuối (line 76-83)
- ✅ Không có cache AI giữa các user
- ⚠️ `classify_issue_gemini` chỉ là placeholder (line 86-91), trả None → fallback mock. Nếu chuyển production cần implement và test.
- ⚠️ `summarize_history_gemini` không tồn tại → đang chỉ mock

### 13.5. Xác minh notification service (đọc chi tiết)

`backend/app/services/notification_service.py`:

- ✅ Đồng bộ trong request (không có async/background job ngoài scope)
- ✅ `notify_ticket_created` chỉ lấy `customer_name` đã có sẵn trong DB
- ✅ Thông báo theo `user_id` — không leak giữa user
- ✅ Không chứa SĐT/email/CMND trong message

### 13.6. Kết quả xác minh Giai đoạn A

**Trạng thái phát hiện sau xác minh:**

| Phát hiện | Trạng thái |
|---|---|
| Role escalation (S1) | ✅ Đã xác minh đã sửa |
| Brute force (S3) | ✅ Đã xác minh đã sửa |
| Ownership + IDOR (S5a, S5b, S5c) | ✅ Đã xác minh đã sửa |
| JWT Supabase (S4) | ✅ Đã xác minh đã sửa |
| **Top-up tự khai amount** | ⚠️ **CHƯA XỬ LÝ — cần làm ở giai đoạn 1** |
| **Thiếu `.env.example`** | ⚠️ **CHƯA XỬ LÝ — cần làm ở giai đoạn 1** |
| Idempotency key | ⏸️ Theo roadmap → giai đoạn 2 |
| Optimistic locking | ⏸️ Theo roadmap → giai đoạn 2 |
| Repair cost history | ⏸️ Theo roadmap → giai đoạn 2 |
| Token version / invalidate | ⏸️ Theo roadmap → giai đoạn 2 |
| Rate limit IP | ⏸️ Theo roadmap → giai đoạn 2 |
| Public lookup rate limit | ⏸️ Theo roadmap → giai đoạn 3 |
| Benchmark hiệu năng | ⏸️ Theo roadmap → giai đoạn 3 |

---

## 14. Kết luận Giai đoạn A

**`READY FOR HARDENING STAGE 1`**

Lý do:
1. 4/4 phát hiện P0 "rủi ro bảo mật đã biết" đã được verify bằng test thực tế (60/60 PASSED).
2. 2 phát hiện còn lại (topup self-claim, thiếu `.env.example`) đã được xác minh tồn tại và đã được đưa vào kế hoạch giai đoạn 1.
3. AI service và notification service đã được xác minh không chứa lỗ hổng P0/P1 mới.
4. Không có thay đổi nào cần làm trước khi vào giai đoạn B (hardening).

**Khuyến nghị cho Giai đoạn B — Hardening Stage 1 (P0):**

Hạng mục ưu tiên (theo thứ tự):
1. **Tạo `.env.example`** (rủi ro thấp, thời gian nhỏ) — bổ sung SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_GOOGLE_CLIENT_ID.
2. **Chặn top-up tự khai amount ở production** — thêm env flag `ALLOW_SANDBOX_TOPUP` (mặc định false), production yêu cầu `payment_provider_ref`.
3. **Thêm test cho 2 thay đổi trên** (test `.env.example` không commit secret, test production không cho topup tự do).
4. **Chạy regression test** toàn bộ 60+ test mới.

Sau khi hoàn tất → cập nhật `SECURITY_AUDIT.md` mục 8 (P0 list) và `SECURITY_ROADMAP.md` mục 7 (tiến độ).
