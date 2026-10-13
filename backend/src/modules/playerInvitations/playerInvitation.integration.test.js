import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import invitationRouter from "./playerInvitation.routes.js";
import { login, register } from "../auth/auth.controller.js";
import { players as ownerPlayers } from "../teamOwner/teamOwner.controller.js";
import { getAdminPlayers } from "../players/player.admin.controller.js";
import { fixture, patchDb, response } from "./playerInvitation.testSupport.js";
import { registerAndAcceptInvitation } from "../../../../frontend/src/features/playerInvitations/services/invitationOnboarding.js";
import { setEmailVerificationMailTransportFactoryForTests, resetEmailVerificationMailTransportFactoryForTests } from "../../services/emailVerification.service.js";

async function httpFixture(f) {
  const restore = patchDb(f.db);
  const app = express(); app.use(express.json());
  app.post("/auth/login", login); app.post("/auth/register", register);
  app.use("/player-invitations", invitationRouter);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let jwt;
  const request = async (path, method, body) => {
    const res = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.message), { response: { status: res.status, data } });
    return { data };
  };
  return {
    api: { post: (path, body) => request(path, "POST", body), get: path => request(path, "GET") },
    login: async credentials => { const res = await request("/auth/login", "POST", credentials); jwt = res.data.data.token; return res.data.data.user; },
    close: async () => { await new Promise(resolve => server.close(resolve)); restore(); },
  };
}

const form = { name: "Invited Player", password: "Secure!123", confirm_password: "Secure!123" };

test("explicit invitation signup uses real HTTP registration and password/JWT login before automatic acceptance; all rosters and My Team reflect membership", async () => {
  const f = await fixture(); f.state.teams[0].logo = "https://example.com/team.png"; await f.send("invited@example.com");
  const http = await httpFixture(f);
  try {
    const preview = await http.api.get(`/player-invitations/accept/${f.mail[0].rawToken}`); assert.equal(preview.data.data.valid, true);
    const result = await registerAndAcceptInvitation({ ...http, token: f.mail[0].rawToken, form, accepted: true });
    assert.equal(result.data.status, "ACTIVE"); assert.equal(result.message, "Welcome to Hunza FC! You are now a member of this team.");
    assert.equal(f.state.users.length, 3); assert.equal(f.state.invitations[0].status, "ACCEPTED"); assert.equal(f.state.memberships[1].status, "ACTIVE");
    assert.equal(f.state.players[1].date_of_birth, null); assert.equal(f.state.players[1].profile_completed_at, null);
    const profile = await http.api.get("/player-invitations/me/profile"); assert.equal(profile.data.data.team_players[0].team.name, "Hunza FC"); assert.equal(profile.data.data.team_players[0].team.logo, "https://example.com/team.png"); assert.equal(profile.data.data.team_players[0].status, "ACTIVE");
    const owner = response(), admin = response(); const next = error => { throw error; };
    await ownerPlayers({ user: f.owner(), query: { team_id: 1, status: "ACTIVE" } }, owner, next); await getAdminPlayers({ query: {} }, admin, next);
    assert.equal(owner.body.data.length, 2); assert.equal(admin.body.summary.active, 2);
    const pending = response(), history = response();
    await f.controllers.getPlayerInvitations({ user: f.owner(), query: { team_id: 1, view: "PENDING" } }, pending);
    await f.controllers.getPlayerInvitations({ user: f.owner(), query: { team_id: 1, view: "HISTORY" } }, history);
    assert.equal(pending.body.data.length, 0); assert.equal(history.body.data[0].status, "ACCEPTED");
  } finally { await http.close(); }
});

test("signup orchestration refuses missing explicit acceptance or invalid context before making requests", async () => {
  let calls = 0; const api = { post: async () => { calls++; } }, login = async () => { calls++; };
  await assert.rejects(registerAndAcceptInvitation({ api, login, token: "a".repeat(43), form, accepted: false }));
  await assert.rejects(registerAndAcceptInvitation({ api, login, token: "invalid", form, accepted: true })); assert.equal(calls, 0);
});

test("activation failure after signup keeps a single authenticated account and pending link that can be retried", async () => {
  const f = await fixture(); await f.send("retry@example.com"); const http = await httpFixture(f); f.failAudit = true;
  try {
    await assert.rejects(registerAndAcceptInvitation({ ...http, token: f.mail[0].rawToken, form, accepted: true }), error => error.response.status === 503);
    assert.equal(f.state.users.length, 3); assert.equal(f.state.invitations[0].status, "PENDING"); assert.equal(f.state.memberships.length, 1); assert.equal(f.state.players.length, 1);
    f.failAudit = false; const joined = await http.api.post(`/player-invitations/accept/${f.mail[0].rawToken}`);
    assert.equal(joined.data.data.status, "ACTIVE"); assert.equal(f.state.users.length, 3); assert.equal(f.state.memberships.length, 2);
  } finally { await http.close(); }
});

test("normal Signup and Login never activate pending invitations; the original delivered link can be explicitly accepted later", async () => {
  const f = await fixture(); await f.send("normal@example.com");
  f.db.emailVerificationToken = { create: async () => ({}) };
  setEmailVerificationMailTransportFactoryForTests(() => ({ sendMail: async () => ({}) }));
  const http = await httpFixture(f);
  try {
    await http.api.post("/auth/register", { name: "Normal Signup", email: "normal@example.com", password: form.password });
    await http.login({ email: "normal@example.com", password: form.password });
    assert.equal(f.state.invitations[0].status, "PENDING"); assert.equal(f.state.memberships.length, 1); assert.equal(f.state.players.length, 1);
    const result = await http.api.post(`/player-invitations/accept/${f.mail[0].rawToken}`);
    assert.equal(result.data.data.status, "ACTIVE"); assert.equal(f.state.memberships.length, 2); assert.equal(f.state.users.length, 3);
  } finally { await http.close(); resetEmailVerificationMailTransportFactoryForTests(); }
});
