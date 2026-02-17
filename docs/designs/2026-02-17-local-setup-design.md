# Local Development Setup - Design Document

**Date**: 2026-02-17
**Status**: Approved
**Approach**: Docker for infrastructure only, apps run natively via Turborepo

---

## Overview

Set up the Rumbo monorepo local development environment. Docker Compose runs PostgreSQL and Redis. All applications (web, api, mobile, desktop) run natively via Turborepo + pnpm scripts. A single `pnpm dev` command starts infrastructure + API + web. Per-environment commands allow starting individual apps.

## Decision: Why Docker Only for Infrastructure

Three approaches were evaluated:

| Approach | Description | Verdict |
|----------|-------------|---------|
| **A: Docker infra only** | PG + Redis in Docker, apps native | **Chosen** |
| B: Everything in Docker | All services containerized | Rejected |
| C: Hybrid with profiles | Infra always Docker, apps optionally | Rejected |

**Rationale for Approach A:**

1. Mobile (Expo) and Desktop (Tauri) cannot run in Docker — Node.js is required locally regardless
2. Native HMR is faster than Docker volume file sync
3. Debugging works without remote attach configuration
4. Railway (production) uses its own Dockerfiles — no need to replicate production locally
5. Minimal complexity: only 2 Docker containers (PG + Redis)

## Versions

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 24.13.1 LTS | Specified via `.node-version` |
| pnpm | 10 | Via `packageManager` field in root `package.json` |
| PostgreSQL | 18.2 | Alpine image in Docker |
| Redis | 8.6 | Alpine image in Docker |

## Ports

| Service | Port |
|---------|------|
| API (Hono) | 3000 |
| Web (Vite) | 5173 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## Project Structure

```
rumbo/
├── .node-version                    # "24"
├── .npmrc                           # pnpm strict config
├── package.json                     # Root workspace + scripts
├── pnpm-workspace.yaml              # Workspace definitions
├── turbo.json                       # Turborepo pipeline
├── docker-compose.yml               # PostgreSQL 18.2 + Redis 8.6
├── .env.example                     # Environment variable template
├── .env                             # Local variables (gitignored)
├── apps/
│   ├── web/                         # React + Vite (port 5173)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── app/                 # FSD: app layer
│   │       │   ├── index.tsx        # Entry point (providers, router)
│   │       │   └── styles/
│   │       │       └── globals.css  # Tailwind directives
│   │       ├── pages/               # FSD: pages layer (empty)
│   │       ├── widgets/             # FSD: widgets layer (empty)
│   │       ├── features/            # FSD: features layer (empty)
│   │       ├── entities/            # FSD: entities layer (empty)
│   │       └── shared/              # FSD: shared layer
│   │           ├── ui/
│   │           ├── lib/
│   │           └── config/
│   ├── api/                         # Hono REST API (port 3000)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts             # Server entry point
│   │       ├── app.ts               # Hono app factory + middleware
│   │       └── modules/
│   │           └── health/
│   │               ├── routes.ts    # GET /health endpoint
│   │               ├── service.ts   # Health check logic
│   │               └── index.ts     # Public API
│   ├── mobile/                      # React Native / Expo (placeholder)
│   │   └── package.json
│   └── desktop/                     # Tauri (placeholder)
│       └── package.json
├── packages/
│   ├── shared/                      # Types, Zod schemas, utils
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   ├── db/                          # Drizzle schema + migrations
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       ├── index.ts             # DB client export
│   │       ├── schema/
│   │       │   └── index.ts
│   │       └── migrations/
│   └── ui/                          # Shared React components
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
└── tooling/                         # Shared configs
    ├── typescript/
    │   └── tsconfig.base.json       # Base TypeScript config
    └── biome/
        └── biome.json               # Shared Biome config
```

## Docker Compose

Only infrastructure services. No app containers.

```yaml
services:
  postgres:
    image: postgres:18.2-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: rumbo
      POSTGRES_PASSWORD: rumbo_dev
      POSTGRES_DB: rumbo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rumbo"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:8.6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

## Scripts

Root `package.json` scripts:

```jsonc
{
  "scripts": {
    // Infrastructure
    "infra:up": "docker compose up -d",
    "infra:down": "docker compose down",
    "infra:reset": "docker compose down -v && docker compose up -d",

    // Development (infra + api + web)
    "dev": "pnpm infra:up && turbo dev --filter=@rumbo/api --filter=@rumbo/web",

    // Per-environment
    "dev:web": "turbo dev --filter=@rumbo/web",
    "dev:api": "turbo dev --filter=@rumbo/api",
    "dev:mobile": "turbo dev --filter=@rumbo/mobile",
    "dev:desktop": "turbo dev --filter=@rumbo/desktop",

    // Database
    "db:generate": "turbo db:generate --filter=@rumbo/db",
    "db:migrate": "turbo db:migrate --filter=@rumbo/db",
    "db:seed": "turbo db:seed --filter=@rumbo/db",
    "db:studio": "turbo db:studio --filter=@rumbo/db",

    // Quality
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e"
  }
}
```

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://rumbo:rumbo_dev@localhost:5432/rumbo

# Redis
REDIS_URL=redis://localhost:6379

# API
API_PORT=3000
API_URL=http://localhost:3000

# Web
VITE_API_URL=http://localhost:3000

# Auth (Better Auth)
BETTER_AUTH_SECRET=dev-secret-change-in-production
BETTER_AUTH_URL=http://localhost:3000
```

## Turbo Pipeline

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^build"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "test:e2e": {
      "dependsOn": ["^build"]
    },
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false },
    "db:seed": { "cache": false },
    "db:studio": { "cache": false, "persistent": true }
  }
}
```

## Functional Apps (Hello World)

### API (apps/api)

Hono server with a single health check endpoint:

- `GET /health` → `{ status: "ok", timestamp: "..." }`
- CORS middleware enabled for `http://localhost:5173`
- Serves on port 3000

### Web (apps/web)

React + Vite SPA with FSD structure:

- Renders a landing component that fetches `GET /health` from the API
- Displays connection status (connected / disconnected)
- Tailwind CSS configured with Shadcn/ui CSS variables
- Path aliases configured (`@/` → `src/`)

### Mobile (apps/mobile) — Placeholder

- `package.json` with `name: "@rumbo/mobile"` and `private: true`
- No source code yet

### Desktop (apps/desktop) — Placeholder

- `package.json` with `name: "@rumbo/desktop"` and `private: true`
- No source code yet

## Functional Packages

### packages/shared

- Exports `APP_NAME` constant and base types
- TypeScript config extends `tsconfig.base.json`

### packages/db

- Drizzle config pointing to `DATABASE_URL`
- Empty initial schema (ready for tables)
- Exports DB client instance

### packages/ui

- Empty package with placeholder export
- Ready for Shadcn/ui component additions

## Shared Tooling

### tsconfig.base.json

- `strict: true`
- `target: "ES2022"`
- `module: "NodeNext"` / `moduleResolution: "NodeNext"`
- `skipLibCheck: true`
- `resolveJsonModule: true`

### biome.json

- Formatter: 2 spaces, single quotes, trailing commas
- Linter: recommended rules enabled
- Organize imports: enabled

## Getting Started Flow

```bash
# 1. Clone and install
git clone <repo>
cd rumbo
pnpm install

# 2. Set up environment
cp .env.example .env

# 3. Start everything
pnpm dev
# → Docker starts PostgreSQL + Redis
# → API starts on http://localhost:3000
# → Web starts on http://localhost:5173

# 4. Verify
# Open http://localhost:5173 — should show "Connected" status
# Visit http://localhost:3000/health — should return { status: "ok" }
```
