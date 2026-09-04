# EduOS Phase 0 Baseline Report

**Audit date:** 2026-09-02  
**Scope:** Phase 0 audit, verified Phase 1 core academic foundation, verified Phase 2/3 academic records and continuous assessment, and verified Phase 4 GPA/result calculation.

## Executive Status

Phase 0 is **complete**, and Phases 1 through 4 are implemented and verified within their defined scopes. The codebase passes TypeScript validation, production compilation, dependency security audit, startup, API smoke tests, and regression tests. PostgreSQL connectivity and migration execution are verified through the EU-West Supabase pooler.

## Architecture

- Single-package React 19 + TypeScript frontend served by an Express server.
- Vite supplies development middleware and production frontend assets are served from `dist`.
- `server.ts` owns the HTTP API, JWT authentication, tenant context middleware, static serving, and SPA fallback.
- `src/db/dbProvider.ts` selects PostgreSQL through Drizzle when `DATABASE_URL` is reachable; otherwise it uses durable local JSON storage in `db.json`.
- `src/db/schema.ts` is the PostgreSQL schema source. Runtime SQL creation and ALTER statements are also embedded in `dbProvider.ts`.
- Supabase client/server helpers and Firebase-based Gmail/Drive integrations are present alongside the primary database path.
- Frontend navigation is state-based in `App.tsx` and component modules, with `/school/:subdomain` URL handling; there is no React Router dependency.

## Technology Stack

- Node.js, Express 5, Vite 6, React 19, TypeScript 5.8.
- Drizzle ORM + `pg`, with JSON fallback persistence.
- JWT (`jsonwebtoken`) and cookie-parser for session authentication.
- Supabase SSR/client libraries, Firebase 12, Google GenAI.
- Tailwind CSS 4, Lucide, Motion, Recharts, jsPDF, QRCode.
- Railway deployment configuration and a service worker for offline CBT support.

## Module Audit

**Working or substantially implemented in code:** authentication and session restoration, role-aware dashboards, tenant management, users, students, admissions, attendance, timetable, CBT exams/questions/attempts, AI integrations, PDF/report export, billing, lesson notes, Gmail/Drive integrations, offline action queue, audit logging, and responsive UI modules.

**Partially implemented or requiring runtime confirmation:** Supabase authentication integration, external Gmail/Drive OAuth, AI calls, billing payment behavior, Edves/FlexiSaf/NewGlobe integrations, tenant impersonation, report cards/transcripts, and promotion workflows.

**Remaining non-blocking documentation gap:** none for the audited Phase 0-3 scope. Explicit transactional migration tooling, a repeatable database/application readiness endpoint, API contract documentation, and automated smoke/UI suites are present.

**Operational finding:** startup is slow during dependency/database initialization, but both dev and built production servers eventually bind and respond. The built server used port 4318 because the dev server already occupied 4317. The hosted database is currently unreachable because the trial hosting session expired and the service was suspended.

## Database Tables

`users`, `classes`, `students`, `admissions`, `attendance`, `timetable`, `parents`, `exams`, `questions`, `exam_attempts`, `tenants`, `academic_terms`, `subjects`, `grades`, `assessments`, `promotions`, `disciplinary_records`, and `health_records` are declared in `src/db/schema.ts`. The idempotent baseline is now also defined in `migrations/0001_baseline.sql` and applied transactionally by `npm run migrate`, with `schema_migrations` tracking applied files.

All primary operational tables include a tenant identifier in the schema. Foreign-key constraints and indexes are not consistently declared, so relational integrity remains a database-risk area for a later dedicated phase.

## API Inventory

The Express API currently exposes routes for:

- `/api/auth/*`, `/api/user-management/*`, `/api/tenants/*`, and `/api/public/*`
- `/api/exams/*`, `/api/results/*`, `/api/student/*`, `/api/students/*`
- `/api/admissions/*`, `/api/attendance/*`, `/api/classes/*`, `/api/timetable/*`, `/api/parents/*`
- `/api/ai/*`, `/api/lesson-notes/*`, `/api/academic-terms/*`, `/api/subjects/*`
- `/api/grades/*`, `/api/gpa/*`, `/api/assessments/*`, `/api/promotions/*`
- `/api/billing/*`, `/api/edves/*`, `/api/newglobe/*`, and `/api/flexisaf/*`

Most routes use `authenticateToken`; public admissions submission, public tenant lookup/background update, public result verification, and the AI advisor endpoint are exceptions and require explicit threat-model review.

## Frontend Routes and Surfaces

There is one SPA entry point (`/`) with state-driven views for dashboard, admin ERP, teacher assessments, student CBT, parent portal, billing, lesson notes, attendance trends, AI dashboard, Edves ERP, tenant management, user management, Gmail, Drive, OgunLearn, and school landing/login (`/school/:subdomain`). The service worker is registered from `src/main.tsx`.

## Security Findings

- `server.ts` contains a fallback JWT secret when `JWT_SECRET` is absent. Production should fail closed instead of using a source-controlled default.
- Super-admin email addresses are hardcoded in `server.ts`; privileged identity should be configuration- or role-based.
- User passwords are stored in the application database schema as a `password` field; the audit did not establish a hashing boundary. This requires confirmation before production use.
- Tenant context is enforced for authenticated requests, but unauthenticated tenant selection and the public background update endpoint broaden the attack surface.
- `.env.local` exists and is ignored by the repository, but configuration completeness is not validated at startup.

## Technical Debt and Deployment

- `npm run clean` uses Unix `rm -rf`, which is not portable to the documented Windows environment.
- There is duplicated schema authority: Drizzle declarations, embedded SQL creation, ALTER statements, and `db.json` fallback shape.
- Several components use `any` and contain hardcoded display data; these should be separated from production data paths before relying on those surfaces.
- `railway.json`, `vite.config.ts`, `tsconfig.json`, `supabase/config.toml`, `.env.example`, and the service worker are present. The deployment target is Railway-style Node hosting. Live startup is verified by the Phase 0 smoke suite.
- The production frontend build emits a chunk larger than 500 kB after minification.
- The unused `drizzle-kit` development dependency was removed because it introduced a vulnerable esbuild loader chain; migration tooling remains a future decision rather than an installed, unused dependency.
- Railway is configured to use `/health/ready`, which returns success only when a configured PostgreSQL database is connected; local fallback remains valid when no database URL is configured.

## Verification Evidence

| Check | Result |
| --- | --- |
| Dependency inventory | Passed: `node_modules` and lockfiles present; package scripts inspected |
| TypeScript check | Passed: `npm run lint` |
| Production build | Passed: `npm run build`; large-chunk warning only |
| Dependency security audit | Passed: `npm audit --omit=dev --audit-level=high` reports 0 vulnerabilities after lockfile remediation and removal of unused `drizzle-kit` |
| Database connection | Passed while the hosted database was active: `migrations/0001_baseline.sql` applied successfully through `aws-0-eu-west-1.pooler.supabase.com:5432`; second run skipped the applied migration. Current access is suspended because the trial hosting session expired |
| Application startup | Passed after initialization: dev server responded on 4317; built server responded on 4318 after port scan |
| Public API smoke check | Passed: `GET /api/public/tenants/default` returned 200 |
| Protected API smoke check | Passed: `GET /api/auth/me` and `GET /api/academic-terms` without credentials returned 401 |
| Production SPA smoke check | Passed: built server root returned 200 with the React root element |
| Automated tests | Passed: `npm test` builds the app and runs 13 Node smoke/regression tests, including Phase 1 foundation, Phase 2 grading, and Phase 3 assessment behavior |
| UI/API/permissions/regression tests | Passed: `npm run test:ui` runs 2 headless Chromium SPA smoke tests; API and permission smoke coverage passed |
| Migration tooling | Passed live: `npm run migrate` applied five migrations transactionally; repeat verification skipped all five as already applied |

## Phase 0 Exit Criteria

Phase 0 exit criteria are complete:

1. `/health` reports application status, database mode, uptime, and startup duration; startup timing is logged.
2. `npm audit --omit=dev --audit-level=high` reports zero vulnerabilities.
3. `npm test` provides repeatable startup, public tenant, protected academic-route, and health regression coverage.
4. TypeScript validation and production build pass.

API contract documentation is complete in `docs/API_CONTRACT.md`. PostgreSQL connectivity and migration idempotency were verified through the EU-West pooler before the trial hosting session expired. The persistent `.env.local` uses that pooler URL. Restore or upgrade the hosted database service, then set the same `DATABASE_URL` in Railway before deployment; Railway secret values cannot be changed from this local workspace.

**Phase boundary:** Phase 1 core academic foundation, Phase 2 grade records, Phase 3 continuous assessment, and Phase 4 GPA/result calculation are complete. Reports and promotions remain later phases in the execution plan.