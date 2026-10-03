import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { authorizeMatchOfficial } from "./refereeAssignment.middleware.js";
import { getMyMatchWorkspace } from "./referee.advanced.controller.js";
import { getPublicReferee } from "./referee.public.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };

test("non-referee roles cannot pass match-official authorization", async (t) => {
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER]) {
    const res = response(); let called = false;
    await authorizeMatchOfficial({ user: { role, user_id: 9 }, params: { match_id: "3" }, body: {} }, res, () => { called = true; });
    assert.equal(called, false); assert.equal(res.result.statusCode, 403);
  }
});

test("assigned referee identity comes from the authenticated user, not client input", async (t) => {
  const restoreReferee = replace(prisma.referee, "findFirst", async () => ({ referee_id: 4 }));
  const restoreMatch = replace(prisma.match, "findUnique", async () => ({ referee_id: 4 }));
  const res = response(); let called = false;
  await authorizeMatchOfficial({ user: { role: ROLES.REFEREE, user_id: 77 }, params: { match_id: "12" }, body: { referee_id: 999 } }, res, () => { called = true; });
  assert.equal(called, true); assert.equal(res.result.statusCode, 200);
  restoreReferee(); restoreMatch();
});

test("a referee cannot operate another referee's match", async (t) => {
  const restoreReferee = replace(prisma.referee, "findFirst", async () => ({ referee_id: 4 }));
  const restoreMatch = replace(prisma.match, "findUnique", async () => ({ referee_id: 5 }));
  const res = response(); let called = false;
  await authorizeMatchOfficial({ user: { role: ROLES.REFEREE, user_id: 77 }, params: { match_id: "12" }, body: {} }, res, () => { called = true; });
  assert.equal(called, false); assert.equal(res.result.statusCode, 403);
  restoreReferee(); restoreMatch();
});

test("Super Admin retains match-official authority", async () => {
  const res = response(); let called = false;
  await authorizeMatchOfficial({ user: { role: ROLES.SUPER_ADMIN, user_id: 1 }, params: { match_id: "12" }, body: {} }, res, () => { called = true; });
  assert.equal(called, true);
});

test("workspace returns 403 before loading private operations for another referee", async (t) => {
  const restoreReferee = replace(prisma.referee, "findFirst", async () => ({ referee_id: 4, name: "Assigned" }));
  const restoreMatch = replace(prisma.match, "findUnique", async () => ({ referee_id: 5 }));
  const res = response();
  await getMyMatchWorkspace({ user: { user_id: 77 }, params: { match_id: "12" } }, res, () => { throw new Error("unexpected error"); });
  assert.equal(res.result.statusCode, 403); assert.equal(res.result.body.success, false);
  restoreReferee(); restoreMatch();
});

test("public referee profile never serializes private referee or evaluator fields", async (t) => {
  const restores = [replace(prisma.referee, "findFirst", async () => ({ referee_id: 4, name: "Official", profile_photo: null, region: "Hunza", district: null, city: "Karimabad" })), replace(prisma.match, "count", async () => 2), replace(prisma.match, "findMany", async () => [{ competition_id: 1 }]), replace(prisma.refereeRanking, "findUnique", async () => null), replace(prisma, "$transaction", async (operations) => Promise.all(operations))];
  const res = response();
  await getPublicReferee({ params: { referee_id: "4" } }, res, () => { throw new Error("unexpected error"); });
  const serialized = JSON.stringify(res.result.body.data);
  for (const field of ["phone", "license_number", "email", "password_hash", "evaluator", "user_id"]) assert.equal(serialized.includes(field), false);
  assert.equal(res.result.body.data.ranking, null);
  restores.forEach((restore) => restore());
});

test("role middleware denies an unlinked normal user from referee-only APIs", () => {
  const res = response(); let called = false;
  authorize(ROLES.REFEREE)({ user: { role: ROLES.USER } }, res, () => { called = true; });
  assert.equal(called, false); assert.equal(res.result.statusCode, 403);
});
