import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { createPayment } from "../payments/payment.controller.js";
import { requireOwnedRegistrationForPayment } from "./teamOwner.payment.middleware.js";

const ownerA = { user_id: 101, role: ROLES.TEAM_OWNER };
const response = () => { const result = { statusCode: 200, body: null }; return { result, status(code) { result.statusCode = code; return this; }, json(body) { result.body = body; return this; } }; };
const replace = (target, key, value) => { const original = target[key]; target[key] = value; return () => { target[key] = original; }; };
const fee = { toString: () => "2500" };
const registration = (teamId = 11, overrides = {}) => ({ registration_id: 600 + teamId, registered_by: 909, registration_status: "PENDING", payment_status: "UNPAID", competition: { competition_id: 5, name: "Cup", registration_fee: fee }, team: { team_id: teamId, name: `Team ${teamId}`, owner_id: 101, club: { club_id: 1, owner_id: 777 } }, ...overrides });

async function submit({ record = registration(), body = {}, existingPayment = null }) { let created; let registrationUpdate = false; const tx = { competitionRegistration: { findUnique: async () => record, updateMany: async () => { registrationUpdate = true; return { count: 1 }; } }, payment: { findFirst: async () => existingPayment, create: async ({ data }) => { created = data; return { payment_id: 80, ...data, paid_at: null, created_at: new Date(), updated_at: new Date() }; } } }; const restores = [replace(prisma, "$transaction", async (callback) => callback(tx)), replace(prisma.auditLog, "create", async () => ({}))]; const res = response(); await createPayment({ user: ownerA, body: { registration_id: record.registration_id, amount: "2500", payment_method: "BANK_TRANSFER", transaction_reference: "TXN-001", ...body } }, res); restores.reverse().forEach((restore) => restore()); return { res, created, registrationUpdate }; }

test("Team Owner payment submission accepts both owned registrations and stores the authoritative fee and pending status", async () => {
  for (const record of [registration(11), registration(12)]) { const result = await submit({ record, body: { transaction_reference: `TXN-${record.team.team_id}`, status: "PAID", reviewed_by: 1, updated_at: "spoof" } }); assert.equal(result.res.result.statusCode, 201); assert.equal(result.created.registration_id, record.registration_id); assert.equal(result.created.amount, fee); assert.equal(result.created.payment_status, "PENDING"); assert.equal(result.registrationUpdate, true); }
});

test("payment submission rejects a foreign registration before any payment mutation", async () => {
  const foreign = registration(22, { team: { team_id: 22, name: "Team B", owner_id: 202, club: { owner_id: 202 } } }); const result = await submit({ record: foreign }); assert.equal(result.res.result.statusCode, 403); assert.equal(result.created, undefined); assert.equal(result.registrationUpdate, false);
});

test("payment submission preserves integrity for fee tampering, duplicate payment, and invalid registration state", async () => {
  for (const input of [{ body: { amount: "2499" } }, { body: { amount: "2501" } }, { body: { amount: "0" } }, { existingPayment: { payment_id: 2, payment_status: "PENDING" } }, { record: registration(11, { registration_status: "APPROVED" }) }]) { const result = await submit(input); assert.ok([400, 409].includes(result.res.result.statusCode)); assert.equal(result.created, undefined); assert.equal(result.registrationUpdate, false); }
});

test("Team Owner payment route guard returns not found for a foreign registration", async () => {
  const restore = replace(prisma.competitionRegistration, "findFirst", async () => null); const res = response(); let nextCalled = false; await requireOwnedRegistrationForPayment({ user: ownerA, body: { registration_id: 900 } }, res, () => { nextCalled = true; }); restore(); assert.equal(res.result.statusCode, 404); assert.equal(nextCalled, false);
});
