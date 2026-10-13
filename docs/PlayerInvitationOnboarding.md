# Player invitation and membership handoff

**Superseded lifecycle:** membership now activates on authenticated invitation acceptance, without mandatory profile completion. See [PlayerMembershipActivation.md](PlayerMembershipActivation.md) for current behavior, schema prerequisites and validation. The remainder of this document records the original implementation.

Implemented email-only owner invitations using the existing authentication, mail transport, Player and TeamPlayer modules. Previously, invitations required an already-created roster player and acceptance immediately linked that record. Owners can now invite a mailbox without creating a placeholder player or confirmed membership.

## Lifecycle and authorization

- PENDING: seven-day invitation; no new Player or TeamPlayer record.
- ACCEPTED_PENDING_PROFILE: authenticated recipient has proved mailbox possession; profile still needs completion.
- ACCEPTED: valid profile and ACTIVE membership committed atomically. Backend supplies joined_at; jersey starts empty.
- DECLINED, REVOKED and EXPIRED: cannot activate membership.

Tokens contain 256 random bits; only SHA-256 hashes are stored. Delivered tokens are required for preview, registration, acceptance and decline. Resend rotates the token. Acceptance checks the canonical email identity; activation also checks the exact accepted stored-email snapshot. Account passwords, operational roles and existing player details are preserved. A Player association grants player capability without replacing an owner/admin role.

Team ownership, active team/club state, provisional deadlines, recipient locks and conditional state transitions are enforced server-side. Direct owner roster creation and the owner eligible-player search endpoint were removed. Super Admin maintenance remains available. Inactive memberships require administrative restoration; invitations cannot restore them. Staff can explicitly bind an existing unlinked legacy roster profile, without guessing or merging identities.

Required new profile fields reuse HPL validation: name, date of birth, gender and playing position. Existing profiles are retained. Shared gender comparison accepts MEN/MALE and WOMEN/FEMALE without changing stored data. Pending invitations never contribute to confirmed roster counts, competition squads or match lineups.

## API and frontend

All API paths below are under `/api/player-invitations`:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | / | Authorized sender: team_id and invited_email; generic 202 response |
| GET | / | Scoped, paginated invitation history |
| POST | /:invitation_id/resend | Rotate and resend pending invitation |
| POST | /:invitation_id/revoke | Revoke pending invitation/profile continuation |
| GET | /accept/:token | Safe public preview: team, masked email, expiry |
| POST | /accept/:token/register | Create invited account using existing password policy |
| POST | /accept/:token | Authenticated mailbox-matched acceptance |
| POST | /accept/:token/decline | Decline with mailbox token, no account required |
| GET | /me/invitations | Own accepted invitations; pending only for verified mailbox |
| GET | /me/profile | Own profile, active teams and bounded competition/match activity |
| POST | /me/invitations/:invitation_id/profile | Validate profile and activate membership |

Frontend routes: `/player-invitation?token=...`, legacy `/invitations/player/:token`, `/player`, `/player/profile`, `/player/invitations`. Existing/new account choice, sign-in continuation, account switching, decline and profile completion are integrated. Owner roster includes an email invitation modal and separate history with resend/revoke. Navbar exposes player profile/invitations.

Sender responses precede recipient-dependent lookup and SMTP. Registered recipients receive mail at the account's stored address, using the shared Gmail-aware email lookup utility. No account existence is disclosed by the sender response. Mailbox-token possession verifies ownership; database email presence alone does not. Send limits include 10 requests per actor per 15 minutes, existing token/IP limiters, and a database-backed 15-minute canonical-recipient cooldown across teams. History and responses omit hashes and account secrets.

## Schema, audit and migration status

Migration: `backend/prisma/migrations/20261014000000_invitation_onboarding/migration.sql`. Adds Player.profile_completed_at; makes invitation.player_id optional; adds generated invited_email_key, accepted_user_id, accepted_email_snapshot, delivered_at and last_sent_at. A partial unique index enforces one open invitation per team/canonical mailbox. Existing Player completion dates and invitation delivery metadata are backfilled; historical accepted links are retained. Collision guard aborts before changes. No accounts, players or memberships are deleted, merged, demoted or renamed.

Latest read-only audit: 217 Players, 217 ACTIVE memberships, 10 invitations, zero incomplete legacy profiles, zero open invitation-key collisions. 202 profiles use legacy gender labels and remain unchanged. `npx.cmd prisma migrate status` reports all 19 migrations applied and schema up to date. The agent did not execute the migration; the connected database changed between earlier and final status checks.

For another environment, obtain explicit production approval before deployment, then run from backend:

```powershell
node scripts/auditPlayerOnboarding.js
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```

Resolve any reported collisions manually first. Never use db push/reset or guess original email addresses. Deploy backend/frontend together after schema availability. Restart backend after client generation. Existing email identity migrations and `hpl_email_lookup_key` function are prerequisites.

Mail uses existing EMAIL_USER, EMAIL_APP_PASSWORD, EMAIL_FROM_NAME and FRONTEND_URL. Production frontend origin must use HTTPS, e.g. https://hpl-ten.vercel.app; frontend API configuration retains its /api base. No new mail provider or duplicate authentication system was introduced.

## Changed implementation files

- Schema/migration and read-only audit: backend/prisma/schema.prisma, backend/prisma/migrations/20261014000000_invitation_onboarding/migration.sql, backend/scripts/auditPlayerOnboarding.js.
- Invitation controller/routes/validation and six test suites plus shared testSupport under backend/src/modules/playerInvitations.
- backend/src/services/playerInvitationMail.service.js; backend/src/utils/playerInvitationToken.util.js, playerRegistration.util.js and playerEligibility.util.js.
- backend/src/constants/auditActions.js; backend/src/middleware/auth/rateLimit.middleware.js; backend/src/modules/auth/auth.controller.js.
- Existing player creation, TeamPlayer controller/routes/validation, Team Owner controller/routes, registration controller/extra controller, team admin/readiness controllers and matchPlayers controller. Owner workflow test updated for the removed direct-add bypass.
- frontend/src/features/playerInvitations/components/TeamInvitations.jsx, PlayerInvitationManager.jsx; pages/PlayerInvitationAcceptancePage.jsx and MyPlayerPage.jsx.
- frontend/src/features/teamOwner/pages/TeamOwnerWorkflowPages.jsx; frontend/src/App.jsx; frontend/src/components/navigation/Navbar.jsx; frontend/index.html; frontend/vercel.json.

Earlier Team Owner layout edits remain in the worktree and are documented separately in TeamOwnerLayout.md.

## Validation and limitations

37 invitation tests pass. A separate 58-test regression batch passes: email identity/password reset, player/TeamPlayer security, team ownership/workflows, squad selection, registration workflow and admin teams. Includes actual HTTP middleware/validation and actual owner/admin roster and squad/lineup exclusion controllers, mocked database transactions and mail. Concurrent acceptance, activation, registration and legacy player linking are covered with serialized transaction fixtures. Prisma schema validation, frontend production build and diff whitespace checks pass. Frontend lint exits successfully with existing warnings.

An earlier broader Team Owner run exposed four unrelated existing failures in competition eligibility fixtures and a legacy route fallback assertion. These were not hidden or resolved by changing unrelated behavior.

No live SMTP delivery, browser end-to-end test, real PostgreSQL concurrency test or migration execution was performed. SMTP is asynchronous in-process after the response, so a process crash can lose delivery; a durable outbox worker is the recommended next step. Failed delivery leaves the token unusable. Express rate-limit counters are process-local; database recipient cooldown remains shared. Invitation URL tokens can reach hosting access logs before client stripping: configure log redaction. The minimal player portal shows profile/team/competition/match activity; existing profile corrections continue through established administrative workflows.
