#!/bin/bash

# AquaFarm Pro - Production Health Check
# Domain: aquafarm.cloud
# VPS: srv1029413.hstgr.cloud

echo "🔍 AquaFarm Pro Production Health Check"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    echo -n "Checking $name... "
    
    if curl -s --max-time 10 -I "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to check SSL
check_ssl() {
    local domain=$1
    echo -n "SSL Certificate for $domain... "
    
    if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓ Valid${NC}"
        return 0
    else
        echo -e "${RED}✗ Invalid${NC}"
        return 1
    fi
}

# DNS Check
echo "📍 DNS Configuration"
echo "===================="
VPS_IP=$(dig +short srv1029413.hstgr.cloud)
MAIN_IP=$(dig +short aquafarm.cloud)
API_IP=$(dig +short api.aquafarm.cloud)

echo "VPS IP: $VPS_IP"
echo "Main domain IP: $MAIN_IP" 
echo "API domain IP: $API_IP"

if [ "$MAIN_IP" = "$VPS_IP" ]; then
    echo -e "${GREEN}✓ DNS correctly configured${NC}"
else
    echo -e "${RED}✗ DNS not configured properly${NC}"
fi
echo ""

# URL Health Checks
echo "🌐 URL Health Checks"
echo "===================="
check_url "https://aquafarm.cloud" "Main Site"
check_url "https://www.aquafarm.cloud" "WWW Site"
check_url "https://api.aquafarm.cloud" "API Base"
check_url "https://api.aquafarm.cloud/health" "Health Endpoint"
check_url "https://api.aquafarm.cloud/api" "API Documentation"
check_url "https://admin.aquafarm.cloud" "Admin Panel"
echo ""

# SSL Certificate Checks
echo "🔒 SSL Certificate Status"
echo "========================="
check_ssl "aquafarm.cloud"
check_ssl "api.aquafarm.cloud"  
check_ssl "admin.aquafarm.cloud"
echo ""

# Docker Services Check (if running on VPS)
echo "🐳 Docker Services Status"
echo "========================="
if command -v docker >/dev/null 2>&1; then
    if docker-compose ps >/dev/null 2>&1; then
        echo "Docker services:"
        docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    else
        echo -e "${YELLOW}⚠ Not running from docker-compose directory${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker not available (running remotely?)${NC}"
fi
echo ""

# Performance Test
echo "⚡ Performance Check"
echo "==================="
echo -n "Main site response time: "
RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null https://aquafarm.cloud)
echo "${RESPONSE_TIME}s"

echo -n "API response time: "
API_RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null https://api.aquafarm.cloud/health)
echo "${API_RESPONSE_TIME}s"
echo ""

# Hostinger API Check
echo "🌐 Hostinger API Integration"
echo "============================"
API_TEST=$(curl -s -X GET "https://api.aquafarm.cloud/hostinger/vps/status" -H "Accept: application/json")
if echo "$API_TEST" | grep -q "status\|success\|data"; then
    echo -e "${GREEN}✓ Hostinger API integration working${NC}"
else
    echo -e "${YELLOW}⚠ Hostinger API integration check failed${NC}"
fi
echo ""

# Database Connection Test
echo "🗄️  Database Connection"
echo "======================="
DB_TEST=$(curl -s https://api.aquafarm.cloud/health)
if echo "$DB_TEST" | grep -q "database\|db\|healthy"; then
    echo -e "${GREEN}✓ Database connection healthy${NC}"
else
    echo -e "${YELLOW}⚠ Database status unclear${NC}"
fi
echo ""

# Final Summary
echo "📋 Summary"
echo "=========="
echo "Domain: aquafarm.cloud"
echo "VPS: srv1029413.hstgr.cloud ($VPS_IP)"
echo "Status: Production deployment health check completed"
echo ""
echo "🔗 Quick Links:"
echo "   Main Site: https://aquafarm.cloud"
echo "   API Docs:  https://api.aquafarm.cloud/api"
echo "   Health:    https://api.aquafarm.cloud/health"
echo ""
echo "For detailed logs: docker-compose logs -f"
echo "For service status: docker-compose ps"