# OPEN QUESTIONS — Các quyết định nghiệp vụ và kỹ thuật chưa được xác nhận

> **Trạng thái tổng thể (2026-10-03):** 4/5 câu đã được chốt sau audit + quyết định single-tenant. Xem bảng cập nhật ở §0 dưới đây.
> **Nguyên tắc:** Không tự suy diễn hoặc đánh dấu các quyết định là đã được phê duyệt khi chưa có xác nhận của chủ dự án.
> **Liên kết:** Mỗi mục dưới đây tham chiếu tới User Story tương ứng trong `docs/USER_STORIES.md` và `docs/SECURITY_ROADMAP.md`.

---

## §0 · Cập nhật trạng thái (2026-10-03)

Căn cứ: `docs/SECURITY_AUDIT.md` v1.0 + quyết định kiến trúc single-tenant của chủ dự án (`SECURITY_ROADMAP.md` mục 1).

| # | Câu hỏi | Trạng thái cũ | Trạng thái mới | Lý do |
|---|---|---|---|---|
| 1 | CẦN XÁC NHẬN 5 — `super-admin` | OPEN | **APPROVED · NONE** | Không cần. Chỉ có `admin` org-scope. Khi cần SaaS → tạo role `super_admin` riêng với audit bắt buộc. |
| 2 | CẦN XÁC NHẬN 2 — Phạm vi `serial_number` | OPEN | **APPROVED · SINGLE-TENANT** | Single-tenant → unique toàn hệ thống (giữ nguyên constraint). Mở lại khi chuyển SaaS. |
| 3 | CẦN XÁC NHẬN 1 — Quy tắc hạn bảo hành | OPEN | **APPROVED · HOLD** | Giữ logic hiện tại `manufacture_date + warranty_months`. Không sửa code ở giai đoạn này. Mở lại khi nghiệp vụ thay đổi. |
| 4 | CẦN XÁC NHẬN 3 — Endpoint `/technicians` | OPEN | **APPROVED · HOLD** | Giữ `/customers/technicians`; alias `/technicians` là nice-to-have, không P0. |
| 5 | CẦN XÁC NHẬN 4 — Hiệu năng | OPEN | **APPROVED · DEFERRED** | Đã chuyển vào Giai đoạn 3 của SECURITY_ROADMAP. SLA chỉ chốt sau benchmark. |

**Trạng thái phái sinh:**
- `APPROVED · NONE`: đã quyết, không phát sinh việc.
- `APPROVED · SINGLE-TENANT` / `APPROVED · HOLD`: đã quyết cho hiện tại, có thể mở lại khi chuyển SaaS hoặc khi nghiệp vụ đổi.
- `APPROVED · DEFERRED`: đã quyết hướng xử lý, chuyển vào giai đoạn khác của roadmap.

---

## Quy tắc xử lý các câu hỏi đang mở

1. Mọi câu hỏi phải có người chịu trách nhiệm xác nhận và trạng thái rõ ràng.
2. Phân biệt `OPEN`, `IN REVIEW`, `APPROVED` và `REJECTED`.
3. Không triển khai thay đổi nghiệp vụ hoặc quyền truy cập có rủi ro cao dựa trên giả định chưa được duyệt.
4. Có thể tiếp tục các công việc độc lập, như audit code, lập test, benchmark và phân tích dữ liệu.
5. Khi quyết định được xác nhận, cập nhật đặc tả, API contract, schema, migration plan và test cases liên quan.
6. Mọi quyết định đã duyệt cần ghi lại người xác nhận, ngày xác nhận và lý do lựa chọn.

---

## Thứ tự ưu tiên xử lý

| # | Câu hỏi | Phụ thuộc trước khi giải quyết |
|---|---|---|
| 1 | CẦN XÁC NHẬN 5 — `super-admin` | Thiết kế phân quyền đa tổ chức |
| 2 | CẦN XÁC NHẬN 2 — Phạm vi `serial_number` | Tạo unique constraint và migration |
| 3 | CẦN XÁC NHẬN 1 — Quy tắc hạn bảo hành | Thay đổi công thức tính hạn |
| 4 | CẦN XÁC NHẬN 3 — Endpoint kỹ thuật viên | Kiểm tra frontend/backend rồi mới chuẩn hóa API |
| 5 | CẦN XÁC NHẬN 4 — Mục tiêu hiệu năng | Thu thập số liệu benchmark rồi mới cam kết SLA |

---

## CẦN XÁC NHẬN 1 — Quy tắc tính hạn bảo hành

- **Liên quan:** US-02, US-03, US-13.
- **Câu hỏi:** Thời hạn bảo hành bắt đầu từ `manufacture_date`, `sell_date` hay `activation_date`?
- **Tác động:** Công thức tính hạn bảo hành, trạng thái còn hạn/hết hạn, dữ liệu sản phẩm và chính sách bảo hành.
- **Trong thời gian chờ:** Giữ nguyên hành vi hiện tại; không tự ý thay đổi công thức.
- **Điều kiện đóng:** Chủ dự án xác nhận quy tắc và các trường hợp ngày bắt đầu bị thiếu.
- **Trạng thái:** APPROVED · HOLD (2026-10-03) — Giữ logic hiện tại; không sửa code ở giai đoạn single-tenant. Mở lại khi có yêu cầu nghiệp vụ mới.

---

## CẦN XÁC NHẬN 2 — Phạm vi duy nhất của `serial_number`

- **Liên quan:** US-02.
- **Câu hỏi:** `serial_number` phải duy nhất trên toàn hệ thống hay chỉ trong một tổ chức?
- **Phương án cần đánh giá:** Duy nhất toàn hệ thống hoặc duy nhất trong từng `organization_id`.
- **Tác động:** Unique constraint/index, API tạo sản phẩm, tra cứu serial, nhập dữ liệu cũ và cách ly dữ liệu đa tổ chức.
- **Trong thời gian chờ:** Kiểm tra dữ liệu hiện có, phát hiện serial trùng và lập kế hoạch migration; chưa áp dụng ràng buộc cuối cùng khi chưa xác nhận.
- **Điều kiện đóng:** Chủ dự án xác nhận phạm vi duy nhất và phương án xử lý dữ liệu trùng.
- **Trạng thái:** APPROVED · SINGLE-TENANT (2026-10-03) — Giữ unique toàn hệ thống (constraint hiện tại). Mở lại khi chuyển sang SaaS đa tổ chức.

---

## CẦN XÁC NHẬN 3 — Chuẩn hóa endpoint kỹ thuật viên

- **Liên quan:** US-04 và frontend.
- **Hiện trạng:** `GET /api/v1/customers/technicians`.
- **Phương án đề xuất:** `GET /api/v1/technicians`.
- **Tác động:** Backend route, frontend API client, quyền truy cập và tài liệu API.
- **Trong thời gian chờ:** Kiểm tra endpoint hiện được sử dụng ở đâu và liệu API đã được phát hành hay chưa. Không xóa route cũ nếu chưa đánh giá tương thích.
- **Điều kiện đóng:** Xác nhận endpoint chuẩn và kế hoạch tương thích/ngừng hỗ trợ route cũ nếu cần.
- **Trạng thái:** APPROVED · HOLD (2026-10-03) — Giữ `/customers/technicians`. Alias `/technicians` là nice-to-have, không P0; xem xét khi có refactor API tổng thể.

---

## CẦN XÁC NHẬN 4 — Mục tiêu hiệu năng

- **Liên quan:** US-02 và US-10.
- **Mục tiêu dự kiến:** Tra cứu serial dưới 100 ms; dashboard dưới 500 ms với quy mô dưới 10.000 phiếu.
- **Câu hỏi:** Các ngưỡng này đo ở percentile nào, trong điều kiện tải nào và tính cả thời gian mạng hay chỉ thời gian xử lý phía server/database?
- **Trong thời gian chờ:** Xây dựng benchmark, ghi nhận p50/p95/p99, kích thước dữ liệu, concurrency, cache và môi trường kiểm thử.
- **Điều kiện đóng:** Chủ dự án xác nhận SLA sau khi xem kết quả benchmark trên dữ liệu đại diện.
- **Trạng thái:** APPROVED · DEFERRED (2026-10-03) — Chuyển vào Giai đoạn 3 (`SECURITY_ROADMAP.md`). SLA chỉ chốt sau khi có số liệu p50/p95/p99 thực tế.

---

## CẦN XÁC NHẬN 5 — Vai trò `super-admin` toàn nền tảng

- **Liên quan:** US-01 và US-12.
- **Câu hỏi:** Hệ thống có cần tài khoản quản trị toàn nền tảng, có quyền quản lý nhiều tổ chức, hay chỉ có `org-admin` quản trị trong phạm vi tổ chức?
- **Tác động:** Mô hình vai trò, API quản trị, phân quyền cơ sở dữ liệu, audit log và quy trình hỗ trợ vận hành.
- **Trong thời gian chờ:** Không tự tạo quyền truy cập xuyên tổ chức. Mặc định mọi quyền quản trị phải giới hạn theo tổ chức và được kiểm tra phía server.
- **Điều kiện đóng:** Chủ dự án xác nhận nhu cầu, phạm vi quyền, cơ chế cấp quyền và audit cho `super-admin` nếu có.
- **Trạng thái:** APPROVED · NONE (2026-10-03) — Không tạo `super-admin` ở giai đoạn single-tenant. Khi chuyển SaaS, tạo role `super_admin` riêng với audit bắt buộc.
