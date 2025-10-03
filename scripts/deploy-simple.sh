#!/bin/bash
# =================================
# AquaFarm Pro - Simple Deployment Script
# =================================

set -e  # Exit on any error

echo "🚀 Starting AquaFarm Pro deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Installing..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

print_info "Docker and Docker Compose are ready"

# Create necessary directories
print_info "Creating directories..."
mkdir -p uploads logs backups infra/nginx/ssl

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating .env file from env.production..."
    cp env.production .env
    print_warning "Please review and update .env file with your settings"
fi

# Stop any existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.hostinger.yml down || true

# Pull latest images
print_info "Pulling latest images..."
docker-compose -f docker-compose.hostinger.yml pull

# Build custom images
print_info "Building custom images..."
docker-compose -f docker-compose.hostinger.yml build

# Start database and Redis first
print_info "Starting database and Redis..."
docker-compose -f docker-compose.hostinger.yml up -d postgres redis

# Wait for database to be ready
print_info "Waiting for database to be ready..."
sleep 10

# Check database health
for i in {1..30}; do
    if docker-compose -f docker-compose.hostinger.yml exec postgres pg_isready -U aquafarm_user -d aquafarm_prod &> /dev/null; then
        print_success "Database is ready!"
        break
    fi
    print_info "Waiting for database... ($i/30)"
    sleep 2
done

# Run database migrations
print_info "Running database migrations..."
docker-compose -f docker-compose.hostinger.yml run --rm backend npm run migration:run

# Start all services
print_info "Starting all services..."
docker-compose -f docker-compose.hostinger.yml up -d

# Wait for services to be ready
print_info "Waiting for services to start..."
sleep 15

# Check service health
print_info "Checking service health..."

# Check if containers are running
if docker-compose -f docker-compose.hostinger.yml ps | grep -q "Up"; then
    print_success "Containers are running!"
else
    print_error "Some containers failed to start"
    docker-compose -f docker-compose.hostinger.yml ps
    exit 1
fi

# Test health endpoint
print_info "Testing health endpoint..."
sleep 5

if curl -f http://localhost/health &> /dev/null; then
    print_success "Health check passed!"
else
    print_warning "Health check failed, but services may still be starting"
fi

# Show final status
print_info "Deployment completed! Checking final status..."
docker-compose -f docker-compose.hostinger.yml ps

echo ""
print_success "🎉 AquaFarm Pro deployment completed!"
echo ""
print_info "Service URLs:"
print_info "• Main Site: http://$(curl -s ifconfig.me)"
print_info "• API: http://$(curl -s ifconfig.me)/api"
print_info "• API Docs: http://$(curl -s ifconfig.me)/api/docs"
print_info "• Health Check: http://$(curl -s ifconfig.me)/health"
print_info "• Grafana: http://$(curl -s ifconfig.me):3002"
print_info "• Prometheus: http://$(curl -s ifconfig.me):9090"
echo ""
print_info "Useful commands:"
print_info "• View logs: docker-compose -f docker-compose.hostinger.yml logs -f"
print_info "• Restart: docker-compose -f docker-compose.hostinger.yml restart"
print_info "• Stop: docker-compose -f docker-compose.hostinger.yml down"
echo ""
print_warning "Next steps:"
print_warning "1. Update DNS to point aquafarm.cloud to this server"
print_warning "2. Setup SSL certificates with Let's Encrypt"
print_warning "3. Configure monitoring and alerts"
