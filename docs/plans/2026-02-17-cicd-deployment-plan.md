# CI/CD and Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up branching strategy, GitHub Actions CI, Railway CD, Tauri desktop releases, and Expo EAS mobile builds.

**Architecture:** GitHub Actions handles CI (lint, typecheck, test on PRs) and native builds (Tauri, EAS). Railway GitHub Integration handles CD for API and Web via auto-deploy on branch push. Two Railway environments (staging → develop, production → main).

**Tech Stack:** GitHub Actions, Railway, Tauri CLI, EAS CLI, Biome, Turborepo

---

### Task 1: Merge feature branch and create develop branch

**Context:** All local-setup work is on `feature/local-setup`. We need to get it into `main`, then create `develop` from `main`.

**Step 1: Push feature branch and create PR to main**

```bash
git push -u origin feature/local-setup
gh pr create --base main --title "feat: scaffold monorepo with all apps and packages" --body "$(cat <<'EOF'
## Summary
- Monorepo structure: Turborepo + pnpm workspaces
- Apps: API (Hono), Web (React+Vite), Desktop (Tauri v2), Mobile (Expo SDK 54)
- Packages: shared, db (Drizzle), ui
- Docker Compose: PostgreSQL 18 + Redis 8
- Tooling: Biome 2.x, TypeScript 5.9 strict

## Test plan
- [x] `pnpm dev` starts infra + API + web
- [x] `pnpm dev:desktop` opens Tauri window with web app
- [x] `pnpm dev:mobile` starts Expo Metro bundler
- [x] `pnpm typecheck` passes all packages
- [x] `pnpm check` passes Biome lint

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 2: Merge PR via squash merge**

```bash
gh pr merge --squash --delete-branch
```

**Step 3: Update local main**

```bash
git checkout main
git pull origin main
```

**Step 4: Create develop branch from main**

```bash
git checkout -b develop
git push -u origin develop
```

**Step 5: Commit** — N/A (no code changes)

---

### Task 2: Configure GitHub repository settings

**Context:** Configure merge strategy, auto-delete branches, disable wiki.

**Step 1: Set repo settings via gh CLI**

```bash
# Enable only squash merge, disable merge commit and rebase
gh api repos/Dsantiagomj/rumbo -X PATCH \
  -f default_branch=main \
  -F delete_branch_on_merge=true \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F has_wiki=false \
  -F squash_merge_commit_title=PR_TITLE \
  -F squash_merge_commit_message=PR_BODY
```

**Step 2: Verify settings**

```bash
gh repo view --json squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,deleteBranchOnMerge,hasWikiEnabled
```

Expected: `squashMergeAllowed: true`, everything else `false`, `deleteBranchOnMerge: true`

**Step 3: Commit** — N/A (GitHub settings, no code)

---

### Task 3: Set up branch protection rules

**Context:** Protect `main` and `develop` branches. `main` only accepts merges from `develop`. Both require CI to pass.

**Step 1: Protect main branch**

```bash
gh api repos/Dsantiagomj/rumbo/branches/main/protection -X PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint", "typecheck"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0
  },
  "restrictions": null
}
EOF
```

**Step 2: Protect develop branch**

```bash
gh api repos/Dsantiagomj/rumbo/branches/develop/protection -X PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint", "typecheck"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0
  },
  "restrictions": null
}
EOF
```

**Step 3: Verify protection**

```bash
gh api repos/Dsantiagomj/rumbo/branches/main/protection --jq '.required_status_checks.contexts'
gh api repos/Dsantiagomj/rumbo/branches/develop/protection --jq '.required_status_checks.contexts'
```

Expected: `["lint","typecheck"]` for both

**Step 4: Commit** — N/A (GitHub settings, no code)

---

### Task 4: Create CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the CI workflow**

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm check

  typecheck:
    name: Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm typecheck
```

**Step 2: Verify YAML is valid**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "Valid YAML"
```

Expected: `Valid YAML`

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint and typecheck workflow for PRs"
```

---

### Task 5: Create Desktop Release workflow

**Files:**
- Create: `.github/workflows/desktop-release.yml`

**Step 1: Create the Tauri release workflow**

```yaml
name: Desktop Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build:
    name: Build (${{ matrix.os }})
    strategy:
      fail-fast: false
      matrix:
        include:
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
          - os: windows-latest
            target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'pnpm'

      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install Linux dependencies
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev

      - run: pnpm install --frozen-lockfile

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          projectPath: apps/desktop
          tagName: ${{ github.ref_name }}
          releaseName: 'Rumbo ${{ github.ref_name }}'
          releaseBody: 'See the changelog for details.'
          releaseDraft: false
          prerelease: false
```

**Step 2: Verify YAML is valid**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/desktop-release.yml'))" && echo "Valid YAML"
```

Expected: `Valid YAML`

**Step 3: Commit**

```bash
git add .github/workflows/desktop-release.yml
git commit -m "ci: add Tauri desktop release workflow"
```

---

### Task 6: Create Mobile Build workflow + EAS config

**Files:**
- Create: `.github/workflows/mobile-build.yml`
- Create: `apps/mobile/eas.json`

**Step 1: Create EAS build profiles**

`apps/mobile/eas.json`:
```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

**Step 2: Create the mobile build workflow**

`.github/workflows/mobile-build.yml`:
```yaml
name: Mobile Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    name: EAS Build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build for all platforms
        working-directory: apps/mobile
        run: eas build --platform all --non-interactive --profile production
```

**Step 3: Verify YAML is valid**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/mobile-build.yml'))" && echo "Valid YAML"
```

Expected: `Valid YAML`

**Step 4: Commit**

```bash
git add apps/mobile/eas.json .github/workflows/mobile-build.yml
git commit -m "ci: add Expo EAS mobile build workflow"
```

---

### Task 7: Add Railway configuration files

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`

**Context:** Railway can auto-detect Node.js apps, but explicit Dockerfiles give more control over the monorepo build. Each app needs its own Dockerfile that builds from the monorepo root.

**Step 1: Create API Dockerfile**

`apps/api/Dockerfile`:
```dockerfile
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.6.2 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile --filter @rumbo/api...

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "start"]
```

**Step 2: Create Web Dockerfile**

`apps/web/Dockerfile`:
```dockerfile
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.6.2 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --filter @rumbo/web...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web
COPY tooling ./tooling
RUN cd apps/web && pnpm build

FROM nginx:alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Step 3: Verify Dockerfiles parse correctly**

```bash
docker build --check -f apps/api/Dockerfile . 2>&1 && echo "API Dockerfile OK"
docker build --check -f apps/web/Dockerfile . 2>&1 && echo "Web Dockerfile OK"
```

**Step 4: Commit**

```bash
git add apps/api/Dockerfile apps/web/Dockerfile
git commit -m "chore: add Dockerfiles for Railway deployment"
```

---

### Task 8: Configure Railway project (manual + CLI)

**Context:** This task requires interactive Railway CLI setup. Install Railway CLI, link project, configure services and environments.

**Step 1: Install Railway CLI**

```bash
brew install railway
```

**Step 2: Login to Railway**

```bash
railway login
```

**Step 3: Link to existing Railway project**

```bash
railway link
```

Select the Rumbo project when prompted.

**Step 4: Create environments**

The user needs to configure in Railway dashboard (https://railway.com/dashboard):
1. Connect GitHub repo (Settings → Source → Connect GitHub)
2. Create `staging` environment linked to `develop` branch
3. Create `production` environment linked to `main` branch
4. Add services: API, Web, PostgreSQL, Redis per environment
5. Set environment variables per environment (DATABASE_URL, REDIS_URL, API_PORT, etc.)
6. Configure API root directory: `apps/api`
7. Configure Web root directory: `apps/web`
8. Set API health check path: `/health`

**Step 5: Commit** — N/A (Railway dashboard config)

---

### Task 9: Push workflows, create PR to develop, and verify CI

**Context:** Push all workflow files via a feature branch and create a PR to develop to verify CI works.

**Step 1: Push current branch with all workflow files**

```bash
git push -u origin feature/cicd-deployment
```

**Step 2: Create PR to develop**

```bash
gh pr create --base develop --title "ci: add GitHub Actions workflows and Railway config" --body "$(cat <<'PREOF'
## Summary
- CI workflow: lint + typecheck on PRs to develop/main
- Desktop release workflow: Tauri multi-platform builds on version tags
- Mobile build workflow: EAS Build trigger on version tags
- Dockerfiles for Railway deployment (API + Web)

## Test plan
- [ ] CI workflow runs on this PR (lint + typecheck pass)
- [ ] Desktop release workflow syntax is valid
- [ ] Mobile build workflow syntax is valid
- [ ] API Dockerfile builds successfully
- [ ] Web Dockerfile builds successfully

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PREOF
)"
```

**Step 3: Verify CI passes**

```bash
gh pr checks --watch
```

Expected: `lint` and `typecheck` checks pass.

**Step 4: Merge PR**

```bash
gh pr merge --squash --delete-branch
```

---

### Task 10: Test production deployment with version tag

**Context:** Create a version tag to trigger desktop release and mobile build workflows.

**Step 1: Merge develop into main**

```bash
git checkout main
git pull origin main
gh pr create --base main --head develop --title "release: v0.0.1 initial deployment" --body "Initial release for deployment testing."
gh pr merge --squash
```

**Step 2: Create and push version tag**

```bash
git checkout main
git pull origin main
git tag v0.0.1
git push origin v0.0.1
```

**Step 3: Verify workflows triggered**

```bash
gh run list --limit 5
```

Expected: `Desktop Release` and `Mobile Build` workflows appear as running/completed.

**Step 4: Verify Railway deployments**

Check Railway dashboard for successful deployments of API and Web in production environment.

**Step 5: Commit** — N/A (tagging, no code changes)
