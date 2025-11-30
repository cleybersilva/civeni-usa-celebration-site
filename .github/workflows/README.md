# GitHub Actions Workflows

This directory contains automated workflows for continuous integration and deployment of the CIVENI USA Celebration Site.

## Available Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **lint-and-build**: Runs ESLint, TypeScript type checking, and production build
- **security-check**: Runs npm audit to check for vulnerabilities

**Purpose:** Ensures code quality and build integrity on every push and PR.

---

### 2. PR Checks (`pr-checks.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened

**Jobs:**
- **quality-check**: Comprehensive code quality checks including linting, type checking, build, and bundle size analysis
- **dependency-review**: Reviews new dependencies for security issues and license compliance

**Purpose:** Provides detailed feedback on pull requests before merging.

---

### 3. Deploy Supabase Functions (`deploy-supabase-functions.yml`)

**Triggers:**
- Manual trigger via workflow_dispatch

**Inputs:**
- `function_name` (optional): Specific function to deploy, or leave empty to deploy all
- `environment` (required): `production` or `staging`

**Purpose:** Deploy Edge Functions to Supabase

**Usage:**
1. Go to Actions → Deploy Supabase Functions
2. Click "Run workflow"
3. Select environment
4. (Optional) Enter specific function name
5. Click "Run workflow"

---

### 4. Build cPanel Package (`build-cpanel.yml`)

**Triggers:**
- Manual trigger via workflow_dispatch
- Push of version tags (e.g., `v1.0.0`)

**Inputs:**
- `mode` (required): `production` or `development`

**Purpose:** Creates deployment-ready ZIP file for cPanel hosting

**Output:**
- Artifact: `cpanel-package-{mode}-{sha}`
- Files: `civeni-saas-cpanel.zip` and checksum

**Usage:**
1. Go to Actions → Build cPanel Package
2. Click "Run workflow"
3. Select build mode (production/development)
4. Click "Run workflow"
5. Download artifact from workflow run
6. Upload to cPanel and extract

**For tagged releases:**
```bash
git tag v1.0.0
git push origin v1.0.0
```
This automatically creates a GitHub Release with the deployment package.

---

## Required Secrets

Configure these secrets in your GitHub repository settings:

### Build Secrets
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/public key

### Supabase Deployment Secrets
- `SUPABASE_ACCESS_TOKEN`: Personal access token from Supabase
- `SUPABASE_PROJECT_REF`: Your Supabase project reference ID

### Optional Secrets (for Edge Functions)
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret

---

## How to Set Up Secrets

### 1. Get Supabase Credentials

**Access Token:**
1. Go to https://supabase.com/dashboard/account/tokens
2. Generate a new access token
3. Copy and save it securely

**Project Reference:**
1. Go to your Supabase project
2. Settings → General
3. Copy "Reference ID"

### 2. Add Secrets to GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its value

---

## Workflow Status Badges

Add these badges to your README.md to show workflow status:

```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)
![PR Checks](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/pr-checks.yml/badge.svg)
```

---

## Common Scenarios

### Deploying to Production

1. **Deploy Edge Functions:**
   - Actions → Deploy Supabase Functions → Run workflow
   - Environment: production
   - Leave function_name empty to deploy all

2. **Build cPanel Package:**
   - Actions → Build cPanel Package → Run workflow
   - Mode: production
   - Download artifact and upload to cPanel

### Hotfix Deployment

1. Create hotfix branch
2. Make changes
3. Push to trigger CI
4. Create PR to see PR checks
5. Merge to main
6. Manually run deployment workflows if needed

### Rolling Back

1. Find the last good workflow run
2. Download that artifact
3. Deploy to cPanel
4. Or checkout that commit and re-run workflows

---

## Troubleshooting

### Build Fails on CI

**Check:**
- All required secrets are configured
- TypeScript errors in code
- ESLint violations
- Node version compatibility (should be 20)

### Supabase Function Deployment Fails

**Check:**
- `SUPABASE_ACCESS_TOKEN` is valid and not expired
- `SUPABASE_PROJECT_REF` is correct
- Function code has no syntax errors
- Required environment variables are set in Supabase dashboard

### cPanel Package Won't Extract

**Check:**
- ZIP file downloaded completely (verify checksum)
- cPanel has enough disk space
- File permissions in cPanel
- .htaccess file is included in package

---

## Maintenance

### Updating Node Version

Edit the `node-version` in workflow files:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Update this
```

### Adding New Function Secrets

Edit `deploy-supabase-functions.yml`:
```yaml
- name: Set function secrets
  run: |
    supabase secrets set YOUR_SECRET=${{ secrets.YOUR_SECRET }}
```

---

## Performance Tips

1. **Cache Dependencies:** Workflows already use npm cache
2. **Parallel Jobs:** Independent checks run in parallel
3. **Conditional Execution:** Some steps only run when needed
4. **Artifact Retention:** Set to 30 days to save storage

---

## Security Notes

- Never commit secrets or API keys
- Use repository secrets for sensitive data
- Enable branch protection on `main`
- Require PR reviews before merging
- Keep dependencies updated (dependency-review catches this)

---

## Support

For issues with workflows:
1. Check workflow logs in Actions tab
2. Verify all secrets are configured
3. Review recent changes to workflow files
4. Check GitHub Actions status page
