# HPL password recovery

Implemented `/forgot-password` and `/reset-password` using the existing React authentication inputs, Tailwind colors, Axios client, Gmail provider, Prisma, and bcrypt configuration. The Login page already linked to `/forgot-password`; its behavior and markup remain intact. Recovery routes are public even when a user has an existing session.

## Files

Created:

- `backend/src/modules/auth/passwordReset.controller.js`
- `backend/src/modules/auth/passwordReset.security.test.js`
- `backend/src/services/passwordReset.service.js`
- `backend/prisma/migrations/20261012000000_password_reset/migration.sql`
- `frontend/src/features/auth/components/RecoveryLayout.jsx`
- `frontend/src/features/auth/pages/ForgotPasswordPage.jsx`
- `frontend/src/features/auth/pages/ResetPasswordPage.jsx`
- `frontend/src/features/auth/utils/passwordResetValidation.js`
- `docs/PasswordRecovery.md`

Modified:

- `backend/prisma/schema.prisma`
- `backend/src/modules/auth/auth.routes.js`
- `backend/src/modules/auth/auth.controller.js`
- `backend/src/middleware/auth/auth.middleware.js`
- `backend/src/middleware/auth/rateLimit.middleware.js`
- `backend/.env.example`
- `frontend/src/App.jsx`
- `frontend/src/features/auth/services/authService.js`
- `frontend/index.html`
- `frontend/vercel.json`

## API

`POST /api/auth/forgot-password`

Request: `{"email":"user@example.com"}`. Email uses the shared storage/identity policy in `email.util.js` as Login/Register, is validated server-side, and is limited to 254 characters.

Response (200): `{"message":"If an account exists with this email, a password reset link has been sent."}`. Registered, unknown, account-throttled, and delivery-failed requests receive the same response. The controller responds before account lookup or SMTP work to avoid account-dependent response latency. Malformed email returns 400 with the project's field-error format; IP throttling returns 429.

`POST /api/auth/reset-password`

Request: `{"token":"64-character-lowercase-hex-token","newPassword":"NewPassword@123"}`.

Response (200): `{"success":true,"message":"Password reset successfully. Please log in with your new password."}`.

Invalid/expired/used/pending tokens return 400 with `success:false` and a message asking the user to request a new link. Weak passwords return 400. Operational reset failures return 503. Confirm Password is a frontend check; it is not an API field. The server independently validates password strength and rejects passwords exceeding bcrypt's 72-byte input limit. Both endpoints set `Cache-Control: no-store` and `Referrer-Policy: no-referrer` before route validation or throttling.

## Database and security

`PasswordResetToken` stores an integer identifier, user relation, unique SHA-256 token hash, email snapshot, expiration, creation, delivery, and usage timestamps. Indexes cover user/creation and expiry. Raw tokens are 32 cryptographically random bytes and expire after 15 minutes.

`User` gains `session_version` (default 0), `password_reset_requested_at`, and the reset-token relation. The migration adds columns/table/indexes only; no existing tables or users are deleted or recreated.

Issuance and reset consumption lock the same User row using a parameterized `SELECT ... FOR UPDATE` inside an interactive transaction. A database-backed 15-minute cooldown prevents repeated emails across instances. A reset atomically conditionally consumes the token, updates the bcrypt password, increments the session version, and revokes every other unused account reset token. Tokens are bound to the current email, so changing an account's email invalidates links sent to the previous address. Pending tokens cannot be consumed before SMTP success; delivery failures revoke them. Logs use fixed operational messages and never print provider errors, tokens, email addresses, or full reset links.

JWTs now carry the account session version. Authentication checks the current database version, so all existing JWTs are rejected after recovery. Legacy JWTs without a version remain valid only while the account version is zero. No refresh-token system exists in this project. Reset does not log the user in.

The frontend HTML removes the query token before application imports execute, stores it only in page memory, and sets a no-referrer policy before resources load. It is cleared after success or a rejected link. Refreshing the stripped URL requires reopening the email link. Vercel headers prevent caching of the reset page. No analytics or third-party resources were added.

## Migration and deployment

The SQL migration was prepared and reviewed; Prisma schema validation and client generation passed. The read-only migration-status check on October 13, 2026 showed the password-recovery migration applied to the configured Neon database. It was not applied by this implementation session. The account-email identity migration is still pending; see `EmailIdentity.md`. Do not deploy the updated backend against a database lacking these fields. After explicit migration approval, run from `backend` with the intended DATABASE_URL:

```powershell
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```

Use the same reviewed migration on a disposable/local PostgreSQL database for integration testing first. Do not use `db push` or `migrate reset`. Deploy the frontend and backend after applying the approved migration.

Existing backend variables remain required: `DATABASE_URL`, `JWT_SECRET` (32+ characters), `JWT_EXPIRES_IN` (optional, default 7d), `PORT`, `NODE_ENV`, and the Cloudinary variables already used by the application.

Shared email variables, locally and on Render:

| Variable | Local | Render |
| --- | --- | --- |
| `EMAIL_USER` | Sending Gmail address | Sending Gmail address |
| `EMAIL_APP_PASSWORD` | Gmail App Password | Secret Gmail App Password |
| `EMAIL_FROM_NAME` | Hunza Premier League | Hunza Premier League |
| `FRONTEND_URL` | `http://localhost:5173` | `https://hpl-ten.vercel.app` |
| `NODE_ENV` | `development` | `production` |

`FRONTEND_URLS`, if configured, must include the deployed frontend origin for CORS. On Vercel configure the existing `VITE_API_BASE_URL` to the Render API base **including `/api`**; new calls append `/auth/...`, so no extra `/api` prefix is introduced. Only public frontend configuration uses a VITE_ prefix.

Email setup: use the existing Gmail sender with two-step verification enabled and a Gmail App Password. Place that password in EMAIL_APP_PASSWORD, not a normal account password. Configure all four mail variables in backend environment settings and restart/redeploy. The branded email includes text and HTML versions, a Reset Password button, a 15-minute notice, and an ignore-if-unrequested notice. Verify that the hosting environment allows Gmail SMTP delivery; this was not tested against Render.

## Verification

Run offline tests from `backend` (existing backend `.env` provides import-time configuration; Prisma/database calls and SMTP delivery in these tests are mocked):

```powershell
node --test src/modules/auth/passwordReset.security.test.js
```

12 tests passed: secure hashed token generation/expiry; generic known/unknown responses and cooldown; successful password reset and all-token revocation; concurrent reuse and used-token rejection; expired/invalid/pending-token and weak-password rejection; email failure cleanup; changed-email link rejection; frontend mismatch validation; actual Login bcrypt checks for old/new credentials and JWT session revocation; registration required fields; successful existing Register bcrypt/verification-email behavior; configured Vercel reset links; HTTP email/IP throttling.

`prisma validate`, `prisma generate`, and frontend `npm.cmd run build` passed. Frontend lint completed with warnings in existing components and no errors. A broader run of `normalUser.phase1.security.test.js`, `normalUser.phase2.security.test.js`, and `normalUser.finalIntegrationQA.test.js` produced 11 passes and 6 failures in profile and routing expectations (including old profile-image editing and public-route expectations); those unrelated modules were left unchanged.

Not verified: actual email delivery, live Neon migration, real PostgreSQL lock/concurrency behavior, browser visual/accessibility review, or production end-to-end recovery. Concurrency tests use a serialized mock transaction and verify controller behavior; they do not substitute for a PostgreSQL integration test. After approval/migration, test all recovery states on staging, verify one success and one rejection for simultaneous uses of a link, and confirm revoked JWTs are denied.

## Operational limitations

- IP and normalized-email middleware limiters use process memory, following the existing architecture. The database cooldown enforces per-account email throttling across instances; distributed IP quotas require a shared limiter store for a horizontally scaled backend.
- Email work runs after the generic response in the backend process. It is not a durable queue: a process restart may lose delivery work and leave an unusable pending token until expiry. Failed attempts retain the 15-minute cooldown to prevent provider flooding.
- The initial emailed URL still reaches Vercel and exists in the user's email/browser history. Configure hosting/access-log and future analytics redaction to exclude token query strings. Application logs do not contain reset links.
- Expired/used records remain for now; add an operational retention job if volume warrants it.
- JWT revocation takes effect on subsequent authenticated requests. An already authorized in-flight request is not canceled.

Prisma transaction implementation follows the [Prisma v7 interactive transaction documentation](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions) and [parameterized raw-query guidance](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries).
