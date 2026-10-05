import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validationResult } from "express-validator";
import prisma from "../../database/prisma.js";
import { deleteNotification, getNotificationById, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "./notification.controller.js";
import { notificationListValidation } from "./notification.validation.js";

const userA = { user_id: 71, role: "USER" };
const userB = { user_id: 72, role: "USER" };
const notification = (notification_id, user_id, is_read = false) => ({ notification_id, user_id, title: `Notice ${notification_id}`, message: `Message ${notification_id}`, notification_type: "ACCOUNT", reference_type: null, reference_id: null, is_read, created_at: new Date(`2026-10-0${notification_id}T10:00:00.000Z`) });
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const runValidation = async (rules, query) => { const req = { query }; for (const rule of rules) await rule.run(req); return validationResult(req).array(); };

test("notification list scopes results to the authenticated user, paginates, filters, and exposes only safe fields", async () => {
  let listQuery; const countQueries = []; const records = [notification(1, userA.user_id), notification(2, userA.user_id, true)];
  const restores = [
    replace(prisma.notification, "findMany", async (input) => { listQuery = input; return records; }),
    replace(prisma.notification, "count", async (input) => { countQueries.push(input); return input.where.is_read === false ? 1 : 2; }),
  ];
  const res = response(); await getNotifications({ user: userA, query: { page: 2, limit: 10, status: "READ", user_id: String(userB.user_id) } }, res, () => {}); restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200); assert.deepEqual(listQuery.where, { user_id: userA.user_id, is_read: true }); assert.equal(listQuery.skip, 10); assert.equal(listQuery.take, 10); assert.deepEqual(listQuery.orderBy, [{ created_at: "desc" }, { notification_id: "desc" }]); assert.equal(countQueries[1].where.user_id, userA.user_id); assert.equal(res.result.body.pagination.total_pages, 1); assert.equal(res.result.body.unread_count, 1);
  const select = JSON.stringify(listQuery.select).toLowerCase(); for (const field of ["user", "email", "phone", "password", "token", "metadata"]) assert.equal(select.includes(field), false);
});

test("notification list validation rejects unsafe pagination and unsupported filters", async () => {
  for (const query of [{ page: "0" }, { page: "-1" }, { page: "nope" }, { limit: "0" }, { limit: "51" }, { limit: "wrong" }, { status: "PENDING" }, { user_id: "72" }]) {
    const errors = await runValidation(notificationListValidation, query); assert.ok(errors.length > 0, JSON.stringify(query));
  }
  assert.equal((await runValidation(notificationListValidation, { page: "1", limit: "20", status: "UNREAD" })).length, 0);
});

test("notification detail returns an owned notification and makes a foreign notification indistinguishable from missing", async () => {
  let query; const restore = replace(prisma.notification, "findFirst", async (input) => { query = input; return input.where.notification_id === 1 && input.where.user_id === userA.user_id ? { notification_id: 1, title: "Notice 1", message: "Message 1", notification_type: "ACCOUNT", reference_type: null, reference_id: null, is_read: false, created_at: new Date() } : null; });
  const own = response(); await getNotificationById({ user: userA, params: { notification_id: "1" } }, own, () => {});
  const foreign = response(); await getNotificationById({ user: userA, params: { notification_id: "4" } }, foreign, () => {}); restore();
  assert.equal(own.result.statusCode, 200); assert.equal(foreign.result.statusCode, 404); assert.equal(query.where.user_id, userA.user_id);
  const payload = JSON.stringify(own.result.body).toLowerCase(); for (const field of ["user_id", "password", "token", "email", "phone", "metadata"]) assert.equal(payload.includes(field), false);
});

test("mark read is owner-scoped, idempotent, and cannot mutate a foreign notification", async () => {
  const rows = new Map([[1, notification(1, userA.user_id)], [2, notification(2, userA.user_id, true)], [4, notification(4, userB.user_id)]]); let updateWhere;
  const restores = [
    replace(prisma.notification, "updateMany", async ({ where, data }) => { updateWhere = where; const row = rows.get(where.notification_id); if (!row || row.user_id !== where.user_id || (where.is_read === false && row.is_read)) return { count: 0 }; Object.assign(row, data); return { count: 1 }; }),
    replace(prisma.notification, "findFirst", async ({ where }) => { const row = rows.get(where.notification_id); return row?.user_id === where.user_id ? row : null; }),
  ];
  const unread = response(); await markNotificationAsRead({ user: userA, params: { notification_id: "1" }, body: { user_id: userB.user_id, title: "spoof" } }, unread, () => {});
  const alreadyRead = response(); await markNotificationAsRead({ user: userA, params: { notification_id: "2" } }, alreadyRead, () => {});
  const foreign = response(); await markNotificationAsRead({ user: userA, params: { notification_id: "4" } }, foreign, () => {}); restores.reverse().forEach((restore) => restore());
  assert.equal(unread.result.statusCode, 200); assert.equal(rows.get(1).is_read, true); assert.equal(alreadyRead.result.statusCode, 200); assert.equal(foreign.result.statusCode, 404); assert.equal(rows.get(4).is_read, false); assert.equal(updateWhere.user_id, userA.user_id);
});

test("mark all read changes only the authenticated user's unread records", async () => {
  const rows = [notification(1, userA.user_id), notification(2, userA.user_id, true), notification(3, userA.user_id), notification(4, userB.user_id)]; let updateWhere;
  const restore = replace(prisma.notification, "updateMany", async ({ where, data }) => { updateWhere = where; const updated = rows.filter((row) => row.user_id === where.user_id && row.is_read === false); updated.forEach((row) => Object.assign(row, data)); return { count: updated.length }; });
  const res = response(); await markAllNotificationsAsRead({ user: userA, body: { user_id: userB.user_id } }, res, () => {}); restore();
  assert.equal(res.result.statusCode, 200); assert.equal(res.result.body.updated_count, 2); assert.deepEqual(updateWhere, { user_id: userA.user_id, is_read: false }); assert.deepEqual(rows.map((row) => row.is_read), [true, true, true, false]);
});

test("delete only removes the current user's chosen notification", async () => {
  const rows = [notification(1, userA.user_id), notification(2, userA.user_id, true), notification(3, userA.user_id), notification(4, userB.user_id)];
  const restore = replace(prisma.notification, "deleteMany", async ({ where }) => { const index = rows.findIndex((row) => row.notification_id === where.notification_id && row.user_id === where.user_id); if (index < 0) return { count: 0 }; rows.splice(index, 1); return { count: 1 }; });
  const owned = response(); await deleteNotification({ user: userA, params: { notification_id: "2" }, body: { user_id: userB.user_id } }, owned, () => {});
  const foreign = response(); await deleteNotification({ user: userA, params: { notification_id: "4" } }, foreign, () => {}); restore();
  assert.equal(owned.result.statusCode, 200); assert.equal(foreign.result.statusCode, 404); assert.deepEqual(rows.map((row) => row.notification_id), [1, 3, 4]);
});

test("notification routes, Navbar, and center retain USER-only account integration without a producer", async () => {
  const [routes, app, navbar, page, context, server] = await Promise.all([
    readFile(new URL("notification.routes.js", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/components/navigation/Navbar.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/notifications/pages/NotificationCenterPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/context/NotificationContext.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../server.js", import.meta.url), "utf8"),
  ]);
  assert.ok(routes.indexOf('"/read-all"') < routes.indexOf('"/:notification_id/read"'));
  assert.match(app, /path="\/account\/notifications"/); assert.match(navbar, /user\.role === "USER"[\s\S]{0,600}account\/notifications/); assert.match(page, /Delete notification\?/); assert.match(page, /MARK ALL AS READ/); assert.match(context, /user\?\.role !== "USER"/); assert.match(context, /unread_count/); assert.match(server, /app\.use\("\/api\/notifications", notificationRoutes\)/);
});
