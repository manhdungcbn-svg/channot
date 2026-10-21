# 🚀 HƯỚNG DẪN CHẠY PROJECT - BẢO HÀNH PRO

> **Phiên bản:** v1.0
> **Cập nhật:** 2026-10-17

---

## MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Cài đặt nhanh](#3-cài-đặt-nhanh)
4. [Chạy Backend](#4-chạy-backend)
5. [Chạy Frontend](#5-chạy-frontend)
6. [Sử dụng AI Chatbot](#6-sử-dụng-ai-chatbot)
7. [Xử lý lỗi thường gặp](#7-xử-lý-lỗi-thường-gặp)

---

## 1. TỔNG QUAN

```
warranty-system/
├── backend/          # Python FastAPI backend
├── frontend/         # React + Vite frontend
└── docs/            # Tài liệu
```

### Cấu trúc chạy

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend       │     │   Backend        │
│   http://localhost │   │   http://localhost │
│   :5173          │◄──►│   :8000          │
│   (Vite)         │     │   (FastAPI)       │
└─────────────────┘     └─────────────────┘
```

---

## 2. YÊU CẦU HỆ THỐNG

### 2.1 Phần mềm bắt buộc

| Phần mềm | Phiên bản tối thiểu | Download |
|----------|---------------------|---------|
| Python | 3.10+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Git | 2.0+ | [git-scm.com](https://git-scm.com/) |

### 2.2 Kiểm tra phiên bản

Mở **Terminal** trong Cursor (View → Terminal):

```bash
# Kiểm tra Python
python --version
# Kết quả: Python 3.10.0 hoặc cao hơn

# Kiểm tra Node.js
node --version
# Kết quả: v18.x.x hoặc cao hơn

# Kiểm tra npm
npm --version
# Kết quả: 9.x.x hoặc cao hơn
```

---

## 3. CÀI ĐẶT NHANH

### 3.1 Clone/Download Project

```bash
# Nếu chưa có project
git clone <repo-url>
cd warranty-system
```

### 3.2 Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo (Virtual Environment)
python -m venv venv

# Kích hoạt Virtual Environment
# Windows PowerShell:
.\venv\Scripts\Activate

# Windows CMD:
venv\Scripts\activate.bat

# Cài đặt dependencies
pip install -r requirements.txt
```

### 3.3 Cài đặt Frontend

```bash
# Mở terminal mới, di chuyển vào frontend
cd frontend

# Cài đặt dependencies
npm install
```

---

## 4. CHẠY BACKEND

### 4.1 Cách 1: Chạy trực tiếp trong Terminal

```bash
# Đảm bảo đang ở thư mục backend và venv đã active
cd backend
.\venv\Scripts\Activate

# Chạy server
uvicorn app.main:app --reload --port 8000
```

**Output mong đợi:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 4.2 Cách 2: Chạy trong Cursor IDE (Debug Mode)

1. Mở file `backend/app/main.py`
2. Nhấn **F5** hoặc click **Run and Debug** (biểu tượng play + bug)
3. Chọn **Python File** debug configuration
4. Server sẽ chạy ở `http://localhost:8000`

### 4.3 Kiểm tra Backend

Mở trình duyệt hoặc dùng curl:

```bash
# Health check
curl http://localhost:8000/health
# Kết quả: {"status":"ok"}

# Xem API docs (Swagger UI)
# Mở trình duyệt: http://localhost:8000/docs
```

---

## 5. CHẠY FRONTEND

### 5.1 Cách 1: Chạy bằng npm

```bash
# Đảm bảo đang ở thư mục frontend
cd frontend

# Chạy development server
npm run dev
```

**Output mong đợi:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network:  http://192.168.x.x:5173/
```

### 5.2 Cách 2: Chạy trong Cursor IDE

1. Mở terminal trong Cursor (View → Terminal)
2. Di chuyển vào `warranty-system/frontend`
3. Chạy `npm run dev`
4. Click vào link `http://localhost:5173` trong terminal

### 5.3 Truy cập ứng dụng

1. Mở trình duyệt
2. Truy cập: **http://localhost:5173**
3. Đăng nhập với tài khoản test (xem mục 5.4)

### 5.4 Tài khoản Test

| Email | Mật khẩu | Vai trò |
|-------|-----------|---------|
| `admin@test.com` | `admin123` | Admin |
| `staff@test.com` | `staff123` | Staff |
| `tech@test.com` | `tech123` | Technician |
| `user@test.com` | `user123` | Customer |

---

## 6. SỬ DỤNG AI CHATBOT

### 6.1 Truy cập AI Console

1. Đăng nhập với vai trò **Admin**, **Staff**, hoặc **Technician**
2. Trong sidebar, tìm mục **AI Console** hoặc click vào biểu tượng 🤖

### 6.2 Test Nhanh với Serial

Trong chat, gõ một trong các serial sau:

```
TND-AC10-001    → Router Tenda (Còn bảo hành ✅)
CAM-HI3519-002  → Camera Hikvision (Còn bảo hành ✅)
SW-DLK-003      → Switch D-Link (Hết bảo hành ❌)
```

### 6.3 Các lệnh Chat

| Câu lệnh | Kết quả |
|----------|---------|
| `Xin chào` | Greeting + Menu |
| `Tra cứu serial TND-AC10-001` | Hiển thị thông tin sản phẩm |
| `Kiểm tra điều kiện bảo hành` | Hướng dẫn check BH |
| `Tạo yêu cầu bảo hành` | Bắt đầu tạo phiếu |
| `Câu hỏi thường gặp` | Hiển thị FAQ |
| `Cảm ơn` | Trả lời lịch sự |

### 6.4 Click Suggestions

Thay vì gõ, bạn có thể click vào các **suggestion chips**:
- 🔍 Tra cứu serial
- 📋 Tạo yêu cầu BH
- 📦 Kiểm tra điều kiện BH
- ❓ Câu hỏi thường gặp

---

## 7. XỬ LÝ LỖI THƯỜNG GẶP

### 7.1 Lỗi Backend

#### ❌ Lỗi: `ModuleNotFoundError: No module named 'fastapi'`

```bash
# Cách khắc phục:
pip install -r requirements.txt
```

#### ❌ Lỗi: `port 8000 is already in use`

```bash
# Tìm process đang dùng port 8000
netstat -ano | findstr :8000

# Hoặc chạy trên port khác
uvicorn app.main:app --reload --port 8001
```

#### ❌ Lỗi: Database not found

```bash
# Khởi tạo database
cd backend
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 7.2 Lỗi Frontend

#### ❌ Lỗi: `npm install` bị lỗi

```bash
# Xóa node_modules và cài lại
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### ❌ Lỗi: `Port 5173 is already in use`

```bash
# Tìm và kill process
netstat -ano | findstr :5173
taskkill /PID <process_id> /F

# Hoặc chạy trên port khác
npm run dev -- --port 5174
```

#### ❌ Lỗi: `Cannot find module`

```bash
# Chạy lại npm install
npm install
```

### 7.3 Lỗi AI Chatbot

#### ❌ Chatbot không hoạt động

1. Kiểm tra Backend đang chạy (terminal Backend)
2. Kiểm tra Console trong trình duyệt (F12) xem có lỗi gì không
3. Restart cả Backend và Frontend

#### ❌ Serial không tìm thấy

Hiện tại chatbot dùng **mock data**. Các serial test:
- `TND-AC10-001` ✅
- `CAM-HI3519-002` ✅
- `SW-DLK-003` ✅

---

## 8. CẤU HÌNH MÔI TRƯỜNG

### 8.1 Backend (.env)

Tạo file `backend/.env`:

```env
# Backend Configuration
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///./warranty.db
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:5174"]

# AI Configuration (Optional)
GEMINI_API_KEY=your-gemini-api-key
AI_MODE=mock  # mock | gemini

# Wallet Configuration
ALLOW_SANDBOX_TOPUP=true
```

### 8.2 Frontend (.env)

Tạo file `frontend/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Supabase (Optional - for Google Auth)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 9. CÁC SCRIPTS HỮU ÍCH

### 9.1 Chạy tất cả (Script PowerShell)

Tạo file `run-dev.ps1` trong thư mục gốc:

```powershell
# run-dev.ps1
Write-Host "Starting BảoHành Pro..." -ForegroundColor Cyan

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate; uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "✅ Application Started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
```

Chạy:
```powershell
.\run-dev.ps1
```

### 9.2 Chạy Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend (nếu có)
cd frontend
npm test
```

---

## 10. QUICK REFERENCE

### Keyboard Shortcuts trong Cursor

| Phím | Chức năng |
|------|-----------|
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+P` | Quick Open File |
| `Ctrl+`` | Toggle Terminal |
| `F5` | Start Debug |
| `Ctrl+Shift+F` | Search in Files |
| `Ctrl+B` | Toggle Sidebar |

### URLs quan trọng

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## 📞 HỖ TRỢ

Nếu gặp lỗi không có trong danh sách:

1. Kiểm tra **Console** trong trình duyệt (F12)
2. Kiểm tra **Terminal** của Backend và Frontend
3. Copy lỗi và tìm kiếm trên Google/Stack Overflow
4. Liên hệ team phát triển

---

**Chúc bạn phát triển vui vẻ! 🚀**
