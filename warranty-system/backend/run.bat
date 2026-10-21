@echo off
echo ================================================
echo   BAO HANH PRO - KHOI DONG NHANH
echo ================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv venv
)

echo [3/3] Installing dependencies...
call venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo.
echo ================================================
echo   DANG KHOI DONG BACKEND...
echo ================================================
echo.
echo Backend se chay tai: http://localhost:8000
echo API Docs tai: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
