# Docker Deployment Script for Hostel Management System
# PowerShell version

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Hostel Management System - Docker Deploy" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (!(Test-Path .env)) {
    Write-Host "⚠ .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item .env.docker .env
    Write-Host "✓ .env file created. Please edit it with your configuration." -ForegroundColor Green
    Write-Host "⚠ Update SECRET_KEY and DB_PASSWORD before proceeding!" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Environment file found" -ForegroundColor Green

# Stop any running backend server
Write-Host "Stopping local development servers..." -ForegroundColor Yellow
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*manage.py*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Build and start containers
Write-Host "Building Docker images..." -ForegroundColor Yellow
wsl docker compose build

Write-Host "Starting containers..." -ForegroundColor Yellow
wsl docker compose up -d

# Wait for services to be healthy
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check health
Write-Host "Checking service health..." -ForegroundColor Yellow
wsl docker compose ps

# Show completion message
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services Running:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000/api/" -ForegroundColor White
Write-Host "  Admin:     http://localhost:8000/admin/" -ForegroundColor White
Write-Host "  Database:  localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:           wsl docker compose logs -f" -ForegroundColor White
Write-Host "  Stop services:       wsl docker compose down" -ForegroundColor White
Write-Host "  Create admin user:   wsl docker compose exec backend python manage.py createsuperuser" -ForegroundColor White
Write-Host "  Database backup:     wsl docker compose exec db pg_dump -U postgres hostel_management > backup.sql" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see DOCKER_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
