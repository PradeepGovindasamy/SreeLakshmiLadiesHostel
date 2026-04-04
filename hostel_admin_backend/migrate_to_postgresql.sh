#!/bin/bash
# PostgreSQL Migration Script for Hostel Management System

echo "=================================================="
echo "PostgreSQL Migration for Hostel Management System"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backup current SQLite database
echo -e "${YELLOW}Step 1: Creating backup of current SQLite database...${NC}"
cp db.sqlite3 db.sqlite3.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ SQLite database backed up${NC}"

# Step 2: Export data from SQLite
echo -e "${YELLOW}Step 2: Exporting data from SQLite...${NC}"
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > sqlite_data_backup.json
echo -e "${GREEN}✓ Data exported to sqlite_data_backup.json${NC}"

# Step 3: Install required packages
echo -e "${YELLOW}Step 3: Installing required packages...${NC}"
pip install python-decouple psycopg2-binary
echo -e "${GREEN}✓ Packages installed${NC}"

# Step 4: Create PostgreSQL database (requires manual setup)
echo -e "${YELLOW}Step 4: PostgreSQL Database Setup${NC}"
echo "Please ensure PostgreSQL is installed and running."
echo "Create database manually by running:"
echo "  createdb hostel_management"
echo "  OR connect to PostgreSQL and run: CREATE DATABASE hostel_management;"
echo ""
read -p "Press Enter when database is ready..."

# Step 5: Update settings
echo -e "${YELLOW}Step 5: Updating Django settings...${NC}"
export DJANGO_SETTINGS_MODULE=hostel_admin.settings_postgresql
echo -e "${GREEN}✓ Django settings updated${NC}"

# Step 6: Run migrations for PostgreSQL
echo -e "${YELLOW}Step 6: Running migrations for PostgreSQL...${NC}"
python manage.py migrate --settings=hostel_admin.settings_postgresql
echo -e "${GREEN}✓ PostgreSQL migrations completed${NC}"

# Step 7: Load data into PostgreSQL
echo -e "${YELLOW}Step 7: Loading data into PostgreSQL...${NC}"
python manage.py loaddata sqlite_data_backup.json --settings=hostel_admin.settings_postgresql
echo -e "${GREEN}✓ Data loaded into PostgreSQL${NC}"

# Step 8: Create superuser if needed
echo -e "${YELLOW}Step 8: Creating superuser (if needed)...${NC}"
python create_admin.py --settings=hostel_admin.settings_postgresql
echo -e "${GREEN}✓ Admin user setup completed${NC}"

# Step 9: Verify migration
echo -e "${YELLOW}Step 9: Verifying migration...${NC}"
python manage.py shell --settings=hostel_admin.settings_postgresql -c "
from django.contrib.auth.models import User
from core.models import Branch, Room, Tenant
print('Users:', User.objects.count())
print('Branches:', Branch.objects.count())
print('Rooms:', Room.objects.count())
print('Tenants:', Tenant.objects.count())
"
echo -e "${GREEN}✓ Migration verification completed${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}PostgreSQL Migration Completed Successfully!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Update your .env file with actual PostgreSQL credentials"
echo "2. Test the application with: python manage.py runserver --settings=hostel_admin.settings_postgresql"
echo "3. Update production deployment to use PostgreSQL settings"
echo ""
