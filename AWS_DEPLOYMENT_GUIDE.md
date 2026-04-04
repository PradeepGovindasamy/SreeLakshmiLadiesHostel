# AWS EC2 Deployment Guide with GitHub Actions

## Complete Setup for https://sreelakshmiladieshostel.com/

---

## 📋 Prerequisites

- ✅ EC2 instance created
- ✅ GitHub repository ready
- ✅ Domain: sreelakshmiladieshostel.com

---

## Part 1: EC2 Initial Setup

### Step 1: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2: Install Docker and Docker Compose
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 3: Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 4: Create Application Directory
```bash
mkdir -p ~/sreelakshmi-hostel
cd ~/sreelakshmi-hostel
```

### Step 5: Configure Firewall (EC2 Security Group)
In AWS Console, configure Security Group:
- **SSH (22)**: Your IP only
- **HTTP (80)**: 0.0.0.0/0
- **HTTPS (443)**: 0.0.0.0/0
- **Custom TCP (3000)**: Localhost only (or 0.0.0.0/0 for testing)
- **Custom TCP (8000)**: Localhost only (or 0.0.0.0/0 for testing)

---

## Part 2: Domain Configuration

### Step 1: Point Domain to EC2
In your domain registrar (GoDaddy, Namecheap, etc.):

**A Records:**
```
Type: A
Name: @
Value: YOUR_EC2_PUBLIC_IP
TTL: 600

Type: A
Name: www
Value: YOUR_EC2_PUBLIC_IP
TTL: 600
```

### Step 2: Verify DNS Propagation
```bash
# Wait 5-10 minutes, then check:
nslookup sreelakshmiladieshostel.com
ping sreelakshmiladieshostel.com
```

---

## Part 3: GitHub Secrets Configuration

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

### 1. EC2_SSH_KEY
```
Your private key content (.pem file)
Copy entire content including:
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

### 2. EC2_HOST
```
YOUR_EC2_PUBLIC_IP
Example: 13.232.45.67
```

### 3. EC2_USER
```
ubuntu
(or ec2-user for Amazon Linux)
```

---

## Part 4: Production Environment Setup

### Step 1: Create .env File on EC2
```bash
cd ~/sreelakshmi-hostel
nano .env
```

Copy content from [.env.production](.env.production) and update:

**Required Changes:**
```bash
# Change these:
POSTGRES_PASSWORD=YourStrongPassword123!
SECRET_KEY=django-insecure-GENERATE_50_RANDOM_CHARS
EMAIL_HOST_PASSWORD=your_gmail_app_password

# Keep these:
ALLOWED_HOSTS=sreelakshmiladieshostel.com,www.sreelakshmiladieshostel.com,localhost
CORS_ALLOWED_ORIGINS=https://sreelakshmiladieshostel.com,https://www.sreelakshmiladieshostel.com
FRONTEND_URL=https://sreelakshmiladieshostel.com
```

**Generate Django Secret Key:**
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Step 2: Configure Nginx
```bash
# Copy configuration
sudo cp ~/sreelakshmi-hostel/nginx-production.conf /etc/nginx/sites-available/sreelakshmi

# Create symlink
sudo ln -s /etc/nginx/sites-available/sreelakshmi /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Don't restart yet (SSL setup first)
```

---

## Part 5: SSL Certificate Setup (Let's Encrypt)

### Step 1: Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Obtain SSL Certificate
```bash
sudo certbot --nginx -d sreelakshmiladieshostel.com -d www.sreelakshmiladieshostel.com
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose: **Redirect HTTP to HTTPS (Option 2)**

### Step 3: Verify Auto-Renewal
```bash
sudo certbot renew --dry-run
```

### Step 4: Restart Nginx
```bash
sudo systemctl restart nginx
```

---

## Part 6: First Deployment

### Option A: Manual First Deployment
```bash
cd ~/sreelakshmi-hostel

# Clone repository
git clone https://github.com/PradeepGovindasamy/SreeLakshmiLadiesHostel.git .

# Make script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh
```

### Option B: Deploy via GitHub Actions
```bash
# Push to GitHub main branch
git add .
git commit -m "Setup production deployment"
git push origin main
```

GitHub Actions will automatically:
1. Trigger on push to main
2. Copy files to EC2
3. Run deployment script
4. Start Docker containers

---

## Part 7: Verify Deployment

### Check Container Status
```bash
docker compose ps
```

Expected output:
```
NAME                  STATUS          PORTS
frontend              Up              0.0.0.0:3000->3000/tcp
backend               Up              0.0.0.0:8000->8000/tcp
db                    Up              5432/tcp
redis                 Up              6379/tcp
```

### Check Logs
```bash
docker compose logs -f
```

### Test Access
1. **Public Homepage**: https://sreelakshmiladieshostel.com/
2. **Management Login**: https://sreelakshmiladieshostel.com/login
3. **Backend API**: https://sreelakshmiladieshostel.com/api/
4. **Django Admin**: https://sreelakshmiladieshostel.com/admin/

---

## Part 8: Database Migration & Initial Data

### Run Migrations
```bash
docker compose exec backend python manage.py migrate
```

### Create Superuser
```bash
docker compose exec backend python manage.py createsuperuser
```

### Load Existing Data (if you have backup)
```bash
# Copy your fresh_datadump.json to EC2
scp -i your-key.pem fresh_datadump.json ubuntu@YOUR_EC2_IP:~/sreelakshmi-hostel/

# Load data
docker compose exec backend python manage.py loaddata fresh_datadump.json
```

---

## Part 9: Monitoring & Maintenance

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart backend
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

### Check Disk Space
```bash
df -h
docker system df
```

### Clean Up Old Images
```bash
docker system prune -a
```

---

## Part 10: Troubleshooting

### Issue: Can't connect to domain
**Check:**
```bash
# DNS resolution
nslookup sreelakshmiladieshostel.com

# Nginx status
sudo systemctl status nginx

# Nginx error logs
sudo tail -f /var/log/nginx/sreelakshmi-error.log
```

### Issue: SSL certificate error
**Fix:**
```bash
# Renew certificate
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Containers not starting
**Check:**
```bash
# View errors
docker compose logs

# Check .env file
cat .env

# Restart containers
docker compose down
docker compose up -d
```

### Issue: Database connection error
**Fix:**
```bash
# Check database container
docker compose logs db

# Verify environment variables
docker compose exec backend env | grep DB
```

### Issue: Frontend not loading
**Check:**
```bash
# Check frontend logs
docker compose logs frontend

# Verify build
docker compose build frontend

# Check Nginx proxy
curl http://localhost:3000
```

---

## Part 11: Backup Strategy

### Database Backup
```bash
# Create backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T db pg_dump -U hostel_admin hostel_management > ~/backups/db_backup_$DATE.sql
find ~/backups -name "db_backup_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup-db.sh

# Setup cron job (daily at 2 AM)
crontab -e
# Add: 0 2 * * * ~/backup-db.sh
```

### Application Backup
```bash
# Backup entire application
tar -czf ~/sreelakshmi-backup-$(date +%Y%m%d).tar.gz ~/sreelakshmi-hostel
```

---

## Part 12: GitHub Actions Workflow

Your deployment is now automated! When you:

1. **Make changes** to code locally
2. **Commit and push** to main branch:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **GitHub Actions** automatically:
   - ✅ Checks out code
   - ✅ Connects to EC2 via SSH
   - ✅ Copies updated files
   - ✅ Runs deployment script
   - ✅ Rebuilds containers
   - ✅ Starts services

**Monitor deployment:**
- Go to: **GitHub → Actions tab**
- View real-time logs
- Check deployment status

---

## Quick Reference Commands

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f

# Restart all services
docker compose restart

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Rebuild and restart
docker compose up -d --build

# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check SSL certificate
sudo certbot certificates

# Renew SSL
sudo certbot renew
```

---

## Security Checklist

- [x] Change default passwords in .env
- [x] Generate new SECRET_KEY
- [x] Set DEBUG=False
- [x] Configure ALLOWED_HOSTS
- [x] Enable SSL/HTTPS
- [x] Restrict SSH to your IP
- [x] Keep internal ports (3000, 8000) behind Nginx
- [x] Regular backups
- [x] Update EC2 security groups
- [x] Keep EC2 SSH key secure

---

## Support & Maintenance

### Update Django Backend
```bash
docker compose exec backend python manage.py migrate
docker compose restart backend
```

### Update Frontend
```bash
docker compose build frontend
docker compose restart frontend
```

### Check Application Health
```bash
# Backend health
curl https://sreelakshmiladieshostel.com/api/

# Frontend health  
curl https://sreelakshmiladieshostel.com/
```

---

## Success! 🎉

Your application is now live at:
- **Public Homepage**: https://sreelakshmiladieshostel.com/
- **Management Login**: https://sreelakshmiladieshostel.com/login
- **Admin Panel**: https://sreelakshmiladieshostel.com/admin/

**Automatic deployment is configured** - just push to GitHub main branch!
