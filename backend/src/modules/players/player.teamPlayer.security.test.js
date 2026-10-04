import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { updatePlayer, activatePlayer, deactivatePlayer, getPlayers, getPlayerById } from "./player.controller.js";
import { updatePlayerValidation } from "./player.validation.js";
import { createTeamPlayer, updateTeamPlayer, removeTeamPlayer } from "../teamPlayers/teamPlayer.controller.js";
import { updateTeamPlayerValidation } from "../teamPlayers/teamPlayer.validation.js";

const response = () => {
  const result = { statusCode: 200, body: null };
  return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } };
};
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const next = (error) => { if (error) throw error; };
const admin = { user_id: 1, role: ROLES.SUPER_ADMIN };
const activePlayer = { player_id: 7, name: "Amin Khan", profile_photo: null, date_of_birth: new Date("2000-01-01"), gender: "MALE", position: "MID", phone: "03001234567", nationality: "Pakistan", registration_number: "HPL-IMMUTABLE", status: "ACTIVE", created_at: new Date(), updated_at: new Date() };
const activeTeam = { team_id: 3, name: "Karimabad Kings", gender: "MEN", status: "ACTIVE", owner_id: 4, club: { club_id: 2, owner_id: 4, status: "ACTIVE" } };
const membership = { team_player_id: 12, team_id: 3, player_id: 7, jersey_number: 11, joined_at: new Date("2025-01-01"), left_at: null, status: "ACTIVE", team: { team_id: 3, name: "Karimabad Kings", gender: "MEN", status: "ACTIVE", club: { club_id: 2, name: "Kings Club" } }, player: { player_id: 7, name: "Amin Khan", gender: "MALE", status: "ACTIVE" } };

test("admin player endpoints reject missing authentication and every non-admin role", async () => {
  const noAuth = response(); let called = false;
  await authenticate({ headers: {} }, noAuth, () => { called = true; });
  assert.equal(called, false); assert.equal(noAuth.result.statusCode, 401);
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER, ROLES.REFEREE]) {
    const res = response(); let allowed = false;
    authorize(ROLES.SUPER_ADMIN)({ user: { role } }, res, () => { allowed = true; });
    assert.equal(allowed, false); assert.equal(res.result.statusCode, 403);
  }
});

test("real JWT authentication permits the super admin role", async () => {
  const restore = replace(prisma.user, "findUnique", async () => ({ user_id: 1, role: ROLES.SUPER_ADMIN, status: "ACTIVE" }));
  const req = { headers: { authorization: `Bearer ${jwt.sign({ user_id: 1 }, process.env.JWT_SECRET, { algorithm: "HS256" })}` } };
  const res = response(); let allowed = false;
  await authenticate(req, res, () => authorize(ROLES.SUPER_ADMIN)(req, res, () => { allowed = true; }));
  restore(); assert.equal(allowed, true); assert.equal(res.result.statusCode, 200);
});

test("public player projections never contain phone while admin data remains private", async () => {
  let listSelect; let detailSelect;
  const restores = [replace(prisma.player, "findMany", async (args) => { listSelect = args.select; return [{ ...activePlayer }]; }), replace(prisma.player, "findUnique", async (args) => { detailSelect = args.select; return { ...activePlayer }; })];
  const listed = response(); await getPlayers({}, listed); const detailed = response(); await getPlayerById({ params: { player_id: "7" } }, detailed);
  restores.reverse().forEach((restore) => restore());
  assert.equal(JSON.stringify(listSelect).includes("phone"), false);
  assert.equal(JSON.stringify(detailSelect).includes("phone"), false);
});

test("player update persists valid fields but ignores membership, ID, jersey and registration injection", async () => {
  let updateData; const audits = [];
  const restores = [replace(prisma.player, "findUnique", async () => ({ ...activePlayer })), replace(prisma.player, "updateMany", async (args) => { updateData = args.data; return { count: 1 }; }), replace(prisma.auditLog, "create", async ({ data }) => { audits.push(data.action); return {}; })];
  const res = response(); await updatePlayer({ params: { player_id: "7" }, user: admin, body: { name: "Amin Updated", player_id: 99, team_id: 9, jersey_number: 20, registration_number: "FORGED" } }, res);
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.deepEqual(updateData, { name: "Amin Updated" }); assert.equal(audits[0], "PLAYER_UPDATED");
});

test("route validators reject mass assignment of player and TeamPlayer immutable fields", async () => {
  const run = async (rules, req) => { for (const rule of rules) await rule.run(req); return validationResult(req).array(); };
  const playerErrors = await run(updatePlayerValidation, { params: { player_id: "7" }, body: { name: "Amin", player_id: 9, team_id: 3, jersey_number: 8, registration_number: "FORGED" } });
  const membershipErrors = await run(updateTeamPlayerValidation, { params: { team_player_id: "12" }, body: { jersey_number: 8, player_id: 8, team_id: 4, status: "ACTIVE" } });
  assert.ok(playerErrors.length >= 1); assert.match(playerErrors.map((error) => error.msg).join(" "), /Unexpected fields/i);
  assert.ok(membershipErrors.length >= 3);
});

test("player lifecycle is a soft status transition and preserves the player record", async () => {
  const audits = []; let lastUpdate;
  const restores = [replace(prisma.player, "updateMany", async (args) => { lastUpdate = args; return { count: 1 }; }), replace(prisma.player, "findUnique", async () => ({ ...activePlayer })), replace(prisma.auditLog, "create", async ({ data }) => { audits.push(data.action); return {}; })];
  const deactivated = response(); await deactivatePlayer({ params: { player_id: "7" }, user: admin }, deactivated);
  const activated = response(); await activatePlayer({ params: { player_id: "7" }, user: admin }, activated);
  restores.reverse().forEach((restore) => restore());
  assert.equal(deactivated.result.statusCode, 200); assert.equal(activated.result.statusCode, 200); assert.equal(lastUpdate.data.status, "ACTIVE"); assert.deepEqual(audits, ["PLAYER_DEACTIVATED", "PLAYER_ACTIVATED"]);
});

const teamPlayerRequest = (overrides = {}) => ({ params: { team_player_id: "12" }, body: { team_id: 3, player_id: 7, jersey_number: 11, joined_at: "2025-01-01" }, user: admin, ...overrides });
const mockCreateTransaction = ({ team = activeTeam, player = activePlayer, existing = null, jerseyConflict = null } = {}) => replace(prisma, "$transaction", async (callback) => callback({ team: { findUnique: async () => team }, player: { findUnique: async () => player }, teamPlayer: { findUnique: async () => existing, findFirst: async () => jerseyConflict, create: async () => membership } }));

test("TeamPlayer add accepts MALE to MEN, stores jersey on TeamPlayer, and audits the event", async () => {
  let action; const restores = [mockCreateTransaction(), replace(prisma.auditLog, "create", async ({ data }) => { action = data.action; return {}; })];
  const res = response(); await createTeamPlayer(teamPlayerRequest(), res); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 201); assert.equal(res.result.body.data.jersey_number, 11); assert.equal(Object.hasOwn(res.result.body.data.player, "jersey_number"), false); assert.equal(action, "TEAM_PLAYER_ADDED");
});

test("TeamPlayer add rejects inactive entities, gender mismatch, and active jersey conflicts", async () => {
  for (const scenario of [
    { player: { ...activePlayer, status: "INACTIVE" }, expected: 409 },
    { team: { ...activeTeam, status: "INACTIVE" }, expected: 409 },
    { team: { ...activeTeam, gender: "WOMEN" }, expected: 400 },
    { jerseyConflict: { team_player_id: 99 }, expected: 409 },
  ]) {
    const restore = mockCreateTransaction(scenario); const res = response(); await createTeamPlayer(teamPlayerRequest(), res); restore(); assert.equal(res.result.statusCode, scenario.expected);
  }
});

test("TeamPlayer gender mapping also accepts FEMALE to WOMEN and rejects FEMALE to MEN", async () => {
  for (const [teamGender, expected] of [["WOMEN", 201], ["MEN", 400]]) {
    const restore = mockCreateTransaction({ team: { ...activeTeam, gender: teamGender }, player: { ...activePlayer, gender: "FEMALE" } });
    const auditRestore = replace(prisma.auditLog, "create", async () => ({})); const res = response(); await createTeamPlayer(teamPlayerRequest(), res); auditRestore(); restore(); assert.equal(res.result.statusCode, expected);
  }
});

test("TeamPlayer edit updates only the jersey, enforces active conflicts, and audits the change", async () => {
  const existing = { ...membership, team: { ...activeTeam } };
  const edited = { ...membership, jersey_number: 19 };
  for (const [conflict, expected] of [[null, 200], [{ team_player_id: 99 }, 409]]) {
    let updateData; let action;
    const restoreTransaction = replace(prisma, "$transaction", async (callback) => callback({
      teamPlayer: { findUnique: async () => existing, findFirst: async () => conflict, updateMany: async (args) => { updateData = args.data; return { count: 1 }; } },
      player: { findUnique: async () => ({ player_id: 7, gender: "MALE", status: "ACTIVE" }) },
      team: { findUnique: async () => ({ gender: "MEN" }) },
    }));
    const restoreAudit = replace(prisma.auditLog, "create", async ({ data }) => { action = data.action; return {}; });
    const originalFind = prisma.teamPlayer.findUnique; prisma.teamPlayer.findUnique = async () => edited;
    const res = response(); await updateTeamPlayer({ params: { team_player_id: "12" }, user: admin, body: { jersey_number: 19 } }, res);
    prisma.teamPlayer.findUnique = originalFind; restoreAudit(); restoreTransaction();
    assert.equal(res.result.statusCode, expected);
    if (expected === 200) { assert.deepEqual(updateData, { jersey_number: 19 }); assert.equal(action, "TEAM_PLAYER_UPDATED"); }
  }
});

test("ending a TeamPlayer membership is soft, preserves the record, and writes removal audit", async () => {
  let updateData; let action; const ended = { ...membership, status: "INACTIVE", left_at: new Date() };
  let reads = 0;
  const restoreTransaction = replace(prisma, "$transaction", async (callback) => callback({ teamPlayer: { findUnique: async () => (++reads === 1 ? { ...membership, team: { ...activeTeam }, player: { player_id: 7, name: "Amin Khan" } } : ended), updateMany: async (args) => { updateData = args.data; return { count: 1 }; } } }));
  const restoreAudit = replace(prisma.auditLog, "create", async ({ data }) => { action = data.action; return {}; });
  const res = response(); await removeTeamPlayer({ params: { team_player_id: "12" }, user: admin }, res);
  restoreAudit(); restoreTransaction();
  assert.equal(res.result.statusCode, 200); assert.equal(updateData.status, "INACTIVE"); assert.ok(updateData.left_at instanceof Date); assert.equal(res.result.body.data.status, "INACTIVE"); assert.equal(action, "TEAM_PLAYER_REMOVED");
});
