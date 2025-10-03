# 🔐 GitHub Actions Secrets Configuration Guide

This document explains how to configure the required secrets for the AquaFarm Pro CI/CD pipeline.

## 📍 Where to Configure Secrets

1.Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each required secret

## 🔑 Required Secrets

### Code Quality & Security

#### `SONAR_TOKEN`

- **Purpose**: Authentication token for SonarCloud code quality analysis
- **How to get it**:
  1 Sign up/Login to [SonarCloud](https://sonarcloud.io)
  2. Go to **Account** → **Security** → **Generate Tokens**
  3. Create a new token with appropriate permissions
- **Required**: Optional (workflow will skip SonarCloud scan if not provided)
- **Format**: String token

### Deployment Secrets

#### Staging Environment

- **`STAGING_HOST`**: IP address or hostname of staging server
- **`STAGING_USER`**: SSH username for staging server
- **`STAGING_SSH_KEY`**: Private SSH key for staging server access

#### Production Environment

- **`PRODUCTION_HOST`**: IP address or hostname of production server
- **`PRODUCTION_USER`**: SSH username for production server
- **`PRODUCTION_SSH_KEY`**: Private SSH key for production server access

### Notification

#### `SLACK_WEBHOOK`

- **Purpose**: Slack webhook URL for deployment notifications
- **How to get it**:
  1.Go to your Slack workspace
  2. Create a new app or use existing app
  3. Enable **Incoming Webhooks**
  4. Create webhook for desired channel
- **Required**: Optional (workflow will skip notifications if not provided)
- **Format**: `https://hooks.slack.com/services/...`

## 🛠️ SSH Key Setup

### Generate SSH Key Pair

```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "github-actions@aquafarm-pro"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server.com
```

### Add Private Key to GitHub Secrets

1. Copy the **private key** content:

   ```bash
   cat ~/.ssh/id_ed25519
   ```

2.Add it as `STAGING_SSH_KEY` or `PRODUCTION_SSH_KEY` secret
3. Ensure the key has proper permissions on the server

## 🔒 Security Best Practices

### SSH Key Security

- Use separate SSH keys for staging and production
- Regularly rotate SSH keys
- Use key-based authentication (disable password authentication)
- Limit SSH key permissions to necessary operations only

### Secret Management

- Never commit secrets to version control
- Use environment-specific secrets
- Regularly rotate tokens and keys
- Monitor secret usage in GitHub Actions logs

## 🧪 Testing Secret Configuration

### Verify Secrets are Set

```bash
# Check if secrets are properly configured
gh secret list --repo your-username/aquafarm-pro
```

### Test Deployment Permissions

```bash
# Test SSH connection
ssh -i /path/to/private/key user@your-server.com

# Test Docker access
ssh user@your-server.com "docker ps"
```

## 🚨 Troubleshooting

### Common Issues

#### "Permission denied (publickey)"

- Verify SSH key is correctly added to GitHub secrets
- Ensure public key is in server's `~/.ssh/authorized_keys`
- Check SSH key permissions on server

#### "SonarCloud scan failed"

- Verify `SONAR_TOKEN` is valid and has correct permissions
- Check SonarCloud project configuration
- Ensure project key matches repository name

#### "Slack notification failed"

- Verify webhook URL is correct
- Check Slack app permissions
- Ensure channel exists and bot has access

### Debug Mode

Enable debug logging by adding this to your workflow:

```yaml
- name: Debug secrets
  run: |
    echo "Checking secret availability..."
    if [ -n "${{ secrets.SONAR_TOKEN }}" ]; then
      echo "✅ SONAR_TOKEN is set"
    else
      echo "❌ SONAR_TOKEN is not set"
    fi
```

## 📋 Secret Checklist

- [ ] `SONAR_TOKEN` configured (optional)
- [ ] `STAGING_HOST` configured
- [ ] `STAGING_USER` configured
- [ ] `STAGING_SSH_KEY` configured
- [ ] `PRODUCTION_HOST` configured
- [ ] `PRODUCTION_USER` configured
- [ ] `PRODUCTION_SSH_KEY` configured
- [ ] `SLACK_WEBHOOK` configured (optional)
- [ ] SSH keys tested on servers
- [ ] SonarCloud project configured
- [ ] Slack webhook tested

## 🔄 Environment-Specific Configuration

### Development

- No secrets required for local development
- Use environment variables in `.env` files

### Staging

- Configure staging-specific secrets
- Use staging environment in GitHub Actions
- Test deployment process

### Production

- Configure production-specific secrets
- Use production environment with approval requirements
- Monitor deployment logs carefully

## 📞 Support

If you encounter issues with secret configuration:

1.Check GitHub Actions logs for detailed error messages
2. Verify secret names match exactly (case-sensitive)
3. Test SSH connections manually
4. Review server logs for deployment issues

For additional help, refer to:

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SonarCloud Documentation](https://docs.sonarcloud.io)
- [Slack API Documentation](https://api.slack.com)
