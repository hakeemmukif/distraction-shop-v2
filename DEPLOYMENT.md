# Deployment Guide - Distraction Shop v2.0

This guide explains how to deploy the Distraction Shop application using automated CI/CD pipelines.

## Overview

The project uses **GitHub Actions** for continuous integration and deployment to **Vercel**. Every push to `main` triggers a production deployment, and every pull request creates a preview deployment.

---

## Prerequisites

### 1. Vercel Account Setup

1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI globally:
   ```bash
   npm install -g vercel@latest
   ```
3. Login to Vercel CLI:
   ```bash
   vercel login
   ```

### 2. Link Project to Vercel

Run this command in your project root:

```bash
vercel link
```

This will create a `.vercel` directory with project configuration. You'll need the project ID and organization ID from this directory.

---

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | Vercel Dashboard → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel organization ID | Found in `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Found in `.vercel/project.json` after `vercel link` |
| `DATABASE_URL` | PostgreSQL connection string | Railway dashboard or your database provider |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe Dashboard → Developers → API keys |
| `NEXTAUTH_SECRET` | JWT signing secret | Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Cloudinary Dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | Cloudinary Settings → Upload |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Stripe Dashboard → Webhooks (optional for CI) |

### Getting Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Select the appropriate scope (Full Account or specific projects)
5. Copy the token and add it to GitHub secrets

### Getting Vercel IDs

After running `vercel link`, check `.vercel/project.json`:

```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

---

## Vercel Environment Variables

Add these environment variables in Vercel Dashboard:

**Project Settings → Environment Variables**

### Production Environment

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your Railway PostgreSQL URL | Production |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` (live key) | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` (live key) | Production |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhooks | Production |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Production |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Production |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Your upload preset | Production |
| `NEXT_PUBLIC_URL` | `https://your-domain.com` | Production |
| `SHOP_SCHEDULE` | JSON schedule config (see below) | Production |

### Preview Environment

Use the same variables but with **test/development** values:
- `STRIPE_SECRET_KEY` → `sk_test_xxx`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_test_xxx`
- `DATABASE_URL` → Development database URL

---

## Shop Schedule Configuration

Set the `SHOP_SCHEDULE` environment variable with this JSON format:

```json
{
  "timezone": "Asia/Kuala_Lumpur",
  "schedule": {
    "monday": { "open": "10:00", "close": "18:00" },
    "tuesday": { "open": "10:00", "close": "18:00" },
    "wednesday": { "open": "10:00", "close": "18:00" },
    "thursday": { "open": "10:00", "close": "18:00" },
    "friday": { "open": "10:00", "close": "18:00" },
    "saturday": { "open": "11:00", "close": "17:00" },
    "sunday": { "closed": true }
  },
  "overrideStatus": null
}
```

**Note:** Add this as a single-line JSON string in Vercel environment variables.

---

## Environment Mode Detection

The application **automatically detects** the runtime environment based on the `STRIPE_SECRET_KEY`:

| Secret Key Format | Detected Mode | Behavior |
|------------------|---------------|----------|
| `sk_test_dummy` or invalid/missing | **Mock** | Generates fake checkout sessions and orders (no real Stripe API calls) |
| `sk_test_xxx` (valid Stripe test key) | **Staging** | Uses Stripe Test Mode for real API interactions |
| `sk_live_xxx` (valid Stripe live key) | **Production** | Uses Stripe Live Mode for real customer transactions |

### Key Benefits

- **No manual configuration needed** - just set the appropriate Stripe key
- **Prevents accidental live charges** - invalid keys safely default to mock mode
- **Seamless local development** - use dummy keys for testing without Stripe account
- **Environment parity** - same codebase works in all environments

### Recommended Setup

| Environment | Stripe Key | Purpose |
|------------|------------|---------|
| **Local Development** | `sk_test_dummy` | Work offline without Stripe account |
| **Staging (main branch)** | `sk_test_xxx` | Test with real Stripe test mode |
| **Production (production branch)** | `sk_live_xxx` | Handle real customer payments |

---

## Deployment Workflow

### Automatic Deployments

The project uses a **three-environment deployment strategy**:

| Branch | Environment | URL Pattern | Auto-Deploy |
|--------|-------------|-------------|-------------|
| **Pull Requests** | Preview | `project-name-git-pr-N.vercel.app` | Yes (on PR) |
| **`main`** | **Staging** | `project-name-git-main.vercel.app` | Yes (on push) |
| **`production`** | **Production** | `your-domain.vercel.app` | Yes (on push) |

#### Staging Deployment (Push to `main`)

1. Developer pushes code to `main` branch
2. GitHub Actions triggers `.github/workflows/deploy.yml`
3. Workflow runs:
   - ✅ TypeScript type checking
   - ✅ ESLint linting
   - ✅ Build verification
   - 🚀 Deploy to Vercel staging (preview environment)
4. Staging URL posted as commit comment

**Use Case:** Test features in a production-like environment before going live.

#### Production Deployment (Push to `production`)

1. Staging is tested and ready for production
2. Merge `main` into `production` branch:
   ```bash
   git checkout production
   git merge main
   git push origin production
   ```
3. GitHub Actions triggers production deployment
4. Production URL posted as commit comment

**Use Case:** Deploy stable, tested code to live environment accessible to customers.

#### Preview Deployment (Pull Request)

1. Developer creates a pull request to `main` or `production`
2. GitHub Actions triggers preview deployment
3. Workflow runs:
   - ✅ TypeScript type checking
   - ✅ ESLint linting
   - ✅ Build verification
   - 🚀 Deploy to Vercel preview environment
4. Preview URL posted as PR comment (updates on every commit)

**Use Case:** Test PR changes in isolation before merging.

### Creating the Production Branch

The `production` branch doesn't exist yet. Create it from `main` when ready for first production deployment:

```bash
# Ensure main branch is up to date
git checkout main
git pull origin main

# Create production branch from main
git checkout -b production

# Push to remote (this triggers first production deployment)
git push -u origin production
```

**Important:** After creating the production branch, only merge from `main` after thorough testing in staging.

### Manual Deployment

If you need to deploy manually:

```bash
# Staging deployment (from main branch)
vercel

# Production deployment (from production branch)
git checkout production
vercel --prod

# Preview deployment (from any branch)
vercel
```

---

## Vercel Configuration

The `vercel.json` file includes:

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### API Caching
- API routes: `Cache-Control: no-store, max-age=0`

### Region
- Primary region: `sin1` (Singapore) - closest to Malaysia

### Redirects
- Unauthenticated `/admin` access → `/auth/login`

---

## Database Migrations

Before deploying to production, ensure database is migrated:

```bash
# Run migrations
DATABASE_URL="your-production-url" npx prisma migrate deploy

# Seed superadmin user (first time only)
DATABASE_URL="your-production-url" npm run db:seed
```

---

## Stripe Webhook Setup

After deploying to production:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Monitoring and Logs

### Vercel Dashboard

- **Deployments:** View all deployments and their status
- **Logs:** Real-time function logs (serverless API routes)
- **Analytics:** Traffic and performance metrics
- **Environment Variables:** Manage secrets securely

### GitHub Actions

- **Actions Tab:** View workflow runs
- **Build Logs:** Detailed logs for each step
- **Deployment Status:** Success/failure notifications

---

## Rollback Procedure

If a deployment causes issues:

### Option 1: Vercel Dashboard
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Option 2: Git Revert
1. Revert the problematic commit:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
2. GitHub Actions will automatically deploy the reverted version

---

## Custom Domain Setup

1. **Add Domain in Vercel:**
   - Project Settings → Domains
   - Add your custom domain (e.g., `distractionshop.com`)

2. **Configure DNS:**
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → `76.76.21.21`

3. **Update Environment Variables:**
   - Set `NEXT_PUBLIC_URL` to your custom domain
   - Redeploy for changes to take effect

---

## Troubleshooting

### Build Fails on Vercel

**Check:**
- Environment variables are set correctly
- Database is accessible (check Railway firewall)
- Stripe keys are valid
- `npm run build` works locally

### API Routes Return 500

**Check:**
- Vercel function logs for error details
- Environment variables in Vercel dashboard
- Stripe API keys are correct environment (test/live)

### Database Connection Fails

**Check:**
- `DATABASE_URL` is correct
- Railway database is running
- Connection string includes correct credentials
- Firewall allows Vercel IPs (or set to public)

### Webhook Not Receiving Events

**Check:**
- Webhook URL is correct in Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` is set in Vercel
- Endpoint is deployed and accessible
- Vercel function logs show incoming requests

---

## Performance Optimization

### Enable Vercel Features

1. **Edge Functions:** Convert API routes to edge for faster response
2. **Image Optimization:** Use Next.js Image component (already implemented)
3. **ISR (Incremental Static Regeneration):**
   ```typescript
   export const revalidate = 60; // Revalidate every 60 seconds
   ```

### Caching Strategy

- Static pages: Cached at CDN edge
- API routes: No cache (configured in `vercel.json`)
- Product images: Cached via Cloudinary CDN

---

## Cost Monitoring

### Vercel Usage

**Free Tier Limits:**
- 100GB bandwidth/month
- 100GB-hrs serverless function execution
- Unlimited sites

**Paid Plan ($20/month):**
- Needed if free tier exceeded
- Custom domains on all projects
- Advanced analytics

### Railway Database

**Free Tier:**
- 512MB storage
- 5GB bandwidth
- Should be sufficient for this project (minimal DB usage)

---

## Security Checklist

Before production deployment:

- [ ] All environment variables set in Vercel
- [ ] Stripe webhook secret configured
- [ ] Database connection secured (firewall configured)
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Default superadmin password changed
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] Security headers configured (in `vercel.json`)
- [ ] API rate limiting implemented (TODO)
- [ ] Error messages don't leak sensitive info

---

## Support

If you encounter issues:

1. Check Vercel function logs
2. Check GitHub Actions workflow logs
3. Review this deployment guide
4. Contact Vercel support (for platform issues)
5. Check Next.js documentation

---

## Quick Reference Commands

```bash
# Link to Vercel project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs <deployment-url>

# Pull environment variables
vercel env pull

# Check deployment status
vercel ls
```

---

**Last Updated:** October 2025
**Maintained By:** Distraction Shop Team
