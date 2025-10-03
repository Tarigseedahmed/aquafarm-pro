# 🚨 DNS Configuration Update Required

## Current Status

- **Domain**: aquafarm.cloud
- **Current DNS**: ns1.dns-parking.com, ns2.dns-parking.com
- **Status**: ⚠️ Domain is parked - NOT pointing to Hostinger

## Required Actions

### 1. Change Nameservers (CRITICAL)

**Current nameservers (PARKING):**

```text
ns1.dns-parking.com
ns2.dns-parking.com
```

**Required nameservers (HOSTINGER):**

```text
ns1.hostinger.com
ns2.hostinger.com
ns3.hostinger.com
ns4.hostinger.com
```

### 2. How to Change Nameservers

#### Option A: If domain was purchased through Hostinger

1.Login to Hostinger control panel
2. Go to "Domains" → "Manage Domain"
3. Click on "DNS Zone"
4. Nameservers should automatically be set to Hostinger

#### Option B: If domain purchased elsewhere

1.Login to your domain registrar (where you bought aquafarm.cloud)
2. Find "DNS Management" or "Nameservers" section
3. Change nameservers from parking to Hostinger:
   -Remove: ns1.dns-parking.com, ns2.dns-parking.com
   -Add: ns1.hostinger.com, ns2.hostinger.com, ns3.hostinger.com, ns4.hostinger.com

### 3. Verify Nameserver Change

```bash
# Check current nameservers
dig NS aquafarm.cloud

# Expected output (order may vary):
# aquafarm.cloud. IN NS ns1.hostinger.com
# aquafarm.cloud. IN NS ns2.hostinger.com
# aquafarm.cloud. IN NS ns3.hostinger.com
# aquafarm.cloud. IN NS ns4.hostinger.com
```

### 4. Wait for Propagation

⏱️ **Nameserver changes take 24-48 hours to propagate globally**

### 5. After Nameserver Update - Add DNS Records

Once nameservers point to Hostinger, add these A records in Hostinger control panel:

```bash
# Get VPS IP first
dig +short srv1029413.hstgr.cloud
```

Then add these records (replace YOUR_VPS_IP):

```text
aquafarm.cloud          A    YOUR_VPS_IP
www.aquafarm.cloud      A    YOUR_VPS_IP
api.aquafarm.cloud      A    YOUR_VPS_IP
admin.aquafarm.cloud    A    YOUR_VPS_IP
```

## Verification Commands

### Check Nameservers

```bash
dig NS aquafarm.cloud
nslookup -type=NS aquafarm.cloud
```

### Check A Records (after nameserver update)

```bash
dig aquafarm.cloud +short
dig api.aquafarm.cloud +short
```

### Online Tools

- **DNS Checker**: <https://dnschecker.org/>
- **What's My DNS**: <https://www.whatsmydns.net/>
- **DNS Propagation**: <https://www.whatsmydns.net/>

## Timeline

```text
Day 0: Change nameservers
Day 1-2: Wait for nameserver propagation
Day 2: Add A records in Hostinger
Day 2-3: Wait for A record propagation
Day 3: Deploy application
```

## Current Action Required

🔥 **IMMEDIATE ACTION**: Change nameservers from parking to Hostinger

**Without this change, the domain will not point to your VPS and deployment will not work.**

## Alternative: Temporary Testing

If you want to test while waiting for DNS:

1.Get VPS IP: `dig +short srv1029413.hstgr.cloud`
2. Add to local hosts file for testing:

   ```text
   YOUR_VPS_IP aquafarm.cloud
   YOUR_VPS_IP api.aquafarm.cloud
   ```

3.Deploy to VPS using IP directly
4. Test with IP: `http://YOUR_VPS_IP`

## After DNS is Fixed

Once nameservers are updated and A records added:

1.Verify DNS: `dig aquafarm.cloud +short`
2. Deploy application: `./infra/deploy.sh`
3. Test SSL: `curl -I https://aquafarm.cloud`
4. Run health check: `./scripts/health-check.sh`

---

⚠️ **Remember**: Domain parking means the domain is not actively configured. You MUST change nameservers to Hostinger for the deployment to work.
