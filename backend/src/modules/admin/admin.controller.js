import prisma from "../../database/prisma.js";

const matchSelect = { match_id: true, match_date: true, start_time: true, status: true, home_team: { select: { team_id: true, name: true } }, away_team: { select: { team_id: true, name: true } }, competition: { select: { competition_id: true, name: true } } };

export const getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const [users, clubs, teams, players, competitions, live_matches, upcoming_matches_count, pending_registrations, pending_payments, upcoming_matches, recent_activity] = await prisma.$transaction([
      prisma.user.count(), prisma.club.count({ where: { status: "ACTIVE" } }), prisma.team.count({ where: { status: "ACTIVE" } }), prisma.player.count({ where: { status: "ACTIVE" } }), prisma.competition.count({ where: { status: "ACTIVE" } }), prisma.match.count({ where: { status: "LIVE" } }), prisma.match.count({ where: { status: "SCHEDULED", match_date: { gte: today } } }), prisma.competitionRegistration.count({ where: { registration_status: "PENDING" } }), prisma.competitionRegistration.count({ where: { payment_status: "PENDING" } }), prisma.match.findMany({ where: { status: "SCHEDULED", match_date: { gte: today } }, select: matchSelect, orderBy: [{ match_date: "asc" }, { start_time: "asc" }], take: 6 }), prisma.auditLog.findMany({ select: { audit_id: true, action: true, entity_type: true, entity_id: true, created_at: true, actor: { select: { user_id: true, name: true } } }, orderBy: { created_at: "desc" }, take: 8 }),
    ]);
    return res.json({ success: true, data: { counts: { users, active_clubs: clubs, active_teams: teams, active_players: players, active_competitions: competitions }, operations: { live_matches, upcoming_matches: upcoming_matches_count, pending_registrations, pending_payments }, upcoming_matches, recent_activity } });
  } catch (error) { next(error); }
};
