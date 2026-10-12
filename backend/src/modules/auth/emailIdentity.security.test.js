import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import prisma from "../../database/prisma.js";
import { register, login } from "./auth.controller.js";
import { registerValidation, loginValidation } from "./auth.validation.js";
import { createPasswordResetControllers } from "./passwordReset.controller.js";
import { getEmailLookupKey, normalizeStoredEmail, isValidAccountEmail } from "../../utils/email.util.js";
import { setEmailVerificationMailTransportFactoryForTests, resetEmailVerificationMailTransportFactoryForTests } from "../../services/emailVerification.service.js";

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const replace = (target, key, value) => { const old = target[key]; target[key] = value; return () => { target[key] = old; }; };
const request = email => ({ body: { name: "Test User", email, password: "Secure!123" } });
async function validate(chains, req) { for (const chain of chains) await chain.run(req); assert.equal(validationResult(req).isEmpty(), true); }

test("storage preserves Gmail dots/plus and uses documented lowercase casing", () => {
  assert.equal(normalizeStoredEmail(" Mian.Talha1016@GMAIL.COM "), "mian.talha1016@gmail.com");
  for (const value of ["mian.talha1016@gmail.com", "mian.talha.1016@gmail.com", "MIAN.TALHA1016+HPL@GOOGLEMAIL.COM"]) assert.equal(getEmailLookupKey(value), "miantalha1016@gmail.com");
  assert.equal(normalizeStoredEmail("Mian.Talha+HPL@GMAIL.COM"), "mian.talha+hpl@gmail.com");
  assert.equal(isValidAccountEmail("invalid"), false); assert.equal(isValidAccountEmail({}), false);
});
test("Outlook, Yahoo and custom domains retain dots and tags as distinct identities", () => {
  for (const domain of ["outlook.com", "yahoo.com", "club.example.com"]) {
    assert.equal(getEmailLookupKey(` User.Name+HPL@${domain.toUpperCase()} `), `user.name+hpl@${domain}`);
    assert.notEqual(getEmailLookupKey(`user.name@${domain}`), getEmailLookupKey(`username@${domain}`));
    assert.notEqual(getEmailLookupKey(`user+tag@${domain}`), getEmailLookupKey(`user@${domain}`));
  }
});
test("Registration/Login validators preserve the user's dotted address", async () => {
  const r = request(" Mian.Talha1016+HPL@GMAIL.COM "); await validate(registerValidation, r);
  assert.equal(r.body.email, "mian.talha1016+hpl@gmail.com");
  const l = { body: { email: " Mian.Talha1016@GMAIL.COM ", password: "Secure!123" } };
  await validate(loginValidation, l); assert.equal(l.body.email, "mian.talha1016@gmail.com");
});
test("registration preserves delivery email; equivalent dotted/plus/cased identities return 409", async () => {
  const records = new Map();
  const restores = [
    replace(prisma.user, "findUnique", async ({ where }) => records.get(where.email_key) || null),
    replace(prisma.user, "create", async ({ data }) => { const key = getEmailLookupKey(data.email); if (records.has(key)) throw Object.assign(new Error("private constraint detail"), { code: "P2002" }); const u = { ...data, user_id: records.size + 1, email_key: key }; records.set(key, u); return u; }),
    replace(prisma.emailVerificationToken, "create", async () => ({})),
  ];
  setEmailVerificationMailTransportFactoryForTests(() => ({ sendMail: async () => {} }));
  try {
    const r = response(); await register(request(" Mian.Talha1016@GMAIL.COM "), r);
    assert.equal(r.statusCode, 201); assert.equal(r.body.data.email, "mian.talha1016@gmail.com"); assert.equal(r.body.data.email_key, undefined);
    for (const email of ["mian.talha.1016@gmail.com", "miantalha1016+hpl@gmail.com", "MIANTALHA1016@GOOGLEMAIL.COM"]) { const duplicate = response(); await register(request(email), duplicate); assert.equal(duplicate.statusCode, 409); }
    for (const email of ["user.name@outlook.com", "username@outlook.com", "user.name+tag@yahoo.com", "user.name@club.example.com"]) { const provider = response(); await register(request(email), provider); assert.equal(provider.statusCode, 201); assert.equal(provider.body.data.email, email); }
  } finally { restores.reverse().forEach(r => r()); resetEmailVerificationMailTransportFactoryForTests(); }
});
test("concurrent registrations handle database unique-key conflict without exposing Prisma details", async () => {
  const records = new Map();
  const restores = [replace(prisma.user, "findUnique", async () => null),
    replace(prisma.user, "create", async ({ data }) => { const key = getEmailLookupKey(data.email); if (records.has(key)) throw Object.assign(new Error("User_email_key_key secret"), { code: "P2002" }); const record = { ...data, user_id: 1 }; records.set(key, record); return record; }),
    replace(prisma.emailVerificationToken, "create", async () => ({}))];
  setEmailVerificationMailTransportFactoryForTests(() => ({ sendMail: async () => {} }));
  try {
    const a = response(), b = response(); await Promise.all([register(request("mian.talha1016@gmail.com"), a), register(request("miantalha1016+tag@gmail.com"), b)]);
    assert.deepEqual([a.statusCode, b.statusCode].sort(), [201, 409]);
    const failed = a.statusCode === 409 ? a : b; assert.equal(JSON.stringify(failed.body).includes("P2002"), false); assert.equal(JSON.stringify(failed.body).includes("User_email_key_key"), false);
  } finally { restores.reverse().forEach(r => r()); resetEmailVerificationMailTransportFactoryForTests(); }
});
test("equivalent Gmail login resolves exactly one identity and still checks password", async () => {
  const account = { user_id: 28, email: "miantalha1016@gmail.com", email_key: "miantalha1016@gmail.com", password_hash: await bcrypt.hash("Secure!123", 4), status: "ACTIVE", role: "USER", session_version: 0 };
  const restore = replace(prisma.user, "findUnique", async ({ where }) => { assert.deepEqual(where, { email_key: account.email_key }); return account; });
  try {
    const r = response(); await login({ body: { email: "Mian.Talha.1016+HPL@googlemail.com", password: "Secure!123" } }, r); assert.equal(r.statusCode, 200); assert.equal(r.body.data.user.user_id, 28); assert.equal(r.body.data.user.email, account.email);
    const wrong = response(); await login({ body: { email: "mian.talha1016@gmail.com", password: "Wrong!123" } }, wrong); assert.equal(wrong.statusCode, 401);
  } finally { restore(); }
});
test("forgot-password aliases and stored legacy emails deliver only to registered mailbox; unknown sends nothing", async () => {
  const mail = []; const account = { user_id: 28, email: "miantalha1016@gmail.com" };
  let sequence = 0;
  const tx = { $queryRaw: async () => [], user: { updateMany: async () => ({ count: 1 }) }, passwordResetToken: { updateMany: async () => ({ count: 1 }), create: async () => ({ password_reset_token_id: ++sequence }) } };
  const db = { user: { findUnique: async ({ where }) => where.email_key === getEmailLookupKey(account.email) ? account : null }, $transaction: async fn => fn(tx), passwordResetToken: tx.passwordResetToken };
  const { forgotPassword } = createPasswordResetControllers(db, async value => mail.push(value));
  let generic;
  for (const email of [account.email, "mian.talha1016@gmail.com", "Mian.Talha.1016+ATTACKER@GOOGLEMAIL.COM", "unknown@gmail.com"]) {
    const r = response(); const pending = forgotPassword({ body: { email } }, r);
    // Response is already finalized before any account/provider work is awaited.
    assert.equal(r.statusCode, 200); generic ??= r.body; assert.deepEqual(r.body, generic); await pending;
  }
  assert.equal(mail.length, 3); assert.ok(mail.every(m => m.email === account.email));
  assert.equal(JSON.stringify(generic).includes("token"), false);
});
