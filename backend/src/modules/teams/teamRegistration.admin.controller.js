import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { getTeamSquadReadiness, TEAM_REQUEST_STATUS, TEAM_VERIFICATION } from "./teamRegistration.controller.js";

const SQUAD_DEADLINE_DAYS = 30;
const REVIEWABLE = [TEAM_REQUEST_STATUS.PENDING];

const requestSelect = {
  team_registration_request_id: true, applicant_user_id: true, linked_team_id: true, name: true, logo: true, gender: true, team_type: true,
  home_venue_id: true, region: true, district: true, city: true, description: true, contact_email: true, contact_phone: true, declaration_accepted: true,
  status: true, reviewed_at: true, review_reason: true, squad_deadline: true, created_at: true, updated_at: true,
  applicant: { select: { user_id: true, name: true, email: true, role: true, status: true } },
  reviewer: { select: { user_id: true, name: true, email: true } },
  home_venue: { select: { venue_id: true, name: true, city: true, status: true } },
  linked_team: { select: { team_id: true, name: true, status: true, verification_status: true, owner_id: true } },
  reviews: { orderBy: { created_at: "desc" }, select: { team_registration_review_id: true, action: true, reason: true, created_at: true, reviewer: { select: { user_id: true, name: true, email: true } } } },
};

const deadlineFromNow = () => {
  const deadline = new Date();
  deadline.setUTCDate(deadline.getUTCDate() + SQUAD_DEADLINE_DAYS);
  return deadline;
};

const createNotification = (tx, userId, title, message, requestId) => tx.notification.create({
  data: { user_id: userId, title, message, notification_type: "TEAM_REGISTRATION", reference_type: "TEAM_REGISTRATION_REQUEST", reference_id: requestId },
});

const audit = (tx, actorId, action, requestId, details = {}) => tx.auditLog.create({
  data: { actor_user_id: actorId, action, entity_type: "TEAM_REGISTRATION_REQUEST", entity_id: requestId, details },
});

const getRequestWithReadiness = async (request) => ({
  ...request,
  squad_readiness: request.linked_team_id ? await getTeamSquadReadiness(request.linked_team_id) : null,
});

const knownError = (res, error) => {
  const responses = {
    REQUEST_NOT_FOUND: [404, "Team registration application not found"],
    NOT_REVIEWABLE: [409, "Only pending applications can receive an initial review"],
    APPLICANT_INELIGIBLE: [409, "The applicant no longer has an active eligible account"],
    APPLICANT_HAS_TEAM: [409, "The applicant already owns a team"],
    TEAM_NAME_EXISTS: [409, "A team with this name already exists"],
    REQUEST_NOT_PROVISIONAL: [409, "This application is not awaiting final verification"],
    DEADLINE_EXPIRED: [409, "The squad-readiness deadline has passed"],
    SQUAD_NOT_READY: [409, "The team must have at least 11 eligible active players before verification"],
    OWNER_INACTIVE: [409, "The team owner is no longer active"],
    EMAIL_NOT_VERIFIED: [409, "The applicant must verify the account email before provisional approval"],
    CONTACTS_INCOMPLETE: [409, "The team contact details are incomplete"],
    CONFLICT: [409, "This application was updated by another administrator. Please refresh and try again."],
  };
  const response = responses[error.message];
  if (!response) return false;
  return res.status(response[0]).json({ success: false, message: response[1] });
};

export const getAdminTeamRegistrationRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const where = {};
    if (typeof req.query.status === "string" && Object.values(TEAM_REQUEST_STATUS).includes(req.query.status)) where.status = req.query.status;
    if (typeof req.query.q === "string" && req.query.q.trim()) where.OR = [
      { name: { contains: req.query.q.trim(), mode: "insensitive" } },
      { applicant: { is: { email: { contains: req.query.q.trim(), mode: "insensitive" } } } },
    ];
    const [items, total, statusCounts, provisionalRequests] = await Promise.all([
      prisma.teamRegistrationRequest.findMany({ where, select: requestSelect, orderBy: [{ created_at: "desc" }, { team_registration_request_id: "desc" }], skip: (page - 1) * limit, take: limit }),
      prisma.teamRegistrationRequest.count({ where }),
      prisma.teamRegistrationRequest.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.teamRegistrationRequest.findMany({ where: { status: TEAM_REQUEST_STATUS.PROVISIONALLY_APPROVED, linked_team_id: { not: null } }, select: { linked_team_id: true } }),
    ]);
    const summaries = Object.fromEntries(statusCounts.map((entry) => [entry.status, entry._count._all]));
    const readyCount = (await Promise.all(provisionalRequests.map((request) => getTeamSquadReadiness(request.linked_team_id)))).filter((readiness) => readiness?.squad_ready).length;
    summaries.READY_FOR_VERIFICATION = readyCount;
    return res.json({ success: true, data: { items: await Promise.all(items.map(getRequestWithReadiness)), summaries, pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) } } });
  } catch (error) { next(error); }
};

export const getAdminTeamRegistrationRequest = async (req, res, next) => {
  try {
    const request = await prisma.teamRegistrationRequest.findUnique({ where: { team_registration_request_id: Number(req.params.request_id) }, select: requestSelect });
    if (!request) return res.status(404).json({ success: false, message: "Team registration application not found" });
    return res.json({ success: true, data: await getRequestWithReadiness(request) });
  } catch (error) { next(error); }
};

export const provisionallyApproveTeamRegistration = async (req, res, next) => {
  try {
    const requestId = Number(req.params.request_id); const adminId = req.user.user_id;
    const application = await prisma.$transaction(async (tx) => {
      const request = await tx.teamRegistrationRequest.findUnique({ where: { team_registration_request_id: requestId }, select: { team_registration_request_id: true, applicant_user_id: true, name: true, logo: true, gender: true, team_type: true, home_venue_id: true, region: true, district: true, city: true, description: true, contact_email: true, contact_phone: true, status: true } });
      if (!request) throw new Error("REQUEST_NOT_FOUND");
      if (!REVIEWABLE.includes(request.status)) throw new Error("NOT_REVIEWABLE");
      const applicant = await tx.user.findUnique({ where: { user_id: request.applicant_user_id }, select: { user_id: true, role: true, status: true, email: true, email_verified: true, owned_teams: { select: { team_id: true }, take: 1 } } });
      if (!applicant || applicant.status !== USER_STATUS.ACTIVE || ![ROLES.USER, ROLES.TEAM_OWNER].includes(applicant.role)) throw new Error("APPLICANT_INELIGIBLE");
      if (!applicant.email_verified) throw new Error("EMAIL_NOT_VERIFIED");
      if (applicant.owned_teams.length) throw new Error("APPLICANT_HAS_TEAM");
      if (await tx.team.findFirst({ where: { name: { equals: request.name, mode: "insensitive" } }, select: { team_id: true } })) throw new Error("TEAM_NAME_EXISTS");
      const team = await tx.team.create({ data: { club_id: null, owner_id: applicant.user_id, home_venue_id: request.home_venue_id, name: request.name, logo: request.logo, gender: request.gender, team_type: request.team_type, region: request.region, district: request.district, city: request.city, description: request.description, contact_email: applicant.email, contact_phone: request.contact_phone, status: "ACTIVE", verification_status: TEAM_VERIFICATION.PROVISIONAL }, select: { team_id: true, name: true } });
      if (applicant.role === ROLES.USER) await tx.user.update({ where: { user_id: applicant.user_id }, data: { role: ROLES.TEAM_OWNER } });
      const squadDeadline = deadlineFromNow();
      const update = await tx.teamRegistrationRequest.updateMany({ where: { team_registration_request_id: requestId, status: TEAM_REQUEST_STATUS.PENDING, linked_team_id: null }, data: { contact_email: applicant.email, status: TEAM_REQUEST_STATUS.PROVISIONALLY_APPROVED, linked_team_id: team.team_id, reviewed_by_user_id: adminId, reviewed_at: new Date(), review_reason: null, squad_deadline: squadDeadline } });
      if (update.count !== 1) throw new Error("CONFLICT");
      if (request.contact_email !== applicant.email) {
        await tx.teamRegistrationReview.create({ data: { team_registration_request_id: requestId, reviewer_user_id: adminId, action: "CONTACT_EMAIL_RECONCILED", reason: "Replaced the submitted contact email with the verified account email after applicant ID and email verification checks." } });
      }
      await tx.teamRegistrationReview.create({ data: { team_registration_request_id: requestId, reviewer_user_id: adminId, action: "PROVISIONALLY_APPROVED" } });
      await createNotification(tx, applicant.user_id, "Team application provisionally approved", `Build an eligible squad of at least 11 active players before ${squadDeadline.toISOString().slice(0, 10)} so HPL can verify ${team.name}.`, requestId);
      await audit(tx, adminId, AUDIT_ACTIONS.TEAM_APPLICATION_PROVISIONALLY_APPROVED, requestId, { team_id: team.team_id, applicant_user_id: applicant.user_id, squad_deadline: squadDeadline.toISOString(), contact_email_source: "VERIFIED_ACCOUNT_EMAIL", submitted_contact_email: request.contact_email });
      await tx.auditLog.create({ data: { actor_user_id: adminId, action: AUDIT_ACTIONS.TEAM_CREATED, entity_type: "TEAM", entity_id: team.team_id, details: { source: "INDEPENDENT_TEAM_APPLICATION", verification_status: TEAM_VERIFICATION.PROVISIONAL } } });
      return team;
    }, { isolationLevel: "Serializable" });
    return res.json({ success: true, message: "Application provisionally approved; the team owner can now build the squad.", data: application });
  } catch (error) { if (knownError(res, error)) return; if (error.code === "P2034" || error.code === "P2002") return res.status(409).json({ success: false, message: "Application conflicted with another request. Please refresh and try again." }); next(error); }
};

const reviewPendingApplication = (status, action, auditAction, title) => async (req, res, next) => {
  try {
    const requestId = Number(req.params.request_id); const reason = req.body.reason.trim(); const adminId = req.user.user_id;
    await prisma.$transaction(async (tx) => {
      const request = await tx.teamRegistrationRequest.findUnique({ where: { team_registration_request_id: requestId }, select: { team_registration_request_id: true, applicant_user_id: true, name: true, status: true } });
      if (!request) throw new Error("REQUEST_NOT_FOUND"); if (!REVIEWABLE.includes(request.status)) throw new Error("NOT_REVIEWABLE");
      const result = await tx.teamRegistrationRequest.updateMany({ where: { team_registration_request_id: requestId, status: TEAM_REQUEST_STATUS.PENDING }, data: { status, reviewed_by_user_id: adminId, reviewed_at: new Date(), review_reason: reason } });
      if (result.count !== 1) throw new Error("CONFLICT");
      await tx.teamRegistrationReview.create({ data: { team_registration_request_id: requestId, reviewer_user_id: adminId, action, reason } });
      await createNotification(tx, request.applicant_user_id, title, reason, requestId);
      await audit(tx, adminId, auditAction, requestId, { reason });
    }, { isolationLevel: "Serializable" });
    return res.json({ success: true, message: status === TEAM_REQUEST_STATUS.REJECTED ? "Application rejected" : "Changes requested from applicant" });
  } catch (error) { if (knownError(res, error)) return; if (error.code === "P2034") return res.status(409).json({ success: false, message: "Application conflicted with another request. Please try again." }); next(error); }
};

export const requestTeamRegistrationChanges = reviewPendingApplication(TEAM_REQUEST_STATUS.CHANGES_REQUESTED, "CHANGES_REQUESTED", AUDIT_ACTIONS.TEAM_APPLICATION_CHANGES_REQUESTED, "Changes requested for your team application");
export const rejectTeamRegistration = reviewPendingApplication(TEAM_REQUEST_STATUS.REJECTED, "REJECTED", AUDIT_ACTIONS.TEAM_APPLICATION_REJECTED, "Team application rejected");

export const verifyTeamRegistration = async (req, res, next) => {
  try {
    const requestId = Number(req.params.request_id); const adminId = req.user.user_id;
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.teamRegistrationRequest.findUnique({ where: { team_registration_request_id: requestId }, select: { team_registration_request_id: true, applicant_user_id: true, linked_team_id: true, status: true, squad_deadline: true } });
      if (!request) throw new Error("REQUEST_NOT_FOUND");
      if (request.status !== TEAM_REQUEST_STATUS.PROVISIONALLY_APPROVED || !request.linked_team_id) throw new Error("REQUEST_NOT_PROVISIONAL");
      if (!request.squad_deadline || request.squad_deadline <= new Date()) throw new Error("DEADLINE_EXPIRED");
      const readiness = await getTeamSquadReadiness(request.linked_team_id, tx);
      if (!readiness?.squad_ready) throw new Error("SQUAD_NOT_READY");
      if (readiness.owner.status !== USER_STATUS.ACTIVE) throw new Error("OWNER_INACTIVE");
      if (!readiness.contact_email || !readiness.contact_phone) throw new Error("CONTACTS_INCOMPLETE");
      const updated = await tx.team.updateMany({ where: { team_id: request.linked_team_id, verification_status: TEAM_VERIFICATION.PROVISIONAL, status: "ACTIVE" }, data: { verification_status: TEAM_VERIFICATION.VERIFIED } });
      if (updated.count !== 1) throw new Error("CONFLICT");
      const requestUpdated = await tx.teamRegistrationRequest.updateMany({ where: { team_registration_request_id: requestId, status: TEAM_REQUEST_STATUS.PROVISIONALLY_APPROVED }, data: { status: TEAM_REQUEST_STATUS.VERIFIED, reviewed_by_user_id: adminId, reviewed_at: new Date(), review_reason: null } });
      if (requestUpdated.count !== 1) throw new Error("CONFLICT");
      await tx.teamRegistrationReview.create({ data: { team_registration_request_id: requestId, reviewer_user_id: adminId, action: "VERIFIED" } });
      await createNotification(tx, request.applicant_user_id, "Team verified", "Your team has passed HPL verification and is now eligible for public listing and competition registration.", requestId);
      await audit(tx, adminId, AUDIT_ACTIONS.TEAM_VERIFIED, requestId, { team_id: request.linked_team_id, eligible_players: readiness.eligible_players });
      return { team_id: request.linked_team_id, eligible_players: readiness.eligible_players };
    }, { isolationLevel: "Serializable" });
    return res.json({ success: true, message: "Team verified and eligible for public competition registration.", data: result });
  } catch (error) { if (knownError(res, error)) return; if (error.code === "P2034") return res.status(409).json({ success: false, message: "Team verification conflicted with another request. Please try again." }); next(error); }
};

export const expireOverdueTeamRegistrations = async (req, res, next) => {
  try {
    const now = new Date();
    const overdue = await prisma.teamRegistrationRequest.findMany({ where: { status: TEAM_REQUEST_STATUS.PROVISIONALLY_APPROVED, squad_deadline: { lt: now }, linked_team_id: { not: null } }, select: { team_registration_request_id: true, applicant_user_id: true, linked_team_id: true } });
    let expired = 0;
    for (const request of overdue) {
      const didExpire = await prisma.$transaction(async (tx) => {
        const result = await tx.teamRegistrationRequest.updateMany({ where: { team_registration_request_id: request.team_registration_request_id, status: TEAM_REQUEST_STATUS.PROVISIONALLY_APPROVED, squad_deadline: { lt: now } }, data: { status: TEAM_REQUEST_STATUS.EXPIRED, reviewed_by_user_id: req.user.user_id, reviewed_at: now, review_reason: "Squad-readiness deadline expired" } });
        if (!result.count) return false;
        await tx.team.updateMany({ where: { team_id: request.linked_team_id, verification_status: TEAM_VERIFICATION.PROVISIONAL }, data: { verification_status: TEAM_VERIFICATION.SUSPENDED } });
        await tx.teamRegistrationReview.create({ data: { team_registration_request_id: request.team_registration_request_id, reviewer_user_id: req.user.user_id, action: "EXPIRED", reason: "Squad-readiness deadline expired" } });
        await createNotification(tx, request.applicant_user_id, "Team application expired", "The squad-readiness deadline expired before final verification. Contact HPL administration for next steps.", request.team_registration_request_id);
        await audit(tx, req.user.user_id, AUDIT_ACTIONS.TEAM_APPLICATION_EXPIRED, request.team_registration_request_id, { team_id: request.linked_team_id });
        return true;
      }, { isolationLevel: "Serializable" });
      if (didExpire) expired += 1;
    }
    return res.json({ success: true, message: "Overdue provisional applications processed", data: { expired } });
  } catch (error) { next(error); }
};
