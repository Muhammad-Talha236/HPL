import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { competitions } from "./teamOwner.controller.js";

const ownerA = { user_id: 101, role: ROLES.TEAM_OWNER };
const teamA = { team_id: 11, name: "Team A", gender: "MEN", status: "ACTIVE" };
const teamA2 = { team_id: 12, name: "Team A2", gender: "WOMEN", status: "ACTIVE" };
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const days = (number) => new Date(Date.now() + number * 86400000);
const competition = (overrides = {}) => ({ competition_id: 30, name: "Hunza Cup", gender: "MEN", format: "LEAGUE", registration_fee: 2500, registration_start_date: days(-1), registration_end_date: days(1), competition_start_date: days(8), competition_end_date: days(14), max_teams: 8, squad_size: 18, status: "ACTIVE", season: { season_id: 4, name: "2026", status: "ACTIVE" }, registrations: [], ...overrides });
const request = (team_id) => ({ user: ownerA, query: { team_id: String(team_id), page: "1", limit: "20" } });

function install({ owned = teamA, items = [competition()], counts = [] } = {}) {
  return [
    replace(prisma.team, "findFirst", async (input) => input.where.team_id === owned?.team_id && input.where.owner_id === ownerA.user_id ? owned : null),
    replace(prisma.competition, "findMany", async () => items),
    replace(prisma.competition, "count", async () => items.length),
    replace(prisma.competitionRegistration, "groupBy", async () => counts),
    replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
  ];
}

test("competition discovery permits an owner for the requested owned team and returns safe eligibility", async () => {
  const restores = install(); const res = response(); await competitions(request(teamA.team_id), res, (error) => { throw error; }); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.selected_team.team_id, teamA.team_id); assert.equal(res.result.body.data[0].eligibility.state, "ELIGIBLE");
  const payload = JSON.stringify(res.result.body); for (const privateField of ["owner_id", "password", "registered_by", "rejection_reason"]) assert.equal(payload.includes(privateField), false);
});

test("competition discovery returns not found when an owner requests another owner's team", async () => {
  const restores = install(); const res = response(); await competitions(request(99), res, (error) => { throw error; }); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 404); assert.equal(res.result.body.message, "Team not found");
});

test("competition discovery evaluates each owned team independently and reflects gender, registrations, and approved capacity", async () => {
  const first = install({ owned: teamA, items: [competition({ competition_id: 31, max_teams: 1 }), competition({ competition_id: 32, gender: "WOMEN" }), competition({ competition_id: 33, registrations: [{ registration_id: 701, registration_status: "PENDING", payment_status: "UNPAID" }] })], counts: [{ competition_id: 31, _count: { registration_id: 1 } }] });
  const one = response(); await competitions(request(teamA.team_id), one, (error) => { throw error; }); first.reverse().forEach((restore) => restore());
  assert.deepEqual(one.result.body.data.map((item) => item.eligibility.state), ["FULL", "GENDER_MISMATCH", "PENDING"]); assert.equal(one.result.body.data[2].registration_id, 701);
  const second = install({ owned: teamA2, items: [competition({ competition_id: 34, gender: "WOMEN" })] }); const two = response(); await competitions(request(teamA2.team_id), two, (error) => { throw error; }); second.reverse().forEach((restore) => restore());
  assert.equal(two.result.statusCode, 200); assert.equal(two.result.body.selected_team.team_id, teamA2.team_id); assert.equal(two.result.body.data[0].eligibility.state, "ELIGIBLE");
});

test("competition discovery rejects unsupported filters and does not let pending registrations consume approved capacity", async () => {
  const invalidRestores = install(); const invalid = response(); await competitions({ user: ownerA, query: { team_id: "11", status: "PENDING" } }, invalid, (error) => { throw error; }); invalidRestores.reverse().forEach((restore) => restore()); assert.equal(invalid.result.statusCode, 400);
  const pendingRestores = install({ items: [competition({ competition_id: 41, max_teams: 1 })], counts: [] }); const pending = response(); await competitions(request(teamA.team_id), pending, (error) => { throw error; }); pendingRestores.reverse().forEach((restore) => restore()); assert.equal(pending.result.statusCode, 200); assert.equal(pending.result.body.data[0].approved_teams, 0); assert.equal(pending.result.body.data[0].eligibility.state, "ELIGIBLE");
});
