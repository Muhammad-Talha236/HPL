import test from "node:test";
import assert from "node:assert/strict";
import { fixture, clone } from "./playerInvitation.testSupport.js";
import { invitationTransaction, INVITATION_TRANSACTION_OPTIONS } from "../../utils/playerInvitationTransaction.util.js";

test("the transaction client serializes concurrent and unawaited commands before commit", async () => {
  let active = 0, maximum = 0, committed = false;
  const executed = [];
  const db = { $transaction: async (callback, options) => {
    assert.deepEqual(options, { maxWait: 2000, timeout: 10000 });
    const result = await callback({ player: { findUnique: async ({ id }) => {
      active++; maximum = Math.max(maximum, active);
      await new Promise(resolve => setImmediate(resolve));
      executed.push(id); active--; return id;
    } } });
    assert.equal(active, 0); committed = true; return result;
  } };
  await invitationTransaction(db, async tx => {
    assert.deepEqual(await Promise.all([tx.player.findUnique({ id: 1 }), tx.player.findUnique({ id: 2 })]), [1, 2]);
    void tx.player.findUnique({ id: 3 });
  });
  assert.equal(maximum, 1); assert.equal(committed, true); assert.deepEqual(executed, [1, 2, 3]);
});

test("sequential remote-style latency beyond five seconds uses the measured scoped budget and activates only once", async t => {
  const f = await fixture(); await f.send();
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  let steps = 0;
  const advance = implementation => async (...args) => { steps++; t.mock.timers.tick(650); return implementation(...args); };
  for (const [model, methods] of Object.entries(f.db)) {
    if (model === "$queryRaw") f.db[model] = advance(methods);
    else if (!model.startsWith("$")) for (const [name, implementation] of Object.entries(methods)) methods[name] = advance(implementation);
  }
  const transaction = f.db.$transaction;
  f.db.$transaction = (callback, options) => transaction(async tx => {
    const start = Date.now(); const result = await callback(tx);
    if (Date.now() - start > options.timeout) throw Object.assign(new Error("Transaction expired"), { code: "P2028" });
    return result;
  });
  const result = await f.accept();
  assert.equal(result.statusCode, 200); assert.ok(steps * 650 > 5000);
  assert.equal(f.state.invitations[0].status, "ACCEPTED"); assert.equal(f.state.memberships.length, 2);
  assert.equal((await f.accept()).statusCode, 409); assert.equal(f.state.memberships.length, 2);
  assert.equal(INVITATION_TRANSACTION_OPTIONS.timeout, 10000);
});

test("late activation failures roll back Player, TeamPlayer, verification and invitation changes", async () => {
  for (const stage of ["membership", "consume", "audit", "commit"]) {
    const f = await fixture(); await f.send(); const before = clone(f.state);
    const expired = () => { throw Object.assign(new Error("Expired transaction"), { code: "P2028" }); };
    if (stage === "membership") f.db.teamPlayer.create = expired;
    if (stage === "consume") {
      const update = f.db.playerInvitation.updateMany;
      f.db.playerInvitation.updateMany = args => args.data.status === "ACCEPTED" ? { count: 0 } : update(args);
    }
    if (stage === "audit") f.db.auditLog.create = expired;
    if (stage === "commit") {
      const transaction = f.db.$transaction;
      f.db.$transaction = callback => transaction(async tx => { await callback(tx); expired(); });
    }
    const result = await f.accept();
    assert.equal(result.statusCode, stage === "consume" ? 409 : 503);
    assert.deepEqual(f.state, before, stage);
  }
});

test("development timing logs include acquisition, commands and commit without parameters", async () => {
  const env = process.env.NODE_ENV, info = console.info;
  const logs = []; process.env.NODE_ENV = "development"; console.info = (...args) => logs.push(args);
  try {
    await invitationTransaction({ $transaction: async callback => callback({ user: { findUnique: async () => ({}) } }) }, async tx => {
      await tx.user.findUnique({ where: { email: "private@example.com", token: "secret-token" } });
    });
    const events = logs.map(([, e]) => `${e.operation}:${e.phase}`);
    assert.deepEqual(events, ["transaction.start:requested", "transaction.start:acquired", "user.findUnique:start", "user.findUnique:complete", "transaction.commit:start", "transaction.commit:complete"]);
    assert.ok(logs.every(([, e]) => typeof e.elapsedMs === "number" && e.transactionId));
    assert.doesNotMatch(JSON.stringify(logs), /private@example.com|secret-token/);
  } finally { console.info = info; if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env; }
});
