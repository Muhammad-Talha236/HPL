import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

const OPEN_STATUSES = ["PENDING", "CHANGES_REQUESTED", "PROVISIONALLY_APPROVED"];
const REQUEST_STATUS = { PENDING: "PENDING", CHANGES_REQUESTED: "CHANGES_REQUESTED", PROVISIONALLY_APPROVED: "PROVISIONALLY_APPROVED", REJECTED: "REJECTED", EXPIRED: "EXPIRED", VERIFIED: "VERIFIED" };
const VERIFICATION = { PROVISIONAL: "PROVISIONAL", VERIFIED: "VERIFIED", SUSPENDED: "SUSPENDED" };
const SQUAD_REQUIREMENT = 11;
const SQUAD_DEADLINE_DAYS = 30;

const applicationFields = (body, verifiedEmail) => ({
  name: body.name.trim(), logo: body.logo?.trim() || null, gender: body.gender.trim(), team_type: body.team_type.trim(), home_venue_id: Number(body.home_venue_id),
  region: body.region?.trim() || null, district: body.district?.trim() || null, city: body.city?.trim() || null,
  description: body.description?.trim() || null, contact_email: verifiedEmail, contact_phone: body.contact_phone.trim(), declaration_accepted: body.declaration_accepted === true,
});

const publicRequestSelect = {
  team_registration_request_id: true, name: true, logo: true, gender: true, team_type: true, home_venue_id: true, region: true, district: true, city: true,
  description: true, contact_email: true, contact_phone: true, declaration_accepted: true, status: true, review_reason: true, reviewed_at: true, squad_deadline: true, linked_team_id: true, created_at: true, updated_at: true,
  home_venue: { select: { venue_id: true, name: true, city: true } }, linked_team: { select: { team_id: true, verification_status: true, status: true } },
};

export const submitIndependentTeamApplication = async (req, res, next) => {
  try {
    const applicantId = req.user?.user_id;
    if (!Number.isInteger(applicantId) || ![ROLES.USER, ROLES.TEAM_OWNER].includes(req.user.role) || req.user.status !== USER_STATUS.ACTIVE) return res.status(403).json({ success: false, message: "An active USER or TEAM_OWNER account is required" });
    const fields = applicationFields(req.body, null);
    if (!fields.declaration_accepted) return res.status(400).json({ success: false, message: "You must accept the HPL registration declaration" });

    const application = await prisma.$transaction(async (tx) => {
      const [applicant, venue, existingOpen, duplicateName] = await Promise.all([
        tx.user.findUnique({ where: { user_id: applicantId }, select: { user_id: true, role: true, status: true, email: true, email_verified: true } }),
        tx.venue.findUnique({ where: { venue_id: fields.home_venue_id }, select: { venue_id: true, status: true } }),
        tx.teamRegistrationRequest.findFirst({ where: { applicant_user_id: applicantId, status: { in: OPEN_STATUSES } }, select: { team_registration_request_id: true } }),
        tx.teamRegistrationRequest.findFirst({ where: { name: fields.name, status: { in: OPEN_STATUSES } }, select: { team_registration_request_id: true } }),
      ]);
      if (!applicant || applicant.status !== USER_STATUS.ACTIVE || ![ROLES.USER, ROLES.TEAM_OWNER].includes(applicant.role)) throw new Error("INELIGIBLE_APPLICANT");
      if (!applicant.email_verified) throw new Error("EMAIL_NOT_VERIFIED");
      fields.contact_email = applicant.email.trim().toLowerCase();
      if (!venue) throw new Error("VENUE_NOT_FOUND");
      if (venue.status !== "ACTIVE") throw new Error("VENUE_INACTIVE");
      if (existingOpen) throw new Error("OPEN_APPLICATION_EXISTS");
      if (duplicateName) throw new Error("DUPLICATE_APPLICATION_NAME");
      const created = await tx.teamRegistrationRequest.create({ data: { applicant_user_id: applicantId, ...fields, status: REQUEST_STATUS.PENDING }, select: publicRequestSelect });
      await tx.auditLog.create({ data: { actor_user_id: applicantId, action: AUDIT_ACTIONS.TEAM_APPLICATION_SUBMITTED, entity_type: "TEAM_REGISTRATION_REQUEST", entity_id: created.team_registration_request_id, details: { name: created.name, application_type: "INDEPENDENT" } } });
      return created;
    }, { isolationLevel: "Serializable" });
    return res.status(201).json({ success: true, message: "Independent team application submitted for review", data: application });
  } catch (error) {
    const known = { INELIGIBLE_APPLICANT: [403, "Your account is not eligible to submit an application"], EMAIL_NOT_VERIFIED: [403, "Verify your account email before submitting a team application"], VENUE_NOT_FOUND: [404, "Home venue not found"], VENUE_INACTIVE: [400, "Select an active home venue"], OPEN_APPLICATION_EXISTS: [409, "You already have an open independent team application"], DUPLICATE_APPLICATION_NAME: [409, "An open application already uses this team name"] };
    if (known[error.message]) { const [status, message] = known[error.message]; return res.status(status).json({ success: false, message }); }
    if (error.code === "P2034") return res.status(409).json({ success: false, message: "Application conflicted with another request. Please try again." });
    next(error);
  }
};

export const getMyIndependentTeamApplications = async (req, res, next) => {
  try {
    const data = await prisma.teamRegistrationRequest.findMany({ where: { applicant_user_id: req.user.user_id }, select: publicRequestSelect, orderBy: [{ created_at: "desc" }, { team_registration_request_id: "desc" }], take: 50 });
    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const resubmitIndependentTeamApplication = async (req, res, next) => {
  try {
    const requestId = Number(req.params.request_id);
    if (!Number.isInteger(requestId) || requestId < 1) return res.status(400).json({ success: false, message: "Invalid application ID" });
    if (!fields.declaration_accepted) return res.status(400).json({ success: false, message: "You must accept the HPL registration declaration" });
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.teamRegistrationRequest.findFirst({ where: { team_registration_request_id: requestId, applicant_user_id: req.user.user_id }, select: { team_registration_request_id: true, status: true } });
      if (!request) throw new Error("REQUEST_NOT_FOUND");
      if (request.status !== REQUEST_STATUS.CHANGES_REQUESTED) throw new Error("REQUEST_NOT_EDITABLE");
      const applicant = await tx.user.findUnique({ where: { user_id: req.user.user_id }, select: { email: true, email_verified: true } });
      if (!applicant?.email_verified) throw new Error("EMAIL_NOT_VERIFIED");
      const fields = applicationFields(req.body, applicant.email.trim().toLowerCase());
      const venue = await tx.venue.findUnique({ where: { venue_id: fields.home_venue_id }, select: { status: true } });
      if (!venue || venue.status !== "ACTIVE") throw new Error("VENUE_INACTIVE");
      const updated = await tx.teamRegistrationRequest.updateMany({ where: { team_registration_request_id: requestId, applicant_user_id: req.user.user_id, status: REQUEST_STATUS.CHANGES_REQUESTED }, data: { ...fields, status: REQUEST_STATUS.PENDING, review_reason: null, reviewed_at: null, reviewed_by_user_id: null } });
      if (updated.count !== 1) throw new Error("REQUEST_CONFLICT");
      await tx.teamRegistrationReview.create({ data: { team_registration_request_id: requestId, reviewer_user_id: req.user.user_id, action: "RESUBMITTED" } });
      return tx.teamRegistrationRequest.findUnique({ where: { team_registration_request_id: requestId }, select: publicRequestSelect });
    }, { isolationLevel: "Serializable" });
    return res.json({ success: true, message: "Application resubmitted for review", data: result });
  } catch (error) {
    const known = { REQUEST_NOT_FOUND: [404, "Application not found"], REQUEST_NOT_EDITABLE: [409, "Only applications with requested changes can be resubmitted"], VENUE_INACTIVE: [400, "Select an active home venue"], REQUEST_CONFLICT: [409, "Application changed during submission. Please try again."], EMAIL_NOT_VERIFIED: [403, "Verify your account email before submitting or resubmitting a team application"] };
    if (known[error.message]) { const [status, message] = known[error.message]; return res.status(status).json({ success: false, message }); }
    next(error);
  }
};

export const getTeamSquadReadiness = async (teamId, db = prisma) => {
  const team = await db.team.findUnique({ where: { team_id: teamId }, select: { team_id: true, gender: true, verification_status: true, status: true, owner: { select: { user_id: true, status: true } }, contact_email: true, contact_phone: true } });
  if (!team) return null;
  const eligible_players = await db.teamPlayer.count({ where: { team_id: teamId, status: "ACTIVE", left_at: null, player: { status: "ACTIVE", gender: team.gender === "MEN" ? "MALE" : "FEMALE" } } });
  return { ...team, required_players: SQUAD_REQUIREMENT, eligible_players, remaining_players: Math.max(0, SQUAD_REQUIREMENT - eligible_players), squad_ready: eligible_players >= SQUAD_REQUIREMENT };
};

export const TEAM_VERIFICATION = VERIFICATION;
export const TEAM_REQUEST_STATUS = REQUEST_STATUS;
