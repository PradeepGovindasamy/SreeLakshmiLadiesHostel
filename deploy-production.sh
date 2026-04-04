#!/bin/bash

# Deploy to AWS EC2 Production
# This script runs on EC2 instance after code is copied

set -e

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cat > .env << 'ENVFILE'
# Database Configuration
POSTGRES_DB=hostel_management
POSTGRES_USER=hostel_admin
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
DB_HOST=db
DB_PORT=5432

# Django Configuration
SECRET_KEY=CHANGE_THIS_SECRET_KEY
DEBUG=False
ALLOWED_HOSTS=sreelakshmiladieshostel.com,www.sreelakshmiladieshostel.com,localhost
DJANGO_SETTINGS_MODULE=hostel_admin.settings

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://sreelakshmiladieshostel.com,https://www.sreelakshmiladieshostel.com

# Redis Configuration
REDIS_URL=redis://redis:6379/1

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=sreelakshmiladieshostel91@gmail.com
EMAIL_HOST_PASSWORD=YOUR_APP_PASSWORD
DEFAULT_FROM_EMAIL=sreelakshmiladieshostel91@gmail.com
FRONTEND_URL=https://sreelakshmiladieshostel.com
ENVFILE
    echo "${YELLOW}⚠️  Please update .env with production values!${NC}"
    exit 1
fi

# Pull latest changes (if running from git directly)
# git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Free up port 8000 (Django backend)
echo "🔓 Freeing up port 8000..."
sudo fuser -k 8000/tcp 2>/dev/null || echo "  ℹ️  No process on port 8000"

# Note: We keep nginx running as it's needed for domain/SSL routing
# Docker frontend will use port 3000, nginx will proxy from 80/443 to 3000

# Remove old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Build and start containers
echo "🏗️  Building Docker images..."
docker compose build --no-cache

echo "🚀 Starting containers..."
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "📊 Container Status:"
docker compose ps

# Show logs
echo "📝 Recent logs:"
docker compose logs --tail=50

# Configure and start Nginx for domain access
echo "🔧 Configuring Nginx..."
if [ -f nginx-production.conf ]; then
    sudo cp nginx-production.conf /etc/nginx/sites-available/sreelakshmi-hostel 2>/dev/null || echo "  ℹ️  Nginx config already exists"
    sudo ln -sf /etc/nginx/sites-available/sreelakshmi-hostel /etc/nginx/sites-enabled/ 2>/dev/null || echo "  ℹ️  Symlink already exists"
    
    # Test nginx configuration
    sudo nginx -t && {
        echo "✅ Nginx configuration valid"
        sudo systemctl enable nginx
        sudo systemctl restart nginx
        echo "✅ Nginx started successfully"
    } || {
        echo "${YELLOW}⚠️  Nginx configuration has errors. Please check manually.${NC}"
    }
else
    echo "${YELLOW}⚠️  nginx-production.conf not found. Skipping nginx setup.${NC}"
fi

# Setup SSL if not already done
if [ ! -f /etc/letsencrypt/live/sreelakshmiladieshostel.com/fullchain.pem ]; then
    echo "${YELLOW}⚠️  SSL certificate not found. Please run SSL setup:${NC}"
    echo "sudo certbot --nginx -d sreelakshmiladieshostel.com -d www.sreelakshmiladieshostel.com"
fi

echo "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "🌐 Your application should be accessible at:"
echo "   https://sreelakshmiladieshostel.com"
echo ""
echo "📊 To view logs: docker compose logs -f"
echo "🔄 To restart: docker compose restart"
echo "🛑 To stop: docker compose down"
