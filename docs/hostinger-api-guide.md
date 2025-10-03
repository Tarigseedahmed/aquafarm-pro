# Hostinger API Integration Guide

## Overview

This guide explains how to use the Hostinger API integration in AquaFarm Pro for server management and monitoring.

## Configuration

### Environment Variables

The following environment variables need to be configured:

```bash
# Hostinger API Configuration
HOSTINGER_API_KEY=RO6wIcLPWssb6SAtTCCLxWFtgPF4twQWsHEMqD2U1a099004
```

### API Service

The `HostingerApiService` provides the following capabilities:

#### VPS Management

- **Get VPS Information**: Retrieve details about your VPS instances
- **Monitor Performance**: Get CPU, memory, disk, and network usage
- **Resource Monitoring**: Track server resources in real-time

#### Backup Management

- **Create Backups**: Create manual backups of your VPS
- **List Backups**: Get list of available backups
- **Restore from Backup**: Restore VPS from a specific backup

#### Domain & DNS Management

- **Get Domains**: List all domains in your account
- **Update DNS Records**: Manage DNS records programmatically
- **SSL Certificate Info**: Check SSL certificate status

#### Account Management

- **Account Information**: Get account details and limits
- **Health Check**: Verify API connectivity

## API Endpoints

### Health Check

```bash
GET /api/hostinger/health

```text
Check if Hostinger API is accessible.

### VPS Information
```bash
GET /api/hostinger/vps

```text
Get information about all VPS instances.

### VPS Metrics
```bash
GET /api/hostinger/vps/{id}/metrics

```text
Get performance metrics for a specific VPS.

### VPS Resources

```bash
GET /api/hostinger/vps/{id}/resources

```text
Get current resource usage (CPU, memory, disk, network).

### Create Backup
```bash
POST /api/hostinger/vps/{id}/backup
Content-Type: application/json

{
  "name": "backup-name-optional"
}
```

### List Backups

```bash
GET /api/hostinger/vps/{id}/backups
```

### Restore from Backup

```bash
POST /api/hostinger/vps/{id}/restore
Content-Type: application/json

{
  "backupId": "backup-id"
}
```

### Get Domains

```bash
GET /api/hostinger/domains
```

### Update DNS Record

```bash
POST /api/hostinger/domains/{domain}/dns
Content-Type: application/json

{
  "type": "A",
  "name": "subdomain",
  "value": "192.168.1.1"
}
```

### Get SSL Information

```bash
GET /api/hostinger/domains/{domain}/ssl
```

### Get Account Information

```bash
GET /api/hostinger/account
```

## Usage Examples

### Frontend Integration (React/Next.js)

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function ServerMonitoring() {
  const [vpsInfo, setVpsInfo] = useState(null);
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServerData() {
      try {
        const vpsResponse = await api.get('/hostinger/vps');
        const vpsId = vpsResponse.data[0]?.id;
        
        if (vpsId) {
          const resourcesResponse = await api.get(`/hostinger/vps/${vpsId}/resources`);
          setVpsInfo(vpsResponse.data[0]);
          setResources(resourcesResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch server data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchServerData();
    const interval = setInterval(fetchServerData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading server information...</div>;

  return (
    <div className="server-monitoring">
      <h2>Server Status</h2>
      {vpsInfo && (
        <div>
          <h3>VPS Information</h3>
          <p>Name: {vpsInfo.name}</p>
          <p>Status: {vpsInfo.status}</p>
          <p>IP: {vpsInfo.ip_address}</p>
        </div>
      )}
      
      {resources && (
        <div>
          <h3>Resource Usage</h3>
          <p>CPU: {resources.cpu}%</p>
          <p>Memory: {resources.memory}%</p>
          <p>Disk: {resources.disk}%</p>
          <p>Last Updated: {new Date(resources.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
```

### Create Backup Function

```typescript
async function createServerBackup() {
  try {
    const response = await api.post('/hostinger/vps/your-vps-id/backup', {
      name: `backup-${new Date().toISOString().split('T')[0]}`
    });
    
    console.log('Backup created:', response.data);
    alert('Backup created successfully!');
  } catch (error) {
    console.error('Failed to create backup:', error);
    alert('Failed to create backup');
  }
}
```

## Security Considerations

1.**API Key Protection**: The API key is stored in environment variables and never exposed to the frontend
2. **Authentication**: All endpoints require JWT authentication
3. **Rate Limiting**: Consider implementing rate limiting for API calls
4. **Error Handling**: Proper error handling prevents sensitive information leakage

## Monitoring Dashboard Integration

The Hostinger API can be integrated with monitoring dashboards to provide:

- Real-time server metrics
- Automated backup scheduling
- Alert notifications for resource thresholds
- SSL certificate expiration warnings
- Domain status monitoring

## Troubleshooting

### Common Issues

1.**API Key Invalid**: Verify the API key is correct and not expired
2. **Network Timeouts**: Check internet connectivity and API endpoint availability
3. **Rate Limits**: Implement proper request throttling
4. **VPS ID Not Found**: Ensure you're using the correct VPS identifier

### Debug Mode

Enable debug logging in development:

```bash
LOG_LEVEL=debug
DEBUG_MODE=true
```

## Next Steps

1.Implement automated monitoring alerts
2. Set up scheduled backups
3. Create dashboard widgets for server metrics
4. Add SSL certificate renewal automation
5. Implement domain management interface

## Support

For issues with Hostinger API integration:
1.Check Hostinger API documentation
2. Verify API key permissions
3. Contact Hostinger support if needed
4. Review application logs for detailed error messages
