import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { getAdminNews, getAdminNewsById } from "./news.admin.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const swap = (object, key, value) => { const original = object[key]; object[key] = value; return () => { object[key] = original; }; };

test("admin news endpoints reject every non-super-admin role", () => {
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER, ROLES.REFEREE]) { const res = response(); let allowed = false; authorize(ROLES.SUPER_ADMIN)({ user: { role } }, res, () => { allowed = true; }); assert.equal(allowed, false); assert.equal(res.result.statusCode, 403); }
});

test("admin news list has bounded filtered newest-first safe projection", async () => {
  let argumentsUsed; const restores = [swap(prisma.news, "findMany", async (args) => { argumentsUsed = args; return [{ news_id: 1, title: "Roundup", status: "DRAFT", author: { user_id: 2, name: "Admin" } }]; }), swap(prisma.news, "count", async () => 1), swap(prisma.news, "groupBy", async () => [{ status: "DRAFT", _count: { _all: 1 } }]), swap(prisma, "$transaction", async (queries) => Promise.all(queries))];
  const res = response(); await getAdminNews({ query: { page: "1", limit: "20", q: "Round", status: "DRAFT", category: "Matchday" } }, res, () => {}); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.equal(argumentsUsed.take, 20); assert.equal(argumentsUsed.where.status, "DRAFT"); assert.equal(argumentsUsed.where.category, "Matchday"); assert.deepEqual(argumentsUsed.orderBy[0], { created_at: "desc" }); assert.equal("content" in argumentsUsed.select, false); assert.equal(res.result.body.summary.DRAFT, 1);
  const bad = response(); await getAdminNews({ query: { limit: "51" } }, bad, () => {}); assert.equal(bad.result.statusCode, 400);
});

test("admin news detail rejects invalid identifiers before querying", async () => { const res = response(); await getAdminNewsById({ params: { news_id: "zero" } }, res, () => {}); assert.equal(res.result.statusCode, 400); });
