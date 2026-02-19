# Rumbo

Personal finance management app for the Colombian context.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 24+ | [nodejs.org](https://nodejs.org) or use `.node-version` with [fnm](https://github.com/Schniz/fnm)/nvm |
| pnpm | 10.6.2 | `corepack enable && corepack prepare pnpm@10.6.2 --activate` |
| Docker | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Dsantiagomj/rumbo.git
cd rumbo

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Start local infrastructure (PostgreSQL + Redis)
pnpm infra:up

# 5. Run database migrations and seed
pnpm db:migrate
pnpm db:seed

# 6. Start development
pnpm dev          # API + Web
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database — for local dev, use the Docker PostgreSQL instance
DATABASE_URL=postgresql://rumbo:rumbo_dev@localhost:5432/rumbo?sslmode=disable

# API
API_PORT=3000
API_URL=http://localhost:3000

# Web
VITE_API_URL=http://localhost:3000

# Auth (Better Auth)
BETTER_AUTH_SECRET=dev-secret-change-in-production
BETTER_AUTH_URL=http://localhost:3000
```

**For local development**: The `DATABASE_URL` above connects to the Docker PostgreSQL instance started by `pnpm infra:up`. No external database needed.

**For production**: Uses Neon PostgreSQL. Get the connection string from the [Neon dashboard](https://console.neon.tech).

## Project Structure

```
rumbo/
├── apps/
│   ├── api/          # @rumbo/api — Hono REST API (Cloudflare Workers)
│   ├── web/          # @rumbo/web — React + Vite + Tailwind + Shadcn/ui
│   ├── mobile/       # @rumbo/mobile — React Native + Expo
│   └── desktop/      # @rumbo/desktop — Tauri (wraps web app)
├── packages/
│   ├── db/           # @rumbo/db — Drizzle ORM schemas, migrations, seed
│   ├── shared/       # @rumbo/shared — Types, Zod schemas, constants, utils
│   └── ui/           # @rumbo/ui — Shared React components
├── tooling/
│   ├── biome/        # @rumbo/biome-config — Linter + formatter config
│   └── typescript/   # @rumbo/typescript-config — Base TSConfig
├── docker-compose.yml
├── turbo.json
├── biome.json
└── pnpm-workspace.yaml
```

## Development Commands

### Start Development Servers

```bash
pnpm dev            # API + Web (most common)
pnpm dev:api        # API only
pnpm dev:web        # API + Web
pnpm dev:mobile     # API + Mobile (Expo)
pnpm dev:desktop    # API + Desktop (Tauri)
```

All `dev:*` commands automatically start Docker infrastructure (PostgreSQL + Redis).

### Database

```bash
pnpm db:generate    # Generate Drizzle migration files from schema changes
pnpm db:migrate     # Apply pending migrations
pnpm db:seed        # Seed database with initial data (Colombian categories, etc.)
pnpm db:studio      # Open Drizzle Studio (visual DB browser)
```

### Code Quality

```bash
pnpm check          # Run Biome linter + formatter (check only)
pnpm check:fix      # Run Biome linter + formatter (auto-fix)
pnpm typecheck      # TypeScript type checking across all packages
pnpm test           # Run unit tests (Vitest)
pnpm test:e2e       # Run E2E tests (Playwright)
```

### Build

```bash
pnpm build          # Build all packages and apps
```

### Infrastructure

```bash
pnpm infra:up       # Start PostgreSQL + Redis containers
pnpm infra:down     # Stop containers (preserves data)
pnpm infra:reset    # Stop containers, delete volumes, restart fresh
```

## Local Infrastructure

Docker Compose provides:

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL 18 | 5432 | `rumbo` / `rumbo_dev` / db: `rumbo` |
| Redis 8 | 6379 | No auth |

## Git Workflow

- **Branch naming**: `feature/*`, `fix/*`, `docs/*`, `chore/*`
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, etc.)
- **Protected branches**: `main` and `develop` — pre-push hook prevents direct pushes
- **Pre-commit**: Biome auto-formats staged files via lint-staged
- **Pre-push**: Runs `check` + `typecheck` + `test` before pushing

### Typical workflow

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# ... make changes ...

git add <files>
git commit -m "feat: add my feature"
git push -u origin feature/my-feature
# Pre-push hook runs checks automatically
# Create PR to develop
```

## Deployment

| App | Platform | URL |
|-----|----------|-----|
| Web | Cloudflare Pages | rumbo.pages.dev |
| API (prod) | Cloudflare Workers | rumbo-api.dsmj.workers.dev |
| API (staging) | Cloudflare Workers | rumbo-api-staging.dsmj.workers.dev |
| Database | Neon PostgreSQL | console.neon.tech |

CI/CD is handled by GitHub Actions:
- **Web**: Auto-deploys to Cloudflare Pages on push to `main`
- **API**: Deploys via `deploy-api.yml` workflow
- **Desktop**: Builds via `desktop-release.yml` on version tags (`v*`)
- **Mobile**: Builds via `mobile-build.yml` on version tags (`v*`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Shadcn/ui, TanStack Router |
| Backend | Hono, Drizzle ORM, Better Auth |
| Database | PostgreSQL (Neon), Redis (Upstash) |
| Mobile | React Native, Expo |
| Desktop | Tauri |
| Monorepo | Turborepo, pnpm workspaces |
| Code Quality | Biome (linter + formatter), Husky, lint-staged |
| Testing | Vitest, Playwright |
| Deployment | Cloudflare Workers + Pages |

## Troubleshooting

### `pnpm install` fails

Make sure you're using the correct pnpm version:
```bash
corepack enable
corepack prepare pnpm@10.6.2 --activate
```

### Docker containers won't start

Check if ports 5432 or 6379 are already in use:
```bash
lsof -i :5432
lsof -i :6379
```

### Database connection errors

1. Make sure Docker is running: `pnpm infra:up`
2. Check the container is healthy: `docker ps`
3. For local dev, use `sslmode=disable` in DATABASE_URL (Docker PostgreSQL doesn't use SSL)

### Pre-push hook fails

The pre-push hook runs `check`, `typecheck`, and `test`. Fix any issues before pushing:
```bash
pnpm check:fix     # Auto-fix linting/formatting
pnpm typecheck     # Check for type errors
pnpm test          # Run tests
```

### Mobile (Expo) setup

```bash
# Install Expo CLI globally (optional but recommended)
npm install -g @expo/cli

# Start mobile dev
pnpm dev:mobile
```

### Desktop (Tauri) setup

Tauri requires additional system dependencies. See [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/).
