# Hostel Management System - Docker Deployment Guide

This guide explains how to run the complete Hostel Management System using Docker Compose with PostgreSQL database.

## 🏗️ Architecture

The application consists of four containerized services:

1. **PostgreSQL Database** (postgres:15-alpine)
2. **Redis Cache** (redis:7-alpine)
3. **Django Backend** (Python 3.11)
4. **React Frontend** (Node 18 + Nginx)

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB+ free RAM
- 10GB+ free disk space

## 🚀 Quick Start

### 1. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.docker .env
```

Edit `.env` and update these critical values:
```env
SECRET_KEY=your-super-secret-key-minimum-50-characters-long
DB_PASSWORD=your_secure_database_password
```

### 2. Build and Start All Services

```bash
# Build images and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- **Frontend**: http://localhost (or http://localhost:3000)
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

### 4. Create Admin User

```bash
docker-compose exec backend python manage.py createsuperuser
```

## 🔧 Docker Commands

### Managing Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs for a specific service
docker-compose logs -f backend

# Execute commands in a container
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py shell
```

### Database Management

```bash
# Access PostgreSQL shell
docker-compose exec db psql -U postgres -d hostel_management

# Backup database
docker-compose exec db pg_dump -U postgres hostel_management > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres hostel_management < backup.sql

# View database logs
docker-compose logs -f db
```

### Rebuilding Services

```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild all services
docker-compose build --no-cache
docker-compose up -d
```

### Cleaning Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (WARNING: deletes database data)
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all
```

## 📊 Data Persistence

Data is persisted in Docker volumes:

- `hostel-postgres-data` - PostgreSQL database
- `hostel-static-files` - Django static files
- `hostel-media-files` - User uploaded files

View volumes:
```bash
docker volume ls | grep hostel
```

## 🔍 Troubleshooting

### Check Service Health

```bash
docker-compose ps
```

All services should show "healthy" status.

### Backend Won't Start

```bash
# Check backend logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait 30 seconds and retry
# 2. Migration errors - run migrations manually:
docker-compose exec backend python manage.py migrate

# 3. Environment variables - verify .env file
docker-compose exec backend env | grep DB_
```

### Frontend Can't Connect to Backend

```bash
# Check CORS settings
docker-compose exec backend python manage.py shell
>>> from django.conf import settings
>>> print(settings.CORS_ALLOWED_ORIGINS)

# Update CORS_ALLOWED_ORIGINS in .env
```

### Database Connection Issues

```bash
# Test database connection
docker-compose exec backend python manage.py dbshell

# Check PostgreSQL logs
docker-compose logs db

# Verify environment variables
docker-compose exec backend env | grep DB_
```

### Port Conflicts

If ports are already in use:

1. Edit `docker-compose.yml`
2. Change port mappings:
   ```yaml
   ports:
     - "8001:8000"  # Backend
     - "8080:80"    # Frontend
   ```

## 🔐 Security Recommendations

### For Production

1. **Change Default Passwords**
   ```env
   DB_PASSWORD=use_strong_random_password
   SECRET_KEY=generate_unique_50_char_key
   ```

2. **Enable HTTPS**
   ```env
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```

3. **Restrict Access**
   ```env
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   DEBUG=False
   ```

4. **Use Secrets Management**
   - Docker Secrets
   - AWS Secrets Manager
   - HashiCorp Vault

## 📈 Monitoring

### View Resource Usage

```bash
docker stats
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/

# Frontend health
curl http://localhost/

# Database health
docker-compose exec db pg_isready -U postgres
```

## 🔄 Updates and Migrations

### Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Run migrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Database Migrations

```bash
# Create migration
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate

# View migration status
docker-compose exec backend python manage.py showmigrations
```

## 🌐 Production Deployment

For production deployment:

1. Use a reverse proxy (Nginx/Traefik) with SSL
2. Set up automated backups
3. Configure monitoring (Prometheus/Grafana)
4. Use Docker Swarm or Kubernetes for orchestration
5. Implement CI/CD pipeline

See `DEPLOYMENT_GUIDE.md` for detailed production setup.

## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DEBUG | Django debug mode | False | No |
| SECRET_KEY | Django secret key | - | Yes |
| DB_NAME | Database name | hostel_management | No |
| DB_USER | Database user | postgres | No |
| DB_PASSWORD | Database password | postgres | Yes |
| DB_HOST | Database host | db | No |
| DB_PORT | Database port | 5432 | No |
| ALLOWED_HOSTS | Allowed hosts | localhost | Yes |
| CORS_ALLOWED_ORIGINS | CORS origins | http://localhost | Yes |
| REACT_APP_API_URL | Frontend API URL | http://localhost:8000 | Yes |

## 🆘 Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify health: `docker-compose ps`
3. Review documentation
4. Contact support team

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
