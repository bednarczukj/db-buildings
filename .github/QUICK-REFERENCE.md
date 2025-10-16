# CI/CD Quick Reference

## 🚀 One-Page Overview

### Pipeline Status

```
┌─────────────────────────────────────────────────┐
│ CI/CD Pipeline Status                           │
├─────────────────────────────────────────────────┤
│ ✅ Lint & Code Quality         ~1-2 min         │
│ ✅ Unit Tests                  ~2-3 min         │
│ ✅ Production Build            ~2-3 min         │
│ ✅ Summary                     ~10 sec          │
├─────────────────────────────────────────────────┤
│ 📦 Total Time: ~6-8 minutes                     │
└─────────────────────────────────────────────────┘
```

### Quick Commands

```bash
# Run locally before pushing
npm run lint              # Check code quality
npm run test:run          # Run unit tests
npm run build             # Test production build

# Fix issues
npm run lint:fix          # Auto-fix lint errors
npm run test              # Run tests in watch mode
```

## 📋 Setup Checklist

- [ ] Read `.github/SETUP-GUIDE.md`
- [ ] Add `SUPABASE_ANON_KEY` secret
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] Run pipeline manually first time
- [ ] Verify all jobs pass
- [ ] Add badge to README (optional)

## 🔑 Required Secrets

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `SUPABASE_ANON_KEY` | Public API key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key | Supabase Dashboard → Settings → API |

## 🎯 Triggers

| Event | Branch | Status |
|-------|--------|--------|
| Push | `master` | ✅ Auto |
| Pull Request | to `master` | ✅ Auto |
| Manual | any | ✅ On-demand |

## 📊 Pipeline Jobs

### 1. Lint & Code Quality
```yaml
Dependencies: None
Runs: Parallel with Unit Tests
Time: ~1-2 min
```

**What it does:**
- Checks TypeScript syntax
- Verifies code style (ESLint)
- Checks formatting (Prettier)

**Fix locally:**
```bash
npm run lint:fix
npx prettier --write .
```

### 2. Unit Tests
```yaml
Dependencies: None
Runs: Parallel with Lint
Time: ~2-3 min
```

**What it does:**
- Runs Vitest tests
- Generates coverage report
- Uploads to Codecov (optional)

**Fix locally:**
```bash
npm run test
npm run test:coverage
```

### 3. Production Build
```yaml
Dependencies: Lint + Unit Tests
Runs: After both pass
Time: ~2-3 min
```

**What it does:**
- Builds for production
- Verifies no build errors
- Uploads artifacts

**Fix locally:**
```bash
npm run build
npm run preview
```

### 4. Summary
```yaml
Dependencies: All jobs
Runs: Always (even if jobs fail)
Time: ~10 sec
```

**What it does:**
- Collects results
- Generates summary
- Marks pipeline status

## 🔍 Troubleshooting

### Pipeline Failed - What Now?

1. **Check which job failed**
   - Go to Actions tab
   - Click on the failed run
   - Look for red ❌ marks

2. **Common Issues**

   **Lint Failed:**
   ```bash
   npm run lint:fix  # Auto-fix
   ```

   **Tests Failed:**
   ```bash
   npm run test      # Debug locally
   ```

   **Build Failed:**
   ```bash
   npm run build     # Check errors
   ```

3. **Download Artifacts**
   - Scroll to bottom of workflow run
   - Download `production-build` or reports
   - Inspect locally

### Secrets Not Working?

```bash
# Verify secrets exist:
GitHub → Settings → Secrets and variables → Actions

# Check names match exactly:
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## 📁 File Structure

```
.github/
├── workflows/
│   └── ci.yml                # Main workflow file
├── SETUP-GUIDE.md           # Start here! Step-by-step setup
├── README.md                # Technical documentation
├── ARCHITECTURE.md          # Detailed architecture & diagrams
└── QUICK-REFERENCE.md       # This file - quick overview
```

## 🎨 Badge Code

Add to your `README.md`:

```markdown
![CI/CD Pipeline](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)
```

Replace `USERNAME` and `REPO` with your values.

## 💡 Tips

### Before Every Push

```bash
# Run this sequence:
npm run lint && npm run test:run && npm run build

# If all pass locally, pipeline should pass too
```

### Branch Protection

Enable in `Settings` → `Branches`:
- ✅ Require status checks before merging
- ✅ Require branches to be up to date

### Cache Management

GitHub automatically caches `node_modules`:
- First run: ~3-4 min (no cache)
- Subsequent: ~1-2 min (with cache)

To clear cache, go to `Actions` → `Caches` → Delete cache

## 📈 Next Steps

After basic setup works:

1. ✅ Enable branch protection
2. ✅ Add status badge to README
3. 🔄 Enable E2E tests (requires test environment)
4. 🚀 Add deployment step (DigitalOcean/Vercel)
5. 📊 Add performance monitoring
6. 🔔 Add notifications (Slack/Discord)

## 🔗 Quick Links

| Link | Description |
|------|-------------|
| [Setup Guide](.github/SETUP-GUIDE.md) | Complete setup instructions |
| [Technical Docs](.github/README.md) | Detailed documentation |
| [Architecture](.github/ARCHITECTURE.md) | Diagrams and deep dive |
| [Actions Tab](../../actions) | View pipeline runs |
| [Settings](../../settings/secrets/actions) | Manage secrets |

## 📞 Need Help?

1. Check [SETUP-GUIDE.md](SETUP-GUIDE.md) for detailed instructions
2. Review [README.md](README.md) troubleshooting section
3. Look at logs in Actions tab
4. Verify local tests pass first

---

**Remember:** Pipeline reflects your local environment. If tests pass locally, they should pass in CI! 🎉

