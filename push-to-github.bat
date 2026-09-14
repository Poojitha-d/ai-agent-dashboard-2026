@echo off
title Push AI Agent Dashboard to GitHub
color 0b

echo =====================================================================
echo              Push AI Agent Dashboard 2026 to GitHub
echo =====================================================================
echo.
echo Make sure you have created an empty repository on GitHub first!
echo (e.g., https://github.com/your-username/ai-agent-dashboard-2026)
echo.

set /p REPO_URL="Enter your GitHub Repository URL (HTTPS): "

if "%REPO_URL%"=="" (
    echo No URL provided. Aborting.
    pause
    exit /b
)

echo.
echo Configuring remote and pushing to main branch...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo =====================================================================
echo Done! Your code is on GitHub.
echo.
echo You can now:
echo  1. Deploy to Render: Go to dashboard.render.com -> New + -> Blueprint -> select this repo.
echo  2. Deploy to Vercel: Go to vercel.com/new -> Import this repo -> set root directory to 'frontend'.
echo =====================================================================
pause
