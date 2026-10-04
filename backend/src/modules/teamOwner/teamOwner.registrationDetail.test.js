import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { createRegistration } from "../registrations/registration.controller.js";
import { competitionRegistrationDetail } from "./teamOwner.controller.js";

const ownerA = { user_id: 101, role: ROLES.TEAM_OWNER };
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const future = (days) => new Date(Date.now() + days * 86400000);
const registration = (team_id = 11) => ({ registration_id: team_id + 600, team_id, registration_status: "APPROVED", payment_status: "PAID", registration_date: new Date("2026-09-01"), updated_at: new Date("2026-09-02"), team: { team_id, name: `Team ${team_id}`, gender: "MEN" }, competition: { competition_id: 5, name: "Hunza Cup", gender: "MEN", registration_fee: 2500, squad_size: 18, competition_start_date: future(6), competition_end_date: future(15), season: { season_id: 1, name: "2026" } }, payments: [{ amount: 2500, payment_status: "PAID", created_at: new Date("2026-09-02") }], players: [{ player_id: 41, player: { name: "Player One", registration_number: "HPL-41", position: "MID" } }] });

test("Team Owner registration detail permits both owned teams and preserves a safe payment and squad projection", async () => {
  let registrationQuery; let membershipQuery;
  const restores = [replace(prisma.competitionRegistration, "findFirst", async (input) => { registrationQuery = input; return registration(input.where.registration_id === 611 ? 11 : 12); }), replace(prisma.teamPlayer, "findMany", async (input) => { membershipQuery = input; return [{ player_id: 41, jersey_number: 9 }]; })];
  for (const id of [611, 612]) { const res = response(); await competitionRegistrationDetail({ user: ownerA, params: { registration_id: String(id) } }, res, (error) => { throw error; }); assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.data.team.team_id, id === 611 ? 11 : 12); assert.equal(res.result.body.data.payment.amount, 2500); assert.equal(res.result.body.data.squad[0].jersey_number, 9); const serialized = JSON.stringify(res.result.body); for (const field of ["password", "token", "registered_by", "owner_id", "transaction_reference", "payment_method"]) assert.equal(serialized.includes(field), false); }
  restores.reverse().forEach((restore) => restore()); assert.equal(registrationQuery.where.team.owner_id, ownerA.user_id); assert.equal(membershipQuery.where.team_id, 12); assert.deepEqual(membershipQuery.where.player_id.in, [41]);
});

test("Team Owner registration detail returns not found before payment or squad reads for a foreign registration", async () => {
  let membershipRead = false; const restores = [replace(prisma.competitionRegistration, "findFirst", async () => null), replace(prisma.teamPlayer, "findMany", async () => { membershipRead = true; return []; })]; const res = response(); await competitionRegistrationDetail({ user: ownerA, params: { registration_id: "999" } }, res, (error) => { throw error; }); restores.reverse().forEach((restore) => restore()); assert.equal(res.result.statusCode, 404); assert.equal(membershipRead, false);
});

test("existing registration creation workflow creates A1 and A2, derives registered_by, and rejects foreign and duplicate teams", async () => {
  let created = []; const activeCompetition = { competition_id: 5, name: "Cup", gender: "MEN", status: "ACTIVE", max_teams: 8, registration_start_date: future(-1), registration_end_date: future(2), competition_start_date: future(8), season: { season_id: 1, status: "ACTIVE" } };
  const run = async (team, existing = false, spoof = undefined) => { const tx = { competition: { findUnique: async () => activeCompetition }, team: { findUnique: async () => team }, competitionRegistration: { findUnique: async () => existing ? { registration_id: 71 } : null, count: async () => 0, create: async ({ data }) => { created.push(data); return { registration_id: 700 + team.team_id, ...data, competition: { name: "Cup", gender: "MEN" }, team: { name: team.name, gender: "MEN" } }; } } }; const restoreTx = replace(prisma, "$transaction", async (callback) => callback(tx)); const restoreAudit = replace(prisma.auditLog, "create", async () => ({})); const res = response(); await createRegistration({ user: ownerA, body: { competition_id: 5, team_id: team.team_id, ...(spoof ? { registered_by: spoof } : {}) } }, res); restoreAudit(); restoreTx(); return res; };
  const a1 = await run({ team_id: 11, name: "A1", gender: "MEN", status: "ACTIVE", owner_id: 101, club: { owner_id: 777 } }, false, 999); const a2 = await run({ team_id: 12, name: "A2", gender: "MEN", status: "ACTIVE", owner_id: 101, club: { owner_id: 777 } }); const foreign = await run({ team_id: 22, name: "B", gender: "MEN", status: "ACTIVE", owner_id: 202, club: { owner_id: 202 } }); const duplicate = await run({ team_id: 11, name: "A1", gender: "MEN", status: "ACTIVE", owner_id: 101, club: { owner_id: 777 } }, true);
  assert.equal(a1.result.statusCode, 201); assert.equal(a2.result.statusCode, 201); assert.equal(created[0].registered_by, ownerA.user_id); assert.equal(created[1].team_id, 12); assert.equal(foreign.result.statusCode, 403); assert.equal(duplicate.result.statusCode, 409);
});
