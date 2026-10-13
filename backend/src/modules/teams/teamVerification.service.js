import prisma from "../../database/prisma.js";
import { eligiblePlayerGenders } from "../../utils/playerEligibility.util.js";

// Existing team verification/readiness and historical statuses remain available
// after removal of new team application submission and initial approval.
const SQUAD_REQUIREMENT = 11;
export const TEAM_VERIFICATION = { PROVISIONAL: "PROVISIONAL", VERIFIED: "VERIFIED", SUSPENDED: "SUSPENDED" };
export const TEAM_REQUEST_STATUS = { PENDING: "PENDING", CHANGES_REQUESTED: "CHANGES_REQUESTED", PROVISIONALLY_APPROVED: "PROVISIONALLY_APPROVED", REJECTED: "REJECTED", EXPIRED: "EXPIRED", VERIFIED: "VERIFIED" };

export const getTeamSquadReadiness = async (teamId, db = prisma) => {
  const team = await db.team.findUnique({ where: { team_id: teamId }, select: { team_id: true, gender: true, verification_status: true, status: true, owner: { select: { user_id: true, status: true } }, contact_email: true, contact_phone: true } });
  if (!team) return null;
  const eligible_players = await db.teamPlayer.count({ where: { team_id: teamId, status: "ACTIVE", left_at: null, player: { status: "ACTIVE", date_of_birth: { not: null }, position: { not: null }, NOT: { position: "" }, gender: { in: eligiblePlayerGenders(team.gender) } } } });
  return { ...team, required_players: SQUAD_REQUIREMENT, eligible_players, remaining_players: Math.max(0, SQUAD_REQUIREMENT - eligible_players), squad_ready: eligible_players >= SQUAD_REQUIREMENT };
};

