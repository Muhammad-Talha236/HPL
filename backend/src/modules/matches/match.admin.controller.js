import prisma from "../../database/prisma.js";

const STATUSES = ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED", "POSTPONED"];
const positive = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};
const dateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
};

const listSelect = {
  match_id: true, status: true, match_date: true, start_time: true, started_at: true,
  home_score: true, away_score: true, created_at: true, updated_at: true,
  competition: { select: { competition_id: true, name: true, gender: true } },
  season: { select: { season_id: true, name: true } },
  home_team: { select: { team_id: true, name: true } },
  away_team: { select: { team_id: true, name: true } },
  venue: { select: { venue_id: true, name: true, city: true, surface_type: true } },
  referee: { select: { referee_id: true, name: true, license_number: true } },
};

export const getAdminMatches = async (req, res, next) => {
  try {
    const { page = "1", limit = "20", q, status, competition_id, season_id, team_id, venue_id, referee_id, gender, date_from, date_to } = req.query;
    const pageNumber = positive(page);
    const limitNumber = positive(limit);
    if (!pageNumber || !limitNumber || limitNumber > 50) return res.status(400).json({ success: false, message: "page must be positive and limit must be between 1 and 50" });
    if (status && !STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid match status" });
    if (gender && !["MEN", "WOMEN"].includes(gender)) return res.status(400).json({ success: false, message: "Invalid competition gender" });
    const where = {};
    const numericFilters = [["competition_id", competition_id], ["season_id", season_id], ["venue_id", venue_id], ["referee_id", referee_id]];
    for (const [key, value] of numericFilters) {
      if (value === undefined) continue;
      const parsed = positive(value);
      if (!parsed) return res.status(400).json({ success: false, message: `${key} must be a positive integer` });
      where[key] = parsed;
    }
    if (team_id !== undefined) {
      const teamId = positive(team_id);
      if (!teamId) return res.status(400).json({ success: false, message: "team_id must be a positive integer" });
      where.OR = [{ home_team_id: teamId }, { away_team_id: teamId }];
    }
    if (status) where.status = status;
    if (gender) where.competition = { gender };
    const from = dateOnly(date_from), to = dateOnly(date_to);
    if ((date_from && !from) || (date_to && !to) || (from && to && from > to)) return res.status(400).json({ success: false, message: "Invalid date range" });
    if (from || to) where.match_date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    if (q?.trim()) {
      const search = q.trim().slice(0, 100);
      const searchFilter = { OR: [
        { competition: { name: { contains: search, mode: "insensitive" } } },
        { home_team: { name: { contains: search, mode: "insensitive" } } },
        { away_team: { name: { contains: search, mode: "insensitive" } } },
        { venue: { name: { contains: search, mode: "insensitive" } } },
        { referee: { name: { contains: search, mode: "insensitive" } } },
      ] };
      if (where.OR) where.AND = [{ OR: where.OR }, searchFilter], delete where.OR;
      else where.AND = [searchFilter];
    }
    const [data, total, grouped] = await prisma.$transaction([
      prisma.match.findMany({ where, select: listSelect, orderBy: [{ match_date: "desc" }, { start_time: "desc" }, { match_id: "desc" }], skip: (pageNumber - 1) * limitNumber, take: limitNumber }),
      prisma.match.count({ where }),
      prisma.match.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);
    const summary = Object.fromEntries(STATUSES.map((key) => [key, 0]));
    grouped.forEach((row) => { summary[row.status] = row._count._all; });
    return res.json({ success: true, data, summary, pagination: { page: pageNumber, limit: limitNumber, total, total_pages: Math.max(1, Math.ceil(total / limitNumber)) } });
  } catch (error) { next(error); }
};

export const getAdminMatchById = async (req, res, next) => {
  try {
    const matchId = positive(req.params.match_id);
    if (!matchId) return res.status(400).json({ success: false, message: "Match ID must be a positive integer" });
    const match = await prisma.match.findUnique({ where: { match_id: matchId }, select: {
      ...listSelect, match_notes: true,
      players: { select: { match_player_id: true, team_id: true, player_id: true, starting_status: true, is_on_field: true, position: true, shirt_number: true, minutes_played: true, player: { select: { player_id: true, name: true, status: true } } }, orderBy: [{ team_id: "asc" }, { shirt_number: "asc" }] },
      events: { select: { event_id: true, team_id: true, player_id: true, related_player_id: true, event_type: true, minute: true, extra_time: true, description: true, created_at: true, team: { select: { team_id: true, name: true } }, player: { select: { player_id: true, name: true } }, related_player: { select: { player_id: true, name: true } } }, orderBy: [{ minute: "asc" }, { event_id: "asc" }], take: 250 },
    } });
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    return res.json({ success: true, data: match });
  } catch (error) { next(error); }
};

// One compact lookup endpoint lets the form use authoritative active records and
// approved competition participants without exposing private contact data.
export const getAdminMatchOptions = async (req, res, next) => {
  try {
    const competitionId = req.query.competition_id === undefined ? null : positive(req.query.competition_id);
    if (req.query.competition_id !== undefined && !competitionId) return res.status(400).json({ success: false, message: "competition_id must be a positive integer" });
    const [competitions, venues, referees, teams, registrations] = await prisma.$transaction([
      prisma.competition.findMany({ where: { status: "ACTIVE" }, select: { competition_id: true, name: true, season_id: true, gender: true, competition_start_date: true, competition_end_date: true, season: { select: { season_id: true, name: true, start_date: true, end_date: true } } }, orderBy: [{ season: { start_date: "desc" } }, { name: "asc" }], take: 50 }),
      prisma.venue.findMany({ where: { status: "ACTIVE" }, select: { venue_id: true, name: true, city: true, capacity: true, surface_type: true }, orderBy: { name: "asc" }, take: 100 }),
      prisma.referee.findMany({ where: { status: "ACTIVE" }, select: { referee_id: true, name: true, license_number: true, city: true }, orderBy: { name: "asc" }, take: 100 }),
      prisma.team.findMany({ where: { status: "ACTIVE" }, select: { team_id: true, name: true, gender: true }, orderBy: { name: "asc" }, take: 100 }),
      prisma.competitionRegistration.findMany({ where: { competition_id: competitionId || -1, registration_status: "APPROVED", team: { status: "ACTIVE" } }, select: { team: { select: { team_id: true, name: true, gender: true } } }, orderBy: { team: { name: "asc" } }, take: 100 }),
    ]);
    const seasons = Array.from(new Map(competitions.map((competition) => [competition.season.season_id, competition.season])).values());
    return res.json({ success: true, data: { competitions, seasons, venues, referees, teams: competitionId ? registrations.map((registration) => registration.team) : teams } });
  } catch (error) { next(error); }
};
