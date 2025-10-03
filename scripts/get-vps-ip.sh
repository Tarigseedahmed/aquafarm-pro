#!/bin/bash

# Get VPS IP Address for aquafarm.cloud deployment
# VPS: srv1029413.hstgr.cloud

echo "=== Getting VPS IP Address ==="
echo ""

echo "Method 1: DNS Resolution"
echo "VPS Hostname: srv1029413.hstgr.cloud"
echo -n "Resolved IP: "
dig +short srv1029413.hstgr.cloud 2>/dev/null || nslookup srv1029413.hstgr.cloud | grep "Address:" | tail -1 | cut -d' ' -f2

echo ""
echo "Method 2: Direct Connection Test"
echo -n "Testing connection to VPS... "
if ping -c 1 srv1029413.hstgr.cloud >/dev/null 2>&1; then
    echo "✓ VPS is reachable"
    echo -n "Ping result: "
    ping -c 1 srv1029413.hstgr.cloud | grep "64 bytes from" | cut -d'(' -f2 | cut -d')' -f1
else
    echo "✗ VPS not reachable"
fi

echo ""
echo "Method 3: SSH and Get Public IP (requires VPS access)"
echo "Command: ssh root@srv1029413.hstgr.cloud 'curl -4 ifconfig.me'"

echo ""
echo "=== DNS Configuration Required ==="
echo "After getting the IP address, configure these DNS records in Hostinger:"
echo ""
echo "A Records (replace YOUR_VPS_IP with the actual IP):"
echo "aquafarm.cloud          A    YOUR_VPS_IP"
echo "www.aquafarm.cloud      A    YOUR_VPS_IP"  
echo "api.aquafarm.cloud      A    YOUR_VPS_IP"
echo "admin.aquafarm.cloud    A    YOUR_VPS_IP"

echo ""
echo "=== Verification Commands ==="
echo "After DNS setup, verify with:"
echo "dig aquafarm.cloud +short"
echo "dig api.aquafarm.cloud +short"
echo "curl -I http://aquafarm.cloud"

echo ""
echo "=== Next Steps ==="
echo "1. Note down the VPS IP address from above"
echo "2. Configure DNS records in Hostinger control panel"
echo "3. Wait 1-4 hours for DNS propagation"
echo "4. Run deployment: ./infra/deploy.sh"

echo ""
echo "Online DNS checker: https://dnschecker.org/"