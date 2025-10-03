# 🚀 Quick VPS Deployment Guide

## VPS Information

```plaintext
IP Address:  72.60.187.58
Hostname:    srv1029413.hstgr.cloud
Username:    root
Password:    Tariq2024Tariq2026@#
Location:    France - Paris
OS:          Ubuntu 24.04 with Docker
```

---

## 🎯 One Command Deployment

### Step 1: Test Connection

```powershell
cd "f:\Aqua Pro"
.\scripts\test-vps-connection.ps1
```

### Step 2: Deploy Application

```powershell
.\scripts\deploy-to-vps.ps1
```

**Time Required:** 15-20 minutes

---

## ✅ Deployment Process

The script will automatically:

1. ✅ Test SSH connection
2. ✅ Update system packages
3. ✅ Install Docker & Docker Compose
4. ✅ Configure firewall (UFW)
5. ✅ Create project directories
6. ✅ Upload project files
7. ✅ Setup environment variables
8. ✅ Generate SSL certificates
9. ✅ Build and start containers
10. ✅ Verify deployment

---

## 🌐 Access URLs

After successful deployment:

- **Application**: http://72.60.187.58
- **API**: http://72.60.187.58/api
- **API Docs**: http://72.60.187.58/api/docs
- **Health Check**: http://72.60.187.58/health
- **Prometheus**: http://72.60.187.58:9090
- **Grafana**: http://72.60.187.58:3002

---

## 🐳 Docker Services

The deployment includes:

- **PostgreSQL**: Database (port 5432)
- **Redis**: Cache (port 6379)
- **Backend**: NestJS API (port 3000)
- **Frontend**: Next.js (port 3001)
- **Nginx**: Reverse proxy (ports 80, 443)
- **Prometheus**: Metrics (port 9090)
- **Grafana**: Monitoring (port 3002)

---

## 🛠️ Useful Commands

### SSH Connection

```powershell
ssh root@72.60.187.58
```

### View Logs

```bash
cd /root/aquafarm-pro
docker-compose -f docker-compose.hostinger.yml logs -f
```

### Restart Services

```bash
docker-compose -f docker-compose.hostinger.yml restart
```

### Stop Application

```bash
docker-compose -f docker-compose.hostinger.yml down
```

### Start Application

```bash
docker-compose -f docker-compose.hostinger.yml up -d
```

### Check Status

```bash
docker-compose -f docker-compose.hostinger.yml ps
```

---

## 🔐 Default Credentials

### Database

- **Database**: `aquafarm_prod`
- **User**: `aquafarm_user`
- **Password**: `aquafarm_secure_password_123`

### Grafana

- **Username**: `admin`
- **Password**: `grafana_admin_secure_password_123`

⚠️ **Important:** Change all default passwords in production!

---

## 🔧 Post-Deployment Tasks

### 1. Update Domain Configuration

```bash
ssh root@72.60.187.58
cd /root/aquafarm-pro
nano .env
```

Update:
```env
DOMAIN=srv1029413.hstgr.cloud
CORS_ORIGIN=http://srv1029413.hstgr.cloud
NEXT_PUBLIC_API_URL=http://srv1029413.hstgr.cloud/api
```

Restart:
```bash
docker-compose -f docker-compose.hostinger.yml restart
```

### 2. Setup Let's Encrypt SSL

```bash
# Install Certbot
apt install -y certbot

# Get certificate
certbot certonly --standalone -d srv1029413.hstgr.cloud

# Copy certificates
cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/fullchain.pem /root/aquafarm-pro/ssl/cert.pem
cp /etc/letsencrypt/live/srv1029413.hstgr.cloud/privkey.pem /root/aquafarm-pro/ssl/key.pem

# Restart Nginx
docker-compose -f docker-compose.hostinger.yml restart nginx
```

Access via HTTPS: https://srv1029413.hstgr.cloud

### 3. Setup Automated Backups

Create backup script:
```bash
nano /root/backup.sh
```

Add content:
```bash
#!/bin/bash
BACKUP_DIR="/root/aquafarm-pro/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker exec aquafarm-postgres pg_dump -U aquafarm_user aquafarm_prod > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Delete old backups (older than 7 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

Make executable:
```bash
chmod +x /root/backup.sh
```

Schedule (daily at 2 AM):
```bash
crontab -e
# Add:
0 2 * * * /root/backup.sh
```

---

## 🔍 Troubleshooting

### Application Not Opening

```bash
# Check container status
docker-compose -f docker-compose.hostinger.yml ps

# Check logs
docker logs aquafarm-backend --tail 100
docker logs aquafarm-nginx --tail 100
```

### Database Connection Error

```bash
# Check PostgreSQL
docker exec aquafarm-postgres pg_isready -U aquafarm_user

# Check logs
docker logs aquafarm-postgres --tail 100
```

### Port Already in Use

```bash
# Check ports
netstat -tuln | grep -E ':(80|443|3000|3001|5432)'

# Stop old containers
docker stop $(docker ps -aq)

# Restart
docker-compose -f docker-compose.hostinger.yml up -d
```

### Disk Space Full

```bash
# Check space
df -h

# Clean Docker
docker system prune -a --volumes

# Delete old logs
find /root/aquafarm-pro/logs -name "*.log" -mtime +7 -delete
```

---

## 🔄 Update Application

### Method 1: Run Deploy Script Again

```powershell
cd "f:\Aqua Pro"
.\scripts\deploy-to-vps.ps1
```

### Method 2: Manual Update

```powershell
# On local machine
cd "f:\Aqua Pro"
tar -czf aquafarm-update.tar.gz --exclude=node_modules --exclude=.git .
scp aquafarm-update.tar.gz root@72.60.187.58:/root/aquafarm-pro/
```

```bash
# On server
ssh root@72.60.187.58
cd /root/aquafarm-pro
docker-compose -f docker-compose.hostinger.yml down
tar -xzf aquafarm-update.tar.gz
docker-compose -f docker-compose.hostinger.yml up -d --build
```

---

## 📊 Monitoring

### Prometheus Metrics

Access: http://72.60.187.58:9090

Key metrics:
- `http_requests_total`
- `http_request_duration_seconds`
- `nodejs_heap_size_used_bytes`
- `process_cpu_seconds_total`

### Grafana Dashboard

Access: http://72.60.187.58:3002

Login with default credentials (change them!)

---

## 📚 Documentation

- **Arabic Step-by-Step Guide**: [دليل_النشر_خطوة_بخطوة.md](./دليل_النشر_خطوة_بخطوة.md)
- **Arabic Quick Guide**: [دليل_النشر_السريع_VPS.md](./دليل_النشر_السريع_VPS.md)
- **Deployment Scripts**: [scripts/README_DEPLOYMENT.md](./scripts/README_DEPLOYMENT.md)
- **Main README**: [README.md](./README.md)

---

## ✅ Deployment Checklist

- [ ] Application opens in browser
- [ ] API responds: `/health` and `/api`
- [ ] Database is working
- [ ] Redis is working
- [ ] Nginx is working
- [ ] No errors in logs
- [ ] All containers running: `docker-compose ps`
- [ ] Firewall is active: `ufw status`
- [ ] Changed default passwords
- [ ] Setup automated backups
- [ ] SSL certificate configured

---

## 🎉 Success!

Your **AquaFarm Pro** application is now running on VPS! 🐟

---

**Support:**
- 📧 Email: support@aquafarm.pro
- 📚 Documentation: [README.md](./README.md)
- 🐛 Issues: GitHub Issues

**Date:** October 2, 2025
