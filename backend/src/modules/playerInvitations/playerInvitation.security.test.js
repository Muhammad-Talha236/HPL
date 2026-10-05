import "dotenv/config";
import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { validationResult } from "express-validator";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { createPlayerInvitation, getPlayerInvitations, revokePlayerInvitation } from "./playerInvitation.controller.js";
import { createPlayerInvitationValidation, playerInvitationListValidation } from "./playerInvitation.validation.js";
import { PLAYER_INVITATION_EXPIRY_HOURS, createPlayerInvitationToken, getPlayerInvitationExpiry } from "../../utils/playerInvitationToken.util.js";
import { resetPlayerInvitationMailTransportFactoryForTests, setPlayerInvitationMailTransportFactoryForTests } from "../../services/playerInvitationMail.service.js";

Object.assign(process.env, { EMAIL_USER: "mailer@example.test", EMAIL_APP_PASSWORD: "test-app-password", EMAIL_FROM_NAME: "Hunza Premier League", FRONTEND_URL: "https://hpl.example.test" });
beforeEach(() => setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async () => ({ messageId: "test" }) })));
afterEach(() => resetPlayerInvitationMailTransportFactoryForTests());

const owner = { user_id: 11, role: ROLES.TEAM_OWNER };
const clubOwner = { user_id: 12, role: ROLES.CLUB_OWNER };
const admin = { user_id: 1, role: ROLES.SUPER_ADMIN };
const team = (overrides = {}) => ({ team_id: 7, name: "Hunza FC", owner_id: owner.user_id, status: "ACTIVE", club: { club_id: 3, name: "Hunza Club", owner_id: clubOwner.user_id, status: "ACTIVE" }, ...overrides });
const player = (overrides = {}) => ({ player_id: 40, name: "Amin Khan", status: "ACTIVE", user_id: null, ...overrides });
const invitation = (overrides = {}) => ({ invitation_id: 90, player_id: 40, team_id: 7, status: "PENDING", expires_at: new Date(Date.now() + 60_000), accepted_at: null, created_at: new Date(), updated_at: new Date(), player: { player_id: 40, name: "Amin Khan", registration_number: "HPL-40", status: "ACTIVE" }, team: { team_id: 7, name: "Hunza FC", club: { club_id: 3, name: "Hunza Club" } }, ...overrides });
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const runValidation = async (rules, request) => { for (const rule of rules) await rule.run(request); return validationResult(request).array(); };

const createRequest = (user = owner, body = {}) => ({ user, body: { player_id: 40, team_id: 7, invited_email: "player@example.test", ...body } });

test("token generation is 256-bit random, SHA-256 hashed, and expires in 72 hours", () => {
  const first = createPlayerInvitationToken(); const second = createPlayerInvitationToken();
  assert.notEqual(first.rawToken, second.rawToken); assert.equal(first.rawToken.length >= 43, true); assert.match(first.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(first.tokenHash, crypto.createHash("sha256").update(first.rawToken).digest("hex"));
  const now = new Date("2026-10-05T10:00:00.000Z"); assert.equal(getPlayerInvitationExpiry(now).getTime() - now.getTime(), PLAYER_INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);
});

test("authorized Team Owner, Club Owner, and Super Admin create only an exact active player membership invitation", async () => {
  for (const actor of [owner, clubOwner, admin]) {
    let createInput; let audit; const tx = {
      team: { findUnique: async () => team() },
      teamPlayer: { findFirst: async (input) => { assert.deepEqual(input.where, { team_id: 7, player_id: 40, status: "ACTIVE" }); return { player: player() }; } },
      playerInvitation: { updateMany: async () => ({ count: 0 }), findFirst: async () => null, create: async (input) => { createInput = input; return invitation(); } },
    };
    const restores = [replace(prisma, "$transaction", async (callback) => callback(tx)), replace(prisma.auditLog, "create", async (input) => { audit = input.data; })];
    const res = response(); await createPlayerInvitation(createRequest(actor), res, () => {}); restores.reverse().forEach((restore) => restore());
    assert.equal(res.result.statusCode, 201); assert.equal(createInput.data.invited_by_user_id, actor.user_id); assert.equal(createInput.data.team_id, 7); assert.equal(createInput.data.status, "PENDING"); assert.match(createInput.data.token_hash, /^[a-f0-9]{64}$/); assert.equal(JSON.stringify(res.result.body).toLowerCase().includes("token"), false); assert.deepEqual(audit.details, { player_id: 40, team_id: 7, status: "PENDING" });
  }
});

test("foreign, inactive, missing, and already-linked player invitations are rejected before persistence", async () => {
  const cases = [
    { actor: owner, scopedTeam: team({ owner_id: 999 }), membership: { player: player() }, expected: 404 },
    { actor: owner, scopedTeam: team({ status: "INACTIVE" }), membership: { player: player() }, expected: 409 },
    { actor: owner, scopedTeam: team(), membership: null, expected: 404 },
    { actor: owner, scopedTeam: team(), membership: { player: player({ user_id: 444 }) }, expected: 409 },
  ];
  for (const item of cases) {
    let created = false; const tx = { team: { findUnique: async () => item.scopedTeam }, teamPlayer: { findFirst: async () => item.membership }, playerInvitation: { updateMany: async () => ({ count: 0 }), findFirst: async () => null, create: async () => { created = true; } } };
    const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await createPlayerInvitation(createRequest(item.actor), res, () => {}); restore(); assert.equal(res.result.statusCode, item.expected); assert.equal(created, false);
  }
});

test("expired pending invitations are preserved as EXPIRED and permit a replacement while live duplicates are rejected", async () => {
  let expiredWhere; let created = false; const tx = {
    team: { findUnique: async () => team() }, teamPlayer: { findFirst: async () => ({ player: player() }) },
    playerInvitation: { updateMany: async (input) => { expiredWhere = input; return { count: 1 }; }, findFirst: async () => null, create: async () => { created = true; return invitation(); } },
  };
  let restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const muteAudit = replace(prisma.auditLog, "create", async () => ({})); const fresh = response(); await createPlayerInvitation(createRequest(), fresh, () => {}); muteAudit(); restore();
  assert.equal(fresh.result.statusCode, 201); assert.equal(created, true); assert.equal(expiredWhere.data.status, "EXPIRED"); assert.equal(expiredWhere.where.status, "PENDING");
  const duplicateTx = { ...tx, playerInvitation: { updateMany: async () => ({ count: 0 }), findFirst: async () => ({ invitation_id: 91 }), create: async () => { throw new Error("must not create"); } } };
  restore = replace(prisma, "$transaction", async (callback) => callback(duplicateTx)); const duplicate = response(); await createPlayerInvitation(createRequest(), duplicate, () => {}); restore(); assert.equal(duplicate.result.statusCode, 409);
});

test("list is bounded, ownership-scoped, supports an exact player filter, and never selects token hashes", async () => {
  for (const actor of [owner, clubOwner, admin]) {
    let listInput; let countInput; const restores = [
      replace(prisma.playerInvitation, "findMany", async (input) => { listInput = input; return [invitation()]; }),
      replace(prisma.playerInvitation, "count", async (input) => { countInput = input; return 1; }),
      replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
    ];
    const res = response(); await getPlayerInvitations({ user: actor, query: { page: 1, limit: 20, status: "PENDING", team_id: 7, player_id: 40, user_id: 999 } }, res, () => {}); restores.reverse().forEach((restore) => restore());
    assert.equal(res.result.statusCode, 200); assert.equal(listInput.take, 20); assert.equal(listInput.skip, 0); assert.equal(countInput.where.team_id, 7); assert.equal(countInput.where.player_id, 40); const serialized = JSON.stringify(listInput).toLowerCase(); for (const secret of ["token_hash", "password", "phone", "user_id"]) assert.equal(serialized.includes(secret), false);
    assert.equal(listInput.select.invited_email, true);
    if (actor.role === ROLES.TEAM_OWNER) assert.equal(listInput.where.team.owner_id, actor.user_id); if (actor.role === ROLES.CLUB_OWNER) assert.equal(listInput.where.team.club.owner_id, actor.user_id); if (actor.role === ROLES.SUPER_ADMIN) assert.deepEqual(listInput.where.team, {});
  }
});

test("revoke scopes by current actor, expires stale records, and never changes a foreign invitation", async () => {
  let revokeUpdate; const tx = { playerInvitation: {
    updateMany: async (input) => { if (input.data.status === "EXPIRED") return { count: 0 }; revokeUpdate = input; return { count: 1 }; },
    findFirst: async (input) => input.where.invitation_id === 90 && input.where.team.owner_id === owner.user_id ? { invitation_id: 90, player_id: 40, team_id: 7, status: "PENDING" } : null,
  } };
  let audit; const restores = [replace(prisma, "$transaction", async (callback) => callback(tx)), replace(prisma.auditLog, "create", async (input) => { audit = input.data; })];
  const own = response(); await revokePlayerInvitation({ user: owner, params: { invitation_id: 90 }, body: { status: "ACCEPTED", user_id: 999 } }, own, () => {});
  const foreign = response(); await revokePlayerInvitation({ user: owner, params: { invitation_id: 91 } }, foreign, () => {}); restores.reverse().forEach((restore) => restore());
  assert.equal(own.result.statusCode, 200); assert.equal(foreign.result.statusCode, 404); assert.deepEqual(revokeUpdate.data, { status: "REVOKED" }); assert.equal(revokeUpdate.where.status, "PENDING"); assert.deepEqual(audit.details, { player_id: 40, team_id: 7, status: "REVOKED" });
});

test("validation, schema, routes, and migration enforce invitation integrity with delivery secrets excluded", async () => {
  const massAssignment = await runValidation(createPlayerInvitationValidation, { body: { player_id: 40, team_id: 7, invited_email: "player@example.test", token_hash: "forged", status: "ACCEPTED", invited_by_user_id: 999 }, params: {}, query: {} });
  assert.ok(massAssignment.some((error) => error.msg === "Unexpected fields are not allowed"));
  for (const query of [{ page: "0" }, { limit: "51" }, { status: "UNKNOWN" }, { team_id: "0" }, { player_id: "0" }, { token_hash: "forged" }]) assert.ok((await runValidation(playerInvitationListValidation, { query, body: {}, params: {} })).length > 0);
  const [schema, migration, routes, server, controller] = await Promise.all([
    readFile(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8"),
    readFile(new URL("../../../prisma/migrations/20261007000000_add_player_user_invitation_security/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("playerInvitation.routes.js", import.meta.url), "utf8"),
    readFile(new URL("../../server.js", import.meta.url), "utf8"),
    readFile(new URL("playerInvitation.controller.js", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /user_id\s+Int\?\s+@unique/); assert.match(schema, /invited_by_user_id\s+Int\?/); assert.match(migration, /WHERE "status" = 'PENDING'/); assert.match(routes, /authorize\(ROLES\.SUPER_ADMIN, ROLES\.CLUB_OWNER, ROLES\.TEAM_OWNER\)/); assert.match(server, /\/api\/player-invitations/); assert.match(routes, /:invitation_id\/resend/); assert.doesNotMatch(controller, /json\([^)]*rawToken|rawToken\s*:/);
});
