@echo off
echo ==========================================
echo Starting SkillBridge Platform
echo ==========================================

start "SkillBridge Backend (FastAPI)" cmd /k "cd /d %~dp0 && set PYTHONPATH=backend&& python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

start "SkillBridge Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000/docs
echo.
