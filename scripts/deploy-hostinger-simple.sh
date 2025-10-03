#!/bin/bash

# AquaFarm Pro Simple Hostinger Deployment Script
# This script provides a simplified deployment process for Hostinger VPS

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
SSH_USER="root"
SSH_HOST="srv1029413.hstgr.cloud"
SSH_PORT="22"
DEPLOY_PATH="/home/$SSH_USER/aquafarm-pro"

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

# Main deployment function
deploy_to_hostinger() {
    log_info "Starting AquaFarm Pro deployment to Hostinger..."
    
    # Step 1: Test SSH connection
    log_info "Testing SSH connection..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" exit 2>/dev/null; then
        log_error "SSH connection failed. Please check your SSH credentials."
        log_info "Make sure you have SSH access to $SSH_USER@$SSH_HOST"
        exit 1
    fi
    log_success "SSH connection successful"
    
    # Step 2: Setup server environment
    log_info "Setting up server environment..."
    ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << 'EOF'
        # Update system
        apt update && apt upgrade -y
        
        # Install Docker if not installed
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            usermod -aG docker $USER
            systemctl enable docker
            systemctl start docker
        fi
        
        # Install Docker Compose if not installed
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
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
        
        echo "Server setup completed"
EOF
    log_success "Server environment setup completed"
    
    # Step 3: Upload project files
    log_info "Uploading project files..."
    
    # Create temporary archive excluding unnecessary files
    log_info "Creating project archive..."
    tar -czf aquafarm-pro-deploy.tar.gz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='.env*' \
        --exclude='uploads/*' \
        --exclude='logs/*' \
        --exclude='backups/*' \
        --exclude='*.tar.gz' \
        .
    
    # Upload archive
    log_info "Uploading to server..."
    scp -P "$SSH_PORT" aquafarm-pro-deploy.tar.gz "$SSH_USER@$SSH_HOST:$DEPLOY_PATH/"
    
    # Extract on server
    log_info "Extracting files on server..."
    ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        tar -xzf aquafarm-pro-deploy.tar.gz
        rm aquafarm-pro-deploy.tar.gz
        echo "Files extracted successfully"
EOF
    
    # Clean up local archive
    rm aquafarm-pro-deploy.tar.gz
    log_success "Project files uploaded successfully"
    
    # Step 4: Setup environment variables
    log_info "Setting up environment variables..."
    ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Copy environment file
        cp env.hostinger.production .env
        
        echo "Environment variables configured"
EOF
    log_success "Environment variables setup completed"
    
    # Step 5: Setup SSL certificates (self-signed for initial setup)
    log_info "Setting up SSL certificates..."
    ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH/ssl
        
        # Generate self-signed certificate for initial setup
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout key.pem \
            -out cert.pem \
            -subj "/C=US/ST=State/L=City/O=AquaFarm/CN=$DOMAIN"
        
        # Set proper permissions
        chmod 600 key.pem
        chmod 644 cert.pem
        
        echo "SSL certificates generated"
EOF
    log_success "SSL certificates setup completed"
    
    # Step 6: Deploy application
    log_info "Building and deploying application..."
    ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Stop existing containers if any
        docker-compose -f docker-compose.hostinger.yml down || true
        
        # Build and start services
        docker-compose -f docker-compose.hostinger.yml up -d --build
        
        # Wait for services to be ready
        echo "Waiting for services to start..."
        sleep 60
        
        # Check if services are running
        docker-compose -f docker-compose.hostinger.yml ps
        
        echo "Application deployed successfully"
EOF
    log_success "Application deployed successfully"
    
    # Step 7: Run health checks
    log_info "Running health checks..."
    ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
        cd $DEPLOY_PATH
        
        # Check if containers are running
        echo "=== Container Status ==="
        docker-compose -f docker-compose.hostinger.yml ps
        
        # Wait a bit more for services to be fully ready
        sleep 30
        
        # Check application health
        echo "=== Application Health ==="
        curl -f http://localhost/health || echo "Health check failed"
        
        echo "Health checks completed"
EOF
    log_success "Health checks completed"
    
    # Step 8: Show deployment information
    show_deployment_info
}

# Show deployment information
show_deployment_info() {
    log_info "Deployment Information:"
    echo "=========================="
    echo "Project: $PROJECT_NAME"
    echo "Domain: $DOMAIN"
    echo "SSH Host: $SSH_USER@$SSH_HOST:$SSH_PORT"
    echo "Deploy Path: $DEPLOY_PATH"
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
    echo "SSH to server: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "View logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml logs -f'"
    echo "Restart services: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.hostinger.yml restart'"
    echo ""
    
    log_warning "Important Security Notes:"
    echo "=============================="
    echo "1. Change default passwords in .env file"
    echo "2. Configure Let's Encrypt SSL certificates"
    echo "3. Configure firewall rules"
    echo "4. Regular security updates"
    echo "5. Monitor application logs"
    echo ""
    
    log_info "Next Steps:"
    echo "============"
    echo "1. Configure your domain DNS to point to the server IP"
    echo "2. Update SSL certificates with Let's Encrypt"
    echo "3. Test all application features"
    echo "4. Configure monitoring and alerting"
    echo "5. Set up regular backups"
}

# Main function
main() {
    log_info "AquaFarm Pro Hostinger Deployment"
    log_info "================================="
    log_info "Domain: $DOMAIN"
    log_info "Server: $SSH_USER@$SSH_HOST:$SSH_PORT"
    log_info "Deploy Path: $DEPLOY_PATH"
    echo ""
    
    # Confirm deployment
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled."
        exit 0
    fi
    
    deploy_to_hostinger
    
    log_success "Deployment completed successfully!"
    log_info "Your AquaFarm Pro application is now running at: https://$DOMAIN"
}

# Run main function
main "$@"
