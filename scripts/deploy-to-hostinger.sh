#!/bin/bash

# AquaFarm Pro Hostinger Deployment Script
# This script automates the deployment of AquaFarm Pro to Hostinger VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="aquafarm-pro"
DOMAIN="srv1029413.hstgr.cloud"
SSH_USER=""
SSH_HOST=""
SSH_PORT="22"
DEPLOY_PATH="/home/$SSH_USER/aquafarm-pro"
VERSION="latest"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command -v ssh &> /dev/null; then
        missing_deps+=("ssh")
    fi
    
    if ! command -v scp &> /dev/null; then
        missing_deps+=("scp")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and try again"
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --ssh-user)
                SSH_USER="$2"
                shift 2
                ;;
            --ssh-host)
                SSH_HOST="$2"
                shift 2
                ;;
            --ssh-port)
                SSH_PORT="$2"
                shift 2
                ;;
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help message
show_help() {
    cat << EOF
AquaFarm Pro Hostinger Deployment Script

Usage: $0 [OPTIONS]

Options:
    --ssh-user USER     SSH username for Hostinger VPS
    --ssh-host HOST     SSH hostname or IP for Hostinger VPS
    --ssh-port PORT     SSH port (default: 22)
    --domain DOMAIN     Domain name (default: srv1029413.hstgr.cloud)
    --version VERSION   Application version (default: latest)
    --help              Show this help message

Examples:
    $0 --ssh-user root --ssh-host srv1029413.hstgr.cloud
    $0 --ssh-user root --ssh-host 123.456.789.0 --domain mydomain.com
    $0 --ssh-user root --ssh-host srv1029413.hstgr.cloud --version v1.0.0

EOF
}

# Validate configuration
validate_config() {
    log_info "Validating configuration..."
    
    if [ -z "$SSH_USER" ]; then
        log_error "SSH username is required"
        exit 1
    fi
    
    if [ -z "$SSH_HOST" ]; then
        log_error "SSH host is required"
        exit 1
    fi
    
    log_success "Configuration is valid"
}

# Test SSH connection
test_ssh_connection() {
    log_info "Testing SSH connection to $SSH_USER@$SSH_HOST:$SSH_PORT..."
    
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" exit; then
        log_success "SSH connection successful"
    else
        log_error "SSH connection failed"
        log_info "Please check your SSH credentials and try again"
        exit 1
    fi
}

# Setup server environment
setup_server() {
    log_info "Setting up server environment..."
    
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << 'EOF'
        # Update system
        apt update && apt upgrade -y
        
        # Install Docker
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            usermod -aG docker $USER
            systemctl enable docker
            systemctl start docker
        fi
        
        # Install Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # Install additional tools
        apt install -y curl wget git htop nano
        
        # Create project directory
        mkdir -p /home/$USER/aquafarm-pro
        
        # Create necessary directories
        mkdir -p /home/$USER/aquafarm-pro/uploads
        mkdir -p /home/$USER/aquafarm-pro/logs
        mkdir -p /home/$USER/aquafarm-pro/backups
        mkdir -p /home/$USER/aquafarm-pro/ssl
        
        # Set proper permissions
        chmod 755 /home/$USER/aquafarm-pro
        chmod 755 /home/$USER/aquafarm-pro/uploads
        chmod 755 /home/$USER/aquafarm-pro/logs
        chmod 755 /home/$USER/aquafarm-pro/backups
        chmod 700 /home/$USER/aquafarm-pro/ssl
        
        echo "Server setup completed successfully"
EOF
    
    log_success "Server environment setup completed"
}

# Upload project files
upload_files() {
    log_info "Uploading project files..."
    
    # Create temporary archive
    log_info "Creating project archive..."
    tar -czf aquafarm-pro.tar.gz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='.env*' \
        --exclude='uploads/*' \
        --exclude='logs/*' \
        --exclude='backups/*' \
        .
    
    # Upload archive
    log_info "Uploading to server..."
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -P "$SSH_PORT" aquafarm-pro.tar.gz "$SSH_USER@$SSH_HOST:$DEPLOY_PATH/"
    
    # Extract on server
    log_info "Extracting files on server..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        tar -xzf aquafarm-pro.tar.gz
        rm aquafarm-pro.tar.gz
        echo "Files extracted successfully"
EOF
    
    # Clean up local archive
    rm aquafarm-pro.tar.gz
    
    log_success "Project files uploaded successfully"
}

# Setup environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Create .env file
        cat > .env << 'ENVEOF'
# AquaFarm Pro Environment Variables
NODE_ENV=production
DOMAIN=$DOMAIN

# Database Configuration
DB_NAME=aquafarm_prod
DB_USER=aquafarm_user
DB_PASSWORD=aquafarm_password123
DB_HOST=postgres
DB_PORT=5432

# Redis Configuration
REDIS_PASSWORD=redis_password123

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_1234567890
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_1234567890

# Security Configuration
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=https://$DOMAIN

# Monitoring Configuration
GRAFANA_ADMIN_PASSWORD=admin123

# File Upload Configuration
MAX_FILE_SIZE=10485760

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=10000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Next.js Configuration
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_APP_NAME=AquaFarm Pro
ENVEOF

        echo "Environment variables configured"
EOF
    
    log_success "Environment variables setup completed"
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH/ssl
        
        # Install certbot if not installed
        if ! command -v certbot &> /dev/null; then
            apt install -y certbot
        fi
        
        # Generate self-signed certificate for initial setup
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout key.pem \
            -out cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
        
        # Set proper permissions
        chmod 600 key.pem
        chmod 644 cert.pem
        
        echo "SSL certificates generated"
EOF
    
    log_success "SSL certificates setup completed"
}

# Build and deploy application
deploy_application() {
    log_info "Building and deploying application..."
    
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Stop existing containers
        docker-compose -f docker-compose.hostinger.yml down || true
        
        # Remove old images
        docker system prune -f || true
        
        # Build and start services
        docker-compose -f docker-compose.hostinger.yml up -d --build
        
        # Wait for services to be ready
        echo "Waiting for services to start..."
        sleep 30
        
        # Check if services are running
        docker-compose -f docker-compose.hostinger.yml ps
        
        echo "Application deployed successfully"
EOF
    
    log_success "Application deployed successfully"
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Wait for monitoring services to be ready
        sleep 60
        
        # Check monitoring services
        docker-compose -f docker-compose.hostinger.yml logs prometheus | tail -10
        docker-compose -f docker-compose.hostinger.yml logs grafana | tail -10
        
        echo "Monitoring setup completed"
EOF
    
    log_success "Monitoring setup completed"
}

# Setup backup
setup_backup() {
    log_info "Setting up backup..."
    
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Create backup script
        cat > backup.sh << 'BACKUPEOF'
#!/bin/bash
# AquaFarm Pro Backup Script

BACKUP_DIR="/home/\$USER/aquafarm-pro/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p \$BACKUP_DIR

# Database backup
docker exec aquafarm-postgres pg_dump -U aquafarm_user -d aquafarm_prod > \$BACKUP_DIR/database_\$DATE.sql

# Redis backup
docker exec aquafarm-redis redis-cli --rdb \$BACKUP_DIR/redis_\$DATE.rdb

# Files backup
tar -czf \$BACKUP_DIR/files_\$DATE.tar.gz uploads/ logs/

# Clean old backups (keep last 7 days)
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
BACKUPEOF

        chmod +x backup.sh
        
        # Add to crontab for daily backups at 2 AM
        (crontab -l 2>/dev/null; echo "0 2 * * * cd $DEPLOY_PATH && ./backup.sh") | crontab -
        
        echo "Backup setup completed"
EOF
    
    log_success "Backup setup completed"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Check if containers are running
        echo "=== Container Status ==="
        docker-compose -f docker-compose.hostinger.yml ps
        
        # Check application health
        echo "=== Application Health ==="
        sleep 10
        curl -f http://localhost/health || echo "Health check failed"
        
        # Check backend health
        echo "=== Backend Health ==="
        curl -f http://localhost:3000/health || echo "Backend health check failed"
        
        # Check frontend health
        echo "=== Frontend Health ==="
        curl -f http://localhost:3001/api/health || echo "Frontend health check failed"
        
        echo "Health checks completed"
EOF
    
    log_success "Health checks completed"
}

# Show deployment information
show_deployment_info() {
    log_info "Deployment Information:"
    echo "=========================="
    echo "Project: $PROJECT_NAME"
    echo "Domain: $DOMAIN"
    echo "SSH Host: $SSH_USER@$SSH_HOST:$SSH_PORT"
    echo "Deploy Path: $DEPLOY_PATH"
    echo "Version: $VERSION"
    echo ""
    
    log_info "Access URLs:"
    echo "============="
    echo "Main Application: https://$DOMAIN"
    echo "API: https://$DOMAIN/api"
    echo "Admin Panel: https://$DOMAIN/admin"
    echo "Grafana: https://$DOMAIN/grafana"
    echo "Prometheus: https://$DOMAIN/prometheus"
    echo ""
    
    log_info "Useful Commands:"
    echo "=================="
    echo "SSH to server: ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "View logs: ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml logs -f'"
    echo "Restart services: ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml restart'"
    echo "Update application: ./scripts/deploy-to-hostinger.sh --ssh-user $SSH_USER --ssh-host $SSH_HOST --ssh-port $SSH_PORT"
    echo ""
    
    log_info "Next Steps:"
    echo "============"
    echo "1. Configure your domain DNS to point to the server IP"
    echo "2. Update SSL certificates with Let's Encrypt"
    echo "3. Configure monitoring and alerting"
    echo "4. Test all application features"
    echo "5. Set up regular backups"
    echo ""
    
    log_warning "Important Security Notes:"
    echo "=============================="
    echo "1. Change default passwords in .env file"
    echo "2. Configure firewall rules"
    echo "3. Enable SSH key authentication"
    echo "4. Regular security updates"
    echo "5. Monitor application logs"
}

# Main function
main() {
    log_info "Starting AquaFarm Pro Hostinger Deployment..."
    
    check_dependencies
    parse_arguments "$@"
    validate_config
    test_ssh_connection
    setup_server
    upload_files
    setup_environment
    setup_ssl
    deploy_application
    setup_monitoring
    setup_backup
    run_health_checks
    show_deployment_info
    
    log_success "Deployment completed successfully!"
    log_info "Your AquaFarm Pro application is now running at: https://$DOMAIN"
}

# Run main function
main "$@"
