# 🎯 QUICK START - BẢO HÀNH PRO

> Copy và paste các lệnh bên dưới vào Terminal

---

## 🚀 KHỞI ĐỘNG NHANH (5 phút)

### Bước 1: Mở 2 Terminal

```
Terminal 1: Chạy Backend
Terminal 2: Chạy Frontend
```

### Bước 2: Terminal 1 - Backend

```powershell
cd warranty-system/backend

# Tạo môi trường ảo (chỉ làm 1 lần)
python -m venv venv

# Kích hoạt môi trường ảo
.\venv\Scripts\Activate

# Cài đặt thư viện (chỉ làm 1 lần)
pip install -r requirements.txt

# Chạy server
uvicorn app.main:app --reload --port 8000
```

**✅ Kết quả mong đợi:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Bước 3: Terminal 2 - Frontend

```powershell
cd warranty-system/frontend

# Cài đặt thư viện (chỉ làm 1 lần)
npm install

# Chạy server
npm run dev
```

**✅ Kết quả mong đợi:**
```
Local:   http://localhost:5173/
```

### Bước 4: Mở trình duyệt

```
Frontend: http://localhost:5173
API Docs: http://localhost:8000/docs
```

---

## 👤 TÀI KHOẢN TEST

| Email | Mật khẩu | Vai trò |
|-------|-----------|---------|
| admin@test.com | admin123 | Admin |
| staff@test.com | staff123 | Staff |
| tech@test.com | tech123 | Technician |
| user@test.com | user123 | Customer |

---

## 🤖 TEST AI CHATBOT

1. Đăng nhập với vai trò **Admin** hoặc **Staff**
2. Tìm menu **AI Console** trong sidebar
3. Gõ thử: `TND-AC10-001`

---

## 🔧 XỬ LÝ LỖI NHANH

### Backend không chạy?

```powershell
# Restart Backend
cd warranty-system/backend
.\venv\Scripts\Activate
uvicorn app.main:app --reload --port 8000
```

### Frontend không chạy?

```powershell
# Restart Frontend
cd warranty-system/frontend
npm run dev
```

### Port bị chiếm?

```powershell
# Tìm process chiếm port 8000
netstat -ano | findstr :8000

# Kill process (thay XXXX bằng PID)
taskkill /PID XXXX /F

# Hoặc dùng port khác
uvicorn app.main:app --port 8001
```

---

## 📁 CẤU TRÚC THƯ MỤC

```
warranty-system/
├── backend/
│   ├── app/
│   │   ├── main.py           ← Chạy backend ở đây
│   │   ├── api/
│   │   ├── models/
│   │   └── services/
│   └── requirements.txt       ← Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← Router chính
│   │   ├── pages/           ← Các trang
│   │   └── components/      ← Components
│   ├── package.json         ← Dependencies
│   └── vite.config.js
│
└── docs/                    ← Tài liệu
    ├── RUN_GUIDE.md         ← Hướng dẫn chi tiết
    ├── SPEC.md              ← Đặc tả kỹ thuật
    └── CHATBOT_AI_DESIGN.md ← Thiết kế AI Chatbot
```

---

## 🎮 CÁC TÍNH NĂNG CHÍNH

| Tính năng | URL |
|-----------|-----|
| Dashboard | http://localhost:5173 |
| Quản lý sản phẩm | http://localhost:5173/products |
| Quản lý phiếu BH | http://localhost:5173/tickets |
| Ví tiền | http://localhost:5173/wallet |
| **AI Chatbot** | http://localhost:5173/ai-console |
| Cài đặt | http://localhost:5173/settings |

---

## 📝 GHI CHÚ

- Backend chạy ở **port 8000**
- Frontend chạy ở **port 5173**
- API Documentation ở **http://localhost:8000/docs**
- Cần cả Backend và Frontend cùng chạy để ứng dụng hoạt động

---

**Chúc bạn thành công! 🎉**
