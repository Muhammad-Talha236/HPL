> Archived: the Team Owner, new team registration and player invitation systems are now removed. Do not follow the former deployment or migration instructions in this document. See [CompleteOwnerSystemRemoval.md](CompleteOwnerSystemRemoval.md) for current status.

# Player invitation transaction timeout and PostgreSQL overlap fix

## Confirmed cause and location

The old acceptance path used the default 5,000ms interactive transaction budget. It first locked Team, then loaded Team with Club/registration_request, reloaded the invitation with the same nested Team relations and Player, locked User, and reloaded User with Player. These Prisma relation reads expanded into numerous SQL requests against the remote PostgreSQL database. Awaiting one Prisma call did not prevent its internal relation fan-out from submitting overlapping queries to the adapter's single transaction client.

Read-only instrumentation reproduced both problems: a transaction with this old read prefix failed with P2028, and pg emitted its concurrent-client.query deprecation warning. An earlier baseline completed in 5,467ms with 14 driver queries and four overlaps; the final comparison took 6,081ms, had 14 queries/five overlaps, and expired at commit before activation writes. The overlapping relation queries were observed in PrismaPg's PgTransaction.performIO/queryRaw stack. An expired transaction can also submit rollback while a driver query is pending. The reported player.create at 5,781ms and invitation.updateMany at 5,427ms are operations encountering an already-spent transaction deadline, rather than evidence that those individual statements each took five seconds.

Problematic application locations were the old lockTeam/account helpers and repeated `tx.playerInvitation.findUnique({ include: invitationInclude })` reads in playerInvitation.controller.js, plus the separate lock/re-read and invitation consume/final-link updates in playerInvitationMembership.service.js.

All eight interactive invitation transactions now use the shared wrapper: create, resend, revoke, account registration, acceptance, decline, legacy accepted activation and optional profile editing. No nested interactive transactions, SMTP, HTTP or password hashing were found inside these callbacks. Password hashing happens before registration's transaction; SMTP is after invitation creation/resend commit. The invitation-list Promise.all runs outside a transaction through the pool. The shared database client uses one pg.Pool owned by PrismaPg; application invitation code does not call pool.connect/client.query directly. Existing direct pg audit scripts await their queries sequentially.

## Changes

- New compact lock service returns Team eligibility/ownership and User identity/linked-player snapshots in single parameterized raw queries. LEFT JOIN snapshots use `FOR UPDATE OF t` / `OF u`, retaining row locks without trying to lock nullable join rows. Player ownership/status/gender are read with its row lock in one query.
- Fresh transactional invitation reads have no nested includes; locked Team data supplies eligibility. The service rechecks the invitation and recipient before creating/linking records.
- Membership activation creates/links Player, creates/reuses ACTIVE TeamPlayer, verifies mailbox, conditionally consumes the invitation and sets player_id with one invitation update, then audits. A failed final conditional consume throws so all earlier writes roll back. Existing inactive memberships are still not silently restored.
- The transaction wrapper serializes submitted application commands and drains queued work before commit. It stops queued operations after the first database failure. Existing explicit await sequencing and advisory transaction locks are retained. Internal relation fan-out is removed from the activation path rather than relying on this application queue to serialize Prisma's internal queries.
- Development-only timing events record transaction requested/acquired, each operation/lock start/completion/failure, commit and rollback with elapsed/duration values and a random transaction correlation ID. No SQL, bound values, email, token or password is logged. P2028 details retain existing redaction.
- Invitation transactions have a scoped 10,000ms timeout and unchanged 2,000ms maxWait. This was set after reproducing the root cause and reducing round trips: remote query latency was roughly 0.37-0.52s for single statements, with additional activation writes and commit still required. Ten seconds gives reasonable headroom for sequential I/O and bounded contention. Global Prisma/pool defaults are unchanged; no automatic ambiguous-commit retry was introduced.

## Measured before and after

Same configured PostgreSQL database, read/lock transactions only:

| Measurement | Old sequence | Optimized sequence |
| --- | --- | --- |
| Total elapsed, including transaction boundaries | 6,081ms | 2,129ms |
| Driver query calls | 14 | 5 |
| Overlapping calls on one pg client | 5 | 0 |
| Outcome | P2028 | Committed |
| Team snapshot | Lock 393ms + relations 1,473ms | Locked snapshot 387ms |
| Invitation snapshot | Repeated relations 2,270ms | Invitation only 526ms |
| Account snapshot | Lock 397ms + relations 739ms | Locked snapshot 370ms |

These are acceptance **read-prefix** measurements, not a production membership write benchmark. The diagnostic intentionally runs the old sequence first, so seeing the warning during that phase demonstrates the original defect; the optimized phase records zero overlaps. Reproduce safely with `node scripts/diagnoseInvitationTransactions.js` from backend. It changes no account, profile, membership or invitation records and restores its temporary pg instrumentation before disconnecting.

## Files modified for this fix

- backend/src/modules/playerInvitations/playerInvitation.controller.js
- backend/src/services/playerInvitationMembership.service.js
- backend/src/services/playerInvitationLocks.service.js (new)
- backend/src/utils/playerInvitationTransaction.util.js
- backend/scripts/diagnoseInvitationTransactions.js (new, read-only)
- backend/src/modules/playerInvitations/playerInvitation.testSupport.js
- backend/src/modules/playerInvitations/playerInvitation.rawSql.test.js
- backend/src/modules/playerInvitations/playerInvitation.timeout.test.js (new)
- docs/PlayerInvitationTransactionTimeout.md and reference in the integration report.

No frontend, schema or migration changes were made for this fix.

## Validation and deployment limit

110 backend tests passed: 52 invitation tests plus 58 related authentication/email recovery, owner/admin, Player/TeamPlayer, squad and registration regressions. New tests cover serial execution even for mistakenly concurrent/unawaited commands, simulated remote-style sequential latency beyond five seconds, duplicate/concurrent acceptance, safe timing logs and late membership/consume/audit/commit failures. Rollback restores Player, TeamPlayer, User verification and invitation state. The existing HTTP signup/login/acceptance and owner/admin/My Team projections remain covered with database/SMTP mocks. Syntax and diff whitespace checks passed.

No production membership writes, live email send or browser end-to-end test was performed. The real database validation was read-only, so full production activation timing is not claimed.

The database still reports Player.date_of_birth and Player.gender as NOT NULL. The already-prepared optional-profile migration is a separate, confirmed prerequisite for new account-only Player creation. It was not executed: explicit production approval remains required. Fixing P2028 does not waive that schema constraint, and no fake dates/genders were inserted. Existing Player linking is unaffected by that nullability prerequisite.
