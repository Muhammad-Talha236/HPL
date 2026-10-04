import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { updateRegistrationSquad } from "../registrations/registration.extra.controller.js";
import { competitionSquadCandidates } from "./teamOwner.controller.js";
import { requireOwnedRegistrationForSquad } from "./teamOwner.squad.middleware.js";

const ownerA = { user_id: 101, role: ROLES.TEAM_OWNER };
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const ownedRegistration = (team_id = 11) => ({ registration_id: 501 + team_id, team_id, registered_by: 999, registration_status: "APPROVED", competition: { competition_id: 5, gender: "MEN", squad_size: 2 }, team: { owner_id: 101, club: { owner_id: 777 } } });

test("squad candidates are scoped independently to each exact owned registration team and expose TeamPlayer jerseys only", async () => {
  let playerQuery; const restores = [replace(prisma.competitionRegistration, "findFirst", async (input) => ({ registration_id: input.where.registration_id, team_id: input.where.registration_id === 511 ? 11 : 12, registration_status: "APPROVED", team: { name: "Owned team" }, competition: { name: "Cup", gender: "MEN", squad_size: 18 } })), replace(prisma.teamPlayer, "findMany", async (input) => { playerQuery = input; return [{ team_player_id: 70, player_id: input.where.team_id === 11 ? 41 : 42, jersey_number: input.where.team_id === 11 ? 9 : 10, status: "ACTIVE", player: { name: "Exact player", registration_number: "HPL-41", position: "MID", gender: "MEN" } }]; })];
  for (const id of [511, 512]) { const res = response(); await competitionSquadCandidates({ user: ownerA, params: { registration_id: String(id) } }, res, (error) => { throw error; }); assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.data[0].player_id, id === 511 ? 41 : 42); assert.equal(res.result.body.data[0].jersey_number, id === 511 ? 9 : 10); assert.equal(JSON.stringify(res.result.body).includes("phone"), false); }
  restores.reverse().forEach((restore) => restore()); assert.equal(playerQuery.where.team_id, 12); assert.equal(playerQuery.where.status, "ACTIVE"); assert.equal(playerQuery.where.player.status, "ACTIVE");
});

test("squad candidate endpoint denies foreign registrations before reading memberships", async () => {
  let membershipRead = false; const restores = [replace(prisma.competitionRegistration, "findFirst", async () => null), replace(prisma.teamPlayer, "findMany", async () => { membershipRead = true; return []; })]; const res = response(); await competitionSquadCandidates({ user: ownerA, params: { registration_id: "900" } }, res, (error) => { throw error; }); restores.reverse().forEach((restore) => restore()); assert.equal(res.result.statusCode, 404); assert.equal(membershipRead, false);
});

test("shared squad route guard returns not found for a Team Owner's foreign registration", async () => {
  const restores = [replace(prisma.competitionRegistration, "findFirst", async () => null)]; const res = response(); let nextCalled = false; await requireOwnedRegistrationForSquad({ user: ownerA, params: { registration_id: "900" } }, res, () => { nextCalled = true; }); restores.reverse().forEach((restore) => restore()); assert.equal(res.result.statusCode, 404); assert.equal(nextCalled, false);
});

test("existing squad workflow accepts an exact-team active player and atomically replaces the squad", async () => {
  let deleted = false; let created; const restores = [replace(prisma.competitionRegistration, "findUnique", async () => ownedRegistration()), replace(prisma.teamPlayer, "findMany", async () => [{ player_id: 41 }]), replace(prisma, "$transaction", async (callback) => callback({ competitionPlayer: { deleteMany: async () => { deleted = true; }, createMany: async ({ data }) => { created = data; } } }))]; const res = response(); await updateRegistrationSquad({ user: ownerA, params: { registration_id: "512" }, body: { player_ids: [41] } }, res, (error) => { throw error; }); restores.reverse().forEach((restore) => restore()); assert.equal(res.result.statusCode, 200); assert.equal(deleted, true); assert.deepEqual(created.map((item) => item.player_id), [41]); assert.equal(created[0].registration_id, 512);
});

test("existing squad workflow rejects wrong-team, foreign, inactive, duplicate, and over-limit selections without partial mutation", async () => {
  const invalid = async ({ registration = ownedRegistration(), player_ids, validPlayers = [] }) => { let deleted = false; const restores = [replace(prisma.competitionRegistration, "findUnique", async () => registration), replace(prisma.teamPlayer, "findMany", async () => validPlayers), replace(prisma, "$transaction", async (callback) => callback({ competitionPlayer: { deleteMany: async () => { deleted = true; }, createMany: async () => {} } }))]; const res = response(); await updateRegistrationSquad({ user: ownerA, params: { registration_id: "512" }, body: { player_ids } }, res, (error) => { throw error; }); restores.reverse().forEach((restore) => restore()); return { res, deleted }; };
  const wrongOwnedTeam = await invalid({ player_ids: [42] }); const foreignPlayer = await invalid({ player_ids: [61] }); const inactiveMembership = await invalid({ player_ids: [43] }); const duplicate = await invalid({ player_ids: [41, 41] }); const overLimit = await invalid({ player_ids: [41, 42, 43] }); const foreignRegistration = await invalid({ registration: { ...ownedRegistration(), team: { owner_id: 202, club: { owner_id: 202 } } }, player_ids: [41] });
  for (const item of [wrongOwnedTeam, foreignPlayer, inactiveMembership, duplicate, overLimit, foreignRegistration]) { assert.ok([400, 403].includes(item.res.result.statusCode)); assert.equal(item.deleted, false); }
});
