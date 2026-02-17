# Cloudflare Deployment Design

**Goal:** Deploy the Rumbo web app and API using Cloudflare's free tier ecosystem, replacing the original Railway plan.

**Approach:** Cloudflare Pages for the web SPA, Cloudflare Workers for the Hono API, Neon for serverless PostgreSQL, Upstash for serverless Redis. Local development stays on Docker.

---

## Architecture

```
Production:
  Web (SPA)  → Cloudflare Pages (auto-deploy from main)
  API (Hono) → Cloudflare Workers (deploy via wrangler)
  DB         → Neon PostgreSQL (serverless, HTTP driver)
  Cache      → Upstash Redis (REST API)

Staging:
  Web        → Cloudflare Pages preview deployments (auto on PRs)
  API        → Cloudflare Worker (rumbo-api-staging)
  DB         → Neon PostgreSQL (staging branch/database)
  Cache      → Upstash Redis (separate instance or prefixed keys)

Dev local:
  Web        → Vite dev server (localhost:5173)
  API        → tsx watch or wrangler dev (localhost:3000)
  DB         → Docker PostgreSQL (localhost:5432)
  Cache      → Docker Redis (localhost:6379)
```

## API: Dual Entry Points

The API has two entry points sharing the same `app.ts`:

- `src/index.ts` — Node.js server (`@hono/node-server`), used for local development with `tsx watch`
- `src/worker.ts` — Workers export (`export default app`), used for `wrangler dev` and production

Business logic, routes, and middleware remain identical. Only the server bootstrap differs.

## API: Wrangler Configuration

`apps/api/wrangler.toml` defines the Workers project:

- `name = "rumbo-api"` for production
- `[env.staging]` with `name = "rumbo-api-staging"` for staging
- Secrets (`DATABASE_URL`, `REDIS_URL`) configured via `wrangler secret put`, not in the file

## Database: Neon Serverless Driver

`packages/db` switches from `postgres` (TCP driver) to `@neondatabase/serverless` (HTTP driver). Drizzle ORM supports both. The Neon serverless driver also works against local PostgreSQL for development.

## Web: Cloudflare Pages

Cloudflare Pages auto-detects Vite projects. Configuration:

- Production branch: `main`
- Build command: monorepo-aware pnpm build
- Build output: `apps/web/dist`
- Environment variable: `VITE_API_URL` pointing to the Workers API URL

Preview deployments are automatic on every PR, serving as staging for the frontend.

## CD Pipeline

**Web (Pages):** Cloudflare Pages native GitHub integration handles deployment. No GitHub Actions needed.

**API (Workers):** A GitHub Actions workflow runs `wrangler deploy` on push to `main` (production) or `develop` (staging). Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub secrets.

**CI:** Existing lint + typecheck workflow on PRs remains unchanged.

**Desktop + Mobile:** Existing tag-triggered workflows remain unchanged.

## Files to Create / Modify / Delete

```
Create:
  apps/api/src/worker.ts            → Workers entry point
  apps/api/wrangler.toml            → Wrangler configuration
  .github/workflows/deploy-api.yml  → CD workflow for Workers

Modify:
  packages/db/src/index.ts          → Neon serverless driver
  packages/db/package.json          → Add @neondatabase/serverless
  apps/api/package.json             → Add wrangler, update scripts

Delete:
  apps/api/Dockerfile               → Not needed (Workers)
  apps/web/Dockerfile               → Not needed (Pages)
```

## Cost

All services on free tier:

| Service | Free Tier |
|---------|-----------|
| Cloudflare Pages | Unlimited sites, 500 builds/month |
| Cloudflare Workers | 100,000 requests/day |
| Neon PostgreSQL | 0.5 GB storage, 190 compute hours/month |
| Upstash Redis | 10,000 commands/day |

Total: **$0/month** for a single-user personal project.

## Future Considerations

- **BullMQ:** Does not work on Workers (requires persistent TCP Redis). When background jobs are needed, use Cloudflare Queues (native) or Upstash QStash (serverless).
- **Scaling:** If the app grows beyond free tiers, Cloudflare's paid plans are competitive. Workers Paid is $5/month for 10M requests.
