> Archived: the Team Owner, new team registration and player invitation systems are now removed. Do not follow the former deployment or migration instructions in this document. See [CompleteOwnerSystemRemoval.md](CompleteOwnerSystemRemoval.md) for current status.

# Immediate invitation membership activation

For the subsequent automatic signup/login/acceptance integration, pending/history separation, latest migration status and test results, see [PlayerInvitationRegistrationIntegration.md](PlayerInvitationRegistrationIntegration.md).

This update supersedes the mandatory profile-completion lifecycle described in PlayerInvitationOnboarding.md.

## Behavior

Authenticated acceptance now consumes a delivered, unexpired PENDING invitation and creates/links an ACTIVE Player and ACTIVE TeamPlayer in one transaction. Account email matching uses the existing shared Gmail-aware email identity rules. The delivered invitation token proves mailbox ownership; email presence alone does not. Account registration remains separate from explicit acceptance and uses the existing bcrypt policy. Existing passwords, User roles and player details are preserved. No privileged role is replaced with PLAYER; the existing User.player association supplies player capability.

New Player records take the authenticated account's real name. Unknown date of birth, gender and playing position remain null, with profile_completed_at unset. No guessed dates or demographic data are inserted. Joined date comes from the server and jersey number starts null. Existing active membership is reused without changing its joined date or jersey. Inactive historical membership requires the established administrative restoration flow. Existing known gender conflicts and inactive players still block acceptance; unknown optional fields do not.

Team/User/Player row locks, sender recipient advisory locks, conditional token consumption and unique database identities remain. Audit failure rolls back Player, membership, email verification and token state together. Email sending remains outside transactions, with failed delivery revoked/undelivered. No transaction timeout was raised.

After acceptance the frontend redirects to `/player`, showing active teams immediately. Owner and Super Admin roster queries count ACTIVE records regardless of profile_completed_at. Pending invitations create no new confirmed records. Profile editing is optional, uses `PUT /api/player-invitations/me/profile`, validates existing HPL personal fields and updates only the authenticated Player. It does not mutate User identity or membership dates/jerseys. Current active-team gender eligibility is checked before profile changes. Players can skip this editor entirely when joining; competition and match participation still require the separately applicable DOB/gender/position eligibility data.

Previously accepted ACCEPTED_PENDING_PROFILE tickets can be continued through `POST /api/player-invitations/me/invitations/:invitation_id/activate` with no profile form. This checks the authenticated recipient, verified mailbox, exact accepted email snapshot, delivery, expiry and team eligibility. Their UI label is 'Accepted / ready to join' with a Join Team button. New acceptance never produces that legacy state. Expired unfinished tickets can be superseded through a fresh invitation; pending resend/revoke remains available.

## Schema and deployment

Player.date_of_birth and Player.gender must become nullable: their previous NOT NULL constraints prevent honest account-only membership creation. Prepared migration:

`backend/prisma/migrations/20261015000000_optional_player_profile/migration.sql`

It only drops these two NOT NULL constraints. It does not update/delete existing records, change account identities or remove profile completion metadata. **It has not been executed by the agent. Production approval is required before applying it. The new acceptance flow requires these constraints relaxed before deployment.** Prisma schema validation and local client generation passed; client generation does not apply a migration.

Latest read-only audit found 217 Players, 217 ACTIVE memberships, 11 invitations, zero open invitation-key collisions, and no profiles currently missing competition eligibility. 202 legacy gender labels remain unchanged. The audit now reports missing eligibility data as informational because an incomplete profile is a valid active member.

After approval, use the established migration deployment process from backend, then restart/deploy the backend and frontend together:

```powershell
node scripts/auditPlayerOnboarding.js
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```

No production migration, account merge, record deletion or profile rewrite was performed.

## Files changed for this update

- backend/prisma/schema.prisma and migrations/20261015000000_optional_player_profile/migration.sql.
- backend/src/modules/playerInvitations/playerInvitation.controller.js and playerInvitation.routes.js: immediate activation, legacy continuation and optional self profile editing.
- backend/src/modules/registrations/registration.extra.controller.js; backend/src/modules/teamOwner/teamOwner.controller.js; backend/src/modules/teams/teamRegistration.controller.js; backend/src/modules/matchPlayers/matchPlayer.controller.js: retain separate competition readiness/participation eligibility for optional profiles.
- backend/src/services/playerInvitationMail.service.js: invitation copy reflects immediate acceptance activation.
- backend/scripts/auditPlayerOnboarding.js: incomplete profile data is informational rather than an onboarding audit failure.
- backend/src/modules/playerInvitations/playerInvitation.onboarding.test.js, playerInvitation.acceptance.security.test.js, playerInvitation.phaseF.security.test.js and playerInvitation.testSupport.js: new lifecycle expectations, optional edits and incomplete-profile eligibility coverage.
- frontend/src/features/playerInvitations/pages/PlayerInvitationAcceptancePage.jsx, MyPlayerPage.jsx and components/TeamInvitations.jsx: dashboard redirect, optional editor, legacy continuation and updated labels/copy.
- frontend/src/features/admin/components/PlayerMembershipModal.jsx: unknown gender no longer defaults to WOMEN during manual team assignment. Existing membership jersey editing remains available.
- docs/PlayerMembershipActivation.md and supersession notice in docs/PlayerInvitationOnboarding.md.

Earlier layout, invitation implementation and P2010/P2028 diagnostic changes remain in the worktree; they were not reverted.

## Validation

102 backend tests passed: 44 invitation tests and 58 related email identity, password reset, owner, admin, Player/TeamPlayer, squad and registration regression tests. Coverage includes existing/new recipients, incomplete profiles, immediate owner/admin roster visibility, server joined date, optional edits, legacy continuation, expired/revoked/undelivered tickets, wrong accounts, duplicates, concurrent token reuse, legacy profile linking and rollback. Actual HTTP authentication/validation is exercised with mocked database/SMTP dependencies; database concurrency fixtures serialize transactions.

Frontend production build passed. Lint completed successfully with existing warnings. Prisma schema validation/client generation and diff whitespace checks passed. No browser end-to-end run, live email send or real-database membership activation was attempted because the prepared production migration remains unapplied.

The previous P2028 runtime cause remains unconfirmed; the existing safe operation/timing diagnostics are retained. Durable email delivery and shared rate-limit storage remain separate follow-up work, as documented in the original invitation handoff.
