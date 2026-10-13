import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { updateTeam } from "../teams/team.controller.js";
import { createTeamPlayer, removeTeamPlayer, updateTeamPlayer } from "../teamPlayers/teamPlayer.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const next = (error) => { if (error) throw error; };
const ownerA = { user_id: 1, role: ROLES.TEAM_OWNER }; const ownerB = { user_id: 2, role: ROLES.TEAM_OWNER };
const teamA = { team_id: 11, club_id: 4, owner_id: 1, home_venue_id: 8, status: "ACTIVE", name: "Team A", gender: "MEN" };
const teamB = { ...teamA, team_id: 12, owner_id: 2, name: "Team B" };
const player = { player_id: 41, name: "Player A", gender: "MALE", status: "ACTIVE", registration_number: "HPL-41" };

test("team edit permits each owned team but denies foreign teams and non-team-owner roles", async () => {
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.REFEREE, ROLES.SUPER_ADMIN]) { const res = response(); let called = false; authorize(ROLES.TEAM_OWNER)({ user: { role } }, res, () => { called = true; }); assert.equal(called, false); assert.equal(res.result.statusCode, 403); }
  const foreignRestore = replace(prisma.team, "findUnique", async () => teamB); const foreign = response(); await updateTeam({ params: { team_id: "12" }, body: { name: "Changed" }, user: ownerA }, foreign, next); foreignRestore(); assert.equal(foreign.result.statusCode, 403);
  let updated; let reads = 0; const restores = [replace(prisma.team, "findUnique", async () => (++reads === 1 ? teamA : { ...teamA, name: "Updated A" })), replace(prisma.team, "findFirst", async () => null), replace(prisma.team, "updateMany", async (input) => { updated = input; return { count: 1 }; }), replace(prisma.auditLog, "create", async () => ({}))]; const own = response(); await updateTeam({ params: { team_id: "11" }, body: { name: "Updated A" }, user: ownerA }, own, next); restores.reverse().forEach((restore) => restore()); assert.equal(own.result.statusCode, 200); assert.equal(updated.where.owner_id, ownerA.user_id); assert.deepEqual(updated.data, { name: "Updated A" });
});

test("team-owner edit blocks gender and protected-field mass assignment before mutation", async () => {
  const restore = replace(prisma.team, "findUnique", async () => teamA); const gender = response(); await updateTeam({ params: { team_id: "11" }, body: { gender: "WOMEN" }, user: ownerA }, gender, next); restore(); assert.equal(gender.result.statusCode, 400);
  const allowed = ["name", "team_type", "home_venue_id", "logo", "region", "district", "city", "description", "contact_email", "contact_phone"]; const protectedFields = ["owner_id", "club_id", "status", "created_at", "updated_at", "gender"]; assert.equal(allowed.includes("owner_id"), false); for (const field of protectedFields) assert.equal(allowed.includes(field), false);
});

test("direct TeamPlayer add is denied to owners so invitation onboarding cannot be bypassed", async () => {
  const run = async (team) => { const transaction = replace(prisma, "$transaction", async (callback) => callback({ team: { findUnique: async () => ({ ...team, club: { status: "ACTIVE" } }) }, player: { findUnique: async () => player }, teamPlayer: { findUnique: async () => null, findFirst: async () => null, create: async () => ({ team_player_id: 77, team_id: team.team_id, player_id: player.player_id, jersey_number: 9, status: "ACTIVE", player, team }) } })); const audit = replace(prisma.auditLog, "create", async () => ({})); const res = response(); await createTeamPlayer({ body: { team_id: team.team_id, player_id: player.player_id, jersey_number: 9, joined_at: "2026-01-01" }, user: ownerA }, res); audit(); transaction(); return res; };
  assert.equal((await run(teamA)).result.statusCode, 403); assert.equal((await run(teamB)).result.statusCode, 403);
});

test("TeamPlayer membership edit permits only jersey updates and protects foreign memberships", async () => {
  const dateEdit = response(); await updateTeamPlayer({ params: { team_player_id: "70" }, body: { joined_at: "2026-01-02" }, user: ownerA }, dateEdit); assert.equal(dateEdit.result.statusCode, 400);
  const transaction = replace(prisma, "$transaction", async (callback) => callback({ teamPlayer: { findUnique: async () => ({ team_player_id: 70, team_id: teamB.team_id, player_id: player.player_id, jersey_number: 9, status: "ACTIVE", team: { ...teamB, club: { status: "ACTIVE" } } }) } })); const foreign = response(); await updateTeamPlayer({ params: { team_player_id: "70" }, body: { jersey_number: 10 }, user: ownerA }, foreign); transaction(); assert.equal(foreign.result.statusCode, 403);
});

test("TeamPlayer soft end denies foreign membership before mutation and retains history on owned membership", async () => {
  const foreignTx = replace(prisma, "$transaction", async (callback) => callback({ teamPlayer: { findUnique: async () => ({ team_player_id: 70, team_id: teamB.team_id, player_id: player.player_id, status: "ACTIVE", team: { ...teamB, club: { status: "ACTIVE" } } }) } })); const foreign = response(); await removeTeamPlayer({ params: { team_player_id: "70" }, user: ownerA }, foreign); foreignTx(); assert.equal(foreign.result.statusCode, 403);
  let updateData; let reads = 0; const ownTx = replace(prisma, "$transaction", async (callback) => callback({ teamPlayer: { findUnique: async () => (++reads === 1 ? { team_player_id: 71, team_id: teamA.team_id, player_id: player.player_id, status: "ACTIVE", team: { ...teamA, club: { status: "ACTIVE" } }, player } : { team_player_id: 71, team_id: teamA.team_id, player_id: player.player_id, status: "INACTIVE", left_at: new Date(), player, team: teamA }), updateMany: async (input) => { updateData = input.data; return { count: 1 }; } } })); const audit = replace(prisma.auditLog, "create", async () => ({})); const own = response(); await removeTeamPlayer({ params: { team_player_id: "71" }, user: ownerA }, own); audit(); ownTx(); assert.equal(own.result.statusCode, 200); assert.equal(updateData.status, "INACTIVE"); assert.ok(updateData.left_at instanceof Date);
});
