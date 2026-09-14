# AI Agent Dashboard 2026 - PowerShell Launcher
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "               AI Agent Dashboard 2026 - Launcher" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot

# 1. Launch Backend
Write-Host "[1/2] Launching FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\backend'; `$Host.UI.RawUI.WindowTitle = 'Backend (FastAPI)'; python -m uvicorn app.main:app --reload --port 8000"

# 2. Launch Frontend
Write-Host "[2/2] Launching Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\frontend'; `$Host.UI.RawUI.WindowTitle = 'Frontend (Next.js)'; npm run dev"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "Services are running in separate terminal windows:" -ForegroundColor Green
Write-Host "  * Frontend Web UI : http://localhost:3000" -ForegroundColor White
Write-Host "  * Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  * Health Check    : http://localhost:8000/health" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
