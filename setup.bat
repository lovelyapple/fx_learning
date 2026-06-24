@echo off
REM FX Learning App - Windows Setup
REM Pythonとnpmが事前にインストールされている前提

echo [1/3] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Backend dependency install failed.
    pause
    exit /b 1
)
cd ..

echo [2/3] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Frontend dependency install failed.
    pause
    exit /b 1
)
cd ..

echo [3/3] Creating .env from template (if not exists)...
if not exist .env (
    copy .env.example .env
    echo .env created. Please edit it to set your GITHUB_TOKEN.
) else (
    echo .env already exists, skipping.
)

echo.
echo Setup complete!
echo Next: Edit .env, then run run_backend.py and run_frontend.py
pause
