import prisma from "../../database/prisma.js";

const TEAM_STATUSES = ["ACTIVE", "INACTIVE"];
const TEAM_GENDERS = ["MEN", "WOMEN"];
const ownerSelect = { user_id: true, name: true, email: true, role: true, status: true };
const listSelect = {
  team_id: true, name: true, logo: true, gender: true, team_type: true, status: true, verification_status: true, city: true, created_at: true,
  club: { select: { club_id: true, name: true, status: true } },
  owner: { select: ownerSelect },
  home_venue: { select: { venue_id: true, name: true, city: true } },
  _count: { select: { team_players: true } },
};

const parseDate = (value, endOfDay = false) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

const buildQuery = (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const status = query.status || "";
  const gender = query.gender || "";
  const type = typeof query.type === "string" ? query.type.trim() : "";
  const city = typeof query.city === "string" ? query.city.trim() : "";
  const registeredOn = query.registered_on || "";
  const clubId = query.club_id === undefined ? undefined : Number(query.club_id);
  const ownerId = query.owner_id === undefined ? undefined : Number(query.owner_id);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50 || q.length > 100 || type.length > 50 || city.length > 100 || (status && !TEAM_STATUSES.includes(status)) || (gender && !TEAM_GENDERS.includes(gender)) || (clubId !== undefined && (!Number.isInteger(clubId) || clubId < 1)) || (ownerId !== undefined && (!Number.isInteger(ownerId) || ownerId < 1))) return null;
  const onDate = registeredOn ? parseDate(registeredOn) : undefined;
  if (registeredOn && !onDate) return null;

  return {
    page, limit,
    where: {
      ...(status ? { status } : {}),
      ...(gender ? { gender } : {}),
      ...(type ? { team_type: type } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(clubId ? { club_id: clubId } : {}),
      ...(ownerId ? { owner_id: ownerId } : {}),
      ...(onDate ? { created_at: { gte: onDate, lte: parseDate(registeredOn, true) } } : {}),
      ...(q ? { OR: [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { owner: { is: { name: { contains: q, mode: "insensitive" } } } },
      ] } : {}),
    },
  };
};

export const getAdminTeams = async (req, res, next) => {
  try {
    const parsed = buildQuery(req.query);
    if (!parsed) return res.status(400).json({ success: false, message: "Invalid team query" });
    const [teams, total] = await Promise.all([
      prisma.team.findMany({ where: parsed.where, select: listSelect, orderBy: [{ created_at: "desc" }, { team_id: "desc" }], skip: (parsed.page - 1) * parsed.limit, take: parsed.limit }),
      prisma.team.count({ where: parsed.where }),
    ]);
    return res.json({ success: true, data: teams.map(({ _count, ...team }) => ({ ...team, player_count: _count.team_players })), pagination: { page: parsed.page, limit: parsed.limit, total, total_pages: Math.ceil(total / parsed.limit) } });
  } catch (error) { next(error); }
};

export const getAdminTeamsStats = async (_req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const [total, active, inactive, newThisMonth, newLastMonth] = await Promise.all([
      prisma.team.count(), prisma.team.count({ where: { status: "ACTIVE" } }), prisma.team.count({ where: { status: "INACTIVE" } }),
      prisma.team.count({ where: { created_at: { gte: monthStart } } }),
      prisma.team.count({ where: { created_at: { gte: previousMonthStart, lt: monthStart } } }),
    ]);
    return res.json({ success: true, data: { total, active, inactive, new_this_month: newThisMonth, new_last_month: newLastMonth } });
  } catch (error) { next(error); }
};

export const getAdminTeamFilterOptions = async (_req, res, next) => {
  try {
    const [cities, types] = await Promise.all([
      prisma.team.findMany({ where: { city: { not: null } }, distinct: ["city"], select: { city: true }, orderBy: { city: "asc" }, take: 100 }),
      prisma.team.findMany({ distinct: ["team_type"], select: { team_type: true }, orderBy: { team_type: "asc" }, take: 100 }),
    ]);
    return res.json({ success: true, data: { cities: cities.map(({ city }) => city).filter(Boolean), types: types.map(({ team_type }) => team_type).filter(Boolean), statuses: TEAM_STATUSES } });
  } catch (error) { next(error); }
};

export const getAdminTeamPlayers = async (req, res, next) => {
  try {
    const teamId = Number(req.params.team_id); const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 10);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : ""; const position = typeof req.query.position === "string" ? req.query.position.trim() : ""; const status = req.query.status || "ACTIVE";
    if (!Number.isInteger(teamId) || teamId < 1 || !Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50 || q.length > 100 || position.length > 60 || !["ACTIVE", "INACTIVE"].includes(status)) return res.status(400).json({ success: false, message: "Invalid team player query" });
    const team = await prisma.team.findUnique({ where: { team_id: teamId }, select: { team_id: true } });
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    const where = { team_id: teamId, status, ...((position || q) ? { player: { is: { ...(position ? { position } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { registration_number: { contains: q, mode: "insensitive" } }] } : {}) } } } : {}) };
    const select = { team_player_id: true, jersey_number: true, joined_at: true, left_at: true, status: true, player: { select: { player_id: true, name: true, profile_photo: true, position: true, status: true, date_of_birth: true } } };
    const [data, total] = await Promise.all([prisma.teamPlayer.findMany({ where, select, orderBy: [{ jersey_number: "asc" }, { team_player_id: "asc" }], skip: (page - 1) * limit, take: limit }), prisma.teamPlayer.count({ where })]);
    return res.json({ success: true, data, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

export const getAdminTeamStats = async (req, res, next) => {
  try {
    const teamId = Number(req.params.team_id);
    if (!Number.isInteger(teamId) || teamId < 1) return res.status(400).json({ success: false, message: "Team ID must be a valid positive integer" });
    const now = new Date();
    const [team, season] = await Promise.all([
      prisma.team.findUnique({ where: { team_id: teamId }, select: { team_id: true } }),
      prisma.season.findFirst({ where: { status: "ACTIVE", start_date: { lte: now }, end_date: { gte: now } }, select: { season_id: true, name: true } }),
    ]);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    const matchWhere = { status: "COMPLETED", ...(season ? { season_id: season.season_id } : { match_id: -1 }), OR: [{ home_team_id: teamId }, { away_team_id: teamId }] };
    const [totalPlayers, matches] = await Promise.all([
      prisma.teamPlayer.count({ where: { team_id: teamId, status: "ACTIVE" } }),
      prisma.match.findMany({ where: matchWhere, select: { home_team_id: true, away_team_id: true, home_score: true, away_score: true } }),
    ]);
    const wins = matches.filter((match) => (match.home_team_id === teamId && match.home_score > match.away_score) || (match.away_team_id === teamId && match.away_score > match.home_score)).length;
    const losses = matches.filter((match) => (match.home_team_id === teamId && match.home_score < match.away_score) || (match.away_team_id === teamId && match.away_score < match.home_score)).length;
    return res.json({ success: true, data: { season: season?.name || null, total_players: totalPlayers, matches_played: matches.length, wins, losses, draws: matches.length - wins - losses } });
  } catch (error) { next(error); }
};

export const getAdminTeamHistory = async (req, res, next) => {
  try {
    const teamId = Number(req.params.team_id);
    if (!Number.isInteger(teamId) || teamId < 1) return res.status(400).json({ success: false, message: "Team ID must be a valid positive integer" });
    const team = await prisma.team.findUnique({ where: { team_id: teamId }, select: { team_id: true } });
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    const data = await prisma.auditLog.findMany({ where: { entity_type: "TEAM", entity_id: teamId }, select: { audit_id: true, action: true, details: true, created_at: true, actor: { select: { user_id: true, name: true } } }, orderBy: [{ created_at: "desc" }, { audit_id: "desc" }], take: 100 });
    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getAdminTeamById = async (req, res, next) => {
  try {
    const teamId = Number(req.params.team_id);
    if (!Number.isInteger(teamId) || teamId < 1) return res.status(400).json({ success: false, message: "Team ID must be a valid positive integer" });
    const team = await prisma.team.findUnique({ where: { team_id: teamId }, select: { ...listSelect, region: true, district: true, city: true, description: true, contact_email: true, contact_phone: true, updated_at: true, team_players: { where: { status: "ACTIVE" }, select: { team_player_id: true, status: true, jersey_number: true, joined_at: true, player: { select: { player_id: true, name: true, profile_photo: true, position: true, status: true } } }, orderBy: { team_player_id: "asc" }, take: 10 }, registrations: { select: { registration_id: true, registration_date: true, registration_status: true, payment_status: true, rejection_reason: true, competition: { select: { competition_id: true, name: true, season: { select: { name: true } } } } }, orderBy: { registration_date: "desc" }, take: 50 }, home_matches: { select: { match_id: true, match_date: true, status: true, home_score: true, away_score: true, away_team: { select: { name: true } } }, orderBy: { match_date: "desc" }, take: 5 }, away_matches: { select: { match_id: true, match_date: true, status: true, home_score: true, away_score: true, home_team: { select: { name: true } } }, orderBy: { match_date: "desc" }, take: 5 } } });
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    const { _count, ...data } = team;
    return res.json({ success: true, data: { ...data, player_count: _count.team_players } });
  } catch (error) { next(error); }
};
