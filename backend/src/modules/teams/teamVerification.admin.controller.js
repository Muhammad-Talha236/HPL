// Existing-team verification and historical review access only. No new team submission/approval.
import prisma from "../../database/prisma.js";
import { USER_STATUS } from "../../constants/statuses.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { getTeamSquadReadiness, TEAM_REQUEST_STATUS, TEAM_VERIFICATION } from "./teamVerification.service.js";


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
    REQUEST_NOT_PROVISIONAL: [409, "This application is not awaiting final verification"],
    DEADLINE_EXPIRED: [409, "The squad-readiness deadline has passed"],
    SQUAD_NOT_READY: [409, "The team must have at least 11 eligible active players before verification"],
    OWNER_INACTIVE: [409, "The team owner is no longer active"],
    CONTACTS_INCOMPLETE: [409, "The team contact details are incomplete"],
    CONFLICT: [409, "This application was updated by another administrator. Please refresh and try again."],
  };
  const response = responses[error.message];
  if (!response) return false;
  return res.status(response[0]).json({ success: false, message: response[1] });
};

export const getExistingTeamVerificationRequest = async (req, res, next) => {
  try {
    const request = await prisma.teamRegistrationRequest.findUnique({ where: { team_registration_request_id: Number(req.params.request_id) }, select: requestSelect });
    if (!request) return res.status(404).json({ success: false, message: "Team registration application not found" });
    return res.json({ success: true, data: await getRequestWithReadiness(request) });
  } catch (error) { next(error); }
};

export const verifyExistingTeam = async (req, res, next) => {
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

export const expireOverdueTeamVerifications = async (req, res, next) => {
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
