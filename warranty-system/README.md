# Warranty AI — Hệ thống quản lý bảo hành tích hợp AI

> Sub-project mới trong My-Software-Team, **tách biệt** với EV CSMS gốc (đang chạy).

## Stack
- **Backend**: FastAPI + SQLAlchemy + SQLite (dev) / PostgreSQL (prod via docker-compose)
- **Frontend**: React 18 + Vite + Tailwind dark + Framer Motion (animation 3D-style)
- **AI**: Mock rule-based (mặc định) — có sẵn adapter cho Gemini API
- **Wallet**: ACID-safe, pessimistic lock, Decimal arithmetic
- **AI Security**: Tự động ẩn danh SĐT/email/CCCD trước khi gửi

## Chạy nhanh (Local — chưa cần Docker)

### Backend
```bash
cd warranty-system/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed_data.py
uvicorn app.main:app --reload --port 8001
```

### Frontend
```bash
cd warranty-system/frontend
npm install
npm run dev
```

Mở http://localhost:5174

### Tài khoản demo
| Role | Email | Password |
|---|---|---|
| Admin | admin@warranty.vn | Admin@123 |
| Staff | staff@warranty.vn | Staff@123 |
| Technician | tech1@warranty.vn | Tech@123 |
| Customer | kh1@gmail.com | Khach@123 |

## Chạy với Docker (PostgreSQL + pgAdmin)
```bash
cd warranty-system
docker-compose up --build
```
- Backend: http://localhost:8001
- Frontend: http://localhost:5174
- pgAdmin: http://localhost:5050 (admin@warranty.local / admin)

## Tính năng
1. Auth + RBAC (admin / staff / technician / customer)
2. Quản lý sản phẩm + serial + thời hạn BH
4. Tạo phiếu + kiểm tra điều kiện BH tự động
5. Phân công kỹ thuật viên
6. Workflow trạng thái: RECEIVED → INSPECTION → REPAIRING → COMPLETED / REJECTED
7. AI phân loại lỗi (5 categories + OTHER)
8. AI tóm tắt lịch sử cho kỹ thuật viên
9. AI sinh tin nhắn cập nhật tiến độ (đã ẩn danh)
10. Wallet ACID — top-up sandbox, thanh toán dịch vụ ngoài BH
11. Thống kê: tổng phiếu, top lỗi AI, tỷ lệ từ chối, TB xử lý

## Test
```bash
cd warranty-system/backend
pytest tests/ -v
```

## Cấu trúc
Xem `dalam.md` để biết tiến độ + quyết định kỹ thuật chi tiết.