# SECURITY ROADMAP — Lộ trình bảo mật BảoHành Pro

> **Phiên bản:** v1.0
> **Ngày:** 2026-10-03
> **Quyết định kiến trúc (chủ dự án xác nhận):** Single-tenant trước, sẵn sàng mở rộng SaaS.
> **Liên kết:** `docs/SECURITY_AUDIT.md` (phát hiện), `docs/OPEN_QUESTIONS.md` (câu hỏi), `docs/USER_STORIES.md` (đặc tả).

---

## 1. Nguyên tắc chỉ đạo

1. **Single-tenant hiện tại, không over-engineer multi-tenant.** Không thêm `organization_id` hàng loạt. Không tạo `org_wallets`. Ví tiếp tục toàn cục theo `user_id`.
2. **Code có cấu trúc để mở rộng sau, không xây trước.** Gom authorization và truy vấn tài nguyên vào dependency/service dùng chung.
3. **Server là nguồn sự thật duy nhất** cho role, amount, owner ID, status. Không tin client.
4. **Database constraints bảo vệ bất biến tài chính**; transaction atomic cho mọi thay đổi tiền.
5. **SQLite chỉ dành cho dev/test.** Trước khi production có nhiều user đồng thời hoặc tiền thật → chuyển PostgreSQL (vì `with_for_update()` không thực sự khóa hàng trên SQLite).
6. **3 quy tắc cứng** (từ chủ dự án):
   - Không hardcode giả định về một admin duy nhất (có thể nhiều admin cùng quản trị).
   - Không dùng `user_id` thay `customer_id`. Một khách hàng nghiệp vụ không nhất thiết phải có tài khoản đăng nhập.
   - Không để frontend quyết định quyền. Backend phải xác minh user + role + ownership + quyền tài nguyên trong mọi request.

---

## 2. Lộ trình 3 giai đoạn

### Giai đoạn 1 — P0 · Bảo vệ hệ thống hiện tại

**Mục tiêu:** Không còn lỗ hổng nghiêm trọng. Test quyền truy cập chạy thành công trong môi trường cô lập.

| # | Hạng mục | Bằng chứng audit | Phạm vi sửa |
|---|---|---|---|
| 1.1 | Test role escalation US-01 | `auth.py:80-92` đã có S1 fix | Viết test xác minh `POST /auth/register` không nhận `role` từ client; `POST /auth/users` yêu cầu admin |
| 1.2 | Test ownership + IDOR | `tickets.py:96-99, 109-112, 148-154, 192-195` | Test customer A không đọc/sửa/trả phiếu customer B; technician chỉ sửa phiếu của mình |
| 1.3 | Test tài khoản bị vô hiệu hóa | `permissions.py:26-28` | Test user `is_active=False` → mọi protected endpoint trả 403 |
| 1.4 | Chặn top-up tự khai amount ở production | `wallet.py:25-34` | Thêm env flag: dev cho phép sandbox, production yêu cầu `payment_provider_ref` |
| 1.5 | Audit cấu hình | `config.py`, `.env` | Kiểm tra `SECRET_KEY` không default, CORS whitelist, file upload dir, endpoint công khai `/tickets/public/{code}` |
| 1.6 | Không triển khai multi-tenant migration | (theo chủ dự án) | Không thêm `organization_id` ở giai đoạn này |

**Điều kiện hoàn tất (Definition of Done):**
- [ ] Test P0 chạy pass trong DB cô lập, output có lệnh chạy thực tế + số test pass/fail.
- [ ] Không còn phát hiện `P0` nào ở trạng thái OPEN trong `SECURITY_AUDIT.md`.
- [ ] `.env.example` có đầy đủ key bắt buộc, không có secret thật.

---

### Giai đoạn 2 — P1 · Toàn vẹn dữ liệu và giao dịch

**Mục tiêu:** Không có giao dịch trùng khi retry cùng idempotency key. Cập nhật đồng thời không âm thầm ghi đè.

| # | Hạng mục | Bằng chứng audit | Phạm vi sửa |
|---|---|---|---|
| 2.1 | Idempotency key cho payment | `wallet_service.py` thiếu; `models/wallet.py:19-26` không có cột | Thêm `idempotency_key VARCHAR UNIQUE` trên `transactions`; `wallet_service.topup/pay` chấp nhận key, reject duplicate |
| 2.2 | Optimistic locking status | `models/warranty.py` không có `version` | Thêm `version INT DEFAULT 0` trên `warranty_tickets`; `update_status` dùng `WHERE version = ?`, raise lỗi nếu stale |
| 2.3 | Audit log repair_cost | `update_status` ghi đè không log | Lưu `old_repair_cost`, `new_repair_cost` vào `warranty_history` hoặc bảng audit riêng |
| 2.4 | Token/session invalidation | `security.py:21-30` không có deny list | Thêm `token_version INT` trên `users`; `decode_token` so sánh với `user.token_version`, raise 401 nếu lệch |
| 2.5 | Policy khi đổi MK / khóa TK / logout | chưa có | Endpoint đổi MK → tăng `token_version`; khóa TK → `is_active=False`; logout client-side + optional server-side |
| 2.6 | Test thanh toán đồng thời, retry, rollback | mới | Test 2 request pay đồng thời với cùng `idempotency_key` → chỉ 1 transaction; test rollback khi exception giữa chừng |
| 2.7 | Migration discipline | chưa kiểm tra | Mọi migration mới có backup trước, đối soát sau, rollback được viết sẵn |

**Điều kiện hoàn tất:**
- [ ] Test idempotency chạy pass: gửi 5 lần cùng key → chỉ 1 transaction `SUCCESS`, 4 lần trả về transaction cũ.
- [ ] Test optimistic locking: 2 admin đổi status cùng lúc → một bên nhận lỗi stale, một bên commit.
- [ ] Audit log cho `repair_cost`, assignment, status change đầy đủ.

---

### Giai đoạn 3 — P2 · Ổn định vận hành và hiệu năng

**Mục tiêu:** Có số liệu p50/p95, báo cáo test hồi quy, hướng dẫn triển khai/khôi phục.

| # | Hạng mục | Bằng chứng audit | Phạm vi sửa |
|---|---|---|---|
| 3.1 | Benchmark serial + dashboard | chưa đo | Script benchmark với 1k/10k/100k records, ghi p50/p95/p99, kèm cấu hình máy |
| 3.2 | Rate limit login + public lookup | `auth.py` có theo email; `/tickets/public/{code}` chưa có | Thêm slowapi/redis cho login (IP + email), public lookup (IP) |
| 3.3 | Audit log AI / PII | chưa đọc `ai_service.py` | Kiểm tra log không chứa email/SĐT/CCCD; cache theo user_id; xóa cache cũ |
| 3.4 | Upload + storage policy | `auth.py:155-191` | Kiểm tra MIME, kích thước, nơi lưu; cân nhắc storage ngoài (S3) cho production |
| 3.5 | Chuẩn hóa API errors | `main.py:30-39` đã có envelope | Đảm bảo mọi HTTPException dùng envelope nhất quán; pagination cursor ổn định |
| 3.6 | Index theo truy vấn thực tế | `serial_number`, `ticket_code` đã index | Thêm index cho các filter phổ biến: `status`, `customer_id`, `created_at` |

**Điều kiện hoàn tất:**
- [ ] File `BENCHMARK.md` có số liệu thực tế với 3 mức data, 3 percentile.
- [ ] Rate limit test: 10 lần login sai trong 1 phút → 423.
- [ ] Hướng dẫn deploy/rollback có script và checklist.

---

## 3. Quyết định nghiệp vụ cập nhật sau audit + lộ trình

| Câu hỏi | Trạng thái | Căn cứ |
|---|---|---|
| CẦN XÁC NHẬN 1 — Quy tắc hạn bảo hành | **APPROVED · HOLD** | Giữ logic hiện tại `manufacture_date + warranty_months` cho đến khi nghiệp vụ thay đổi. Không sửa code ở giai đoạn này. |
| CẦN XÁC NHẬN 2 — Phạm vi unique `serial_number` | **APPROVED · SINGLE-TENANT** | Single-tenant → unique toàn hệ thống (giữ nguyên). Khi chuyển SaaS → mở lại câu hỏi. |
| CẦN XÁC NHẬN 3 — Endpoint `/technicians` | **APPROVED · HOLD** | Giữ `/customers/technicians`; alias `/technicians` là nice-to-have, không P0. |
| CẦN XÁC NHẬN 4 — Hiệu năng | **APPROVED · DEFERRED** | Đã chuyển vào Giai đoạn 3. SLA chỉ chốt sau benchmark. |
| CẦN XÁC NHẬN 5 — `super-admin` toàn nền tảng | **APPROVED · NONE** | Không cần. Chỉ có `admin` org-scope. Khi cần SaaS → tạo role `super_admin` riêng với audit bắt buộc. |

Xem chi tiết: `docs/OPEN_QUESTIONS.md`.

---

## 4. Nguyên tắc thiết kế để mở rộng multi-tenant về sau (không code bây giờ)

| Thành phần | Làm ngay | Chưa cần làm |
|---|---|---|
| `users` | Tách danh tính đăng nhập và role rõ ràng | Hệ thống membership nhiều tổ chức |
| `customers` | Bảng khách hàng nghiệp vụ độc lập với tài khoản đăng nhập | Gộp khách hàng vào `users` |
| `products` | Unique constraint serial theo quy tắc hiện tại; kiểm tra dữ liệu trước khi đổi | Đổi sang unique theo tenant khi chưa có tenant |
| `warranty_tickets` | Ràng buộc liên kết khách hàng, sản phẩm; lịch sử trạng thái và audit | Bổ sung `organization_id` chỉ để dự phòng |
| `wallets`, `transactions` | Wallet toàn cục theo `user_id`; chống giao dịch lặp | Chuyển thành `org_wallets` |
| AI + cache | Tách quyền truy cập theo user/tài nguyên, tránh trộn dữ liệu và PII trong log | Hạ tầng AI riêng cho từng tổ chức |
| API + service | Gom kiểm tra quyền và phạm vi vào dependency/service dùng chung | Viết hệ thống tenant hoàn chỉnh khi chưa cần |

---

## 5. Tiêu chí chuyển sang SaaS đa tổ chức (kích hoạt khi có nhu cầu thật)

Phải có **đủ 4 điều kiện** trước khi bắt đầu multi-tenant:

1. **Mô hình rõ ràng:** Tổ chức, thành viên, quyền quản trị được đặc tả và phê duyệt.
2. **Mapping dữ liệu cũ:** Xác định được bản ghi hiện tại thuộc tổ chức nào.
3. **Migration + đối soát + rollback:** Có kế hoạch đã thử nghiệm trên dữ liệu thật (hoặc clone).
4. **Test chứng minh isolation:** Không truy cập chéo tổ chức qua API, DB, AI, file, báo cáo.

**Dấu hiệu cần chuyển:**
- Nhiều doanh nghiệp đăng ký dùng thử.
- Cần quản trị thành viên riêng theo tổ chức.
- Khách hàng yêu cầu dữ liệu và báo cáo tách biệt theo tenant.
- Cần thanh toán / billing theo tổ chức.

**Dấu hiệu KHÔNG cần chuyển:**
- Chỉ có 1 doanh nghiệp dùng.
- Admin hiện tại đủ quản lý nhiều chi nhánh.
- Không có yêu cầu pháp lý / bảo mật tách dữ liệu.

---

## 6. Quy tắc vận hành trong giai đoạn single-tenant

1. **Mọi PR/code change** phải kèm test cho behavior bảo mật liên quan.
2. **Mọi migration** có backup trước, đối soát sau, rollback viết sẵn.
3. **Không commit secret thật** vào repo (`.env` đã có trong `.gitignore`).
4. **Không chạy** `seed_data.py` hoặc `alembic upgrade head` trên dữ liệu thật mà không backup `warranty.db` → `warranty.db.bak`.
5. **Không tuyên bố production-ready** khi còn lỗi P0 chưa xử lý.
6. **Mọi quyết định nghiệp vụ** còn `OPEN` → không tự ý chuyển sang `APPROVED` khi chưa có xác nhận chủ dự án.

---

## 7. Tiến độ (Status)

| Giai đoạn | Trạng thái | Ghi chú |
|---|---|---|
| Audit code (đọc) | ✅ DONE | `SECURITY_AUDIT.md` |
| Chốt lộ trình | ✅ DONE | `SECURITY_ROADMAP.md` |
| **Giai đoạn A — Xác minh** | ✅ DONE | 60/60 test PASSED. Xác minh 4/6 P0 đã xử lý; 2 còn lại (topup self-claim, thiếu `.env.example`) đã đưa vào giai đoạn 1. Chi tiết: `SECURITY_AUDIT.md` §13-14. |
| Giai đoạn 1 (P0) | ✅ DONE | 1) Tạo `backend/.env.example` (12 env, không có secret). 2) Thêm `ALLOW_SANDBOX_TOPUP` vào `config.py`. 3) Thêm `payment_provider_ref` vào `TopupRequest`. 4) Chặn topup ở production khi không có ref. 5) Test mới `test_wallet_topup_security.py` (7 test) PASSED. 6) Regression 67/67 PASSED. 7) Backup `warranty.db.bak.20261003_093733`. |
| Giai đoạn 2 (P1) | ⏸️ PENDING | Idempotency key, optimistic locking, repair cost history, token_version |
| Giai đoạn 3 (P2) | ⏸️ PENDING | Benchmark, rate limit IP, AI log audit |
