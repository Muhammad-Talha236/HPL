import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import nodemailer from "nodemailer";
import { createPasswordResetControllers } from "./passwordReset.controller.js";
import { createResetToken, hashResetToken, RESET_MESSAGE, sendPasswordResetEmail } from "../../services/passwordReset.service.js";
import { passwordResetEmailLimiter, passwordResetIpLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { login, register } from "./auth.controller.js";
import prisma from "../../database/prisma.js";
import { ENV } from "../../config/env.js";
import { setEmailVerificationMailTransportFactoryForTests, resetEmailVerificationMailTransportFactoryForTests } from "../../services/emailVerification.service.js";
import { validateResetForm } from "../../../../frontend/src/features/auth/utils/passwordResetValidation.js";

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
async function fixture(send) {
  const user = { user_id: 7, email: "user@example.com", name: "Test User", password_hash: await bcrypt.hash("OldPassword@123", 4), role: "USER", status: "ACTIVE", session_version: 0 };
  const tokens = [];
  let tail = Promise.resolve();
  const matches = (t, w) => (!w.token_hash || t.token_hash === w.token_hash) && (!w.user_id || t.user_id === w.user_id) && (!w.password_reset_token_id || t.password_reset_token_id === w.password_reset_token_id) && (w.used_at !== null || !t.used_at) && (!w.delivered_at || t.delivered_at) && (!w.expires_at || t.expires_at > w.expires_at.gt);
  const db = {
    user: { findUnique: async ({ where }) => (where.email_key === user.email || where.user_id === user.user_id) ? user : null,
      updateMany: async () => { if (user.password_reset_requested_at) return { count: 0 }; user.password_reset_requested_at = new Date(); return { count: 1 }; },
      update: async ({ data }) => { user.password_hash = data.password_hash; user.session_version++; return user; } },
    passwordResetToken: { create: async ({ data }) => { const t = { ...data, password_reset_token_id: tokens.length + 1, used_at: null, delivered_at: null }; tokens.push(t); return t; },
      findUnique: async ({ where }) => tokens.find(t => t.token_hash === where.token_hash),
      updateMany: async ({ where, data }) => { const selected = tokens.filter(t => matches(t, where)); selected.forEach(t => Object.assign(t, data)); return { count: selected.length }; } },
    $queryRaw: async () => [],
    $transaction: async (fn) => { const previous = tail; let unlock; tail = new Promise(r => { unlock = r; }); await previous; try { return await fn(db); } finally { unlock(); } },
  };
  const delivered = [];
  const controllers = createPasswordResetControllers(db, send || (async mail => delivered.push(mail)));
  return { db, user, tokens, delivered, ...controllers };
}

test("random tokens are hashed, expire after 15 minutes, and malformed tokens are rejected", () => {
  const a = createResetToken(), b = createResetToken(); assert.notEqual(a.rawToken, b.rawToken);
  assert.equal(a.tokenHash, hashResetToken(a.rawToken)); assert.notEqual(a.tokenHash, a.rawToken);
  assert.ok(Math.abs(a.expiresAt - Date.now() - 900000) < 100); assert.equal(hashResetToken("bad"), null);
});
test("registered and unknown addresses get identical immediate responses; cooldown prevents flooding", async () => {
  const f = await fixture(); const a = response(), b = response();
  const pending = f.forgotPassword({ body: { email: f.user.email } }, a);
  assert.deepEqual(a.body, { message: RESET_MESSAGE });
  await pending; await f.forgotPassword({ body: { email: "unknown@example.com" } }, b);
  assert.deepEqual(a.body, b.body); assert.equal(f.delivered.length, 1);
  assert.equal(f.tokens[0].token_hash, hashResetToken(f.delivered[0].rawToken));
  await Promise.all([f.forgotPassword({ body: { email: f.user.email } }, response()), f.forgotPassword({ body: { email: f.user.email } }, response())]);
  assert.equal(f.delivered.length, 1);
});
test("valid reset changes bcrypt password, revokes sessions and all tokens, and prevents concurrent reuse", async () => {
  const f = await fixture(); await f.forgotPassword({ body: { email: f.user.email } }, response());
  f.tokens.push({ ...f.tokens[0], token_hash: "b".repeat(64), password_reset_token_id: 2 });
  const req = { body: { token: f.delivered[0].rawToken, newPassword: "NewPassword@123" } };
  const a = response(), b = response(); await Promise.all([f.resetPassword(req, a), f.resetPassword(req, b)]);
  assert.deepEqual([a.statusCode, b.statusCode].sort(), [200, 400]);
  assert.equal(await bcrypt.compare("OldPassword@123", f.user.password_hash), false);
  assert.equal(await bcrypt.compare(req.body.newPassword, f.user.password_hash), true);
  assert.equal(f.user.session_version, 1); assert.ok(f.tokens.every(t => t.used_at));
  const reused = response(); await f.resetPassword(req, reused); assert.equal(reused.statusCode, 400);
});
test("expired, unknown, malformed and pending tokens cannot reset passwords; weak passwords fail", async () => {
  const f = await fixture(); await f.forgotPassword({ body: { email: f.user.email } }, response());
  const raw = f.delivered[0].rawToken;
  for (const token of ["bad", "a".repeat(64)]) { const r = response(); await f.resetPassword({ body: { token, newPassword: "NewPassword@123" } }, r); assert.equal(r.statusCode, 400); }
  const r = response(); await f.resetPassword({ body: { token: raw, newPassword: "weak" } }, r); assert.equal(r.statusCode, 400);
  f.tokens[0].delivered_at = null; const pending = response(); await f.resetPassword({ body: { token: raw, newPassword: "NewPassword@123" } }, pending); assert.equal(pending.statusCode, 400);
  f.tokens[0].delivered_at = new Date(); f.tokens[0].expires_at = new Date(0);
  const expired = response(); await f.resetPassword({ body: { token: raw, newPassword: "NewPassword@123" } }, expired); assert.equal(expired.statusCode, 400);
});
test("provider failure revokes pending token and returns generic response", async () => {
  const f = await fixture(async () => { throw new Error("provider secret"); }); const r = response();
  await f.forgotPassword({ body: { email: f.user.email } }, r);
  assert.deepEqual(r.body, { message: RESET_MESSAGE }); assert.ok(f.tokens[0].used_at); assert.equal(f.tokens[0].delivered_at, null);
});
test("email mutation invalidates a previously delivered recovery link", async () => {
  const f = await fixture(); await f.forgotPassword({ body: { email: f.user.email } }, response());
  f.user.email = "changed@example.com";
  const r = response(); await f.resetPassword({ body: { token: f.delivered[0].rawToken, newPassword: "NewPassword@123" } }, r);
  assert.equal(r.statusCode, 400); assert.equal(f.user.session_version, 0);
});
test("frontend rejects mismatch and weak passwords", () => {
  assert.ok(validateResetForm("NewPassword@123", "Different@123").confirmPassword);
  assert.ok(validateResetForm("weak", "weak").newPassword);
  assert.deepEqual(validateResetForm("NewPassword@123", "NewPassword@123"), {});
});
test("existing login checks old/new passwords and middleware rejects a revoked JWT", async () => {
  const f = await fixture(); await f.forgotPassword({ body: { email: f.user.email } }, response());
  await f.resetPassword({ body: { token: f.delivered[0].rawToken, newPassword: "NewPassword@123" } }, response());
  const original = prisma.user.findUnique; prisma.user.findUnique = async () => f.user;
  try {
    const old = response(); await login({ body: { email: f.user.email, password: "OldPassword@123" } }, old); assert.equal(old.statusCode, 401);
    const fresh = response(); await login({ body: { email: f.user.email, password: "NewPassword@123" } }, fresh); assert.equal(fresh.statusCode, 200);
    assert.equal(jwt.verify(fresh.body.data.token, ENV.JWT_SECRET).session_version, 1);
    const revoked = response(); let next = false;
    await authenticate({ headers: { authorization: `Bearer ${jwt.sign({ user_id: 7 }, ENV.JWT_SECRET)}` } }, revoked, () => { next = true; });
    assert.equal(revoked.statusCode, 401); assert.equal(next, false);
    const active = response(); await authenticate({ headers: { authorization: `Bearer ${fresh.body.data.token}` } }, active, () => { next = true; }); assert.equal(next, true);
  } finally { prisma.user.findUnique = original; }
});
test("registration required-field validation remains unchanged", async () => {
  const r = response(); await register({ body: {} }, r); assert.equal(r.statusCode, 400);
});
test("registration still creates a bcrypt account and sends verification email", async () => {
  const originals = [prisma.user.findUnique, prisma.user.create, prisma.emailVerificationToken.create];
  let stored; let mailed = false;
  prisma.user.findUnique = async () => null;
  prisma.user.create = async ({ data }) => { stored = data; return { ...data, user_id: 9, session_version: 0 }; };
  prisma.emailVerificationToken.create = async () => ({});
  setEmailVerificationMailTransportFactoryForTests(() => ({ sendMail: async () => { mailed = true; } }));
  try {
    const r = response(); await register({ body: { name: "Test User", email: "test@example.com", password: "Register@123" } }, r);
    assert.equal(r.statusCode, 201); assert.equal(await bcrypt.compare("Register@123", stored.password_hash), true);
    assert.equal(mailed, true); assert.equal(r.body.data.password_hash, undefined);
  } finally {
    [prisma.user.findUnique, prisma.user.create, prisma.emailVerificationToken.create] = originals;
    resetEmailVerificationMailTransportFactoryForTests();
  }
});
test("production email uses configured Vercel origin with 15-minute notice", async () => {
  const original = nodemailer.createTransport; const before = { ...process.env }; let mail;
  Object.assign(process.env, { NODE_ENV: "production", FRONTEND_URL: "https://hpl-ten.vercel.app", EMAIL_USER: "hpl@example.com", EMAIL_APP_PASSWORD: "test-only", EMAIL_FROM_NAME: "Hunza Premier League" });
  nodemailer.createTransport = () => ({ sendMail: async value => { mail = value; }, close() {} });
  try {
    const token = createResetToken(); await sendPasswordResetEmail({ email: "user@example.com", rawToken: token.rawToken });
    assert.ok(mail.text.includes(`https://hpl-ten.vercel.app/reset-password?token=${token.rawToken}`));
    assert.ok(mail.text.includes("15 minutes")); assert.ok(mail.html.includes("Reset Password"));
    process.env.FRONTEND_URL = "http://localhost:5173";
    await assert.rejects(sendPasswordResetEmail({ email: "user@example.com", rawToken: token.rawToken }));
  } finally { nodemailer.createTransport = original; for (const key of ["NODE_ENV", "FRONTEND_URL", "EMAIL_USER", "EMAIL_APP_PASSWORD", "EMAIL_FROM_NAME"]) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; } }
});
test("HTTP rate limiters mask account throttling and reject IP abuse", async () => {
  const app = express(); app.use(express.json()); app.post("/", passwordResetIpLimiter, passwordResetEmailLimiter, (req, res) => res.json({ message: RESET_MESSAGE }));
  const server = app.listen(0, "127.0.0.1"); await new Promise(r => server.once("listening", r));
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    for (let i = 0; i < 11; i++) { const result = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: i % 2 ? "User.Name+alias@googlemail.com" : "username@gmail.com" }) }); assert.equal(result.status, i < 10 ? 200 : 429); if (i < 10) assert.deepEqual(await result.json(), { message: RESET_MESSAGE }); }
  } finally { await new Promise(r => server.close(r)); }
});
