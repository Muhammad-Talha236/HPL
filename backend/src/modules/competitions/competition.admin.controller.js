import prisma from "../../database/prisma.js";

const base = {
  competition_id: true,
  name: true,
  gender: true,
  format: true,
  status: true,
  competition_start_date: true,
  competition_end_date: true,
  registration_start_date: true,
  registration_end_date: true,
  max_teams: true,
  created_at: true,
  updated_at: true,
  season: { select: { season_id: true, name: true, status: true } },
  _count: {
    select: {
      matches: true,
      registrations: { where: { registration_status: "APPROVED" } },
    },
  },
};

const queryWhere = (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const seasonId = query.season_id === undefined ? undefined : Number(query.season_id);
  const { status, gender } = query;

  if (
    !Number.isInteger(page) || page < 1 ||
    !Number.isInteger(limit) || limit < 1 || limit > 50 ||
    q.length > 100 ||
    (status && !["ACTIVE", "INACTIVE"].includes(status)) ||
    (gender && !["MEN", "WOMEN"].includes(gender)) ||
    (seasonId !== undefined && (!Number.isInteger(seasonId) || seasonId < 1))
  ) return null;

  return {
    page,
    limit,
    where: {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
      ...(gender ? { gender } : {}),
      ...(seasonId ? { season_id: seasonId } : {}),
    },
  };
};

export const getAdminCompetitions = async (req, res, next) => {
  try {
    const parsed = queryWhere(req.query);
    if (!parsed) return res.status(400).json({ success: false, message: "Invalid competition query" });
    const { page, limit, where } = parsed;
    const now = new Date();
    const [rows, total, open, ongoing, completed] = await Promise.all([
      prisma.competition.findMany({
        where,
        select: base,
        orderBy: [{ competition_start_date: "desc" }, { competition_id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.competition.count({ where }),
      prisma.competition.count({
        where: {
          ...where,
          status: "ACTIVE",
          registration_start_date: { lte: now },
          registration_end_date: { gte: now },
        },
      }),
      prisma.competition.count({
        where: { ...where, status: "ACTIVE", competition_start_date: { lte: now }, competition_end_date: { gte: now } },
      }),
      prisma.competition.count({ where: { ...where, competition_end_date: { lt: now } } }),
    ]);
    return res.json({
      success: true,
      data: rows.map(({ _count, ...row }) => ({ ...row, approved_team_count: _count.registrations, match_count: _count.matches })),
      summary: { total, open_for_registration: open, ongoing, completed },
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminCompetitionById = async (req, res, next) => {
  try {
    const id = Number(req.params.competition_id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: "Competition ID must be a positive integer" });
    const competition = await prisma.competition.findUnique({
      where: { competition_id: id },
      select: {
        ...base,
        description: true,
        registration_fee: true,
        squad_size: true,
        eligibility_rules: true,
        refund_policy: true,
        registrations: {
          select: {
            registration_id: true,
            registration_status: true,
            payment_status: true,
            registration_date: true,
            team: { select: { team_id: true, name: true, gender: true, club: { select: { name: true } } } },
          },
          orderBy: { registration_date: "desc" },
        },
        matches: {
          select: {
            match_id: true,
            match_date: true,
            status: true,
            home_score: true,
            away_score: true,
            home_team: { select: { team_id: true, name: true } },
            away_team: { select: { team_id: true, name: true } },
            venue: { select: { venue_id: true, name: true } },
          },
          orderBy: [{ match_date: "desc" }, { match_id: "desc" }],
        },
        standings: {
          select: {
            position: true, played: true, wins: true, draws: true, losses: true,
            goals_for: true, goals_against: true, goal_difference: true, points: true,
            team: { select: { team_id: true, name: true } },
          },
          orderBy: { position: "asc" },
        },
      },
    });
    if (!competition) return res.status(404).json({ success: false, message: "Competition not found" });
    const activity = typeof prisma.auditLog?.findMany === "function"
      ? await prisma.auditLog.findMany({
        where: { entity_type: "COMPETITION", entity_id: id },
        select: { audit_id: true, action: true, details: true, created_at: true, actor: { select: { user_id: true, name: true } } },
        orderBy: { created_at: "desc" },
        take: 50,
      })
      : [];
    const approvedTeamCount = competition.registrations.filter((item) => item.registration_status === "APPROVED").length;
    const completedMatchCount = competition.matches.filter((match) => match.status === "COMPLETED").length;
    return res.json({
      success: true,
      data: {
        ...competition,
        approved_team_count: approvedTeamCount,
        match_count: competition.matches.length,
        completed_match_count: completedMatchCount,
        registration_counts: competition.registrations.reduce((result, item) => {
          result[item.registration_status] = (result[item.registration_status] || 0) + 1;
          return result;
        }, {}),
        activity,
      },
    });
  } catch (error) {
    next(error);
  }
};
