> Archived: the Team Owner, new team registration and player invitation systems are now removed. Do not follow the former deployment or migration instructions in this document. See [CompleteOwnerSystemRemoval.md](CompleteOwnerSystemRemoval.md) for current status.

# Invitation signup and automatic membership integration

The subsequent P2028 and pg concurrency root cause has now been reproduced and corrected; see [PlayerInvitationTransactionTimeout.md](PlayerInvitationTransactionTimeout.md) for measured timings, changed files and current deployment limitations.

## Root cause

Three separate gaps explained the reported empty roster and lack of confirmation:

1. The invitation signup frontend called registration and login, then stopped. Registration intentionally leaves the invitation PENDING; it does not imply acceptance. The page required another click and did not carry the explicit invitation signup action through to acceptance.
2. The owner 'Pending Invitations' panel displayed all statuses, including accepted history, and the roster had no normal manual refresh or refresh-on-return behavior.
3. The configured database still reports `20261015000000_optional_player_profile` as unapplied. Its existing NOT NULL Player DOB/gender constraints prevent creating an honest minimal Player record. This remains a deployment prerequisite, not a new migration created for this update.

## Final flow

The invitation page offers 'Accept Invitation & Create Account'. Its signup submit explicitly says 'Create Account & Join Team'. The invited-email account is created through the existing invitation registration endpoint; the existing password/JWT login authenticates it; then the frontend immediately calls the existing authenticated acceptance endpoint with the original bearer invitation token. This sequence only runs from the explicit invitation signup action. Signup is an integrated step of the existing invitation page, preserving context in memory rather than introducing another registration system.

The backend's shared database-only membership service verifies status/expiry/delivery, canonical recipient identity, token hash or legacy accepted-email proof, team eligibility and existing Player/membership ownership. The existing transaction and Team/User locks enclose the operation; the service locks Player before linking it. Conditional token consumption, Player creation/linking, ACTIVE membership, server joined date, mailbox verification and audit commit atomically. Existing data and privileged roles remain intact. Optional DOB/gender/position fields do not block membership. Inactive historical memberships remain subject to administrative restoration. Competition and match eligibility checks remain separate.

After commit, both existing-user acceptance and new-user signup redirect to `/player` with:

> Welcome to [Team Name]! You are now a member of this team.

The My Team section shows logo, name, ACTIVE membership and joined date; optional profile editing and normal public HPL navigation remain. Refreshing the auth context exposes the existing player capability without replacing the User role. The existing notification schema/controller were inspected; this update uses a success banner and authoritative My Team membership data rather than introducing a second notification system.

Normal Signup and Login do not inspect or accept pending invitations. An account created independently can still use the original delivered, valid invitation link to explicitly accept later. If signup succeeds but activation fails, the account survives, the invitation transaction rolls back, and the user can retry acceptance using that same link. Duplicate/concurrent acceptance cannot create additional memberships.

## Owner and admin interfaces

Owner roster refreshes on mount, window focus and return to a visible tab. A Refresh Roster action reloads both roster and invitations. Membership counts and desktop/mobile roster views show server data; mobile cards now include joined date. Jersey assignment remains available afterward.

Invitation list accepts validated `view=PENDING` or `view=HISTORY`. PENDING returns only unexpired invitations still waiting for acceptance. Accepted, declined, revoked and expired invitations appear in separately paginated history; old accepted continuations appear there as 'Accepted / ready to join'. Pending resend/revoke controls remain. Existing admin ACTIVE roster/count queries already include minimally populated Player records and are covered by tests.

Status transition: PENDING -> ACCEPTED and TeamPlayer ACTIVE in one commit. Account creation by itself leaves PENDING. Existing ACCEPTED_PENDING_PROFILE records retain their explicit, authenticated no-profile Join Team continuation; no old invitation was automatically accepted or modified.

## Files changed in this update

- backend/src/services/playerInvitationMembership.service.js: extracted shared activation service and team eligibility checks.
- backend/src/modules/playerInvitations/playerInvitation.controller.js: calls the service, returns team-specific success confirmation, adds server-side pending/history views and includes team logo in own membership projection.
- backend/src/modules/playerInvitations/playerInvitation.validation.js: validates list view.
- backend/src/modules/playerInvitations/playerInvitation.integration.test.js: HTTP integration regression coverage using the frontend signup orchestration and actual existing login/controller/middleware.
- frontend/src/features/playerInvitations/services/invitationOnboarding.js: explicit signup -> login -> acceptance orchestration.
- frontend/src/features/playerInvitations/pages/PlayerInvitationAcceptancePage.jsx: automatic finalization after explicit invitation signup, confirmation redirect and retry-preserving error handling.
- frontend/src/features/playerInvitations/pages/MyPlayerPage.jsx: welcome banner and team logo/membership status.
- frontend/src/features/playerInvitations/components/TeamInvitations.jsx: separate pending/history views and refresh-on-return.
- frontend/src/features/teamOwner/pages/TeamOwnerWorkflowPages.jsx: manual/focus roster refresh, counts and mobile joined date.
- docs/PlayerInvitationRegistrationIntegration.md; reference update in docs/PlayerMembershipActivation.md.

No schema change or migration execution was performed in this update. Earlier changes remain in the worktree.

## Validation and remaining deployment work

106 backend tests passed: 48 invitation tests and 58 related auth/email/password recovery, owner/admin, player, squad and registration tests. Four new tests cover the full HTTP registration/password-JWT-login/acceptance sequence, owner/admin/My Team visibility, missing consent/token rejection before signup, activation rollback with safe retry, and normal Signup/Login remaining unlinked until explicit invitation acceptance. The HTTP flow uses mocked database transactions and SMTP, not a real PostgreSQL write or email delivery.

Frontend production build and targeted lint passed. Diff whitespace check passed. Prisma migrate status was read-only: 20 migrations found, optional-player-profile migration still pending. No database reset, production migration, deletion, guessed profile data or automatic acceptance of old records occurred.

**Before deploying the new minimal-profile flow, obtain explicit production approval and apply the already-prepared optional-player-profile migration through the documented deployment process in PlayerMembershipActivation.md.** Without it, real new membership creation can still fail despite the corrected registration integration. No live email/browser end-to-end test was claimed or executed. Existing P2028 operation/timing diagnostics remain available; its previously reported runtime cause is still unconfirmed.
