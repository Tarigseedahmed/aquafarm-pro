# Kubernetes Deployment Guide

## Overview

This guide covers deploying AquaFarm Pro to Kubernetes using Helm charts. The deployment supports both staging and production environments with appropriate configurations.

## Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x
- kubectl configured
- Docker images built and pushed to registry

## Quick Start

### 1. Install Dependencies

```bash
# Add required Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 2. Deploy to Staging

```bash
# Deploy to staging namespace
helm upgrade --install aquafarm-staging ./infra/helm/aquafarm \
  --namespace staging \
  --create-namespace \
  --set image.backend.tag=v0.2.0 \
  --set image.frontend.tag=v0.2.0 \
  --set environment=staging \
  --values ./infra/helm/aquafarm/values-staging.yaml
```

### 3. Deploy to Production

```bash
# Deploy to production namespace
helm upgrade --install aquafarm-production ./infra/helm/aquafarm \
  --namespace production \
  --create-namespace \
  --set image.backend.tag=v0.2.0 \
  --set image.frontend.tag=v0.2.0 \
  --set environment=production \
  --values ./infra/helm/aquafarm/values-production.yaml
```

## Configuration

### Environment Variables

Key environment variables can be set in the values files:

```yaml
backend:
  env:
    NODE_ENV: production
    LOG_LEVEL: info
    ENABLE_LOGGING: "true"
    JWT_SECRET: "your-jwt-secret"
    CORS_ORIGIN: "https://aquafarm.cloud"
    # Redis/DB are injected from secrets
    # OBJECT_STORAGE_* come from secret as well

frontend:
  env:
    NEXT_PUBLIC_API_URL: "https://api.aquafarm.cloud"
    NEXT_PUBLIC_APP_URL: "https://aquafarm.cloud"
```

### Resource Limits

Production configuration includes appropriate resource limits:

```yaml
backend:
  resources:
    limits:
      cpu: 2000m
      memory: 2Gi
    requests:
      cpu: 1000m
      memory: 1Gi

frontend:
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi
```

### Database Configuration

PostgreSQL can be either deployed in-cluster or use a managed instance:

```yaml
# Option A: Managed Postgres (recommended for staging/production)
postgresql:
  enabled: false
externalDatabase:
  url: "postgresql://user:pass@host:5432/db"

# Option B: In-cluster Postgres (for dev/demo)
postgresql:
  enabled: true
  auth:
    postgresPassword: "secure-password"
    username: "aquafarm"
    password: "secure-password"
    database: "aquafarm_prod"
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "gp3"
```

### Redis Configuration

Use managed Redis or in-cluster chart:

```yaml
# Managed Redis
redis:
  enabled: false
externalRedis:
  url: "redis://:password@host:6379"

# In-cluster Redis (dev/demo)
redis:
  enabled: true
  auth:
    enabled: true
    password: "secure-password"
```

### Object Storage (S3/MinIO)

Backups/uploads settings exposed to the backend via secret:

```yaml
objectStorage:
  provider: s3           # s3|minio
  endpoint: https://s3.amazonaws.com
  region: us-east-1
  bucket: aquafarm-uploads
  useSSL: true
  accessKey: YOUR_ACCESS_KEY
  secretKey: YOUR_SECRET_KEY
```

### Monitoring

Prometheus and Grafana can be enabled for monitoring:

```yaml
monitoring:
  enabled: true
  
  prometheus:
    enabled: true
    server:
      persistentVolume:
        enabled: true
        size: 50Gi
  
  grafana:
    enabled: true
    adminPassword: "secure-password"
    persistence:
      enabled: true
      size: 10Gi
```

## Ingress Configuration

The Helm chart includes ingress configuration for external access:

```yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  
  hosts:
    - host: aquafarm.cloud
      paths:
        - path: /
          pathType: Prefix
          service:
            name: frontend
            port: 3000
        - path: /api
          pathType: Prefix
          service:
            name: backend
            port: 3000
```

## Scaling

### Horizontal Pod Autoscaler

Production includes HPA for automatic scaling:

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment aquafarm-production-backend --replicas=5 -n production

# Scale frontend
kubectl scale deployment aquafarm-production-frontend --replicas=5 -n production
```

## Security

### Network Policies

Network policies are enabled in production:

```yaml
networkPolicy:
  enabled: true
```

### Pod Security

Security contexts are configured:

```yaml
securityContext:
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000
```

## Monitoring and Observability

### Metrics Endpoint

The backend exposes metrics at `/_metrics`:

```bash
# Check metrics
kubectl port-forward svc/aquafarm-production-backend 3000:3000 -n production
curl http://localhost:3000/_metrics
```

### Grafana Dashboard

Access Grafana dashboard:

```bash
# Port forward to Grafana
kubectl port-forward svc/aquafarm-production-grafana 3000:80 -n production
```

Default credentials: `admin` / `secure-password`

## Backup and Restore

### Database Backup

```bash
# Create backup
kubectl exec -it aquafarm-production-postgresql-0 -n production -- pg_dump -U aquafarm aquafarm_prod > backup.sql

# Restore from backup
kubectl exec -i aquafarm-production-postgresql-0 -n production -- psql -U aquafarm aquafarm_prod < backup.sql
```

### Volume Snapshots

```bash
# Create snapshot
kubectl create volumesnapshot aquafarm-backup \
  --snapshot-class=ebs-csi-aws \
  --source-pvc=postgresql-data-aquafarm-production-postgresql-0 \
  -n production
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n production
kubectl describe pod <pod-name> -n production
```

### Check Logs

```bash
kubectl logs -f deployment/aquafarm-production-backend -n production
kubectl logs -f deployment/aquafarm-production-frontend -n production
```

### Check Services

```bash
kubectl get svc -n production
kubectl describe svc aquafarm-production-backend -n production
```

### Check Ingress

```bash
kubectl get ingress -n production
kubectl describe ingress aquafarm-production -n production
```

## CI/CD Integration

The deployment is integrated with GitHub Actions:

```yaml
# .github/workflows/ci-cd.yml
deploy-staging:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to staging
      run: |
        helm upgrade --install aquafarm-staging ./infra/helm/aquafarm \
          --namespace staging \
          --create-namespace \
          --set image.backend.tag=${{ github.sha }} \
          --set image.frontend.tag=${{ github.sha }} \
          --values ./infra/helm/aquafarm/values-staging.yaml
```

## Best Practices

1.**Use specific image tags** instead of `latest`
2. **Configure resource limits** appropriately
3. **Enable monitoring** in production
4. **Use secrets** for sensitive data
5. **Configure backup** strategies
6. **Test deployments** in staging first
7. **Use network policies** for security
8. **Monitor resource usage** regularly

## Support

For issues and questions:

- Check logs: `kubectl logs -f deployment/<deployment-name> -n <namespace>`
- Check events: `kubectl get events -n <namespace>`
- Check resource usage: `kubectl top pods -n <namespace>`
