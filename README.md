# BảoHành Pro + Storefront

Hệ thống quản lý bảo hành tích hợp AI, gồm ứng dụng quản trị bảo hành và
website bán hàng dùng chung một backend FastAPI.

## Thành phần

| Thành phần | Công nghệ | Cổng |
|---|---|---|
| `warranty-system/backend` | FastAPI, SQLAlchemy, SQLite/PostgreSQL | 8000 |
| `warranty-system/frontend` | React 18, Vite, Tailwind | 5174 |
| `ecommerce-frontend` | React 18, Vite, Tailwind | 5175 |

## Chạy local

### 1. Backend

```powershell
cd warranty-system\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Điền SECRET_KEY trong .env, sau đó:
python seed_data.py
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. App bảo hành

```powershell
cd warranty-system\frontend
npm install
npm run dev
```

Mở http://localhost:5174

### 3. Storefront

```powershell
cd ecommerce-frontend
npm install
npm run dev
```

Mở http://localhost:5175

Cả hai frontend đều proxy `/api` và `/static` về backend ở `127.0.0.1:8000`.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@warranty.vn | Admin@123 |
| Staff | staff@warranty.vn | Staff@123 |
| Kỹ thuật viên | tech1@warranty.vn | Tech@123 |
| Khách hàng | kh1@gmail.com | Khach@123 |
| Shop demo | demo@shop.vn | Demo@123 |

## Chạy bằng Docker

```powershell
cd warranty-system
Copy-Item .env.example .env
docker compose up --build -d
docker compose exec backend python seed_data.py
```

- App bảo hành: http://localhost:5174
- Backend: http://localhost:8000
- pgAdmin: http://localhost:5050

## Kiểm thử

```powershell
cd warranty-system\backend
.\.venv\Scripts\python.exe -m pytest tests -q
```

## Tài liệu

- `DEMO-NOTES.md`: kiến trúc, hợp đồng API và kịch bản demo.
- `warranty-system/README.md`: chi tiết backend và tính năng.
- `warranty-system/docs/`: hướng dẫn chạy, đặc tả và báo cáo bảo mật.
