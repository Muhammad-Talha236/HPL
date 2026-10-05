import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { createPlayerInvitation, resendPlayerInvitation } from "./playerInvitation.controller.js";
import { buildPlayerInvitationEmail, resetPlayerInvitationMailTransportFactoryForTests, setPlayerInvitationMailTransportFactoryForTests } from "../../services/playerInvitationMail.service.js";
import { hashPlayerInvitationToken } from "../../utils/playerInvitationToken.util.js";

Object.assign(process.env, { EMAIL_USER: "mailer@example.test", EMAIL_APP_PASSWORD: "test-app-password", EMAIL_FROM_NAME: "Hunza Premier League", FRONTEND_URL: "https://hpl.example.test/" });

const owner = { user_id: 11, role: ROLES.TEAM_OWNER };
const future = () => new Date(Date.now() + 60 * 60 * 1000);
const team = () => ({ team_id: 7, name: "Hunza FC", owner_id: owner.user_id, status: "ACTIVE", club: { name: "Hunza Club", owner_id: 12, status: "ACTIVE" } });
const player = (overrides = {}) => ({ player_id: 40, name: "Amin Khan", status: "ACTIVE", user_id: null, ...overrides });
const invitation = (overrides = {}) => ({ invitation_id: 90, player_id: 40, team_id: 7, token_hash: "a".repeat(64), invited_email: "player@example.test", status: "PENDING", expires_at: future(), updated_at: new Date("2026-10-01T10:00:00.000Z"), player: player(), team: team(), ...overrides });
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };

beforeEach(() => setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async () => ({ messageId: "test" }) })));
afterEach(() => resetPlayerInvitationMailTransportFactoryForTests());

test("Gmail invitation mail uses the configured sender, exact subject, 72-hour acceptance URL, and no database identifiers", () => {
  const rawToken = "c".repeat(43);
  const mail = buildPlayerInvitationEmail({ invited_email: "player@example.test", player_name: "Amin Khan", team_name: "Hunza FC", club_name: "Hunza Club", expires_at: future(), rawToken });
  assert.equal(mail.from, "Hunza Premier League <mailer@example.test>");
  assert.equal(mail.subject, "You're invited to join Hunza Premier League");
  assert.match(mail.text, new RegExp(`https://hpl\\.example\\.test/invitations/player/${rawToken}`));
  assert.match(mail.html, /Accept your invitation/);
  for (const forbidden of ["invitation_id", "player_id", "team_id", "token_hash"]) assert.equal(`${mail.text}${mail.html}`.includes(forbidden), false);
});

test("valid creation delivers one email to the invitation recipient while persisting only a SHA-256 token hash", async () => {
  let delivered; let persisted; let audit;
  setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async (message) => { delivered = message; return { messageId: "test" }; } }));
  const tx = {
    team: { findUnique: async () => team() },
    teamPlayer: { findFirst: async () => ({ player: player() }) },
    playerInvitation: { updateMany: async () => ({ count: 0 }), findFirst: async () => null, create: async (input) => { persisted = input.data; const { token_hash, ...safeInvitation } = invitation(); return safeInvitation; } },
  };
  const restores = [replace(prisma, "$transaction", async (callback) => callback(tx)), replace(prisma.auditLog, "create", async (input) => { audit = input.data; })];
  const res = response(); await createPlayerInvitation({ user: owner, body: { player_id: 40, team_id: 7, invited_email: "player@example.test" } }, res, () => {}); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 201); assert.equal(res.result.body.message, "Invitation email sent successfully."); assert.equal(delivered.to, "player@example.test");
  const rawToken = delivered.text.match(/\/invitations\/player\/([A-Za-z0-9_-]+)/)?.[1];
  assert.match(rawToken, /^[A-Za-z0-9_-]{43,128}$/); assert.match(persisted.token_hash, /^[a-f0-9]{64}$/); assert.notEqual(persisted.token_hash, rawToken);
  const safe = JSON.stringify({ response: res.result.body, audit }).toLowerCase(); assert.doesNotMatch(safe, /token_hash|rawtoken/); assert.equal(safe.includes(rawToken.toLowerCase()), false);
});

test("initial creation revokes its pending record and writes no created audit when SMTP delivery fails", async () => {
  const sent = [];
  setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async () => { throw new Error("smtp unavailable"); } }));
  const tx = {
    team: { findUnique: async () => team() },
    teamPlayer: { findFirst: async () => ({ player: player() }) },
    playerInvitation: { updateMany: async () => ({ count: 0 }), findFirst: async () => null, create: async () => invitation() },
  };
  let compensation; let auditCalls = 0;
  const restores = [
    replace(prisma, "$transaction", async (callback) => callback(tx)),
    replace(prisma.playerInvitation, "updateMany", async (input) => { compensation = input; return { count: 1 }; }),
    replace(prisma.auditLog, "create", async () => { auditCalls += 1; }),
  ];
  const res = response(); await createPlayerInvitation({ user: owner, body: { player_id: 40, team_id: 7, invited_email: "player@example.test" } }, res, () => {}); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 503); assert.equal(compensation.data.status, "REVOKED"); assert.equal(compensation.where.invitation_id, 90); assert.equal(auditCalls, 0);
  const serialized = JSON.stringify({ response: res.result.body, sent }).toLowerCase(); for (const secret of ["token", "hash", "player@example.test"]) assert.equal(serialized.includes(secret), false);
});

test("foreign owners, linked players, and ended memberships cannot trigger delivery", async () => {
  const clubOwner = { user_id: 12, role: ROLES.CLUB_OWNER };
  const cases = [
    { actor: owner, currentTeam: { ...team(), owner_id: 999 }, membership: { player: player() }, expected: 404 },
    { actor: clubOwner, currentTeam: { ...team(), club: { ...team().club, owner_id: 999 } }, membership: { player: player() }, expected: 404 },
    { actor: owner, currentTeam: team(), membership: { player: player({ user_id: 55 }) }, expected: 409 },
    { actor: owner, currentTeam: team(), membership: null, expected: 404 },
  ];
  for (const item of cases) {
    let sends = 0;
    setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async () => { sends += 1; return {}; } }));
    const tx = { team: { findUnique: async () => item.currentTeam }, teamPlayer: { findFirst: async () => item.membership }, playerInvitation: { updateMany: async () => ({ count: 0 }), findFirst: async () => null, create: async () => { throw new Error("must not create"); } } };
    const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await createPlayerInvitation({ user: item.actor, body: { player_id: 40, team_id: 7, invited_email: "player@example.test" } }, res, () => {}); restore();
    assert.equal(res.result.statusCode, item.expected); assert.equal(sends, 0);
  }
});

test("resend revalidates owner scope and active membership, delivers first, then atomically rotates only the hash and expiry", async () => {
  const oldRawToken = "d".repeat(43); const record = invitation({ token_hash: hashPlayerInvitationToken(oldRawToken) }); const order = []; let mail; let rotated; let audit;
  setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async (message) => { order.push("mail"); mail = message; return { messageId: "test" }; } }));
  const tx = {
    playerInvitation: {
      findFirst: async (input) => { assert.equal(input.where.team.owner_id, owner.user_id); return record; },
      updateMany: async (input) => { order.push("update"); rotated = input; record.token_hash = input.data.token_hash; record.expires_at = input.data.expires_at; return { count: 1 }; },
    },
    teamPlayer: { findFirst: async (input) => { assert.deepEqual(input.where, { team_id: 7, player_id: 40, status: "ACTIVE" }); return { team_player_id: 8 }; } },
  };
  const restores = [replace(prisma, "$transaction", async (callback) => callback(tx)), replace(prisma.auditLog, "create", async (input) => { audit = input.data; })];
  const res = response(); await resendPlayerInvitation({ user: owner, params: { invitation_id: 90 } }, res, () => {}); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.deepEqual(order, ["mail", "update"]); assert.equal(rotated.where.token_hash, hashPlayerInvitationToken(oldRawToken)); assert.notEqual(rotated.data.token_hash, rotated.where.token_hash); assert.equal(rotated.data.expires_at.getTime() > Date.now(), true);
  const newRawToken = mail.text.match(/\/invitations\/player\/([A-Za-z0-9_-]+)/)?.[1]; assert.match(newRawToken, /^[A-Za-z0-9_-]{43,128}$/); assert.notEqual(hashPlayerInvitationToken(oldRawToken), record.token_hash); assert.equal(hashPlayerInvitationToken(newRawToken), record.token_hash);
  assert.equal(mail.text.includes(record.token_hash), false); assert.deepEqual(audit.details, { player_id: 40, team_id: 7, status: "PENDING" });
  const safe = JSON.stringify({ response: res.result.body, audit }).toLowerCase(); for (const secret of ["token", "hash", "player@example.test"]) assert.equal(safe.includes(secret), false);
});

test("resend blocks IDOR, inactive or linked records, expired pending records, and SMTP errors before token rotation", async () => {
  const cases = [
    { name: "foreign", record: null, expected: 404 },
    { name: "linked", record: invitation({ player: player({ user_id: 55 }) }), expected: 409 },
    { name: "inactive team", record: invitation({ team: { ...team(), status: "INACTIVE" } }), expected: 409 },
    { name: "expired", record: invitation({ expires_at: new Date(Date.now() - 1) }), expected: 409 },
  ];
  for (const item of cases) {
    let sends = 0; let writes = 0;
    setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async () => { sends += 1; return {}; } }));
    const tx = { playerInvitation: { findFirst: async () => item.record, updateMany: async () => { writes += 1; return { count: 1 }; } }, teamPlayer: { findFirst: async () => ({ team_player_id: 8 }) } };
    const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await resendPlayerInvitation({ user: owner, params: { invitation_id: 90 } }, res, () => {}); restore();
    assert.equal(res.result.statusCode, item.expected, item.name); assert.equal(sends, 0, item.name); if (item.name !== "expired") assert.equal(writes, 0, item.name);
  }
  let updateCalls = 0;
  setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async () => { throw new Error("smtp unavailable"); } }));
  const tx = { playerInvitation: { findFirst: async () => invitation(), updateMany: async () => { updateCalls += 1; return { count: 1 }; } }, teamPlayer: { findFirst: async () => ({ team_player_id: 8 }) } };
  const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await resendPlayerInvitation({ user: owner, params: { invitation_id: 90 } }, res, () => {}); restore();
  assert.equal(res.result.statusCode, 503); assert.equal(updateCalls, 0);
});

test("resend is owner-gated and throttled, while the inviter UI exposes no raw token state", async () => {
  const [routes, limiter, manager] = await Promise.all([
    readFile(new URL("playerInvitation.routes.js", import.meta.url), "utf8"),
    readFile(new URL("../../middleware/auth/rateLimit.middleware.js", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/playerInvitations/components/PlayerInvitationManager.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(routes, /router\.use\(authenticate, authorize\(ROLES\.SUPER_ADMIN, ROLES\.CLUB_OWNER, ROLES\.TEAM_OWNER\)\)/);
  assert.match(routes, /"\/:invitation_id\/resend", playerInvitationResendActorRateLimiter, playerInvitationResendRateLimiter/);
  assert.match(limiter, /playerInvitationResendRateLimiter[\s\S]*limit: 3/); assert.match(limiter, /playerInvitationResendActorRateLimiter[\s\S]*limit: 10/);
  assert.match(manager, /RESEND EMAIL/); assert.doesNotMatch(manager, /rawToken|token_hash/);
});
