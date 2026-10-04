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

test("match admin detail rejects malformed IDs before querying", async () => {
  const res = response(); await getAdminMatchById({ params: { match_id: "0" } }, res, () => {}); assert.equal(res.result.statusCode, 400);
});
