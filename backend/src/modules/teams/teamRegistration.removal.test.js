import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { readFile } from "node:fs/promises";
import prisma from "../../database/prisma.js";
import teamRoutes from "./team.routes.js";
import adminRoutes from "../admin/admin.routes.js";
import mediaRoutes from "../media/media.routes.js";
import { getTeamSquadReadiness } from "./teamVerification.service.js";
import { verifyExistingTeam } from "./teamVerification.admin.controller.js";

const paths = router => router.stack.filter(layer => layer.route).map(layer => layer.route.path);

test("application submission and initial review routes are removed while shared team and verification routes remain", () => {
  const teams = paths(teamRoutes), admin = paths(adminRoutes), media = paths(mediaRoutes);
  assert.ok(!teams.some(path => path.startsWith("/independent")));
  for (const path of ["/team-registration-requests", "/team-registration-requests/:request_id/provisionally-approve", "/team-registration-requests/:request_id/request-changes", "/team-registration-requests/:request_id/reject"]) assert.ok(!admin.includes(path));
  assert.ok(teams.includes("/")); assert.ok(teams.includes("/:team_id")); assert.ok(admin.includes("/teams")); assert.ok(admin.includes("/teams/:team_id"));
  assert.ok(admin.includes("/team-registration-requests/:request_id/verify"));
  assert.ok(!media.some(path => path.startsWith("/team-logo"))); assert.ok(media.includes("/profile"));
});

test("frontend application links/routes are absent and competition, owner and invitation navigation remains", async () => {
  const files = ["App.jsx", "components/navigation/Navbar.jsx", "layouts/admin/adminNavigation.js", "features/admin/components/AdminSidebar.jsx", "features/account/pages/NormalUserProfilePage.jsx"];
  for (const file of files) {
    const source = await readFile(new URL(`../../../../frontend/src/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /register-independent|IndependentTeamRegistrationPage|AdminTeamRegistrationRequestsPage|team-registration-requests/);
  }
  const app = await readFile(new URL("../../../../frontend/src/App.jsx", import.meta.url), "utf8");
  for (const route of ["/teams/:teamId", "/team/players", "/team/matches", "/team/registrations", "/admin/teams", "/admin/registrations", "/player-invitation"]) assert.ok(app.includes(route), route);
});

test("HTTP removed application endpoints return 404 and public teams/profile still respond", async () => {
  const originals = { findMany: prisma.team.findMany, findUnique: prisma.team.findUnique, findFirst: prisma.team.findFirst };
  const team = { team_id: 1, name: "Existing FC", status: "ACTIVE", verification_status: "VERIFIED", club_id: null };
  prisma.team.findMany = async () => [team]; prisma.team.findUnique = async () => team; prisma.team.findFirst = async () => team;
  const app = express(); app.use(express.json()); app.use("/teams", teamRoutes); app.use("/admin", adminRoutes);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [path, method] of [["/teams/independent", "POST"], ["/teams/independent/my", "GET"], ["/teams/independent/1", "PATCH"], ["/admin/team-registration-requests", "GET"], ["/admin/team-registration-requests/1/provisionally-approve", "PATCH"]]) assert.equal((await fetch(base + path, { method })).status, 404);
    assert.equal((await fetch(base + "/teams")).status, 200);
    assert.equal((await fetch(base + "/teams/1")).status, 200);
    assert.equal((await fetch(base + "/admin/team-registration-requests/1/verify", { method: "PATCH" })).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); Object.assign(prisma.team, originals); }
});

test("extracted squad readiness retains active membership and participation eligibility checks", async () => {
  let where;
  const db = { team: { findUnique: async () => ({ team_id: 1, gender: "MEN" }) }, teamPlayer: { count: async args => { where = args.where; return 7; } } };
  const result = await getTeamSquadReadiness(1, db);
  assert.equal(result.required_players, 11); assert.equal(result.remaining_players, 4); assert.equal(result.squad_ready, false);
  assert.equal(where.status, "ACTIVE"); assert.deepEqual(where.player.gender.in, ["MALE", "MEN"]); assert.deepEqual(where.player.date_of_birth, { not: null });
});

test("preserved final verification rejects pending new-team applications without creating teams", async () => {
  const original = prisma.$transaction; let created = false;
  prisma.$transaction = async callback => callback({ teamRegistrationRequest: { findUnique: async () => ({ status: "PENDING", linked_team_id: null }) }, team: { create: async () => { created = true; } } });
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  try {
    await verifyExistingTeam({ user: { user_id: 1 }, params: { request_id: 1 } }, res, error => { throw error; });
    assert.equal(res.statusCode, 409); assert.equal(created, false);
  } finally { prisma.$transaction = original; }
});
