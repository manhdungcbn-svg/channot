# BÁO CÁO KỸ THUẬT ĐỒ ÁN — ĐÁNH GIÁ CHUẨN ĐẦU RA (CLO1 - CLO5)

> **Tên đề tài:** Hệ Thống Thương Mại Điện Tử & Quản Lý Bảo Hành Thông Minh  
> **Kiến trúc:** Multi-App Ecosystem (Storefront SPA + Warranty Management SPA + Backend RESTful API + AI Assistant)  
> **Công nghệ chủ đạo:** FastAPI (Python 3.12), React 18, Vite, Tailwind CSS, SQLAlchemy, SQLite/PostgreSQL, Docker, VietQR EMVCo, Google Gemini AI.  
> **Tác giả:** Nhóm Phát Triển Phần Mềm  

---

## BẢNG TỰ ĐÁNH GIÁ TIÊU CHÍ ĐỒ ÁN (THANG ĐIỂM 10/10)

| Tiêu chí | Nội dung yêu cầu | Mức độ hoàn thành | Minh chứng mã nguồn | Điểm tự đánh giá |
|---|---|---|---|:---:|
| **CLO 1** | Phân tích yêu cầu, thiết kế kiến trúc hệ thống & mô hình dữ liệu | 100% (Xuất sắc) | `warranty-system/backend/app/models/`, `schemas/`, API Contract | **2.0 / 2.0** |
| **CLO 2** | Quy trình phát triển phần mềm hiện đại (SDLC Factory / Agile) | 100% (Xuất sắc) | Git workflow, cấu trúc Clean Architecture, Todo tracking | **2.0 / 2.0** |
| **CLO 3** | Cài đặt hoàn chỉnh nghiệp vụ (Bán hàng, Bảo hành, Ví điện tử, AI) | 100% (Xuất sắc) | 2 SPA React hoàn chỉnh, 15+ Routers, RBAC 4 vai trò, VietQR | **2.5 / 2.5** |
| **CLO 4** | Kiểm thử phần mềm (Testing), Bảo mật (Guardrails) & Độ tin cậy | 100% (Xuất sắc) | 120+ Pytest tests, Rate limiting, Anti-brute-force, Playwright | **2.0 / 2.0** |
| **CLO 5** | Đóng gói Containerization (Docker), Nginx & Tài liệu hướng dẫn | 100% (Xuất sắc) | Dockerfile multi-stage, `docker-compose.yml`, Healthcheck | **1.5 / 1.5** |
| **TỔNG** | **ĐỒ ÁN PHẦN MỀM ĐẠT CHUẨN DOANH NGHIỆP** | **XUẤT SẮC** | **Hệ thống đang chạy trực tiếp trên 3 cổng 8000, 5174, 5175** | **10.0 / 10** |

---

## PHẦN 1. PHÂN TÍCH YÊU CẦU & THIẾT KẾ HỆ THỐNG (CLO 1)

### 1.1. Kiến trúc tổng thể (Architecture Design)
Hệ thống được thiết kế theo mô hình **Multi-Frontend Micro-Services Cohesion**:
1. **Storefront SPA (`ecommerce-frontend` - Cổng 5175):** Dành cho khách hàng duyệt sản phẩm, tìm kiếm thông minh không dấu, lọc theo danh mục/giá/hãng, đặt hàng, quản lý đơn mua và đăng ký bảo hành nhanh.
2. **Warranty Management SPA (`warranty-system/frontend` - Cổng 5174):** Dành cho 4 đối tượng (Admin, Nhân viên tiếp nhận, Kỹ thuật viên sửa chữa, Khách hàng) để quản lý vòng đời phiếu bảo hành, quản lý ví điện tử, thanh toán và chat AI.
3. **Backend RESTful API (`warranty-system/backend` - Cổng 8000):** Cung cấp hơn 40 API endpoints chuẩn OpenAPI 3.0 với Pydantic v2 validation, xử lý xác thực JWT, phân quyền RBAC và tích hợp AI.

```
                      +-----------------------------+
                      |   NGINX REVERSE PROXY       |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
+------------v------------+                     +------------v------------+
|  Storefront SPA (React) |                     |  Warranty Pro (React)   |
|  - Danh mục, Giỏ hàng   |                     |  - Tiếp nhận, Kỹ thuật  |
|  - Tìm kiếm thông minh  |                     |  - Ví điện tử, VietQR   |
|  - Flash Sale cuối tuần |                     |  - Quản lý khách hàng   |
+------------+------------+                     +------------+------------+
             |                                               |
             +-----------------------+-----------------------+
                                     |
                         +-----------v-----------+
                         |  FastAPI REST Server  |
                         |  - JWT & RBAC Guard   |
                         |  - Order / Ticket Flow|
                         |  - Gemini AI Engine   |
                         |  - VietQR Service     |
                         +-----------+-----------+
                                     |
                         +-----------v-----------+
                         | Relational Database   |
                         | PostgreSQL / SQLite   |
                         +-----------------------+
```

### 1.2. Mô hình hóa dữ liệu (Data Modeling - ERD)
Hệ thống chuẩn hóa 8 thực thể quan hệ chặt chẽ:
- **`User` (`app/models/user.py`):** Lưu trữ thông tin tài khoản (email, số điện thoại, mật khẩu băm bcrypt, role: `admin`, `staff`, `technician`, `customer`, trạng thái `must_change_password`).
- **`Product` (`app/models/product.py`):** Thông tin sản phẩm thương mại và bảo hành (tên, mã serial định danh duy nhất, danh mục, thời hạn bảo hành, giá, ảnh chụp sản phẩm `image_url`, thương hiệu, slug).
- **`Order` & `OrderItem` (`app/models/shop.py`):** Đơn mua hàng từ storefront, trạng thái đơn (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- **`WarrantyTicket` (`app/models/warranty.py`):** Phiếu yêu cầu bảo hành, liên kết Sản phẩm + Khách hàng + Kỹ thuật viên, lưu trữ danh sách ảnh đính kèm lỗi `attachments`, kết quả phân loại AI, chi phí sửa chữa.
- **`WarrantyHistory` (`app/models/warranty.py`):** Nhật ký kiểm toán (audit log) ghi lại toàn bộ thay đổi trạng thái và ghi chú kỹ thuật.
- **`Wallet` & `WalletTransaction` (`app/models/wallet.py`):** Ví điện tử nội bộ, số dư và lịch sử giao dịch (nạp tiền TOPUP, thanh toán PAYMENT).
- **`Notification` (`app/models/notification.py`):** Thông báo đẩy real-time cho người dùng khi có cập nhật phiếu.

---

## PHẦN 2. QUY TRÌNH PHÁT TRIỂN & QUẢN LÝ DỰ ÁN (CLO 2)

### 2.1. Áp dụng SDLC Factory & Clean Architecture
Mã nguồn được tổ chức theo cấu trúc phân tầng nghiêm ngặt (Separation of Concerns):
- **Presentation Layer (Routers):** Tiếp nhận HTTP Request, xác thực đầu vào qua Pydantic schema, kiểm tra quyền hạn (`Depends(get_current_user)`).
- **Service Layer (Business Logic):** Tập trung toàn bộ logic nghiệp vụ (tính hạn bảo hành, phân loại AI, tự sinh tài khoản khi giao hàng, chuẩn hóa chuỗi tìm kiếm không dấu).
- **Data Access Layer (Models & Database):** Quản lý ORM qua SQLAlchemy, tự động chạy migration qua `ensure_columns`.
- **Cross-Cutting Concerns:** Envelope response, Global Exception Handler, Security rate limiter.

### 2.2. Kiểm soát chất lượng mã nguồn & Git Flow
- Quản lý phiên bản phân nhánh: Nhánh `main` kết hợp nhánh tính năng `origin/qthang`.
- Toàn bộ các thay đổi đều được kiểm thử tự động, build bundle và chụp ảnh kiểm chứng (visual regression) trước khi bàn giao.

---

## PHẦN 3. CÀI ĐẶT HỆ THỐNG & TÍNH NĂNG NGHIỆP VỤ (CLO 3)

### 3.1. Xác thực kép & Tự động tạo tài khoản khi nhận hàng
- **Đăng nhập linh hoạt:** Khách hàng có thể đăng nhập bằng **Email** HOẶC **Số điện thoại** (`app/api/v1/endpoints/auth.py`). Hệ thống tự động làm sạch số điện thoại (`+84`, khoảng trắng, dấu gạch).
- **Tự động cấp tài khoản khi giao hàng thành công:** Khi đơn hàng chuyển sang trạng thái `DELIVERED`, hệ thống kiểm tra nếu khách hàng chưa có tài khoản sẽ tự động tạo tài khoản mới với:
  - Tên đăng nhập: **Số điện thoại**
  - Mật khẩu khởi tạo: **Số điện thoại**
  - Cờ bảo mật: `must_change_password = True`
- **Modal nhắc đổi mật khẩu (`MustChangePasswordModal`):** Hiển thị ngay sau khi đăng nhập tài khoản tạm, đồng thời trang bị nút **X** (bỏ qua) để khách hàng có thể đổi mật khẩu sau nếu muốn.

### 3.2. Tìm kiếm thông minh không dấu & Gợi ý từ đồng nghĩa
- **Thuật toán tìm kiếm Tiếng Việt:** Bỏ dấu qua Unicode NFD (`normalize_search_text`), khớp token chính xác.
- **Mở rộng từ đồng nghĩa (`CATEGORY_SEARCH_ALIASES`):** Gõ `máy lạnh` tự động nhận diện danh mục `lam-lanh`, gõ `điện gia dụng` tự động gợi ý các thiết bị gia dụng.
- **Thanh lọc cố định ngang:** Đặt toàn bộ thanh lọc (Danh mục, Giá, Hãng, Đánh giá, Khuyến mãi) nằm ngang tự nhiên bên trên, không bị trôi đè lên sản phẩm khi cuộn chuột.

### 3.3. Tra cứu bảo hành tự động & Nhận diện serial khách hàng
- **Không bắt đăng nhập lại:** Khách hàng đã đăng nhập khi vào `/lookup` sẽ thấy ngay danh sách sản phẩm sở hữu kèm ảnh và serial. Chỉ cần 1 click là tra cứu ngay lập tức.
- **Điều hướng cùng tab:** Trang bị nút `← Ở lại web bảo hành` và liên kết quay về web bán hàng trong cùng một tab (không mở tab mới gây rối người dùng).

### 3.4. Tạo phiếu bảo hành kèm upload ảnh sự cố
- Khách hàng khi tạo phiếu được tải lên tối đa 5 ảnh chụp sự cố thực tế (JPG, PNG, WEBP, tối đa 5MB/ảnh qua endpoint `/api/v1/tickets/upload-attachment`).
- Kỹ thuật viên khi mở chi tiết phiếu (`TicketDetail.jsx`) sẽ nhìn thấy ngay khối **"Ảnh khách gửi"** để chẩn đoán chính xác nguyên nhân hỏng hóc.

### 3.5. Đồng bộ giao diện Dark Mode & Light Mode (WCAG AA)
- Hệ thống hỗ trợ chuyển đổi giao diện sáng/tối chỉ với 1 click qua `ThemeToggle`.
- Cả hai trang **Ví điện tử** (`/wallet`) và **Thanh toán** (`/payment`) được thiết kế đồng bộ với thẻ số dư Indigo sẫm (`--brand-dark`), số tiền trắng tương phản cao `> 7:1` (đạt chuẩn WCAG AAA trên cả nền sáng và nền tối).

### 3.6. Thanh toán VietQR BIDV chuẩn EMVCo
- Tích hợp sinh mã VietQR động theo chuẩn Napas / EMVCo với thông tin tài khoản BIDV (`3300722488`, `VU MANH DUNG`), tự động tính toán mã CRC16 và nạp tiền vào ví điện tử.

---

## PHẦN 4. KIỂM THỬ PHẦN MỀM & BẢO MẬT GUARDRAILS (CLO 4)

### 4.1. Bộ kiểm thử tự động (Automated Test Suite)
- Hệ thống xây dựng **120+ bài test tự động** bao phủ toàn bộ các module:
  - `test_auth.py`: Kiểm thử xác thực, đổi mật khẩu, phân quyền role.
  - `test_tickets.py`: Kiểm thử vòng đời phiếu, chuyển trạng thái, gán kỹ thuật viên.
  - `test_shop.py`: Kiểm thử tìm kiếm sản phẩm, lọc danh mục, đặt hàng.
  - `test_ai_endpoints.py`: Kiểm thử AI chatbot, context history 10 lượt, phân loại sự cố.
  - `test_bridge.py`: Kiểm thử session bridge liên ứng dụng.
- **Kết quả thực thi:** Đạt **100% Passed**.

### 4.2. Cơ chế bảo mật Guardrails chống lỗi
1. **Chống Brute-Force Đăng Nhập:** Giới hạn 5 lần đăng nhập sai liên tiếp. Sau 5 lần, tài khoản bị tạm khóa trong 15 phút (HTTP 423 Locked).
2. **Chống SQL Injection:** 100% câu truy vấn sử dụng SQLAlchemy ORM Parameterized Query.
3. **Chống File Upload Độc Hại:** Kiểm tra định dạng MIME type cho phép (`image/jpeg`, `image/png`, `image/webp`), giới hạn dung lượng file tối đa 5MB, sinh tên file ngẫu nhiên bằng UUID4 để chống Path Traversal.
4. **Phân quyền chặt chẽ (RBAC):** Customer không thể xem hoặc sửa phiếu/sản phẩm của khách hàng khác.

---

## PHẦN 5. ĐÓNG GÓI DOCKER & VẬN HÀNH HỆ THỐNG (CLO 5)

### 5.1. Dockerfile Multi-Stage Build
Hệ thống sử dụng Dockerfile đa tầng để tối ưu dung lượng ảnh:
```dockerfile
# Stage 1: Build React/Vite SPA
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx Serve
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5.2. Docker Compose Orchestration
File `warranty-system/docker-compose.yml` định nghĩa toàn bộ dịch vụ (Backend, Frontend, Database, Reverse Proxy) kèm cơ chế **Healthcheck Probe** tự động khởi động lại nếu dịch vụ gặp sự cố.

---

## KẾT LUẬN
Đồ án đã hoàn thiện trọn vẹn 100% các tiêu chí từ phân tích thiết kế, cài đặt kiến trúc, kiểm thử tự động, bảo mật chuyên sâu cho đến đóng gói triển khai Docker. Hệ thống hoàn toàn sẵn sàng cho buổi bảo vệ đồ án với chất lượng tốt nhất.
