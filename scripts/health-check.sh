#!/bin/bash

# Health Check Script for AquaFarm Pro
# تاريخ الإنشاء: 1 أكتوبر 2025
# الغرض: التحقق من صحة جميع خدمات النظام

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# المتغيرات
API_URL="${API_URL:-https://api.aquafarm.cloud}"
FRONTEND_URL="${FRONTEND_URL:-https://aquafarm.cloud}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AquaFarm Pro - Health Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# دالة للتحقق من صحة الخدمة
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -e "${YELLOW}Checking: $name${NC}"
    
    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $url 2>/dev/null || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}  ✓ Status: $response OK${NC}"
            return 0
        elif [ "$response" = "000" ]; then
            echo -e "${RED}  ✗ Connection failed${NC}"
            return 1
        else
            echo -e "${RED}  ✗ Status: $response (expected: $expected_status)${NC}"
            return 1
        fi
    else
        echo -e "${RED}  ✗ curl not found${NC}"
        return 1
    fi
}

# دالة للتحقق من Docker container
check_container() {
    local name=$1
    
    echo -e "${YELLOW}Checking Docker: $name${NC}"
    
    if command -v docker &> /dev/null; then
        if docker ps --format '{{.Names}}' | grep -q "^$name$"; then
            status=$(docker inspect --format='{{.State.Status}}' $name 2>/dev/null)
            if [ "$status" = "running" ]; then
                echo -e "${GREEN}  ✓ Container running${NC}"
                return 0
            else
                echo -e "${RED}  ✗ Container status: $status${NC}"
                return 1
            fi
        else
            echo -e "${RED}  ✗ Container not found${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}  ? Docker not available (skipping)${NC}"
        return 2
    fi
}

# دالة للتحقق من Database
check_database() {
    echo -e "${YELLOW}Checking Database${NC}"
    
    if command -v docker &> /dev/null; then
        if docker ps --format '{{.Names}}' | grep -q "postgres"; then
            result=$(docker exec aquafarm_postgres psql -U aquapro_user -d aquapro_production -t -c "SELECT 1" 2>/dev/null || echo "")
            
            if [ ! -z "$result" ]; then
                echo -e "${GREEN}  ✓ Database connection OK${NC}"
                
                # عدد الـ tenants
                tenants=$(docker exec aquafarm_postgres psql -U aquapro_user -d aquapro_production -t -c "SELECT COUNT(*) FROM tenants" 2>/dev/null | tr -d ' ')
                echo -e "${BLUE}  Tenants: $tenants${NC}"
                
                # عدد المستخدمين
                users=$(docker exec aquafarm_postgres psql -U aquapro_user -d aquapro_production -t -c "SELECT COUNT(*) FROM users" 2>/dev/null | tr -d ' ')
                echo -e "${BLUE}  Users: $users${NC}"
                
                return 0
            else
                echo -e "${RED}  ✗ Database query failed${NC}"
                return 1
            fi
        else
            echo -e "${RED}  ✗ Postgres container not running${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}  ? Docker not available (skipping)${NC}"
        return 2
    fi
}

# دالة للتحقق من Redis
check_redis() {
    echo -e "${YELLOW}Checking Redis${NC}"
    
    if command -v docker &> /dev/null; then
        if docker ps --format '{{.Names}}' | grep -q "redis"; then
            result=$(docker exec aquafarm_redis redis-cli ping 2>/dev/null || echo "")
            
            if [ "$result" = "PONG" ]; then
                echo -e "${GREEN}  ✓ Redis connection OK${NC}"
                return 0
            else
                echo -e "${RED}  ✗ Redis ping failed${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}  ? Redis container not running (optional)${NC}"
            return 2
        fi
    else
        echo -e "${YELLOW}  ? Docker not available (skipping)${NC}"
        return 2
    fi
}

# دالة للتحقق من Disk Space
check_disk() {
    echo -e "${YELLOW}Checking Disk Space${NC}"
    
    if command -v df &> /dev/null; then
        usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
        
        if [ $usage -lt 80 ]; then
            echo -e "${GREEN}  ✓ Disk usage: ${usage}%${NC}"
            return 0
        elif [ $usage -lt 90 ]; then
            echo -e "${YELLOW}  ! Disk usage: ${usage}% (warning)${NC}"
            return 0
        else
            echo -e "${RED}  ✗ Disk usage: ${usage}% (critical!)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}  ? df command not available${NC}"
        return 2
    fi
}

# دالة للتحقق من Memory
check_memory() {
    echo -e "${YELLOW}Checking Memory${NC}"
    
    if command -v free &> /dev/null; then
        mem_usage=$(free | grep Mem | awk '{printf "%.0f", ($3/$2) * 100}')
        
        if [ $mem_usage -lt 80 ]; then
            echo -e "${GREEN}  ✓ Memory usage: ${mem_usage}%${NC}"
            return 0
        elif [ $mem_usage -lt 90 ]; then
            echo -e "${YELLOW}  ! Memory usage: ${mem_usage}% (warning)${NC}"
            return 0
        else
            echo -e "${RED}  ✗ Memory usage: ${mem_usage}% (critical!)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}  ? free command not available${NC}"
        return 2
    fi
}

# المتغيرات لتتبع النتائج
services_passed=0
services_failed=0
containers_passed=0
containers_failed=0

echo -e "\n${BLUE}=== Step 1: Docker Containers ===${NC}\n"

# التحقق من Containers
for container in "postgres" "redis" "backend" "frontend" "nginx"; do
    if check_container "aquafarm_$container"; then
        ((containers_passed++))
    else
        ((containers_failed++))
    fi
    echo ""
done

echo -e "\n${BLUE}=== Step 2: Database & Cache ===${NC}\n"

check_database
echo ""

check_redis
echo ""

echo -e "\n${BLUE}=== Step 3: HTTP Services ===${NC}\n"

# التحقق من API Health
if check_service "API Health" "$API_URL/health" 200; then
    ((services_passed++))
else
    ((services_failed++))
fi
echo ""

# التحقق من API Docs
if check_service "API Docs" "$API_URL/api" 200; then
    ((services_passed++))
else
    ((services_failed++))
fi
echo ""

# التحقق من Metrics
if check_service "Metrics" "$API_URL/metrics" 200; then
    ((services_passed++))
else
    ((services_failed++))
fi
echo ""

# التحقق من Frontend
if check_service "Frontend" "$FRONTEND_URL" 200; then
    ((services_passed++))
else
    ((services_failed++))
fi
echo ""

echo -e "\n${BLUE}=== Step 4: System Resources ===${NC}\n"

check_disk
echo ""

check_memory
echo ""

# الملخص النهائي
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}           Summary Report${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Docker Containers:"
echo -e "  ${GREEN}✓ Running: $containers_passed${NC}"
echo -e "  ${RED}✗ Failed: $containers_failed${NC}"
echo ""
echo -e "HTTP Services:"
echo -e "  ${GREEN}✓ Healthy: $services_passed${NC}"
echo -e "  ${RED}✗ Failed: $services_failed${NC}"
echo ""

# الحالة الإجمالية
if [ $services_failed -eq 0 ] && [ $containers_failed -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   ✓ All systems operational! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}AquaFarm Pro is healthy and ready!${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}   ✗ System health check failed${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo -e "  1. Check logs: docker-compose logs"
    echo -e "  2. Restart failed services: docker-compose restart"
    echo -e "  3. Review configuration files"
    echo ""
    exit 1
fi
