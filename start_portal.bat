@echo off
echo ===================================================
echo        Starting Skill Nexus Portal
echo ===================================================

echo [1/2] Launching Backend API Server on port 8000...
start "Skill Nexus Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Frontend Development Server on port 5173...
start "Skill Nexus Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Backend running at:  http://127.0.0.1:8000
echo Frontend running at: http://localhost:5173
echo ===================================================
echo.
pause
