# PostgreSQL Migration Guide for Windows PowerShell

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "PostgreSQL Migration for Hostel Management System" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow

# Step 1: Backup current SQLite database
Write-Host "Step 1: Creating backup of current SQLite database..." -ForegroundColor Cyan
$backupName = "db.sqlite3.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item "db.sqlite3" $backupName
Write-Host "✓ SQLite database backed up as $backupName" -ForegroundColor Green

# Step 2: Export data from SQLite
Write-Host "Step 2: Exporting data from SQLite..." -ForegroundColor Cyan
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission | Out-File -Encoding utf8 "sqlite_data_backup.json"
Write-Host "✓ Data exported to sqlite_data_backup.json" -ForegroundColor Green

# Step 3: Install required packages
Write-Host "Step 3: Installing required packages..." -ForegroundColor Cyan
pip install python-decouple psycopg2-binary dj-database-url
Write-Host "✓ Packages installed" -ForegroundColor Green

# Step 4: Create .env file
Write-Host "Step 4: Setting up environment configuration..." -ForegroundColor Cyan
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created from template" -ForegroundColor Green
    Write-Host "Please edit .env file with your PostgreSQL credentials" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Step 5: PostgreSQL Database Setup Instructions
Write-Host "Step 5: PostgreSQL Database Setup" -ForegroundColor Cyan
Write-Host "Please ensure PostgreSQL is installed and running." -ForegroundColor Yellow
Write-Host "Create database by running one of these commands:" -ForegroundColor Yellow
Write-Host "  Option 1: createdb hostel_management" -ForegroundColor White
Write-Host "  Option 2: Connect to PostgreSQL and run: CREATE DATABASE hostel_management;" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter when database is ready"

# Step 6: Run migrations for PostgreSQL
Write-Host "Step 6: Running migrations for PostgreSQL..." -ForegroundColor Cyan
$env:DJANGO_SETTINGS_MODULE = "hostel_admin.settings_postgresql"
python manage.py migrate --settings=hostel_admin.settings_postgresql
Write-Host "✓ PostgreSQL migrations completed" -ForegroundColor Green

# Step 7: Load data into PostgreSQL
Write-Host "Step 7: Loading data into PostgreSQL..." -ForegroundColor Cyan
python manage.py loaddata sqlite_data_backup.json --settings=hostel_admin.settings_postgresql
Write-Host "✓ Data loaded into PostgreSQL" -ForegroundColor Green

# Step 8: Create superuser if needed
Write-Host "Step 8: Creating superuser (if needed)..." -ForegroundColor Cyan
python create_admin.py
Write-Host "✓ Admin user setup completed" -ForegroundColor Green

# Step 9: Verify migration
Write-Host "Step 9: Verifying migration..." -ForegroundColor Cyan
$verifyScript = @"
from django.contrib.auth.models import User
from core.models import Branch, Room, Tenant
print('Users:', User.objects.count())
print('Branches:', Branch.objects.count())  
print('Rooms:', Room.objects.count())
print('Tenants:', Tenant.objects.count())
"@
python manage.py shell --settings=hostel_admin.settings_postgresql -c $verifyScript
Write-Host "✓ Migration verification completed" -ForegroundColor Green

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "PostgreSQL Migration Completed Successfully!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file with actual PostgreSQL credentials" -ForegroundColor White
Write-Host "2. Test the application with: python manage.py runserver --settings=hostel_admin.settings_postgresql" -ForegroundColor White
Write-Host "3. Update production deployment to use PostgreSQL settings" -ForegroundColor White
