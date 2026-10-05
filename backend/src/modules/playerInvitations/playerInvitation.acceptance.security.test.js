import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { acceptPlayerInvitation, previewPlayerInvitationAcceptance } from "./playerInvitation.controller.js";
import { hashPlayerInvitationToken } from "../../utils/playerInvitationToken.util.js";

const token = "a".repeat(43);
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const invitation = (overrides = {}) => ({ invitation_id: 8, player_id: 40, team_id: 7, invited_email: "player@example.test", status: "PENDING", expires_at: new Date(Date.now() + 60_000), player: { player_id: 40, name: "Amin Khan", profile_photo: null, status: "ACTIVE", user_id: null }, team: { team_id: 7, name: "Hunza FC", status: "ACTIVE", club: { name: "Hunza Club", status: "ACTIVE" } }, ...overrides });
const user = (overrides = {}) => ({ user_id: 22, email: "PLAYER@EXAMPLE.TEST", role: ROLES.USER, status: "ACTIVE", player: null, ...overrides });
const request = (overrides = {}) => ({ params: { token }, user: user(), ...overrides });

test("public preview hashes tokens, returns a minimal valid payload, and never reveals recipient account data", async () => {
  let lookup; const restore = replace(prisma.playerInvitation, "findUnique", async (input) => { lookup = input; return invitation(); });
  const res = response(); await previewPlayerInvitationAcceptance({ params: { token } }, res, () => {}); restore();
  assert.equal(res.result.statusCode, 200); assert.equal(lookup.where.token_hash, hashPlayerInvitationToken(token));
  assert.deepEqual(res.result.body.data, { valid: true, state: "PENDING", expires_at: res.result.body.data.expires_at, invited_email: "p***@example.test", player: { name: "Amin Khan", profile_photo: null }, team: { name: "Hunza FC", logo: undefined }, club: { name: "Hunza Club" } });
  const serialized = JSON.stringify(res.result.body).toLowerCase(); for (const secret of ["token_hash", "user_id", "phone", "password", token]) assert.equal(serialized.includes(secret.toLowerCase()), false);
});

test("public preview gives safe unavailable states and expires stale pending invitations without deletion", async () => {
  const invalid = response(); await previewPlayerInvitationAcceptance({ params: { token: "not-a-token" } }, invalid, () => {}); assert.deepEqual(invalid.result.body.data, { valid: false, state: "UNAVAILABLE" });
  for (const status of ["REVOKED", "ACCEPTED"]) {
    const restore = replace(prisma.playerInvitation, "findUnique", async () => invitation({ status })); const res = response(); await previewPlayerInvitationAcceptance({ params: { token } }, res, () => {}); restore(); assert.deepEqual(res.result.body.data, { valid: false, state: status });
  }
  let expirationUpdate; const restores = [replace(prisma.playerInvitation, "findUnique", async () => invitation({ expires_at: new Date(Date.now() - 1) })), replace(prisma.playerInvitation, "updateMany", async (input) => { expirationUpdate = input; return { count: 1 }; })];
  const expired = response(); await previewPlayerInvitationAcceptance({ params: { token } }, expired, () => {}); restores.reverse().forEach((restore) => restore());
  assert.deepEqual(expired.result.body.data, { valid: false, state: "EXPIRED" }); assert.equal(expirationUpdate.data.status, "EXPIRED");
});

test("matching USER accepts atomically, preserves USER role, and writes only safe audit metadata", async () => {
  let playerUpdate; let invitationUpdate; let audit;
  const tx = { playerInvitation: { findUnique: async () => invitation(), updateMany: async (input) => { invitationUpdate = input; return { count: 1 }; } }, user: { findUnique: async () => user() }, teamPlayer: { findFirst: async (input) => { assert.deepEqual(input.where, { team_id: 7, player_id: 40, status: "ACTIVE" }); return { team_player_id: 5 }; } }, player: { updateMany: async (input) => { playerUpdate = input; return { count: 1 }; } }, auditLog: { create: async (input) => { audit = input; } } };
  const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await acceptPlayerInvitation(request(), res, () => {}); restore();
  assert.equal(res.result.statusCode, 200); assert.deepEqual(playerUpdate, { where: { player_id: 40, user_id: null }, data: { user_id: 22 } }); assert.equal(invitationUpdate.data.status, "ACCEPTED"); assert.ok(invitationUpdate.data.accepted_at instanceof Date); assert.equal(user().role, ROLES.USER); assert.deepEqual(audit.data.details, { invitation_id: 8, player_id: 40, team_id: 7 }); const auditText = JSON.stringify(audit).toLowerCase(); for (const secret of ["token", "hash", "email"]) assert.equal(auditText.includes(secret), false);
});

test("acceptance rejects wrong identities, operational roles, linked records, invalid lifecycle, and ended memberships without mutation", async () => {
  const cases = [
    { name: "wrong email", req: request({ user: user({ email: "other@example.test" }) }), user: user({ email: "other@example.test" }) },
    { name: "linked player", invitation: invitation({ player: { ...invitation().player, user_id: 9 } }) },
    { name: "linked user", user: user({ player: { player_id: 41 } }) },
    { name: "accepted", invitation: invitation({ status: "ACCEPTED" }) },
    { name: "revoked", invitation: invitation({ status: "REVOKED" }) },
    { name: "expired", invitation: invitation({ expires_at: new Date(Date.now() - 1) }) },
    { name: "ended membership", membership: null },
  ];
  for (const item of cases) {
    let playerWrites = 0; let invitationWrites = 0; const tx = { playerInvitation: { findUnique: async () => item.invitation || invitation(), updateMany: async () => { invitationWrites += 1; return { count: 1 }; } }, user: { findUnique: async () => item.user || user() }, teamPlayer: { findFirst: async () => item.membership === undefined ? { team_player_id: 5 } : item.membership }, player: { updateMany: async () => { playerWrites += 1; return { count: 1 }; }, }, auditLog: { create: async () => { throw new Error("must not audit"); } } };
    const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await acceptPlayerInvitation(item.req || request(), res, () => {}); restore(); assert.equal(res.result.statusCode, 409, item.name); assert.equal(playerWrites, 0, item.name); if (item.name !== "expired") assert.equal(invitationWrites, 0, item.name);
  }
  for (const role of [ROLES.SUPER_ADMIN, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER, ROLES.REFEREE]) { const res = response(); await acceptPlayerInvitation(request({ user: user({ role }) }), res, () => {}); assert.equal(res.result.statusCode, 403); }
});

test("conditional writes and the serializable transaction prevent replay and rollback all staged changes when audit persistence fails", async () => {
  const replayTx = { playerInvitation: { findUnique: async () => invitation(), updateMany: async () => ({ count: 0 }) }, user: { findUnique: async () => user() }, teamPlayer: { findFirst: async () => ({ team_player_id: 5 }) }, player: { updateMany: async () => ({ count: 0 }) }, auditLog: { create: async () => ({}) } };
  let restore = replace(prisma, "$transaction", async (callback) => callback(replayTx)); const replay = response(); await acceptPlayerInvitation(request(), replay, () => {}); restore(); assert.equal(replay.result.statusCode, 409);
  const persisted = { player_user_id: null, invitation_status: "PENDING", accepted_at: null, audits: 0 }; const staged = { ...persisted }; const tx = { playerInvitation: { findUnique: async () => invitation(), updateMany: async (input) => { staged.invitation_status = input.data.status; staged.accepted_at = input.data.accepted_at; return { count: 1 }; } }, user: { findUnique: async () => user() }, teamPlayer: { findFirst: async () => ({ team_player_id: 5 }) }, player: { updateMany: async (input) => { staged.player_user_id = input.data.user_id; return { count: 1 }; } }, auditLog: { create: async () => { throw new Error("audit failure"); } } };
  restore = replace(prisma, "$transaction", async (callback) => { try { await callback(tx); Object.assign(persisted, staged); } catch { /* Transaction rollback leaves persisted state intact. */ } });
  const res = response(); await acceptPlayerInvitation(request(), res, () => {}); restore(); assert.equal(persisted.player_user_id, null); assert.equal(persisted.invitation_status, "PENDING"); assert.equal(persisted.accepted_at, null); assert.equal(persisted.audits, 0);
});

test("routes place specific token handlers before inviter guards and the public UI keeps tokens out of storage", async () => {
  const [routes, page, login] = await Promise.all([readFile(new URL("playerInvitation.routes.js", import.meta.url), "utf8"), readFile(new URL("../../../../frontend/src/features/playerInvitations/pages/PlayerInvitationAcceptancePage.jsx", import.meta.url), "utf8"), readFile(new URL("../../../../frontend/src/features/auth/pages/LoginPage.jsx", import.meta.url), "utf8")]);
  assert.ok(routes.indexOf('router.get("/accept/:token"') < routes.indexOf("router.use(authenticate")); assert.match(routes, /router\.post\("\/accept\/:token", authenticate, authorize\(ROLES\.USER\)/); assert.doesNotMatch(page, /localStorage|sessionStorage|console\./); assert.match(page, /from: \{ pathname: location\.pathname \}/); assert.match(login, /!pathname\.startsWith\("\/\/"\)/);
});
