# EduOS Deployment Audit

Date: 2026-09-04

## Architecture

- Frontend: React 19 with Vite 6, Tailwind CSS 4, and TypeScript 5.8.
- Backend: Express 5 server written in TypeScript and bundled with esbuild.
- Database: PostgreSQL through `pg` and Drizzle when `DATABASE_URL` is configured; durable `db.json` fallback for local/demo mode.
- Authentication: application-managed JWTs in an HTTP-only session cookie and bearer-token API support.
- Integrations: Supabase client/server helpers, optional Gemini API, Firebase-based integrations, and local service worker.
- Production entrypoint: `dist/server.cjs` via `npm start`.

## Verified Readiness

- `npm ci` dependency installation is represented by the lockfile and Render build command.
- `npm run build` passes and produces the Vite assets and server bundle.
- `npm run lint` passes.
- `npm test` passes 18 backend tests.
- `npm run test:ui` passes 2 Playwright tests.
- The server binds `0.0.0.0` and honors the hosting provider's `PORT`.
- `/health` and `/health/ready` are available.
- All five tracked migrations are already applied to the configured PostgreSQL database.

## Required Environment Variables

- `NODE_ENV=production`
- `PORT` is supplied by Render; do not set a fixed production value.
- `JWT_SECRET` is required in production.
- `DATABASE_URL` is required for production PostgreSQL mode.
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` for server-side Supabase operations.
- `GEMINI_API_KEY` is optional and only needed for Gemini-powered features.

## Issues and Risks

### Critical before external deployment

- Render service creation and production environment-variable entry require access to the client's Render account.
- The local `.env.local` contains credentials and is ignored by Git; rotate those credentials if they have been shared outside the local machine.
- The source contains demo seed accounts and passwords intended for local/demo data. Replace or disable demo accounts for a real production tenant.

### Medium

- The main frontend bundle is approximately 2 MB minified; Vite emits a chunk-size warning. This does not block deployment but should be addressed before high-traffic use.
- Full real-user login and end-to-end CBT testing against a deployed Render URL is pending service creation and test-account access.

### Minor

- Railway configuration remains in the repository from the prior deployment target; `render.yaml` is now the explicit Render configuration.
- Supabase browser configuration uses public fallbacks when Vite-prefixed variables are not supplied; review this if Supabase client-side features are enabled in production.

## Recommended Render Configuration

- Service: Web Service
- Runtime: Node
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check: `/health/ready`
- Branch: `main`
- Region: nearest supported region to the database
- Blueprint: `render.yaml`

## Git Status

- Existing remotes: `origin` points to the EDUOS GitHub repository and `samweb` is also configured.
- The worktree contains existing application and documentation changes in addition to this deployment work. No commit or push was performed automatically because those pre-existing changes require owner confirmation before being grouped into a release commit.
