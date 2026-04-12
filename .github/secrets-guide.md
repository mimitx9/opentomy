# GitHub Secrets Guide — Opentomy CI/CD

All secrets are configured at **Settings > Secrets and variables > Actions** in the GitHub repository.

---

## Required Secrets

### VPS / SSH

| Secret | Description | Example |
|--------|-------------|---------|
| `VPS_HOST` | IP address or domain of the production VPS | `203.0.113.42` |
| `VPS_USER` | SSH username on the VPS | `ubuntu` or `deploy` |
| `VPS_SSH_KEY` | Private SSH key (RSA or Ed25519, entire contents of `~/.ssh/id_ed25519`) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | SSH port (optional, defaults to `22`) | `22` |
| `DEPLOY_DIR` | Absolute path to the deployment directory on the VPS | `/opt/opentomy` |

**How to generate an SSH key pair for the deploy user:**
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/opentomy_deploy
# Add public key to VPS: cat ~/.ssh/opentomy_deploy.pub >> ~/.ssh/authorized_keys
# Add private key as VPS_SSH_KEY secret: cat ~/.ssh/opentomy_deploy
```

---

### GHCR (GitHub Container Registry)

| Secret | Description |
|--------|-------------|
| `GHCR_USERNAME` | GitHub username or organization that owns the package | your GitHub username |
| `GHCR_TOKEN` | GitHub Personal Access Token with `read:packages` scope (used by VPS to pull images) |

> Note: `GITHUB_TOKEN` is automatically provided by GitHub Actions for pushing images in the build job. `GHCR_TOKEN` is a separate PAT needed by the VPS to pull the image.

**How to create GHCR_TOKEN:**
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. New token with scope: `read:packages`
3. Copy and save as `GHCR_TOKEN` secret

---

### Application

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed app (used as build arg and environment URL) | `https://opentomy.com` |
| `PROD_ENV_FILE` | Entire contents of the production `.env` file (multi-line secret) |

**PROD_ENV_FILE** should contain all production environment variables, for example:
```
DATABASE_URL=postgresql://user:pass@host:5432/opentomy
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://opentomy.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET_NAME=...
```

---

## Summary Table

| Secret | Required | Used In |
|--------|----------|---------|
| `VPS_HOST` | Yes | deploy job |
| `VPS_USER` | Yes | deploy job |
| `VPS_SSH_KEY` | Yes | deploy job |
| `VPS_PORT` | No (default 22) | deploy job |
| `DEPLOY_DIR` | Yes | deploy job |
| `GHCR_USERNAME` | Yes | deploy job |
| `GHCR_TOKEN` | Yes | deploy job |
| `NEXT_PUBLIC_APP_URL` | Yes | build-and-push + deploy |
| `PROD_ENV_FILE` | Yes | deploy job |
| `GITHUB_TOKEN` | Auto | build-and-push (GHCR push) |

---

## VPS Prerequisites

The VPS must have:
- Docker Engine installed
- Docker Compose plugin (`docker compose`) installed
- A `docker-compose.yml` (or `compose.yml`) in `DEPLOY_DIR` that references the `ghcr.io/<owner>/opentomy/web:latest` image
- The deploy user added to the `docker` group: `sudo usermod -aG docker $USER`

### Example docker-compose.yml on VPS

```yaml
services:
  web:
    image: ghcr.io/<github-owner>/opentomy/web:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
```
