import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { getAdminAuditLogById, getAdminAuditLogs, sanitizeAuditDetails } from "./auditLog.admin.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const swap = (object, key, value) => { const original = object[key]; object[key] = value; return () => { object[key] = original; }; };

test("audit admin access rejects every non-super-admin role", () => {
  for (const role of [ROLES.USER, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER, ROLES.REFEREE]) { const res = response(); let allowed = false; authorize(ROLES.SUPER_ADMIN)({ user: { role } }, res, () => { allowed = true; }); assert.equal(allowed, false); assert.equal(res.result.statusCode, 403); }
});

test("audit list is bounded, filtered, newest-first and does not return raw details", async () => {
  let findArgs; const restores = [swap(prisma.auditLog, "findMany", async (args) => { findArgs = args; return [{ audit_id: 9, action: "MATCH_COMPLETED", entity_type: "MATCH", entity_id: 4, details: { password: "hidden", score: "2-1" }, created_at: new Date(), actor: { user_id: 1, name: "Admin", email: "admin@hpl.test" } }]; }), swap(prisma.auditLog, "count", async () => 1), swap(prisma, "$transaction", async (queries) => Promise.all(queries))];
  const res = response(); await getAdminAuditLogs({ query: { page: "1", limit: "20", action: "MATCH_COMPLETED", actor_id: "1", entity_type: "MATCH", date_from: "2026-10-01", date_to: "2026-10-04" } }, res, () => {}); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.equal(findArgs.take, 20); assert.equal(findArgs.where.action, "MATCH_COMPLETED"); assert.equal(findArgs.where.actor_user_id, 1); assert.equal(findArgs.where.entity_type, "MATCH"); assert.deepEqual(findArgs.orderBy[0], { created_at: "desc" }); assert.equal("details" in res.result.body.data[0], false); assert.match(res.result.body.data[0].details_preview, /REDACTED/);
  const bad = response(); await getAdminAuditLogs({ query: { limit: "51" } }, bad, () => {}); assert.equal(bad.result.statusCode, 400);
});

test("audit metadata redaction is recursive for objects and arrays", () => {
  const data = sanitizeAuditDetails({ password: "a", nested: { access_token: "b", safe: "yes" }, values: [{ cookie: "c" }, { score: 2 }], phone: "0300" });
  assert.equal(data.password, "[REDACTED]"); assert.equal(data.nested.access_token, "[REDACTED]"); assert.equal(data.nested.safe, "yes"); assert.equal(data.values[0].cookie, "[REDACTED]"); assert.equal(data.values[1].score, 2); assert.equal(data.phone, "[REDACTED]");
});

test("audit detail rejects malformed IDs and mutation routes are absent", async () => {
  const res = response(); await getAdminAuditLogById({ params: { audit_id: "0" } }, res, () => {}); assert.equal(res.result.statusCode, 400);
  const routes = readFileSync(new URL("./auditLog.routes.js", import.meta.url), "utf8"); assert.equal(/router\.(post|patch|put|delete)\s*\(/.test(routes), false);
});
