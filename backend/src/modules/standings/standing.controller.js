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
    });

    return res.status(200).json({
      success: true,
      count: standings.length,
      data: standings,
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