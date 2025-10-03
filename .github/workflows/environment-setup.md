# GitHub Environments Setup Guide

## Overview
This document explains how to set up GitHub environments and secrets for the AquaFarm Pro CI/CD pipeline.

## Required Environments

### 1. Staging Environment
- **Name:** `staging`
- **Protection:** None (automatic deployment)
- **Purpose:** Testing and validation before production

### 2. Production Environment
- **Name:** `production`
- **Protection:** Required reviewers (1) + 5-minute wait timer
- **Purpose:** Live production deployment

## Required Secrets

### Database Secrets
```
STAGING_DATABASE_URL: postgresql://user:pass@staging-host:5432/aquafarm_staging
PROD_DATABASE_URL: postgresql://user:pass@prod-host:5432/aquafarm_production
```

### Stripe Secrets
```
STRIPE_SECRET_KEY: sk_test_... (or sk_live_... for production)
STRIPE_PUBLISHABLE_KEY: pk_test_... (or pk_live_... for production)
STRIPE_WEBHOOK_SECRET: whsec_...
```

### Infrastructure Secrets
```
REDIS_URL: redis://redis-host:6379
OBJECT_STORAGE_ENDPOINT: https://s3.amazonaws.com
OBJECT_STORAGE_ACCESS_KEY: your-access-key
OBJECT_STORAGE_SECRET_KEY: your-secret-key
OBJECT_STORAGE_BUCKET: aquafarm-storage
```

### Security Secrets
```
JWT_SECRET: your-super-secret-jwt-key
ENCRYPTION_KEY: your-32-character-encryption-key
```

## Setup Instructions

### 1. Create Environments
1. Go to your GitHub repository
2. Navigate to Settings → Environments
3. Click "New environment"
4. Create `staging` environment (no protection rules)
5. Create `production` environment with:
   - Required reviewers: 1
   - Wait timer: 5 minutes

### 2. Configure Secrets
1. Go to Settings → Secrets and variables → Actions
2. Add repository secrets for shared values
3. Go to each environment and add environment-specific secrets

### 3. Environment-Specific Secrets

#### Staging Environment
- `STAGING_DATABASE_URL`
- `STRIPE_SECRET_KEY` (test key)
- `STRIPE_PUBLISHABLE_KEY` (test key)

#### Production Environment
- `PROD_DATABASE_URL`
- `STRIPE_SECRET_KEY` (live key)
- `STRIPE_PUBLISHABLE_KEY` (live key)
- `STRIPE_WEBHOOK_SECRET`

### 4. Repository Secrets (Shared)
- `REDIS_URL`
- `OBJECT_STORAGE_*`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `SMTP_*`
- `PROMETHEUS_ENDPOINT`
- `GRAFANA_API_KEY`

## Workflow Behavior

### Automatic Deployment
- **Staging:** Deploys automatically on push to main/master
- **Production:** Requires manual approval via workflow_dispatch

### Database Migrations
- **Staging:** Runs automatically after backend tests pass
- **Production:** Runs only after manual approval
- **RLS Tests:** Run after migrations to verify integrity

### Security Considerations
- Production environment requires reviewer approval
- Database URLs are environment-specific
- Stripe keys are environment-specific (test vs live)
- All secrets are encrypted at rest

## Troubleshooting

### Common Issues
1. **Environment not found:** Ensure environments are created in GitHub
2. **Secrets not accessible:** Check environment-specific vs repository secrets
3. **Database connection failed:** Verify DATABASE_URL format and credentials
4. **Stripe webhook failed:** Check STRIPE_WEBHOOK_SECRET configuration

### Validation Commands
```bash
# Test database connection
npm run migration:run

# Test Stripe connection
npm run test:stripe

# Test Redis connection
npm run test:redis
```

## Monitoring

### Deployment Status
- Check GitHub Actions tab for workflow status
- Monitor environment-specific logs
- Verify database migrations completed successfully

### Health Checks
- Staging: `https://staging.aquafarm.cloud/health`
- Production: `https://api.aquafarm.cloud/health`
- Metrics: `https://api.aquafarm.cloud/_metrics`
