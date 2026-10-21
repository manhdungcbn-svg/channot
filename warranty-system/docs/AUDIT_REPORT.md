# BÁO CÁO KIỂM TRA BẢO MẬT — Hệ thống Quản lý Bảo hành

**Giai đoạn:** Phase 0 — Audit đầu vào
**Phạm vi đánh giá:** `warranty-system/backend/` + `warranty-system/frontend/`
**Trạng thái:** ĐÃ FIX 5/5 lỗi nghiêm trọng (S1, S2, S3, S4, S5) + S5c (products IDOR) — toàn bộ đã verify runtime (60 test pass)
**Ngày tạo:** chưa commit
**Lần cập nhật cuối:** chưa commit (2026-10-03 08:08 — đã fix S1, S2, S3, S4, S5, S5c, bug `test_progress_message_for_statuses`; 60 test pass)

---

## 1. Phạm vi kiểm tra

| Lớp | Số file đã đọc | Trạng thái |
|---|---|---|
| Backend (main, core, models, services, endpoints, schemas) | 25 file | đã đọc |
| Frontend (App, main, AuthContext, ProtectedRoute, api, services, 6 pages chính) | 12 file | đã đọc |
| Frontend components (StatusBadge, Layout, CreateTicket, EmptyState, StatCard, PageHeader, v.v.) | chưa đọc | cần đọc thêm nếu cần |
| Tests | 1 file (`tests/test_warranty.py`) | đã đọc |
| Config (requirements.txt, package.json, vite.config.js, docker-compose.yml, .env, .gitignore) | 6 file | đã đọc |

**Không đọc:** `ECC/` (ngoài phạm vi dự án), file `xây dựng giao diện.md` (ngoài lề), các components frontend chưa liệt kê.

---

## 2. Tổng quan trạng thái

| Lớp | Điểm mạnh | Điểm yếu |
|---|---|---|
| Xác thực | bcrypt + JWT HS256 + role-based decorator | 24h token không refresh; không có lockout khi nhập sai mật khẩu (config có, code chưa wire) |
| Phân quyền (RBAC) | Đầy đủ decorator, mapping rõ cho 36 endpoint | 10 endpoint thiếu object-level check; 1 endpoint `POST /auth/register` cho phép đăng ký admin |
| Bảo mật secrets | Dùng `pydantic-settings` đọc `.env` | **5 secret hard-code trong source** (`SECRET_KEY`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` ở 2 nơi) — chi tiết ở §7a |
| Mã nguồn dịch vụ | `wallet_service` có pattern ACID đúng (pessimistic lock) | 4 chỗ `try/except Exception: pass` nuốt lỗi không log |
| Giao diện (FE) | `<ProtectedRoute>` đầy đủ, React auto-escape | localStorage dễ bị XSS đánh cắp token; SĐ cá nhân hard-code trong `Lookup.jsx` |
| Vận hành | docker-compose có Postgres + pgAdmin | Không có Alembic; không có audit log cho hành động admin; không có backup script |
| AI | Anonymizer ẩn SĐT, email, CCCD; fallback mock luôn chạy | Gemini adapter chưa tích hợp thật; regex đơn giản (chưa ẩn họ tên) |
| Tài chính | Sổ cái `finance_transactions` với balance check | `summary()` không lock → race condition khi 2 transfer cùng lúc |

---

## 3. Bug backlog nghiêm trọng (cần fix trước khi lên production)

### S1 — Privilege Escalation qua `POST /auth/register` [CRITICAL]

**Mô tả:** Bất kỳ ai chưa đăng nhập cũng có thể tạo user với `role: "admin"` bằng cách gửi request trực tiếp. Endpoint chỉ validate giá trị `role` nằm trong whitelist, **không kiểm tra người gọi**.

**Bằng chứng gốc (trước fix):** `backend/app/api/v1/endpoints/auth.py:74-95`

```python
@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: ...):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email đã được đăng ký")
    if payload.role not in ("admin", "staff", "technician", "customer"):
        raise HTTPException(400, "Vai trò không hợp lệ")
    user = User(... role=payload.role, ...)
```

**Tác động (trước fix):** Chiếm quyền admin toàn hệ thống, bao gồm quyền tạo/xóa user, xem toàn bộ phiếu bảo hành, can thiệp sổ tài chính.

**Bằng chứng sửa đổi (2026-10-02):**

| File | Trước | Sau | Đối chiếu |
|---|---|---|---|
| `backend/app/api/v1/endpoints/auth.py` (`register`) | Validate whitelist role + dùng `payload.role` để set role | Bỏ validate whitelist, **ép role="customer"** bất kể payload. Đổi `if payload.role == "customer"` → `if user.role == "customer"` | ✅ sạch escalation |
| `backend/app/api/v1/endpoints/auth.py` (mới `POST /auth/users`) | (không có) | Thêm mới: yêu cầu `require_roles("admin")`, cho phép tạo user với role bất kỳ trong whitelist | ✅ |
| `backend/app/core/permissions.py` | (đã có `require_roles`) | Import thêm vào `auth.py` | ✅ |
| `backend/tests/test_register_escalation.py` (mới) | (không có) | 9 test: escalation qua register (3 case), admin tạo được mọi role (2 case), non-admin 403, no-auth 401, invalid role 400 | ✅ |

**Trạng thái:** Đã fix code, đã verify runtime ✅ (xem §7d).

**Rủi ro còn lại:**
- DB hiện tại có thể có user role≠customer tạo qua endpoint public trước fix — chưa xóa (xem §7b).
- Client nào đang gọi `POST /auth/register` với `role≠"customer"` sẽ bị đổi role → customer. Cần thông báo cho FE team (nếu có).

---

### S2 — Hard-code secrets trong source code [CRITICAL]

**Mô tả:** 4 secret đang nằm trực tiếp trong code, kể cả khi `.env` rỗng.

**Bằng chứng gốc (trước fix):**
- `backend/app/core/config.py:18` — `GEMINI_API_KEY` có default là key thật.
- `backend/app/api/v1/endpoints/auth.py:37-44` — `supabase_url`, `apikey`, JWT anon key hard-code.
- `backend/app/core/config.py:12` — `SECRET_KEY` có default, đây là secret ký JWT HS256.

**Tác động (trước fix):**
- Bất kỳ ai đọc source đều có key thật → gọi được Gemini API, Supabase Admin API.
- Kẻ tấn công có `SECRET_KEY` có thể tự cấp JWT hợp lệ với role bất kỳ.
- `.gitignore` chỉ ignore `.env.local`, không ignore `.env` → file `.env` có thể đã từng được commit.

**Biện pháp (đề xuất ban đầu):**
1. Thu hồi key cũ ở Supabase Dashboard và Google AI Studio.
2. Tạo key mới, lưu vào `.env` (file local, không commit).
3. Sửa `config.py` để raise lỗi nếu thiếu `GEMINI_API_KEY`, `SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
4. Xóa default trong source.
5. Thêm `.env` vào `.gitignore`.
6. Quét `git log -p` để xác nhận không commit `.env` hoặc key.
7. Bổ sung test `test_config_raises_without_secrets`.

**Bằng chứng sửa đổi (2026-10-02):**

| File | Trước | Sau | Đối chiếu |
|---|---|---|---|
| `backend/app/core/config.py` | `SECRET_KEY: str = "warranty_secret_key_change_in_production_2026"`, `GEMINI_API_KEY: str = "AQ.Ab8RN6L5V2Iw5Vkg8Q1t_UHUt9pwIQLYnvzjMFl-rrmhWW3pGg"` | `SECRET_KEY: str` (không default, raise RuntimeError nếu rỗng), `GEMINI_API_KEY: str = ""` (chỉ raise khi `AI_MODE="gemini"`) | ✅ sạch |
| `backend/app/api/v1/endpoints/auth.py` | `supabase_url = "https://xwlfhynthgnmspuabzus.supabase.co"`, anon key JWT trong headers + Authorization | `settings.SUPABASE_URL`, `settings.SUPABASE_ANON_KEY` (đọc từ env, raise nếu thiếu qua `require_supabase_oauth_if_needed()`) | ✅ sạch |
| `frontend/src/services/supabase.js` | URL + anon key JWT hard-code | `import.meta.env.VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ✅ sạch |
| `.gitignore` | `.env.local` | Thêm `.env` | ✅ sạch |

**Trạng thái:** Đang fix — code đã refactor, **chưa verify runtime** (chưa chạy pytest, chưa test manual login Supabase OAuth). Bạn cần:
1. Cấu hình `SUPABASE_URL` + `SUPABASE_ANON_KEY` mới trong `backend/.env` (nếu muốn Google login).
2. Cấu hình `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` trong `frontend/.env`.
3. (Tùy chọn) cấu hình `GEMINI_API_KEY` mới nếu `AI_MODE="gemini"`.

**Rủi ro còn lại:**
- `git log -p` chưa kiểm tra — có thể key cũ vẫn nằm trong lịch sử commit. Cần `git log -p --all -- backend/app/core/config.py backend/app/api/v1/endpoints/auth.py frontend/src/services/supabase.js` để xác nhận.
- `.env` của bạn hiện đang chứa 1 key mới (Supabase + Gemini) — **KHÔNG commit file này** (đã có `.env` trong `.gitignore`).

---

### S3 — Không có rate-limit / lockout cho login [HIGH]

**Mô tả:** `MAX_FAILED_LOGIN_ATTEMPTS=5` và `LOCKOUT_DURATION_MINUTES=15` đã khai báo trong `config.py:26-28` nhưng **không được sử dụng ở đâu**.

**Bằng chứng gốc (trước fix):** `backend/app/api/v1/endpoints/auth.py:99-106` — hàm `login_json` chỉ so sánh password, không đếm lỗi.

```python
def login_json(payload: LoginRequest, db):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Email hoặc mật khẩu không đúng")
    # KHÔNG có logic đếm failed_attempts, không có lockout
```

**Tác động (trước fix):** Brute-force password không giới hạn. Cùng lỗi ở `login_form`.

**Bằng chứng sửa đổi (2026-10-02):**

| File | Trước | Sau | Đối chiếu |
|---|---|---|---|
| `backend/app/models/login_attempt.py` (mới) | (không có bảng) | Model `LoginAttempt(email, attempt_count, locked_until, last_attempt_at)` + helper `is_locked()`, `remaining_seconds()` | ✅ |
| `backend/scripts/create_login_attempts_table.py` (mới) | (không có) | Script idempotent tạo bảng — `python -m scripts.create_login_attempts_table` | ✅ |
| `backend/app/api/v1/endpoints/auth.py` (`login_json`) | Không check lockout, không record fail | Wire `_enforce_login_rate_limit` trước verify, `_record_failed_attempt` khi fail, `_reset_login_attempts` khi thành công | ✅ |
| `backend/app/api/v1/endpoints/auth.py` (`login_form`) | Tương tự | Wire cùng 3 helper | ✅ |
| `backend/tests/test_login_lockout.py` (mới) | (không có) | 5 test: success, lockout sau MAX, message còn giây, isolation per-email, login_form cũng rate-limited — **5/5 pass** | ✅ |

**Trạng thái:** Đã fix code, đã verify runtime ✅.

**Rủi ro còn lại:**
- Bảng `login_attempts` **chưa có trong DB production**. Cần chạy `python -m scripts.create_login_attempts_table` 1 lần trên production trước khi deploy. Nếu không, app sẽ crash khi login lần đầu.
- Chưa wire rate-limit cho các endpoint đăng nhập khác (chỉ `login_json` + `login_form`). Supabase OAuth (`POST /auth/supabase-token`) chưa có.

---

### S4 — Supabase OAuth endpoint không verify audience/issuer [HIGH]

**Mô tả:** `POST /auth/supabase-token` nhận bất kỳ `id_token` nào, gọi lại Supabase public API để verify, **rồi dùng email trong response để tạo user** (nếu chưa có) với `role="customer"`.

**Bằng chứng:** `backend/app/api/v1/endpoints/auth.py:34-71`

**Tác động:**
- Nếu attacker đăng ký Supabase với email `admin@example.com` rồi gọi endpoint này, hệ thống tạo user với email đó + role `customer` (không escalate được, nhưng vẫn có account trong hệ thống).
- Tệ hơn: nếu admin email chưa có trong DB, endpoint **không tự tạo admin**, chỉ tạo `customer`. Nhưng ngược lại — nếu email đã tồn tại với role admin (đã có từ S1), attacker có thể đăng nhập với token Supabase giả.
- Verify qua HTTP call thay vì JWT signature verification → race condition có thể bypass.

**Biện pháp:**
1. Verify JWT signature bằng `python-jose` thay vì gọi lại HTTP.
2. Hoặc: chỉ chấp nhận email trong whitelist (admin allowlist).
3. Bổ sung test `test_supabase_oauth_rejects_unsigned_token`.

**Bằng chứng sửa đổi (2026-10-02 11:20):**

| File | Trước | Sau | Đối chiếu |
|---|---|---|---|
| `backend/app/core/supabase_jwt.py` (mới) | (không có) | Module `verify_supabase_jwt()` — verify JWT signature bằng JWKS local, cache TTL 1 giờ. Hỗ trợ 2 loại: Supabase session (aud="authenticated", iss={project_ref}) và Google provider_token | ✅ |
| `backend/app/core/config.py` | (chỉ SUPABASE_URL, ANON_KEY) | Thêm `SUPABASE_GOOGLE_CLIENT_ID` (optional, verify audience Google) | ✅ |
| `backend/app/api/v1/endpoints/auth.py` (`supabase_oauth`) | Verify bằng HTTP `/token/verify` | Verify bằng `verify_supabase_jwt()` (local). HTTP call đã bỏ hoàn toàn. | ✅ |
| `backend/tests/conftest.py` (mới) | (không có) | Set env cho test (SUPABASE_URL, SUPABASE_ANON_KEY, SECRET_KEY, AI_MODE) | ✅ |
| `backend/tests/test_supabase_jwt.py` (mới) | (không có) | 12 test: 8 unit (verify JWT hợp lệ, sai aud, sai iss, hết hạn, sai signature, không RS256, garbage, rỗng) + 4 endpoint (reject unsigned, reject expired, tạo user mới, login user cũ) — **12/12 pass** | ✅ |

**Trạng thái:** Đã fix code, đã verify runtime ✅.

**Phát hiện khi sửa:** Frontend (`frontend/src/pages/Login.jsx:206-212`) gửi `provider_token` (Google access token), không phải `id_token` (Supabase session). Endpoint nhận `provider_token` qua param `id_token` — đã sửa để hỗ trợ cả 2 loại.

**Rủi ro còn lại:**
- Supabase rotate public key → cache 1 giờ tự refresh.
- `SUPABASE_GOOGLE_CLIENT_ID` chưa được set trong `.env` → audience check bị bỏ qua cho Google token (vẫn verify signature). Bạn nên set để bảo mật đầy đủ.

---

### S5 — IDOR trên /tickets/{id}/status và /summarize [CRITICAL + HIGH]

**Mô tả:** Một số endpoint nhận `ticket_id` từ URL nhưng không kiểm tra người gọi có phải "chủ sở hữu" phiếu không.

**Bằng chứng gốc (trước fix):**

- `backend/app/api/v1/endpoints/tickets.py:139-156` (`change_status`) — cho phép bất kỳ technician nào sửa phiếu bất kỳ.
- `backend/app/api/v1/endpoints/tickets.py:160-170` (`summarize`) — cho phép bất kỳ user đăng nhập xem tóm tắt phiếu bất kỳ.

**Tác động (trước fix):**

| Lỗi | Endpoint | Mức độ |
|---|---|---|
| S5a | `/tickets/{id}/status` | CRITICAL — kỹ thuật viên A có thể sửa phiếu của kỹ thuật viên B, ghi nhận lịch sử sai |
| S5b | `/tickets/{id}/summarize` | HIGH — khách hàng có thể đoán ID phiếu người khác và xem tóm tắt AI (lộ thông tin nội bộ) |

**Bằng chứng sửa đổi (2026-10-02):**

| File | Trước | Sau | Đối chiếu |
|---|---|---|---|
| `backend/app/api/v1/endpoints/tickets.py` (`change_status`) | Không check ownership | `if current.role == "technician" and t.technician_id != current.id: 403`. Admin/staff được sửa mọi phiếu. Khi admin/staff sửa, `technician_id` trong history = null | ✅ |
| `backend/app/api/v1/endpoints/tickets.py` (`summarize`) | Không check ownership | Customer → 403 nếu `t.customer_id != current.id`. Technician → 403 nếu `t.technician_id != current.id`. Admin/staff OK | ✅ |
| `backend/tests/test_ticket_object_level.py` (mới) | (không có) | 9 test S5: tech_A sửa phiếu mình OK, tech_A sửa phiếu tech_B 403, staff OK, admin OK, customer bị RBAC 403, customer tóm tắt phiếu mình OK, customer tóm tắt phiếu người khác 403, tech được phân công OK, tech không phân công 403 — **9/9 pass** | ✅ |

**Trạng thái:** Đã fix code, đã verify runtime ✅ (xem §7d).

**Bằng chứng sửa S5c (2026-10-03 08:08):**

| File | Trước | Sau | Đối chiếu |
|---|---|---|---|
| `backend/app/api/v1/endpoints/products.py` (`list_products`) | Trả toàn bộ products, không filter ownership | `if current.role == "customer": query = query.filter(Product.customer_id == current.id)`. Admin/staff/technician thấy hết | ✅ |
| `backend/app/api/v1/endpoints/products.py` (`get_by_serial`) | Ai cũng xem được | `if current.role == "customer" and p.customer_id != current.id: raise 403`. Staff/technician/admin OK | ✅ |
| `backend/tests/test_product_object_level.py` (mới) | (không có) | 7 test: customer A chỉ thấy sản phẩm của mình; customer A không thấy sản phẩm B; staff thấy hết; customer xem serial của mình OK; customer xem serial B → 403; staff xem serial bất kỳ OK; serial không tồn tại → 404 — **7/7 pass** | ✅ |

**Trạng thái S5c:** Đã fix code, đã verify runtime ✅.

**Rủi ro còn lại (không thuộc scope S5/S5c):**
- `/customers` — staff thấy toàn bộ customers. Multi-tenant sẽ scope theo organization (xem `MULTI_TENANT_PLAN.md`).
- `/tickets/{id}/assign` — admin/staff phân công bất kỳ ticket, bất kỳ technician (cross-tenant khi multi-tenant).

---

### S5 — Object-level check chưa đầy đủ (IDOR) [HIGH]

**Mô tả:** Mới có 2 endpoint check ownership; 10 endpoint khác chỉ check role-based mà không kiểm tra tài nguyên có thuộc sở hữu của current user hay không.

**Bằng chứng chi tiết:**

| Endpoint | File | Đoạn code | Vấn đề |
|---|---|---|---|
| `GET /tickets/{id}` | `tickets.py:97` | `if current.role == "customer" and t.customer_id != current.id: raise 403` | ✅ đúng |
| `POST /tickets` | `tickets.py:109-110` | `if current.role == "customer" and product.customer_id and product.customer_id != current.id: raise 403` | ✅ đúng |
| `POST /tickets/{id}/assign` | `tickets.py:125-135` | chỉ check role, không verify ticket thuộc cùng tổ chức | ❌ thiếu |
| `POST /tickets/{id}/status` | `tickets.py:139-156` | chỉ check role; technician có thể đổi status phiếu của technician khác | ❌ thiếu |
| `POST /tickets/{id}/summarize` | `tickets.py:158-169` | chỉ cần login; không check ownership | ❌ thiếu |
| `POST /tickets/{id}/pay` | `tickets.py:172-192` | check ownership cho customer, nhưng thiếu check technician role | ⚠️ một phần |
| `GET /products` | `products.py:14-25` | `if current.role == "customer": query.filter(Product.customer_id == current.id)` | ✅ đúng |
| `GET /products/serial/{serial}` | `products.py:27-37` | `if current.role == "customer" and p.customer_id != current.id: raise 403` | ✅ đúng |
| `GET /customers` | `customers.py:15-26` | chỉ filter role | ⚠️ (multi-tenant) |

**Tác động (single-tenant hiện tại):** Thấp. Tác động lớn khi chuyển sang multi-tenant (xem `MULTI_TENANT_PLAN.md`).

**Biện pháp:**
1. Tạo helper `verify_ticket_access(db, ticket, current_user, action="read"|"write")` để chuẩn hóa.
2. Áp dụng cho tất cả endpoint `/tickets/*`.
3. Bổ sung test cross-customer: `test_customer_cannot_view_other_ticket`, `test_technician_cannot_change_other_tech_ticket`.

**Trạng thái:** Chưa fix (ưu tiên thấp khi single-tenant, ưu tiên cao khi multi-tenant).

---

## 4. Vấn đề trung bình (cần fix trong Phase 0)

| ID | Mô tả | File | Biện pháp |
|---|---|---|---|
| M1 | File upload dùng đường dẫn relative, mất khi Docker restart | `auth.py:167` | Mount volume `/app/static/uploads`, dùng `UPLOAD_DIR` env |
| M2 | `try/except Exception: pass` nuốt lỗi 4 chỗ | `warranty_service.py:101, 128, 176, 180` | Thay `pass` bằng `logger.warning(...)` |
| M3 | Không có `logging` ở app code | toàn bộ | Thêm `logging.getLogger(__name__)`, viết audit log cho admin actions |
| M4 | Public lookup trả 4 số cuối SĐT, không rate-limit | `tickets.py:30-65` | Thêm `slowapi` rate-limit theo IP |
| M5 | Anonymizer regex đơn giản, chưa ẩn họ tên Việt | `ai_service.py:57-63` | Bổ sung blacklist tên riêng phổ biến hoặc dùng NLP |
| M6 | JWT payload chứa `role` — risk nếu secret lộ | `security.py:23-30` | Bỏ role khỏi payload, lookup từ DB |
| M7 | Frontend localStorage dễ XSS | `api.js:9-14` | Cân nhắc httpOnly cookie (cần backend support) |
| M8 | Hard-code SĐ + email cá nhân | `frontend/src/pages/Lookup.jsx:111, 213` | Đưa vào `.env` frontend |
| M9 | `wallet_service.py` `try/except: pass` cho `with_for_update()` | `wallet_service.py:36, 60` | Catch specific exception `OperationalError`, không nuốt mọi lỗi |
| M10 | `finance_service.summary()` race condition | `finance_service.py:21-40` | Dùng `with_for_update()` hoặc aggregate table |

---

## 5. Vấn đề thấp (cân nhắc Phase 3)

| ID | Mô tả | File |
|---|---|---|
| L1 | `.env` không có trong `.gitignore` | `.gitignore:6` |
| L2 | `allow_methods=["*"]` quá rộng | `main.py:21` |
| L3 | `@supabase/supabase-js` và `qrcode` khai báo nhưng chưa dùng | `package.json` |
| L4 | `payments.py` (frontend) đang dùng `walletService.transactions()` cho sổ cái admin | `Payment.jsx:111-115` |
| L5 | Index thiếu cho `warranty_history.ticket_id`, `transactions.wallet_id`, `notifications.user_id`, `warranty_tickets.customer_id` | DB schema |

---

## 6. Đề xuất Phase tiếp theo

### Phase 0 — Xử lý cấp bách (đang thực hiện)

1. **S2** (đang làm): xóa hard-code secrets, chuẩn bị code, chờ bạn cấp secret mới.
2. **S1**: chặn privilege escalation trong `POST /auth/register`.
3. **S3**: wire rate-limit vào login.
4. **S4**: verify JWT signature cho Supabase OAuth.

### Phase 1 — Thiết kế (xem `MULTI_TENANT_PLAN.md`)

- Chốt mô hình `organizations` + `organization_members` (multi-membership).
- ERD, danh sách file cần sửa, kế hoạch backfill.

### Phase 2 — Triển khai

- Thêm `organization_id` + composite FK.
- Row Level Security (RLS).
- Test cách ly tenant.

### Phase 3 — Mở rộng nghiệp vụ

- Mở rộng phiếu, sản phẩm, khách hàng trên nền tenant đã kiểm thử.

### Phase 4 — Hoàn thiện

- Hoàn thiện docs, regression test, đánh giá bảo mật, nghiệm thu.

---

## 7. Vấn đề chưa xác minh (cần thêm thông tin)

| Mục | Lý do chưa xác minh |
|---|---|
| Tests đang pass hay fail | Chưa chạy `pytest backend/tests` |
| Coverage % | Chưa cấu hình coverage tool |
| Git history có chứa secret không | Chưa `git log -p \| grep` |
| `.env` có bị commit không | Chưa kiểm tra (xem mục 7a — lệnh đã được ghi nhận) |
| Backup Postgres đã chạy chưa | Chưa có script |
| Performance dưới tải | Chưa load test |
| Frontend components (chưa đọc) | Có thể phát hiện thêm bug nếu đọc |

### 7a. Kết quả scan secrets toàn hệ thống (chuẩn bị fix S2)

**Phạm vi scan:** toàn bộ `*.py` trong `backend/app/` + toàn bộ `*.js`/`*.jsx` trong `frontend/src/` (theo yêu cầu user — không scan docs, config, git log).

**Tổng số secrets bị phát hiện:** **5 secret**, phân bố ở 4 file:

| # | Secret | Loại | File | Dòng | Mức độ |
|---|---|---|---|---|---|
| 1 | `warranty_secret_key_change_in_production_2026` | `SECRET_KEY` (ký JWT HS256) | `backend/app/core/config.py` | 11 | **CỰC CAO** — bất kỳ ai đọc source đều tự cấp được JWT với role bất kỳ |
| 2 | `AQ.Ab8RN6L5V2Iw5Vkg8Q1t_UHUt9pwIQLYnvzjMFl-rrmhWW3pGg` | `GEMINI_API_KEY` | `backend/app/core/config.py` | 24 | CAO — key Google AI thật (prefix `AQ.` thuộc dạng token Google Cloud ADC) |
| 3 | `https://xwlfhynthgnmspuabzus.supabase.co` | `SUPABASE_URL` | `backend/app/api/v1/endpoints/auth.py` | 34 | THẤP — URL project Supabase (thông tin công khai) |
| 4 | `eyJhbG...Q28ww2oX18mY-53C4G7bPh-QGTrjylrL8T4V7XaWLjk` (anon key) | `SUPABASE_ANON_KEY` (JWT) | `backend/app/api/v1/endpoints/auth.py` | 39–41 | CAO — anon key của Supabase; theo Supabase convention anon key dùng được cho browser nhưng có thể bypass RLS trên public schema |
| 5 | `eyJhbG...Q28ww2oX18mY-53C4G7bPh-QGTrjylrL8T4V7XaWLjk` (cùng anon key) | `SUPABASE_ANON_KEY` lặp lại | `frontend/src/services/supabase.js` | 3 | CAO — cùng key nhưng xuất hiện ở frontend đã **chắc chắn ship ra browser** (anon key có thể là public theo Supabase convention, nhưng key này có `role: "anon"` nên cần review lại) |

**Phát hiện phụ (không phải secret nhưng rủi ro):**

| # | Nội dung | File | Dòng | Mức độ | Ghi chú |
|---|---|---|---|---|---|
| A | Hard-code `DEVELOPER = { name, email, phone }` | `frontend/src/pages/Login.jsx` | 56–60 | THẤP | Lộ thông tin cá nhân của tác giả vào code FE |
| B | Default email/password `admin@warranty.vn` / `Admin@123` prefill | `frontend/src/pages/Login.jsx` | 181–182 | TRUNG BÌNH | Tăng nguy cơ dev/staging bị lộ vào prod — prefill credentials giúp attacker 1-click đăng nhập nếu user không xóa |
| C | Default `admin@warranty.vn` / `Admin@123` trong seed | `backend/seed_data.py` | 39–40 | TRUNG BÌNH | OK cho dev; **bắt buộc** xóa/đổi khi build prod image |

**Hành động bắt buộc trước khi fix S2:**
1. Coi tất cả 5 secret là **đã lộ** (theo khuyến nghị OWASP — xóa khỏi source không làm credential cũ mất hiệu lực).
2. User thu hồi + tạo mới ở Google AI Studio (GEMINI) và Supabase Dashboard (anon key).
3. Sau khi user cấp secret mới (qua kênh ngoài chat), tôi sẽ sửa code theo thứ tự: `config.py` (raise lỗi nếu thiếu secret) → `auth.py` (đọc env) → `supabase.js` (đọc `import.meta.env.VITE_SUPABASE_*`) → thêm `.env` vào `.gitignore`.
4. Sau khi sửa code, chạy `git log -p --all -- .env backend/app/core/config.py frontend/src/services/supabase.js` để xác nhận không còn key cũ trong lịch sử.

**Không làm ngay bây giờ:** xóa default secret, vì nếu xóa trước khi user cấp secret mới thì toàn bộ backend không chạy được.

---

## 8. Phụ lục — Số liệu tổng hợp

| Hạng mục | Số lượng |
|---|---|
| Endpoint HTTP tổng cộng | 36 |
| Endpoint yêu cầu đăng nhập | 26 |
| Endpoint chỉ cho admin | 6 (finance/* + customers POST + products DELETE + register có vấn đề) |
| Endpoint object-level check | 2 (GET ticket, POST ticket) |
| Endpoint cần fix object-level | 10 |
| Model SQLAlchemy | 8 |
| Service module | 4 (`warranty_service`, `wallet_service`, `ai_service`, `notification_service`, `finance_service`) |
| Frontend pages | 11 (đã đọc 6) |
| Test case hiện có | 13 |
| Test case cần thêm (IDOR, RBAC, upload, rate-limit) | ≥ 8 |
| Bug nghiêm trọng (S*) | 5 (S1–S5) |
| Bug trung bình (M*) | 10 |
| Bug thấp (L*) | 5 |
| Secret bị hard-code trong source (chưa tính vào S/M/L) | 5 (xem §7a) |
| File frontend dùng ngôn ngữ ngoài lề (không liên quan) | 0 (đã bỏ qua `xây dựng giao diện.md`) |

### §7d — Báo cáo verify runtime pytest (2026-10-03 08:08)

**Phạm vi:** `pytest backend/tests -q` (chạy từ thư mục `backend/` với venv đã cài `requirements.txt`).

**Kết quả cuối:** 60 passed, 0 failed.

| Nhóm test | Số lượng | Kết quả |
|---|---|---|
| S1 — `test_register_escalation.py` | 9 | 9/9 pass ✅ |
| S3 — `test_login_lockout.py` | 5 | 5/5 pass ✅ |
| S1 cleanup — `test_cleanup_legacy.py` | 4 | 4/4 pass ✅ |
| S4 — `test_supabase_jwt.py` | 12 | 12/12 pass ✅ |
| S5 — `test_ticket_object_level.py` | 9 | 9/9 pass ✅ |
| **S5c — `test_product_object_level.py`** (mới 2026-10-03) | 7 | 7/7 pass ✅ |
| Test cũ — `test_warranty.py` | 13 | 13/13 pass ✅ (đã fix bug AI REJECTED) |
| **Tổng** | **60** | **60/60 pass** |

**Bug AI REJECTED đã fix (2026-10-03 08:08):**
- File: `backend/app/services/ai_service.py:47` (function `progress_message_mock`)
- Trước: `"Phiếu {ticket_code} không được bảo hành theo chính sách..."`
- Sau: `"Phiếu {ticket_code} bị từ chối bảo hành theo chính sách..."`
- Test `tests/test_warranty.py::test_progress_message_for_statuses` (assert "từ chối"): **pass**.

**Cleanup script thực thi:**
- `python -m scripts.cleanup_legacy_admin_users` (dry-run): "Tìm thấy 0 user role≠customer không từ seed — DB sạch."
- `python -m scripts.cleanup_legacy_admin_users --yes`: Không xóa gì (DB sạch).
- Đã viết 4 test case cho logic cleanup trong `/tests/test_cleanup_legacy.py`.

**Lệnh build/verify:**
```bash
# Tạo venv
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt

# Verify runtime (60/60 pass)
cd backend
$env:SECRET_KEY = "test_secret_for_pytest_only"
$env:SUPABASE_URL = "https://testproject.supabase.co"
$env:SUPABASE_ANON_KEY = "test_anon_key"
..\.venv\Scripts\python.exe -m pytest tests -q
```

---

**Đồng thuận:** Bug backlog này được soạn dựa trên code đã đọc tại thời điểm khảo sát. Khi fix S1–S5 xong, cần cập nhật phần "Hiện trạng" và "Đã thay đổi" của file này.
