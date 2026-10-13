import test from "node:test";
import assert from "node:assert/strict";
import { fixture, response } from "./playerInvitation.testSupport.js";

test("invitation creation and resend expose Boolean lock results instead of PostgreSQL void", async () => {
  const f = await fixture();
  const transaction = f.db.$transaction;
  let inTransaction = false;
  const locks = [];
  f.db.$transaction = callback => transaction(async tx => {
    inTransaction = true;
    try { return await callback(tx); } finally { inTransaction = false; }
  });
  // Model the adapter failure that the old bare SELECT triggered. The previous
  // controller catches it after returning 202, so assert persistence and delivery too.
  const originalRaw = f.db.$queryRaw;
  f.db.$queryRaw = async (strings, ...values) => {
    const sql = strings.join("?");
    assert.equal(inTransaction, true, "row and advisory locks must remain inside the transaction");
    if (!sql.includes("pg_advisory_xact_lock")) return originalRaw(strings, ...values);
    if (!/SELECT pg_advisory_xact_lock\(hashtextextended\(\?, 0\)\) IS NULL AS locked/.test(sql)) {
      throw Object.assign(new Error("Failed to deserialize column of type 'void'"), { code: "P2010" });
    }
    locks.push(values[0]);
    return [{ locked: false }]; // Only acquisition matters; the result is deliberately unused.
  };

  const sent = await f.send("mian.talha+invite@gmail.com");
  assert.equal(sent.statusCode, 202);
  assert.equal(f.state.invitations.length, 1);
  assert.equal(f.mail.length, 1);
  assert.ok(f.state.invitations[0].delivered_at);
  assert.equal(f.state.audits.length, 1);
  assert.equal(f.mail[0].invited_email, "mian.talha@gmail.com");

  await f.send("miantalha@gmail.com");
  assert.equal(f.state.invitations.length, 1);
  assert.equal(f.mail.length, 1, "canonical duplicate prevention is preserved");

  const oldHash = f.state.invitations[0].token_hash;
  f.state.invitations[0].last_sent_at = new Date(Date.now() - 16 * 60 * 1000);
  const resent = response();
  await f.controllers.resendPlayerInvitation({ user: f.owner(), params: { invitation_id: 1 } }, resent);
  assert.equal(resent.statusCode, 200);
  assert.equal(f.mail.length, 2);
  assert.notEqual(f.state.invitations[0].token_hash, oldHash);
  assert.ok(f.state.invitations[0].delivered_at);
  assert.deepEqual(locks, Array(3).fill("miantalha@gmail.com"));
});
