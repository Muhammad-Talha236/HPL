import { createApprovalEmailDelivery } from "../../services/registrationApprovalEmail.service.js";
import { sendCaptainApprovalEmail, setApprovalTransportFactoryForTests, resetApprovalTransportFactoryForTests } from "../../services/registrationMail.service.js";
import { AsyncLocalStorage } from "node:async_hooks";
import test from "node:test";
import assert from "node:assert/strict";
import { createWorkflowService, registrationState } from "./workflow.service.js";
import { validateAccount, validateCompetition, validateSubmission } from "./workflow.validation.js";
import { inspectUpload, uploadRegistrationFile, receiptDownloadUrl } from "./workflow.upload.js";

import express from "express";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import prisma from "../../database/prisma.js";
import { ENV } from "../../config/env.js";
import { getAccountMailConfig } from "../../config/accountMail.config.js";
import registrationRoutes from "./registration.routes.js";
import competitionRoutes from "../competitions/competition.routes.js";
import adminRoutes from "../admin/admin.routes.js";
// API tests below exercise the real routers and JWT middleware over localhost.

const user = { user_id: 42, role: "USER" }, admin = { user_id: 1, role: "SUPER_ADMIN" };
const day = offset => { const d = new Date(); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
const competition = extra => ({ competition_id: 2, season_id: 1, name: "Hunza Cup", status: "ACTIVE", publication_status: "PUBLISHED", registration_workflow: "MANUAL_ROSTER", tournament_state: "NOT_CONFIGURED", registration_start_date: new Date(day(-1)), registration_end_date: new Date(day(2)), min_players: 2, squad_size: 4, max_teams: 2, registration_type: "FREE", registration_fee: 0, gender: "MEN", payment_account_ids: [1], ...extra });
const roster = () => [{ name: "Ali Shah", date_of_birth: "2000-03-01", position: "Midfielder", jersey_number: 7, profile_photo: null }, { name: "Hamza Khan", date_of_birth: "2001-07-12", position: "Goalkeeper", jersey_number: 1, profile_photo: null }];
const body = (name = "Hunza Stars", payment) => ({ competition_id: 2, team: { name, city: "Karimabad", contact_phone: "03001234567", logo: null }, roster: roster(), ...(payment ? { payment } : {}) });
const receiptId = "9d52a5d3-5c2a-4cc9-b7de-e06d7c4e4c01";
const proof = () => ({ payment_account_id: 1, transaction_reference: "txn_1234", receipt_id: receiptId });

// A serialized, rollback-capable test double. It deliberately rejects overlapping
// operations on an interactive client and models the unique keys used in SQL.
// This verifies service behavior, not PostgreSQL's implementation of row locks.
function fixture(options = {}) {
  let state = { competition: competition(options.competition), registrations: [], payments: [], teams: [], players: [], memberships: [], competitionPlayers: [], audits: [], history: [], notifications: [], emailJobs: [], emails: [], receipts: [{ receipt_id: receiptId, owner_id: 42, expires_at: new Date(Date.now() + 86400000), consumed_registration_id: null }], accounts: [{ payment_account_id: 1, provider: "JAZZCASH", account_title: "HPL", account_number: "03001112222", status: "ACTIVE" }], sequence: 10 };
  const context = new AsyncLocalStorage();
  const calls = []; let tail = Promise.resolve(), txOperation = false;
  const operation = (label, fn, transactional) => async args => { if (transactional) { assert.equal(txOperation, false, `Overlapping operation: ${label}`); txOperation = true; } calls.push(label); try { await new Promise(resolve => setImmediate(resolve)); if (options.failAt === label) throw Object.assign(new Error("Injected rollback failure"), { code: options.failCode || "P2028", meta: options.errorMeta }); return fn(args); } finally { if (transactional) txOperation = false; } };
  const match = (r, w = {}) => Object.entries(w).every(([k, v]) => k === "OR" ? v.some(x => match(r, x)) : typeof v === "object" && v !== null ? (v.array_contains ? v.array_contains.every(entry => r[k]?.some(x => match(x, entry))) : v.in ? v.in.includes(r[k]) : v.notIn ? !v.notIn.includes(r[k]) : v.not !== undefined ? v.not === Prisma.DbNull ? r[k] != null : r[k] !== v.not : v.equals !== undefined ? String(r[k]).toLowerCase() === String(v.equals).toLowerCase() : true) : r[k] === v);
  const duplicate = () => { throw Object.assign(new Error("Unique constraint"), { code: "P2002" }); };
  const decorate = r => r ? structuredClone({ ...r, competition: { ...state.competition, season: { season_id: 1, name: "HPL Season", status: "ACTIVE" } }, registered_user: { user_id: r.registered_by, name: "Representative", email: "registered@example.com" }, team: state.teams.find(t => t.team_id === r.team_id) || null, players: state.competitionPlayers.filter(p => p.registration_id === r.registration_id).map(p => ({ ...p, player: state.players.find(x => x.player_id === p.player_id) })), payments: state.payments.filter(p => p.registration_id === r.registration_id).sort((a,b) => b.payment_id-a.payment_id), approval_email: state.emailJobs.find(e => e.registration_id === r.registration_id) || null, approval_history: state.history.filter(h => h.registration_id === r.registration_id) }) : null;
  const client = transactional => {
    const wrap = (label, fn) => operation(label, fn, transactional);
    return {
      $queryRaw: async (strings, ...values) => wrap("raw", () => { const sql = strings.join("?"); assert.equal(/pg_advisory_xact_lock\([^]*\)\s+AS/i.test(sql), false, "No void columns"); if (sql.includes('FROM "Competition" c')) return [structuredClone(state.competition)]; if (sql.includes("HAVING t.team_id")) return state.registrations.filter(r => r.registration_status === "APPROVED" && (state.teams.find(t => t.team_id === r.team_id)?.status !== "ACTIVE" || state.competitionPlayers.filter(cp => cp.registration_id === r.registration_id).some(cp => state.players.find(p => p.player_id === cp.player_id)?.status !== "ACTIVE"))).map(r => ({ registration_id: r.registration_id })); if (sql.includes('FROM "CompetitionRegistration"')) return state.registrations.filter(r => r.registration_id === values[0]).map(r => structuredClone(r)); if (sql.includes('FROM "PaymentAccount"')) return state.accounts.filter(a => a.payment_account_id === values[0]).map(a => structuredClone(a)); assert.match(sql, /IS NULL AS locked/); return [{ locked: false }]; })(),
      $executeRaw: wrap("raw.execute", () => 1),
      season: { findUnique: wrap("season.findUnique", () => ({ status: "ACTIVE", start_date: new Date(day(-30)), end_date: new Date(day(30)) })) },
      user: { findUnique: wrap("user.findUnique", () => ({ name: "Representative", email: "registered@example.com", email_verified_at: options.verified ? new Date() : null, status: "ACTIVE" })), findMany: wrap("user.findMany", () => [{ user_id: 1 }]) },
      competition: { findUnique: wrap("competition.findUnique", () => structuredClone(state.competition)), findFirst: wrap("competition.findFirst", () => null), create: wrap("competition.create", ({ data }) => { state.competition = { ...data, competition_id: 2 }; return structuredClone(state.competition); }), update: wrap("competition.update", ({ data }) => { Object.assign(state.competition, data); return structuredClone(state.competition); }) },
      competitionRegistration: {
        findFirst: wrap("registration.findFirst", ({ where }) => structuredClone(state.registrations.find(r => match(r, where)) || null)),
        findMany: wrap("registration.findMany", ({ where, select }) => state.registrations.filter(r => match(r, where)).map(r => select?.team ? { team: Object.fromEntries(Object.keys(select.team.select).map(key => [key, state.teams.find(t => t.team_id === r.team_id)?.[key] ?? null])) } : decorate(r))),
        findUnique: wrap("registration.findUnique", ({ where, select }) => { const r = state.registrations.find(x => x.registration_id === where.registration_id); if (select?.registered_user) return decorate(r); return select ? r && Object.fromEntries(Object.keys(select).map(k => [k, r[k]])) : decorate(r); }),
        count: wrap("registration.count", ({ where }) => state.registrations.filter(r => match(r, where)).length),
        create: wrap("registration.create", ({ data }) => { if (state.registrations.some(r => r.competition_id === data.competition_id && (r.team_name_key === data.team_name_key || r.registered_by === data.registered_by))) duplicate(); const r = { registration_id: ++state.sequence, team_id: null, ...data }; state.registrations.push(r); return structuredClone(r); }),
        update: wrap("registration.update", ({ where, data }) => { const r = state.registrations.find(r => r.registration_id === where.registration_id); if (data.team_name_key && state.registrations.some(x => x.registration_id !== r.registration_id && x.team_name_key === data.team_name_key)) duplicate(); Object.assign(r, data); return structuredClone(r); })
      },
      paymentAccount: { findMany: wrap("account.findMany", ({ where }) => state.accounts.filter(a => match(a, where))), count: wrap("account.count", ({ where }) => state.accounts.filter(a => match(a, where)).length), create: wrap("account.create", ({ data }) => { if (state.accounts.some(a => a.provider === data.provider && a.account_number === data.account_number)) duplicate(); const a = { payment_account_id: ++state.sequence, ...data }; state.accounts.push(a); return a; }), update: wrap("account.update", ({ where, data }) => { const a = state.accounts.find(a => a.payment_account_id === where.payment_account_id); Object.assign(a, data); return a; }) },
      paymentReceipt: { findUnique: wrap("receipt.findUnique", ({ where }) => structuredClone(state.receipts.find(r => r.receipt_id === where.receipt_id))), updateMany: wrap("receipt.updateMany", ({ where, data }) => { const rows = state.receipts.filter(r => match(r, where)); rows.forEach(r => Object.assign(r, data)); return { count: rows.length }; }) },
      payment: { findFirst: wrap("payment.findFirst", ({ where }) => structuredClone(state.payments.filter(r => match(r, where)).sort((a,b) => b.payment_id-a.payment_id)[0] || null)), create: wrap("payment.create", ({ data }) => { const p = { payment_id: ++state.sequence, verified_by: null, created_at: new Date(), ...data }; state.payments.push(p); return p; }), update: wrap("payment.update", ({ where, data }) => { const p = state.payments.find(p => p.payment_id === where.payment_id); Object.assign(p, data); return p; }) },
      team: { create: wrap("team.create", ({ data }) => { const t = { team_id: ++state.sequence, ...data }; state.teams.push(t); return t; }) },
      player: { createManyAndReturn: wrap("player.createManyAndReturn", ({ data }) => { const players = data.map(p => ({ player_id: ++state.sequence, ...p })); state.players.push(...players); return [...players].reverse(); }) },
      teamPlayer: { createMany: wrap("membership.createMany", ({ data }) => { state.memberships.push(...data); return { count: data.length }; }) },
      competitionPlayer: { createMany: wrap("competitionPlayers.createMany", ({ data }) => { state.competitionPlayers.push(...data); return { count: data.length }; }) },
      auditLog: { create: wrap("audit.create", ({ data }) => { state.audits.push(data); return data; }) },
      registrationApprovalHistory: { create: wrap("history.create", ({ data }) => { state.history.push(data); return data; }) },
      registrationApprovalEmail: {
        create: wrap("emailJob.create", ({ data }) => { if(state.emailJobs.some(e => e.registration_id === data.registration_id)) duplicate(); const e = { status: "PENDING", attempts: 0, ...data }; state.emailJobs.push(e); return e; }),
        updateMany: wrap("emailJob.updateMany", ({ where, data }) => { const rows = state.emailJobs.filter(e => match(e, where)); for(const e of rows) for(const [k,v] of Object.entries(data)) e[k] = v?.increment ? e[k] + v.increment : v; return { count: rows.length }; }),
        findMany: wrap("emailJob.findMany", ({where}) => structuredClone(state.emailJobs.filter(e => match(e,where))))
      },
      notification: { createMany: wrap("notifications.createMany", ({ data }) => { assert.notEqual(context.getStore(), true, "Notifications must run after commit"); if (options.notificationFailure) throw new Error("Notification unavailable"); state.notifications.push(...data); }) }
    };
  };
  const db = client(false);
  db.$transaction = async (callback, config) => { assert.equal(config.timeout, 10000); const previous = tail; let release; tail = new Promise(resolve => { release = resolve; }); await previous; const before = structuredClone(state);  try { return await context.run(true, () => callback(client(true))); } catch (e) { state = before; throw e; } finally { release(); } };
  options.sendApprovalEmail ||= async input => { assert.notEqual(context.getStore(), true, "SMTP runs after commit"); state.emails.push(input); return { accepted: true, messageId: "test-accepted" }; };
  return { db, service: createWorkflowService(db, options), state: () => state, calls, options };
}

test("free submission snapshots current account without publishing teams or players", async () => {
  const f = fixture(); const r = await f.service.submit(body(), user);
  assert.equal(r.registration_status, "PENDING"); assert.equal(r.payment_status, "NOT_REQUIRED"); assert.equal(r.team_id, null); assert.equal(r.team_snapshot.representative_email, "registered@example.com"); assert.equal(r.registered_by, 42); assert.equal(r.roster.length, 2);
  assert.equal(f.state().teams.length, 0); assert.equal(f.state().players.length, 0); assert.equal(f.state().payments.length, 0); assert.equal(f.state().notifications.length, 2);
  await assert.rejects(f.service.detail(r.registration_id, { user_id: 99, role: "USER" }), e => e.status === 404);
});
test("approval atomically publishes the roster once with correct jerseys even when returned player order differs", async () => {
  const f = fixture(); const r = await f.service.submit(body(), user); const approved = await f.service.review(r.registration_id, { action: "APPROVE" }, admin);
  assert.equal(approved.registration_status, "APPROVED"); assert.equal(f.state().teams.length, 1); assert.equal(f.state().players.length, 2); assert.equal(f.state().competitionPlayers.length, 2);
  for (const m of f.state().memberships) { const p = f.state().players.find(p => p.player_id === m.player_id); assert.equal(m.jersey_number, roster().find(x => x.name === p.name).jersey_number); assert.equal(m.status, "ACTIVE"); assert.ok(m.joined_at instanceof Date); assert.equal(p.user_id, undefined); }
  assert.equal(f.state().teams[0].owner_id, 42); assert.ok(!f.calls.includes("user.update"));
  await assert.rejects(f.service.review(r.registration_id, { action: "APPROVE" }, admin), e => e.status === 409); assert.equal(f.state().teams.length, 1);
});
test("concurrent submissions and repeated approval cannot duplicate a team", async () => {
  const f = fixture(); const submissions = await Promise.allSettled([f.service.submit(body(), user), f.service.submit(body("  HUNZA   STARS  "), user)]);
  assert.equal(submissions.filter(r => r.status === "fulfilled").length, 1); assert.equal(f.state().registrations.length, 1);
  const id = f.state().registrations[0].registration_id;
  const approvals = await Promise.allSettled([f.service.review(id, { action: "APPROVE" }, admin), f.service.review(id, { action: "APPROVE" }, admin)]);
  assert.equal(approvals.filter(r => r.status === "fulfilled").length, 1); assert.equal(f.state().teams.length, 1); assert.equal(f.state().memberships.length, 2);
});
test("concurrent approvals enforce confirmed capacity, not pending application count", async () => {
  const f = fixture({ competition: { max_teams: 1 } }); const a = await f.service.submit(body("First Team"), user), b = await f.service.submit(body("Second Team"), { ...user, user_id: 43 });
  const results = await Promise.allSettled([f.service.review(a.registration_id, { action: "APPROVE" }, admin), f.service.review(b.registration_id, { action: "APPROVE" }, admin)]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1); assert.equal(f.state().teams.length, 1);
  await assert.rejects(f.service.submit(body("Third Team"), user), e => e.status === 409);
});
test("approval failures roll back Team, Player, memberships, registration, history and audit together", async () => {
  for (const failAt of ["player.createManyAndReturn", "membership.createMany", "competitionPlayers.createMany", "registration.update", "emailJob.create", "history.create", "audit.create"]) {
    const f = fixture(); const r = await f.service.submit(body(), user); const audits = f.state().audits.length; f.options.failAt = failAt;
    await assert.rejects(f.service.review(r.registration_id, { action: "APPROVE" }, admin), e => e.code === "P2028");
    assert.equal(f.state().teams.length, 0, failAt); assert.equal(f.state().players.length, 0); assert.equal(f.state().memberships.length, 0); assert.equal(f.state().competitionPlayers.length, 0); assert.equal(f.state().emailJobs.length, 0); assert.equal(f.state().emails.length, 0); assert.equal(f.state().history.length, 0); assert.equal(f.state().audits.length, audits); assert.equal(f.state().registrations[0].registration_status, "PENDING");
  }
});
test("paid proof snapshots the account and requires separate verification before approval", async () => {
  const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); const r = await f.service.submit(body("Paid Team", proof()), user);
  assert.equal(r.payment_status, "PENDING_VERIFICATION"); assert.equal(r.fee_snapshot, 1500); assert.equal(r.payments[0].amount, 1500); assert.equal(r.payments[0].transaction_reference, "TXN_1234"); assert.equal(f.state().receipts[0].consumed_registration_id, r.registration_id);
  f.state().accounts[0].account_title = "Changed receiving title"; assert.equal(r.payments[0].receiving_account_snapshot.account_title, "HPL");
  await assert.rejects(f.service.review(r.registration_id, { action: "APPROVE" }, admin), e => e.status === 409);
  await f.service.review(r.registration_id, { action: "VERIFY" }, admin, true); const approved = await f.service.review(r.registration_id, { action: "APPROVE" }, admin);
  assert.equal(approved.registration_status, "APPROVED"); assert.equal(approved.payment_status, "VERIFIED"); assert.equal(approved.payments[0].verified_by, 1); assert.ok(approved.payments[0].paid_at instanceof Date);
});
test("corrections retain the roster and old proofs, permit replacement and reset payment verification", async () => {
  const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); const r = await f.service.submit(body("Paid Team", proof()), user);
  await f.service.review(r.registration_id, { action: "REJECT", reason: "Reference is not visible" }, admin, true);
  const secondReceipt = "9d52a5d3-5c2a-4cc9-b7de-e06d7c4e4c02"; f.state().receipts.push({ ...f.state().receipts[0], receipt_id: secondReceipt, consumed_registration_id: null });
  const changed = await f.service.submit(body("Paid Team", { ...proof(), transaction_reference: "TXN_5678", receipt_id: secondReceipt }), user, r.registration_id);
  assert.equal(changed.registration_status, "PENDING"); assert.equal(changed.payment_status, "PENDING_VERIFICATION"); assert.equal(changed.roster.length, 2); assert.equal(changed.payments[0].proof_history[0].receipt_id, receiptId); assert.equal(changed.payments[0].verified_by, null); assert.equal(f.state().payments.length, 2); assert.equal(f.state().payments[0].transaction_reference, "TXN_1234"); assert.equal(f.state().payments[0].payment_status, "SUPERSEDED");
});
test("foreign, expired, reused receipts and duplicate references fail without partial submissions", async () => {
  for (const patch of [{ owner_id: 99 }, { expires_at: new Date(0) }, { consumed_registration_id: 99 }]) {
    const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); Object.assign(f.state().receipts[0], patch); await assert.rejects(f.service.submit(body("Paid Team", proof()), user)); assert.equal(f.state().registrations.length, 0); assert.equal(f.state().payments.length, 0);
  }
  const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); f.state().payments.push({ registration_id: 99, transaction_reference: "txn_1234" }); await assert.rejects(f.service.submit(body("Paid Team", proof()), user), e => e.status === 409); assert.equal(f.state().registrations.length, 0); assert.equal(f.state().receipts[0].consumed_registration_id, null);
});
test("unchanged paid proof can be resubmitted after roster corrections without consuming the receipt again", async () => {
  const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); const r = await f.service.submit(body("Paid Team", proof()), user); await f.service.review(r.registration_id, { action: "VERIFY" }, admin, true); await f.service.review(r.registration_id, { action: "REQUEST_CHANGES", reason: "Correct player spelling" }, admin);
  const data = body("Paid Team", proof()); data.roster[0].name = "Ali Shah Khan"; const updated = await f.service.submit(data, user, r.registration_id); assert.equal(updated.payment_status, "VERIFIED"); assert.equal(updated.roster[0].name, "Ali Shah Khan"); assert.equal(f.state().receipts.length, 1);
});
test("draft, closed, inactive, upcoming and finalized competitions reject new submissions", async () => {
  for (const c of [{ publication_status: "DRAFT" }, { registration_end_date: new Date(day(-2)) }, { status: "INACTIVE" }, { registration_start_date: new Date(day(2)) }, { participants_finalized_at: new Date() }]) { const f = fixture({ competition: c }); await assert.rejects(f.service.submit(body(), user), e => e.status === 409); assert.equal(f.state().registrations.length, 0); }
});
test("authorization, transition and client-field spoofing are enforced", async () => {
  const f = fixture(); const r = await f.service.submit(body(), user);
  await assert.rejects(f.service.review(r.registration_id, { action: "APPROVE" }, user), e => e.status === 403);
  await assert.rejects(f.service.submit(body(), { user_id: 99 }, r.registration_id), e => e.status === 409);
  await assert.rejects(f.service.submit({ ...body("Injected Team"), registered_by: 99 }, { ...user, user_id: 43 }), e => e.status === 400);
  await assert.rejects(f.service.review(r.registration_id, { action: "REJECT" }, admin), e => e.status === 400);
  await assert.rejects(f.service.review(r.registration_id, { action: "VERIFY" }, admin, true), e => e.status === 409);
});
test("finalization waits for closed registration and resolved applications, then locks participants without selecting format", async () => {
  const f = fixture(); const r = await f.service.submit(body(), user);
  await assert.rejects(f.service.competitionAction(2, "finalize", admin), e => e.status === 409);
  await f.service.competitionAction(2, "close", admin); await assert.rejects(f.service.competitionAction(2, "finalize", admin), e => e.status === 409);
  await f.service.review(r.registration_id, { action: "APPROVE" }, admin); await f.service.competitionAction(2, "finalize", admin);
  assert.ok(f.state().competition.participants_finalized_at); assert.equal(f.state().competition.participants_finalized_by, 1); assert.equal(f.state().competition.tournament_state, "NOT_CONFIGURED"); assert.equal(f.state().competition.format, undefined);
  await assert.rejects(f.service.review(r.registration_id, { action: "REJECT", reason: "Too late" }, admin), e => e.status === 409); await assert.rejects(f.service.competitionAction(2, "finalize", admin), e => e.status === 409);
});
test("notification failure does not undo a committed registration", async () => {
  const f = fixture({ notificationFailure: true }); const r = await f.service.submit(body(), user); assert.equal(r.registration_status, "PENDING"); assert.equal(f.state().registrations.length, 1);
});
test("competition validation permits no tournament format and canonicalizes receiving-account aliases", () => {
  const c = { name: "  Hunza   Cup ", season_id: 1, gender: "WOMEN", registration_start_date: day(-1), registration_end_date: day(2), max_teams: 8, min_players: 2, squad_size: 20, registration_type: "FREE", registration_fee: 999 };
  assert.equal(validateCompetition(c).registration_fee, 0); assert.equal(validateCompetition(c).name, "Hunza Cup"); assert.equal(validateCompetition(c).publication_status, "DRAFT");
  assert.throws(() => validateCompetition({ ...c, format: "LEAGUE" })); assert.throws(() => validateCompetition({ ...c, registration_type: "PAID", registration_fee: 1500, payment_account_ids: [] })); assert.throws(() => validateCompetition({ ...c, min_players: 21 })); assert.throws(() => validateCompetition({ ...c, gender: "INVALID" }));
  const a = { provider: "JAZZCASH", account_title: "HPL", account_number: "+923001112222" }; assert.equal(validateAccount(a).account_number, "03001112222"); assert.throws(() => validateAccount({ ...a, PIN: "secret" })); assert.throws(() => validateAccount({ ...a, provider: "BANK_TRANSFER" }));
});
test("roster validation rejects missing fields, invalid dates, duplicate identities and jerseys", () => {
  for (const mutate of [r => { r[0].date_of_birth = "2000-02-31"; }, r => { r[0].jersey_number = 1; }, r => { r[0].name = ""; }, r => { r[1] = { ...r[0], jersey_number: 9 }; }, r => { r[0].email = "not-required@example.com"; }, r => { r.length = 1; }]) { const b = body(); mutate(b.roster); assert.throws(() => validateSubmission(b, competition())); }
});
test("registration end date includes the entire UTC day", () => {
  const c = competition({ registration_start_date: new Date("2026-10-01"), registration_end_date: new Date("2026-10-13") }); assert.equal(registrationState(c, new Date("2026-10-13T23:59:59Z")), "OPEN"); assert.equal(registrationState(c, new Date("2026-10-14T00:00:00Z")), "CLOSED");
});
test("uploads validate actual content, receipts use authenticated storage and short signed downloads", async () => {
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(20)]).toString("base64"), pdf = Buffer.from("%PDF-1.7\nobject\n%%EOF").toString("base64");
  assert.equal(inspectUpload(png).format, "png"); assert.equal(inspectUpload(pdf).format, "pdf"); assert.throws(() => inspectUpload(pdf, false)); assert.throws(() => inspectUpload(Buffer.from("fake.jpg file").toString("base64"))); assert.throws(() => inspectUpload("a===")); assert.throws(() => inspectUpload(Buffer.alloc(6 * 1024 * 1024).toString("base64")));
  let options, record, signed;
  const storage = { uploader: { upload_stream: (o, cb) => { options = o; return { end: () => cb(null, { public_id: o.public_id, secure_url: "https://example.com/asset" }) }; } }, utils: { private_download_url: (...args) => { signed = args; return "https://example.com/signed"; } } };
  const db = { paymentReceipt: { create: async ({ data }) => { record = data; return { receipt_id: receiptId }; } } };
  await uploadRegistrationFile(db, user, { base64: pdf }, true, storage); assert.equal(options.type, "authenticated"); assert.equal(options.resource_type, "raw"); assert.equal(record.owner_id, user.user_id); assert.ok(record.expires_at > new Date());
  receiptDownloadUrl(record, storage); assert.equal(signed[2].type, "authenticated"); assert.equal(signed[2].attachment, true); assert.ok(signed[2].expires_at <= Math.floor(Date.now() / 1000) + 300);
});

test("competition creation saves a draft with no format or fixture records; inactive accounts cannot be published", async () => {
  const f = fixture(); const input = { name: "New Competition", season_id: 1, gender: "MEN", registration_start_date: day(-1), registration_end_date: day(2), max_teams: 8, min_players: 2, squad_size: 20, registration_type: "PAID", registration_fee: 1500, payment_account_ids: [1] };
  const c = await f.service.saveCompetition(input, admin); assert.equal(c.publication_status, "DRAFT"); assert.equal(c.format, null); assert.equal(c.tournament_state, "NOT_CONFIGURED"); assert.equal(c.competition_start_date, undefined); assert.equal(f.state().teams.length, 0); assert.equal(f.state().players.length, 0);
  f.state().competition.payment_account_ids = [1]; f.state().accounts[0].status = "INACTIVE"; await assert.rejects(f.service.competitionAction(2, "publish", admin), e => e.status === 409);
  await assert.rejects(f.service.saveCompetition(input, user), e => e.status === 403);
});
test("financial settings freeze after submissions while descriptive corrections remain editable", async () => {
  const f = fixture(); await f.service.submit(body(), user);
  const input = { name: "Hunza Cup", season_id: 1, gender: "MEN", registration_start_date: day(-1), registration_end_date: day(2), max_teams: 2, min_players: 2, squad_size: 4, registration_type: "FREE", registration_fee: 0, payment_account_ids: [], publication_status: "PUBLISHED" };
  f.state().competition.payment_account_ids = [];
  await assert.rejects(f.service.saveCompetition({ ...input, max_teams: 8 }, admin, 2), e => e.status === 409);
  const c = await f.service.saveCompetition({ ...input, description: "Updated competition overview" }, admin, 2); assert.equal(c.description, "Updated competition overview");
});
test("historical replaced transaction references cannot fund another registration", async () => {
  const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); f.state().payments.push({ registration_id: 99, transaction_reference: "OTHER_TXN", proof_history: [{ transaction_reference: "TXN_1234", receipt_id: "old-proof" }] });
  await assert.rejects(f.service.submit(body("Paid Team", proof()), user), e => e.status === 409); assert.equal(f.state().registrations.length, 0);
});
test("optional status email targets the registered verified mailbox and delivery failure does not roll back", async () => {
  const sent = []; const f = fixture({ verified: true, emailEnabled: true, sendStatusEmail: async value => { sent.push(value); throw new Error("SMTP unavailable"); } });
  const r = await f.service.submit(body(), user); assert.equal(r.registration_status, "PENDING"); assert.equal(sent.length, 1); assert.equal(sent[0].email, "registered@example.com"); assert.equal(sent[0].registrationId, r.registration_id);
  const unverified = fixture({ emailEnabled: true, sendStatusEmail: async () => assert.fail("No unverified mailbox delivery") }); await unverified.service.submit(body(), user);
});

async function httpFixture(f, callback) {
  setApprovalTransportFactoryForTests(() => ({ sendMail: async message => { f.state().emails.push(message); return { accepted: [message.to], messageId: "http-test-accepted" }; }, close() {} }));
  const restores = [];
  const swap = (target, key, value) => { const previous = target[key]; target[key] = value; restores.push(() => { target[key] = previous; }); };
  for (const [model, methods] of Object.entries(f.db)) if (typeof methods === "object") for (const [method, fn] of Object.entries(methods)) swap(prisma[model], method, fn);
  swap(prisma, "$transaction", f.db.$transaction);
  swap(prisma.user, "findUnique", async ({ where }) => ({ user_id: where.user_id, name: "Representative", email: "registered@example.com", role: where.user_id === 1 ? "SUPER_ADMIN" : "USER", status: "ACTIVE", session_version: 0 }));
  swap(prisma.competition, "findMany", async ({ where }) => f.state().competition.publication_status === where.publication_status && (where.status?.in ? where.status.in.includes(f.state().competition.status) : f.state().competition.status === where.status) ? [{ ...f.state().competition, season: { season_id: 1, name: "Season", status: "ACTIVE" }, payment_accounts: [], _count: { registrations: 0, matches: 0 } }] : []);
  const app = express(); app.use(express.json({ limit: "7mb" })); app.use("/registrations", registrationRoutes); app.use("/competitions", competitionRoutes); app.use("/admin", adminRoutes);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const request = async (path, method = "GET", body, actor) => { const token = actor && jwt.sign({ user_id: actor.user_id, session_version: 0 }, ENV.JWT_SECRET, { algorithm: "HS256" }); const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); return { status: response.status, body: await response.json() }; };
  try { await callback(request); } finally { resetApprovalTransportFactoryForTests(); restores.reverse().forEach(restore => restore()); await new Promise(resolve => server.close(resolve)); }
}
test("real HTTP routes enforce JWT, account ownership, admin review and duplicate protection", async () => {
  const f = fixture(); await httpFixture(f, async request => {
    assert.equal((await request("/registrations/submissions", "POST", body())).status, 401);
    assert.equal((await request("/admin/payment-accounts", "POST", {}, user)).status, 403);
    assert.equal((await request("/registrations/submissions", "POST", { ...body(), registered_by: 99 }, user)).status, 400);
    const submitted = await request("/registrations/submissions", "POST", body(), user); assert.equal(submitted.status, 201); assert.equal(submitted.body.data.registered_by, 42);
    const id = submitted.body.data.registration_id;
    assert.equal((await request(`/registrations/submissions/${id}`, "GET", undefined, { user_id: 99 })).status, 404);
    assert.equal((await request(`/registrations/submissions/${id}/review`, "POST", { action: "APPROVE" }, user)).status, 403);
    assert.equal((await request(`/registrations/submissions/${id}/review`, "POST", { action: "APPROVE" }, admin)).body.data.registration_status, "APPROVED");
    const duplicate = await request(`/registrations/submissions/${id}/review`, "POST", { action: "APPROVE" }, admin); assert.equal(duplicate.status, 409); assert.ok(!JSON.stringify(duplicate.body).includes("Prisma"));
    assert.equal((await request(`/registrations/receipts/${receiptId}`, "GET", undefined, { user_id: 99 })).status, 404); assert.equal(f.state().teams.length, 1);
  });
});
test("HTTP paid approval requires verification and transaction errors remain generic without partial activation", async () => {
  const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); await httpFixture(f, async request => {
    const submitted = await request("/registrations/submissions", "POST", body("Paid Team", proof()), user); assert.equal(submitted.status, 201); const id = submitted.body.data.registration_id;
    assert.equal((await request(`/registrations/submissions/${id}/review`, "POST", { action: "APPROVE" }, admin)).status, 409);
    assert.equal((await request(`/registrations/submissions/${id}/payment-review`, "POST", { action: "VERIFY" }, admin)).status, 200);
    f.options.failAt = "player.createManyAndReturn"; const failed = await request(`/registrations/submissions/${id}/review`, "POST", { action: "APPROVE" }, admin); assert.equal(failed.status, 503); assert.ok(!JSON.stringify(failed.body).includes("P2028")); assert.equal(f.state().teams.length, 0); assert.equal(f.state().players.length, 0); assert.equal(f.state().registrations[0].registration_status, "PENDING");
  });
});
test("HTTP public competition endpoints omit drafts", async () => {
  const f = fixture({ competition: { publication_status: "DRAFT" } }); await httpFixture(f, async request => { assert.deepEqual((await request("/competitions")).body.data, []); assert.equal((await request("/competitions/2")).status, 404); });
});

test("inactive receiving accounts reject new proofs, and equivalent wallet numbers conflict", async () => {
  const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); f.state().accounts[0].status = "INACTIVE"; await assert.rejects(f.service.submit(body("Paid Team", proof()), user), e => e.status === 400); assert.equal(f.state().registrations.length, 0);
  await assert.rejects(f.service.saveAccount({ provider: "JAZZCASH", account_title: "Other title", account_number: "+923001112222" }, admin), e => e.code === "P2002");
});
test("finalization rechecks active roster eligibility after approval", async () => {
  const f = fixture(); const r = await f.service.submit(body(), user); await f.service.review(r.registration_id, { action: "APPROVE" }, admin); await f.service.competitionAction(2, "close", admin); f.state().players[0].status = "INACTIVE";
  await assert.rejects(f.service.competitionAction(2, "finalize", admin), e => e.status === 409); assert.equal(f.state().competition.participants_finalized_at, undefined);
});
test("HTTP user lists cannot be expanded with admin scope, and confirmed participants exclude pending applications", async () => {
  const f = fixture(); await httpFixture(f, async request => {
    const r = await request("/registrations/submissions", "POST", body(), user); const id = r.body.data.registration_id;
    assert.equal((await request("/registrations/submissions?scope=admin", "GET", undefined, { user_id: 99 })).body.data.items.length, 0);
    assert.equal((await request("/registrations/submissions", "GET", undefined, user)).body.data.items[0].registration_status, "PENDING");
    assert.equal((await request("/competitions/2/teams")).body.data.length, 0);
    await request(`/registrations/submissions/${id}/review`, "POST", { action: "APPROVE" }, admin); const confirmed = await request("/competitions/2/teams"); assert.equal(confirmed.body.data.length, 1); assert.equal(confirmed.body.data[0].name, "Hunza Stars"); assert.ok(!JSON.stringify(confirmed.body).includes("owner_id")); assert.ok(!JSON.stringify(confirmed.body).includes("registered@example.com"));
    const blocked = await request("/competitions/2", "PATCH", { format: "LEAGUE" }, admin); assert.equal(blocked.status, 409, JSON.stringify(blocked.body));
    const oldReview = await request(`/registrations/${id}/review`, "PATCH", { action: "APPROVE" }, admin); assert.equal(oldReview.status, 409, JSON.stringify(oldReview.body));
  });
});

test("correcting the same reference or reinstating this application's prior proof does not free transaction identities", async () => {
  const f = fixture({ competition: { registration_type: "PAID", registration_fee: 1500 } }); const r = await f.service.submit(body("Paid Team", proof()), user);
  const replace = async (reference, suffix) => {
    await f.service.review(r.registration_id, { action: "REQUEST_CHANGES", reason: "Correct payment proof" }, admin);
    const receipt_id = receiptId.slice(0, -1) + suffix; f.state().receipts.push({ receipt_id, owner_id: 42, expires_at: new Date(Date.now()+86400000), consumed_registration_id: null });
    return f.service.submit(body("Paid Team", { payment_account_id: 1, transaction_reference: reference, receipt_id }), user, r.registration_id);
  };
  await replace("TXN_5678", "2"); const restored = await replace("TXN_1234", "3"); assert.equal(restored.payments[0].transaction_reference, "TXN_1234"); assert.equal(restored.payments[0].payment_status, "PENDING_VERIFICATION"); assert.equal(f.state().payments.length, 2);
  const same = await replace("TXN_1234", "4"); assert.equal(same.payments[0].receipt_id, receiptId.slice(0,-1)+"4"); assert.equal(f.state().payments.length, 2); assert.equal(same.payments[0].proof_history.length, 3);
});
test("development transaction traces show operations and commit without contact, roster or SQL payloads", async () => {
  const original = process.env.NODE_ENV, debug = console.debug, logs = []; process.env.NODE_ENV = "development"; console.debug = (...args) => logs.push(args);
  try { const f = fixture(); await f.service.submit(body(), user); const operations = logs.map(x=>x[1].operation); assert.ok(operations.includes("competition lock")); assert.ok(operations.includes("commit")); assert.ok(operations.includes("competitionRegistration.create")); const text = JSON.stringify(logs); for (const value of ["registered@example.com", "03001234567", "Ali Shah", "Hunza Stars", "SELECT", "INSERT"]) assert.ok(!text.includes(value)); }
  finally { console.debug = debug; if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; }
});
test("HTTP lock contention is a retryable conflict rather than an exposed adapter error", async () => {
  const f = fixture({ failAt: "raw", failCode: "P2010", errorMeta: { code: "55P03" } }); await httpFixture(f, async request => { const result = await request("/registrations/submissions", "POST", body(), user); assert.equal(result.status, 409); assert.ok(!JSON.stringify(result.body).includes("55P03")); assert.equal(f.state().registrations.length, 0); });
});

test("published archived competitions remain discoverable with registration closed", async () => {
  const f = fixture({ competition: { status: "INACTIVE", registration_workflow: "LEGACY", tournament_state: "COMPLETED", format: "LEAGUE" } });
  await httpFixture(f, async request => { const detail = await request("/competitions/2"); assert.equal(detail.status, 200); assert.equal(detail.body.data.registration_state, "CLOSED"); assert.equal(detail.body.data.format, "LEAGUE"); assert.equal((await request("/competitions")).body.data.length, 1); });
});

test("a captain cannot create another application in any review state, including a changed name", async () => {
  for (const status of ["PENDING", "CHANGES_REQUESTED", "APPROVED", "REJECTED"]) {
    const f = fixture(); const r = await f.service.submit(body(), user);
    f.state().registrations[0].registration_status = status;
    await assert.rejects(f.service.submit(body("Another Name"), user), e => e.status === 409 && e.existing_registration.registration_id === r.registration_id);
    assert.equal(f.state().registrations.length, 1);
  }
});

test("concurrent different-name requests from one captain produce one application", async () => {
  const f = fixture(); const results = await Promise.allSettled([f.service.submit(body(), user), f.service.submit(body("Other Team"), user)]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(f.state().registrations.length, 1); assert.equal(f.state().teams.length, 0);
});

test("rejected names require an audited admin release without releasing captain identity", async () => {
  const f = fixture(); const r = await f.service.submit(body(), user);
  await f.service.review(r.registration_id, { action: "REJECT", reason: "Roster is ineligible" }, admin);
  const other = { ...user, user_id: 43 };
  await assert.rejects(f.service.submit(body(), other));
  await assert.rejects(f.service.releaseName(r.registration_id, "Release for another captain", user), e => e.status === 403);
  await f.service.releaseName(r.registration_id, "Captain withdrew this team name", admin);
  assert.ok(f.state().history.some(h => h.action === "NAME_RELEASED"));
  await assert.rejects(f.service.submit(body("Different Team"), user), e => e.status === 409);
  assert.equal((await f.service.submit(body(), other)).registration_status, "PENDING");
});

test("approval sends mandatory mail after commit once even with optional status mail disabled", async () => {
  const f = fixture({ emailEnabled: false }); const r = await f.service.submit(body(), user);
  await f.service.review(r.registration_id, { action: "APPROVE" }, admin);
  assert.equal(f.state().emails.length, 1); assert.equal(f.state().emails[0].email, "registered@example.com");
  assert.equal(f.state().emailJobs[0].status, "SENT"); assert.equal(f.state().emailJobs[0].attempts, 1);
  await assert.rejects(f.service.review(r.registration_id, { action: "APPROVE" }, admin), e => e.status === 409);
  await createApprovalEmailDelivery(f.db, f.options.sendApprovalEmail).drain();
  assert.equal(f.state().emails.length, 1);
});

test("SMTP failure preserves approval and records a failed delivery without automatic duplicates", async () => {
  let attempts = 0; const f = fixture({ sendApprovalEmail: async () => { attempts++; throw new Error("mock SMTP failure"); } });
  const r = await f.service.submit(body(), user); const approved = await f.service.review(r.registration_id, { action: "APPROVE" }, admin);
  assert.equal(approved.registration_status, "APPROVED"); assert.equal(f.state().teams.length, 1);
  assert.equal(f.state().emailJobs[0].status, "FAILED");
  await createApprovalEmailDelivery(f.db, f.options.sendApprovalEmail).drain(); assert.equal(attempts, 1);
});

test("pending email recovery has one claimant and uncertain SMTP persistence is not resent", async () => {
  const f = fixture(); const r = await f.service.submit(body(), user); await f.service.review(r.registration_id, { action: "APPROVE" }, admin);
  f.state().emails.length = 0; Object.assign(f.state().emailJobs[0], { status: "PENDING", attempts: 0 });
  const delivery = createApprovalEmailDelivery(f.db, f.options.sendApprovalEmail);
  await Promise.all([delivery.deliver(r.registration_id), delivery.deliver(r.registration_id)]);
  assert.equal(f.state().emails.length, 1); assert.equal(f.state().emailJobs[0].attempts, 1);
  f.state().emailJobs[0].status = "PENDING";
  const uncertain = createApprovalEmailDelivery(f.db, async input => { f.state().emails.push(input); f.options.failAt = "emailJob.updateMany"; return { accepted: true }; });
  await uncertain.deliver(r.registration_id); f.options.failAt = undefined;
  assert.equal(f.state().emailJobs[0].status, "SENDING");
  await delivery.drain(); assert.equal(f.state().emails.length, 2);
});

test("captain confirmation uses the exact subject and configured public links with no payment data", async () => {
  let message; const input = { email: "captain.test@example.com", captainName: "Captain Ali", teamName: "Hunza Stars", competitionName: "Hunza Cup", seasonName: "Season 2026", registrationId: 12, teamId: 21, competitionId: 2 };
  const factory = () => ({ sendMail: async value => { message = value; return { accepted: [value.to], messageId: "mock" }; }, close() {} });
  assert.equal((await sendCaptainApprovalEmail(input, factory)).accepted, true);
  assert.equal(message.subject, "Your Team Registration Has Been Approved — HPL"); assert.equal(message.to, input.email);
  assert.ok(message.text.includes("Hello Captain Ali")); assert.ok(message.text.includes("Season 2026"));
  assert.ok(message.text.includes(`${getAccountMailConfig().frontendUrl}/my/registrations/12`));
  for (const word of ["receipt", "transaction_reference", "account_number"]) assert.ok(!message.text.includes(word));
  await assert.rejects(sendCaptainApprovalEmail(input, () => ({ sendMail: async () => ({ accepted: [] }), close() {} })), /SMTP_NOT_ACCEPTED/);
});

test("retired saved-team API alias uses the same captain uniqueness enforcement", async () => {
  const f = fixture(); await httpFixture(f, async request => {
    assert.equal((await request("/registrations", "POST", body(), user)).status, 201);
    const duplicate = await request("/registrations/submissions", "POST", body("New Name"), user);
    assert.equal(duplicate.status, 409); assert.ok(duplicate.body.existing_registration);
    assert.equal((await request("/registrations", "POST", { competition_id: 2, team_id: 1 }, user)).status, 400);
  });
});

test("configured legacy competitions accept manual rosters without selecting existing teams", async () => {
  const f = fixture({ competition: { registration_workflow: "LEGACY", format: "LEAGUE" } });
  const r = await f.service.submit(body(), user); assert.equal(r.team_id, null); assert.equal(r.roster_snapshot.length, 2);
  assert.equal(f.state().competition.format, "LEAGUE"); assert.equal(f.state().teams.length, 0);
});
