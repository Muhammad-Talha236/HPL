import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { validationResult } from "express-validator";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { changeMyPassword, login, updateMyProfile } from "./auth.controller.js";
import { changeMyPasswordValidation, updateMyProfileValidation } from "./auth.validation.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const account = { user_id: 41, name: "Amin Khan", email: "amin@example.test", phone: "03001234567", role: ROLES.USER, status: "ACTIVE", profile_image: null };
const runValidation = async (rules, body) => { const req = { body }; for (const rule of rules) await rule.run(req); return validationResult(req).array(); };

test("USER profile update binds exclusively to req.user and returns a safe authoritative projection", async () => {
  let updateInput; const restores = [
    replace(prisma.user, "update", async (input) => { updateInput = input; return { ...account, name: input.data.name, phone: input.data.phone, profile_image: input.data.profile_image }; }),
    replace(prisma.auditLog, "create", async () => ({})),
  ];
  const res = response();
  await updateMyProfile({ user: { user_id: account.user_id, role: ROLES.USER }, query: { user_id: "99" }, body: { user_id: 99, name: "  Amin Updated  ", phone: "03009998888", profile_image: "https://cdn.example.test/amin.jpg", role: ROLES.SUPER_ADMIN } }, res);
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 200);
  assert.equal(updateInput.where.user_id, account.user_id);
  assert.deepEqual(updateInput.data, { name: "Amin Updated", phone: "03009998888", profile_image: "https://cdn.example.test/amin.jpg" });
  assert.equal(updateInput.data.role, undefined);
  const payload = JSON.stringify(res.result.body).toLowerCase();
  for (const field of ["password", "token", "reset", "session"]) assert.equal(payload.includes(field), false);
});

test("profile validation rejects mass assignment, email mutation, and every requested role escalation", async () => {
  for (const role of [ROLES.SUPER_ADMIN, ROLES.TEAM_OWNER, ROLES.CLUB_OWNER]) {
    const errors = await runValidation(updateMyProfileValidation, { name: "Amin Khan", role, email: "other@example.test", user_id: 99, status: "INACTIVE", password_hash: "not-a-hash", created_at: "2026-01-01" });
    assert.ok(errors.some((error) => error.path === "_error" || error.msg === "Unexpected fields are not allowed"));
  }
});

test("profile validation follows the existing name, phone, and URL conventions", async () => {
  const valid = await runValidation(updateMyProfileValidation, { name: "Amin O'Khan", phone: "03001234567", profile_image: "https://cdn.example.test/avatar.jpg" });
  assert.equal(valid.length, 0);
  const invalid = await runValidation(updateMyProfileValidation, { name: " ", phone: "123", profile_image: "file:///avatar.jpg" });
  assert.ok(invalid.length >= 3);
});

test("unauthenticated account mutations and malformed password requests are rejected before mutation", async () => {
  const unauthenticated = response(); let nextCalled = false;
  await authenticate({ headers: {} }, unauthenticated, () => { nextCalled = true; });
  assert.equal(unauthenticated.result.statusCode, 401); assert.equal(nextCalled, false);
  const errors = await runValidation(changeMyPasswordValidation, { current_password: "Current1!", new_password: "Updated2@", confirm_password: "different", user_id: 99 });
  assert.ok(errors.some((error) => error.path === "confirm_password"));
  assert.ok(errors.some((error) => error.msg === "Unexpected fields are not allowed"));
});

test("valid password change rehashes only the authenticated account and new credentials replace old credentials", async () => {
  let stored = { ...account, password_hash: await bcrypt.hash("Current1!", 12) }; let updateInput; const restores = [
    replace(prisma.user, "findUnique", async ({ where }) => where.user_id === account.user_id || where.email === account.email ? stored : null),
    replace(prisma.user, "update", async (input) => { updateInput = input; stored = { ...stored, ...input.data }; return stored; }),
    replace(prisma.auditLog, "create", async () => ({})),
  ];
  const change = response();
  await changeMyPassword({ user: { user_id: account.user_id, role: ROLES.USER }, body: { current_password: "Current1!", new_password: "Updated2@", confirm_password: "Updated2@", user_id: 99 } }, change);
  const oldLogin = response(); await login({ body: { email: account.email, password: "Current1!" } }, oldLogin);
  const newLogin = response(); await login({ body: { email: account.email, password: "Updated2@" } }, newLogin);
  restores.reverse().forEach((restore) => restore());
  assert.equal(change.result.statusCode, 200);
  assert.equal(updateInput.where.user_id, account.user_id);
  assert.deepEqual(Object.keys(updateInput.data), ["password_hash"]);
  assert.equal(await bcrypt.compare("Current1!", stored.password_hash), false);
  assert.equal(await bcrypt.compare("Updated2@", stored.password_hash), true);
  assert.equal(oldLogin.result.statusCode, 401);
  assert.equal(newLogin.result.statusCode, 200);
  const payload = JSON.stringify(change.result.body).toLowerCase();
  for (const field of ["password", "hash", "token", "reset", "session"]) assert.equal(payload.includes(field), false);
});

test("wrong current password leaves the stored hash and audit trail unchanged", async () => {
  const password_hash = await bcrypt.hash("Current1!", 12); let updated = false; let audited = false; const restores = [
    replace(prisma.user, "findUnique", async () => ({ user_id: account.user_id, password_hash })),
    replace(prisma.user, "update", async () => { updated = true; }),
    replace(prisma.auditLog, "create", async () => { audited = true; }),
  ];
  const res = response(); await changeMyPassword({ user: { user_id: account.user_id }, body: { current_password: "Wrong1!", new_password: "Updated2@", confirm_password: "Updated2@" } }, res);
  restores.reverse().forEach((restore) => restore());
  assert.equal(res.result.statusCode, 400); assert.equal(updated, false); assert.equal(audited, false); assert.equal(await bcrypt.compare("Current1!", password_hash), true);
});

test("same or policy-invalid passwords never update the current account", async () => {
  const password_hash = await bcrypt.hash("Current1!", 12); let updates = 0; const restores = [
    replace(prisma.user, "findUnique", async () => ({ user_id: account.user_id, password_hash })),
    replace(prisma.user, "update", async () => { updates += 1; }),
  ];
  for (const new_password of ["Current1!", "weak"]) {
    const res = response(); await changeMyPassword({ user: { user_id: account.user_id }, body: { current_password: "Current1!", new_password, confirm_password: new_password } }, res); assert.equal(res.result.statusCode, 400);
  }
  restores.reverse().forEach((restore) => restore());
  assert.equal(updates, 0); assert.equal(await bcrypt.compare("Current1!", password_hash), true);
});

test("password target lookup ignores cross-user manipulation and account routes remain USER-only", async () => {
  let lookup; const restores = [replace(prisma.user, "findUnique", async (input) => { lookup = input; return { user_id: account.user_id, password_hash: await bcrypt.hash("Current1!", 12) }; })];
  const res = response(); await changeMyPassword({ user: { user_id: account.user_id }, query: { user_id: "42" }, body: { user_id: 42, current_password: "Wrong1!", new_password: "Updated2@", confirm_password: "Updated2@" } }, res); restores.forEach((restore) => restore());
  assert.equal(lookup.where.user_id, account.user_id);
  for (const role of [ROLES.SUPER_ADMIN, ROLES.TEAM_OWNER, ROLES.CLUB_OWNER, ROLES.REFEREE]) { const roleRes = response(); let allowed = false; authorize(ROLES.USER)({ user: { role } }, roleRes, () => { allowed = true; }); assert.equal(allowed, false); assert.equal(roleRes.result.statusCode, 403); }
});

test("account profile and password UI remain guarded, refresh shared auth state, and never persist passwords", async () => {
  const [app, guard, context, profile, password] = await Promise.all([
    readFile(new URL("../../../../frontend/src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/routes/UserAccountRoute.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/context/AuthContext.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/account/pages/ProfileEditPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/account/pages/PasswordChangePage.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(app, /path="\/account\/profile"/); assert.match(app, /path="\/account\/password"/); assert.match(guard, /user\?\.role === "USER"/); assert.match(context, /refreshUser/); assert.match(profile, /await refreshUser\(\)/); assert.match(password, /setForm\(blank\)/); assert.doesNotMatch(password, /localStorage|sessionStorage/);
});
