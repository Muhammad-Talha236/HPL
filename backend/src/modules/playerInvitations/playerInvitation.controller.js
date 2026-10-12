import { getEmailLookupKey } from "../../utils/email.util.js";
import prisma from "../../database/prisma.js";
import bcrypt from "bcryptjs";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";
import { SECURITY } from "../../config/security.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { createAuditLog } from "../../utils/auditLog.util.js";
import { createPlayerInvitationToken, getPlayerInvitationExpiry, hashPlayerInvitationToken } from "../../utils/playerInvitationToken.util.js";
import { maskPlayerInvitationEmail, normalizePlayerInvitationEmail } from "../../utils/playerInvitationEmail.util.js";
import { validatePassword } from "../../utils/password.util.js";
import { sendPlayerInvitationEmail } from "../../services/playerInvitationMail.service.js";

const INVITATION_STATUS = { PENDING: "PENDING", EXPIRED: "EXPIRED", REVOKED: "REVOKED" };
const ACCEPTED_STATUS = "ACCEPTED";
const tokenIsWellFormed = (token) => typeof token === "string" && /^[A-Za-z0-9_-]{43,128}$/.test(token);
const unavailablePreview = (res, state = "UNAVAILABLE") => res.json({ success: true, data: { valid: false, state } });

const previewSelect = {
  invitation_id: true,
  status: true,
  expires_at: true,
  invited_email: true,
  player: { select: { name: true, profile_photo: true } },
  team: { select: { name: true, logo: true, club: { select: { name: true } } } },
};

const acceptanceSelect = {
  invitation_id: true,
  player_id: true,
  team_id: true,
  invited_email: true,
  status: true,
  expires_at: true,
  player: { select: { player_id: true, name: true, profile_photo: true, status: true, user_id: true } },
  team: { select: { team_id: true, name: true, status: true, verification_status: true, club_id: true, club: { select: { name: true, status: true } } } },
};

const invitationSelect = {
  invitation_id: true,
  player_id: true,
  team_id: true,
  status: true,
  expires_at: true,
  accepted_at: true,
  created_at: true,
  updated_at: true,
  player: { select: { player_id: true, name: true, registration_number: true, status: true } },
  team: { select: { team_id: true, name: true, club: { select: { club_id: true, name: true } } } },
};

// Email is visible only through the already ownership-scoped list endpoint. Tokens
// and token hashes remain absent from every projection.
const invitationListSelect = { ...invitationSelect, invited_email: true };

const resendSelect = {
  invitation_id: true,
  player_id: true,
  team_id: true,
  token_hash: true,
  invited_email: true,
  status: true,
  expires_at: true,
  updated_at: true,
  player: { select: { player_id: true, name: true, status: true, user_id: true } },
  team: { select: { team_id: true, name: true, status: true, verification_status: true, club_id: true, club: { select: { name: true, status: true } } } },
};

const isActiveAuthenticatedUser = (user) =>
  Boolean(user) &&
  (user.status === undefined || user.status === USER_STATUS.ACTIVE);

const teamScopeFor = (user) => {
  if (!isActiveAuthenticatedUser(user)) return { team_id: -1 };
  if (user.role === ROLES.SUPER_ADMIN) return {};
  if (user.role === ROLES.TEAM_OWNER) return { owner_id: user.user_id };
  if (user.role === ROLES.CLUB_OWNER) return { club: { owner_id: user.user_id } };
  return { team_id: -1 };
};

const canInviteForTeam = (user, team) => {
  if (!isActiveAuthenticatedUser(user) || !team) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.TEAM_OWNER) return team.owner_id === user.user_id;
  return user.role === ROLES.CLUB_OWNER && team.club_id !== null && team.club?.owner_id === user.user_id;
};

const hasActiveClubWhenRequired = (team) =>
  team.club_id === null ||
  Boolean(team.club && team.club.status === "ACTIVE");

const isEligibleInvitationTeam = (team) =>
  Boolean(team) &&
  team.status === "ACTIVE" &&
  team.verification_status !== "SUSPENDED" &&
  hasActiveClubWhenRequired(team);

const expirePendingInvitations = (tx, playerId, now) => tx.playerInvitation.updateMany({
  where: { player_id: playerId, status: INVITATION_STATUS.PENDING, expires_at: { lte: now } },
  data: { status: INVITATION_STATUS.EXPIRED },
});

const checkResendEligibility = async (tx, invitationId, user, now) => {
  const invitation = await tx.playerInvitation.findFirst({
    where: { invitation_id: invitationId, team: teamScopeFor(user) },
    select: resendSelect,
  });
  if (!invitation) return { error: "NOT_FOUND" };
  if (invitation.status !== INVITATION_STATUS.PENDING) return { error: "NOT_PENDING" };
  if (invitation.expires_at <= now) {
    await tx.playerInvitation.updateMany({
      where: { invitation_id: invitationId, status: INVITATION_STATUS.PENDING, expires_at: { lte: now } },
      data: { status: INVITATION_STATUS.EXPIRED },
    });
    return { error: "EXPIRED" };
  }
  if (!isEligibleInvitationTeam(invitation.team)) return { error: "TEAM_INACTIVE" };
  if (!invitation.player || invitation.player.status !== "ACTIVE") return { error: "PLAYER_INACTIVE" };
  if (invitation.player.user_id !== null) return { error: "PLAYER_LINKED" };
  const membership = await tx.teamPlayer.findFirst({
    where: { team_id: invitation.team_id, player_id: invitation.player_id, status: "ACTIVE" },
    select: { team_player_id: true },
  });
  if (!membership) return { error: "MEMBERSHIP" };
  return { invitation };
};

const resendFailure = (res, error) => {
  const responses = {
    NOT_FOUND: [404, "Invitation not found"],
    NOT_PENDING: [409, "Only pending invitations can be resent"],
    EXPIRED: [409, "Expired invitations cannot be resent"],
    TEAM_INACTIVE: [409, "Cannot resend from an inactive team or club"],
    PLAYER_INACTIVE: [409, "Cannot resend to an inactive player"],
    PLAYER_LINKED: [409, "Player already has a linked account"],
    MEMBERSHIP: [409, "Player membership is no longer active"],
    CONFLICT: [409, "Invitation was modified by another request. Please try again."],
  };
  const [status, message] = responses[error] || [409, "Invitation could not be resent"];
  return res.status(status).json({ success: false, message });
};

export const createPlayerInvitation = async (req, res, next) => {
  const { player_id, team_id, invited_email } = req.body;
  const now = new Date();
  const { rawToken, tokenHash } = createPlayerInvitationToken();
  const expiresAt = getPlayerInvitationExpiry(now);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({
        where: { team_id },
        select: { team_id: true, name: true, owner_id: true, status: true, verification_status: true, club_id: true, club: { select: { club_id: true, name: true, owner_id: true, status: true } } },
      });
      if (!team || !canInviteForTeam(req.user, team)) return { error: "NOT_FOUND" };
      if (!isEligibleInvitationTeam(team)) return { error: "TEAM_INACTIVE" };

      const membership = await tx.teamPlayer.findFirst({
        where: { team_id, player_id, status: "ACTIVE" },
        select: { player: { select: { player_id: true, name: true, status: true, user_id: true } } },
      });
      if (!membership?.player) return { error: "NOT_FOUND" };
      if (membership.player.status !== "ACTIVE") return { error: "PLAYER_INACTIVE" };
      if (membership.player.user_id !== null) return { error: "PLAYER_LINKED" };

      await expirePendingInvitations(tx, player_id, now);
      const existing = await tx.playerInvitation.findFirst({
        where: { player_id, status: INVITATION_STATUS.PENDING, expires_at: { gt: now } },
        select: { invitation_id: true },
      });
      if (existing) return { error: "PENDING_EXISTS" };

      const invitation = await tx.playerInvitation.create({
        data: { player_id, team_id, invited_by_user_id: req.user.user_id, invited_email, token_hash: tokenHash, expires_at: expiresAt, status: INVITATION_STATUS.PENDING },
        select: invitationSelect,
      });
      return {
        invitation,
        mail: {
          invitation_id: invitation.invitation_id,
          invited_email,
          player_name: membership.player.name,
          team_name: team.name,
          club_name: team.club?.name || "Independent Team",
          expires_at: expiresAt,
          rawToken,
        },
      };
    }, { isolationLevel: "Serializable" });

    if (result.error) {
      const responses = {
        NOT_FOUND: [404, "Player membership was not found"],
        TEAM_INACTIVE: [409, "Cannot invite from an inactive team or club"],
        PLAYER_INACTIVE: [409, "Cannot invite an inactive player"],
        PLAYER_LINKED: [409, "Player already has a linked account"],
        PENDING_EXISTS: [409, "A pending invitation already exists for this player"],
      };
      const [status, message] = responses[result.error] || [400, "Invitation could not be created"];
      return res.status(status).json({ success: false, message });
    }

    try {
      await sendPlayerInvitationEmail(result.mail);
    } catch {
      try {
        await prisma.playerInvitation.updateMany({
          where: { invitation_id: result.invitation.invitation_id, status: INVITATION_STATUS.PENDING, token_hash: tokenHash },
          data: { status: INVITATION_STATUS.REVOKED },
        });
      } catch {
        // The response remains deliberately generic; no invitation secret is logged.
        console.error("Player invitation delivery compensation failed", { invitation_id: result.invitation.invitation_id });
      }
      return res.status(503).json({ success: false, message: "Unable to send the invitation email. Please try again." });
    }

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.PLAYER_INVITATION_CREATED,
      entity_type: "PLAYER_INVITATION",
      entity_id: result.invitation.invitation_id,
      details: { player_id, team_id, status: INVITATION_STATUS.PENDING },
    });

    return res.status(201).json({ success: true, message: "Invitation email sent successfully.", data: result.invitation });
  } catch (error) {
    if (error.code === "P2002" || error.code === "P2034") return res.status(409).json({ success: false, message: "A pending invitation already exists or was modified. Please try again." });
    next(error);
  }
};

export const resendPlayerInvitation = async (req, res, next) => {
  const invitationId = req.params.invitation_id;
  const now = new Date();
  try {
    const prepared = await prisma.$transaction(async (tx) => checkResendEligibility(tx, invitationId, req.user, now), { isolationLevel: "Serializable" });
    if (prepared.error) return resendFailure(res, prepared.error);

    const { rawToken, tokenHash } = createPlayerInvitationToken();
    const expiresAt = getPlayerInvitationExpiry(now);
    const mail = {
      invitation_id: prepared.invitation.invitation_id,
      invited_email: prepared.invitation.invited_email,
      player_name: prepared.invitation.player.name,
      team_name: prepared.invitation.team.name,
      club_name: prepared.invitation.team.club?.name || "Independent Team",
      expires_at: expiresAt,
      rawToken,
    };

    // Deliver before rotating the persisted hash. If SMTP fails, the current token
    // remains usable. A concurrent update makes the new email unusable rather than
    // creating an unexpected live token; the caller receives a retry-safe conflict.
    try {
      await sendPlayerInvitationEmail(mail);
    } catch {
      return res.status(503).json({ success: false, message: "Unable to send the invitation email. Please try again." });
    }

    const rotated = await prisma.$transaction(async (tx) => {
      const current = await checkResendEligibility(tx, invitationId, req.user, new Date());
      if (current.error) return current;
      if (current.invitation.token_hash !== prepared.invitation.token_hash || current.invitation.updated_at.getTime() !== prepared.invitation.updated_at.getTime()) return { error: "CONFLICT" };
      const updated = await tx.playerInvitation.updateMany({
        where: {
          invitation_id: invitationId,
          status: INVITATION_STATUS.PENDING,
          token_hash: prepared.invitation.token_hash,
          updated_at: prepared.invitation.updated_at,
          expires_at: { gt: new Date() },
        },
        data: { token_hash: tokenHash, expires_at: expiresAt },
      });
      if (updated.count !== 1) return { error: "CONFLICT" };
      return { invitation: current.invitation };
    }, { isolationLevel: "Serializable" });
    if (rotated.error) return resendFailure(res, rotated.error);

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.PLAYER_INVITATION_RESENT,
      entity_type: "PLAYER_INVITATION",
      entity_id: rotated.invitation.invitation_id,
      details: { player_id: rotated.invitation.player_id, team_id: rotated.invitation.team_id, status: INVITATION_STATUS.PENDING },
    });
    return res.json({ success: true, message: "Invitation email resent" });
  } catch (error) {
    if (error.code === "P2034" || error.code === "P2002") return resendFailure(res, "CONFLICT");
    next(error);
  }
};

export const getPlayerInvitations = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const where = {
      team: teamScopeFor(req.user),
      ...(req.query.team_id ? { team_id: req.query.team_id } : {}),
      ...(req.query.player_id ? { player_id: req.query.player_id } : {}),
      ...(req.query.status ? { status: req.query.status } : {}),
    };
    const [invitations, total] = await Promise.all([
      prisma.playerInvitation.findMany({ where, select: invitationListSelect, orderBy: [{ created_at: "desc" }, { invitation_id: "desc" }], skip: (page - 1) * limit, take: limit }),
      prisma.playerInvitation.count({ where }),
    ]);
    return res.json({ success: true, data: invitations, pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) { next(error); }
};

export const revokePlayerInvitation = async (req, res, next) => {
  const invitationId = req.params.invitation_id;
  const now = new Date();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.playerInvitation.findFirst({ where: { invitation_id: invitationId, team: teamScopeFor(req.user) }, select: { invitation_id: true, player_id: true, team_id: true, status: true, expires_at: true } });
      if (!invitation) return { error: "NOT_FOUND" };
      if (invitation.status !== INVITATION_STATUS.PENDING) return { error: "NOT_PENDING" };
      if (invitation.expires_at <= now) {
        await tx.playerInvitation.updateMany({ where: { invitation_id: invitationId, status: INVITATION_STATUS.PENDING, expires_at: { lte: now } }, data: { status: INVITATION_STATUS.EXPIRED } });
        return { error: "EXPIRED" };
      }
      const updated = await tx.playerInvitation.updateMany({ where: { invitation_id: invitationId, status: INVITATION_STATUS.PENDING }, data: { status: INVITATION_STATUS.REVOKED } });
      if (!updated.count) return { error: "CONFLICT" };
      return { invitation };
    }, { isolationLevel: "Serializable" });
    if (result.error) {
      if (result.error === "NOT_FOUND") return res.status(404).json({ success: false, message: "Invitation not found" });
      if (result.error === "NOT_PENDING") return res.status(409).json({ success: false, message: "Only pending invitations can be revoked" });
      if (result.error === "EXPIRED") return res.status(409).json({ success: false, message: "Expired invitations cannot be revoked" });
      return res.status(409).json({ success: false, message: "Invitation was modified by another request. Please try again." });
    }
    await createAuditLog({ actor_user_id: req.user.user_id, action: AUDIT_ACTIONS.PLAYER_INVITATION_REVOKED, entity_type: "PLAYER_INVITATION", entity_id: result.invitation.invitation_id, details: { player_id: result.invitation.player_id, team_id: result.invitation.team_id, status: INVITATION_STATUS.REVOKED } });
    return res.json({ success: true, message: "Player invitation revoked" });
  } catch (error) {
    if (error.code === "P2034") return res.status(409).json({ success: false, message: "Invitation was modified by another request. Please try again." });
    next(error);
  }
};

export const previewPlayerInvitationAcceptance = async (req, res, next) => {
  const rawToken = req.params.token;
  if (!tokenIsWellFormed(rawToken)) return unavailablePreview(res);
  const tokenHash = hashPlayerInvitationToken(rawToken);
  const now = new Date();
  try {
    const invitation = await prisma.playerInvitation.findUnique({ where: { token_hash: tokenHash }, select: previewSelect });
    if (!invitation) return unavailablePreview(res);
    if (invitation.status !== INVITATION_STATUS.PENDING) return unavailablePreview(res, invitation.status === ACCEPTED_STATUS ? ACCEPTED_STATUS : invitation.status);
    if (invitation.expires_at <= now) {
      await prisma.playerInvitation.updateMany({ where: { invitation_id: invitation.invitation_id, status: INVITATION_STATUS.PENDING, expires_at: { lte: now } }, data: { status: INVITATION_STATUS.EXPIRED } });
      return unavailablePreview(res, INVITATION_STATUS.EXPIRED);
    }
    return res.json({ success: true, data: { valid: true, state: INVITATION_STATUS.PENDING, expires_at: invitation.expires_at, invited_email: maskPlayerInvitationEmail(invitation.invited_email), player: { name: invitation.player.name, profile_photo: invitation.player.profile_photo }, team: invitation.team ? { name: invitation.team.name, logo: invitation.team.logo } : null, club: invitation.team?.club ? { name: invitation.team.club.name } : null } });
  } catch (error) { next(error); }
};

export const acceptPlayerInvitation = async (req, res, next) => {
  const rawToken = req.params.token;
  if (!tokenIsWellFormed(rawToken)) return res.status(409).json({ success: false, message: "Invitation is unavailable" });
  if (req.user?.role !== ROLES.USER) return res.status(403).json({ success: false, message: "This invitation must be accepted with an invited normal user account" });
  const tokenHash = hashPlayerInvitationToken(rawToken);
  const now = new Date();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.playerInvitation.findUnique({ where: { token_hash: tokenHash }, select: acceptanceSelect });
      if (!invitation) return { error: "UNAVAILABLE" };
      if (invitation.status !== INVITATION_STATUS.PENDING) return { error: invitation.status === ACCEPTED_STATUS ? "ACCEPTED" : "UNAVAILABLE" };
      if (invitation.expires_at <= now) {
        await tx.playerInvitation.updateMany({ where: { invitation_id: invitation.invitation_id, status: INVITATION_STATUS.PENDING, expires_at: { lte: now } }, data: { status: INVITATION_STATUS.EXPIRED } });
        return { error: "EXPIRED" };
      }
      if (!isEligibleInvitationTeam(invitation.team) || invitation.player.status !== "ACTIVE" || invitation.player.user_id !== null) return { error: "UNAVAILABLE" };
      const user = await tx.user.findUnique({ where: { user_id: req.user.user_id }, select: { user_id: true, email: true, role: true, status: true, player: { select: { player_id: true } } } });
      if (!user || user.role !== ROLES.USER || user.status !== "ACTIVE") return { error: "ROLE" };
      if (user.player) return { error: "USER_LINKED" };
      if (getEmailLookupKey(user.email) !== getEmailLookupKey(invitation.invited_email)) return { error: "EMAIL" };
      const membership = await tx.teamPlayer.findFirst({ where: { team_id: invitation.team_id, player_id: invitation.player_id, status: "ACTIVE" }, select: { team_player_id: true } });
      if (!membership) return { error: "MEMBERSHIP" };
      const linked = await tx.player.updateMany({ where: { player_id: invitation.player_id, user_id: null }, data: { user_id: user.user_id } });
      if (linked.count !== 1) throw Object.assign(new Error("Player linkage conflict"), { code: "PLAYER_LINK_CONFLICT" });
      const accepted = await tx.playerInvitation.updateMany({ where: { invitation_id: invitation.invitation_id, status: INVITATION_STATUS.PENDING, expires_at: { gt: now } }, data: { status: ACCEPTED_STATUS, accepted_at: now } });
      if (accepted.count !== 1) throw Object.assign(new Error("Invitation acceptance conflict"), { code: "INVITATION_ACCEPTANCE_CONFLICT" });
      await tx.auditLog.create({ data: { actor_user_id: user.user_id, action: AUDIT_ACTIONS.PLAYER_INVITATION_ACCEPTED, entity_type: "PLAYER_INVITATION", entity_id: invitation.invitation_id, details: { invitation_id: invitation.invitation_id, player_id: invitation.player_id, team_id: invitation.team_id } } });
      return { player: { player_id: invitation.player.player_id, name: invitation.player.name, profile_photo: invitation.player.profile_photo }, team: { team_id: invitation.team.team_id, name: invitation.team.name }, club: invitation.team.club ? { name: invitation.team.club.name } : null };
    }, { isolationLevel: "Serializable" });
    if (result.error) {
      const messages = { EXPIRED: "This invitation has expired", ACCEPTED: "This invitation has already been used", EMAIL: "This invitation is not available for the currently signed-in account", USER_LINKED: "Your account is already linked to a player profile", ROLE: "This invitation must be accepted with an invited normal user account" };
      return res.status(result.error === "ROLE" ? 403 : 409).json({ success: false, message: messages[result.error] || "Invitation is unavailable" });
    }
    return res.json({ success: true, message: "Player profile linked successfully", data: { linked: true, player: result.player, team: result.team, club: result.club } });
  } catch (error) {
    if (["P2002", "P2034", "PLAYER_LINK_CONFLICT", "INVITATION_ACCEPTANCE_CONFLICT"].includes(error.code)) return res.status(409).json({ success: false, message: "Invitation is unavailable or was already used" });
    next(error);
  }
};

export const registerPlayerInvitationAccount = async (req, res, next) => {
  const rawToken = req.params.token;
  const { name, password, confirm_password } = req.body;
  if (!tokenIsWellFormed(rawToken)) return res.status(409).json({ success: false, message: "Invitation is unavailable" });
  if (password !== confirm_password) return res.status(400).json({ success: false, message: "Password and confirmation must match" });
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) return res.status(400).json({ success: false, message: passwordValidation.message });
  const tokenHash = hashPlayerInvitationToken(rawToken);
  const now = new Date();
  try {
    const password_hash = await bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);
    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.playerInvitation.findUnique({ where: { token_hash: tokenHash }, select: acceptanceSelect });
      if (!invitation) return { error: "UNAVAILABLE" };
      if (invitation.status !== INVITATION_STATUS.PENDING) return { error: invitation.status === ACCEPTED_STATUS ? "ACCEPTED" : "UNAVAILABLE" };
      if (invitation.expires_at <= now) {
        await tx.playerInvitation.updateMany({ where: { invitation_id: invitation.invitation_id, status: INVITATION_STATUS.PENDING, expires_at: { lte: now } }, data: { status: INVITATION_STATUS.EXPIRED } });
        return { error: "EXPIRED" };
      }
      if (!isEligibleInvitationTeam(invitation.team) || invitation.player.status !== "ACTIVE" || invitation.player.user_id !== null) return { error: "UNAVAILABLE" };
      const invitedEmail = normalizePlayerInvitationEmail(invitation.invited_email);
      const existingUser = await tx.user.findUnique({ where: { email_key: getEmailLookupKey(invitedEmail) }, select: { user_id: true } });
      if (existingUser) return { error: "EXISTING_ACCOUNT" };
      const membership = await tx.teamPlayer.findFirst({ where: { team_id: invitation.team_id, player_id: invitation.player_id, status: "ACTIVE" }, select: { team_player_id: true } });
      if (!membership) return { error: "MEMBERSHIP" };
      const account = await tx.user.create({ data: { name, email: invitedEmail, password_hash, role: ROLES.USER, status: USER_STATUS.ACTIVE }, select: { user_id: true, name: true } });
      const linked = await tx.player.updateMany({ where: { player_id: invitation.player_id, user_id: null }, data: { user_id: account.user_id } });
      if (linked.count !== 1) throw Object.assign(new Error("Player linkage conflict"), { code: "PLAYER_LINK_CONFLICT" });
      const accepted = await tx.playerInvitation.updateMany({ where: { invitation_id: invitation.invitation_id, status: INVITATION_STATUS.PENDING, expires_at: { gt: now } }, data: { status: ACCEPTED_STATUS, accepted_at: now } });
      if (accepted.count !== 1) throw Object.assign(new Error("Invitation acceptance conflict"), { code: "INVITATION_ACCEPTANCE_CONFLICT" });
      await tx.auditLog.create({ data: { actor_user_id: account.user_id, action: AUDIT_ACTIONS.PLAYER_INVITATION_ACCEPTED, entity_type: "PLAYER_INVITATION", entity_id: invitation.invitation_id, details: { invitation_id: invitation.invitation_id, player_id: invitation.player_id, team_id: invitation.team_id, account_created: true } } });
      return { player: { player_id: invitation.player.player_id, name: invitation.player.name, profile_photo: invitation.player.profile_photo }, team: { team_id: invitation.team.team_id, name: invitation.team.name }, account_created: true };
    }, { isolationLevel: "Serializable" });
    if (result.error) {
      const messages = { EXPIRED: "This invitation has expired", ACCEPTED: "This invitation has already been used", EXISTING_ACCOUNT: "An HPL account already exists for this invitation. Sign in to continue.", MEMBERSHIP: "Invitation is unavailable" };
      return res.status(409).json({ success: false, code: result.error, message: messages[result.error] || "Invitation is unavailable" });
    }
    return res.status(201).json({ success: true, message: "Your HPL account has been created and linked to the Player profile.", data: result });
  } catch (error) {
    if (["P2002", "P2034", "PLAYER_LINK_CONFLICT", "INVITATION_ACCEPTANCE_CONFLICT"].includes(error.code)) return res.status(409).json({ success: false, code: "CONFLICT", message: "Invitation is unavailable or an account already exists. Sign in to continue." });
    next(error);
  }
};
