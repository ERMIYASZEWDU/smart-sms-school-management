# Smart SMS - Start Script
# This script starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SMART SMS - School Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoRunning = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongoRunning -and $mongoRunning.Status -eq 'Running') {
    Write-Host "✓ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "⚠ MongoDB is not running. Please start MongoDB service." -ForegroundColor Red
    Write-Host "  Or update server/.env to use MongoDB Atlas connection string" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start backend in new window
Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; Write-Host 'Backend Server' -ForegroundColor Green; npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "Starting Frontend Server (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend Server' -ForegroundColor Blue; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servers Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor Cyan
Write-Host "  Admin:   admin@smartsms.et / Admin@123" -ForegroundColor White
Write-Host "  Teacher: teacher1@smartsms.et / Teacher@123" -ForegroundColor White
Write-Host "  Student: student1@smartsms.et / Student@123" -ForegroundColor White
Write-Host "  Parent:  parent1@smartsms.et / Parent@123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
