# Local Development Setup - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the Rumbo monorepo with Docker infrastructure (PostgreSQL + Redis), functional API and web apps, and shared packages — runnable with `pnpm dev`.

**Architecture:** Turborepo + pnpm workspaces monorepo. Docker Compose runs PostgreSQL 18.2 and Redis 8.6. Apps run natively. API (Hono) on port 3000, Web (React + Vite) on port 5173. FSD structure for frontend, modular by domain for backend.

**Tech Stack:** TypeScript, Turborepo, pnpm 10, Hono, React, Vite, Tailwind CSS v4, Drizzle ORM, Biome, Docker Compose

**Design Doc:** `docs/plans/2026-02-17-local-setup-design.md`

---

## Task 1: Root Monorepo Configuration

**Files:**
- Create: `.node-version`
- Create: `.npmrc`
- Create: `pnpm-workspace.yaml`
- Create: `package.json`

**Step 1: Create `.node-version`**

```
24
```

**Step 2: Create `.npmrc`**

```ini
auto-install-peers=true
strict-peer-dependencies=false
```

**Step 3: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

**Step 4: Create root `package.json`**

```json
{
  "name": "rumbo",
  "private": true,
  "packageManager": "pnpm@10.6.2",
  "scripts": {
    "infra:up": "docker compose up -d",
    "infra:down": "docker compose down",
    "infra:reset": "docker compose down -v && docker compose up -d",
    "dev": "pnpm infra:up && turbo dev --filter=@rumbo/api --filter=@rumbo/web",
    "dev:web": "turbo dev --filter=@rumbo/web",
    "dev:api": "turbo dev --filter=@rumbo/api",
    "dev:mobile": "turbo dev --filter=@rumbo/mobile",
    "dev:desktop": "turbo dev --filter=@rumbo/desktop",
    "build": "turbo build",
    "db:generate": "turbo db:generate --filter=@rumbo/db",
    "db:migrate": "turbo db:migrate --filter=@rumbo/db",
    "db:seed": "turbo db:seed --filter=@rumbo/db",
    "db:studio": "turbo db:studio --filter=@rumbo/db",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e"
  },
  "devDependencies": {
    "@biomejs/biome": "latest",
    "turbo": "latest"
  }
}
```

Note: `packageManager` version will be confirmed at install time. Use `corepack enable` first.

**Step 5: Commit**

```bash
git add .node-version .npmrc pnpm-workspace.yaml package.json
git commit -m "chore: initialize monorepo root config"
```

---

## Task 2: Shared Tooling Configuration

**Files:**
- Create: `tooling/typescript/tsconfig.base.json`
- Create: `tooling/typescript/package.json`
- Create: `tooling/biome/biome.json`
- Create: `tooling/biome/package.json`

**Step 1: Create `tooling/typescript/package.json`**

```json
{
  "name": "@rumbo/typescript-config",
  "private": true,
  "version": "0.0.0"
}
```

**Step 2: Create `tooling/typescript/tsconfig.base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "moduleDetection": "force",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  },
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create `tooling/biome/package.json`**

```json
{
  "name": "@rumbo/biome-config",
  "private": true,
  "version": "0.0.0"
}
```

**Step 4: Create `tooling/biome/biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noForEach": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      ".turbo",
      "coverage",
      "*.gen.ts"
    ]
  }
}
```

**Step 5: Commit**

```bash
git add tooling/
git commit -m "chore: add shared TypeScript and Biome configs"
```

---

## Task 3: Turborepo Pipeline

**Files:**
- Create: `turbo.json`

**Step 1: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
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

**Step 2: Commit**

```bash
git add turbo.json
git commit -m "chore: add Turborepo pipeline config"
```

---

## Task 4: Docker Infrastructure

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

**Step 1: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:18-alpine
    container_name: rumbo-postgres
    restart: unless-stopped
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
    image: redis:8-alpine
    container_name: rumbo-redis
    restart: unless-stopped
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

Note: Using `postgres:18-alpine` and `redis:8-alpine` tags. Alpine images are smallest. Docker will pull the latest patch version within the major.

**Step 2: Create `.env.example`**

```bash
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

**Step 3: Copy `.env.example` to `.env`**

```bash
cp .env.example .env
```

**Step 4: Verify Docker infrastructure starts**

```bash
docker compose up -d
```

Expected: Both containers start. Verify with:

```bash
docker compose ps
```

Expected: `rumbo-postgres` and `rumbo-redis` both `healthy`.

**Step 5: Stop infrastructure**

```bash
docker compose down
```

**Step 6: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "chore: add Docker Compose for PostgreSQL and Redis"
```

---

## Task 5: packages/shared

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

**Step 1: Create `packages/shared/package.json`**

```json
{
  "name": "@rumbo/shared",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "latest"
  },
  "devDependencies": {
    "typescript": "latest"
  }
}
```

Note: Using direct TypeScript source exports (no build step). Turborepo + Vite + tsx all handle `.ts` imports from workspace packages. This avoids a build step for internal packages.

**Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tooling/typescript/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

**Step 3: Create `packages/shared/src/index.ts`**

```typescript
export const APP_NAME = 'Rumbo';
export const DEFAULT_LOCALE = 'es-CO';
export const DEFAULT_CURRENCY = 'COP';
```

**Step 4: Commit**

```bash
git add packages/shared/
git commit -m "chore: add packages/shared with base constants"
```

---

## Task 6: packages/db

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/migrations/.gitkeep`

**Step 1: Create `packages/db/package.json`**

```json
{
  "name": "@rumbo/db",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./schema": {
      "types": "./src/schema/index.ts",
      "default": "./src/schema/index.ts"
    }
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/seed.ts",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@rumbo/shared": "workspace:*",
    "drizzle-orm": "latest",
    "postgres": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "tsx": "latest",
    "typescript": "latest"
  }
}
```

Note: Using `postgres` (postgres.js) as the PostgreSQL driver. It's the recommended driver for Drizzle with modern Node.js.

**Step 2: Create `packages/db/tsconfig.json`**

```json
{
  "extends": "../../tooling/typescript/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src", "drizzle.config.ts"]
}
```

**Step 3: Create `packages/db/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 4: Create `packages/db/src/schema/index.ts`**

```typescript
// Database schema definitions
// Tables will be added here as features are implemented
```

**Step 5: Create `packages/db/src/index.ts`**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

export type Database = typeof db;

export { schema };
```

**Step 6: Create `packages/db/src/migrations/.gitkeep`**

Empty file to keep the directory in git.

**Step 7: Commit**

```bash
git add packages/db/
git commit -m "chore: add packages/db with Drizzle config"
```

---

## Task 7: packages/ui

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`

**Step 1: Create `packages/ui/package.json`**

```json
{
  "name": "@rumbo/ui",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@rumbo/shared": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19"
  },
  "devDependencies": {
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "react": "latest",
    "react-dom": "latest",
    "typescript": "latest"
  }
}
```

**Step 2: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "../../tooling/typescript/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

**Step 3: Create `packages/ui/src/index.ts`**

```typescript
// Shared UI components
// Shadcn/ui components will be added here
```

**Step 4: Commit**

```bash
git add packages/ui/
git commit -m "chore: add packages/ui placeholder for shared components"
```

---

## Task 8: apps/api

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/modules/health/service.ts`
- Create: `apps/api/src/modules/health/routes.ts`
- Create: `apps/api/src/modules/health/index.ts`

**Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@rumbo/api",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hono/node-server": "latest",
    "@rumbo/db": "workspace:*",
    "@rumbo/shared": "workspace:*",
    "hono": "latest"
  },
  "devDependencies": {
    "tsx": "latest",
    "typescript": "latest"
  }
}
```

**Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tooling/typescript/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 3: Create `apps/api/src/modules/health/service.ts`**

```typescript
export function getHealthStatus() {
  return {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  };
}
```

**Step 4: Create `apps/api/src/modules/health/routes.ts`**

```typescript
import { Hono } from 'hono';
import { getHealthStatus } from './service.js';

const health = new Hono();

health.get('/', (c) => {
  const status = getHealthStatus();
  return c.json(status);
});

export { health };
```

**Step 5: Create `apps/api/src/modules/health/index.ts`**

```typescript
export { health } from './routes.js';
```

**Step 6: Create `apps/api/src/app.ts`**

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { health } from './modules/health/index.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  }),
);

// Routes
app.route('/health', health);

export { app };
```

**Step 7: Create `apps/api/src/index.ts`**

```typescript
import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env.API_PORT) || 3000;

console.log(`Rumbo API starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
```

**Step 8: Commit**

```bash
git add apps/api/
git commit -m "feat: add Hono API with health check endpoint"
```

---

## Task 9: apps/web

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.app.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/app/styles/globals.css`
- Create: `apps/web/src/app/index.tsx`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/vite-env.d.ts`

**Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@rumbo/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@rumbo/shared": "workspace:*",
    "@rumbo/ui": "workspace:*",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@tailwindcss/vite": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "vite": "latest"
  }
}
```

**Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" }
  ]
}
```

**Step 3: Create `apps/web/tsconfig.app.json`**

```json
{
  "extends": "../../tooling/typescript/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 4: Create `apps/web/vite.config.ts`**

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
```

**Step 5: Create `apps/web/index.html`**

```html
<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rumbo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 6: Create `apps/web/src/vite-env.d.ts`**

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Step 7: Create `apps/web/src/app/styles/globals.css`**

```css
@import 'tailwindcss';

@theme {
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-primary: #16a34a;
  --color-primary-foreground: #ffffff;
  --color-muted: #f5f5f5;
  --color-muted-foreground: #737373;
  --color-border: #e5e5e5;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;

  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

Note: Tailwind v4 uses `@theme` for custom design tokens. Green primary matches Rumbo's finance theme.

**Step 8: Create `apps/web/src/app/index.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { APP_NAME } from '@rumbo/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type HealthStatus = {
  status: 'ok';
  timestamp: string;
};

type ConnectionState = 'loading' | 'connected' | 'disconnected';

export function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data: HealthStatus) => {
        setHealthData(data);
        setConnectionState('connected');
      })
      .catch(() => {
        setConnectionState('disconnected');
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-muted-foreground">Personal finance management</p>

      <div className="mt-4 rounded-lg border border-border bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">API Connection</p>
        {connectionState === 'loading' && (
          <p className="mt-2 text-sm">Checking...</p>
        )}
        {connectionState === 'connected' && (
          <div className="mt-2">
            <p className="font-medium text-primary">Connected</p>
            {healthData && (
              <p className="mt-1 text-xs text-muted-foreground">
                {healthData.timestamp}
              </p>
            )}
          </div>
        )}
        {connectionState === 'disconnected' && (
          <p className="mt-2 font-medium text-destructive">Disconnected</p>
        )}
      </div>
    </div>
  );
}
```

**Step 9: Create `apps/web/src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/index.js';
import './app/styles/globals.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Step 10: Create FSD directory structure (empty layers)**

Create empty directories to establish the FSD structure:

```bash
mkdir -p apps/web/src/pages
mkdir -p apps/web/src/widgets
mkdir -p apps/web/src/features
mkdir -p apps/web/src/entities
mkdir -p apps/web/src/shared/ui
mkdir -p apps/web/src/shared/lib
mkdir -p apps/web/src/shared/config
```

Add `.gitkeep` to each empty directory so git tracks them.

**Step 11: Commit**

```bash
git add apps/web/
git commit -m "feat: add React + Vite web app with FSD structure"
```

---

## Task 10: Placeholder Apps (Mobile + Desktop)

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/desktop/package.json`

**Step 1: Create `apps/mobile/package.json`**

```json
{
  "name": "@rumbo/mobile",
  "private": true,
  "version": "0.0.0",
  "description": "Rumbo mobile app (React Native / Expo) - not yet scaffolded"
}
```

**Step 2: Create `apps/desktop/package.json`**

```json
{
  "name": "@rumbo/desktop",
  "private": true,
  "version": "0.0.0",
  "description": "Rumbo desktop app (Tauri) - not yet scaffolded"
}
```

**Step 3: Commit**

```bash
git add apps/mobile/ apps/desktop/
git commit -m "chore: add placeholder packages for mobile and desktop apps"
```

---

## Task 11: Install Dependencies

**Step 1: Enable corepack (for pnpm version management)**

```bash
corepack enable
```

**Step 2: Install all dependencies**

```bash
pnpm install
```

Expected: Clean install with no errors. A `pnpm-lock.yaml` will be generated.

**Step 3: Verify workspace packages are linked**

```bash
pnpm ls --filter @rumbo/api --depth 0
pnpm ls --filter @rumbo/web --depth 0
```

Expected: Shows `@rumbo/shared`, `@rumbo/db`, `@rumbo/ui` as linked workspace packages.

**Step 4: Commit lockfile**

```bash
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lockfile"
```

---

## Task 12: Integration Verification

**Step 1: Start Docker infrastructure**

```bash
pnpm infra:up
```

Expected: PostgreSQL and Redis containers start.

```bash
docker compose ps
```

Expected: Both `rumbo-postgres` and `rumbo-redis` show `healthy` status.

**Step 2: Start full dev environment**

```bash
pnpm dev
```

Expected:
- Docker infra already running
- API starts on `http://localhost:3000`
- Web starts on `http://localhost:5173`

**Step 3: Verify API health endpoint**

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","timestamp":"2026-02-17T..."}` (200 OK)

**Step 4: Verify web app**

Open `http://localhost:5173` in browser.

Expected: See "Rumbo" title with "Connected" status and timestamp.

**Step 5: Verify per-environment commands**

Stop everything, then test individual commands:

```bash
# Test API alone
pnpm dev:api
# Verify: curl http://localhost:3000/health works

# Test Web alone (API must be running for connection check)
pnpm dev:web
# Verify: http://localhost:5173 loads (may show "Disconnected" if API not running)
```

**Step 6: Verify typecheck**

```bash
pnpm typecheck
```

Expected: No TypeScript errors across all packages.

**Step 7: Verify Biome**

```bash
pnpm check
```

Expected: No linting or formatting errors.

**Step 8: Stop everything**

```bash
pnpm infra:down
```

**Step 9: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve integration issues from initial setup"
```

Only commit if fixes were needed. If everything passed, no commit needed.

---

## Summary

After completing all tasks, the monorepo will have:

| Component | Status | Runnable |
|-----------|--------|----------|
| Root (Turborepo + pnpm) | Configured | `pnpm dev` |
| Docker (PG + Redis) | Configured | `pnpm infra:up` |
| Tooling (TS + Biome) | Configured | `pnpm check`, `pnpm typecheck` |
| packages/shared | Functional | Exports constants |
| packages/db | Functional | Drizzle config ready, empty schema |
| packages/ui | Placeholder | Ready for Shadcn/ui |
| apps/api | Functional | `GET /health` endpoint |
| apps/web | Functional | Shows API connection status |
| apps/mobile | Placeholder | Package.json only |
| apps/desktop | Placeholder | Package.json only |

**Next steps after this plan:**
1. Set up Better Auth (auth module in API + auth provider in web)
2. Create initial database schema (users, financial products, transactions)
3. Install Shadcn/ui in packages/ui
4. Set up TanStack Router in apps/web
5. Set up TanStack Query in apps/web
