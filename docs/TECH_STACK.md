# Rumbo - Tech Stack

## Architecture

Monorepo with separated frontend and backend. Each platform (web, mobile, desktop) consumes the same API. Code is shared across platforms through internal packages.

- **Monorepo tooling**: Turborepo + pnpm workspaces
- **Language**: TypeScript (across all apps and packages)

## Monorepo Structure

```
rumbo/
├── apps/
│   ├── web/              → React + Vite (web application)
│   ├── api/              → Hono (REST API)
│   ├── mobile/           → React Native (future)
│   └── desktop/          → Tauri (future, reuses web code)
├── packages/
│   ├── shared/           → Types, validations (Zod), constants, utilities
│   ├── db/               → Drizzle schema, migrations, seed
│   └── ui/               → Shared React components
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### What is shared across platforms

| Shared (packages/) | Web | Mobile | Desktop |
|---------------------|-----|--------|---------|
| TypeScript types and interfaces | Yes | Yes | Yes |
| Zod validation schemas | Yes | Yes | Yes |
| API client | Yes | Yes | Yes |
| Business logic and utilities | Yes | Yes | Yes |
| Currency formatting, date utils | Yes | Yes | Yes |
| React components (packages/ui) | Yes | Partial | Yes |

Desktop (Tauri) reuses the web application code directly. Mobile (React Native) shares business logic but uses its own UI components.

## Frontend

| Technology | Purpose |
|------------|---------|
| React | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Shadcn/ui | Component library (copied into project, based on Radix primitives) |
| React Router | Client-side routing |
| TanStack Query | Server state management, caching, and synchronization |
| Zustand | Client state management (UI state: theme, sidebar, modals, filters) |
| Zod | Schema validation (shared with backend via packages/shared) |

### Frontend Architecture: Feature Sliced Design (FSD)

The web app follows the [Feature Sliced Design](https://feature-sliced.design/) methodology. Code is organized in layers with a strict import rule: each layer can only import from layers below it.

```
apps/web/src/
├── app/                          → App setup, providers, routing, global styles
├── pages/                        → Full screens (dashboard, products, transactions, etc.)
├── widgets/                      → Complex composed UI blocks (dashboard grid, budget overview)
├── features/                     → User actions with business logic (create transaction, import statement)
├── entities/                     → Business entities with UI, model, and API (transaction, product, budget)
└── shared/                       → Base UI components, API client, utilities, config, types
```

**Import rule**: `app → pages → widgets → features → entities → shared`

Each slice within a layer follows a consistent internal structure:

```
entities/transaction/
├── ui/                           → Visual components (TransactionCard, TransactionRow)
├── model/                        → Types, Zustand store slice, hooks
├── api/                          → API calls (getTransactions, createTransaction)
└── index.ts                      → Public API (only exported members are accessible)
```

**Slices per layer for Rumbo:**

| Layer | Slices |
|-------|--------|
| pages | dashboard, products, transactions, calendar, budgets, recurring, settings |
| widgets | dashboard-grid, upcoming-payments, budget-overview, balance-summary, transaction-list, calendar-snapshot, goal-progress |
| features | create-transaction, create-product, import-statement, manage-budget, manage-recurring, configure-reminders, manage-categories |
| entities | transaction, financial-product, category, budget, recurring-expense, reminder, savings-goal, user |

## Backend

| Technology | Purpose |
|------------|---------|
| Hono | API framework (TypeScript-first, lightweight, multi-runtime) |
| PostgreSQL | Primary database |
| Drizzle ORM | Database access, migrations, type-safe queries |
| Better Auth | Authentication (email + OAuth, session-based) |
| BullMQ | Background job queue (notifications, OCR, AI processing) |
| Redis | Required by BullMQ for job queue. Also used for caching and session storage |

### Backend Architecture: Modular by Domain

The API is organized in domain modules. Each module groups its own routes, business logic, and validation. The data layer (Drizzle) lives in `packages/db`.

```
apps/api/src/
├── app.ts                            → Hono app setup, global middleware registration
├── server.ts                         → Server entry point
│
├── modules/
│   ├── auth/                         → Better Auth config + endpoints
│   ├── products/                     → Financial product CRUD + metadata
│   ├── transactions/                 → Income, expense, transfer operations
│   ├── categories/                   → Default seed + custom CRUD
│   ├── budgets/                      → Budget tracking, spent calculations
│   ├── recurring/                    → Fixed/variable recurring expenses
│   ├── calendar/                     → Aggregated view of upcoming obligations
│   ├── notifications/                → Preferences, history + channels (email, push, in-app)
│   ├── ai/                           → Vercel AI SDK orchestration + prompts
│   └── onboarding/                   → Statement upload, parse, review, confirm
│
├── middleware/                       → Auth, CORS, logging, rate limiting
│
├── jobs/                             → BullMQ queue definitions, worker, job handlers
│   ├── reminder.job.ts               → Daily check for upcoming payments
│   ├── recurring.job.ts              → Auto-generate transactions from recurring expenses
│   ├── ai.job.ts                     → Statement parsing + categorization
│   └── email.job.ts                  → Email delivery via Resend
│
└── lib/                              → Shared infra (db connection, redis, R2 client, AI setup)
```

Each module follows the same internal structure:

```
modules/transactions/
├── routes.ts                         → Hono route definitions with OpenAPI schemas
├── service.ts                        → Business logic (no HTTP awareness, receives and returns data)
├── validation.ts                     → Zod schemas for request/response
└── index.ts                          → Public API re-export
```

**Module rules:**

- `routes.ts` only handles HTTP: parse request, call service, return response
- `service.ts` contains pure business logic, testable without HTTP
- `validation.ts` defines Zod schemas shared with OpenAPI spec generation
- Modules can import services from other modules for cross-domain logic (e.g., onboarding imports ai.service)
- Jobs have no routes. They are enqueued from services and executed by the BullMQ worker

## API Communication

REST API with OpenAPI specification:

- Hono's built-in `@hono/zod-openapi` for type-safe route definitions
- Auto-generated OpenAPI spec from route definitions
- Type-safe API client generated from the OpenAPI spec for frontend consumption
- Shared Zod schemas between frontend and backend via packages/shared

## Services

| Service | Purpose |
|---------|---------|
| Resend | Transactional email (reminders, notifications). React Email for templates |
| Cloudflare R2 | File storage (receipts, bank statements, user uploads). S3-compatible, no egress fees |
| Vercel AI SDK | Multi-provider AI abstraction. Supports OpenAI, Anthropic, Google, and others without code changes |

## Testing

| Technology | Purpose |
|------------|---------|
| Vitest | Unit and integration tests (fast, Vite-compatible) |
| Playwright | End-to-end tests (real browser testing) |

## Code Quality

| Technology | Purpose |
|------------|---------|
| Biome | Linting and formatting (single tool, replaces ESLint + Prettier) |
| TypeScript | Strict mode enabled across all packages |

## Infrastructure

### Local Development

- Docker Compose for PostgreSQL and Redis
- Turborepo dev command runs all apps in parallel

### Deployment

- **Railway** for all services (API, PostgreSQL, Redis)
- **Cloudflare Pages** or Railway for frontend static hosting
- Start with Railway free tier, upgrade to $5/month starter plan if needed

## Future Platform Support

| Platform | Technology | Status |
|----------|-----------|--------|
| Web | React + Vite | Core (first platform) |
| Desktop | Tauri (wraps web app in native window) | Planned |
| Mobile | React Native (shares business logic, native UI) | Planned |

### Desktop Architecture: Tauri

Tauri wraps the web app in a native window. It has no frontend code of its own — it points to the `apps/web` build output.

```
apps/desktop/
├── src-tauri/
│   ├── src/
│   │   └── main.rs                   → Tauri entry point (Rust)
│   ├── capabilities/                 → Permission policies
│   ├── icons/                        → App icons (all platforms)
│   ├── Cargo.toml                    → Rust dependencies
│   └── tauri.conf.json               → Window config, app metadata, build settings
├── package.json
└── tauri.config.ts                   → Dev server proxy to apps/web
```

In development, Tauri points to the `apps/web` dev server. In production, it packages the `apps/web` build inside the native binary.

Desktop-exclusive features (system tray, native menus, filesystem access, OS-level notifications) are implemented in Rust (`src-tauri/src/`) and exposed to the frontend via Tauri commands.

### Mobile Architecture: React Native

React Native shares all business logic from `packages/shared` but has its own UI layer using native primitives. The structure adapts FSD conventions for mobile.

```
apps/mobile/
├── src/
│   ├── app/
│   │   ├── providers/                → React Query, Auth, Theme, Navigation
│   │   └── navigation/               → React Navigation (stacks, tabs, drawers)
│   │
│   ├── screens/                      → Full screens (equivalent to pages in web FSD)
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── transactions/
│   │   ├── calendar/
│   │   ├── budgets/
│   │   ├── recurring/
│   │   └── settings/
│   │
│   ├── widgets/                      → Composed native UI blocks
│   │   ├── upcoming-payments/
│   │   ├── budget-overview/
│   │   ├── balance-summary/
│   │   └── transaction-list/
│   │
│   ├── features/                     → User actions (same domain slices as web)
│   │   ├── create-transaction/
│   │   ├── create-product/
│   │   ├── manage-budget/
│   │   └── manage-recurring/
│   │
│   ├── entities/                     → Business entities with native UI components
│   │   ├── transaction/
│   │   ├── financial-product/
│   │   ├── category/
│   │   └── budget/
│   │
│   └── shared/
│       ├── ui/                       → Native base components (React Native primitives)
│       ├── lib/                      → Mobile-specific utilities
│       └── config/                   → Mobile-specific config
│
├── ios/                              → iOS native project (Xcode)
├── android/                          → Android native project (Gradle)
├── app.json
└── package.json
```

**Shared with web** (via packages/shared): TypeScript types, Zod schemas, API client, business logic, currency/date utilities, constants.

**Not shared with web**: UI components (native primitives vs DOM), navigation (React Navigation vs React Router), styling (StyleSheet/NativeWind vs Tailwind CSS).

## Key Architectural Decisions

### Why separated frontend and backend

Rumbo will eventually support web, mobile, and desktop. All three platforms need to consume the same API. A separated backend ensures:

- Mobile and desktop apps share the same API endpoints as the web app
- Backend can be scaled independently from the frontend
- Background jobs (notifications, OCR, AI) run on the backend without affecting frontend performance
- No lock-in to a specific frontend meta-framework's opinions about backend architecture

### Why React over Svelte

Both frameworks can build everything Rumbo needs. React was chosen because:

- React Native provides a clear path for native mobile (Svelte has no mature native mobile solution)
- Larger ecosystem of production-tested libraries for dashboards, calendars, and charts
- Maximum code sharing across web, mobile, and desktop in a monorepo

### Why Hono over Express/Fastify

- TypeScript-first with excellent type inference
- Lightweight (no bloated dependency tree)
- Multi-runtime support (Node.js, Bun, Cloudflare Workers, Deno) for deployment flexibility
- Modern API design with middleware composition
- Built-in OpenAPI support for type-safe API contracts

### Why Drizzle over Prisma

- SQL-like syntax (works with SQL, does not hide it)
- No code generation step required
- Lighter client (no heavy Prisma engine binary)
- Type-safe without the abstraction overhead
- Simpler migration workflow

### Why Vercel AI SDK over direct provider SDKs

- Provider-agnostic: switch between OpenAI, Anthropic, Google without code changes
- Unified API for streaming, tool calling, and structured output
- React hooks for frontend integration (useChat, useCompletion)
- No vendor lock-in to a single AI provider
- Designed for user-facing AI features in web apps (chat, OCR, structured extraction)

### Why Biome over ESLint + Prettier

- Single tool replaces two (linter + formatter)
- Written in Rust, significantly faster
- Zero configuration needed for sensible defaults
- Consistent formatting and linting in one pass

### Why Railway for deployment

- Simple monorepo deployment (API, PostgreSQL, Redis in one place)
- Free tier available for development and personal use
- Single dashboard for all services
- No vendor lock-in (standard Docker containers, standard PostgreSQL)
- Scales easily: upgrade to $5/month starter plan when needed
