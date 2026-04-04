# Sree Lakshmi Ladies Hostel Management System

<!-- Last deployment: 2026-04-04 -->

A comprehensive hostel management system built with Django (Backend) and React (Frontend), fully containerized with Docker.

## Features

- User Management (Admin, Staff, Tenants)
- Branch Management
- Room Allocation & Tracking
- Tenant Information Management
- Rent Payment Tracking
- Password Reset via Email
- Role-Based Access Control

## Tech Stack

- **Backend:** Django 5.2.5, Django REST Framework
- **Frontend:** React 18.2.0
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Containerization:** Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Git

### Deployment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PradeepGovindasamy/SreeLakshmiLadiesHostel.git
   cd SreeLakshmiLadiesHostel
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set your values (SECRET_KEY, EMAIL settings, etc.)
   ```

3. **Start the application:**
   ```bash
   docker compose up -d
   ```

4. **Create superuser:**
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

5. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000/api/
   - Admin Panel: http://localhost:8000/admin/

## Management Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart a service
docker compose restart backend

# Backup database
docker compose exec db pg_dump -U postgres hostel_management > backup.sql
```

## Production Deployment

See deployment guides in the documentation for AWS EC2 setup.

## License

Proprietary - All rights reserved
