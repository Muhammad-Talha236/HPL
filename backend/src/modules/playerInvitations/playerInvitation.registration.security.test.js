import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import prisma from "../../database/prisma.js";
import { registerPlayerInvitationAccount } from "./playerInvitation.controller.js";
import { registerPlayerInvitationAccountValidation } from "./playerInvitation.validation.js";
import { ROLES } from "../../constants/roles.js";
import { getMe, login } from "../auth/auth.controller.js";

const token = "b".repeat(43);
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const invitation = (overrides = {}) => ({ invitation_id: 81, player_id: 40, team_id: 7, invited_email: "Player@Example.Test", status: "PENDING", expires_at: new Date(Date.now() + 60_000), player: { player_id: 40, name: "Amin Khan", profile_photo: null, status: "ACTIVE", user_id: null }, team: { team_id: 7, name: "Hunza FC", status: "ACTIVE", club: { name: "Hunza Club", status: "ACTIVE" } }, ...overrides });
const request = (body = {}) => ({ params: { token }, body: { name: "Amin Khan", password: "Secure!123", confirm_password: "Secure!123", ...body } });
const runValidation = async (rules, req) => { for (const rule of rules) await rule.run(req); return validationResult(req).array(); };

test("invitation registration accepts only account setup fields and rejects mass assignment", async () => {
  for (const field of ["email", "role", "status", "user_id", "player_id", "team_id", "token_hash", "invited_email", "expires_at", "accepted_at", "created_at"]) {
    const errors = await runValidation(registerPlayerInvitationAccountValidation, { body: { name: "Amin Khan", password: "Secure!123", confirm_password: "Secure!123", [field]: "forged" }, params: {}, query: {} });
    assert.ok(errors.some((error) => error.msg === "Unexpected fields are not allowed"), field);
  }
});

test("public setup derives email, creates an active USER with a bcrypt hash, links the player, consumes the invitation, and audits safely", async () => {
  let createdUser; let playerUpdate; let invitationUpdate; let audit;
  const tx = { playerInvitation: { findUnique: async () => invitation(), updateMany: async (input) => { invitationUpdate = input; return { count: 1 }; } }, user: { findUnique: async () => null, create: async (input) => { createdUser = input.data; return { user_id: 30, name: input.data.name }; } }, teamPlayer: { findFirst: async (input) => { assert.deepEqual(input.where, { team_id: 7, player_id: 40, status: "ACTIVE" }); return { team_player_id: 4 }; } }, player: { updateMany: async (input) => { playerUpdate = input; return { count: 1 }; } }, auditLog: { create: async (input) => { audit = input.data; } } };
  const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await registerPlayerInvitationAccount(request({ email: "attacker@example.test" }), res, () => {}); restore();
  assert.equal(res.result.statusCode, 201); assert.equal(createdUser.email, "player@example.test"); assert.equal(createdUser.role, ROLES.USER); assert.equal(createdUser.status, "ACTIVE"); assert.notEqual(createdUser.password_hash, "Secure!123"); assert.equal(await bcrypt.compare("Secure!123", createdUser.password_hash), true); assert.deepEqual(playerUpdate, { where: { player_id: 40, user_id: null }, data: { user_id: 30 } }); assert.equal(invitationUpdate.data.status, "ACCEPTED"); assert.ok(invitationUpdate.data.accepted_at instanceof Date); assert.deepEqual(audit.details, { invitation_id: 81, player_id: 40, team_id: 7, account_created: true }); const safeText = JSON.stringify({ audit, body: res.result.body }).toLowerCase(); for (const secret of ["secure!123", "token", "hash", "email"]) assert.equal(safeText.includes(secret), false);
});

test("existing accounts, stale lifecycle, linked players, and ended memberships safely reject without creating an account", async () => {
  const cases = [
    { name: "existing account", user: { user_id: 3 } },
    { name: "linked player", invitation: invitation({ player: { ...invitation().player, user_id: 9 } }) },
    { name: "revoked", invitation: invitation({ status: "REVOKED" }) },
    { name: "accepted", invitation: invitation({ status: "ACCEPTED" }) },
    { name: "expired", invitation: invitation({ expires_at: new Date(Date.now() - 1) }) },
    { name: "ended membership", membership: null },
  ];
  for (const item of cases) {
    let creates = 0; let links = 0; let accepts = 0; const tx = { playerInvitation: { findUnique: async () => item.invitation || invitation(), updateMany: async () => { accepts += 1; return { count: 1 }; } }, user: { findUnique: async () => item.user || null, create: async () => { creates += 1; return { user_id: 30 }; } }, teamPlayer: { findFirst: async () => item.membership === undefined ? { team_player_id: 4 } : item.membership }, player: { updateMany: async () => { links += 1; return { count: 1 }; } }, auditLog: { create: async () => { throw new Error("must not audit"); } } };
    const restore = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await registerPlayerInvitationAccount(request(), res, () => {}); restore(); assert.equal(res.result.statusCode, 409, item.name); assert.equal(creates, 0, item.name); assert.equal(links, 0, item.name); if (item.name !== "expired") assert.equal(accepts, 0, item.name);
  }
  const invalid = response(); await registerPlayerInvitationAccount({ params: { token: "bad" }, body: request().body }, invalid, () => {}); assert.equal(invalid.result.statusCode, 409);
});

test("unique/replay conflicts and a failure after user creation leave no committed user, linkage, accepted invitation, or audit", async () => {
  const conflictTx = { playerInvitation: { findUnique: async () => invitation(), updateMany: async () => ({ count: 1 }) }, user: { findUnique: async () => null, create: async () => ({ user_id: 30 }) }, teamPlayer: { findFirst: async () => ({ team_player_id: 4 }) }, player: { updateMany: async () => ({ count: 0 }) }, auditLog: { create: async () => ({}) } };
  let restore = replace(prisma, "$transaction", async (callback) => callback(conflictTx)); const conflict = response(); await registerPlayerInvitationAccount(request(), conflict, () => {}); restore(); assert.equal(conflict.result.statusCode, 409);
  const persisted = { user: null, player_user_id: null, invitation_status: "PENDING", accepted_at: null, audits: 0 }; const staged = { ...persisted }; const tx = { playerInvitation: { findUnique: async () => invitation(), updateMany: async (input) => { staged.invitation_status = input.data.status; staged.accepted_at = input.data.accepted_at; return { count: 1 }; } }, user: { findUnique: async () => null, create: async () => { staged.user = { user_id: 30 }; return staged.user; } }, teamPlayer: { findFirst: async () => ({ team_player_id: 4 }) }, player: { updateMany: async (input) => { staged.player_user_id = input.data.user_id; return { count: 1 }; } }, auditLog: { create: async () => { throw new Error("audit failure"); } } };
  restore = replace(prisma, "$transaction", async (callback) => { try { await callback(tx); Object.assign(persisted, staged); } catch { /* Simulated transaction rollback. */ } }); const rollback = response(); await registerPlayerInvitationAccount(request(), rollback, () => {}); restore(); assert.equal(persisted.user, null); assert.equal(persisted.player_user_id, null); assert.equal(persisted.invitation_status, "PENDING"); assert.equal(persisted.accepted_at, null); assert.equal(persisted.audits, 0);
});

test("an invitation-created USER password remains compatible with normal login and safe current-user responses", async () => {
  const account = { user_id: 30, name: "Amin Khan", email: "player@example.test", password_hash: await bcrypt.hash("Secure!123", 12), phone: null, role: ROLES.USER, status: "ACTIVE", profile_image: null };
  const restore = replace(prisma.user, "findUnique", async (input) => input.select ? { user_id: account.user_id, name: account.name, email: account.email, phone: account.phone, role: account.role, status: account.status, profile_image: account.profile_image } : account);
  const loginResponse = response(); await login({ body: { email: account.email, password: "Secure!123" } }, loginResponse); const meResponse = response(); await getMe({ user: { user_id: account.user_id } }, meResponse); restore();
  assert.equal(loginResponse.result.statusCode, 200); assert.equal(loginResponse.result.body.data.user.role, ROLES.USER); assert.equal(JSON.stringify(loginResponse.result.body).includes("password_hash"), false); assert.equal(meResponse.result.statusCode, 200); assert.equal(meResponse.result.body.data.email, account.email); assert.equal(JSON.stringify(meResponse.result.body).includes("password_hash"), false);
});
