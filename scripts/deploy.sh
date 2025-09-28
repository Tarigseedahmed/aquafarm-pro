#!/bin/bash

# AquaFarm Pro - Deployment Script for Hostinger VPS
# Domain: aquafarm.cloud
# VPS: srv1029413.hstgr.cloud

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="aquafarm.cloud"
VPS_HOST="srv1029413.hstgr.cloud"
DEPLOY_PATH="/opt/aquafarm-pro"
BACKUP_PATH="/opt/backups/aquafarm"
NGINX_CONFIG_PATH="/etc/nginx/sites-available"
SSL_PATH="/etc/nginx/ssl"

echo -e "${BLUE}🚀 Starting AquaFarm Pro deployment to $VPS_HOST${NC}"
echo -e "${BLUE}📍 Domain: $DOMAIN${NC}"
echo "=================================================="

# Function to print step headers
print_step() {
    echo -e "\n${BLUE}📋 Step $1: $2${NC}"
    echo "----------------------------------------"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create backup
create_backup() {
    if [ -d "$DEPLOY_PATH" ]; then
        print_step "BACKUP" "Creating backup of existing installation"
        
        BACKUP_FILE="$BACKUP_PATH/aquafarm_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        mkdir -p "$BACKUP_PATH"
        
        echo "Creating backup: $BACKUP_FILE"
        tar -czf "$BACKUP_FILE" -C "$(dirname $DEPLOY_PATH)" "$(basename $DEPLOY_PATH)"
        
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_step "1" "Installing system dependencies"
    
    # Update system
    echo "Updating system packages..."
    apt update && apt upgrade -y
    
    # Install essential packages
    echo "Installing essential packages..."
    apt install -y curl wget git unzip nginx certbot python3-certbot-nginx
    
    # Install Docker if not exists
    if ! command_exists docker; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        systemctl start docker
        systemctl enable docker
        usermod -aG docker $USER
    else
        echo -e "${GREEN}✅ Docker already installed${NC}"
    fi
    
    # Install Docker Compose if not exists
    if ! command_exists docker-compose; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    else
        echo -e "${GREEN}✅ Docker Compose already installed${NC}"
    fi
    
    # Install Node.js (for local development/debugging)
    if ! command_exists node; then
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    else
        echo -e "${GREEN}✅ Node.js already installed${NC}"
    fi
    
    echo -e "${GREEN}✅ All dependencies installed${NC}"
}

# Function to setup project directory
setup_project() {
    print_step "2" "Setting up project directory"
    
    # Create deployment directory
    mkdir -p "$DEPLOY_PATH"
    cd "$DEPLOY_PATH"
    
    # Clone or update repository (replace with actual repo URL)
    if [ -d ".git" ]; then
        echo "Updating existing repository..."
        git pull origin main
    else
        echo "Cloning repository..."
        # Replace with actual repository URL
        # git clone https://github.com/your-username/aquafarm-pro.git .
        echo -e "${YELLOW}⚠️  Please manually copy project files to $DEPLOY_PATH${NC}"
    fi
    
    echo -e "${GREEN}✅ Project directory setup complete${NC}"
}

# Function to configure environment
configure_environment() {
    print_step "3" "Configuring environment variables"
    
    cd "$DEPLOY_PATH"
    
    # Create production environment file
    if [ ! -f ".env.production" ]; then
        echo "Creating production environment file..."
        cat > .env.production << EOL
# Production Configuration for AquaFarm Pro
NODE_ENV=production
PORT=3000

# Domain & VPS
DOMAIN=aquafarm.cloud
VPS_HOST=srv1029413.hstgr.cloud

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=aquapro_prod
DB_USER=aquafarm_user
DB_PASSWORD=\${RANDOM_DB_PASSWORD}

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=\${RANDOM_REDIS_PASSWORD}

# JWT Secret
JWT_SECRET=\${RANDOM_JWT_SECRET}
JWT_EXPIRES_IN=24h
REFRESH_EXPIRES_IN=7d

# Hostinger API
HOSTINGER_API_KEY=RO6wIcLPWssb6SAtTCCLxWFtgPF4twQWsHEMqD2U1a099004

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.aquafarm.cloud
NEXT_PUBLIC_APP_URL=https://aquafarm.cloud
CORS_ORIGIN=https://aquafarm.cloud

# Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@aquafarm.cloud
SMTP_PASS=\${EMAIL_PASSWORD}

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=\${RANDOM_SESSION_SECRET}

# Monitoring
ENABLE_LOGGING=true
LOG_LEVEL=info

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
EOL
        
        # Generate random passwords
        DB_PASSWORD=$(openssl rand -base64 32)
        REDIS_PASSWORD=$(openssl rand -base64 32)
        JWT_SECRET=$(openssl rand -base64 64)
        SESSION_SECRET=$(openssl rand -base64 32)
        
        # Replace placeholders
        sed -i "s/\${RANDOM_DB_PASSWORD}/$DB_PASSWORD/g" .env.production
        sed -i "s/\${RANDOM_REDIS_PASSWORD}/$REDIS_PASSWORD/g" .env.production
        sed -i "s/\${RANDOM_JWT_SECRET}/$JWT_SECRET/g" .env.production
        sed -i "s/\${RANDOM_SESSION_SECRET}/$SESSION_SECRET/g" .env.production
        
        echo -e "${GREEN}✅ Environment file created${NC}"
    else
        echo -e "${YELLOW}⚠️  Environment file already exists${NC}"
    fi
    
    # Copy to .env for docker-compose
    cp .env.production .env
}

# Function to setup SSL certificates
setup_ssl() {
    print_step "4" "Setting up SSL certificates"
    
    # Create SSL directory
    mkdir -p "$SSL_PATH"
    
    # Check if certificates already exist
    if [ -f "$SSL_PATH/aquafarm.cloud.crt" ]; then
        echo -e "${GREEN}✅ SSL certificates already exist${NC}"
        return
    fi
    
    # Stop nginx if running
    systemctl stop nginx 2>/dev/null || true
    
    # Get SSL certificates using certbot
    echo "Obtaining SSL certificates for $DOMAIN..."
    certbot certonly --standalone \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        -d "api.$DOMAIN" \
        -d "admin.$DOMAIN" \
        --agree-tos \
        --no-eff-email \
        --email "admin@$DOMAIN"
    
    # Copy certificates to nginx SSL directory
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_PATH/aquafarm.cloud.crt"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_PATH/aquafarm.cloud.key"
        chmod 644 "$SSL_PATH/aquafarm.cloud.crt"
        chmod 600 "$SSL_PATH/aquafarm.cloud.key"
        echo -e "${GREEN}✅ SSL certificates configured${NC}"
    else
        echo -e "${RED}❌ Failed to obtain SSL certificates${NC}"
        # Create self-signed certificates as fallback
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_PATH/aquafarm.cloud.key" \
            -out "$SSL_PATH/aquafarm.cloud.crt" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
        echo -e "${YELLOW}⚠️  Using self-signed certificates${NC}"
    fi
}

# Function to configure nginx
configure_nginx() {
    print_step "5" "Configuring Nginx"
    
    # Copy nginx configuration
    cp "$DEPLOY_PATH/infra/nginx/aquafarm.conf" "$NGINX_CONFIG_PATH/aquafarm.cloud"
    
    # Remove default nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Enable aquafarm site
    ln -sf "$NGINX_CONFIG_PATH/aquafarm.cloud" /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    if nginx -t; then
        echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    else
        echo -e "${RED}❌ Nginx configuration error${NC}"
        exit 1
    fi
}

# Function to deploy application
deploy_application() {
    print_step "6" "Deploying application"
    
    cd "$DEPLOY_PATH"
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Pull latest images
    echo "Pulling Docker images..."
    docker-compose pull
    
    # Build and start containers
    echo "Building and starting containers..."
    docker-compose up -d --build
    
    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 30
    
    # Check container status
    docker-compose ps
    
    echo -e "${GREEN}✅ Application deployed${NC}"
}

# Function to setup database
setup_database() {
    print_step "7" "Setting up database"
    
    cd "$DEPLOY_PATH"
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    timeout=60
    while ! docker-compose exec postgres pg_isready -U postgres >/dev/null 2>&1; do
        timeout=$((timeout - 1))
        if [ $timeout -eq 0 ]; then
            echo -e "${RED}❌ PostgreSQL failed to start${NC}"
            exit 1
        fi
        sleep 1
    done
    
    # Run database migrations
    echo "Running database migrations..."
    docker-compose exec backend npm run migration:run || true
    
    # Seed initial data
    echo "Seeding initial data..."
    docker-compose exec backend npm run seed:prod || true
    
    echo -e "${GREEN}✅ Database setup complete${NC}"
}

# Function to start services
start_services() {
    print_step "8" "Starting services"
    
    # Start and enable nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Setup automatic SSL renewal
    echo "Setting up SSL certificate auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    
    # Setup log rotation
    cat > /etc/logrotate.d/aquafarm << EOL
/var/log/nginx/aquafarm-*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOL
    
    echo -e "${GREEN}✅ All services started${NC}"
}

# Function to verify deployment
verify_deployment() {
    print_step "9" "Verifying deployment"
    
    # Check if domain resolves to this server
    echo "Checking domain resolution..."
    if command_exists dig; then
        RESOLVED_IP=$(dig +short "$DOMAIN")
        CURRENT_IP=$(curl -s http://checkip.amazonaws.com/ || curl -s http://ipecho.net/plain)
        
        if [ "$RESOLVED_IP" = "$CURRENT_IP" ]; then
            echo -e "${GREEN}✅ Domain correctly resolves to this server${NC}"
        else
            echo -e "${YELLOW}⚠️  Domain may not resolve to this server yet${NC}"
            echo "    Resolved IP: $RESOLVED_IP"
            echo "    Current IP:  $CURRENT_IP"
        fi
    fi
    
    # Test HTTP endpoints
    echo "Testing application endpoints..."
    
    # Test health endpoint
    if curl -f -s http://localhost/health >/dev/null; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint not responding${NC}"
    fi
    
    # Test API endpoint
    if curl -f -s http://localhost:3000/api >/dev/null; then
        echo -e "${GREEN}✅ API endpoint working${NC}"
    else
        echo -e "${YELLOW}⚠️  API endpoint may not be ready yet${NC}"
    fi
    
    # Test frontend
    if curl -f -s http://localhost:3001 >/dev/null; then
        echo -e "${GREEN}✅ Frontend working${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend may not be ready yet${NC}"
    fi
    
    echo -e "${GREEN}✅ Deployment verification complete${NC}"
}

# Function to show summary
show_summary() {
    echo ""
    echo "=================================================="
    echo -e "${GREEN}🎉 AquaFarm Pro Deployment Complete!${NC}"
    echo "=================================================="
    echo ""
    echo "📍 Application URLs:"
    echo "   🌐 Main site:    https://$DOMAIN"
    echo "   🔌 API:          https://api.$DOMAIN"
    echo "   📊 Admin:        https://admin.$DOMAIN"
    echo "   📖 API Docs:     https://api.$DOMAIN/docs"
    echo ""
    echo "🖥️  Server Information:"
    echo "   🏠 VPS Host:     $VPS_HOST"
    echo "   📂 Deploy Path: $DEPLOY_PATH"
    echo "   🔒 SSL Path:     $SSL_PATH"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View logs:       docker-compose -f $DEPLOY_PATH/docker-compose.yml logs -f"
    echo "   Restart app:     docker-compose -f $DEPLOY_PATH/docker-compose.yml restart"
    echo "   Check status:    docker-compose -f $DEPLOY_PATH/docker-compose.yml ps"
    echo "   Update app:      cd $DEPLOY_PATH && git pull && docker-compose up -d --build"
    echo ""
    echo "📞 Support:"
    echo "   📧 Email:        support@aquafarm.cloud"
    echo "   📚 Docs:         https://aquafarm.cloud/docs"
    echo ""
    echo -e "${BLUE}Happy farming! 🐟🌊${NC}"
}

# Main execution
main() {
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Please run this script as root (sudo)${NC}"
        exit 1
    fi
    
    # Create backup first
    create_backup
    
    # Execute deployment steps
    install_dependencies
    setup_project
    configure_environment
    setup_ssl
    configure_nginx
    deploy_application
    setup_database
    start_services
    verify_deployment
    show_summary
    
    echo -e "${GREEN}🚀 Deployment completed successfully!${NC}"
}

# Run main function
main "$@"