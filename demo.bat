@echo off
REM ============================================================
REM  Demo launcher - BảoHành Pro + Shopee Điện Tử
REM  Chay:  demo.bat
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo  ============================================================
echo   DEMO LAUNCHER
echo  ============================================================
echo.

REM --- 1. Backend ---
echo [1/3] Dang kiem tra backend (port 8000)...
curl -s -o NUL -w "%%{http_code}" http://127.0.0.1:8000/health > nul 2>&1
if errorlevel 1 (
    echo       Backend chua chay. Hay chay:
    echo         cd warranty-system\backend
    echo         python -m uvicorn app.main:app --port 8000
    echo.
) else (
    echo       Backend OK.
)

REM --- 2. Storefront ---
echo [2/3] Storefront: http://localhost:5175
echo [3/3] Warranty app: http://localhost:5174
echo.
echo  Tai khoan demo:
echo    Admin       admin@warranty.vn     / Admin@123
echo    Khach hang  kh1@gmail.com        / Khach@123
echo    Demo shop   demo@shop.vn         / Demo@123
echo.
echo  ============================================================
echo.

start "" http://localhost:5175
start "" http://localhost:5174
endlocal
