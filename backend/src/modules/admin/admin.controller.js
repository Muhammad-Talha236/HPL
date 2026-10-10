import prisma from "../../database/prisma.js";

const TEAM_STATUS_COLORS = {
  ACTIVE: "#078b50",
  INACTIVE: "#f4b326",
};

const startOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const asLabel = (value) => value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const percentageChange = (current, previous) => {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
};

const getRequestedYear = (value) => {
  if (value === undefined) return new Date().getUTCFullYear();
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
};

const matchSelect = {
  match_id: true,
  match_date: true,
  start_time: true,
  status: true,
  home_score: true,
  away_score: true,
  home_team: { select: { team_id: true, name: true, logo: true } },
  away_team: { select: { team_id: true, name: true, logo: true } },
  competition: { select: { competition_id: true, name: true } },
  venue: { select: { venue_id: true, name: true } },
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const year = getRequestedYear(req.query.year);
    if (year === null) return res.status(400).json({ success: false, message: "Year must be between 2000 and 2100" });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const previousMonthStart = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1));
    const nextMonthStart = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));

    const [
      totalUsers,
      totalTeams,
      totalPlayers,
      activeSeasons,
      teamStatusGroups,
      createdUsers,
      recentUsers,
      recentTeamRegistrations,
      recentMatches,
      currentMonthUsers,
      previousMonthUsers,
      currentMonthTeams,
      previousMonthTeams,
      currentMonthPlayers,
      previousMonthPlayers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.player.count(),
      prisma.season.count({ where: { status: "ACTIVE" } }),
      prisma.team.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.user.findMany({ where: { created_at: { gte: yearStart, lt: nextYearStart } }, select: { created_at: true } }),
      prisma.user.findMany({
        select: { user_id: true, name: true, email: true, role: true, status: true, profile_image: true, created_at: true },
        orderBy: [{ created_at: "desc" }, { user_id: "desc" }],
        take: 6,
      }),
      prisma.competitionRegistration.findMany({
        select: {
          registration_id: true,
          registration_status: true,
          registration_date: true,
          team: { select: { team_id: true, name: true, logo: true } },
          competition: { select: { competition_id: true, name: true } },
          registered_user: { select: { user_id: true, name: true } },
        },
        orderBy: [{ registration_date: "desc" }, { registration_id: "desc" }],
        take: 6,
      }),
      prisma.match.findMany({ select: matchSelect, orderBy: [{ match_date: "desc" }, { start_time: "desc" }, { match_id: "desc" }], take: 6 }),
      prisma.user.count({ where: { created_at: { gte: monthStart, lt: nextMonthStart } } }),
      prisma.user.count({ where: { created_at: { gte: previousMonthStart, lt: monthStart } } }),
      prisma.team.count({ where: { created_at: { gte: monthStart, lt: nextMonthStart } } }),
      prisma.team.count({ where: { created_at: { gte: previousMonthStart, lt: monthStart } } }),
      prisma.player.count({ where: { created_at: { gte: monthStart, lt: nextMonthStart } } }),
      prisma.player.count({ where: { created_at: { gte: previousMonthStart, lt: monthStart } } }),
    ]);

    const monthlyUsers = Array.from({ length: 12 }, (_, month) => ({
      month: month + 1,
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1))),
      count: 0,
    }));
    for (const user of createdUsers) {
      const createdAt = new Date(user.created_at);
      const month = createdAt.getUTCMonth();
      if (createdAt.getUTCFullYear() === year) monthlyUsers[month].count += 1;
    }

    return res.json({
      success: true,
      data: {
        summary: {
          users: { total: totalUsers, monthly_growth: percentageChange(currentMonthUsers, previousMonthUsers) },
          teams: { total: totalTeams, monthly_growth: percentageChange(currentMonthTeams, previousMonthTeams) },
          players: { total: totalPlayers, monthly_growth: percentageChange(currentMonthPlayers, previousMonthPlayers) },
          active_seasons: { total: activeSeasons, monthly_growth: null },
        },
        user_registration_trend: { year, months: monthlyUsers },
        team_statuses: teamStatusGroups.map((group) => ({
          status: group.status,
          label: asLabel(group.status),
          count: group._count._all,
          color: TEAM_STATUS_COLORS[group.status] || "#64748b",
        })),
        recent_users: recentUsers,
        recent_team_registrations: recentTeamRegistrations,
        recent_matches: recentMatches,
      },
    });
  } catch (error) {
    next(error);
  }
};
