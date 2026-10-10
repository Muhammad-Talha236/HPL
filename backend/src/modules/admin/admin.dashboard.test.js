import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { getAdminDashboard } from "./admin.controller.js";

const response = () => {
  const result = { statusCode: 200, body: null };
  return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } };
};

const replace = (target, key, value) => {
  const original = target[key];
  target[key] = value;
  return () => { target[key] = original; };
};

test("dashboard returns a safe, calendar-complete overview from bounded queries", async () => {
  const restores = [
    replace(prisma.user, "count", async () => 12),
    replace(prisma.team, "count", async () => 4),
    replace(prisma.player, "count", async () => 9),
    replace(prisma.season, "count", async () => 2),
    replace(prisma.team, "groupBy", async () => [{ status: "ACTIVE", _count: { _all: 3 } }, { status: "INACTIVE", _count: { _all: 1 } }]),
    replace(prisma.user, "findMany", async (input) => input.select.user_id ? [{ user_id: 7, name: "Admin", email: "admin@example.test", role: "SUPER_ADMIN", status: "ACTIVE", profile_image: null, created_at: new Date("2026-01-12T00:00:00Z") }] : [{ created_at: new Date("2026-01-04T00:00:00Z") }, { created_at: new Date("2026-01-12T00:00:00Z") }]),
    replace(prisma.competitionRegistration, "findMany", async () => [{ registration_id: 2, registration_status: "PENDING", registration_date: new Date("2026-01-20T00:00:00Z"), team: { team_id: 3, name: "Team", logo: null }, competition: { competition_id: 4, name: "Cup" }, registered_user: { user_id: 7, name: "Admin" } }]),
    replace(prisma.match, "findMany", async () => [{ match_id: 5, match_date: new Date("2026-01-22T00:00:00Z"), start_time: new Date("1970-01-01T10:00:00Z"), status: "SCHEDULED", home_score: 0, away_score: 0, home_team: { team_id: 1, name: "Home", logo: null }, away_team: { team_id: 2, name: "Away", logo: null }, competition: { competition_id: 4, name: "Cup" }, venue: { venue_id: 1, name: "Ground" } }]),
  ];
  try {
    const res = response();
    await getAdminDashboard({ query: { year: "2026" } }, res, (error) => { throw error; });
    const data = res.result.body.data;
    assert.equal(res.result.statusCode, 200);
    assert.equal(data.summary.users.total, 12);
    assert.equal(data.user_registration_trend.months.length, 12);
    assert.equal(data.user_registration_trend.months[0].count, 2);
    assert.equal(data.team_statuses.reduce((total, item) => total + item.count, 0), 4);
    assert.equal(data.recent_matches[0].venue.name, "Ground");
    assert.equal(JSON.stringify(data).includes("password_hash"), false);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("dashboard rejects invalid trend years before querying data", async () => {
  const res = response();
  await getAdminDashboard({ query: { year: "not-a-year" } }, res, () => {});
  assert.equal(res.result.statusCode, 400);
  assert.equal(res.result.body.success, false);
});
