# CI/CD and Deployment Design

**Goal:** Set up branching strategy, CI pipeline, and deployment for all 4 apps (API, Web, Desktop, Mobile).

**Approach:** GitHub Actions for CI + native builds. Railway GitHub Integration for API/Web CD. Tauri builds via GitHub Releases. Expo builds via EAS Build.

---

## Branching Strategy

```
main (production) ← only merges from develop via PR
  └── develop (staging) ← PRs from feature branches
        ├── feature/*
        ├── fix/*
        └── chore/*
```

- **`main`**: Protected. Only accepts merges from `develop` via PR. Requires CI to pass.
- **`develop`**: Protected. Accepts PRs from feature branches. Requires CI to pass.
- **Feature branches**: `feature/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`, `test/*`.
- **Merge strategy**: Squash merge to keep history clean.
- Auto-delete branches after merge.

## CI Pipeline (GitHub Actions)

**File:** `.github/workflows/ci.yml`

**Trigger:** PR to `develop` or `main`

**Jobs:**

1. **lint** — `biome check .`
2. **typecheck** — `turbo typecheck`
3. **test** — `turbo test` (when tests exist)

All jobs run in parallel. Uses pnpm caching for speed.

## CD: Railway (API + Web)

**Integration:** Railway GitHub Integration (native, not CLI-based).

Railway auto-deploys on push to the connected branches:

| Service     | `develop` branch | `main` branch |
|-------------|:---:|:---:|
| API (Node.js) | staging env | production env |
| Web (static)  | staging env | production env |
| PostgreSQL    | staging env | production env |
| Redis         | staging env | production env |

**API deployment:**
- Build: `pnpm --filter @rumbo/api build`
- Start: `pnpm --filter @rumbo/api start`
- Health check: `GET /health`

**Web deployment:**
- Build: `pnpm --filter @rumbo/web build`
- Output: `apps/web/dist` (static files)
- Served as static site

Each environment has its own database and Redis instance. Environment variables are managed per Railway environment.

## Desktop Release (Tauri + GitHub Actions)

**File:** `.github/workflows/desktop-release.yml`

**Trigger:** Push tag `v*` to `main`

**Matrix:** macOS (latest), Ubuntu (latest), Windows (latest)

**Steps:**
1. Checkout code
2. Setup Rust toolchain
3. Setup Node.js + pnpm
4. Install dependencies
5. Build web app (`pnpm --filter @rumbo/web build`)
6. Build Tauri app (`pnpm --filter @rumbo/desktop build`)
7. Upload artifacts to GitHub Release

**Outputs:** `.dmg` (macOS), `.msi`/`.exe` (Windows), `.deb`/`.AppImage` (Linux)

## Mobile Build (Expo EAS + GitHub Actions)

**File:** `.github/workflows/mobile-build.yml`

**Trigger:** Push tag `v*` to `main`

**Steps:**
1. Checkout code
2. Setup Node.js + pnpm
3. Install dependencies
4. Setup EAS CLI
5. Run `eas build --platform all --non-interactive`

**Config:** `apps/mobile/eas.json` with build profiles:
- `development` — development client for testing
- `preview` — internal distribution (TestFlight / internal track)
- `production` — store submission (App Store / Play Store)

**Secrets required:** `EXPO_TOKEN` in GitHub repository secrets.

## Files to Create

```
.github/
└── workflows/
    ├── ci.yml                → CI: lint, typecheck, test (PRs)
    ├── desktop-release.yml   → Tauri multi-platform builds (tags)
    └── mobile-build.yml      → EAS Build trigger (tags)
apps/mobile/
└── eas.json                  → EAS Build profiles
```

## GitHub Repository Configuration

- Branch protection on `main`: require PR, require CI status checks, no direct push
- Branch protection on `develop`: require PR, require CI status checks
- Default merge strategy: squash merge
- Auto-delete branches after merge
- Disable wiki (not needed)
- Secrets: `EXPO_TOKEN`

## Railway Project Configuration

- Connect GitHub repo to Railway project
- Create two environments: `staging` (→ develop branch) and `production` (→ main branch)
- Services per environment: API, Web, PostgreSQL, Redis
- Configure environment variables per environment
- Enable health checks for API service
