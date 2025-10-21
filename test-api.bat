@echo off
echo ========================================
echo Testing Backend + Frontend Connection
echo ========================================
echo.

echo [1/3] Checking Backend (port 5000)...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend is running on port 5000
) else (
    echo ❌ Backend is NOT running
    goto :end
)

echo.
echo [2/3] Checking Frontend (port 5174)...
curl -s http://localhost:5174 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend is running on port 5174
) else (
    echo ❌ Frontend is NOT running
    goto :end
)

echo.
echo [3/3] Instructions:
echo ========================================
echo 1. Open browser: http://localhost:5174
echo 2. Sign in with your account
echo 3. Send a message to test AI
echo 4. Check console logs for:
echo    - ✅ Socket connected
echo    - 📩 Received message
echo    - 🤖 AI init
echo    - 📨 AI chunk
echo    - ✅ AI finished
echo.
echo Backend console should show:
echo    - ✅ Client connected
echo    - ✉️ New message
echo    - 🤖 Sending prompt to Gemini AI
echo ========================================

:end
pause
