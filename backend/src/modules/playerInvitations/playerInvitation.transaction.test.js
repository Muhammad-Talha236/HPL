import test from "node:test";
import assert from "node:assert/strict";
import { fixture, response } from "./playerInvitation.testSupport.js";
import { createPlayerInvitationControllers } from "./playerInvitation.controller.js";

test("successful sends commit before SMTP and duplicates end without unnecessary membership queries", async () => {
  const f = await fixture();
  let inTransaction = false, mailCount = 0, membershipReads = 0;
  const transaction = f.db.$transaction;
  f.db.$transaction = callback => transaction(async tx => {
    assert.equal(inTransaction, false, "transactions must not nest");
    inTransaction = true;
    try { return await callback(tx); } finally { inTransaction = false; }
  });
  const findFirst = f.db.teamPlayer.findFirst;
  f.db.teamPlayer.findFirst = (...args) => { membershipReads++; return findFirst(...args); };
  const controllers = createPlayerInvitationControllers(f.db, async () => {
    assert.equal(inTransaction, false, "SMTP must run after transaction completion");
    assert.equal(f.state.audits.length, 1);
    mailCount++;
  });
  const send = async email => {
    const res = response();
    await controllers.createPlayerInvitation({ user: f.owner(), body: { team_id: 1, invited_email: email } }, res);
    return res;
  };
  assert.equal((await send("mian.talha@gmail.com")).statusCode, 202);
  assert.equal((await send("miantalha+duplicate@gmail.com")).statusCode, 202);
  assert.equal(membershipReads, 1);
  assert.equal(mailCount, 1);
  assert.equal(f.state.invitations.length, 1);
  assert.ok(f.state.invitations[0].delivered_at);
});

test("P2028 identifies failing database operation, rolls back creation and logs redacted development details", async () => {
  const f = await fixture();
  const env = process.env.NODE_ENV, originalLog = console.error;
  const logs = [];
  process.env.NODE_ENV = "development";
  console.error = (...args) => logs.push(args);
  const error = Object.assign(new Error("Sensitive invocation source\nTransaction API error: Transaction already closed: timeout reached."), {
    code: "P2028", meta: { error: "Transaction expired. owner@example.com https://example.com?token=secret " + "a".repeat(43), password: "do-not-log" },
  });
  f.db.auditLog.create = async () => { throw error; };
  try {
    const res = await f.send();
    assert.equal(res.statusCode, 202, "recipient privacy response stays generic");
    assert.equal(f.state.invitations.length, 0);
    assert.equal(f.state.audits.length, 0);
    assert.equal(f.mail.length, 0);
    const details = logs[0][1];
    assert.equal(details.code, "P2028");
    assert.equal(details.operation, "auditLog.create");
    assert.equal(typeof details.elapsedMs, "number");
    assert.match(details.message, /Transaction already closed/);
    const output = JSON.stringify(logs);
    for (const secret of ["Sensitive invocation source", "owner@example.com", "https://example.com", "a".repeat(43), "do-not-log"]) assert.equal(output.includes(secret), false);
  } finally {
    console.error = originalLog;
    if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env;
  }
});

test("email failure after commit revokes the undelivered invitation", async () => {
  const f = await fixture({ failMail: true });
  await f.send();
  assert.equal(f.state.invitations.length, 1);
  assert.equal(f.state.invitations[0].status, "REVOKED");
  assert.equal(f.state.invitations[0].delivered_at, null);
});
