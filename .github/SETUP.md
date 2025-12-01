# GitHub Actions Setup Guide

Quick setup guide for enabling CI/CD workflows for CIVENI USA Celebration Site.

## Prerequisites

- GitHub repository with admin access
- Supabase project
- Active Supabase account with access token

## Step-by-Step Setup

### Step 1: Configure Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

#### Required for All Workflows

| Secret Name | Where to Find | Required For |
|------------|---------------|--------------|
| `VITE_SUPABASE_URL` | Supabase Project Settings → API | CI, Build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Project Settings → API → anon/public | CI, Build |

#### Required for Supabase Deployment

| Secret Name | Where to Find | Required For |
|------------|---------------|--------------|
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens | Function Deploy |
| `SUPABASE_PROJECT_REF` | Supabase Project Settings → General → Reference ID | Function Deploy |

#### Optional (for Edge Functions)

| Secret Name | Where to Find | Required For |
|------------|---------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | Payment Functions |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks | Webhook Handler |

---

### Step 2: Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", select: **Allow all actions and reusable workflows**
3. Under "Workflow permissions", select: **Read and write permissions**
4. Check: **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

---

### Step 3: Enable Branch Protection (Recommended)

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. Select status checks:
   - `Lint, Type Check & Build`
   - `Code Quality & Build Check`
6. Click **Create** or **Save changes**

---

### Step 4: Test Workflows

#### Test CI Pipeline

```bash
# Create a test branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# Testing CI" >> test.md

# Commit and push
git add test.md
git commit -m "test: verify CI pipeline"
git push origin test/ci-pipeline

# Create a pull request and watch the checks run
```

#### Test cPanel Build

1. Go to **Actions** tab
2. Select **Build cPanel Package**
3. Click **Run workflow**
4. Select branch: `main`
5. Select mode: `development`
6. Click **Run workflow**
7. Wait for completion
8. Download artifact to verify

#### Test Supabase Deployment (Optional)

⚠️ **Warning:** This will deploy to your Supabase project

1. Go to **Actions** tab
2. Select **Deploy Supabase Functions**
3. Click **Run workflow**
4. Select environment: `staging` (if you have it)
5. Leave function_name empty
6. Click **Run workflow**

---

### Step 5: Add Status Badges (Optional)

Add to your `README.md`:

```markdown
## Build Status

![CI](https://github.com/USERNAME/REPO_NAME/actions/workflows/ci.yml/badge.svg)
![PR Checks](https://github.com/USERNAME/REPO_NAME/actions/workflows/pr-checks.yml/badge.svg)
```

Replace `USERNAME/REPO_NAME` with your GitHub username and repository name.

---

## Verification Checklist

After setup, verify:

- [ ] All required secrets are configured
- [ ] CI workflow runs on push to main
- [ ] PR checks run on pull requests
- [ ] Manual workflows are accessible in Actions tab
- [ ] Build artifacts are generated correctly
- [ ] Branch protection is enabled (if desired)

---

## Common Issues

### Issue: "Resource not accessible by integration"

**Solution:** Check workflow permissions in Settings → Actions → General → Workflow permissions

### Issue: Workflows not appearing

**Solution:**
1. Ensure workflow files are in `.github/workflows/` directory
2. Check YAML syntax (use a YAML validator)
3. Push to main branch (workflows must be on default branch)

### Issue: Build fails with "Missing environment variables"

**Solution:** Verify all required secrets are added in repository settings

### Issue: Supabase deployment fails

**Solution:**
1. Check if access token is valid (tokens expire)
2. Verify project reference ID is correct
3. Ensure you have permissions on the Supabase project

---

## Next Steps

1. **Set up staging environment** (optional)
   - Create a staging Supabase project
   - Add staging secrets with `_STAGING` suffix
   - Modify workflows to support staging

2. **Add automated tests** (optional)
   - Install testing framework (Vitest, Jest)
   - Add test scripts to package.json
   - Add test job to CI workflow

3. **Set up automated deployment** (optional)
   - Configure cPanel FTP/SSH access
   - Add deployment step to build-cpanel workflow
   - Or use a deployment service like Netlify/Vercel

4. **Configure notifications** (optional)
   - Slack integration for workflow status
   - Email notifications for failed builds
   - Discord webhooks

---

## Getting Help

- **Workflow Issues:** Check logs in Actions tab → Select workflow run → View logs
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
- **Project Docs:** See `.github/workflows/README.md` for detailed workflow documentation

---

## Maintenance

### Monthly Tasks
- [ ] Review and update dependencies
- [ ] Check for workflow updates
- [ ] Verify secrets haven't expired
- [ ] Review security audit results

### After Major Updates
- [ ] Test all workflows
- [ ] Update Node.js version if needed
- [ ] Review and update dependencies
- [ ] Check for breaking changes in actions

---

**Setup complete!** 🎉

Your CI/CD pipeline is now ready. Push code changes or create pull requests to see it in action.
