# Hostinger VPS Deployment Guide
# VPS: srv1029413.hstgr.cloud
# Domain: aquafarm.cloud

## Pre-deployment Steps

### 1. Get VPS IP Address
```bash
# Method 1: Check Hostinger VPS dashboard
# Method 2: Resolve VPS hostname
dig +short srv1029413.hstgr.cloud

# Method 3: SSH to VPS and get public IP
ssh root@srv1029413.hstgr.cloud "curl -4 ifconfig.me"
```

### 2. Configure DNS Records
1. Log in to Hostinger control panel
2. Go to Domains → aquafarm.cloud → DNS Zone
3. Add these A records (replace YOUR_VPS_IP):

```
aquafarm.cloud           A    YOUR_VPS_IP
www.aquafarm.cloud       A    YOUR_VPS_IP  
api.aquafarm.cloud       A    YOUR_VPS_IP
admin.aquafarm.cloud     A    YOUR_VPS_IP
```

### 3. Wait for DNS Propagation
```bash
# Check DNS propagation (wait until IP shows correctly)
dig aquafarm.cloud +short
dig api.aquafarm.cloud +short
```

## Deployment Steps

### 1. Connect to VPS
```bash
ssh root@srv1029413.hstgr.cloud
```

### 2. Upload Project Files
```bash
# From local machine, upload project
scp -r "f:/Aqua Pro" root@srv1029413.hstgr.cloud:/opt/aquafarm/

# Or clone from git (if using version control)
cd /opt
git clone YOUR_REPOSITORY_URL aquafarm
cd aquafarm
```

### 3. Run Deployment Script
```bash
cd /opt/aquafarm
chmod +x infra/deploy.sh
./infra/deploy.sh
```

### 4. Verify Services
```bash
# Check containers are running
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Check SSL certificates
sudo certbot certificates

# Test endpoints
curl -I https://aquafarm.cloud
curl -I https://api.aquafarm.cloud/health
```

## Post-deployment Configuration

### 1. Database Setup
```bash
# Run database migrations
docker-compose exec backend npm run migration:run

# Seed initial data (optional)
docker-compose exec backend npm run seed
```

### 2. Configure Monitoring
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/aquafarm

# Configure backup cron job
sudo crontab -e
# Add: 0 2 * * * /opt/aquafarm/scripts/backup.sh
```

### 3. Security Hardening
```bash
# Configure firewall
sudo ufw enable
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Setup fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## Troubleshooting

### SSL Certificate Issues
```bash
# Force SSL renewal
sudo certbot renew --force-renewal

# Debug SSL
sudo certbot certificates
sudo nginx -t
```

### Container Issues
```bash
# Restart services
docker-compose down
docker-compose up -d

# Check resource usage
docker stats
```

### DNS Issues
```bash
# Flush DNS cache
sudo systemctl flush-dns

# Check DNS resolution
nslookup aquafarm.cloud
dig aquafarm.cloud
```

### Application Issues
```bash
# Check application logs
docker-compose logs -f --tail=100 backend
docker-compose logs -f --tail=100 frontend

# Access application shell
docker-compose exec backend /bin/bash
docker-compose exec frontend /bin/bash
```

## Monitoring URLs

After successful deployment, these URLs should be accessible:

- **Main Site**: https://aquafarm.cloud
- **API**: https://api.aquafarm.cloud
- **API Health**: https://api.aquafarm.cloud/health  
- **API Docs**: https://api.aquafarm.cloud/api
- **Admin Panel**: https://admin.aquafarm.cloud

## Environment Variables

Production environment variables are configured in:
- `/opt/aquafarm/.env` (backend)
- `/opt/aquafarm/frontend/.env.local` (frontend)

Critical variables:
```bash
DOMAIN=aquafarm.cloud
VPS_HOST=srv1029413.hstgr.cloud  
NODE_ENV=production
DATABASE_URL=postgresql://aquafarm:secure_password@postgres:5432/aquafarm_prod
NEXT_PUBLIC_API_URL=https://api.aquafarm.cloud
HOSTINGER_API_KEY=RO6wIcLPWssb6SAtTCCLxWFtgPF4twQWsHEMqD2U1a099004
```

## Backup & Recovery

### Manual Backup
```bash
cd /opt/aquafarm
./scripts/backup.sh
```

### Restore from Backup
```bash
cd /opt/aquafarm  
./scripts/restore.sh BACKUP_FILENAME
```

## Updates & Maintenance

### Application Updates
```bash
cd /opt/aquafarm
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### SSL Certificate Renewal
```bash
# Auto-renewal is configured, but manual renewal:
sudo certbot renew --nginx
```

## Support

For issues with:
- **VPS**: Contact Hostinger support  
- **Domain**: Use Hostinger domain management
- **Application**: Check logs and documentation

## Quick Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# View logs
docker-compose logs -f SERVICE_NAME

# Update SSL
sudo certbot renew

# Backup database
docker-compose exec postgres pg_dump -U aquafarm aquafarm_prod > backup.sql

# Monitor resources
htop
docker stats
df -h
```