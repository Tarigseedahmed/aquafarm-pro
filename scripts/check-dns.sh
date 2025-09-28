#!/bin/bash

# Check DNS Status for aquafarm.cloud
# Current DNS: ns1.dns-parking.com, ns2.dns-parking.com

echo "🔍 DNS Status Check for aquafarm.cloud"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📍 Current Nameservers"
echo "====================="
NAMESERVERS=$(dig NS aquafarm.cloud +short)
echo "Domain: aquafarm.cloud"
echo "Current nameservers:"
echo "$NAMESERVERS"
echo ""

# Check if pointing to parking
if echo "$NAMESERVERS" | grep -q "dns-parking.com"; then
    echo -e "${RED}⚠️ WARNING: Domain is PARKED${NC}"
    echo -e "${RED}Current nameservers point to parking service${NC}"
    echo -e "${YELLOW}Action required: Change to Hostinger nameservers${NC}"
    echo ""
    echo "Required nameservers:"
    echo "  ns1.hostinger.com"
    echo "  ns2.hostinger.com"
    echo "  ns3.hostinger.com"
    echo "  ns4.hostinger.com"
elif echo "$NAMESERVERS" | grep -q "hostinger.com"; then
    echo -e "${GREEN}✓ Nameservers correctly point to Hostinger${NC}"
else
    echo -e "${YELLOW}⚠️ Unknown nameservers detected${NC}"
fi

echo ""
echo "📱 VPS Information"
echo "=================="
VPS_IP=$(dig +short srv1029413.hstgr.cloud)
echo "VPS: srv1029413.hstgr.cloud"
echo "VPS IP: $VPS_IP"
echo ""

echo "🌐 Domain Resolution Test"
echo "========================="
DOMAIN_IP=$(dig +short aquafarm.cloud)
API_IP=$(dig +short api.aquafarm.cloud)

echo -n "aquafarm.cloud → "
if [ -n "$DOMAIN_IP" ]; then
    echo "$DOMAIN_IP"
    if [ "$DOMAIN_IP" = "$VPS_IP" ]; then
        echo -e "${GREEN}✓ Domain correctly points to VPS${NC}"
    else
        echo -e "${YELLOW}⚠️ Domain points to different IP${NC}"
    fi
else
    echo -e "${RED}✗ No A record found${NC}"
fi

echo -n "api.aquafarm.cloud → "
if [ -n "$API_IP" ]; then
    echo "$API_IP"
else
    echo -e "${RED}✗ No A record found${NC}"
fi

echo ""
echo "🔧 Next Steps"
echo "============="

if echo "$NAMESERVERS" | grep -q "dns-parking.com"; then
    echo -e "${RED}CRITICAL: Change nameservers first!${NC}"
    echo ""
    echo "1. Login to domain registrar"
    echo "2. Change nameservers to:"
    echo "   ns1.hostinger.com"
    echo "   ns2.hostinger.com"
    echo "   ns3.hostinger.com"
    echo "   ns4.hostinger.com"
    echo "3. Wait 24-48 hours for propagation"
    echo "4. Add A records in Hostinger control panel"
    echo ""
elif echo "$NAMESERVERS" | grep -q "hostinger.com"; then
    if [ "$DOMAIN_IP" = "$VPS_IP" ]; then
        echo -e "${GREEN}✓ DNS is ready for deployment!${NC}"
        echo "Run: ./infra/deploy.sh"
    else
        echo -e "${YELLOW}Add A records in Hostinger control panel:${NC}"
        echo "aquafarm.cloud      A    $VPS_IP"
        echo "api.aquafarm.cloud  A    $VPS_IP"
        echo "admin.aquafarm.cloud A   $VPS_IP"
    fi
fi

echo ""
echo "🔗 Useful Links:"
echo "  DNS Checker: https://dnschecker.org/"
echo "  Hostinger Control Panel: https://hpanel.hostinger.com/"