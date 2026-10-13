import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../../database/prisma.js";
import { ENV } from "../../config/env.js";
import invitationRouter from "./playerInvitation.routes.js";
import { players as ownerPlayers } from "../teamOwner/teamOwner.controller.js";
import { getAdminPlayers } from "../players/player.admin.controller.js";
import { updateRegistrationSquad } from "../registrations/registration.extra.controller.js";
import { createMatchPlayer } from "../matchPlayers/matchPlayer.controller.js";
import { isPlayerGenderCompatible } from "../../utils/playerEligibility.util.js";
import { readFile } from "node:fs/promises";
import { validationResult } from "express-validator";
import { createPlayerInvitationControllers, INVITATION_MESSAGE } from "./playerInvitation.controller.js";
import { createPlayerInvitationValidation } from "./playerInvitation.validation.js";
import { createPlayerValidation } from "../players/player.validation.js";
import { getEmailLookupKey } from "../../utils/email.util.js";
import { hashPlayerInvitationToken, getPlayerInvitationExpiry } from "../../utils/playerInvitationToken.util.js";
import { buildPlayerInvitationEmail } from "../../services/playerInvitationMail.service.js";

import { fixture, response, clone, patchDb } from "./playerInvitation.testSupport.js";

test("email-only invitation preserves roster and gives identical immediate known/unknown responses", async () => {
  for (const email of ["Mian.Talha+HPL@googlemail.com", "new.player@example.com"]) {
    const f = await fixture(), r = response(), before = clone(f.state.memberships);
    const request = f.controllers.createPlayerInvitation({ user: f.owner(), body: { team_id: 1, invited_email: email } }, r);
    assert.deepEqual(r.body, undefined); // authorization check precedes the response
    await request; assert.equal(r.statusCode, 202); assert.equal(r.body.message, INVITATION_MESSAGE);
    assert.deepEqual(f.state.memberships, before); assert.equal(f.state.players.length, 1);
    assert.equal(f.state.invitations[0].token_hash, hashPlayerInvitationToken(f.mail[0].rawToken));
    assert.equal(f.mail[0].invited_email, email.includes("googlemail") ? "mian.talha@gmail.com" : email);
    assert.equal(JSON.stringify(r.body).includes("rawToken"), false);
    assert.ok(Math.abs(f.state.invitations[0].expires_at - Date.now() - 7 * 86400000) < 1000);
  }
});
test("existing user acceptance verifies mailbox and immediately creates active membership without profile data", async () => {
  const f = await fixture(); await f.send(); const old = clone(f.state.memberships[0]); const before = Date.now(); const r = await f.accept();
  assert.equal(r.statusCode, 200); assert.equal(r.body.data.status, "ACTIVE"); assert.equal(f.state.invitations[0].status, "ACCEPTED");
  assert.equal(f.state.invitations[0].accepted_user_id, 9); assert.equal(f.state.users[1].email_verified, true);
  assert.equal(f.state.users[1].name, "Existing User"); assert.equal(f.state.users[1].role, "USER"); assert.deepEqual(f.state.memberships[0], old);
  const player = f.state.players[1], membership = f.state.memberships[1];
  assert.equal(player.name, "Existing User"); assert.equal(player.date_of_birth, null); assert.equal(player.gender, null); assert.equal(player.position, null); assert.equal(player.profile_completed_at, null);
  assert.equal(membership.status, "ACTIVE"); assert.equal(membership.jersey_number, null); assert.ok(membership.joined_at.getTime() >= before);
  assert.equal((await f.accept()).statusCode, 409); assert.equal(f.state.memberships.length, 2);
});

test("new account setup is email-bound, bcrypt-protected and does not consume invitation or activate membership", async () => {
  const f = await fixture(); await f.send("new.player@example.com"); const r = response();
  await f.controllers.registerPlayerInvitationAccount({ params: { token: f.mail[0].rawToken }, body: { name: "New User", password: "Secure!123", confirm_password: "Secure!123", email: "ignored@example.com", role: "SUPER_ADMIN" } }, r);
  assert.equal(r.statusCode, 201); const u = f.state.users.at(-1); assert.equal(u.email, "new.player@example.com"); assert.equal(u.role, "USER"); assert.equal(u.email_verified, true); assert.equal(await bcrypt.compare("Secure!123", u.password_hash), true);
  assert.equal(f.state.invitations[0].status, "PENDING"); assert.equal(f.state.memberships.length, 1); assert.equal(f.state.players.length, 1);
  assert.equal((await f.accept(u.user_id)).statusCode, 200); assert.equal(f.state.memberships.length, 2);
  assert.equal((await f.profile(u.user_id)).statusCode, 200); assert.equal(f.state.memberships.length, 2);
});
test("optional profile editing never recreates memberships or changes joined date and jersey", async () => {
  const f = await fixture(); await f.send(); await f.accept(); const old = clone(f.state.memberships);
  assert.equal((await f.profile(9, undefined, { jersey_number: 77, joined_at: "1900-01-01" })).statusCode, 200);
  assert.ok(f.state.players[1].profile_completed_at); assert.deepEqual(f.state.memberships, old);
  assert.equal((await f.profile(9, undefined, { position: "Defender" })).statusCode, 200);
  assert.equal(f.state.players[1].position, "Defender"); assert.deepEqual(f.state.memberships, old);
});

test("wrong account, foreign owner, expired/revoked/undelivered token and suspended team are rejected", async () => {
  const f = await fixture(); await f.send(); assert.equal((await f.accept(7)).statusCode, 409);
  const forbidden = response(); await f.controllers.createPlayerInvitation({ user: { ...f.owner(), user_id: 999 }, body: { team_id: 1, invited_email: "new@example.com" } }, forbidden); assert.equal(forbidden.statusCode, 404);
  for (const mutate of [i => { i.expires_at = new Date(0); }, i => { i.status = "REVOKED"; }, i => { i.delivered_at = null; }]) {
    const copy = await fixture(); await copy.send(); mutate(copy.state.invitations[0]); assert.equal((await copy.accept()).statusCode, 409); assert.equal(copy.state.memberships.length, 1);
  }
  f.state.teams[0].verification_status = "SUSPENDED"; assert.equal((await f.accept()).statusCode, 409);
});
test("duplicate normalized invitations and existing active membership produce safe response without more mail", async () => {
  const f = await fixture(); await Promise.all([f.send(), f.send("Mian.Talha+alias@googlemail.com")]); assert.equal(f.mail.length, 1); assert.equal(f.state.invitations.length, 1);
  await f.accept(); await f.profile(); const count = f.mail.length; const r = await f.send(); assert.equal(r.body.message, INVITATION_MESSAGE); assert.equal(f.mail.length, count);
});
test("concurrent acceptance activates exactly one membership and consumes the token once", async () => {
  const f = await fixture(); await f.send(); const accepted = await Promise.all([f.accept(), f.accept()]);
  assert.deepEqual(accepted.map(r => r.statusCode).sort(), [200, 409]); assert.equal(f.state.memberships.length, 2); assert.equal(f.state.players.length, 2); assert.equal(f.state.invitations[0].status, "ACCEPTED");
});

test("optional profile errors never deactivate membership; existing incompatible players cannot join", async () => {
  for (const variation of ["missing", "gender", "verification"]) {
    const f = await fixture(); await f.send(); await f.accept(); const old = clone(f.state.memberships); let fields = {};
    if (variation === "missing") fields.position = ""; if (variation === "gender") fields.gender = "FEMALE";
    if (variation === "verification") f.state.users[1].email_verified = false;
    assert.equal((await f.profile(9, undefined, fields)).statusCode, variation === "missing" ? 400 : 409); assert.deepEqual(f.state.memberships, old); assert.equal(f.state.players[1].profile_completed_at, null);
  }
  const incompatible = await fixture(); incompatible.state.players[0].user_id = 9; incompatible.state.players[0].gender = "FEMALE";
  incompatible.owner().role = "SUPER_ADMIN"; await incompatible.send("mian.talha@gmail.com", { player_id: 100 });
  // Existing membership suppresses sending; test a valid legacy delivered ticket directly.
  if (!incompatible.mail.length) { incompatible.state.memberships.length = 0; await incompatible.send("mian.talha@gmail.com"); }
  assert.equal((await incompatible.accept()).statusCode, 409); assert.equal(incompatible.state.invitations[0].status, "PENDING");
});

test("resend cooldown, hash rotation, revoke and decline enforce lifecycle", async () => {
  const f = await fixture(); await f.send(); const id = f.state.invitations[0].invitation_id; const req = { user: f.owner(), params: { invitation_id: id } }; const early = response(); await f.controllers.resendPlayerInvitation(req, early); assert.equal(early.statusCode, 409);
  f.state.invitations[0].last_sent_at = new Date(0); const oldToken = f.mail[0].rawToken; const resent = response(); await f.controllers.resendPlayerInvitation(req, resent); assert.equal(resent.statusCode, 200); assert.equal(f.mail.length, 2); assert.equal((await f.accept(9, oldToken)).statusCode, 409);
  const revoked = response(); await f.controllers.revokePlayerInvitation(req, revoked); assert.equal(revoked.statusCode, 200); assert.equal((await f.accept(9, f.mail[1].rawToken)).statusCode, 409);
  const other = await fixture(); await other.send(); const declined = response(); await other.controllers.declinePlayerInvitation({ user: { user_id: 9 }, params: { token: other.mail[0].rawToken } }, declined); assert.equal(declined.statusCode, 200); assert.equal(other.state.invitations[0].status, "DECLINED"); assert.equal((await other.accept()).statusCode, 409);
});
test("delivery failure leaves no usable token; audit failure rolls back atomic membership activation", async () => {
  const failed = await fixture({ failMail: true }); const r = await failed.send(); assert.equal(r.body.message, INVITATION_MESSAGE); assert.equal(failed.state.invitations[0].status, "REVOKED"); assert.equal(failed.state.invitations[0].delivered_at, null);
  const f = await fixture(); await f.send(); f.failAudit = true; assert.equal((await f.accept()).statusCode, 503); assert.equal(f.state.invitations[0].status, "PENDING"); assert.equal(f.state.users[1].email_verified, false); assert.equal(f.state.players.length, 1); assert.equal(f.state.memberships.length, 1);
  f.failAudit = false; assert.equal((await f.accept()).statusCode, 200); const old = clone(f.state.players[1]); f.failAudit = true; assert.equal((await f.profile()).statusCode, 503); assert.deepEqual(f.state.players[1], old); assert.equal(f.state.memberships.length, 2); assert.equal(f.state.invitations[0].status, "ACCEPTED");
});

test("membership activation preserves privileged roles and existing legacy player details", async () => {
  const f = await fixture(); f.state.users[1].role = "TEAM_OWNER"; await f.send(); await f.accept(); assert.equal(f.state.users[1].role, "TEAM_OWNER"); assert.equal(f.state.players[1].user_id, 9);
  const legacy = await fixture(); await legacy.send("mian.talha@gmail.com", { player_id: 100 }); assert.equal(legacy.mail.length, 0);
  legacy.state.users[0].role = "SUPER_ADMIN"; await legacy.send("mian.talha@gmail.com", { player_id: 100 }); const old = clone(legacy.state.players[0]); assert.equal((await legacy.accept()).statusCode, 200);
  assert.deepEqual(legacy.state.players[0], { ...old, user_id: 9 }); assert.equal(legacy.state.players.length, 1); assert.equal(legacy.state.memberships.length, 1);
});

test("validators block identity/status/jersey/date mass assignment and require existing HPL profile fields", async () => {
  const good = { body: { team_id: 1, invited_email: "Mian.Talha+tag@GMAIL.COM" } }; for (const chain of createPlayerInvitationValidation) await chain.run(good); assert.equal(validationResult(good).isEmpty(), true); assert.equal(good.body.invited_email, "mian.talha+tag@gmail.com");
  const invalid = { body: { name: "Player", date_of_birth: "2000-01-01", gender: "MALE", position: "", user_id: 7, jersey_number: 10, joined_at: "1900-01-01", status: "ACTIVE" } }; for (const chain of createPlayerValidation) await chain.run(invalid); assert.equal(validationResult(invalid).isEmpty(), false);
});
test("production invitation branding, seven-day expiry, and Vercel link use existing provider configuration", () => {
  const before = { ...process.env }; Object.assign(process.env, { NODE_ENV: "production", FRONTEND_URL: "https://hpl-ten.vercel.app", EMAIL_USER: "sender@example.com", EMAIL_APP_PASSWORD: "test-only", EMAIL_FROM_NAME: "Hunza Premier League" });
  try { const mail = buildPlayerInvitationEmail({ invited_email: "player@example.com", team_name: "Hunza FC", player_name: "Player", club_name: "Independent Team", expires_at: getPlayerInvitationExpiry(), rawToken: "a".repeat(43) }); assert.equal(mail.subject, "You've Been Invited to Join a Team — HPL"); assert.ok(mail.text.includes("https://hpl-ten.vercel.app/player-invitation?token=")); assert.ok(mail.html.includes("7 days")); assert.ok(mail.html.includes("Accept Invitation")); }
  finally { for (const key of ["NODE_ENV", "FRONTEND_URL", "EMAIL_USER", "EMAIL_APP_PASSWORD", "EMAIL_FROM_NAME"]) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; } }
});
test("owner search/direct-add bypasses are removed; confirmed roster/admin/squad/lineup gates stay active", async () => {
  const [routes, roster, admin, squad, match, form] = await Promise.all([
    readFile(new URL("../teamOwner/teamOwner.routes.js", import.meta.url), "utf8"), readFile(new URL("../teamPlayers/teamPlayer.controller.js", import.meta.url), "utf8"), readFile(new URL("../players/player.admin.controller.js", import.meta.url), "utf8"), readFile(new URL("../registrations/registration.extra.controller.js", import.meta.url), "utf8"), readFile(new URL("../matchPlayers/matchPlayer.controller.js", import.meta.url), "utf8"), readFile(new URL("../../../../frontend/src/features/teamOwner/pages/TeamOwnerWorkflowPages.jsx", import.meta.url), "utf8")]);
  assert.doesNotMatch(routes, /router\.get\("\/eligible-players"/); assert.doesNotMatch(form, /eligible-players|Search Player|Joined date|joined_at: joined/); assert.match(roster, /Use the player invitation flow/); assert.match(admin, /where: \{ status: "ACTIVE" \}/); assert.match(squad, /status: "ACTIVE", player:/); assert.match(match, /teamPlayer\.status !== "ACTIVE"/);
});

test("actual owner/admin read controllers exclude pending invitees and include activated players", async () => {
  const f = await fixture(); await f.send(); const restore = patchDb(f.db);
  const next = error => { throw error; };
  try {
    const pendingOwner = response(); await ownerPlayers({ user: f.owner(), query: { team_id: "1" } }, pendingOwner, next);
    const pendingAdmin = response(); await getAdminPlayers({ query: {} }, pendingAdmin, next);
    assert.equal(pendingOwner.body.data.length, 1); assert.equal(pendingAdmin.body.summary.active, 1);
    await f.accept();
    const activeOwner = response(); await ownerPlayers({ user: f.owner(), query: { team_id: "1" } }, activeOwner, next);
    const activeAdmin = response(); await getAdminPlayers({ query: {} }, activeAdmin, next);
    assert.equal(activeOwner.body.data.length, 2); assert.equal(activeAdmin.body.summary.active, 2);
    assert.ok(activeOwner.body.data.some(m => m.player.player_id === f.state.players[1].player_id));
    assert.ok(activeAdmin.body.data.some(p => p.player_id === f.state.players[1].player_id));
  } finally { restore(); }
});
test("HTTP optional profile validation blocks spoofing without gating active membership, hides secrets and rate limits sends", async () => {
  const f = await fixture(); await f.send(); await f.accept(); const restore = patchDb(f.db);
  const app = express(); app.use(express.json()); app.use("/player-invitations", invitationRouter);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/player-invitations`;
  const playerHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${jwt.sign({ user_id: 9 }, ENV.JWT_SECRET)}` };
  const profile = { name: "Player", date_of_birth: "2000-01-01", gender: "MALE", position: "Defender" };
  try {
    const spoofed = await fetch(`${base}/me/profile`, { method: "PUT", headers: playerHeaders, body: JSON.stringify({ ...profile, joined_at: "1900-01-01", jersey_number: 88, user_id: 7 }) });
    assert.equal(spoofed.status, 400); assert.equal(f.state.memberships.length, 2);
    const valid = await fetch(`${base}/me/profile`, { method: "PUT", headers: playerHeaders, body: JSON.stringify(profile) });
    assert.equal(valid.status, 200); assert.equal(f.state.memberships.length, 2);
    const me = await fetch(`${base}/me/profile`, { headers: playerHeaders }); assert.equal(me.status, 200); assert.equal((await me.json()).data.player_id, f.state.players[1].player_id);
    const list = await fetch(`${base}?team_id=1`, { headers: { Authorization: `Bearer ${jwt.sign({ user_id: 7 }, ENV.JWT_SECRET)}` } });
    const listText = await list.text(); assert.equal(list.status, 200); assert.equal(listText.includes("token_hash"), false); assert.equal(listText.includes("password_hash"), false);
    const ownerHeaders = { ...playerHeaders, Authorization: `Bearer ${jwt.sign({ user_id: 7 }, ENV.JWT_SECRET)}` };
    for (let count = 0; count < 11; count++) { const r = await fetch(base, { method: "POST", headers: ownerHeaders, body: JSON.stringify({ team_id: 1, invited_email: "invalid" }) }); assert.equal(r.status, count < 10 ? 400 : 429); }
  } finally { await new Promise(resolve => server.close(resolve)); restore(); }
});
test("unregistered recipients can decline with mailbox-token proof without creating an account", async () => {
  const f = await fixture(); await f.send("unregistered@example.com"); const r = response();
  await f.controllers.declinePlayerInvitation({ params: { token: f.mail[0].rawToken } }, r);
  assert.equal(r.statusCode, 200); assert.equal(f.state.invitations[0].status, "DECLINED"); assert.equal(f.state.users.length, 2); assert.equal(f.state.memberships.length, 1);
});
test("legacy MEN/WOMEN profiles retain their records and a player cannot be claimed concurrently by two accounts", async () => {
  const f = await fixture(); f.owner().role = "SUPER_ADMIN"; f.state.players[0].gender = "MEN";
  f.state.teams.push({ ...f.state.teams[0], team_id: 2 });
  f.state.memberships.push({ ...f.state.memberships[0], team_player_id: 101, team_id: 2 });
  f.state.users.push({ user_id: 10, name: "Second User", email: "second@example.com", email_key: "second@example.com", status: "ACTIVE", role: "USER" });
  await f.send("mian.talha@gmail.com", { player_id: 100 }); await f.send("second@example.com", { team_id: 2, player_id: 100 });
  const results = await Promise.all([f.accept(9, f.mail[0].rawToken), f.accept(10, f.mail[1].rawToken)]);
  assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 409]); assert.equal(f.state.players[0].user_id, 9);
  assert.equal(f.state.players[0].gender, "MEN"); assert.equal(f.state.memberships.length, 2);
  assert.equal(isPlayerGenderCompatible("WOMEN", "FEMALE"), true); assert.equal(isPlayerGenderCompatible("MALE", "MEN"), true); assert.equal(isPlayerGenderCompatible("MEN", "FEMALE"), false);
});
test("pending invitees cannot join competition squads or lineups; active MALE players qualify for MEN squads", async () => {
  const f = await fixture(); await f.send(); await f.accept(); const restore = patchDb(f.db);
  const originalRegistration = prisma.competitionRegistration.findUnique;
  const originalMatch = prisma.match.findUnique;
  let squadIds;
  f.db.competitionPlayer = { deleteMany: async () => {}, createMany: async ({ data }) => { squadIds = data.map(p => p.player_id); } };
  prisma.competitionRegistration.findUnique = async () => ({ registration_id: 1, team_id: 1, registration_status: "APPROVED", competition: { competition_id: 1, gender: "MEN", squad_size: 18 }, team: { owner_id: 7, club_id: null } });
  prisma.match.findUnique = async () => ({ match_id: 1, status: "SCHEDULED", competition_id: 1, home_team_id: 1, away_team_id: 2 });
  const next = error => { throw error; };
  try {
    const pending = response(); await updateRegistrationSquad({ user: f.owner(), params: { registration_id: 1 }, body: { player_ids: [999] } }, pending, next); assert.equal(pending.statusCode, 400); assert.equal(squadIds, undefined);
    const lineup = response(); await createMatchPlayer({ user: { role: "SUPER_ADMIN" }, body: { match_id: 1, team_id: 1, player_id: 999, starting_status: "STARTING" } }, lineup); assert.equal(lineup.statusCode, 404);
    const incompleteId = f.state.players[1].player_id;
    const incompleteSquad = response(); await updateRegistrationSquad({ user: f.owner(), params: { registration_id: 1 }, body: { player_ids: [incompleteId] } }, incompleteSquad, next); assert.equal(incompleteSquad.statusCode, 400);
    const incompleteLineup = response(); await createMatchPlayer({ user: { role: "SUPER_ADMIN" }, body: { match_id: 1, team_id: 1, player_id: incompleteId, starting_status: "STARTING" } }, incompleteLineup); assert.equal(incompleteLineup.statusCode, 400);
    await f.profile(); const activeId = f.state.players[1].player_id;
    const squad = response(); await updateRegistrationSquad({ user: f.owner(), params: { registration_id: 1 }, body: { player_ids: [activeId] } }, squad, next); assert.equal(squad.statusCode, 200); assert.deepEqual(squadIds, [activeId]);
  } finally { prisma.competitionRegistration.findUnique = originalRegistration; prisma.match.findUnique = originalMatch; restore(); }
});

test("old accepted invitations activate without profile completion and cannot be reused", async () => {
  const f = await fixture(); await f.send();
  Object.assign(f.state.invitations[0], { status: "ACCEPTED_PENDING_PROFILE", accepted_user_id: 9, accepted_email_snapshot: f.state.users[1].email, accepted_at: new Date() });
  f.state.users[1].email_verified = true;
  const activate = async () => { const res = response(); await f.controllers.activateAcceptedInvitation({ user: { user_id: 9 }, params: { invitation_id: 1 } }, res); return res; };
  const results = await Promise.all([activate(), activate()]);
  assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 409]);
  assert.equal(f.state.players[1].date_of_birth, null); assert.equal(f.state.memberships[1].status, "ACTIVE"); assert.equal(f.state.invitations[0].status, "ACCEPTED");
});

test("an incomplete existing profile can join another team without duplicating Player or historical membership", async () => {
  const f = await fixture(); Object.assign(f.state.players[0], { user_id: 9, gender: null, date_of_birth: null, position: null, profile_completed_at: null });
  f.state.teams.push({ ...f.state.teams[0], team_id: 2 }); const old = clone(f.state.memberships[0]);
  await f.send("mian.talha@gmail.com", { team_id: 2 }); assert.equal((await f.accept()).statusCode, 200);
  assert.equal(f.state.players.length, 1); assert.equal(f.state.memberships.length, 2); assert.deepEqual(f.state.memberships[0], old); assert.equal(f.state.memberships[1].team_id, 2);
});

test("optional-profile migration only relaxes null constraints and preserves all rows", async () => {
  const sql = await readFile(new URL("../../../prisma/migrations/20261015000000_optional_player_profile/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /"date_of_birth" DROP NOT NULL/); assert.match(sql, /"gender" DROP NOT NULL/);
  assert.doesNotMatch(sql, /DELETE|UPDATE|DROP TABLE|TRUNCATE/i);
});
