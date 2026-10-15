# Captain registration workflow

Implemented locally on 2026-10-14. No deployment, migration, production data write, or verified live email delivery was performed.

## Behavior

Competition registration now always collects a new team and manual player roster. Saved-team selection and its creation handler were removed. Authenticated account ID/name/email are resolved on the server; the captain is not automatically a player. Pending snapshots remain private. The existing wizard retains data between steps, skips payment for free competitions, validates required roster fields and jerseys, and blocks duplicate submit clicks. Existing applications replace the fresh form; CHANGES_REQUESTED edits the same record.

Paid submissions require an allowed active central receiving account, transaction reference and authenticated private receipt. Approval requires verified payment. Competition opening, closing, publication, capacity, finalization and active-season checks remain on the backend. Configured legacy competitions can use manual submissions while preserving tournament format and fixtures; legacy settings must be completed by an administrator first. Existing registrations and historical review data are retained.

Competition row locks serialize submissions and review; PostgreSQL advisory locks protect shared payment references. All transaction queries remain sequential and database-only. Approval atomically creates the public team, bulk roster, memberships, approval history and email job. Failed approval rolls these back. Repeated approval cannot recreate public records.

One captain/competition registration is reserved across PENDING, CHANGES_REQUESTED, APPROVED and REJECTED. The service checks existing historical records and returns HTTP 409 with the caller's existing registration ID/status. A new composite unique index enforces the same identity at the database level. Names use trimmed, case-insensitive, repeated-space normalization and the existing competition/name unique key. Rejected names remain reserved until a Super Admin explicitly releases the name with an audited reason before finalization. This releases only the name, never the captain/competition identity.

## Mandatory approval email

Approval enqueues one RegistrationApprovalEmail record inside the transaction. SMTP uses the current stored captain mailbox only after commit, independently of optional REGISTRATION_EMAIL_ENABLED status emails. It reuses HPL account-mail configuration and Nodemailer, uses the exact subject `Your Team Registration Has Been Approved — HPL`, includes captain/team/competition/season and FRONTEND_URL links, and excludes payment details. The existing in-app notification remains.

An atomic PENDING-to-SENDING claim prevents concurrent sends. Attempts and timestamps are recorded. SENT means the SMTP server accepted the registered recipient; it does not prove inbox delivery. Mail failure records FAILED and does not undo approval. The server worker recovers PENDING jobs every 60 seconds. FAILED and ambiguous SENDING jobs require administrator/mail-provider reconciliation; they are not blindly retried. A deterministic Message-ID helps that investigation but does not guarantee provider deduplication. A process crash between claiming and sending can also leave SENDING. No exactly-once SMTP or production delivery claim is made.

Configure EMAIL_USER, EMAIL_APP_PASSWORD, EMAIL_FROM_NAME and FRONTEND_URL through deployment secrets. Production FRONTEND_URL must use HTTPS. Apply reviewed migrations before starting the updated server/worker. Validate live SMTP separately after authorized deployment.

## Schema and safe migration status

`backend/prisma/schema.prisma` adds `@@unique([competition_id, registered_by])`, the RegistrationApprovalEmail relation and job model. SQL is prepared at `backend/prisma/migrations/20261017000000_captain_registration_identity/migration.sql`; it aborts if duplicate captain identities exist. The prior `20261016000000_competition_registration_workflow` migration and earlier pending history must be reviewed and applied in order. Neither new migration has been applied.

Read-only database audit at 2026-10-13 19:50:42 UTC (2026-10-14 in Pakistan) inspected 11 competitions, 11 registrations, 14 teams, 217 players and 11 payments. No normalized name or payment-reference conflicts were found. Captain conflicts exist in competition 2:

| Account ID | Registration IDs |
| --- | --- |
| 16 | 1, 4, 7, 10 |
| 17 | 2, 5, 8 |
| 18 | 3, 6, 9 |

Deployment is blocked on manual reconciliation of these records. Preserve every team, player, payment and registration. Determine legitimate ownership from evidence; any reassignment to a genuine separate captain requires explicit approval. Do not delete, merge, guess ownership, or grandfather duplicate identities. If ownership cannot be resolved without changing the required rule, resolve that policy before deployment.

Before authorized deployment: back up the database; verify migration history and repeat `node scripts/registration-workflow-preflight.js` from backend; review approved reconciliation separately; require zero conflicts; test ordered migrations and concurrency on an isolated database; then obtain explicit production approval before `prisma migrate deploy`. No reset or db push is part of this plan.

## Endpoints

- POST `/registrations/submissions`: new captain application. POST `/registrations` is a compatibility alias to the same validated service; retired team_id payloads are rejected.
- PUT `/registrations/submissions/:registration_id`: corrections on the same owned CHANGES_REQUESTED application.
- Existing submission detail/list, payment-review and review endpoints retain their authorization.
- POST `/registrations/submissions/:registration_id/release-name`: Super Admin only, body `{ "reason": "..." }`.
- Admin competition registration settings support configured legacy competitions. `/admin/competitions/:competitionId/tournament-settings` retains the historical tournament editor.

## Modified files for this improvement

Backend: prisma/schema.prisma; prisma/migrations/20261017000000_captain_registration_identity/migration.sql; scripts/registration-workflow-preflight.js; src/constants/auditActions.js; src/server.js; src/services/registrationMail.service.js; src/services/registrationApprovalEmail.service.js; src/modules/registrations/workflow.service.js, workflow.controller.js, workflow.test.js, registration.controller.js, registration.routes.js, registration.workflow.test.js.

Frontend: src/App.jsx; src/features/admin/pages/AdminCompetitionFormPage.jsx; src/features/registrations/components/ManualRegistrationWizard.jsx and ApplicationDetails.jsx; src/features/registrations/services/registrationService.js and workflowService.js. The temporary LegacyCompetitionRegistrationPage.jsx fallback was removed. Existing prior workflow changes are documented in CompetitionRegistrationWorkflow.md and its file manifest.

## Validation

- Focused backend registration/workflow suite: **42 passed, 0 failed**. Includes manual new-team creation, complete roster, free/paid proof, normalization, all-state captain identity, concurrent requests, retired API bypass, corrections, payment verification, authorization, public approval visibility, atomic rollback including email-job failure, mandatory mail after commit, SMTP failure, repeated approval, concurrent job claiming and uncertain-send recovery.
- Full backend suite: **191 tests, 179 passed, 12 failed**. These are the previously observed unrelated failures: 2 normal-user routing integration assertions, 4 normal-user profile/password cases, 2 club dashboard fixtures, 1 club eligible-team fixture, 1 public club routing assertion, and 2 season admin fixtures. The full suite is not green.
- Prisma validation and client generation passed. Frontend production build and ESLint exited 0; build retains the large-chunk warning and lint reports existing React warnings in unrelated team/admin components. Changed backend JavaScript syntax and git whitespace checks passed.
- Service tests use rollback-capable serialized database doubles and real HTTP routers/JWT middleware over localhost. They do not prove PostgreSQL lock/index behavior against a migrated live database. Mail transports are mocked and inspect SMTP acceptance. Production concurrency, migrations, live email and browser/mobile visual testing were not performed.

Commands: `node --env-file=.env --test src/modules/registrations/workflow.test.js src/modules/registrations/registration.workflow.test.js`, `node --env-file=.env --test` (NODE_ENV=test), `npx --no-install prisma validate`, `npx --no-install prisma generate`, `npm run build`, `npm run lint`.
