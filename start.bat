@echo off
REM FX Learning App - Start (Windows)
REM Backend and Frontend both start in separate windows

echo Starting FX Learning App...

REM Start backend in new window
start "FX Backend" cmd /c "cd /d %~dp0 && python run_backend.py"

REM Wait for backend to initialize
timeout /t 3 /nobreak > nul

REM Start frontend in new window
start "FX Frontend" cmd /c "cd /d %~dp0 && python run_frontend.py"

REM Wait for frontend to initialize then open browser
timeout /t 3 /nobreak > nul
start http://localhost:5173

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Close the opened windows to stop the servers.
