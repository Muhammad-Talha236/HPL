import { lockInvitationPlayer } from "./playerInvitationLocks.service.js";
import { getEmailLookupKey } from "../utils/email.util.js";
import { isPlayerGenderCompatible } from "../utils/playerEligibility.util.js";
import { generateRegistrationNumber } from "../utils/playerRegistration.util.js";

export const eligibleInvitationTeam = team => !!team && team.status === "ACTIVE" && team.verification_status !== "SUSPENDED" && (team.club_id === null || team.club?.status === "ACTIVE") && !(team.verification_status === "PROVISIONAL" && team.registration_request?.squad_deadline && team.registration_request.squad_deadline <= new Date());

// Database-only service. The caller must hold Team and User row locks inside
// the existing invitation transaction; this service additionally locks Player.
export const activatePlayerInvitationMembership = async ({ tx, team, invitation: i, user: u, tokenHash }) => {
    const tokenAcceptance = typeof tokenHash === "string";
    if (!eligibleInvitationTeam(team) || i?.team_id !== team.team_id || u?.status !== "ACTIVE" || getEmailLookupKey(u.email) !== getEmailLookupKey(i.invited_email) || !i.delivered_at || i.expires_at <= new Date()) return null;
    if (tokenAcceptance ? i.status !== "PENDING" || i.token_hash !== tokenHash : i.status !== "ACCEPTED_PENDING_PROFILE" || i.accepted_user_id !== u.user_id || !u.email_verified || i.accepted_email_snapshot !== u.email) return null;
    if (i.player_id && u.player && u.player.player_id !== i.player_id) return null;
    let player = u.player || (i.player_id ? { player_id: i.player_id } : null);
    if (player) {
      player = await lockInvitationPlayer(tx, player.player_id);
      if (!player || player.status !== "ACTIVE" || (player.user_id && player.user_id !== u.user_id) || (player.gender && !isPlayerGenderCompatible(team.gender, player.gender))) return null;
    }
    const membership = player ? await tx.teamPlayer.findUnique({ where: { team_id_player_id: { team_id: team.team_id, player_id: player.player_id } } }) : null;
    // Historical inactive memberships remain admin-restored, never silently revived.
    if (membership && membership.status !== "ACTIVE") return null;
    if (!player) {
      player = await tx.player.create({ data: { name: u.name, date_of_birth: null, gender: null, position: null, user_id: u.user_id, registration_number: generateRegistrationNumber(), status: "ACTIVE", profile_completed_at: null } });
    } else if (!player.user_id) {
      const linked = await tx.player.updateMany({ where: { player_id: player.player_id, user_id: null, status: "ACTIVE" }, data: { user_id: u.user_id } });
      if (linked.count !== 1) throw Object.assign(new Error("Player link conflict"), { code: "PLAYER_LINK_CONFLICT" });
    }
    if (!membership) await tx.teamPlayer.create({ data: { team_id: team.team_id, player_id: player.player_id, status: "ACTIVE", joined_at: new Date(), jersey_number: null } });
    // The delivered invitation token proves ownership of the account's canonical mailbox.
    if (tokenAcceptance) await tx.user.update({ where: { user_id: u.user_id }, data: { email_verified: true, email_verified_at: u.email_verified_at || new Date() } });
    const consumed = await tx.playerInvitation.updateMany({ where: {
      invitation_id: i.invitation_id, status: tokenAcceptance ? "PENDING" : "ACCEPTED_PENDING_PROFILE",
      expires_at: { gt: new Date() }, delivered_at: { not: null },
      ...(tokenAcceptance ? { token_hash: i.token_hash } : { accepted_user_id: u.user_id, accepted_email_snapshot: u.email }),
    }, data: { status: "ACCEPTED", accepted_user_id: u.user_id, accepted_email_snapshot: u.email, accepted_at: i.accepted_at || new Date(), player_id: player.player_id } });
    if (consumed.count !== 1) throw Object.assign(new Error("Invitation consumption conflict"), { code: "PLAYER_LINK_CONFLICT" });
    await tx.auditLog.create({ data: { actor_user_id: u.user_id, action: "PLAYER_MEMBERSHIP_ACTIVATED", entity_type: "PLAYER_INVITATION", entity_id: i.invitation_id } });
    return { invitation_id: i.invitation_id, player_id: player.player_id, status: "ACTIVE", team: { team_id: team.team_id, name: team.name, logo: team.logo || null, gender: team.gender } };
  };
