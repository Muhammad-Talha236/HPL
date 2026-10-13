> Archived: the Team Owner, new team registration and player invitation systems are now removed. Do not follow the former deployment or migration instructions in this document. See [CompleteOwnerSystemRemoval.md](CompleteOwnerSystemRemoval.md) for current status.

# Removal of new team registration applications

The independent-team submission/resubmission and initial application approval implementation is removed. No replacement registration flow was added. Existing general Team management, Club management and competition registration are separate features and remain available.

## Deleted files

1. backend/src/modules/teams/teamRegistration.controller.js
2. backend/src/modules/teams/teamRegistration.validation.js
3. backend/src/modules/teams/teamRegistration.admin.controller.js
4. backend/src/modules/teams/teamRegistration.admin.validation.js
5. backend/src/modules/teams/team.independent.security.test.js
6. backend/src/modules/teams/team.independent.creation.security.test.js
7. frontend/src/features/teams/pages/IndependentTeamRegistrationPage.jsx
8. frontend/src/features/teams/services/independentTeamRegistrationService.js
9. frontend/src/features/admin/pages/AdminTeamRegistrationRequestsPage.jsx

The two deleted controller files contained shared verification/readiness logic. Those portions were extracted unchanged in purpose into the retained existing-team verification modules below before deletion. Only submission, resubmission, pending-list initial approval, request-changes and rejection implementation was removed.

## Modified files

- backend/src/modules/teams/team.routes.js: removed independent application endpoints/imports.
- backend/src/modules/admin/admin.routes.js: removed pending application listing and initial review actions; rewired retained historical/final verification handlers.
- backend/src/modules/teamOwner/teamOwner.controller.js: readiness imports the extracted shared service.
- backend/src/modules/auth/auth.controller.js: email verification copy no longer directs users to the removed team application flow. Signup, password hashing, email verification and JWT logic remain unchanged.
- backend/src/modules/media/media.controller.js and media.routes.js: removed only own-team-logo helpers and endpoints used exclusively by the removed signup form.
- frontend/src/App.jsx: removed registration page imports and routes.
- frontend/src/components/navigation/Navbar.jsx: removed desktop/mobile Register Team actions; account, player and portal navigation remains.
- frontend/src/features/account/pages/NormalUserProfilePage.jsx: removed the independent team registration promotion card.
- frontend/src/features/admin/components/AdminSidebar.jsx: removed pending application menu/badge and its API request.
- frontend/src/layouts/admin/adminNavigation.js: removed Team Applications entry.
- frontend/src/features/media/services/mediaService.js: removed exclusively application-owned team-logo API functions; common upload/library/attachment functions remain.
- docs/08_NormalTeamRegistrationFlow.md: marked the former flow archived.
- docs/TeamRegistrationRemoval.md: this handoff.

## New files containing extracted code and regression checks

- backend/src/modules/teams/teamVerification.service.js: existing squad readiness and historical verification/status constants.
- backend/src/modules/teams/teamVerification.admin.controller.js: existing final verification, provisional deadline expiry and historical detail access, without new team creation or initial approval.
- backend/src/modules/teams/teamVerification.admin.validation.js: shared historical verification request ID validation only.
- backend/src/modules/teams/teamRegistration.removal.test.js: verifies removal boundaries and preserved functionality.

## Removed routes/endpoints

Frontend:

- /teams/register-independent
- /admin/team-registration-requests

Backend:

- POST /api/teams/independent
- GET /api/teams/independent/my
- PATCH /api/teams/independent/:request_id
- GET /api/admin/team-registration-requests
- PATCH /api/admin/team-registration-requests/:request_id/provisionally-approve
- PATCH /api/admin/team-registration-requests/:request_id/request-changes
- PATCH /api/admin/team-registration-requests/:request_id/reject
- GET /api/media/team-logo
- POST /api/media/team-logo/upload-signature
- POST /api/media/team-logo

Former page routes fall through the existing application route handling; no redirects point users to them. Removed backend application endpoints return 404. No silent redirection to a replacement registration process was introduced.

## Explicitly preserved shared functionality

Public Teams/Team Profile components, shared Team models/controllers/validators, existing general Team creation/edit/lifecycle management, media pickers/library/profile uploads, account/profile forms, auth/recovery, Club modules, Team Owner layout/dashboard/profile/players/invitations/competitions/matches/payments, Super Admin Team management, notifications, seasons/live matches/standings and competition registration/payment APIs remain.

The admin dashboard's `recent_team_registrations` widget is populated by CompetitionRegistration, not new-team application submissions; it was intentionally preserved. Historical TEAM_APPLICATION audit constants remain because audit-log validation uses them to retrieve existing records.

Existing teams may still have provisional verification deadlines and historical registration review records. To preserve the requested shared Team verification behavior, these original administrator-only API paths remain, with extracted handlers:

- GET /api/admin/team-registration-requests/:request_id — read historical details and readiness.
- PATCH /api/admin/team-registration-requests/:request_id/verify — final verification for an already-linked provisional Team.
- POST /api/admin/team-registration-requests/expire-overdue — existing provisional Team verification deadline lifecycle.

They cannot submit or initially approve new team applications. Their names are retained for compatibility; no new endpoints or verification feature was introduced. The removed pending-applications page and badge do not return. Final verification explicitly rejects an unlinked PENDING request.

## Database and dependency confirmation

Prisma schema and migration files were not changed by this removal. No database writes, production migration, table/column drop, reset, record deletion, invitation acceptance or status backfill was executed. All User/Team/Player/TeamPlayer/PlayerInvitation, TeamRegistrationRequest/Review, CompetitionRegistration and historical approval records remain. Earlier uncommitted schema changes from invitation work were not reverted or applied.

No package dependency was exclusive to this flow; React Router, validators, media utilities and existing mail/database packages are shared and retained. No new dependency was introduced. Retained Team verification/history reads necessarily still refer to the historical tables and records.

## Validation

- Frontend production build passed; targeted lint passed.
- Backend server started on an isolated ephemeral port and returned the successful HTTP health response. It was stopped after the check; no existing user server was disturbed.
- 138 backend tests passed, including five new removal checks, all 52 invitation tests, auth/email identity/password recovery, public Team/profile HTTP responses, owner/admin workflows, squad/competition registration, competitions, live match/realtime, matches, notifications, admin dashboard and Club Owner behavior.
- Removed application routes were exercised over HTTP; retained historical verification still requires authentication and refuses initial application approval.
- Source search found no removed page/service/controller imports or old Register Team links. Entire frontend build and actual backend startup additionally validate import wiring. Diff whitespace check passed.

Database-backed behavior in these regression tests uses mocks. No live SMTP delivery, browser end-to-end portal navigation or full production database workflow was performed. Public pages/portal bundles compiled; their controllers and routes were tested as described, not visually browser-tested. No changes were pushed or deployed.
