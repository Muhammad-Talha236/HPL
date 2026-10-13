import { lockInvitationTeam, lockInvitationAccount } from "../../services/playerInvitationLocks.service.js";
import { isPlayerGenderCompatible } from "../../utils/playerEligibility.util.js";
import { invitationTransaction, logInvitationError } from "../../utils/playerInvitationTransaction.util.js";
import { activatePlayerInvitationMembership, eligibleInvitationTeam } from "../../services/playerInvitationMembership.service.js";
export { eligibleInvitationTeam } from "../../services/playerInvitationMembership.service.js";
import bcrypt from "bcryptjs";
import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { SECURITY } from "../../config/security.js";
import { getEmailLookupKey, normalizeStoredEmail, isValidAccountEmail } from "../../utils/email.util.js";
import { validatePassword } from "../../utils/password.util.js";
import { createPlayerInvitationToken, getPlayerInvitationExpiry, hashPlayerInvitationToken } from "../../utils/playerInvitationToken.util.js";
import { maskPlayerInvitationEmail } from "../../utils/playerInvitationEmail.util.js";
import { sendPlayerInvitationEmail } from "../../services/playerInvitationMail.service.js";

export const INVITATION_MESSAGE = "If this address is eligible, an invitation will be sent. Players join the roster after accepting the invitation with the invited account.";
const validToken = token => typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
const teamInclude = { club: true, registration_request: true };
const invitationInclude = { team: { include: teamInclude }, player: true };
const scope = user => user.role === ROLES.SUPER_ADMIN ? {} : user.role === ROLES.TEAM_OWNER ? { owner_id: user.user_id } : { club: { owner_id: user.user_id } };
const canManage = (user, team) => user?.status === "ACTIVE" && !!team && (user.role === ROLES.SUPER_ADMIN || (user.role === ROLES.TEAM_OWNER && team.owner_id === user.user_id) || (user.role === ROLES.CLUB_OWNER && team.club?.owner_id === user.user_id));
const safeTeam = team => team && ({ team_id: team.team_id, name: team.name, gender: team.gender });
const listSelect = { invitation_id: true, player_id: true, team_id: true, invited_email: true, status: true, expires_at: true, created_at: true, accepted_at: true, last_sent_at: true, delivered_at: true, team: { select: { team_id: true, name: true } } };
const compatible = (team, player) => isPlayerGenderCompatible(team.gender, player.gender);
const fail = (res, code = 409, message = "Invitation is unavailable or was already used.") => res.status(code).json({ success: false, message });
const failure = (res, error) => { logInvitationError("Player invitation operation failed", error); return fail(res, ["P2002", "P2034", "PLAYER_LINK_CONFLICT"].includes(error.code) ? 409 : 503, "This operation could not be completed. Please refresh and try again."); };

export const createPlayerInvitationControllers = (db = prisma, sendEmail = sendPlayerInvitationEmail) => {
  const lockTeam = lockInvitationTeam;
  const tokenRecord = token => validToken(token) ? db.playerInvitation.findUnique({ where: { token_hash: hashPlayerInvitationToken(token) }, include: invitationInclude }) : null;
  const pending = i => i?.status === "PENDING" && !!i.delivered_at && i.expires_at > new Date() && eligibleInvitationTeam(i.team);
  const account = lockInvitationAccount;
  const matches = (u, i) => u?.status === "ACTIVE" && getEmailLookupKey(u.email) === getEmailLookupKey(i.invited_email);
  const audit = (tx, userId, invitationId, action) => tx.auditLog.create({ data: { actor_user_id: userId, action, entity_type: "PLAYER_INVITATION", entity_id: invitationId } });
  const deliver = async (i, team, rawToken, destination) => {
    try {
      await sendEmail({ invitation_id: i.invitation_id, invited_email: destination || i.invited_email, player_name: "there", team_name: team.name, club_name: team.club?.name || "Independent Team", expires_at: i.expires_at, rawToken });
      await db.playerInvitation.updateMany({ where: { invitation_id: i.invitation_id, token_hash: i.token_hash, status: "PENDING" }, data: { delivered_at: new Date() } });
      return true;
    } catch {
      console.error("Player invitation delivery failed", { invitation_id: i.invitation_id });
      try { await db.playerInvitation.updateMany({ where: { invitation_id: i.invitation_id, token_hash: i.token_hash, status: "PENDING" }, data: { status: "REVOKED", delivered_at: null } }); }
      catch { console.error("Player invitation cleanup failed; undelivered token remains unusable"); }
      return false;
    }
  };
  return {
    createPlayerInvitation: async (req, res) => {
      const teamId = Number(req.body.team_id), email = normalizeStoredEmail(req.body.invited_email), key = getEmailLookupKey(email);
      if (!isValidAccountEmail(email) || !Number.isInteger(teamId) || teamId < 1) return fail(res, 400, "A valid team and email are required.");
      if (req.body.player_id && ![ROLES.SUPER_ADMIN, ROLES.CLUB_OWNER].includes(req.user.role)) return fail(res, 403, "Invite by email from your team roster.");
      let team;
      try { team = await db.team.findUnique({ where: { team_id: teamId }, include: teamInclude }); }
      catch (error) { return failure(res, error); }
      if (!canManage(req.user, team)) return fail(res, 404, "Team not found.");
      if (!eligibleInvitationTeam(team)) return fail(res, 409, "This team cannot send invitations at this time.");
      // Account-dependent work happens after the identical response is finalized.
      res.status(202).json({ success: true, message: INVITATION_MESSAGE });
      try {
        const prepared = await invitationTransaction(db, async tx => {
          const currentTeam = await lockTeam(tx, teamId);
          if (!canManage(req.user, currentTeam) || !eligibleInvitationTeam(currentTeam)) return null;
          // PostgreSQL returns void from this lock function; expose only a Boolean to Prisma's adapter.
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0)) IS NULL AS locked`;
          await tx.playerInvitation.updateMany({ where: { team_id: teamId, invited_email_key: key, status: { in: ["PENDING", "ACCEPTED_PENDING_PROFILE"] }, expires_at: { lte: new Date() } }, data: { status: "EXPIRED" } });
          const duplicate = await tx.playerInvitation.findFirst({ where: { invited_email_key: key, OR: [{ team_id: teamId, status: { in: ["PENDING", "ACCEPTED_PENDING_PROFILE"] } }, { last_sent_at: { gt: new Date(Date.now() - 15 * 60 * 1000) } }] } });
          if (duplicate) return null;
          const active = await tx.teamPlayer.findFirst({ where: { team_id: teamId, status: "ACTIVE", player: { user: { email_key: key } } }, select: { team_player_id: true } });
          if (active) return null;
          const recipient = await tx.user.findUnique({ where: { email_key: key }, select: { email: true } });
          let playerId = null;
          if (req.body.player_id) {
            const legacy = await tx.teamPlayer.findFirst({ where: { team_id: teamId, player_id: Number(req.body.player_id), status: "ACTIVE", player: { status: "ACTIVE", user_id: null } }, select: { player_id: true } });
            if (!legacy) return null;
            playerId = legacy.player_id;
          }
          const { rawToken, tokenHash } = createPlayerInvitationToken();
          const i = await tx.playerInvitation.create({ data: { team_id: teamId, player_id: playerId, invited_email: email, token_hash: tokenHash, expires_at: getPlayerInvitationExpiry(), status: "PENDING", invited_by_user_id: req.user.user_id, last_sent_at: new Date() } });
          await audit(tx, req.user.user_id, i.invitation_id, "PLAYER_INVITATION_CREATED");
          return { i, team: currentTeam, rawToken, destination: recipient?.email };
        });
        if (prepared) await deliver(prepared.i, prepared.team, prepared.rawToken, prepared.destination);
      } catch (error) { logInvitationError("Player invitation request failed", error); }
    },
    getPlayerInvitations: async (req, res) => {
      try {
        const page = Number(req.query.page || 1), limit = Number(req.query.limit || 20);
        const where = { team: scope(req.user), ...(req.query.team_id ? { team_id: Number(req.query.team_id) } : {}), ...(req.query.player_id ? { player_id: Number(req.query.player_id) } : {}), ...(req.query.status ? { status: req.query.status } : {}) };
        if (req.query.view === "PENDING") Object.assign(where, { status: "PENDING", expires_at: { gt: new Date() } });
        if (req.query.view === "HISTORY") Object.assign(where, { OR: [{ status: { not: "PENDING" } }, { expires_at: { lte: new Date() } }] });
        const [data, total] = await Promise.all([db.playerInvitation.findMany({ where, select: listSelect, orderBy: { created_at: "desc" }, skip: (page - 1) * limit, take: limit }), db.playerInvitation.count({ where })]);
        return res.json({ success: true, data: data.map(i => ({ ...i, status: ["PENDING", "ACCEPTED_PENDING_PROFILE"].includes(i.status) && i.expires_at <= new Date() ? "EXPIRED" : i.status })), pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) } });
      } catch (error) { return failure(res, error); }
    },
    resendPlayerInvitation: async (req, res) => {
      try {
        const id = Number(req.params.invitation_id), existing = await db.playerInvitation.findUnique({ where: { invitation_id: id } });
        if (!existing?.team_id) return fail(res, 404, "Invitation not found.");
        const prepared = await invitationTransaction(db, async tx => {
          const team = await lockTeam(tx, existing.team_id);
          if (!canManage(req.user, team) || !eligibleInvitationTeam(team)) return null;
          const i = await tx.playerInvitation.findUnique({ where: { invitation_id: id } });
          if (!i || i.status !== "PENDING" || i.expires_at <= new Date() || (i.last_sent_at && i.last_sent_at > new Date(Date.now() - 15 * 60 * 1000))) return null;
          const key = getEmailLookupKey(i.invited_email);
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0)) IS NULL AS locked`;
          if (await tx.playerInvitation.findFirst({ where: { invited_email_key: key, last_sent_at: { gt: new Date(Date.now() - 15 * 60 * 1000) } } })) return null;
          const { rawToken, tokenHash } = createPlayerInvitationToken();
          const rotated = await tx.playerInvitation.update({ where: { invitation_id: id }, data: { token_hash: tokenHash, expires_at: getPlayerInvitationExpiry(), delivered_at: null, last_sent_at: new Date() } });
          const recipient = await tx.user.findUnique({ where: { email_key: getEmailLookupKey(i.invited_email) }, select: { email: true } });
          await audit(tx, req.user.user_id, id, "PLAYER_INVITATION_RESENT");
          return { i: rotated, team, rawToken, destination: recipient?.email };
        });
        if (!prepared) return fail(res, 409, "Invitation is unavailable or was sent recently. Wait 15 minutes before resending.");
        const delivered = await deliver(prepared.i, prepared.team, prepared.rawToken, prepared.destination);
        if (!delivered) return fail(res, 503, "Invitation delivery failed. Please check the current invitation status before trying again.");
        return res.json({ success: true, message: "Invitation resend processed. Check the invitation list for its current status." });
      } catch (error) { return failure(res, error); }
    },
    revokePlayerInvitation: async (req, res) => {
      try {
        const id = Number(req.params.invitation_id), existing = await db.playerInvitation.findUnique({ where: { invitation_id: id } });
        if (!existing?.team_id) return fail(res, 404, "Invitation not found.");
        const updated = await invitationTransaction(db, async tx => {
          const team = await lockTeam(tx, existing.team_id);
          if (!canManage(req.user, team)) return false;
          const result = await tx.playerInvitation.updateMany({ where: { invitation_id: id, status: { in: ["PENDING", "ACCEPTED_PENDING_PROFILE"] } }, data: { status: "REVOKED" } });
          if (result.count) await audit(tx, req.user.user_id, id, "PLAYER_INVITATION_REVOKED");
          return result.count === 1;
        });
        return updated ? res.json({ success: true, message: "Invitation revoked. Existing active memberships are unchanged." }) : fail(res);
      } catch (error) { return failure(res, error); }
    },
    previewPlayerInvitationAcceptance: async (req, res) => {
      try {
        const i = await tokenRecord(req.params.token);
        if (!pending(i)) return res.json({ success: true, data: { valid: false, state: i?.status === "PENDING" && i.expires_at <= new Date() ? "EXPIRED" : "UNAVAILABLE" } });
        return res.json({ success: true, data: { valid: true, state: "INVITED", expires_at: i.expires_at, invited_email: maskPlayerInvitationEmail(i.invited_email), team: safeTeam(i.team) } });
      } catch (error) { return failure(res, error); }
    },
    registerPlayerInvitationAccount: async (req, res) => {
      const validation = validatePassword(req.body.password);
      if (!validation.valid || Buffer.byteLength(req.body.password) > 72 || req.body.password !== req.body.confirm_password) return fail(res, 400, validation.message || "Password and confirmation must match and be at most 72 bytes.");
      try {
        const existing = await tokenRecord(req.params.token);
        if (!pending(existing)) return fail(res);
        const password_hash = await bcrypt.hash(req.body.password, SECURITY.BCRYPT_SALT_ROUNDS);
        const created = await invitationTransaction(db, async tx => {
          const team = await lockTeam(tx, existing.team_id);
          const i = { ...await tx.playerInvitation.findUnique({ where: { invitation_id: existing.invitation_id } }), team };
          if (!pending(i) || i.token_hash !== hashPlayerInvitationToken(req.params.token)) return false;
          if (await tx.user.findUnique({ where: { email_key: getEmailLookupKey(i.invited_email) }, select: { user_id: true } })) return false;
          // Possession of the invite authorizes account setup only. Explicit acceptance is separate.
          await tx.user.create({ data: { name: req.body.name.trim(), email: normalizeStoredEmail(i.invited_email), password_hash, role: ROLES.USER, status: "ACTIVE", email_verified: true, email_verified_at: new Date() } });
          return true;
        });
        return created ? res.status(201).json({ success: true, message: "Account created. Sign in to accept your invitation.", data: { account_created: true, email: normalizeStoredEmail(existing.invited_email) } }) : fail(res, 409, "Sign in to continue with this invitation.");
      } catch (error) { if (error.code === "P2002") return fail(res, 409, "Sign in to continue with this invitation."); return failure(res, error); }
    },
    acceptPlayerInvitation: async (req, res) => {
      try {
        const existing = await tokenRecord(req.params.token);
        if (!pending(existing)) return fail(res);
        const accepted = await invitationTransaction(db, async tx => {
          const team = await lockTeam(tx, existing.team_id);
          const i = { ...await tx.playerInvitation.findUnique({ where: { invitation_id: existing.invitation_id } }), team };
          if (!pending(i) || !eligibleInvitationTeam(team) || i.token_hash !== hashPlayerInvitationToken(req.params.token)) return null;
          const u = await account(tx, req.user.user_id);
          if (!matches(u, i) || (i.player?.user_id && i.player.user_id !== u.user_id) || (i.player_id && u.player && u.player.player_id !== i.player_id)) return null;
          return activatePlayerInvitationMembership({ tx, team, invitation: i, user: u, tokenHash: hashPlayerInvitationToken(req.params.token) });
        });
        return accepted ? res.json({ success: true, message: `Welcome to ${accepted.team.name}! You are now a member of this team.`, data: accepted }) : fail(res, 409, "Invitation cannot be accepted with this account. Sign in with the invited mailbox.");
      } catch (error) { return failure(res, error); }
    },
    declinePlayerInvitation: async (req, res) => {
      try {
        const existing = await tokenRecord(req.params.token);
        if (!pending(existing)) return fail(res);
        const result = await invitationTransaction(db, async tx => {
          const team = await lockTeam(tx, existing.team_id);
          const i = { ...await tx.playerInvitation.findUnique({ where: { invitation_id: existing.invitation_id } }), team };
          const u = req.user ? await account(tx, req.user.user_id) : null;
          if (!pending(i) || i.token_hash !== hashPlayerInvitationToken(req.params.token) || (u && !matches(u, i))) return false;
          const changed = await tx.playerInvitation.updateMany({ where: { invitation_id: i.invitation_id, status: "PENDING", token_hash: i.token_hash }, data: { status: "DECLINED" } });
          if (changed.count) await audit(tx, u?.user_id || null, i.invitation_id, "PLAYER_INVITATION_DECLINED");
          return changed.count === 1;
        });
        return result ? res.json({ success: true, message: "Invitation declined." }) : fail(res);
      } catch (error) { return failure(res, error); }
    },
    getMyPlayerInvitations: async (req, res) => {
      try {
        const u = await db.user.findUnique({ where: { user_id: req.user.user_id }, select: { email: true, email_verified: true } });
        const data = await db.playerInvitation.findMany({ where: { OR: [{ accepted_user_id: req.user.user_id }, ...(u.email_verified ? [{ invited_email_key: getEmailLookupKey(u.email), status: "PENDING", delivered_at: { not: null } }] : [])] }, select: { ...listSelect, player: { select: { player_id: true, name: true, date_of_birth: true, gender: true, position: true, preferred_foot: true, profile_photo: true } } }, orderBy: { created_at: "desc" }, take: 100 });
        return res.json({ success: true, data: data.map(i => ({ ...i, player: ["ACCEPTED_PENDING_PROFILE", "ACCEPTED"].includes(i.status) ? i.player : undefined, status: ["PENDING", "ACCEPTED_PENDING_PROFILE"].includes(i.status) && i.expires_at <= new Date() ? "EXPIRED" : i.status })) });
      } catch (error) { return failure(res, error); }
    },
    activateAcceptedInvitation: async (req, res) => {
      try {
        const existing = await db.playerInvitation.findUnique({ where: { invitation_id: Number(req.params.invitation_id) } });
        if (!existing?.team_id) return fail(res);
        const result = await invitationTransaction(db, async tx => {
          const team = await lockTeam(tx, existing.team_id);
          const i = { ...await tx.playerInvitation.findUnique({ where: { invitation_id: existing.invitation_id } }), team };
          if (i?.status !== "ACCEPTED_PENDING_PROFILE" || i.accepted_user_id !== req.user.user_id || !i.delivered_at || i.expires_at <= new Date() || !eligibleInvitationTeam(team)) return null;
          const u = await account(tx, req.user.user_id);
          if (!matches(u, i) || !u.email_verified || u.email !== i.accepted_email_snapshot) return null;
          return activatePlayerInvitationMembership({ tx, team, invitation: i, user: u });
        });
        return result ? res.json({ success: true, message: "Your team membership is active.", data: result }) : fail(res);
      } catch (error) { return failure(res, error); }
    },
    completePlayerProfile: async (req, res) => {
      try {
        if (req.params?.invitation_id) {
          const invitation = await db.playerInvitation.findUnique({ where: { invitation_id: Number(req.params.invitation_id) } });
          if (invitation?.status !== "ACCEPTED" || invitation.accepted_user_id !== req.user.user_id) return fail(res);
        }
        const { name, date_of_birth, gender, position, preferred_foot, profile_photo } = req.body;
        const birth = new Date(`${date_of_birth}T00:00:00.000Z`);
        if (!name?.trim() || name.trim().length < 2 || name.length > 100 || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date_of_birth) || Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== date_of_birth || birth > new Date() || birth < new Date("1900-01-01") || !position?.trim() || position.length > 50 || !["MALE", "FEMALE"].includes(gender)) return fail(res, 400, "Provide valid player profile details.");
        const result = await invitationTransaction(db, async tx => {
          const u = await account(tx, req.user.user_id);
          if (u?.status !== "ACTIVE" || !u.email_verified || !u.player) return null;
          await tx.$queryRaw`SELECT player_id FROM "Player" WHERE player_id = ${u.player.player_id} FOR UPDATE`;
          const player = await tx.player.findUnique({ where: { player_id: u.player.player_id } });
          if (player?.user_id !== u.user_id || player.status !== "ACTIVE") return null;
          const memberships = await tx.teamPlayer.findMany({ where: { player_id: player.player_id, status: "ACTIVE" }, include: { team: true } });
          if (memberships.some(m => !compatible(m.team, { gender }))) return null;
          await tx.player.update({ where: { player_id: player.player_id }, data: { name: name.trim(), date_of_birth: birth, gender, position: position.trim(), preferred_foot: preferred_foot || null, profile_photo: profile_photo || null, profile_completed_at: new Date() } });
          await tx.auditLog.create({ data: { actor_user_id: u.user_id, action: "PLAYER_PROFILE_UPDATED", entity_type: "PLAYER", entity_id: player.player_id } });
          return { player_id: player.player_id, status: "ACTIVE" };
        });
        return result ? res.json({ success: true, message: "Player profile saved. Your memberships are unchanged.", data: result }) : fail(res, 409, "Profile changes must match your active team eligibility.");
      } catch (error) { return failure(res, error); }
    },
    getMyPlayerProfile: async (req, res) => {
      try {
        const player = await db.player.findUnique({ where: { user_id: req.user.user_id }, select: { player_id: true, name: true, date_of_birth: true, gender: true, position: true, preferred_foot: true, profile_photo: true, registration_number: true, status: true, profile_completed_at: true, team_players: { where: { status: "ACTIVE" }, select: { team_player_id: true, joined_at: true, jersey_number: true, status: true, team: { select: { team_id: true, name: true, logo: true } } }, take: 50 }, competition_players: { select: { competition_player_id: true, registration: { select: { registration_id: true, competition: { select: { competition_id: true, name: true } } } } }, take: 50 }, match_players: { select: { match_player_id: true, minutes_played: true, match: { select: { match_id: true, match_date: true, home_team: { select: { name: true } }, away_team: { select: { name: true } } } } }, take: 50 } } });
        return res.json({ success: true, data: player });
      } catch (error) { return failure(res, error); }
    },
  };
};
export const { createPlayerInvitation, getPlayerInvitations, resendPlayerInvitation, revokePlayerInvitation, previewPlayerInvitationAcceptance, registerPlayerInvitationAccount, acceptPlayerInvitation, declinePlayerInvitation, getMyPlayerInvitations, completePlayerProfile, activateAcceptedInvitation, getMyPlayerProfile } = createPlayerInvitationControllers();
