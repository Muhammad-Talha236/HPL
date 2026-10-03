import test from "node:test";
import assert from "node:assert/strict";
import { ROLES } from "../../constants/roles.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import prisma from "../../database/prisma.js";
import { getCompetitionParticipants } from "../competitions/competition.participants.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };

test("non-admin roles are denied administrative registration access", () => {
  for (const role of [ROLES.USER, ROLES.TEAM_OWNER, ROLES.CLUB_OWNER, ROLES.REFEREE]) { const res = response(); let called = false; authorize(ROLES.SUPER_ADMIN)({ user: { role } }, res, () => { called = true; }); assert.equal(called, false); assert.equal(res.result.statusCode, 403); }
});

test("public participants serialize team identity only", async () => {
  const restores = [replace(prisma.competitionRegistration, "findMany", async () => [{ team: { team_id: 7, name: "Team Seven", logo: null, region: "Hunza", district: null, city: "Karimabad", gender: "MALE" } }]), replace(prisma.competitionRegistration, "count", async () => 1), replace(prisma, "$transaction", async (operations) => Promise.all(operations))];
  const res = response(); await getCompetitionParticipants({ params: { competition_id: "2" }, query: {} }, res, () => { throw new Error("unexpected error"); }); const serialized = JSON.stringify(res.result.body.data); for (const field of ["payment", "registered_by", "registration_id", "owner", "approval_history", "contact"]) assert.equal(serialized.includes(field), false); assert.deepEqual(res.result.body.data[0], { team_id: 7, name: "Team Seven", logo: null, region: "Hunza", district: null, city: "Karimabad", gender: "MALE" }); restores.forEach((restore) => restore());
});
