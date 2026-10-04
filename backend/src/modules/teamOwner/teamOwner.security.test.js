import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { dashboard, myTeam, players, playerDetail, registrations, payments } from "./teamOwner.controller.js";

const ownerA = { user_id: 101, name: "Owner A", role: ROLES.TEAM_OWNER, status: USER_STATUS.ACTIVE };
const ownerB = { user_id: 202, name: "Owner B", role: ROLES.TEAM_OWNER, status: USER_STATUS.ACTIVE };
const teamA = { team_id: 11, name: "Team A", logo: null, gender: "MEN", team_type: "SENIOR", status: "ACTIVE", city: "Hunza", description: null, created_at: new Date("2026-01-01"), club: { name: "Club A" }, home_venue: { name: "Ground A" } };
const teamASecond = { ...teamA, team_id: 12, name: "Team A Reserve" };
const teamB = { team_id: 22, name: "Team B", logo: null, gender: "MEN", team_type: "SENIOR", status: "ACTIVE", city: "Gilgit", description: null, created_at: new Date("2026-01-02"), club: { name: "Club B" }, home_venue: { name: "Ground B" } };
const membershipA = { team_player_id: 301, jersey_number: 7, status: "ACTIVE", joined_at: new Date("2026-01-03"), team: { team_id: 11, name: "Team A" }, player: { player_id: 401, name: "Player A", profile_photo: null, position: "FWD", gender: "MALE", registration_number: "HPL-A" } };
const membershipB = { team_player_id: 302, jersey_number: 19, status: "ACTIVE", joined_at: new Date("2026-01-04"), team: { team_id: 22, name: "Team B" }, player: { player_id: 402, name: "Player B", profile_photo: null, position: "MID", gender: "MALE", registration_number: "HPL-B" } };
const registrationA = { registration_id: 501, registration_status: "APPROVED", payment_status: "PAID", team: { name: "Team A" }, competition: { name: "Competition A" } };
const registrationB = { registration_id: 502, registration_status: "PENDING", payment_status: "UNPAID", team: { name: "Team B" }, competition: { name: "Competition B" } };
const paymentA = { payment_id: 601, amount: 2500, payment_status: "PAID", created_at: new Date("2026-01-05"), registration: { team: { name: "Team A" }, competition: { name: "Competition A" } } };
const paymentB = { payment_id: 602, amount: 3000, payment_status: "PENDING", created_at: new Date("2026-01-06"), registration: { team: { name: "Team B" }, competition: { name: "Competition B" } } };

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const next = (error) => { if (error) throw error; };
const ownerRequest = (overrides = {}) => ({ user: ownerA, query: {}, params: {}, ...overrides });

test("team-owner role matrix uses current authenticated role and denies missing authentication", async () => {
  const unauthenticated = response(); let unauthenticatedNext = false;
  await authenticate({ headers: {} }, unauthenticated, () => { unauthenticatedNext = true; });
  assert.equal(unauthenticatedNext, false); assert.equal(unauthenticated.result.statusCode, 401);
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.REFEREE, ROLES.SUPER_ADMIN]) {
    const res = response(); let allowed = false;
    authorize(ROLES.TEAM_OWNER)({ user: { role } }, res, () => { allowed = true; });
    assert.equal(allowed, false); assert.equal(res.result.statusCode, 403);
  }
  const allowed = response(); let allowedNext = false;
  authorize(ROLES.TEAM_OWNER)({ user: ownerA }, allowed, () => { allowedNext = true; });
  assert.equal(allowedNext, true); assert.equal(allowed.result.statusCode, 200);
});

test("authentication reloads the database user and blocks inactive or blocked team owners", async () => {
  const token = jwt.sign({ user_id: ownerA.user_id }, process.env.JWT_SECRET, { algorithm: "HS256" });
  for (const status of [USER_STATUS.ACTIVE, USER_STATUS.INACTIVE, USER_STATUS.BLOCKED]) {
    const restore = replace(prisma.user, "findUnique", async () => ({ ...ownerA, status }));
    const req = { headers: { authorization: `Bearer ${token}` } }; const res = response(); let called = false;
    await authenticate(req, res, () => { authorize(ROLES.TEAM_OWNER)(req, res, () => { called = true; }); });
    restore(); assert.equal(called, status === USER_STATUS.ACTIVE); assert.equal(res.result.statusCode, status === USER_STATUS.ACTIVE ? 200 : 403);
  }
  const staleRoleRestore = replace(prisma.user, "findUnique", async () => ({ ...ownerA, role: ROLES.USER, status: USER_STATUS.ACTIVE }));
  const staleRoleReq = { headers: { authorization: `Bearer ${token}` } }; const staleRoleRes = response(); let staleRoleAllowed = false;
  await authenticate(staleRoleReq, staleRoleRes, () => authorize(ROLES.TEAM_OWNER)(staleRoleReq, staleRoleRes, () => { staleRoleAllowed = true; }));
  staleRoleRestore(); assert.equal(staleRoleAllowed, false); assert.equal(staleRoleRes.result.statusCode, 403);
});

test("my-team ignores client team identifiers and always scopes Team.owner_id to the authenticated owner", async () => {
  let query; const restore = replace(prisma.team, "findMany", async (input) => { query = input; return [teamA]; });
  const res = response(); await myTeam(ownerRequest({ query: { team_id: String(teamB.team_id) } }), res, next); restore();
  assert.equal(res.result.statusCode, 200); assert.deepEqual(res.result.body.data.map((team) => team.team_id), [teamA.team_id]); assert.equal(query.where.owner_id, ownerA.user_id);
  const serialized = JSON.stringify(res.result.body.data); for (const secret of ["owner_id", "password", "token", "phone", "email"]) assert.equal(serialized.toLowerCase().includes(secret), false);
});

test("dashboard aggregates every team owned by the current owner and excludes foreign teams", async () => {
  const calls = []; const restores = [
    replace(prisma.team, "findMany", async (input) => { calls.push(input); return [teamA, teamASecond]; }),
    replace(prisma.teamPlayer, "count", async (input) => { calls.push(input); return 1; }),
    replace(prisma.competitionRegistration, "count", async (input) => { calls.push(input); return 1; }),
    replace(prisma.payment, "count", async (input) => { calls.push(input); return 1; }),
    replace(prisma.match, "count", async (input) => { calls.push(input); return 1; }),
    replace(prisma.match, "findMany", async (input) => { calls.push(input); return input.where.status === "SCHEDULED" ? [{ match_id: 701, match_date: new Date("2026-02-01"), home_team: { name: "Team A" }, away_team: { name: "Opponent" } }] : [{ match_id: 702, home_score: 2, away_score: 1, home_team: { name: "Team A" }, away_team: { name: "Opponent" } }]; }),
    replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
  ];
  const res = response(); await dashboard(ownerRequest(), res, next); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.deepEqual(res.result.body.data.teams.map((team) => team.team_id), [teamA.team_id, teamASecond.team_id]); assert.equal(res.result.body.data.counts.completed_matches, 1); assert.deepEqual(res.result.body.data.upcoming_matches.map((match) => match.match_id), [701]); assert.deepEqual(res.result.body.data.recent_results.map((match) => match.match_id), [702]);
  assert.equal(calls.every((call) => JSON.stringify(call).includes(String(teamA.team_id)) || call.where?.owner_id === ownerA.user_id), true);
  assert.equal(JSON.stringify(calls).includes(String(teamASecond.team_id)), true);
  assert.equal(JSON.stringify(calls).includes(String(teamB.team_id)), false);
});

test("inactive teams retain the existing read-only dashboard and profile behavior", async () => {
  const inactive = { ...teamA, status: "INACTIVE" }; const restores = [replace(prisma.team, "findMany", async () => [inactive]), replace(prisma.teamPlayer, "count", async () => 0), replace(prisma.competitionRegistration, "count", async () => 0), replace(prisma.payment, "count", async () => 0), replace(prisma.match, "count", async () => 0), replace(prisma.match, "findMany", async () => []), replace(prisma, "$transaction", async (operations) => Promise.all(operations))];
  const dashboardRes = response(); const profileRes = response(); await dashboard(ownerRequest(), dashboardRes, next); await myTeam(ownerRequest(), profileRes, next); restores.reverse().forEach((restore) => restore());
  assert.equal(dashboardRes.result.statusCode, 200); assert.equal(profileRes.result.statusCode, 200); assert.equal(profileRes.result.body.data[0].status, "INACTIVE");
});

test("player list keeps TeamPlayer membership scoped to the owner despite foreign query manipulation", async () => {
  let where; const restores = [replace(prisma.team, "findFirst", async (input) => input.where.team_id === teamA.team_id ? teamA : null), replace(prisma.teamPlayer, "findMany", async (input) => { where = input.where; return [membershipA]; }), replace(prisma.teamPlayer, "count", async () => 1), replace(prisma, "$transaction", async (operations) => Promise.all(operations))];
  const res = response(); await players(ownerRequest({ query: { page: "1", limit: "50", status: "INACTIVE", team_id: String(teamA.team_id), player_id: String(membershipB.player.player_id) } }), res, next); const foreign = response(); await players(ownerRequest({ query: { team_id: String(teamB.team_id) } }), foreign, next); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.equal(foreign.result.statusCode, 404); assert.equal(res.result.body.pagination.limit, 50); assert.deepEqual(res.result.body.data.map((item) => item.player.player_id), [membershipA.player.player_id]); assert.equal(where.team_id, teamA.team_id); assert.equal(where.status, "INACTIVE");
  const serialized = JSON.stringify(res.result.body.data); assert.equal(serialized.includes(String(membershipB.player.player_id)), false); assert.equal(serialized.toLowerCase().includes("phone"), false);
});

test("player detail prevents IDOR and returns only the TeamPlayer membership projection", async () => {
  let select; const restores = [replace(prisma.team, "findFirst", async (input) => input.where.team_id === teamA.team_id ? teamA : null), replace(prisma.teamPlayer, "findFirst", async (input) => { select = input.select; return input.where.player_id === membershipA.player.player_id && input.where.team_id === teamA.team_id ? membershipA : null; })];
  const own = response(); const foreign = response(); await playerDetail(ownerRequest({ params: { player_id: String(membershipA.player.player_id) }, query: { team_id: String(teamA.team_id) } }), own, next); await playerDetail(ownerRequest({ params: { player_id: String(membershipB.player.player_id) }, query: { team_id: String(teamB.team_id) } }), foreign, next); restores.reverse().forEach((restore) => restore());
  assert.equal(own.result.statusCode, 200); assert.equal(foreign.result.statusCode, 404); assert.equal(own.result.body.data.jersey_number, membershipA.jersey_number); assert.equal(own.result.body.data.status, membershipA.status); assert.equal(own.result.body.data.joined_at, membershipA.joined_at);
  const projection = JSON.stringify(select).toLowerCase(); for (const privateField of ["phone", "password", "token", "team_players", "memberships"]) assert.equal(projection.includes(privateField), false);
});

test("registration and payment lists retain owner scope and never return foreign records", async () => {
  let registrationWhere; let paymentWhere; const restores = [
    replace(prisma.competitionRegistration, "findMany", async (input) => { registrationWhere = input.where; return [registrationA]; }), replace(prisma.competitionRegistration, "count", async () => 1),
    replace(prisma.payment, "findMany", async (input) => { paymentWhere = input.where; return [paymentA]; }), replace(prisma.payment, "count", async () => 1), replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
  ];
  const registrationsRes = response(); const paymentsRes = response(); await registrations(ownerRequest({ query: { page: "1", limit: "20", team_id: String(teamB.team_id), competition_id: "900" } }), registrationsRes, next); await payments(ownerRequest({ query: { page: "1", limit: "20", team_id: String(teamB.team_id), competition_id: "900" } }), paymentsRes, next); restores.reverse().forEach((restore) => restore());
  assert.deepEqual(registrationsRes.result.body.data.map((item) => item.registration_id), [registrationA.registration_id]); assert.deepEqual(paymentsRes.result.body.data.map((item) => item.payment_id), [paymentA.payment_id]); assert.equal(registrationWhere.team.owner_id, ownerA.user_id); assert.equal(paymentWhere.registration.team.owner_id, ownerA.user_id);
  assert.equal(JSON.stringify(registrationsRes.result.body).includes(String(registrationB.registration_id)), false); assert.equal(JSON.stringify(paymentsRes.result.body).includes(String(paymentB.payment_id)), false);
});

test("team-owner list endpoints reject invalid pagination without exposing internal errors", async () => {
  for (const handler of [players, registrations, payments]) {
    for (const query of [{ page: "0" }, { page: "-1" }, { limit: "0" }, { limit: "51" }, { limit: "invalid" }]) {
      const res = response(); await handler(ownerRequest({ query }), res, next); assert.equal(res.result.statusCode, 400); assert.equal(JSON.stringify(res.result.body).toLowerCase().includes("prisma"), false);
    }
  }
});

test("all Team Owner read projections omit user secrets and unrelated relationship payloads", async () => {
  const calls = []; const restores = [
    replace(prisma.team, "findMany", async (input) => { calls.push(input.select); return [teamA]; }), replace(prisma.team, "findFirst", async () => teamA),
    replace(prisma.teamPlayer, "count", async () => 0), replace(prisma.competitionRegistration, "count", async () => 0), replace(prisma.payment, "count", async () => 0), replace(prisma.match, "count", async () => 0), replace(prisma.match, "findMany", async (input) => { calls.push(input.select); return []; }),
    replace(prisma.teamPlayer, "findMany", async (input) => { calls.push(input.select); return [membershipA]; }), replace(prisma.teamPlayer, "findFirst", async (input) => { calls.push(input.select); return membershipA; }), replace(prisma.competitionRegistration, "findMany", async (input) => { calls.push(input.select); return [registrationA]; }), replace(prisma.payment, "findMany", async (input) => { calls.push(input.select); return [paymentA]; }),
    replace(prisma.teamPlayer, "count", async () => 1), replace(prisma.competitionRegistration, "count", async () => 1), replace(prisma.payment, "count", async () => 1), replace(prisma, "$transaction", async (operations) => Promise.all(operations)),
  ];
  await dashboard(ownerRequest(), response(), next); await myTeam(ownerRequest(), response(), next); await players(ownerRequest({ query: { team_id: "11" } }), response(), next); await playerDetail(ownerRequest({ params: { player_id: "401" }, query: { team_id: "11" } }), response(), next); await registrations(ownerRequest(), response(), next); await payments(ownerRequest(), response(), next);
  restores.reverse().forEach((restore) => restore()); const serialized = JSON.stringify(calls).toLowerCase();
  for (const privateField of ["password", "token", "reset", "owner", "registered_user", "approval_history"]) assert.equal(serialized.includes(privateField), false);
});
