import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { getAdminMatchById, getAdminMatches } from "./match.admin.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const swap = (object, key, value) => { const original = object[key]; object[key] = value; return () => { object[key] = original; }; };

test("match admin access rejects every non-super-admin role", () => {
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER, ROLES.REFEREE]) {
    const res = response(); let allowed = false;
    authorize(ROLES.SUPER_ADMIN)({ user: { role } }, res, () => { allowed = true; });
    assert.equal(allowed, false); assert.equal(res.result.statusCode, 403);
  }
});

test("match admin list bounds pagination and applies operational filters", async () => {
  let findArgs;
  const restores = [
    swap(prisma.match, "findMany", async (args) => { findArgs = args; return []; }),
    swap(prisma.match, "count", async () => 0),
    swap(prisma.match, "groupBy", async () => [{ status: "LIVE", _count: { _all: 2 } }]),
    swap(prisma, "$transaction", async (queries) => Promise.all(queries)),
  ];
  const res = response();
  await getAdminMatches({ query: { page: "1", limit: "20", status: "LIVE", competition_id: "4", team_id: "8", venue_id: "3", referee_id: "9", date_from: "2026-01-01", date_to: "2026-01-20" } }, res, () => {});
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.summary.LIVE, 2); assert.equal(findArgs.take, 20); assert.equal(findArgs.where.competition_id, 4); assert.equal(findArgs.where.venue_id, 3); assert.equal(findArgs.where.referee_id, 9); assert.deepEqual(findArgs.orderBy[0], { match_date: "desc" });
  const invalid = response(); await getAdminMatches({ query: { limit: "51" } }, invalid, () => {}); assert.equal(invalid.result.statusCode, 400);
});

test("match admin list accepts blank optional query filters from the admin page", async () => {
  let findArgs;
  const restores = [
    swap(prisma.match, "findMany", async (args) => { findArgs = args; return []; }),
    swap(prisma.match, "count", async () => 0),
    swap(prisma.match, "groupBy", async () => []),
  ];
  const res = response();
  await getAdminMatches({ query: { page: "1", limit: "20", q: "", status: "", competition_id: "", season_id: "", team_id: "", venue_id: "", referee_id: "", date_from: "", date_to: "" } }, res, () => {});
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200);
  assert.deepEqual(findArgs.where, {});
  assert.equal(res.result.body.pagination.total, 0);
});

test("match admin list returns the UI contract for scheduled fixtures", async () => {
  const match = { match_id: 44, status: "SCHEDULED", match_date: new Date("2026-11-01T00:00:00.000Z"), start_time: new Date("1970-01-01T14:30:00.000Z"), home_score: 0, away_score: 0, competition: { competition_id: 3, name: "HPL League", gender: "MEN" }, season: { season_id: 2, name: "2026" }, home_team: { team_id: 9, name: "Passu FC", logo: null }, away_team: { team_id: 10, name: "Gojal FC", logo: "https://cdn.example/logo.png" }, venue: { venue_id: 4, name: "Aliabad Ground", city: "Hunza" }, referee: { referee_id: 5, name: "Referee One", license_number: "HPL-R5" } };
  const restores = [
    swap(prisma.match, "findMany", async () => [match]),
    swap(prisma.match, "count", async () => 1),
    swap(prisma.match, "groupBy", async () => [{ status: "SCHEDULED", _count: { _all: 1 } }]),
  ];
  const res = response();
  await getAdminMatches({ query: { page: "1", limit: "20" } }, res, () => {});
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200);
  assert.equal(res.result.body.data[0].home_team.name, "Passu FC");
  assert.equal(res.result.body.data[0].away_team.logo, "https://cdn.example/logo.png");
  assert.equal(res.result.body.data[0].venue.name, "Aliabad Ground");
  assert.equal(res.result.body.pagination.total, 1);
  assert.equal(res.result.body.summary.SCHEDULED, 1);
});

test("match admin detail rejects malformed IDs before querying", async () => {
  const res = response(); await getAdminMatchById({ params: { match_id: "0" } }, res, () => {}); assert.equal(res.result.statusCode, 400);
});
