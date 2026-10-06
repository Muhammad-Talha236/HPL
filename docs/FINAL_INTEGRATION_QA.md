# HPL Normal User Portal — Final Integration QA

**Review date:** 2026-10-06  
**Scope:** Closure audit only. No visual redesign or optional product work was started.

## Final decision

**HPL core features: FREEZE**  
**UI/UX redesign: READY**

The core public, authentication, Normal User, invitation, Team Owner, Club Owner,
Super Admin, and approved referee flows are implemented and protected by backend
authorization. Feature development can be frozen while the UI is redesigned.

## Verification summary

| Area | Result |
|---|---|
| Normal User journey | Complete: public browsing, registration, login, account, profile, password, notifications, invitation acceptance/linkage, continued browsing, logout |
| Public football discovery | Complete: Home, Seasons, Clubs, Teams, Players, Competitions, Matches/live status, Standings, Rankings, News, Referees |
| Public detail pages | Complete for seasons, clubs, teams, players, competitions, matches, news, and referees |
| Men/Women mapping | Team and Competition use `MEN`/`WOMEN`; Player uses `MALE`/`FEMALE`; UI presents Men/Women |
| Role routing | USER → `/account`; TEAM_OWNER → `/team`; CLUB_OWNER → `/club`; SUPER_ADMIN → `/admin`; REFEREE retains `/referee` self-service routes |
| Public privacy | Public projections exclude owner IDs, user IDs, credentials, private contact fields, invitation tokens, and operational audit/payment details |
| Loading/error/empty states | Present on audited public, account, invitation, and portal pages |
| Live matches | Implemented through `/matches?status=live` and the LIVE filter on `/matches` |
| Backend tests | **186 passed, 0 failed** |
| Frontend lint | Pass, 0 warnings |
| Frontend production build | Pass |
| Backend syntax | Pass (`src/app.js`, `src/server.js`) |
| Prisma validation | Pass |
| `git diff --check` | Pass |
| Database migration | None required for this closure pass |

The known `prisma migrate status` schema-engine/environment issue is not a
schema validation failure and is not a blocker for UI work.

## Bugs fixed in this pass

- Added the public Clubs directory and Club detail routes.
- Added safe, active-only public Club projections with server-side search,
  gender/location filters, pagination, active team counts, upcoming matches,
  and recent results.
- Prevented private Club fields from entering public responses.
- Added regression coverage for public Club privacy and bounded queries.
- Corrected public navigation links and labels for Club discovery.
- Kept operational portal shells isolated from the public Navbar/Footer,
  including exact portal roots such as `/clubhouse` not being misclassified.
- Added/retained regression coverage for Normal User route and authorization
  boundaries.

No Favorites, Following, Push Notifications, Payment Gateway, Independent
Teams, or social/community features were added.

## Core flow audit

### Normal User

The public shell is available to unauthenticated visitors. Guest-only login
and signup routes redirect authenticated users to their role destination.
`UserAccountRoute` permits only `USER` for `/account`,
`/account/profile`, `/account/password`, and `/account/notifications`; other
roles are redirected to their operational portal. Auth state is sourced from
`/auth/me`, account/profile updates refresh the authoritative user state, and
logout clears the session and returns to the public shell.

The invitation flow supports both an existing User and a newly registered User,
keeps the role as `USER`, links the Player without exposing `user_id`, preserves
invitation history, and keeps public Player profiles safe. Invitation states
include loading, invalid/expired, unauthenticated, accepted, and failure
handling.

### Authorization

Backend authorization remains authoritative for every operational portal and
object lookup. Cross-role URL manipulation is rejected. Inactive users cannot
continue through protected flows. Team and Club owners receive only their
permitted linked-state information, while Super Admin and Referee behavior
remains separated from Normal User access.

### Public football

All public directories load backend data through feature services and expose
loading, retry/error, and empty states. Detail routes use bounded public
projections. Matches uses server-side status and competition filters; live
matches are clearly separated in the page. Public pages preserve Men/Women
filter terminology while sending the domain enum expected by the API.

## Roadmap classification

### A — Required before UI redesign

None identified. The following are functional safeguards already covered by this
pass rather than future feature work:

- Preserve public response projections and privacy regression tests.
- Preserve role guards and backend authorization during UI route refactors.
- Preserve loading/error/empty and keyboard-accessible states.
- Preserve the existing API contracts and Men/Women domain mapping.

### B — Optional after FYP core

- Favorites
- Following
- Push notifications
- Account invitation inbox
- Richer email notification templates
- Payment gateways
- Receipt storage
- Automated refunds

### C — Future major schema/product work

- Independent Teams
- Major ownership-model changes
- New social/community system

## Frontend page inventory

Status is **Functional** unless explicitly marked otherwise. All listed pages
should be included in the UI redesign; redesign means visual treatment only and
must retain the current route and API behavior.

### PUBLIC / AUTH

| Route | Purpose | Primary role | Status | Redesign |
|---|---|---|---|---|
| `/` | Public HPL home and discovery entry point | Public | Functional | Yes |
| `/seasons` | Season directory | Public | Functional | Yes |
| `/seasons/:seasonId` | Season details | Public | Functional | Yes |
| `/clubs` | Active Club directory with filters/pagination | Public | Functional | Yes |
| `/clubs/:clubId` | Club profile, teams, matches | Public | Functional | Yes |
| `/teams` | Team directory | Public | Functional | Yes |
| `/teams/:teamId` | Team details and squad | Public | Functional | Yes |
| `/players` | Player directory | Public | Functional | Yes |
| `/players/:playerId` | Player details | Public | Functional | Yes |
| `/competitions` | Competition directory | Public | Functional | Yes |
| `/competitions/:competitionId` | Competition details | Public | Functional | Yes |
| `/matches` | Fixtures, results, and live section | Public | Functional | Yes |
| `/matches?status=live` | Live match filter | Public | Functional | Yes |
| `/matches/:matchId` | Match details | Public | Functional | Yes |
| `/standings` | Competition standings | Public | Functional | Yes |
| `/rankings` | Team/player rankings | Public | Functional | Yes |
| `/news` | Public news directory | Public | Functional | Yes |
| `/news/:newsId` | News article details | Public | Functional | Yes |
| `/referees` | Public referee directory | Public | Functional | Yes |
| `/referees/rankings` | Referee rankings | Public | Functional | Yes |
| `/referees/:refereeId` | Public referee details | Public | Functional | Yes |
| `/login` | User authentication | Guest | Functional | Yes |
| `/signup` | User registration | Guest | Functional | Yes |

### NORMAL USER

| Route | Purpose | Primary role | Status | Redesign |
|---|---|---|---|---|
| `/account` | Account overview and role-aware navigation | USER | Functional | Yes |
| `/account/profile` | Edit permitted profile fields | USER | Functional | Yes |
| `/account/password` | Change password | USER | Functional | Yes |
| `/account/notifications` | Owned notification center and read state | USER | Functional | Yes |
| `/competitions/:competitionId/register` | Submit competition registration | Authenticated user | Functional | Yes |
| `/my/registrations` | List own registrations | Authenticated user | Functional | Yes |
| `/my/registrations/:registrationId` | Own registration details | Authenticated user | Functional | Yes |

### TEAM OWNER

| Route | Purpose | Primary role | Status | Redesign |
|---|---|---|---|---|
| `/team` | Team Owner dashboard | TEAM_OWNER | Functional | Yes |
| `/team/profile` | Team profile | TEAM_OWNER | Functional | Yes |
| `/team/teams/:teamId` | Owned team profile | TEAM_OWNER | Functional | Yes |
| `/team/teams/:teamId/edit` | Edit owned team | TEAM_OWNER | Functional | Yes |
| `/team/players` | Manage squad players | TEAM_OWNER | Functional | Yes |
| `/team/players/:playerId` | Owned player details | TEAM_OWNER | Functional | Yes |
| `/team/competitions` | Team competitions | TEAM_OWNER | Functional | Yes |
| `/team/registrations` | Team registrations | TEAM_OWNER | Functional | Yes |
| `/team/registrations/:registrationId` | Registration detail | TEAM_OWNER | Functional | Yes |
| `/team/matches` | Team matches | TEAM_OWNER | Functional | Yes |
| `/team/matches/:matchId` | Team match detail | TEAM_OWNER | Functional | Yes |
| `/team/payments` | Team payment submissions | TEAM_OWNER | Functional | Yes |

### CLUB OWNER

| Route | Purpose | Primary role | Status | Redesign |
|---|---|---|---|---|
| `/club` | Club Owner dashboard | CLUB_OWNER | Functional | Yes |
| `/club/profile` | Club profile | CLUB_OWNER | Functional | Yes |
| `/club/teams` | Manage Club teams | CLUB_OWNER | Functional | Yes |
| `/club/teams/new` | Create Club team | CLUB_OWNER | Functional | Yes |
| `/club/teams/:teamId` | Club team details | CLUB_OWNER | Functional | Yes |
| `/club/teams/:teamId/edit` | Edit Club team | CLUB_OWNER | Functional | Yes |
| `/club/players` | Club player directory | CLUB_OWNER | Functional | Yes |
| `/club/players/:playerId` | Club player details | CLUB_OWNER | Functional | Yes |
| `/club/competitions` | Club competitions | CLUB_OWNER | Functional | Yes |
| `/club/registrations` | Club registrations | CLUB_OWNER | Functional | Yes |
| `/club/registrations/:registrationId` | Registration detail | CLUB_OWNER | Functional | Yes |
| `/club/payments` | Club payment review | CLUB_OWNER | Functional | Yes |

### SUPER ADMIN

| Route family | Purpose | Primary role | Status | Redesign |
|---|---|---|---|---|
| `/admin` | Dashboard | SUPER_ADMIN | Functional | Yes |
| `/admin/users`, `/admin/users/:userId` | User list and detail | SUPER_ADMIN | Functional | Yes |
| `/admin/clubs`, `/admin/clubs/new`, `/admin/clubs/:clubId` | Club administration | SUPER_ADMIN | Functional | Yes |
| `/admin/teams`, `/admin/teams/new`, `/admin/teams/:teamId`, `/admin/teams/:teamId/edit` | Team administration | SUPER_ADMIN | Functional | Yes |
| `/admin/players`, `/admin/players/new`, `/admin/players/:playerId`, `/admin/players/:playerId/edit` | Player administration | SUPER_ADMIN | Functional | Yes |
| `/admin/seasons`, `/admin/seasons/new`, `/admin/seasons/:seasonId`, `/admin/seasons/:seasonId/edit` | Season administration | SUPER_ADMIN | Functional | Yes |
| `/admin/competitions`, `/admin/competitions/new`, `/admin/competitions/:competitionId`, `/admin/competitions/:competitionId/edit` | Competition administration | SUPER_ADMIN | Functional | Yes |
| `/admin/venues`, `/admin/venues/new`, `/admin/venues/:venueId`, `/admin/venues/:venueId/edit` | Venue administration | SUPER_ADMIN | Functional | Yes |
| `/admin/referees`, `/admin/referees/new`, `/admin/referees/:refereeId`, `/admin/referees/:refereeId/edit` | Referee administration | SUPER_ADMIN | Functional | Yes |
| `/admin/matches`, `/admin/matches/new`, `/admin/matches/:matchId`, `/admin/matches/:matchId/edit` | Match administration | SUPER_ADMIN | Functional | Yes |
| `/admin/news`, `/admin/news/new`, `/admin/news/:newsId`, `/admin/news/:newsId/edit` | News administration | SUPER_ADMIN | Functional | Yes |
| `/admin/audit-logs`, `/admin/audit-logs/:auditId` | Audit log review | SUPER_ADMIN | Functional | Yes |
| `/admin/registrations`, `/admin/registrations/:registrationId` | Registration administration | SUPER_ADMIN | Functional | Yes |

### INVITATION / SPECIAL FLOWS

| Route | Purpose | Primary role | Status | Redesign |
|---|---|---|---|---|
| `/invitations/player/:token` | Accept, reject, or resolve a Player invitation | Existing/new USER | Functional | Yes |
| `/referee/dashboard` | Referee self-service dashboard | REFEREE | Functional | Yes |
| `/referee/matches` | Assigned referee matches | REFEREE | Functional | Yes |
| `/referee/matches/:matchId` | Referee match workspace | REFEREE | Functional | Yes |
| Any unknown route | Safe redirect to public home or portal-local fallback | Any | Functional | Yes |

## Readiness answers

- **Can feature development be frozen?** Yes.
- **Are any core FYP flows missing?** No.
- **Are any pages still placeholders?** No core pages are placeholders.
- **Are any pages using mock football data?** No audited core public page uses
  mock football records; services call the backend APIs.
- **Are any required APIs missing?** No required core APIs were identified.
- **Is a schema change required before redesign?** No.
- **Which pages should be redesigned first?** Public shell and home first,
  followed by authentication and the public discovery/detail experience.

## Recommended redesign sequence

1. Design system foundations, tokens, typography, spacing, and accessibility primitives.
2. Public shell: Navbar, Footer, responsive navigation, and global states.
3. Authentication: Login, signup, auth loading, errors, and redirects.
4. Public Home.
5. Public football discovery: Seasons, Clubs, Teams, Players, Competitions,
   Matches/live, Standings, Rankings, News, and Referees.
6. Public detail pages.
7. Normal User Account, Profile, Password, Notifications, and registrations.
8. Team Owner portal.
9. Club Owner portal.
10. Super Admin portal.
11. Invitation acceptance and referee special states.
12. Responsive and accessibility polish at 1920, 1440, 1024, 768, and 375 widths.
13. Final integration QA and regression verification.

