@echo off
REM FX Learning App - Windows Setup
REM Pythonとnpmが事前にインストールされている前提

echo [1/4] Creating Python virtual environment...
if not exist .venv (
    python -m venv .venv
    echo .venv created.
) else (
    echo .venv already exists, skipping.
)

echo [2/4] Installing backend dependencies into .venv...
.venv\Scripts\pip install -r backend\requirements.txt --quiet
if errorlevel 1 (
    echo ERROR: Backend dependency install failed.
    pause
    exit /b 1
)

echo [3/4] Installing frontend dependencies...
cd frontend
call npm install --silent
if errorlevel 1 (
    echo ERROR: Frontend dependency install failed.
    pause
    exit /b 1
)
cd ..

echo [4/4] Creating .env from template (if not exists)...
if not exist .env (
    copy .env.example .env
    echo .env created. Please edit it to set your GITHUB_TOKEN.
) else (
    echo .env already exists, skipping.
)

echo.
echo Setup complete!
echo Next: Edit .env to set GITHUB_TOKEN, then run start.bat
pause
