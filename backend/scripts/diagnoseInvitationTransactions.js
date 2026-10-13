import "dotenv/config";
import pg from "pg";
import prisma from "../src/database/prisma.js";
import { lockInvitationTeam, lockInvitationAccount } from "../src/services/playerInvitationLocks.service.js";
import { invitationTransaction } from "../src/utils/playerInvitationTransaction.util.js";

// Read-only diagnostic: no account, Player, membership or invitation mutations.
// Do not print SQL, parameter values, tokens, account records or database URLs.
const originalQuery = pg.Client.prototype.query;
const active = new WeakMap();
let queryCount = 0, overlappingDriverQueries = 0;
pg.Client.prototype.query = function (...args) {
  const count = active.get(this) || 0;
  queryCount++;
  if (count) overlappingDriverQueries++;
  active.set(this, count + 1);
  const done = () => active.set(this, (active.get(this) || 1) - 1);
  const callbackIndex = args.findIndex(value => typeof value === "function");
  if (callbackIndex >= 0) {
    const callback = args[callbackIndex];
    args[callbackIndex] = (...values) => { done(); return callback(...values); };
  }
  try {
    const result = originalQuery.apply(this, args);
    return callbackIndex < 0 && result?.finally ? result.finally(done) : result;
  } catch (error) { done(); throw error; }
};

async function measure(label, execute) {
  queryCount = 0; overlappingDriverQueries = 0;
  const start = Date.now(), operations = [];
  const run = async (name, fn) => {
    const operationStart = Date.now();
    try { return await fn(); }
    finally { operations.push({ operation: name, durationMs: Date.now() - operationStart }); }
  };
  let errorCode;
  try { await execute(run); } catch (error) { errorCode = error.code || "DIAGNOSTIC_FAILED"; }
  console.log(JSON.stringify({ label, elapsedMs: Date.now() - start, queryCount, overlappingDriverQueries, operations, ...(errorCode ? { errorCode } : {}) }, null, 2));
  return errorCode;
}

try {
  const i = await prisma.playerInvitation.findFirst({ where: { team_id: { not: null } }, select: { invitation_id: true, team_id: true, invited_by_user_id: true } });
  if (!i) throw new Error("NO_TEAM_INVITATION");
  await measure("old acceptance read prefix (default 5s timeout)", run => prisma.$transaction(async tx => {
    await run("team lock", () => tx.$queryRaw`SELECT team_id FROM "Team" WHERE team_id=${i.team_id} FOR UPDATE`);
    await run("team and relations", () => tx.team.findUnique({ where: { team_id: i.team_id }, include: { club: true, registration_request: true } }));
    await run("invitation and repeated relations", () => tx.playerInvitation.findUnique({ where: { invitation_id: i.invitation_id }, include: { team: { include: { club: true, registration_request: true } }, player: true } }));
    await run("user lock", () => tx.$queryRaw`SELECT user_id FROM "User" WHERE user_id=${i.invited_by_user_id} FOR UPDATE`);
    await run("user and player", () => tx.user.findUnique({ where: { user_id: i.invited_by_user_id }, include: { player: true } }));
  }));
  const failure = await measure("optimized acceptance read prefix (scoped 10s budget)", run => invitationTransaction(prisma, async tx => {
    await run("locked team snapshot", () => lockInvitationTeam(tx, i.team_id));
    await run("invitation only", () => tx.playerInvitation.findUnique({ where: { invitation_id: i.invitation_id } }));
    await run("locked account snapshot", () => lockInvitationAccount(tx, i.invited_by_user_id));
  }));
  if (failure) process.exitCode = 1;
} catch {
  console.error("Read-only invitation diagnostic failed; check database connectivity and available team invitations.");
  process.exitCode = 1;
} finally {
  pg.Client.prototype.query = originalQuery;
  await prisma.$disconnect();
}
