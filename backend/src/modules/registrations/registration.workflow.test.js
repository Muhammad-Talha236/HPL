import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { createRegistration, reviewRegistration } from "./registration.controller.js";

const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const future = (days) => { const date = new Date(); date.setUTCDate(date.getUTCDate() + days); return date; };

test("saved-team creation API rejects retired payload without querying or creating records", async () => {
  let transactions = 0; const restore = replace(prisma, "$transaction", async () => { transactions++; throw new Error("Unexpected transaction"); });
  try { for (const body of [{ competition_id: 2, team_id: 9 }, { competition_id: 2, team_id: 9, registered_by: 999 }]) { const res = response(); await createRegistration({ body, user: { user_id: 41, role: ROLES.CLUB_OWNER } }, res); assert.equal(res.result.statusCode, 400); } assert.equal(transactions, 0); } finally { restore(); }
});

test("approval rechecks approved capacity inside its transaction", async () => {
  const restoreFind = replace(prisma.competitionRegistration, "findUnique", async () => ({ registration_id: 3, competition_id: 2, team_id: 9, registration_status: "PENDING", payment_status: "PAID" }));
  const tx = { competition: { findUnique: async () => ({ status: "ACTIVE", max_teams: 1, competition_start_date: future(4) }) }, competitionRegistration: { count: async () => 1 } };
  const restoreTx = replace(prisma, "$transaction", async (callback) => callback(tx)); const res = response(); await reviewRegistration({ params: { registration_id: "3" }, body: { action: "APPROVE" }, user: { user_id: 1, role: ROLES.SUPER_ADMIN } }, res); restoreFind(); restoreTx(); assert.equal(res.result.statusCode, 409);
});
