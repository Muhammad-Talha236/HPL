# Competition creation and manual roster registration

Delivery date: 2026-10-14. Implementation is prepared locally. The production database migration has **not been applied** and the new code must be deployed only after the reviewed migration is approved and applied.

## Implemented behavior

- Super Admin payment-account settings support JazzCash, EasyPaisa and bank transfer. Wallet aliases normalize to the same Pakistani mobile number; bank details accept numeric accounts or valid IBANs. Database uniqueness prevents duplicate provider/account identities. Account deactivation preserves historical proofs.
- Competition creation uses Basic Information → Registration → Payment → Review. Administrators can save a draft or publish. Format, tournament dates and fixtures are absent from creation. New competitions use `MANUAL_ROSTER` and `NOT_CONFIGURED`.
- Published competition cards appear on season pages by default. Each configured competition opens its own existing tournament views. Published archived competitions remain discoverable; their registrations stay closed. Drafts stay out of the public competition API.
- Public details show the season, division, registration window, fee, capacity, roster requirements, instructions and confirmed teams. Registration links use the existing protected route and preserve the login destination. Existing applications link to their status page.
- Authenticated representatives enter team details and a manual player roster. Name/email come from the current account on the server. No player login accounts, invitations or Team Owner portal are created. Free competitions automatically skip payment.
- Paid applications require a configured active receiving account, transaction reference and uploaded receipt. Receipt uploads use authenticated Cloudinary storage, server file-content checks, and a maximum of 5 MB. The persistent receipt owner and consumption record are checked again on submission. Downloads require the original uploader or Super Admin and expire after five minutes.
- Submission stores team/roster snapshots and a server-derived fee. It creates no public Team or Player rows. Pending applications do not reserve confirmed capacity; approval counts confirmed teams under the competition lock. New submissions stop once confirmed capacity is reached.
- My Registrations provides paging, search, status filters, full details and correction/resubmission. Corrections preload the existing roster and proof. Approved applications are locked.
- Admin review separates payment verification from whole-team approval. Paid approval requires `VERIFIED`; free approval requires `NOT_REQUIRED`. Rejection/correction requires a reason. Review history records the administrator and time.
- Approval creates Team, Player, ACTIVE TeamPlayer and CompetitionPlayer records and marks the registration APPROVED in one transaction. Players receive generated registration numbers; memberships receive joined dates. Existing user roles remain unchanged.
- Payment replacements preserve receiving-account snapshots, prior receipts, references and review evidence. Different references retain their own Payment rows, with old proofs marked `SUPERSEDED`. The same application can correct or reinstate its own reference; another application cannot reuse it.
- Finalization requires closed registration, at least one approved team, capacity compliance, satisfied payments and no unresolved applications. Active roster eligibility is rechecked. The participant list is locked and audited. Tournament format remains unset, with a later-setup placeholder.
- In-app submission/review notifications use the existing Notification model. Optional status emails reuse the account SMTP configuration and are sent only to verified registered mailboxes. Notification failures do not undo committed changes.
- Legacy club/team registration, payment submission, squad management and existing tournament editing remain available for legacy competitions. Their mutation APIs reject new roster applications to prevent bypassing the new review rules. Legacy Club Owner lists remain scoped to the legacy workflow; new applications are available through My Registrations.

## Database changes

Migration: `backend/prisma/migrations/20261016000000_competition_registration_workflow/migration.sql`.

| Model | Change |
| --- | --- |
| Competition | Nullable format/tournament dates; publication/workflow/tournament state; minimum roster size; fee type, instructions, logo; close/finalization audit fields; allowed receiving-account relation |
| CompetitionRegistration | Nullable team link until approval; team/roster snapshots; normalized team-name identity; frozen fee; receipt relation; unique competition/team-name identity |
| Payment | Receipt relation, receiving-account snapshot, proof history, verifier/time/reason metadata |
| PaymentAccount | Central receiving details, provider, availability and unique provider/account key |
| PaymentReceipt | Private storage identity, uploader, type/size, upload expiry and consumed-registration link |
| Team | Nullable home venue so approval does not invent a venue; existing Restrict deletion behavior retained |
| User | Receipt relation only; account roles and authentication fields are preserved |

The migration is wrapped in a transaction. It aborts on existing normalized competition-name, registration-name or payment-reference collisions. It backfills legacy workflow metadata and fee/name lookup keys without rewriting original names, payment references, profiles or fixtures. Existing competitions remain `LEGACY`; their configured/ongoing/completed tournament state derives from existing format and match records.

Two SQL-managed expression indexes enforce normalized competition-name identity within a season and case-insensitive payment-reference identity across existing and new payment APIs. Preserve these indexes in future reviewed migrations; Prisma schema validation alone does not represent expression indexes.

No tables, accounts, teams, players, payments or history have been deleted or merged. Earlier historical migrations remain unchanged.

## Read-only database preflight

Run from `backend`:

```powershell
node scripts/registration-workflow-preflight.js
```

The script uses a READ ONLY transaction and reports aggregate counts and conflicting record IDs. It never prints credentials, email/contact details or proof contents. A harmless connection read precedes transaction acquisition to avoid cold TLS/Neon startup consuming the interactive transaction acquisition window.

Observed on `2026-10-13T15:56:34.299Z`:

| Records | Count |
| --- | ---: |
| Competitions | 11 |
| Registrations | 10 |
| Teams | 14 |
| Players | 217 |
| Payments | 10 |

Competition-name conflicts: 0. Registration-name conflicts: 0. Case-insensitive payment-reference conflicts: 0. This is a read-only data check, not a migration deployment or production write test.

## Migration/deployment instructions

1. Take a database backup and verify the deployment target.
2. Inspect `prisma migrate status` and all pending migration SQL, including any earlier pending optional-player-profile migration. Do not reset the database or skip historical migration dependencies.
3. Re-run the read-only preflight against the intended target immediately before deployment. Resolve any conflicts manually; do not guess identities or automatically merge/delete records.
4. Apply the migration only after explicit approval. From `backend`, the reviewed deployment commands are:

   ```powershell
   npx.cmd --no-install prisma migrate deploy
   npx.cmd --no-install prisma generate
   ```

5. Deploy the matching backend and frontend together after the schema is ready. Current new endpoints reference the new columns and tables.
6. In staging, verify a real free and paid registration, private JPG/PNG/PDF upload/download, correction, payment verification, approval, confirmed roster, finalization and existing legacy flows.

Migration status: **prepared, unapplied**. Neither `migrate deploy`, `db push`, nor database reset was executed.

## APIs

All paths below have `/api` as their prefix.

| Method / endpoint | Access / purpose |
| --- | --- |
| GET `/admin/payment-accounts` | Super Admin receiving-account settings |
| POST `/admin/payment-accounts` | Super Admin create account |
| PUT `/admin/payment-accounts/:account_id` | Super Admin edit/deactivate account |
| POST `/competitions` | Super Admin create draft/published competition |
| PATCH `/competitions/:competition_id` | Super Admin settings; legacy editing remains guarded |
| GET `/competitions/management`, `/competitions/management/:competition_id` | Super Admin counts and management details |
| POST `/competitions/:competition_id/publish` | Publish draft |
| POST `/competitions/:competition_id/close` | Close registration |
| POST `/competitions/:competition_id/finalize` | Lock approved participants |
| GET `/competitions`, `/competitions/:competition_id` | Public published discovery/details; optional season filter |
| GET `/competitions/:competition_id/teams` | Public approved participant identities only |
| GET `/registrations/submissions` | Current representative's applications; Super Admin can request `scope=admin` |
| POST `/registrations/submissions` | Authenticated team/roster submission |
| GET `/registrations/submissions/:registration_id` | Submitter or Super Admin; legacy club permissions retained |
| PUT `/registrations/submissions/:registration_id` | Submitter corrections/resubmission only |
| POST `/registrations/submissions/:registration_id/review` | Super Admin APPROVE / REQUEST_CHANGES / REJECT |
| POST `/registrations/submissions/:registration_id/payment-review` | Super Admin VERIFY / REJECT |
| POST `/registrations/image-upload` | Authenticated optional team/player/competition image |
| POST `/registrations/receipt-upload` | Authenticated private receipt upload |
| GET `/registrations/receipts/:receipt_id` | Uploader or Super Admin; short-lived signed download |

Invalid fields, IDs and transitions are rejected server-side. Prisma constraints produce clean conflict responses. Submission/resubmission and uploads have account-based rate limits in addition to the existing global IP limiter.

## Frontend routes

- `/admin/settings/payment-accounts`
- `/admin/competitions`, `/admin/competitions/new`, `/admin/competitions/:competitionId`, `/admin/competitions/:competitionId/edit`
- `/admin/registrations`, `/admin/registrations/:registrationId`
- `/seasons/:seasonId`, `/competitions/:competitionId`
- `/competitions/:competitionId/register`
- `/my/registrations`, `/my/registrations/:registrationId`, `/my/registrations/:registrationId/edit`

My Registrations is included in desktop/mobile account navigation. Existing protected routes and Axios/JWT handling are reused. Shared UI supports inline errors, status notifications/toasts, upload progress, keyboard focus, responsive grids, contained table scrolling, and reduced-motion-aware step transitions.

## Environment

Existing database/JWT/Cloudinary settings remain required. New optional settings are documented in `backend/.env.example`:

```dotenv
REGISTRATION_UPLOAD_MAX_BYTES=5242880
REGISTRATION_EMAIL_ENABLED=false
```

The upload limit is bounded above at 5 MB. Enabling optional emails uses existing `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM_NAME` and `FRONTEND_URL`. No production secrets were changed or included in this report.

## Transaction behavior

Every new interactive transaction executes statements sequentially. Competition/registration row locks protect approval, correction and finalization. Advisory locks protect normalized names and transaction references and return Boolean rather than PostgreSQL void. Receiving-account proof snapshots use a shared row lock.

Roster creation uses bulk statements; query count does not increase with every player. Receiving-account links also use a single bulk statement rather than nested per-account writes. Uploads, SMTP and notifications run outside transactions.

The new workflow caps interactive execution at 10 seconds with a 2-second acquisition window and 2-second PostgreSQL lock timeout. Busy locks return a retryable conflict. This is bounded sequential remote database work, not an invitation-timeout fix or a live latency guarantee. Development-only traces record transaction acquisition, lock/query names, commit/rollback and milliseconds without SQL arguments, contact data or receipt URLs. Production write timings have not been measured.

## Validation results and limits

The final result summary is in `docs/CompetitionRegistrationChecks.json`: **31/31 new workflow tests passed**. The full backend suite ran **183 tests: 171 passed, 12 failed**. Backend service tests use an isolated serialized database test double with rollback and overlapping-query detection. HTTP tests use the actual Express routers, JWT authentication and authorization over localhost, with database operations isolated. They do not certify PostgreSQL's lock implementation or a live Cloudinary/SMTP deployment.

The focused backend regression run before the final archive-discovery addition passed 79/79 tests, including authentication/email identity, password recovery, legacy registration, matches, player memberships and removed-system guards. The new workflow scenarios cover free/paid submission, concurrent duplicate submissions/approvals, capacity, rollback, private receipt ownership, replacement/reinstatement, verification, finalization, role/field injection, draft hiding, archived discovery and safe timing logs.

Prisma schema validation/client generation, frontend build, changed-frontend lint and backend syntax checks passed. The frontend build retains the repository's existing large-chunk warning.

The full backend suite still has the 12 failures previously recorded before this implementation: two public routing source assertions, four normal-user profile/password fixture/assertion failures, two club dashboard fixtures, one club eligible-team fixture, one public club route assertion and two season admin fixtures. They are not reported as passing or silently removed. Individual names are recorded in the checks JSON; the earlier baseline was 152 tests, 140 passed and 12 failed, documented in `docs/CompleteOwnerSystemRemoval.md`.

Browser desktop/mobile visual verification was attempted, but this session exposed no browser surface and could not create the in-app browser. No browser screenshot pass is claimed. No production registrations, approvals, migrations, Cloudinary uploads or SMTP delivery tests were performed.

Additional operational limits: free-text eligibility instructions still require human review; no automatic tournament engine or payment gateway is included. Receipt checks validate signatures/basic PDF structure, not malware. Configure retention/cleanup for abandoned unconsumed upload assets and confirm authenticated raw/PDF downloads with the real Cloudinary account in staging. Unsaved form drafts are not persisted.

## Files

See `docs/CompetitionRegistrationFiles.json` for the complete created/modified file manifest. Main implementations are:

- Backend: `workflow.controller.js`, `workflow.service.js`, `workflow.validation.js`, `workflow.transaction.js`, `workflow.upload.js`, `workflow.guard.js`, `workflow.test.js` in `backend/src/modules/registrations`; `registrationMail.service.js`; read-only preflight script; Prisma schema/migration; existing competition/registration/payment/admin route integration and match compatibility guard.
- Frontend: shared `WorkflowUI`, `ManualRegistrationWizard`, `ApplicationList`, `ApplicationDetails`, `CompetitionManagement`, payment-account settings, competition creation wizard, public discovery/details, presentation utilities and step CSS; existing App/navigation/season/notification integration.
- Legacy compatibility: legacy competition edit/registration/detail components, legacy Club Owner registration scope and nullable-venue admin editing.
