#!/bin/bash
# Docker Setup Validation Script

echo "=========================================="
echo "Docker Setup Validation"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} $VERSION"
else
    echo -e "${RED}✗ Docker not found${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check Docker Compose
echo -n "Checking Docker Compose... "
if docker compose version &> /dev/null; then
    VERSION=$(docker compose version)
    echo -e "${GREEN}✓${NC} $VERSION"
else
    echo -e "${RED}✗ Docker Compose not found${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check .env file
echo -n "Checking .env file... "
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} Found"
    
    # Check for default values
    if grep -q "your-secret-key" .env; then
        echo -e "${YELLOW}  ⚠ WARNING: SECRET_KEY still has default value${NC}"
    fi
    
    if grep -q "DB_PASSWORD=postgres" .env; then
        echo -e "${YELLOW}  ⚠ WARNING: DB_PASSWORD is using default 'postgres'${NC}"
    fi
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check required files
echo -n "Checking docker-compose.yml... "
if [ -f docker-compose.yml ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS+1))
fi

echo -n "Checking Backend Dockerfile... "
if [ -f hostel_admin_backend/Dockerfile ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS+1))
fi

echo -n "Checking Frontend Dockerfile... "
if [ -f hostel-frontend-starter/Dockerfile ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check ports
echo ""
echo "Checking port availability..."

check_port() {
    PORT=$1
    NAME=$2
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠ Port $PORT ($NAME) is in use${NC}"
    else
        echo -e "${GREEN}  ✓ Port $PORT ($NAME) is available${NC}"
    fi
}

check_port 80 "Frontend"
check_port 8000 "Backend"
check_port 5432 "PostgreSQL"

# Summary
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "You're ready to deploy with: ./deploy-docker.sh"
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    echo "Please fix the issues above before deploying"
fi
echo "=========================================="
