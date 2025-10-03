# GitHub Secrets Quick Reference

## ⚠️ About the Linter Warnings

The warnings you see (e.g., "Context access might be invalid: SONAR_TOKEN") are **normal and expected**. They simply mean:

- The GitHub Actions linter cannot verify if these secrets exist in your repository
- You need to configure them in **Settings > Secrets and variables > Actions**
- The workflow will still run, but will skip steps that require missing secrets

## Quick Setup Checklist

### Option 1: Minimal Setup (No Secrets Required)

✅ Just push your code - the pipeline will run tests and build Docker images

### Option 2: Full Setup (All Features Enabled)

Configure these in **Settings > Secrets and variables > Actions**:

- [ ] **SONAR_TOKEN** - Code quality analysis (optional)
- [ ] **STAGING_HOST** - Staging server hostname
- [ ] **STAGING_USER** - Staging SSH username  
- [ ] **STAGING_SSH_KEY** - Staging SSH private key
- [ ] **PRODUCTION_HOST** - Production server hostname
- [ ] **PRODUCTION_USER** - Production SSH username
- [ ] **PRODUCTION_SSH_KEY** - Production SSH private key
- [ ] **SLACK_WEBHOOK** - Slack notifications (optional)

## How to Add a Secret

1.Go to your repository on GitHub
2. Click **Settings** tab
3. Navigate to **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Enter the name and value
6. Click **Add secret**

## Details

See [SECRETS_CONFIGURATION.md](./SECRETS_CONFIGURATION.md) for complete documentation.

## TL;DR

**The warnings are fine!** They're just reminders to configure secrets. Your workflow will run successfully even without them - it will just skip the deployment and notification steps.
