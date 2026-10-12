# HPL email identity audit and fix

## Root cause and policy

Registration and Login used express-validator `.normalizeEmail()` with provider-specific defaults. These mutate Gmail addresses by removing dots and tags; similar defaults can also strip other providers' tags. The resulting sanitized string was used for both storage and lookup. Consequently, `mian.talha1016@gmail.com` was stored as `miantalha1016@gmail.com`, and registering `mian.talha.1016@gmail.com` collided with it. Forgot Password used the same mutation, so the dotted address correctly found that account but storage/display had lost the originally entered formatting.

`backend/src/utils/email.util.js` is now the shared backend policy:

- `normalizeStoredEmail(value)`: trim surrounding whitespace and lowercase the entire address. Preserve dots, plus tags, and the submitted domain.
- `getEmailLookupKey(value)`: derive a lowercase/trimmed identity; only `gmail.com` and `googlemail.com` remove local-part dots and everything beginning with the first plus. Map `googlemail.com` to `gmail.com` only in the key.
- `isValidAccountEmail(value)`: validate conventional ASCII email addresses and maximum length 254. Invalid input is rejected server-side. Internationalized local parts are not supported.

Example: storage `mian.talha1016+hpl@googlemail.com`, lookup `miantalha1016@gmail.com`. For `user.name+tag@outlook.com`, storage and key both remain `user.name+tag@outlook.com`. This also applies to Yahoo and custom domains, including Google Workspace custom domains. Application code does not guess which provider hosts a custom domain.

Registration checks the unique key, stores the preserved email, and handles Prisma P2002 races with HTTP 409: "An account already exists for this email. Please log in or reset your password." Internal identity fields and constraint details are excluded from responses. Login looks up only the unique key and retains bcrypt/JWT behavior. Forgot Password looks up the same key and sends exclusively to the account's stored email. Unknown accounts send nothing. The generic response is finalized before lookup/SMTP work, and normalized-email rate limiting groups Gmail aliases together. Reset token generation, email snapshots, pending-delivery gating, expiration, hashing, atomic consumption, and JWT revocation remain intact.

Invitation validators preserve recipient addresses; invitation acceptance compares lookup keys, and invitation account registration checks the same unique account key. Seed account lookup follows the same policy. Contact-email sanitizers in Club/Team and verified-account-derived team application contact emails also call the shared storage helper, so those paths no longer strip dots or tags. Only email-related lines changed in those modules. Profile-edit workflows already prohibit changing account email; no new email-change route was added.

## Read-only database audit, October 13, 2026

The configured Neon database was inspected before model changes. A second audit using the shared utility confirmed:

- 26 accounts, 1 marked email-verified.
- No normalized-key collisions and no invalid stored addresses under the documented policy.
- Dotless Gmail account IDs: **7, 8, 9, 27, 28**. These may have lost dots, but dotless addresses are also legitimate; storage alone cannot establish original formatting.
- Account **28** currently stores `miantalha1016@gmail.com`. It must remain unchanged unless its owner proves ownership and explicitly requests a verified address change.

No account merge, deletion, guessed original, email rewrite, or production migration was performed. No conflicting accounts currently require manual resolution. If a later audit reports duplicates, stop deployment and review each account's ownership and associated roles/data manually. Do not choose a winner by creation time or password match.

Read-only audit command from `backend`:

```powershell
node scripts/auditAccountEmails.js
```

The audit reports identifiers and conflicting account emails only when needed for manual review. Treat its output as private operational data.

## Prisma and migration

`User` gains `email_key String @unique @default(dbgenerated())`. The existing unique `email` field is retained. The generated database column cannot be independently assigned: it always derives from the stored address. Application creation writes `email`, never `email_key`.

Migration: `backend/prisma/migrations/20261013000000_account_email_identity/migration.sql`.

The migration runs in one transaction, locks User against concurrent writes, defines an immutable PostgreSQL counterpart of the shared lookup calculation, checks collisions, adds a **stored generated column**, and creates its unique index. Adding the generated column automatically backfills keys for all existing accounts without changing any stored email. If a collision appears between audit and application, the migration aborts before adding the column/index. Existing verification states, passwords, roles, relations, and tokens are preserved.

The exact migration expression was verified with SELECT-only queries against all **26 existing emails and 8 edge-case samples**, including Gmail aliases, non-Gmail providers, casing, spaces, and Unicode surrounding whitespace. SQL/JavaScript parity passed. No database functions, schema, or records were created by that check.

```powershell
node scripts/checkEmailKeySql.js
```

Latest read-only `prisma migrate status` reports **only the account-email identity migration pending**. The earlier password-recovery and match-clock migrations are already applied in the configured database. This session did not apply them. Prisma schema validation/client generation passed for the new field, but the email migration remains **prepared, not applied**.

Deployment plan, after explicit production approval:

1. Rerun the read-only audit; stop on conflicts or invalid records. Review the prepared SQL and schedule the short User table lock for a low-traffic window.
2. Confirm DATABASE_URL points to the intended database and take the normal operational backup/snapshot.
3. From `backend`, run `npx.cmd prisma migrate deploy`, then `npx.cmd prisma generate`.
4. Deploy/restart the updated backend. Do not deploy the new Prisma client against a database without `email_key`; it will fail with P2022. Never use `db push` or `migrate reset`.
5. Verify existing-account login and recovery on staging/production using owner-controlled mailboxes. Re-audit and confirm uniqueness.

The PostgreSQL function and generated-column definition must be preserved in future migrations. Prisma represents this database-specific generated column as a db-generated field; inspect future schema diffs/introspection before applying them. If the policy changes, update both JavaScript and SQL and rerun parity/collision checks before rebuilding keys.

## Email verification

Email ownership verification already exists: registration creates a hashed verification token and sends the link; `/api/auth/verify-email` checks the token, expiry, single-use state, and exact stored email snapshot. `/api/auth/me/email-verification/resend` supports resending. `User.email_verified` and `email_verified_at` record the result. Independent team applications require verification.

Only 1 of the 26 audited accounts is marked verified; the remaining accounts are **not assumed verified**. Existing Login and Forgot Password continue to support registered unverified accounts to preserve behavior. Recovery goes to their registered mailbox, and completing a password reset does not automatically mark email ownership verified. Invitation-created accounts also remain unverified under the existing behavior. A future account email-change workflow should require ownership verification of the new address, recheck identity uniqueness, revoke affected reset/verification tokens and sessions, and never silently replace the stored email.

## Tests

From `backend`:

```powershell
node --test src/modules/auth/emailIdentity.security.test.js src/modules/auth/passwordReset.security.test.js src/modules/playerInvitations/playerInvitation.registration.security.test.js src/modules/playerInvitations/playerInvitation.acceptance.security.test.js
```

**30 focused tests passed**, covering normal/dotted/tagged/cased Gmail registration; provider-specific isolation for Outlook/Yahoo/custom domains; validator preservation of original dots/tags; equivalent Gmail Login; preserved legacy stored emails; known/equivalent/unknown Forgot Password requests; delivery only to the registered mailbox; clean duplicate and concurrent registration conflicts; reset-token security; canonical alias rate limiting; JWT revocation; invitation registration/acceptance compatibility; existing bcrypt Login/Register behavior.

Tests mock Prisma and SMTP. Concurrent registration tests exercise actual controller handling of a simulated unique-index race. They do not prove real database concurrent insertion behavior. SQL-expression parity against existing Neon records is verified read-only. The migration and real concurrent inserts on a migrated disposable PostgreSQL database, actual mailbox delivery, and deployed end-to-end recovery have not been verified. Existing users after migration are covered by key-expression parity and a legacy-account controller test; live post-migration login remains a deployment check.

## Files changed for this task

Created: `src/utils/email.util.js`, `scripts/auditAccountEmails.js`, `scripts/checkEmailKeySql.js`, `src/modules/auth/emailIdentity.security.test.js`, `prisma/migrations/20261013000000_account_email_identity/migration.sql` (all under backend), and `docs/EmailIdentity.md`.

Modified under backend: `prisma/schema.prisma`, `prisma/seed.js`, `src/modules/auth/auth.validation.js`, `auth.routes.js`, `auth.controller.js`, `passwordReset.controller.js`, `passwordReset.security.test.js`; `src/middleware/auth/rateLimit.middleware.js`; `src/utils/playerInvitationEmail.util.js`; `src/modules/playerInvitations/playerInvitation.controller.js` and `playerInvitation.validation.js`; `src/modules/clubs/club.validation.js`; `src/modules/teams/team.validation.js`, `team.controller.js`, and `teamRegistration.controller.js`. Updated `docs/PasswordRecovery.md` to reflect current migration status and the shared normalization policy. Frontend implementation from the previous task is unchanged.

## Remaining limitations

- Previously lost dots/tags cannot be reconstructed safely. Existing email strings are preserved exactly during migration.
- Whole-address lowercase is the explicit application policy. Rare providers that distinguish local-part casing are not supported as separate identities; non-ASCII account addresses are rejected.
- Middleware rate limit stores remain per-process; database reset cooldown remains shared across instances. SMTP work after the generic response is not a durable queue. These existing recovery operational limitations remain documented in `PasswordRecovery.md`.
- Password reset supports registered but unverified accounts and does not itself set email_verified. No ownership claims are inferred from database presence.
- Production migration requires explicit approval; until it is applied, the new email-key-dependent backend code is not ready to run against the current database.
