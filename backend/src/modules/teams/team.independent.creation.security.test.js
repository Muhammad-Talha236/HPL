import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { submitIndependentTeamApplication } from "./teamRegistration.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const validBody = { home_venue_id: 7, name: "Passu FC", gender: "MEN", team_type: "SENIOR", contact_phone: "+923001234567", declaration_accepted: true };

test("independent registration creates a pending application without a team or role promotion", async () => {
  const originalTransaction = prisma.$transaction; let requestCreate; let userUpdateCalled = false; let teamCreateCalled = false;
  prisma.$transaction = async (callback) => callback({
    user: { findUnique: async () => ({ user_id: 12, role: ROLES.USER, status: "ACTIVE", email: "owner@example.com", email_verified: true }), update: async () => { userUpdateCalled = true; } },
    venue: { findUnique: async () => ({ venue_id: 7, status: "ACTIVE" }) },
    teamRegistrationRequest: { findFirst: async () => null, create: async (input) => { requestCreate = input; return { team_registration_request_id: 41, name: "Passu FC", status: "PENDING" }; } },
    team: { create: async () => { teamCreateCalled = true; } }, auditLog: { create: async () => {} },
  });
  const res = response(); await submitIndependentTeamApplication({ user: { user_id: 12, role: ROLES.USER, status: "ACTIVE" }, body: validBody }, res, assert.fail); prisma.$transaction = originalTransaction;
  assert.equal(res.result.statusCode, 201); assert.equal(requestCreate.data.status, "PENDING"); assert.equal(teamCreateCalled, false); assert.equal(userUpdateCalled, false);
});

test("independent registration rejects an unverified account", async () => {
  const originalTransaction = prisma.$transaction;
  prisma.$transaction = async (callback) => callback({
    user: { findUnique: async () => ({ user_id: 12, role: ROLES.USER, status: "ACTIVE", email: "owner@example.com", email_verified: false }) },
    venue: { findUnique: async () => ({ venue_id: 7, status: "ACTIVE" }) },
    teamRegistrationRequest: { findFirst: async () => null },
  });
  const res = response();
  await submitIndependentTeamApplication({ user: { user_id: 12, role: ROLES.USER, status: "ACTIVE" }, body: validBody }, res, assert.fail);
  prisma.$transaction = originalTransaction;
  assert.equal(res.result.statusCode, 403);
});

test("independent registration rejects a role that is not eligible before database work", async () => {
  const originalTransaction = prisma.$transaction; let transactionCalled = false; prisma.$transaction = async () => { transactionCalled = true; };
  const res = response(); await submitIndependentTeamApplication({ user: { user_id: 12, role: ROLES.CLUB_OWNER, status: "ACTIVE" }, body: validBody }, res, assert.fail); prisma.$transaction = originalTransaction;
  assert.equal(res.result.statusCode, 403); assert.equal(transactionCalled, false);
});
