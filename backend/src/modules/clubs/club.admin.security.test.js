import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { getAdminClubs, getAdminClubById } from "./club.admin.controller.js";
import { createClub, updateClub, transferClubOwnership, deactivateClub, activateClub } from "./club.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const next = (error) => { if (error) throw error; };
const owner = { user_id: 2, name: "Club Owner", email: "owner@example.com", role: ROLES.CLUB_OWNER, status: "ACTIVE" };
const club = { club_id: 3, owner_id: 2, name: "Hunza FC", logo: null, region: "Hunza", district: "Hunza", city: "Karimabad", status: "ACTIVE", created_at: new Date(), updated_at: new Date() };

test("only SUPER_ADMIN passes admin club authorization", () => {
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER, ROLES.REFEREE]) { const res = response(); let called = false; authorize(ROLES.SUPER_ADMIN)({ user: { role } }, res, () => { called = true; }); assert.equal(called, false); assert.equal(res.result.statusCode, 403); }
});

test("admin club list uses bounded server pagination, search/filter and safe owner projection", async () => {
  let args; const restores = [replace(prisma.club, "findMany", async (input) => { args = input; return [{ ...club, owner, _count: { teams: 2 } }]; }), replace(prisma.club, "count", async () => 1), replace(prisma, "$transaction", async (ops) => Promise.all(ops))];
  const res = response(); await getAdminClubs({ query: { page: "2", limit: "20", q: "Hunza", status: "ACTIVE", owner_id: "2" } }, res, next); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.data[0].team_count, 2); assert.equal(args.where.name.contains, "Hunza"); assert.equal(args.orderBy[1].club_id, "desc"); const projection = JSON.stringify(args.select); for (const field of ["password", "token", "secret"]) assert.equal(projection.toLowerCase().includes(field), false);
  const bad = response(); await getAdminClubs({ query: { limit: "51" } }, bad, next); assert.equal(bad.result.statusCode, 400);
});

test("admin club detail is bounded, relation-scoped and handles invalid or missing clubs", async () => {
  const invalid = response(); await getAdminClubById({ params: { club_id: "bad" } }, invalid, next); assert.equal(invalid.result.statusCode, 400);
  let select; const restore = replace(prisma.club, "findUnique", async (args) => { select = args.select; return { ...club, description: null, contact_email: null, contact_phone: null, representative_name: null, owner, _count: { teams: 1 }, teams: [{ team_id: 8, name: "Hunza Team", gender: "MALE", team_type: "CLUB", status: "ACTIVE" }] }; }); const res = response(); await getAdminClubById({ params: { club_id: "3" } }, res, next); restore();
  assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.data.teams[0].team_id, 8); assert.equal(select.teams.take, 50); assert.equal(JSON.stringify(res.result.body.data).includes("password_hash"), false);
  const missingRestore = replace(prisma.club, "findUnique", async () => null); const missing = response(); await getAdminClubById({ params: { club_id: "3" } }, missing, next); missingRestore(); assert.equal(missing.result.statusCode, 404);
});

test("admin club creation verifies eligible owner and writes an audit record", async () => {
  let audit; const restores = [replace(prisma.user, "findUnique", async () => owner), replace(prisma.club, "findFirst", async () => null), replace(prisma.club, "create", async ({ data }) => ({ ...club, ...data })), replace(prisma.auditLog, "create", async ({ data }) => { audit = data; return {}; })]; const res = response(); await createClub({ body: { name: "Hunza FC", owner_id: 2 }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, res); restores.reverse().forEach((restore) => restore()); assert.equal(res.result.statusCode, 201); assert.equal(res.result.body.data.owner_id, 2); assert.equal(audit.action, "CLUB_CREATED");
  const noOwner = response(); const restoreMissing = replace(prisma.user, "findUnique", async () => null); await createClub({ body: { name: "X", owner_id: 22 }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, noOwner); restoreMissing(); assert.equal(noOwner.result.statusCode, 404);
});

test("club update never changes owner, status actions retain record, and audit actions are emitted", async () => {
  let reads = 0; const audits = []; const restores = [replace(prisma.club, "findUnique", async () => { reads += 1; return reads === 3 ? { ...club, status: "INACTIVE" } : club; }), replace(prisma.club, "update", async ({ data }) => ({ ...club, ...data })), replace(prisma.auditLog, "create", async ({ data }) => { audits.push(data.action); return {}; })]; const edit = response(); await updateClub({ params: { club_id: "3" }, body: { name: "Updated", owner_id: 99 }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, edit); const inactive = response(); await deactivateClub({ params: { club_id: "3" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, inactive); const active = response(); await activateClub({ params: { club_id: "3" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, active); restores.reverse().forEach((restore) => restore()); assert.equal(edit.result.body.data.owner_id, 2); assert.deepEqual(audits, ["CLUB_UPDATED", "CLUB_DEACTIVATED", "CLUB_ACTIVATED"]);
});

test("ownership transfer is transactional, preserves roles and audits safe IDs", async () => {
  let txUsed = false; let audit; const newOwner = { ...owner, user_id: 9 }; const restores = [replace(prisma.club, "findUnique", async () => club), replace(prisma.user, "findUnique", async () => newOwner), replace(prisma, "$transaction", async (callback) => { txUsed = true; return callback({ club: { updateMany: async () => ({ count: 1 }), findUnique: async () => ({ ...club, owner_id: 9 }) } }); }), replace(prisma.auditLog, "create", async ({ data }) => { audit = data; return {}; })]; const res = response(); await transferClubOwnership({ params: { club_id: "3" }, body: { owner_id: 9 }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, res); restores.reverse().forEach((restore) => restore()); assert.equal(res.result.statusCode, 200); assert.equal(txUsed, true); assert.equal(res.result.body.data.owner_id, 9); assert.equal(audit.action, "CLUB_OWNERSHIP_TRANSFERRED"); assert.deepEqual(audit.details, { old_owner_id: 2, new_owner_id: 9 });
});
