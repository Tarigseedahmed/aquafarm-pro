#!/bin/bash

# DNS Verification Script for AquaFarm Pro
# تاريخ الإنشاء: 1 أكتوبر 2025
# الغرض: التحقق من إعدادات DNS للنطاق aquafarm.cloud

set -e

# الألوان للإخراج
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# المتغيرات
DOMAIN="aquafarm.cloud"
EXPECTED_IP="72.60.187.58"
SUBDOMAINS=("api" "admin" "www")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AquaFarm Pro - DNS Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# دالة للتحقق من DNS
check_dns() {
    local domain=$1
    local expected_ip=$2
    
    echo -e "${YELLOW}Checking: $domain${NC}"
    
    # محاولة الحصول على IP
    if command -v dig &> /dev/null; then
        # استخدام dig إذا كان متوفراً
        ip=$(dig +short $domain | grep -E '^[0-9.]+$' | head -n 1)
    elif command -v nslookup &> /dev/null; then
        # استخدام nslookup كبديل
        ip=$(nslookup $domain | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -n 1)
    else
        echo -e "${RED}Error: Neither 'dig' nor 'nslookup' found!${NC}"
        return 1
    fi
    
    # التحقق من النتيجة
    if [ -z "$ip" ]; then
        echo -e "${RED}  ✗ No DNS record found${NC}"
        return 1
    elif [ "$ip" = "$expected_ip" ]; then
        echo -e "${GREEN}  ✓ Correct: $ip${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Wrong IP: $ip (expected: $expected_ip)${NC}"
        return 1
    fi
}

# دالة للتحقق من Nameservers
check_nameservers() {
    local domain=$1
    
    echo -e "${YELLOW}Checking Nameservers for: $domain${NC}"
    
    if command -v dig &> /dev/null; then
        nameservers=$(dig +short NS $domain)
    elif command -v nslookup &> /dev/null; then
        nameservers=$(nslookup -type=NS $domain | grep "nameserver" | awk '{print $NF}')
    else
        echo -e "${RED}Error: Cannot check nameservers${NC}"
        return 1
    fi
    
    if [ -z "$nameservers" ]; then
        echo -e "${RED}  ✗ No nameservers found${NC}"
        return 1
    fi
    
    echo "$nameservers" | while read -r ns; do
        if [[ $ns == *"dns-parking"* ]]; then
            echo -e "${RED}  ✗ PARKING: $ns (needs update!)${NC}"
        elif [[ $ns == *"hostinger"* ]]; then
            echo -e "${GREEN}  ✓ CORRECT: $ns${NC}"
        else
            echo -e "${YELLOW}  ? UNKNOWN: $ns${NC}"
        fi
    done
}

# دالة للتحقق من SSL
check_ssl() {
    local domain=$1
    
    echo -e "${YELLOW}Checking SSL for: https://$domain${NC}"
    
    if command -v curl &> /dev/null; then
        if curl -Is --max-time 10 https://$domain > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ SSL Certificate valid${NC}"
            
            # الحصول على تفاصيل الشهادة
            if command -v openssl &> /dev/null; then
                expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | \
                         openssl x509 -noout -dates 2>/dev/null | grep "notAfter" | cut -d= -f2)
                if [ ! -z "$expiry" ]; then
                    echo -e "${BLUE}  Expires: $expiry${NC}"
                fi
            fi
            return 0
        else
            echo -e "${RED}  ✗ SSL not available or invalid${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}  ? Cannot check SSL (curl not found)${NC}"
        return 2
    fi
}

# دالة للتحقق من HTTP Response
check_http() {
    local domain=$1
    
    echo -e "${YELLOW}Checking HTTP for: https://$domain${NC}"
    
    if command -v curl &> /dev/null; then
        status=$(curl -Is --max-time 10 https://$domain | head -n 1 | awk '{print $2}')
        
        if [ ! -z "$status" ]; then
            if [ "$status" = "200" ]; then
                echo -e "${GREEN}  ✓ HTTP Status: $status OK${NC}"
                return 0
            else
                echo -e "${YELLOW}  ! HTTP Status: $status${NC}"
                return 1
            fi
        else
            echo -e "${RED}  ✗ No response${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}  ? Cannot check HTTP (curl not found)${NC}"
        return 2
    fi
}

# المتغيرات لتتبع النتائج
dns_passed=0
dns_failed=0
ssl_passed=0
ssl_failed=0

echo -e "\n${BLUE}=== Step 1: Checking Nameservers ===${NC}\n"
check_nameservers $DOMAIN
echo ""

echo -e "\n${BLUE}=== Step 2: Checking DNS Records ===${NC}\n"

# التحقق من النطاق الرئيسي
if check_dns $DOMAIN $EXPECTED_IP; then
    ((dns_passed++))
else
    ((dns_failed++))
fi
echo ""

# التحقق من Subdomains
for subdomain in "${SUBDOMAINS[@]}"; do
    if check_dns "$subdomain.$DOMAIN" $EXPECTED_IP; then
        ((dns_passed++))
    else
        ((dns_failed++))
    fi
    echo ""
done

echo -e "\n${BLUE}=== Step 3: Checking SSL Certificates ===${NC}\n"

# التحقق من SSL للنطاق الرئيسي
if check_ssl $DOMAIN; then
    ((ssl_passed++))
else
    ((ssl_failed++))
fi
echo ""

# التحقق من SSL للـ Subdomains
for subdomain in "${SUBDOMAINS[@]}"; do
    if check_ssl "$subdomain.$DOMAIN"; then
        ((ssl_passed++))
    else
        ((ssl_failed++))
    fi
    echo ""
done

echo -e "\n${BLUE}=== Step 4: Checking HTTP Responses ===${NC}\n"

check_http $DOMAIN
echo ""

check_http "api.$DOMAIN/health"
echo ""

# الملخص النهائي
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}           Summary Report${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "DNS Records:"
echo -e "  ${GREEN}✓ Passed: $dns_passed${NC}"
echo -e "  ${RED}✗ Failed: $dns_failed${NC}"
echo ""
echo -e "SSL Certificates:"
echo -e "  ${GREEN}✓ Passed: $ssl_passed${NC}"
echo -e "  ${RED}✗ Failed: $ssl_failed${NC}"
echo ""

# الحالة الإجمالية
if [ $dns_failed -eq 0 ] && [ $ssl_failed -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   ✓ All checks passed! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}Your DNS is configured correctly and ready for production!${NC}"
    exit 0
elif [ $dns_failed -gt 0 ] && [ $ssl_failed -gt 0 ]; then
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}   ✗ DNS and SSL checks failed${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo -e "  1. Update DNS nameservers in Hostinger"
    echo -e "  2. Add A records for all domains"
    echo -e "  3. Wait 24-48 hours for DNS propagation"
    echo -e "  4. Issue SSL certificates after DNS propagation"
    echo ""
    echo -e "See: ${BLUE}docs/dns-setup-guide.md${NC} for detailed instructions"
    exit 1
elif [ $dns_failed -gt 0 ]; then
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}   ! DNS checks failed${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo -e "  1. Check DNS configuration in Hostinger"
    echo -e "  2. Verify nameservers are updated"
    echo -e "  3. Wait for DNS propagation (24-48 hours)"
    echo ""
    echo -e "See: ${BLUE}docs/dns-setup-guide.md${NC} for detailed instructions"
    exit 1
else
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}   ! SSL checks failed${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo -e "  1. Ensure DNS has fully propagated"
    echo -e "  2. Issue SSL certificates with certbot"
    echo -e "  3. Restart Nginx"
    echo ""
    echo -e "See: ${BLUE}docs/dns-setup-guide.md${NC} for SSL setup instructions"
    exit 1
fi
