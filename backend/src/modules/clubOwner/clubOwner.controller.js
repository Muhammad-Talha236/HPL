import prisma from "../../database/prisma.js";

const MAX_LIMIT = 50;
const ownedClubWhere = (userId) => ({ club: { owner_id: userId } });
const parsePage = (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return null;
  return { page, limit };
};

export const getOwnedClubs = async (userId) => prisma.club.findMany({
  where: { owner_id: userId },
  select: { club_id: true, name: true, logo: true, description: true, region: true, district: true, city: true, contact_email: true, contact_phone: true, representative_name: true, status: true, created_at: true },
  orderBy: [{ created_at: "asc" }, { club_id: "asc" }],
});

export const getClubOwnerDashboard = async (req, res, next) => {
  try {
    const clubs = await getOwnedClubs(req.user.user_id);
    const clubIds = clubs.map((club) => club.club_id);
    const teamScope = { club_id: { in: clubIds } };
    const registrationScope = { team: teamScope };
    const now = new Date();
    const [activeTeams, menTeams, womenTeams, activePlayers, pendingRegistrations, approvedRegistrations, pendingPayments, upcomingMatches, recentResults] = await Promise.all([
      prisma.team.count({ where: { ...teamScope, status: "ACTIVE" } }),
      prisma.team.count({ where: { ...teamScope, status: "ACTIVE", gender: "MEN" } }),
      prisma.team.count({ where: { ...teamScope, status: "ACTIVE", gender: "WOMEN" } }),
      prisma.teamPlayer.count({ where: { status: "ACTIVE", team: teamScope, player: { status: "ACTIVE" } } }),
      prisma.competitionRegistration.count({ where: { ...registrationScope, registration_status: "PENDING" } }),
      prisma.competitionRegistration.count({ where: { ...registrationScope, registration_status: "APPROVED" } }),
      prisma.competitionRegistration.count({ where: { ...registrationScope, payment_status: "PENDING" } }),
      prisma.match.findMany({ where: { status: "SCHEDULED", match_date: { gte: now }, OR: [{ home_team: teamScope }, { away_team: teamScope }] }, select: { match_id: true, match_date: true, start_time: true, home_team: { select: { name: true } }, away_team: { select: { name: true } }, venue: { select: { name: true } } }, orderBy: [{ match_date: "asc" }, { start_time: "asc" }], take: 5 }),
      prisma.match.findMany({ where: { status: "COMPLETED", OR: [{ home_team: teamScope }, { away_team: teamScope }] }, select: { match_id: true, match_date: true, home_score: true, away_score: true, home_team: { select: { name: true } }, away_team: { select: { name: true } } }, orderBy: [{ match_date: "desc" }, { match_id: "desc" }], take: 5 }),
    ]);
    return res.json({ success: true, data: { clubs, counts: { active_teams: activeTeams, men_teams: menTeams, women_teams: womenTeams, active_players: activePlayers, pending_registrations: pendingRegistrations, approved_registrations: approvedRegistrations, pending_payments: pendingPayments }, upcoming_matches: upcomingMatches, recent_results: recentResults } });
  } catch (error) { next(error); }
};

export const getClubOwnerProfile = async (req, res, next) => { try { return res.json({ success: true, data: await getOwnedClubs(req.user.user_id) }); } catch (error) { next(error); } };

export const updateClubOwnerProfile = async (req, res, next) => {
  try {
    const clubId = Number(req.params.club_id);
    if (!Number.isInteger(clubId) || clubId < 1) return res.status(400).json({ success: false, message: "Valid club ID is required" });
    const allowed = ["name", "logo", "description", "region", "district", "city", "contact_email", "contact_phone", "representative_name"];
    if (Object.keys(req.body).some((key) => !allowed.includes(key))) return res.status(400).json({ success: false, message: "Protected club fields cannot be changed" });
    const club = await prisma.club.findFirst({ where: { club_id: clubId, owner_id: req.user.user_id }, select: { club_id: true } });
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    const data = Object.fromEntries(Object.entries(req.body).filter(([key, value]) => allowed.includes(key) && value !== undefined).map(([key, value]) => [key, typeof value === "string" ? value.trim() || null : value]));
    if (data.name !== undefined && !data.name) return res.status(400).json({ success: false, message: "Club name cannot be empty" });
    const updated = await prisma.club.update({ where: { club_id: clubId }, data, select: { club_id: true, name: true, logo: true, description: true, region: true, district: true, city: true, contact_email: true, contact_phone: true, representative_name: true, status: true, created_at: true } });
    return res.json({ success: true, message: "Club profile updated", data: updated });
  } catch (error) { next(error); }
};

export const getClubOwnerTeams = async (req, res, next) => {
  try {
    const paging = parsePage(req.query); if (!paging) return res.status(400).json({ success: false, message: "Invalid team pagination" });
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = req.query.status; const gender = req.query.gender; const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
    if (q.length > 100 || type.length > 50 || (status && !["ACTIVE", "INACTIVE"].includes(status)) || (gender && !["MEN", "WOMEN"].includes(gender))) return res.status(400).json({ success: false, message: "Invalid team filters" });
    const where = { club: { owner_id: req.user.user_id }, ...(status ? { status } : {}), ...(gender ? { gender } : {}), ...(type ? { team_type: type } : {}), ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) };
    const select = { team_id: true, name: true, logo: true, gender: true, team_type: true, status: true, city: true, club_id: true, home_venue: { select: { name: true } }, _count: { select: { team_players: { where: { status: "ACTIVE" } }, registrations: true } } };
    const [data, total] = await Promise.all([prisma.team.findMany({ where, select, orderBy: [{ name: "asc" }, { team_id: "asc" }], skip: (paging.page - 1) * paging.limit, take: paging.limit }), prisma.team.count({ where })]);
    return res.json({ success: true, data: data.map(({ _count, ...team }) => ({ ...team, active_player_count: _count.team_players, registration_count: _count.registrations })), pagination: { ...paging, total, total_pages: Math.ceil(total / paging.limit) } });
  } catch (error) { next(error); }
};

export const getClubOwnerTeam = async (req, res, next) => {
  try {
    const teamId = Number(req.params.team_id); if (!Number.isInteger(teamId) || teamId < 1) return res.status(400).json({ success: false, message: "Valid team ID is required" });
    const data = await prisma.team.findFirst({ where: { team_id: teamId, club: { owner_id: req.user.user_id } }, select: { team_id: true, club_id: true, name: true, logo: true, gender: true, team_type: true, status: true, region: true, district: true, city: true, description: true, contact_email: true, contact_phone: true, home_venue: { select: { venue_id: true, name: true, city: true } }, team_players: { where: { status: "ACTIVE" }, select: { team_player_id: true, jersey_number: true, player: { select: { player_id: true, name: true, position: true, gender: true, registration_number: true } } }, take: 50 }, registrations: { select: { registration_id: true, registration_status: true, payment_status: true, competition: { select: { name: true } } }, orderBy: { created_at: "desc" }, take: 10 } } });
    if (!data) return res.status(404).json({ success: false, message: "Team not found" }); return res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getClubOwnerPlayers = async (req, res, next) => {
  try {
    const paging = parsePage(req.query); if (!paging) return res.status(400).json({ success: false, message: "Invalid player pagination" });
    const q = typeof req.query.q === "string" ? req.query.q.trim() : ""; const teamId = req.query.team_id ? Number(req.query.team_id) : undefined; const gender = req.query.gender; const position = typeof req.query.position === "string" ? req.query.position.trim() : ""; const membershipStatus = req.query.status || "ACTIVE";
    if (q.length > 100 || position.length > 50 || !["ACTIVE", "INACTIVE"].includes(membershipStatus) || (gender && !["MALE", "FEMALE"].includes(gender)) || (teamId !== undefined && (!Number.isInteger(teamId) || teamId < 1))) return res.status(400).json({ success: false, message: "Invalid player filters" });
    const playerFilters = { ...(gender ? { gender } : {}), ...(position ? { position } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { registration_number: { contains: q, mode: "insensitive" } }] } : {}) };
    const where = { status: membershipStatus, team: { club: { owner_id: req.user.user_id }, ...(teamId ? { team_id: teamId } : {}) }, player: playerFilters };
    const select = { team_player_id: true, jersey_number: true, status: true, player: { select: { player_id: true, name: true, position: true, gender: true, registration_number: true, profile_photo: true } }, team: { select: { team_id: true, name: true } } };
    const [data, total] = await Promise.all([prisma.teamPlayer.findMany({ where, select, orderBy: [{ player: { name: "asc" } }, { team_player_id: "asc" }], skip: (paging.page - 1) * paging.limit, take: paging.limit }), prisma.teamPlayer.count({ where })]); return res.json({ success: true, data, pagination: { ...paging, total, total_pages: Math.ceil(total / paging.limit) } });
  } catch (error) { next(error); }
};

export const getClubOwnerPlayer = async (req, res, next) => {
  try {
    const playerId = Number(req.params.player_id);
    if (!Number.isInteger(playerId) || playerId < 1) return res.status(400).json({ success: false, message: "Valid player ID is required" });
    const data = await prisma.teamPlayer.findFirst({ where: { player_id: playerId, status: "ACTIVE", team: { club: { owner_id: req.user.user_id } } }, select: { team_player_id: true, jersey_number: true, joined_at: true, player: { select: { player_id: true, name: true, profile_photo: true, date_of_birth: true, gender: true, position: true, nationality: true, registration_number: true, status: true, user_id: true, team_players: { where: { status: "ACTIVE", team: { status: "ACTIVE", club: { owner_id: req.user.user_id, status: "ACTIVE" } } }, select: { team: { select: { team_id: true, name: true } } }, orderBy: { team_id: "asc" } } } }, team: { select: { team_id: true, name: true, gender: true } } } });
    if (!data) return res.status(404).json({ success: false, message: "Player not found" });
    const { user_id, team_players, ...safePlayer } = data.player;
    const eligible_invitation_teams = (team_players || []).map((membership) => membership.team);
    return res.json({ success: true, data: { ...data, player: { ...safePlayer, account_linked: Boolean(user_id) }, eligible_invitation_teams } });
  } catch (error) { next(error); }
};

export const getClubOwnerPayments = async (req, res, next) => { try { const paging = parsePage(req.query); const status = req.query.status; const teamId = req.query.team_id ? Number(req.query.team_id) : undefined; const competitionId = req.query.competition_id ? Number(req.query.competition_id) : undefined; if (!paging || (status && !["UNPAID", "PENDING", "PAID", "REJECTED"].includes(status)) || [teamId, competitionId].some((id) => id !== undefined && (!Number.isInteger(id) || id < 1))) return res.status(400).json({ success: false, message: "Invalid payment filters" }); const where = { ...(status ? { payment_status: status } : {}), registration: { team: { club: { owner_id: req.user.user_id }, ...(teamId ? { team_id: teamId } : {}) }, ...(competitionId ? { competition_id: competitionId } : {}) } }; const select = { payment_id: true, amount: true, payment_method: true, transaction_reference: true, payment_status: true, paid_at: true, created_at: true, registration: { select: { registration_id: true, team: { select: { name: true } }, competition: { select: { name: true } } } } }; const [data, total] = await Promise.all([prisma.payment.findMany({ where, select, orderBy: [{ created_at: "desc" }, { payment_id: "desc" }], skip: (paging.page - 1) * paging.limit, take: paging.limit }), prisma.payment.count({ where })]); return res.json({ success: true, data, pagination: { ...paging, total, total_pages: Math.ceil(total / paging.limit) } }); } catch (error) { next(error); } };
