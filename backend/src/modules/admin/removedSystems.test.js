import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../../database/prisma.js";
import { ENV } from "../../config/env.js";
import teamRoutes from "../teams/team.routes.js";
import adminRoutes from "./admin.routes.js";
import registrationRoutes from "../registrations/registration.routes.js";
import paymentRoutes from "../payments/payment.routes.js";
import { getAccountMailConfig } from "../../config/accountMail.config.js";

test("retired portals and APIs have no runtime mounts while public, club, admin and competition routes remain", async () => {
  const app = await readFile(new URL("../../../../frontend/src/App.jsx", import.meta.url), "utf8");
  const server = await readFile(new URL("../../server.js", import.meta.url), "utf8");
  assert.doesNotMatch(app, /TeamOwner|playerInvitations|path="\/team(?:\/|")|path="\/player-invitation|path="\/invitations\/player/);
  assert.doesNotMatch(server, /teamOwnerRoutes|playerInvitationRoutes|"\/api\/team-owner"|"\/api\/player-invitations"/);
  for (const path of ["/teams", "/players", "/competitions", "/matches", "/standings", "/seasons", "/admin/teams", "/club", "/my/registrations"]) assert.ok(app.includes(`path="${path}"`), path);
  assert.ok(!adminRoutes.stack.some(layer => layer.route?.path.includes("team-registration-requests")));
});

test("persisted legacy owner accounts cannot access removed operational permissions", async () => {
  const original = prisma.user.findUnique;
  prisma.user.findUnique = async () => ({ user_id: 9, role: "TEAM_OWNER", status: "ACTIVE", session_version: 0 });
  const app = express(); app.use(express.json());
  app.use("/teams", teamRoutes); app.use("/admin", adminRoutes); app.use("/registrations", registrationRoutes); app.use("/payments", paymentRoutes);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`, token = jwt.sign({ user_id: 9, session_version: 0 }, ENV.JWT_SECRET);
  try {
    for (const [path, method] of [["/teams", "POST"], ["/teams/1", "PATCH"], ["/registrations", "POST"], ["/payments", "POST"], ["/admin/teams", "GET"]]) {
      assert.equal((await fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(method !== "GET" ? { body: "{}" } : {}) })).status, 403, path);
    }
    for (const path of ["/api/team-owner/dashboard", "/api/player-invitations/accept/token", "/admin/team-registration-requests"]) assert.equal((await fetch(base + path)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); prisma.user.findUnique = original; }
});

test("shared account email config retains reset/verification settings without invitation dependencies", async () => {
  assert.equal(typeof getAccountMailConfig, "function");
  for (const path of ["passwordReset.service.js", "emailVerification.service.js"]) {
    const source = await readFile(new URL(`../../services/${path}`, import.meta.url), "utf8");
    assert.match(source, /getAccountMailConfig/); assert.doesNotMatch(source, /playerInvitation/);
  }
});
