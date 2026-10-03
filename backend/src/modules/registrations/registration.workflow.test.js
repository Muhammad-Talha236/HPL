import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { createRegistration, reviewRegistration } from "./registration.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const future = (days) => { const date = new Date(); date.setUTCDate(date.getUTCDate() + days); return date; };

test("registration derives registered_by from authenticated owner and ignores request spoofing", async () => {
  let created;
  const tx = { competition: { findUnique: async () => ({ competition_id: 2, name: "Cup", gender: "MALE", status: "ACTIVE", max_teams: 4, registration_start_date: future(-2), registration_end_date: future(3), competition_start_date: future(8), season: { season_id: 1, status: "ACTIVE" } }) }, team: { findUnique: async () => ({ team_id: 9, gender: "MALE", status: "ACTIVE", owner_id: 41, club: { owner_id: 41 } }) }, competitionRegistration: { findUnique: async () => null, count: async () => 0, create: async ({ data }) => { created = data; return { registration_id: 18, ...data, competition: { name: "Cup", gender: "MALE" }, team: { name: "Team", gender: "MALE" } }; } } };
  const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const restoreAudit = replace(prisma.auditLog, "create", async () => ({})); const res = response(); await createRegistration({ body: { competition_id: 2, team_id: 9, registered_by: 999 }, user: { user_id: 41, role: ROLES.TEAM_OWNER } }, res); restore(); restoreAudit();
  assert.equal(res.result.statusCode, 201); assert.equal(created.registered_by, 41); assert.notEqual(created.registered_by, 999);
});

test("registration rejects ownership bypass, gender mismatch, and a started competition", async () => {
  const makeTx = (competition, team) => ({ competition: { findUnique: async () => competition }, team: { findUnique: async () => team }, competitionRegistration: { findUnique: async () => null, count: async () => 0 } });
  const activeCompetition = { competition_id: 2, gender: "MALE", status: "ACTIVE", max_teams: 4, registration_start_date: future(-2), registration_end_date: future(3), competition_start_date: future(8), season: { status: "ACTIVE" } };
  const controlled = { team_id: 9, gender: "MALE", status: "ACTIVE", owner_id: 41, club: { owner_id: 41 } };
  for (const [competition, team, expected] of [[activeCompetition, { ...controlled, owner_id: 90, club: { owner_id: 90 } }, 403], [activeCompetition, { ...controlled, gender: "FEMALE" }, 400], [{ ...activeCompetition, competition_start_date: future(-1) }, controlled, 400]]) { const restore = replace(prisma, "$transaction", async (callback) => callback(makeTx(competition, team))); const res = response(); await createRegistration({ body: { competition_id: 2, team_id: 9 }, user: { user_id: 41, role: ROLES.TEAM_OWNER } }, res); restore(); assert.equal(res.result.statusCode, expected); }
});

test("approval rechecks approved capacity inside its transaction", async () => {
  const restoreFind = replace(prisma.competitionRegistration, "findUnique", async () => ({ registration_id: 3, competition_id: 2, team_id: 9, registration_status: "PENDING", payment_status: "PAID" }));
  const tx = { competition: { findUnique: async () => ({ status: "ACTIVE", max_teams: 1, competition_start_date: future(4) }) }, competitionRegistration: { count: async () => 1 } };
  const restoreTx = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await reviewRegistration({ params: { registration_id: "3" }, body: { action: "APPROVE" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, res); restoreFind(); restoreTx(); assert.equal(res.result.statusCode, 409);
});
