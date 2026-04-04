# Environment Variables Configuration Guide

## 📝 How It Works

### Development (Local)
When running `npm start`, React automatically uses `.env.local` or `.env`:
- API URL: `http://127.0.0.1:8000` (your local Django server)

### Production (AWS Cloud)
When running `npm run build`, React uses `.env.production`:
- API URL: Your AWS backend URL (EC2 IP or domain)

---

## 🚀 AWS Deployment Scenarios

### Scenario 1: EC2 with Public IP
```bash
# .env.production
REACT_APP_API_URL=http://54.123.45.67:8000
```

### Scenario 2: EC2 with Domain (Recommended)
```bash
# .env.production
REACT_APP_API_URL=https://api.yourhostel.com

# With subdomain:
REACT_APP_API_URL=https://hostel-api.yourdomain.com
```

### Scenario 3: Backend and Frontend on Same EC2
```bash
# .env.production
REACT_APP_API_URL=http://localhost:8000

# Or use relative path in nginx config
REACT_APP_API_URL=/api
```

---

## 🔧 How to Configure for Your Deployment

### Step 1: During AWS Setup
After deploying backend to EC2, note your:
- Public IP: e.g., `54.123.45.67`
- Or Domain: e.g., `yourhostel.com`

### Step 2: Update `.env.production`
```bash
# If using IP:
REACT_APP_API_URL=http://54.123.45.67:8000

# If using domain:
REACT_APP_API_URL=https://api.yourhostel.com
```

### Step 3: Build React App
```bash
npm run build
```
This creates optimized build in `build/` folder with correct API URL.

### Step 4: Deploy Build Folder
Upload `build/` folder to:
- S3 + CloudFront, or
- EC2 (served by Nginx), or
- Netlify/Vercel

---

## 🌐 Typical AWS Architecture URLs

### Architecture 1: Separate Servers
```
Frontend: https://yourhostel.com (S3 + CloudFront)
Backend:  https://api.yourhostel.com (EC2)
```

### Architecture 2: Single EC2 (Cost-Effective)
```
Domain: https://yourhostel.com
  ├─ / → React app (Nginx)
  └─ /api → Django backend (Nginx proxy to :8000)
```

In this case:
```bash
# .env.production
REACT_APP_API_URL=https://yourhostel.com/api
```

---

## 📋 Configuration Examples

### Example 1: Your GoDaddy Domain Setup
```bash
# .env.production
REACT_APP_API_URL=https://api.yourhostel.com
```

**DNS Configuration (GoDaddy):**
```
A Record: api.yourhostel.com → EC2 Public IP (54.x.x.x)
A Record: yourhostel.com → CloudFront or EC2 IP
```

### Example 2: Direct EC2 IP (Testing)
```bash
# .env.production
REACT_APP_API_URL=http://54.123.45.67:8000
```

⚠️ **Warning**: Use HTTPS in production for security!

---

## 🔒 Security: CORS Configuration

When you deploy, update Django CORS settings:

```python
# backend/hostel_admin/settings.py

# Development
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    # Production - specify your frontend domain
    CORS_ALLOWED_ORIGINS = [
        'https://yourhostel.com',
        'https://www.yourhostel.com',
    ]
```

---

## 🧪 Testing Different Environments

### Test Local:
```bash
npm start
# Uses .env.local → http://127.0.0.1:8000
```

### Test Production Build Locally:
```bash
npm run build
npx serve -s build
# Uses .env.production → Your cloud URL
```

### Override for Testing:
```bash
REACT_APP_API_URL=http://test-server:8000 npm start
```

---

## 📝 Checklist for Cloud Deployment

- [ ] Backend deployed to EC2 with public IP/domain
- [ ] `.env.production` updated with backend URL
- [ ] Django CORS settings updated with frontend domain
- [ ] React app built: `npm run build`
- [ ] Build folder deployed to hosting
- [ ] DNS configured (if using custom domain)
- [ ] SSL certificate configured (Let's Encrypt)
- [ ] Test API calls from frontend

---

## 🔍 Troubleshooting

### Issue: API calls fail with CORS error
**Solution**: Update Django CORS_ALLOWED_ORIGINS

### Issue: API calls to wrong URL
**Solution**: Check `console.log` in browser DevTools for actual API_BASE_URL

### Issue: Environment variable not working
**Solution**: Restart React dev server after changing .env files

### Issue: Production build using wrong URL
**Solution**: Verify `.env.production` exists and rebuild: `npm run build`

---

## 💡 Pro Tip: Environment Detection

The code automatically detects environment:
- `localhost` → Uses local backend
- Production domain → Uses cloud backend
- Fallback → Uses REACT_APP_API_URL

This means minimal configuration changes needed!
