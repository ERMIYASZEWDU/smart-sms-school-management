@echo off
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         Smart SMS School Management System                 ║
echo ║              Starting All Services...                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Start Backend Server
echo [1/2] Starting Backend Server (Port 5000)...
start "🔌 Backend Server - Watch for OTP codes here!" cmd /k "cd server && echo Starting backend server... && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [2/2] Starting Frontend (Port 5173)...
start "🌐 Frontend Server" cmd /k "echo Starting frontend... && npm run dev"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    ✅ Servers Starting!                    ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  📧 Check "Backend Server" window for OTP codes           ║
echo ║  🌐 Frontend: http://localhost:5173                        ║
echo ║  🔌 Backend:  http://localhost:5000                        ║
echo ║                                                            ║
echo ║  🧪 Test OTP:                                              ║
echo ║     1. Go to: http://localhost:5173/forgot-password       ║
echo ║     2. Enter: admin@school.com                            ║
echo ║     3. Watch Backend window for OTP code                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Press any key to close this window...
pause >nul
