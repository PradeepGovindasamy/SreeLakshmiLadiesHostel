# PostgreSQL Migration Guide for Hostel Management System

## Overview
This guide provides a comprehensive procedure to migrate your hostel management system from SQLite to PostgreSQL database.

## Prerequisites

### 1. Install PostgreSQL
```powershell
# Download and install PostgreSQL from: https://www.postgresql.org/download/windows/
# Or using chocolatey:
choco install postgresql

# Or using winget:
winget install PostgreSQL.PostgreSQL
```

### 2. Verify PostgreSQL Installation
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Connect to PostgreSQL (default credentials)
psql -U postgres
```

## Migration Procedure

### Step 1: Prepare for Migration

1. **Navigate to backend directory:**
```powershell
cd "\\wsl.localhost\Ubuntu\Consultant\projects\SreeLakshmiLadiesHostel\hostel_admin_backend"
```

2. **Install additional required packages:**
```powershell
pip install python-decouple psycopg2-binary dj-database-url
```

### Step 2: Backup Current Data

1. **Backup SQLite database:**
```powershell
# Create backup of current database
Copy-Item "db.sqlite3" "db.sqlite3.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

2. **Export existing data:**
```powershell
# Export all data to JSON format
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > sqlite_data_backup.json
```

### Step 3: Setup PostgreSQL Database

1. **Create database:**
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE hostel_management;

-- Create user (optional)
CREATE USER hostel_admin WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hostel_management TO hostel_admin;

-- Exit PostgreSQL
\q
```

### Step 4: Configure Environment

1. **Create .env file:**
```powershell
# Copy example file
Copy-Item ".env.example" ".env"
```

2. **Edit .env file with your PostgreSQL credentials:**
```
DB_NAME=hostel_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DEBUG=False
SECRET_KEY=your-super-secret-production-key
```

### Step 5: Run Migration

**Option A: Automated Migration (Recommended)**
```powershell
# Run the automated migration script
.\migrate_to_postgresql.ps1
```

**Option B: Manual Migration**
```powershell
# 1. Run migrations with PostgreSQL settings
python manage.py migrate --settings=hostel_admin.settings_postgresql

# 2. Load backed up data
python manage.py loaddata sqlite_data_backup.json --settings=hostel_admin.settings_postgresql

# 3. Create admin user
python create_admin.py

# 4. Verify migration
python manage.py shell --settings=hostel_admin.settings_postgresql -c "
from django.contrib.auth.models import User
from core.models import Branch, Room, Tenant
print('Users:', User.objects.count())
print('Branches:', Branch.objects.count())
print('Rooms:', Room.objects.count())
print('Tenants:', Tenant.objects.count())
"
```

### Step 6: Test the Migration

1. **Start the application with PostgreSQL:**
```powershell
python manage.py runserver --settings=hostel_admin.settings_postgresql
```

2. **Verify functionality:**
- Login to admin panel: http://127.0.0.1:8000/admin/
- Test API endpoints: http://127.0.0.1:8000/api/
- Check data integrity in the frontend

### Step 7: Update Production Configuration

1. **Update Docker configuration (if using Docker):**
```dockerfile
# Update Dockerfile to use PostgreSQL settings
ENV DJANGO_SETTINGS_MODULE=hostel_admin.settings_postgresql
```

2. **Update docker-compose.yml:**
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: hostel_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build: .
    environment:
      - DJANGO_SETTINGS_MODULE=hostel_admin.settings_postgresql
    depends_on:
      - db

volumes:
  postgres_data:
```

## Post-Migration Tasks

### 1. Performance Optimization
```sql
-- Connect to your database
\c hostel_management

-- Create indexes for better performance
CREATE INDEX idx_tenant_check_in_date ON core_tenant(check_in_date);
CREATE INDEX idx_room_branch ON core_room(branch_id);
CREATE INDEX idx_occupancy_room ON core_occupancy(room_id);
CREATE INDEX idx_payment_tenant ON core_rentpayment(tenant_id);

-- Analyze tables for query optimization
ANALYZE;
```

### 2. Backup Strategy
```powershell
# Create regular backup script
$backupScript = @"
# PostgreSQL Backup Script
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "hostel_management_backup_$date.sql"
pg_dump -U postgres -h localhost hostel_management > $backupFile
Write-Host "Backup created: $backupFile"
"@

$backupScript | Out-File -FilePath "backup_postgresql.ps1"
```

### 3. Monitoring and Maintenance
```sql
-- Monitor database size
SELECT pg_size_pretty(pg_database_size('hostel_management')) as database_size;

-- Monitor table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Rollback Procedure (if needed)

If you need to rollback to SQLite:

```powershell
# 1. Stop the application
# 2. Restore SQLite backup
Copy-Item "db.sqlite3.backup.*" "db.sqlite3"

# 3. Run with SQLite settings
python manage.py runserver --settings=hostel_admin.settings
```

## Troubleshooting

### Common Issues:

1. **Connection Refused:**
   - Ensure PostgreSQL service is running
   - Check port 5432 is not blocked
   - Verify credentials in .env file

2. **Permission Denied:**
   - Grant proper privileges to database user
   - Check PostgreSQL pg_hba.conf configuration

3. **Data Import Errors:**
   - Check for foreign key constraints
   - Verify all dependencies are migrated first

### Verification Commands:
```powershell
# Check PostgreSQL service
Get-Service postgresql*

# Test database connection
python manage.py dbshell --settings=hostel_admin.settings_postgresql

# Check migration status
python manage.py showmigrations --settings=hostel_admin.settings_postgresql
```

## Security Considerations

1. **Update passwords:** Change default PostgreSQL passwords
2. **Configure firewall:** Limit database access to application servers
3. **Enable SSL:** Configure SSL connections for production
4. **Regular updates:** Keep PostgreSQL updated with security patches

## Performance Benefits After Migration

- **Concurrent Access:** Better handling of multiple users
- **ACID Compliance:** Better data consistency and reliability
- **Advanced Features:** Full-text search, JSON fields, custom functions
- **Scalability:** Better performance with large datasets
- **Backup & Recovery:** More robust backup and point-in-time recovery options

Your hostel management system will now be running on PostgreSQL with improved performance, reliability, and scalability!
