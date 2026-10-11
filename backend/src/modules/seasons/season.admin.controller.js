import prisma from "../../database/prisma.js";

const base = { season_id: true, name: true, start_date: true, end_date: true, status: true, description: true, created_at: true, updated_at: true, _count: { select: { competitions: true, matches: true } } };
export const getAdminSeasons = async (req, res, next) => { try { const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 20); const q = typeof req.query.q === "string" ? req.query.q.trim() : ""; const { status } = req.query; if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50 || q.length > 100 || (status && !["ACTIVE", "INACTIVE"].includes(status))) return res.status(400).json({ success: false, message: "Invalid season query" }); const where = { ...(q ? { name: { contains: q, mode: "insensitive" } } : {}), ...(status ? { status } : {}) }; const now = new Date();
const [seasons, total, upcoming, active, completed] = await Promise.all([
  prisma.season.findMany({ where, select: base, orderBy: [{ start_date: "desc" }, { season_id: "desc" }], skip: (page - 1) * limit, take: limit }),
  prisma.season.count({ where }),
  prisma.season.count({ where: { ...where, start_date: { gt: now } } }),
  prisma.season.count({ where: { ...where, status: "ACTIVE" } }),
  prisma.season.count({ where: { ...where, end_date: { lt: now } } }),
]);
return res.json({ success: true, data: seasons.map(({ _count, ...season }) => ({ ...season, competition_count: _count.competitions, match_count: _count.matches })), summary: { total, upcoming, active, completed }, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } }); } catch (error) { next(error); } };
export const getAdminSeasonById = async (req, res, next) => {
  try {
    const seasonId = Number(req.params.season_id);
    if (!Number.isInteger(seasonId) || seasonId < 1) {
      return res.status(400).json({ success: false, message: "Season ID must be a positive integer" });
    }

    const season = await prisma.season.findUnique({
      where: { season_id: seasonId },
      select: {
        ...base,
        competitions: {
          select: {
            competition_id: true,
            name: true,
            status: true,
            gender: true,
            format: true,
            competition_start_date: true,
            competition_end_date: true,
            _count: {
              select: {
                matches: true,
                registrations: { where: { registration_status: "APPROVED" } },
              },
            },
            registrations: {
              where: { registration_status: "APPROVED" },
              select: { team_id: true },
            },
            standings: {
              select: {
                position: true,
                played: true,
                wins: true,
                draws: true,
                losses: true,
                goal_difference: true,
                points: true,
                team: { select: { team_id: true, name: true } },
              },
              orderBy: { position: "asc" },
              take: 20,
            },
          },
          orderBy: { competition_start_date: "desc" },
        },
        matches: {
          select: {
            match_id: true,
            match_date: true,
            start_time: true,
            status: true,
            home_score: true,
            away_score: true,
            home_team: { select: { team_id: true, name: true } },
            away_team: { select: { team_id: true, name: true } },
            venue: { select: { venue_id: true, name: true } },
            competition: { select: { competition_id: true, name: true } },
          },
          orderBy: [{ match_date: "desc" }, { match_id: "desc" }],
        },
      },
    });
    if (!season) return res.status(404).json({ success: false, message: "Season not found" });

    const { _count, competitions, matches, ...data } = season;
    const activity = typeof prisma.auditLog?.findMany === "function"
      ? await prisma.auditLog.findMany({
        where: { entity_type: "SEASON", entity_id: seasonId },
        select: { audit_id: true, action: true, details: true, created_at: true, actor: { select: { user_id: true, name: true } } },
        orderBy: { created_at: "desc" },
        take: 50,
      })
      : [];
    const registeredTeamIds = new Set();
    const competitionData = competitions.map(({ _count: counts = { registrations: 0, matches: 0 }, registrations = [], ...competition }) => {
      registrations.forEach(({ team_id }) => registeredTeamIds.add(team_id));
      return {
      ...competition,
      approved_team_count: counts.registrations,
      match_count: counts.matches,
      standings: competition.standings || [],
      };
    });
    const completedMatchCount = matches.filter((match) => match.status === "COMPLETED").length;

    return res.json({
      success: true,
      data: {
        ...data,
        competitions: competitionData,
        matches,
        competition_count: _count.competitions,
        match_count: _count.matches,
        completed_match_count: completedMatchCount,
        registered_team_count: registeredTeamIds.size,
        activity,
        match_status_summary: matches.reduce((summary, match) => {
          summary[match.status] = (summary[match.status] || 0) + 1;
          return summary;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};
