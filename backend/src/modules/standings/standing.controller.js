import prisma from "../../database/prisma.js";

/*
  Safe fields returned to clients.
*/
const standingSelect = {
  standing_id: true,
  competition_id: true,
  team_id: true,
  played: true,
  wins: true,
  draws: true,
  losses: true,
  goals_for: true,
  goals_against: true,
  goal_difference: true,
  points: true,
  position: true,
  updated_at: true,

  competition: {
    select: {
      competition_id: true,
      name: true,
    },
  },

  team: {
    select: {
      team_id: true,
      name: true,
      logo: true,
    },
  },
};

/*
  GET STANDINGS FOR A COMPETITION

  Public endpoint.

  Only standings belonging to the requested
  competition are returned.

  Sorting follows standard league-table logic:

  1. Position, when available
  2. Points
  3. Goal difference
  4. Goals scored
*/
export const getStandings = async (req, res, next) => {
  try {
    const competitionId = Number(
      req.params.competition_id
    );

    const standings = await prisma.teamStanding.findMany({
      where: {
        competition_id: competitionId,
      },
      select: standingSelect,
      orderBy: [
        {
          position: "asc",
        },
        {
          points: "desc",
        },
        {
          goal_difference: "desc",
        },
        {
          goals_for: "desc",
        },
        {
          team_id: "asc",
        },
      ],
      take: 100,
    });

    const teamIds = standings.map((standing) => standing.team_id);
    const formByTeam = new Map(
      teamIds.map((teamId) => [teamId, []])
    );

    if (teamIds.length) {
      const matches = await prisma.match.findMany({
        where: {
          competition_id: competitionId,
          status: "COMPLETED",
          OR: [
            { home_team_id: { in: teamIds } },
            { away_team_id: { in: teamIds } },
          ],
        },
        select: {
          home_team_id: true,
          away_team_id: true,
          home_score: true,
          away_score: true,
        },
        orderBy: [
          { match_date: "desc" },
          { match_id: "desc" },
        ],
        take: 500,
      });

      const addResult = (teamId, scored, conceded) => {
        const form = formByTeam.get(teamId);
        if (!form || form.length >= 5) return;
        form.push(scored > conceded ? "W" : scored < conceded ? "L" : "D");
      };

      for (const match of matches) {
        addResult(match.home_team_id, match.home_score, match.away_score);
        addResult(match.away_team_id, match.away_score, match.home_score);
      }
    }

    return res.status(200).json({
      success: true,
      count: standings.length,
      data: standings.map((standing) => ({
        ...standing,
        form: formByTeam.get(standing.team_id) || [],
      })),
    });
  } catch (error) {
    console.error("Get standings error:", error);
    next(error);
  }
};

/*
  GET SINGLE STANDING

  Public endpoint.

  A standing must belong to the requested
  competition.

  This prevents returning an unrelated
  standing through a manipulated ID.
*/
export const getStandingById = async (
  req,
  res,
  next
) => {
  try {
    const standingId = Number(
      req.params.standing_id
    );

    const standing =
      await prisma.teamStanding.findUnique({
        where: {
          standing_id: standingId,
        },
        select: standingSelect,
      });

    if (!standing) {
      return res.status(404).json({
        success: false,
        message: "Standing not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: standing,
    });
  } catch (error) {
    console.error(
      "Get standing by ID error:",
      error
    );

    next(error);
  }
};
