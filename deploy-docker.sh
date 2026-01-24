#!/bin/bash
# Docker Deployment Script for Hostel Management System

set -e

echo "==========================================="
echo "Hostel Management System - Docker Deploy"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from template...${NC}"
    cp .env.docker .env
    echo -e "${GREEN}✓ .env file created. Please edit it with your configuration.${NC}"
    echo -e "${YELLOW}⚠ Update SECRET_KEY and DB_PASSWORD before proceeding!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment file found${NC}"

# Stop any running backend server
echo "Stopping local development servers..."
pkill -f "python manage.py runserver" || true
pkill -f "npm start" || true

# Build and start containers
echo "Building Docker images..."
docker compose build

echo "Starting containers..."
docker compose up -d

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 10

# Check health
echo "Checking service health..."
docker compose ps

# Show logs
echo ""
echo "==========================================="
echo "Deployment Complete!"
echo "==========================================="
echo ""
echo -e "${GREEN}Services Running:${NC}"
echo "  Frontend:  http://localhost"
echo "  Backend:   http://localhost:8000/api/"
echo "  Admin:     http://localhost:8000/admin/"
echo "  Database:  localhost:5432"
echo ""
echo "Useful commands:"
echo "  View logs:           docker compose logs -f"
echo "  Stop services:       docker compose down"
echo "  Create admin user:   docker compose exec backend python manage.py createsuperuser"
echo "  Database backup:     docker compose exec db pg_dump -U postgres hostel_management > backup.sql"
echo ""
echo "For more information, see DOCKER_DEPLOYMENT_GUIDE.md"
