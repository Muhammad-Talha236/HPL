import { Prisma } from "@prisma/client";
import prisma from "../../database/prisma.js";
import { createWorkflowService, registrationDTO, registrationState } from "./workflow.service.js";
import { requireRule, exactFields } from "./workflow.validation.js";
import { receiptDownloadUrl, uploadRegistrationFile } from "./workflow.upload.js";

const service = createWorkflowService(prisma);
export const endpoint = handler => async (req, res) => {
  try { const data = await handler(req, res); if (!res.headersSent) res.json({ success: true, data }); }
  catch (error) {
    const status = error.status || (["P2002", "P2034"].includes(error.code) || [error.meta?.code, error.meta?.driverAdapterError?.cause?.originalCode].includes("55P03") ? 409 : error.code === "P2025" ? 404 : 503);
    if (!error.status) console.error("Competition workflow failed", { code: error.code || "UNKNOWN" });
    if (!res.headersSent) res.status(status).json({ success: false, message: error.status ? error.message : status === 409 ? "A duplicate or conflicting request was detected. Refresh and try again." : "This operation could not be completed. Please try again.", ...(error.existing_registration ? { existing_registration: error.existing_registration } : {}), ...(error.field ? { errors: [{ field: error.field, message: error.message }] } : {}) });
  }
};
const id = value => { const n = Number(value); requireRule(Number.isInteger(n) && n > 0, "Invalid record ID."); return n; };
export const saveAccount = endpoint(req => service.saveAccount(req.body, req.user, req.params.account_id ? id(req.params.account_id) : undefined));
export const listAccounts = endpoint(() => prisma.paymentAccount.findMany({ orderBy: { payment_account_id: "asc" } }));
export const saveCompetition = endpoint(req => service.saveCompetition(req.body, req.user, req.params.competition_id ? id(req.params.competition_id) : undefined));
export const competitionAction = endpoint(req => { exactFields(req.body, []); requireRule(["publish", "close", "finalize"].includes(req.params.action), "Invalid competition action."); return service.competitionAction(id(req.params.competition_id), req.params.action, req.user); });
export const submit = endpoint((req, res) => { requireRule(Number.isInteger(req.body?.competition_id) && req.body.competition_id > 0, "Select a valid competition."); exactFields(req.body, ["competition_id", "team", "roster", "payment"]); requireRule(req.body.team && Array.isArray(req.body.roster), "Enter a new team and complete player roster."); res.status(201); return service.submit(req.body, req.user); });
export const resubmit = endpoint(req => { requireRule(Number.isInteger(req.body?.competition_id) && req.body.competition_id > 0, "Select a valid competition."); return service.submit(req.body, req.user, id(req.params.registration_id)); });
export const detail = endpoint(req => service.detail(id(req.params.registration_id), req.user));
export const review = endpoint(req => { exactFields(req.body, ["action", "reason"]); return service.review(id(req.params.registration_id), req.body, req.user, req.params.kind === "payment-review"); });
export const upload = endpoint(req => { exactFields(req.body, ["base64"]); return uploadRegistrationFile(prisma, req.user, req.body, req.params.kind === "receipt-upload"); });
export const download = endpoint(async (req, res) => {
  requireRule(typeof req.params.receipt_id === "string" && /^[a-f0-9-]{36}$/.test(req.params.receipt_id), "Receipt not found.", 404);
  const row = await prisma.paymentReceipt.findUnique({ where: { receipt_id: req.params.receipt_id } });
  requireRule(row && (row.owner_id === req.user.user_id || req.user.role === "SUPER_ADMIN"), "Receipt not found.", 404);
  res.set("Cache-Control", "no-store").set("Referrer-Policy", "no-referrer");
  return { download_url: receiptDownloadUrl(row), expires_in: 300 };
});
export const list = endpoint(async req => {
  const page = id(req.query.page || 1), limit = Number(req.query.limit || 20);
  requireRule(Number.isInteger(limit) && limit > 0 && limit <= 50, "Invalid page size.");
  const where = req.user.role === "SUPER_ADMIN" && req.query.scope === "admin" ? {} : { registered_by: req.user.user_id };
  if (req.query.competition_id) where.competition_id = id(req.query.competition_id);
  if (req.query.status) { requireRule(["PENDING", "CHANGES_REQUESTED", "APPROVED", "REJECTED"].includes(req.query.status), "Invalid status."); where.registration_status = req.query.status; }
  if (req.query.payment_status) { requireRule(["NOT_REQUIRED", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "PAID", "UNPAID", "PENDING"].includes(req.query.payment_status), "Invalid payment status."); where.payment_status = req.query.payment_status; }
  const q = String(req.query.q || "").trim(); requireRule(q.length <= 100, "Search is too long.");
  if (q) where.OR = [{ team_name_key: { contains: q.toLowerCase() } }, { team: { name: { contains: q, mode: "insensitive" } } }, { registered_user: { name: { contains: q, mode: "insensitive" } } }];
  const rows = await prisma.competitionRegistration.findMany({ where, include: { competition: { include: { season: true } }, team: true, registered_user: { select: { name: true, email: true } }, players: true }, orderBy: { registration_date: "desc" }, skip: (page - 1) * limit, take: limit });
  const total = await prisma.competitionRegistration.count({ where });
  return { items: rows.map(registrationDTO), pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
});
export const publicCompetitions = endpoint(async req => {
  // Preserve archived tournament discovery. Publication controls visibility;
  // registrationState and submission checks still reject inactive competitions.
  const where = { status: { in: ["ACTIVE", "INACTIVE"] }, publication_status: "PUBLISHED", ...(req.query.season_id ? { season_id: id(req.query.season_id) } : {}) };
  if (req.params.competition_id) where.competition_id = id(req.params.competition_id);
  const rows = await prisma.competition.findMany({ where, include: { season: { select: { season_id: true, name: true, status: true } }, payment_accounts: { where: { status: "ACTIVE" }, select: { payment_account_id: true, provider: true, account_title: true, account_number: true, bank_name: true, instructions: true } }, _count: { select: { registrations: { where: { registration_status: "APPROVED" } }, matches: true } } }, orderBy: { competition_id: "desc" }, take: 100 });
  const data = rows.map(c => ({ ...c, registration_state: registrationState(c), approved_team_count: c._count.registrations, match_count: c._count.matches }));
  if (req.params.competition_id) { requireRule(data[0], "Competition not found.", 404); return data[0]; }
  return data;
});
export const manageCompetitions = endpoint(async req => {
  const rows = await prisma.competition.findMany({ ...(req.params.competition_id ? { where: { competition_id: id(req.params.competition_id) } } : {}), include: { season: { select: { season_id: true, name: true, status: true } }, payment_accounts: true, _count: { select: { registrations: true, matches: true } } }, orderBy: { competition_id: "desc" }, take: 100 });
  const groups = rows.length ? await prisma.competitionRegistration.groupBy({ by: ["competition_id", "registration_status", "payment_status"], where: { competition_id: { in: rows.map(c => c.competition_id) } }, _count: { _all: true } }) : [];
  const captainCounts = rows.length ? await prisma.competitionRegistration.groupBy({ by: ["competition_id"], where: { competition_id: { in: rows.map(c => c.competition_id) }, team_snapshot: { not: Prisma.DbNull } }, _count: { _all: true } }) : [];
  const result = [];
  for (const c of rows) {
    result.push({ ...c, registration_state: registrationState(c), captain_application_count: captainCounts.find(g => g.competition_id === c.competition_id)?._count._all || 0, application_counts: groups.filter(g => g.competition_id === c.competition_id), payment_account_ids: c.payment_accounts.map(a => a.payment_account_id) });
  }
  if (req.params.competition_id) { requireRule(result[0], "Competition not found.", 404); return result[0]; }
  return result;
});

export const releaseName = endpoint(req => { exactFields(req.body, ["reason"]); return service.releaseName(id(req.params.registration_id), req.body.reason, req.user); });
