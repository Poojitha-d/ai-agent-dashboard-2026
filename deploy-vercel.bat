@echo off
title Deploy Frontend to Vercel
color 0b

echo =====================================================================
echo                Deploy AI Agent Dashboard to Vercel
echo =====================================================================
echo.
echo Navigating to frontend directory...
cd /d "%~dp0frontend"

echo.
echo Starting Vercel deployment...
echo Note: If you are not logged in, Vercel CLI will open a browser window
echo to authorize your Vercel account.
echo.

npx vercel

echo.
echo =====================================================================
echo To push this deployment to production, run:
echo   npx vercel --prod
echo =====================================================================
pause
