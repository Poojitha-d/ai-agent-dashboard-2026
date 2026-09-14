@echo off
title AI Agent Dashboard 2026 - Launcher
color 0b

echo =====================================================================
echo                AI Agent Dashboard 2026 - Launcher
echo =====================================================================
echo.
echo Starting Backend (FastAPI) and Frontend (Next.js) in separate windows...
echo.

:: Get the directory of this batch file
set "ROOT_DIR=%~dp0"

:: 1. Launch Backend in a separate window
echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "AI Agent Dashboard - Backend (FastAPI)" cmd /k "cd /d "%ROOT_DIR%backend" && title Backend (FastAPI) && echo Starting FastAPI server... && python -m uvicorn app.main:app --reload --port 8000"

:: 2. Launch Frontend in a separate window
echo [2/2] Launching Next.js Frontend on http://localhost:3000 ...
start "AI Agent Dashboard - Frontend (Next.js)" cmd /k "cd /d "%ROOT_DIR%frontend" && title Frontend (Next.js) && echo Starting Next.js development server... && npm run dev"

echo.
echo =====================================================================
echo Services are starting in separate terminal windows:
echo   * Frontend Web UI : http://localhost:3000
echo   * Backend API Docs: http://localhost:8000/docs
echo   * Health Check    : http://localhost:8000/health
echo =====================================================================
echo.
echo Opening dashboard in your default browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo Done! You can close this window now.
pause
