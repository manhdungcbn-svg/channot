# 🖥️ HƯỚNG DẪN CHẠY TRONG CURSOR IDE

> **Cho người mới bắt đầu với Cursor**

---

## MỤC LỤC

1. [Mở Project trong Cursor](#1-mở-project-trong-cursor)
2. [Cài đặt ban đầu](#2-cài-đặt-ban-đầu)
3. [Chạy Backend trong Cursor](#3-chạy-backend-trong-cursor)
4. [Chạy Frontend trong Cursor](#4-chạy-frontend-trong-cursor)
5. [Debug trong Cursor](#5-debug-trong-cursor)
6. [Mẹo sử dụng Cursor hiệu quả](#6-mẹo-sử-dụng-cursor-hiệu-quả)

---

## 1. MỞ PROJECT TRONG CURSOR

### 1.1 Cách 1: Open Folder

```
1. Mở Cursor IDE
2. File → Open Folder
3. Chọn thư mục: C:\Users\Lenovo\Documents\My-Software-Team-main\warranty-system
4. Click "Open"
```

### 1.2 Cách 2: Drag & Drop

```
1. Mở File Explorer
2. Kéo thư mục warranty-system vào cửa sổ Cursor
```

### 1.3 Xem cấu trúc project

Sau khi mở, bạn sẽ thấy cấu trúc:

```
warranty-system/
├── backend/          ← Backend Python (FastAPI)
├── frontend/         ← Frontend React (Vite)
└── docs/            ← Tài liệu
```

---

## 2. CÀI ĐẶT BAN ĐẦU

### 2.1 Mở Terminal trong Cursor

```
Cách 1: View → Terminal
Cách 2: Ctrl + `
```

### 2.2 Cài đặt Backend

```powershell
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Tạo môi trường ảo (Virtual Environment)
python -m venv venv

# 3. Kích hoạt môi trường ảo
.\venv\Scripts\Activate

# 4. Cài đặt thư viện cần thiết
pip install -r requirements.txt
```

**Kết quả mong đợi:**
```
(venv) PS C:\...\warranty-system\backend>
```

### 2.3 Cài đặt Frontend

```powershell
# Mở terminal mới (Ctrl + `)
cd frontend
npm install
```

---

## 3. CHẠY BACKEND TRONG CURSOR

### 3.1 Cách 1: Chạy trong Terminal

```powershell
# Đảm bảo đang ở thư mục backend và venv đã active
cd backend
.\venv\Scripts\Activate

# Chạy server
uvicorn app.main:app --reload --port 8000
```

### 3.2 Cách 2: Tạo Run Configuration

1. **Tạo file cấu hình:**

Tạo file `.vscode/launch.json` trong thư mục `backend`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: FastAPI",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "app.main:app",
                "--reload",
                "--port",
                "8000"
            ],
            "jinja": true,
            "justMyCode": true,
            "cwd": "${workspaceFolder}/backend",
            "console": "integratedTerminal"
        }
    ]
}
```

2. **Chạy:**
   - Nhấn **F5** hoặc
   - Run → Start Debugging
   - Chọn "Python: FastAPI"

### 3.3 Kiểm tra Backend

Mở trình duyệt: **http://localhost:8000/docs**

Bạn sẽ thấy giao diện Swagger UI để test API.

---

## 4. CHẠY FRONTEND TRONG CURSOR

### 4.1 Cách 1: Terminal

```powershell
# Mở terminal mới (Ctrl + `)
cd frontend
npm run dev
```

### 4.2 Cách 2: Tạo npm Script

1. Mở `frontend/package.json`
2. Thêm scripts nếu chưa có:

```json
"scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
}
```

3. Chạy: `npm run dev`

### 4.3 Truy cập Frontend

Sau khi chạy, terminal sẽ hiển thị:

```
Local:   http://localhost:5173/
Network: http://192.168.1.x:5173/
```

**Click vào link hoặc copy vào trình duyệt.**

---

## 5. DEBUG TRONG CURSOR

### 5.1 Debug Backend Python

1. **Đặt breakpoint:**
   - Click vào số dòng bên trái editor
   - Một chấm đỏ sẽ xuất hiện 🔴

2. **Start Debug:**
   - Nhấn **F5**
   - Hoặc Run → Start Debugging

3. **Kiểm tra biến:**
   - Dùng panel **VARIABLES** bên trái
   - Hover chuột trên biến trong code

### 5.2 Debug Frontend React

1. **Đặt breakpoint:**
   - Thêm `debugger;` trong code
   - Hoặc click vào số dòng

2. **Mở DevTools:**
   - F12 trong trình duyệt
   - Tab **Sources** để xem breakpoints

3. **React Developer Tools:**
   - Cài đặt React DevTools extension cho trình duyệt
   - Giúp xem component tree và state

### 5.3 Debug AI Chatbot

1. Mở DevTools (F12)
2. Tab **Console**
3. Thực hiện action trong chatbot
4. Xem console logs

---

## 6. MẸO SỬ DỤNG CURSOR HIỆU QUẢ

### 6.1 Tìm kiếm nhanh

| Phím | Chức năng |
|------|-----------|
| `Ctrl + P` | Mở file nhanh |
| `Ctrl + Shift + F` | Tìm trong tất cả files |
| `Ctrl + Shift + H` | Thay thế trong tất cả files |
| `Ctrl + G` | Go to line |

### 6.2 AI Assistant trong Cursor

**Sử dụng AI để debug:**

1. **Chọn code có lỗi**
2. **Nhấn Ctrl + L** (hoặc click icon AI)
3. **Hỏi:** "Giải thích đoạn code này"
4. **Hỏi:** "Sửa lỗi này giúp tôi"

**Sử dụng AI để code:**

1. **Viết comment mô tả**
2. **Nhấn Tab** để accept suggestion
3. **Dùng /explain** để giải thích code

### 6.3 Terminal Tricks

```powershell
# Clear terminal
cls

# Xem lịch sử lệnh
history

# Kill process
# Ctrl + C

# Paste trong terminal
# Ctrl + Shift + V
```

### 6.4 Git trong Cursor

1. **Source Control tab** (biểu tượng git bên trái)
2. **Xem thay đổi:**
   - Changed files
   - Diff view
3. **Commit:**
   - Stage files (+)
   - Viết commit message
   - Commit

---

## 📋 CHECKLIST TRƯỚC KHI CHẠY

```markdown
□ Đã mở project trong Cursor
□ Đã chạy `pip install` ở backend
□ Đã chạy `npm install` ở frontend
□ Đã kích hoạt venv ở backend (.\venv\Scripts\Activate)
□ Backend port 8000 không bị chiếm
□ Frontend port 5173 không bị chiếm
```

---

## 🔧 XỬ LÝ SỰ CỐ

### Không thấy terminal?

```
View → Terminal
```

### Không thấy file?

```
File → Open Folder → Chọn warranty-system
```

### Lỗi import không tìm thấy?

```powershell
# Chạy lại pip install
cd backend
pip install -r requirements.txt
```

### Lỗi port bị chiếm?

```powershell
# Tìm process
netstat -ano | findstr :8000

# Kill process (thay PID)
taskkill /PID <PID> /F
```

---

## 🎓 TÀI LIỆU THAM KHẢO

- [Cursor IDE Documentation](https://cursor.sh/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

---

**Chúc bạn học tập và phát triển vui vẻ! 🚀**
