import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { getAdminUserById, getUsers, updateUserRole, deactivateUser, activateUser, blockUser } from "./user.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const next = (error) => { if (error) throw error; };
const safeUser = { user_id: 7, name: "Target User", email: "target@example.com", phone: "03001234567", profile_image: null, role: ROLES.USER, status: USER_STATUS.ACTIVE, created_at: new Date("2026-01-01"), updated_at: new Date("2026-01-02") };

test("admin-only authorization rejects every non-admin role and missing authentication", async () => {
  const noAuth = response(); let called = false;
  await authenticate({ headers: {} }, noAuth, () => { called = true; });
  assert.equal(called, false); assert.equal(noAuth.result.statusCode, 401);
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER, ROLES.REFEREE]) {
    const res = response(); let allowed = false;
    authorize(ROLES.SUPER_ADMIN)({ user: { role } }, res, () => { allowed = true; });
    assert.equal(allowed, false); assert.equal(res.result.statusCode, 403);
  }
});

test("real JWT authentication and role authorization permit only SUPER_ADMIN user-detail access", async () => {
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER, ROLES.REFEREE, ROLES.SUPER_ADMIN]) {
    const authenticated = { ...safeUser, user_id: 1, role };
    const restore = replace(prisma.user, "findUnique", async () => authenticated);
    const req = { headers: { authorization: `Bearer ${jwt.sign({ user_id: 1 }, process.env.JWT_SECRET, { algorithm: "HS256" })}` }, params: { user_id: "7" } };
    const res = response(); let allowed = false;
    await authenticate(req, res, () => { authorize(ROLES.SUPER_ADMIN)(req, res, () => { allowed = true; }); });
    restore();
    assert.equal(allowed, role === ROLES.SUPER_ADMIN);
    assert.equal(res.result.statusCode, role === ROLES.SUPER_ADMIN ? 200 : 403);
  }
});

test("admin detail is safe, scoped to the requested account, and does not select secrets", async () => {
  let capturedSelect;
  const detail = { ...safeUser, owned_clubs: [{ club_id: 3, name: "Hunza Club", status: "ACTIVE" }], owned_teams: [], referee_profile: null };
  const restore = replace(prisma.user, "findUnique", async (args) => { capturedSelect = args.select; assert.equal(args.where.user_id, 7); return detail; });
  const res = response(); await getAdminUserById({ params: { user_id: "7" } }, res, next); restore();
  assert.equal(res.result.statusCode, 200); assert.deepEqual(res.result.body.data.owned_clubs, detail.owned_clubs);
  const serialized = JSON.stringify(res.result.body.data); const selected = JSON.stringify(capturedSelect);
  for (const forbidden of ["password_hash", "password", "reset", "token", "jwt", "authorization", "secret"]) { assert.equal(serialized.toLowerCase().includes(forbidden), false); assert.equal(selected.toLowerCase().includes(forbidden), false); }
});

test("admin detail handles malformed IDs and missing accounts safely", async () => {
  const invalid = response(); await getAdminUserById({ params: { user_id: "not-an-id" } }, invalid, next); assert.equal(invalid.result.statusCode, 400);
  const restore = replace(prisma.user, "findUnique", async () => null); const missing = response(); await getAdminUserById({ params: { user_id: "99" } }, missing, next); restore(); assert.equal(missing.result.statusCode, 404);
});

test("admin detail returns a referee profile only for the target user", async () => {
  const restore = replace(prisma.user, "findUnique", async (args) => ({ ...safeUser, user_id: args.where.user_id, owned_clubs: [], owned_teams: [], referee_profile: { referee_id: 12, user_id: args.where.user_id, name: "Official", status: "ACTIVE" } }));
  const res = response(); await getAdminUserById({ params: { user_id: "44" } }, res, next); restore();
  assert.equal(res.result.body.data.user_id, 44); assert.equal(res.result.body.data.referee_profile.user_id, 44);
});

const roleRequest = async ({ current = { user_id: 7, role: ROLES.USER, _count: { owned_clubs: 0, owned_teams: 0 }, referee_profile: null }, requestedRole = ROLES.TEAM_OWNER, actor = { user_id: 1, role: ROLES.SUPER_ADMIN } } = {}) => {
  const restores = [replace(prisma.user, "findUnique", async () => ({ ...safeUser, user_id: 7, role: current.role })), replace(prisma, "$transaction", async (callback) => callback({ user: { findUnique: async () => current, count: async () => 2, updateMany: async () => ({ count: 1 }) } })), replace(prisma.auditLog, "create", async () => ({}))];
  const res = response(); await updateUserRole({ params: { user_id: "7" }, body: { role: requestedRole }, user: actor }, res, next); restores.reverse().forEach((restore) => restore()); return res;
};

test("safe SUPER_ADMIN role change preserves audit context", async () => {
  let audit;
  const current = { user_id: 7, role: ROLES.USER, _count: { owned_clubs: 0, owned_teams: 0 }, referee_profile: null };
  const restores = [replace(prisma.user, "findUnique", async () => ({ ...safeUser, role: ROLES.USER })), replace(prisma, "$transaction", async (callback) => callback({ user: { findUnique: async () => current, count: async () => 2, updateMany: async () => ({ count: 1 }) } })), replace(prisma.auditLog, "create", async ({ data }) => { audit = data; return {}; })];
  const res = response(); await updateUserRole({ params: { user_id: "7" }, body: { role: ROLES.REFEREE }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, res, next); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.deepEqual(audit.details, { old_role: ROLES.USER, new_role: ROLES.REFEREE }); assert.equal(audit.actor_user_id, 1);
});

test("role changes reject non-admins, self downgrade, and unsafe linked identities", async () => {
  const nonAdmin = response(); await updateUserRole({ params: { user_id: "7" }, body: { role: ROLES.USER }, user: { user_id: 2, role: ROLES.USER } }, nonAdmin, next); assert.equal(nonAdmin.result.statusCode, 403);
  const self = response(); const restoreSelf = replace(prisma.user, "findUnique", async () => ({ ...safeUser, user_id: 1, role: ROLES.SUPER_ADMIN })); await updateUserRole({ params: { user_id: "1" }, body: { role: ROLES.USER }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, self, next); restoreSelf(); assert.equal(self.result.statusCode, 400);
  for (const [current, nextRole, message] of [
    [{ user_id: 7, role: ROLES.CLUB_OWNER, _count: { owned_clubs: 1, owned_teams: 0 }, referee_profile: null }, ROLES.USER, "Transfer club ownership"],
    [{ user_id: 7, role: ROLES.TEAM_OWNER, _count: { owned_clubs: 0, owned_teams: 1 }, referee_profile: null }, ROLES.USER, "Transfer team ownership"],
    [{ user_id: 7, role: ROLES.REFEREE, _count: { owned_clubs: 0, owned_teams: 0 }, referee_profile: { referee_id: 2 } }, ROLES.USER, "linked referee profile"],
  ]) { const res = await roleRequest({ current, requestedRole: nextRole }); assert.equal(res.result.statusCode, 400); assert.match(res.result.body.message, new RegExp(message, "i")); }
});

test("status operations protect self-lockout and write their documented audit actions", async () => {
  const selfDeactivate = response(); await deactivateUser({ params: { user_id: "1" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, selfDeactivate, next); assert.equal(selfDeactivate.result.statusCode, 400);
  const selfBlock = response(); await blockUser({ params: { user_id: "1" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, selfBlock, next); assert.equal(selfBlock.result.statusCode, 400);
  const audits = []; const restores = [replace(prisma.user, "updateMany", async () => ({ count: 1 })), replace(prisma.user, "findUnique", async () => safeUser), replace(prisma.auditLog, "create", async ({ data }) => { audits.push(data.action); return {}; })];
  const deactivated = response(); await deactivateUser({ params: { user_id: "7" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, deactivated, next);
  const activated = response(); await activateUser({ params: { user_id: "7" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, activated, next);
  const blocked = response(); await blockUser({ params: { user_id: "7" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, blocked, next);
  restores.reverse().forEach((restore) => restore()); assert.equal(deactivated.result.statusCode, 200); assert.equal(activated.result.statusCode, 200); assert.equal(blocked.result.statusCode, 200); assert.deepEqual(audits, ["USER_DEACTIVATED", "USER_ACTIVATED", "USER_BLOCKED"]);
});

test("user list keeps bounded search, role filter, status filter, and pagination", async () => {
  let where; const restores = [replace(prisma.user, "findMany", async (args) => { where = args.where; return [safeUser]; }), replace(prisma.user, "count", async () => 1), replace(prisma, "$transaction", async (ops) => Promise.all(ops))];
  const res = response(); await getUsers({ user: { role: ROLES.SUPER_ADMIN }, query: { page: "2", limit: "20", q: "target", role: ROLES.USER, status: USER_STATUS.ACTIVE } }, res, next); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.pagination.page, 2); assert.equal(where.role, ROLES.USER); assert.equal(where.status, USER_STATUS.ACTIVE); assert.equal(where.OR[0].name.contains, "target");
  const bad = response(); await getUsers({ user: { role: ROLES.SUPER_ADMIN }, query: { limit: "51" } }, bad, next); assert.equal(bad.result.statusCode, 400);
});
