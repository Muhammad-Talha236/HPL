import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { acceptPlayerInvitation, registerPlayerInvitationAccount, resendPlayerInvitation } from "./playerInvitation.controller.js";
import { getPlayerInvitationMailConfig } from "../../config/playerInvitationMail.config.js";
import { buildPlayerInvitationEmail, resetPlayerInvitationMailTransportFactoryForTests, setPlayerInvitationMailTransportFactoryForTests } from "../../services/playerInvitationMail.service.js";
import { hashPlayerInvitationToken } from "../../utils/playerInvitationToken.util.js";

Object.assign(process.env, { EMAIL_USER: "mailer@example.test", EMAIL_APP_PASSWORD: "test-app-password", EMAIL_FROM_NAME: "Hunza Premier League", FRONTEND_URL: "https://hpl.example.test" });

const rawToken = "z".repeat(43);
const owner = { user_id: 11, role: ROLES.TEAM_OWNER };
const normalUser = { user_id: 22, email: "player@example.test", role: ROLES.USER, status: "ACTIVE", player: null };
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const invitation = (overrides = {}) => ({ invitation_id: 90, player_id: 40, team_id: 7, token_hash: hashPlayerInvitationToken(rawToken), invited_email: "player@example.test", status: "PENDING", expires_at: new Date(Date.now() + 60 * 60 * 1000), updated_at: new Date("2026-10-01T10:00:00.000Z"), player: { player_id: 40, name: "Amin Khan", profile_photo: null, status: "ACTIVE", user_id: null }, team: { team_id: 7, name: "Hunza FC", owner_id: owner.user_id, status: "ACTIVE", club: { name: "Hunza Club", owner_id: 12, status: "ACTIVE" } }, ...overrides });

beforeEach(() => setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async () => ({ messageId: "test" }) })));
afterEach(() => resetPlayerInvitationMailTransportFactoryForTests());

test("mail configuration and recipient validation reject header-control injection without exposing configuration", () => {
  const original = process.env.EMAIL_FROM_NAME;
  process.env.EMAIL_FROM_NAME = "Hunza\r\nBcc: attacker@example.test";
  assert.throws(() => getPlayerInvitationMailConfig(), /email service is not configured/);
  process.env.EMAIL_FROM_NAME = original;
  assert.throws(() => buildPlayerInvitationEmail({ invited_email: "player@example.test\r\nBcc: attacker@example.test", player_name: "Amin", team_name: "Hunza FC", club_name: "Hunza Club", expires_at: new Date(), rawToken }), /delivery failed/);
});

test("two concurrent existing-user acceptance attempts conditionally link and consume exactly once", async () => {
  const state = { player_user_id: null, invitation_status: "PENDING", accepted_at: null, audits: 0 };
  const tx = {
    playerInvitation: {
      findUnique: async () => invitation(),
      updateMany: async (input) => {
        if (state.invitation_status !== "PENDING") return { count: 0 };
        state.invitation_status = input.data.status; state.accepted_at = input.data.accepted_at; return { count: 1 };
      },
    },
    user: { findUnique: async () => normalUser },
    teamPlayer: { findFirst: async () => ({ team_player_id: 5 }) },
    player: { updateMany: async (input) => { if (state.player_user_id !== null) return { count: 0 }; state.player_user_id = input.data.user_id; return { count: 1 }; } },
    auditLog: { create: async () => { state.audits += 1; } },
  };
  const restore = replace(prisma, "$transaction", async (callback) => callback(tx));
  const first = response(); const second = response();
  await Promise.all([acceptPlayerInvitation({ params: { token: rawToken }, user: normalUser }, first, () => {}), acceptPlayerInvitation({ params: { token: rawToken }, user: normalUser }, second, () => {})]);
  restore();
  assert.deepEqual([first.result.statusCode, second.result.statusCode].sort(), [200, 409]);
  assert.equal(state.player_user_id, normalUser.user_id); assert.equal(state.invitation_status, "ACCEPTED"); assert.ok(state.accepted_at instanceof Date); assert.equal(state.audits, 1);
});

test("two concurrent new-user registration attempts create, link, accept, and audit at most once", async () => {
  const state = { account: null, player_user_id: null, invitation_status: "PENDING", audits: 0 };
  const tx = {
    playerInvitation: { findUnique: async () => invitation(), updateMany: async (input) => { if (state.invitation_status !== "PENDING") return { count: 0 }; state.invitation_status = input.data.status; return { count: 1 }; } },
    user: {
      findUnique: async () => state.account,
      create: async (input) => { if (state.account) throw Object.assign(new Error("duplicate"), { code: "P2002" }); state.account = { user_id: 30, name: input.data.name }; return state.account; },
    },
    teamPlayer: { findFirst: async () => ({ team_player_id: 5 }) },
    player: { updateMany: async (input) => { if (state.player_user_id !== null) return { count: 0 }; state.player_user_id = input.data.user_id; return { count: 1 }; } },
    auditLog: { create: async () => { state.audits += 1; } },
  };
  const restore = replace(prisma, "$transaction", async (callback) => callback(tx));
  const request = () => ({ params: { token: rawToken }, body: { name: "Amin Khan", password: "Secure!123", confirm_password: "Secure!123" } });
  const first = response(); const second = response();
  await Promise.all([registerPlayerInvitationAccount(request(), first, () => {}), registerPlayerInvitationAccount(request(), second, () => {})]);
  restore();
  assert.deepEqual([first.result.statusCode, second.result.statusCode].sort(), [201, 409]);
  assert.equal(state.account.user_id, 30); assert.equal(state.player_user_id, 30); assert.equal(state.invitation_status, "ACCEPTED"); assert.equal(state.audits, 1);
});

test("concurrent resend retains a deliberately delivered final token and returns a safe conflict to the loser", async () => {
  const state = invitation(); const deliveries = []; let audits = 0;
  setPlayerInvitationMailTransportFactoryForTests(() => ({ sendMail: async (mail) => { deliveries.push(mail.text.match(/\/invitations\/player\/([A-Za-z0-9_-]+)/)?.[1]); return {}; } }));
  const tx = {
    playerInvitation: {
      findFirst: async () => structuredClone(state),
      updateMany: async (input) => {
        if (input.where.token_hash !== state.token_hash || input.where.updated_at.getTime() !== state.updated_at.getTime()) return { count: 0 };
        state.token_hash = input.data.token_hash; state.expires_at = input.data.expires_at; state.updated_at = new Date(); return { count: 1 };
      },
    },
    teamPlayer: { findFirst: async () => ({ team_player_id: 5 }) },
  };
  const restores = [replace(prisma, "$transaction", async (callback) => callback(tx)), replace(prisma.auditLog, "create", async () => { audits += 1; })];
  const first = response(); const second = response();
  await Promise.all([resendPlayerInvitation({ user: owner, params: { invitation_id: 90 } }, first, () => {}), resendPlayerInvitation({ user: owner, params: { invitation_id: 90 } }, second, () => {})]);
  restores.reverse().forEach((restore) => restore());
  assert.deepEqual([first.result.statusCode, second.result.statusCode].sort(), [200, 409]); assert.equal(audits, 1); assert.equal(deliveries.length, 2);
  assert.ok(deliveries.includes(deliveries.find((token) => hashPlayerInvitationToken(token) === state.token_hash)));
});

test("token implementation and frontend continuation remain non-persistent and reject encoded open-redirect forms", async () => {
  const [tokenUtil, manager, login] = await Promise.all([
    readFile(new URL("../../utils/playerInvitationToken.util.js", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/playerInvitations/components/PlayerInvitationManager.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../../../frontend/src/features/auth/pages/LoginPage.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(tokenUtil, /crypto\.randomBytes\(32\)\.toString\("base64url"\)/); assert.match(tokenUtil, /createHash\("sha256"\)/); assert.doesNotMatch(tokenUtil, /Math\.random|randomUUID/);
  assert.doesNotMatch(manager, /localStorage|sessionStorage|rawToken|token_hash|console\./); assert.match(login, /decodeURIComponent\(pathname\)/); assert.match(login, /decodedPath\.startsWith\("\/\/"\)/);
});
