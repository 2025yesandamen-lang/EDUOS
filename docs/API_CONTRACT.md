# EduOS API Contract

**Base URL:** the deployed application origin. All request and response bodies use JSON unless stated otherwise.

## Authentication

Protected endpoints require either `Authorization: Bearer <JWT>` or the `session_token` cookie. Tokens contain `id`, `email`, `name`, `role`, and `tenantId`. Missing or invalid credentials return `401`.

Roles are `ADMIN`, `TEACHER`, `STUDENT`, and `PARENT`. Authenticated tenant context is taken from the token; client-supplied tenant IDs are not trusted for protected requests.

Common errors use this shape:

```json
{"error": true, "message": "Description"}
```

## Health and Public Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | None | Process liveness, database mode, uptime, and startup duration |
| GET | `/health/ready` | None | Deployment readiness; returns `200` for configured PostgreSQL readiness and `503` while unavailable |
| GET | `/api/public/tenants/:subdomain` | None | Resolve public school branding/configuration |
| POST | `/api/admissions` | None | Submit a public admission application |
| GET | `/api/public/verify-result/:hash` | None | Verify a published result by hash |

## Auth and Administration

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | None | Authenticate with email, password, and optional tenant |
| POST | `/api/auth/register` | None | Register an account |
| POST | `/api/auth/logout` | None | Clear the session cookie |
| GET | `/api/auth/me` | Any | Return the authenticated user |
| GET/POST/PUT/DELETE | `/api/user-management/users[/:userId]` | Admin | Manage users |
| POST | `/api/user-management/users/bulk-delete` | Admin | Delete users in bulk |
| POST | `/api/user-management/users/bulk-edit` | Admin | Edit users in bulk |
| GET/POST/PUT/DELETE | `/api/tenants[/:id]` | Admin | Manage school tenants |
| GET | `/api/tenants/:id/admins` | Admin | List tenant administrators |
| POST | `/api/tenants/:id/impersonate` | Super admin | Create a tenant-admin session |

## Academic and Student Operations

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET/POST | `/api/classes` | Admin, Teacher | List/create classes |
| GET/POST | `/api/timetable` | Admin, Teacher | List/create timetable entries |
| GET/POST/PATCH | `/api/students[/:id]` | Admin, Teacher, Student, Parent | Read/create/update students |
| PATCH | `/api/students/bulk-status` | Admin | Update student status in bulk |
| POST | `/api/students/bulk-import` | Admin | Import students |
| GET/POST/PATCH | `/api/attendance` | Admin, Teacher | Read/create attendance records |
| GET/POST/PATCH | `/api/admissions[/:id]` | Admin, Teacher | Review admission applications |
| GET/POST | `/api/parents` | Admin, Teacher | List/create parent records |
| GET | `/api/parents/invitations` | Admin | List parent invitations |
| GET/POST/PUT | `/api/academic-terms[/:id]` | Authenticated | Manage academic terms |
| GET/POST/PUT | `/api/subjects[/:id]` | Authenticated | Manage subjects |
| GET | `/api/subjects/stream/:stream` | Authenticated | Filter subjects by stream |
| GET/POST/PUT | `/api/grades[/:id]` | Authenticated | Manage grades |
| GET | `/api/grades/student/:studentId` | Authenticated | List student grades |
| GET | `/api/gpa/student/:studentId` | Authenticated | Calculate student GPA |
| GET | `/api/results/student/:studentId` | Authenticated | Return published subject results, term GPA, average, pass/fail status, and academic standing |
| GET | `/api/results/class/:classId` | Admin, Teacher | Return class averages and optional term ranking |
| GET/POST/PUT | `/api/assessments[/:id]` | Authenticated | Manage continuous assessments |
| GET | `/api/assessments/class/:classId` | Authenticated | List class assessments |
| GET/POST/PUT | `/api/promotions[/:id]` | Authenticated | Manage promotion proposals |
| GET | `/api/promotions/pending` | Authenticated | List pending promotions |
| GET | `/api/promotions/student/:studentId` | Authenticated | Read a student promotion |
| PUT | `/api/promotions/:id/approve` | Admin | Approve a promotion |

## Exams and Results

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/api/exams[/:id]` | Admin, Teacher, Student, Parent | Manage/read exams according to role |
| GET/POST | `/api/exams/:id/questions` | Admin, Teacher | Manage exam questions |
| POST | `/api/exams/:id/generate-ai` | Admin, Teacher | Generate questions with AI |
| POST | `/api/exams/:id/start` | Student | Start an exam attempt |
| POST | `/api/exams/:id/answers` | Student | Save an answer |
| POST | `/api/exams/:id/submit` | Student | Submit an attempt |
| GET | `/api/exams/:id/results` | Admin, Teacher, Student, Parent | Read exam results |
| GET | `/api/exams/:id/attempts` | Admin, Teacher | List exam attempts |
| GET | `/api/student/:id/attempts` | Authenticated | List student attempts |
| GET | `/api/results/all` | Admin, Teacher | List all results |

## Supporting Modules

## Grading and Academic Records

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET/POST | `/api/grading-schemes` | Authenticated/Admin | Read or create tenant grading policies; weights must total 100% |
| GET | `/api/grades` | Authenticated | List tenant grade records |
| GET | `/api/grades/student/:studentId` | Authenticated | Read a student's grades, optionally filtered by `termId` |
| GET | `/api/gpa/student/:studentId` | Authenticated | Calculate the student's GPA |
| POST | `/api/grades` | Admin, Teacher | Create a calculated grade using a scheme or the default policy |
| PUT | `/api/grades/:id` | Admin, Teacher | Update an unapproved grade |
| PUT | `/api/grades/:id/approve` | Admin | Approve or reject a grade; approved grades are locked for teachers |

## Continuous Assessment

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/api/assessments` | Authenticated | List assessment definitions |
| GET | `/api/assessments/class/:classId` | Authenticated | List class assessments, optionally filtered by `termId` |
| POST | `/api/assessments` | Admin, Teacher | Create a weighted test, quiz, assignment, project, practical, presentation, or participation assessment |
| PUT | `/api/assessments/:id` | Admin, Teacher | Update an open assessment; closed terms and closed assessments are locked |
| GET | `/api/assessment-scores` | Authenticated | List student scores, optionally filtered by `assessmentId` |
| POST | `/api/assessment-scores` | Admin, Teacher | Enter a student score within the assessment mark limit |
| PUT | `/api/assessment-scores/:id` | Admin, Teacher | Update an unapproved score; approved scores are locked for teachers |
| PUT | `/api/assessment-scores/:id/approve` | Admin | Approve or reject a score |

- Billing: `/api/billing`, `/api/billing/categories`, `/api/billing/payments`, and `/api/billing/:id/pay`.
- Lesson notes: `/api/lesson-notes` and `/api/lesson-notes/:id/review`.
- AI: `/api/ai/advisor-chat`, `/api/ai/student-summary`, `/api/ai/admin-dashboard`, `/api/ai/explain-question`, and `/api/ai/behavior-comment-assist`.
- Integrations: `/api/edves/*`, `/api/newglobe/*`, and `/api/flexisaf/*`.

## Tenant Isolation

For authenticated requests, the server derives tenant context from the verified JWT and overwrites conflicting tenant query, header, and body values. Data access functions apply the active tenant filter. Super-admin operations are the only documented bypass path.

## Deployment Configuration

Set `DATABASE_URL` to the Supabase EU-West pooler connection string in both local and Railway environments. Railway uses `GET /health/ready` as its deployment health check. Apply migrations with `npm run migrate` before starting the application.
