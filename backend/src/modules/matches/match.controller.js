import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// MATCH STATUS
// ======================================================

const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  POSTPONED: "POSTPONED",
};

// ======================================================
// DATE HELPERS
// ======================================================

// Convert database DateTime to YYYY-MM-DD
const formatDateOnly = (date) => {
  const year = date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Get today's date in YYYY-MM-DD format
const getTodayDateOnly = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ======================================================
// TIME HELPER
// ======================================================

// Convert HH:MM into a Date object
// Prisma uses Date for @db.Time fields.
const parseTimeToDate = (time) => {
  const [hours, minutes] =
    time.split(":").map(Number);

  const date = new Date(
    1970,
    0,
    1,
    0,
    0,
    0,
    0
  );

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date;
};

// ======================================================
// CREATE MATCH
// ======================================================

export const createMatch = async (
  req,
  res
) => {
  try {
    const {
      competition_id,
      season_id,
      home_team_id,
      away_team_id,
      venue_id,
      referee_id,
      match_date,
      start_time,
      match_notes,
    } = req.body;

    const competitionId =
      Number(competition_id);

    const seasonId =
      Number(season_id);

    const homeTeamId =
      Number(home_team_id);

    const awayTeamId =
      Number(away_team_id);

    const venueId =
      Number(venue_id);

    const refereeId =
      Number(referee_id);

    // ==================================================
    // 1. CHECK COMPETITION
    // ==================================================

    const competition =
      await prisma.competition.findUnique({
        where: {
          competition_id:
            competitionId,
        },
      });

    if (!competition) {
      return res.status(404).json({
        success: false,
        message:
          "Competition not found",
      });
    }

    if (
      competition.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition is not active",
      });
    }

    // ==================================================
    // 2. CHECK SEASON
    // ==================================================

    const season =
      await prisma.season.findUnique({
        where: {
          season_id: seasonId,
        },
      });

    if (!season) {
      return res.status(404).json({
        success: false,
        message:
          "Season not found",
      });
    }

    if (
      season.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Season is not active",
      });
    }

    // ==================================================
    // 3. COMPETITION MUST BELONG TO SEASON
    // ==================================================

    if (
      competition.season_id !==
      seasonId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition does not belong to the selected season",
      });
    }

    // ==================================================
    // 4. CHECK MATCH DATE
    // ==================================================

    const matchDateObject =
      new Date(match_date);

    if (
      Number.isNaN(
        matchDateObject.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid match date",
      });
    }

    const matchDateOnly =
      formatDateOnly(
        matchDateObject
      );

    // ==================================================
    // 5. MATCH DATE MUST BE WITHIN SEASON
    // ==================================================

    const seasonStart =
      formatDateOnly(
        season.start_date
      );

    const seasonEnd =
      formatDateOnly(
        season.end_date
      );

    if (
      matchDateOnly < seasonStart ||
      matchDateOnly > seasonEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match date must be within the season dates",
      });
    }

    // ==================================================
    // 6. MATCH DATE MUST BE WITHIN COMPETITION
    // ==================================================

    const competitionStart =
      formatDateOnly(
        competition.competition_start_date
      );

    const competitionEnd =
      formatDateOnly(
        competition.competition_end_date
      );

    if (
      matchDateOnly <
        competitionStart ||
      matchDateOnly >
        competitionEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match date must be within the competition dates",
      });
    }

    // ==================================================
    // 7. CHECK HOME TEAM
    // ==================================================

    const homeTeam =
      await prisma.team.findUnique({
        where: {
          team_id: homeTeamId,
        },
      });

    if (!homeTeam) {
      return res.status(404).json({
        success: false,
        message:
          "Home team not found",
      });
    }

    if (
      homeTeam.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team is not active",
      });
    }

    // ==================================================
    // 8. CHECK AWAY TEAM
    // ==================================================

    const awayTeam =
      await prisma.team.findUnique({
        where: {
          team_id: awayTeamId,
        },
      });

    if (!awayTeam) {
      return res.status(404).json({
        success: false,
        message:
          "Away team not found",
      });
    }

    if (
      awayTeam.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team is not active",
      });
    }

    // ==================================================
    // 9. HOME AND AWAY TEAM CANNOT BE SAME
    // ==================================================

    if (
      homeTeamId === awayTeamId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team and away team cannot be the same",
      });
    }

    // ==================================================
    // 10. TEAM GENDER MUST MATCH COMPETITION
    // ==================================================

    if (
      homeTeam.gender !==
      competition.gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team gender does not match the competition",
      });
    }

    if (
      awayTeam.gender !==
      competition.gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team gender does not match the competition",
      });
    }

    // ==================================================
    // 11. CHECK TEAM REGISTRATIONS
    // ==================================================

    const homeRegistration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            competition_id_team_id: {
              competition_id:
                competitionId,
              team_id:
                homeTeamId,
            },
          },
        }
      );

    if (
      !homeRegistration ||
      homeRegistration.registration_status !==
        "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team is not approved for this competition",
      });
    }

    const awayRegistration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            competition_id_team_id: {
              competition_id:
                competitionId,
              team_id:
                awayTeamId,
            },
          },
        }
      );

    if (
      !awayRegistration ||
      awayRegistration.registration_status !==
        "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team is not approved for this competition",
      });
    }

    // ==================================================
    // 12. CHECK VENUE
    // ==================================================

    const venue =
      await prisma.venue.findUnique({
        where: {
          venue_id: venueId,
        },
      });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message:
          "Venue not found",
      });
    }

    if (
      venue.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Venue is not active",
      });
    }

    // ==================================================
    // 13. CHECK REFEREE
    // ==================================================

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message:
          "Referee not found",
      });
    }

    if (
      referee.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee is not active",
      });
    }

    // ==================================================
    // 14. CHECK TEAM SCHEDULE CONFLICTS
    // ==================================================

    const teamConflict =
      await prisma.match.findFirst({
        where: {
          match_date:
            matchDateObject,
          status: {
            not: MATCH_STATUS.CANCELLED,
          },
          OR: [
            {
              home_team_id:
                homeTeamId,
            },
            {
              away_team_id:
                homeTeamId,
            },
            {
              home_team_id:
                awayTeamId,
            },
            {
              away_team_id:
                awayTeamId,
            },
          ],
        },
      });

    if (teamConflict) {
      return res.status(409).json({
        success: false,
        message:
          "One of the teams already has a match scheduled on this date",
      });
    }

    // ==================================================
    // 15. CONVERT START TIME
    // ==================================================

    const startTimeObject =
      parseTimeToDate(start_time);

    // ==================================================
    // 16. VENUE CONFLICT
    // ==================================================

    const venueConflict =
      await prisma.match.findFirst({
        where: {
          venue_id: venueId,
          match_date:
            matchDateObject,
          start_time:
            startTimeObject,
          status: {
            not: MATCH_STATUS.CANCELLED,
          },
        },
      });

    if (venueConflict) {
      return res.status(409).json({
        success: false,
        message:
          "Venue is already booked for this date and time",
      });
    }

    // ==================================================
    // 17. REFEREE CONFLICT
    // ==================================================

    const refereeConflict =
      await prisma.match.findFirst({
        where: {
          referee_id: refereeId,
          match_date:
            matchDateObject,
          start_time:
            startTimeObject,
          status: {
            not: MATCH_STATUS.CANCELLED,
          },
        },
      });

    if (refereeConflict) {
      return res.status(409).json({
        success: false,
        message:
          "Referee is already assigned to another match at this date and time",
      });
    }

    // ==================================================
    // 18. CREATE MATCH
    // ==================================================

    const match =
      await prisma.match.create({
        data: {
          competition_id:
            competitionId,

          season_id:
            seasonId,

          home_team_id:
            homeTeamId,

          away_team_id:
            awayTeamId,

          venue_id:
            venueId,

          referee_id:
            refereeId,

          match_date:
            matchDateObject,

          start_time:
            startTimeObject,

          status:
            MATCH_STATUS.SCHEDULED,

          home_score: 0,

          away_score: 0,

          match_notes:
            match_notes?.trim() ||
            null,
        },
      });

    // ==================================================
    // 19. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_CREATED,

      entity_type: "MATCH",

      entity_id:
        match.match_id,

      details: {
        competition_id:
          competitionId,

        season_id:
          seasonId,

        home_team_id:
          homeTeamId,

        away_team_id:
          awayTeamId,

        venue_id:
          venueId,

        referee_id:
          refereeId,

        match_date:
          matchDateOnly,

        start_time,
      },
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message:
        "Match scheduled successfully",
      data: match,
    });

  } catch (error) {
    console.error(
      "Create match error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while scheduling the match",
    });
  }
};

export const getMatches = async (
  req,
  res
) => {
  try {
    const matches =
      await prisma.match.findMany({
        include: {
          competition: {
            select: {
              competition_id: true,
              name: true,
              gender: true,
            },
          },

          season: {
            select: {
              season_id: true,
              name: true,
            },
          },

          home_team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
              gender: true,
            },
          },

          away_team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
              gender: true,
            },
          },

          venue: {
            select: {
              venue_id: true,
              name: true,
              city: true,
            },
          },

          referee: {
            select: {
              referee_id: true,
              name: true,
            },
          },
        },

        orderBy: [
          {
            match_date: "asc",
          },
          {
            start_time: "asc",
          },
        ],
      });

    return res.status(200).json({
      success: true,
      data: matches,
    });

  } catch (error) {
    console.error(
      "Get matches error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching matches",
    });
  }
};

// ======================================================
// GET MATCH BY ID
// ======================================================

export const getMatchById = async (
  req,
  res
) => {
  try {
    const matchId = Number(
      req.params.match_id
    );

    const match =
      await prisma.match.findUnique({
        where: {
          match_id: matchId,
        },

        include: {
          competition: {
            select: {
              competition_id: true,
              name: true,
              gender: true,
            },
          },

          season: {
            select: {
              season_id: true,
              name: true,
            },
          },

          home_team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
              gender: true,
            },
          },

          away_team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
              gender: true,
            },
          },

          venue: {
            select: {
              venue_id: true,
              name: true,
              city: true,
            },
          },

          referee: {
            select: {
              referee_id: true,
              name: true,
            },
          },

          events: {
            orderBy: {
              minute: "asc",
            },
          },

          players: true,
        },
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: match,
    });

  } catch (error) {
    console.error(
      "Get match error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the match",
    });
  }
};

export const updateMatch = async (
  req,
  res
) => {
  try {
    const matchId = Number(
      req.params.match_id
    );

    const {
      home_team_id,
      away_team_id,
      venue_id,
      referee_id,
      match_date,
      start_time,
      match_notes,
    } = req.body;

    // ==================================================
    // 1. FIND MATCH
    // ==================================================

    const existingMatch =
      await prisma.match.findUnique({
        where: {
          match_id: matchId,
        },
      });

    if (!existingMatch) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // ==================================================
    // 2. COMPLETED / CANCELLED MATCH CANNOT BE EDITED
    // ==================================================

    if (
      existingMatch.status ===
        MATCH_STATUS.COMPLETED ||
      existingMatch.status ===
        MATCH_STATUS.CANCELLED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Completed or cancelled matches cannot be updated",
      });
    }

    // ==================================================
    // 3. DETERMINE FINAL VALUES
    // ==================================================

    const finalHomeTeamId =
      home_team_id !== undefined
        ? Number(home_team_id)
        : existingMatch.home_team_id;

    const finalAwayTeamId =
      away_team_id !== undefined
        ? Number(away_team_id)
        : existingMatch.away_team_id;

    const finalVenueId =
      venue_id !== undefined
        ? Number(venue_id)
        : existingMatch.venue_id;

    const finalRefereeId =
      referee_id !== undefined
        ? Number(referee_id)
        : existingMatch.referee_id;

    const finalMatchDate =
      match_date !== undefined
        ? new Date(match_date)
        : existingMatch.match_date;

    const finalStartTime =
      start_time !== undefined
        ? parseTimeToDate(start_time)
        : existingMatch.start_time;

    // ==================================================
    // 4. HOME/AWAY TEAM CHECK
    // ==================================================

    if (
      finalHomeTeamId ===
      finalAwayTeamId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team and away team cannot be the same",
      });
    }

    // ==================================================
    // 5. CHECK DATE
    // ==================================================

    if (
      Number.isNaN(
        finalMatchDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid match date",
      });
    }

    // ==================================================
    // 6. GET COMPETITION + SEASON
    // ==================================================

    const competition =
      await prisma.competition.findUnique({
        where: {
          competition_id:
            existingMatch.competition_id,
        },
      });

    if (!competition) {
      return res.status(404).json({
        success: false,
        message:
          "Competition not found",
      });
    }

    const season =
      await prisma.season.findUnique({
        where: {
          season_id:
            existingMatch.season_id,
        },
      });

    if (!season) {
      return res.status(404).json({
        success: false,
        message:
          "Season not found",
      });
    }

    // ==================================================
    // 7. DATE MUST REMAIN WITHIN COMPETITION
    // ==================================================

    const finalDateOnly =
      formatDateOnly(
        finalMatchDate
      );

    const competitionStart =
      formatDateOnly(
        competition.competition_start_date
      );

    const competitionEnd =
      formatDateOnly(
        competition.competition_end_date
      );

    if (
      finalDateOnly <
        competitionStart ||
      finalDateOnly >
        competitionEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match date must be within the competition dates",
      });
    }

    // ==================================================
    // 8. DATE MUST REMAIN WITHIN SEASON
    // ==================================================

    const seasonStart =
      formatDateOnly(
        season.start_date
      );

    const seasonEnd =
      formatDateOnly(
        season.end_date
      );

    if (
      finalDateOnly <
        seasonStart ||
      finalDateOnly >
        seasonEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match date must be within the season dates",
      });
    }

    // ==================================================
    // 9. CHECK HOME TEAM
    // ==================================================

    const homeTeam =
      await prisma.team.findUnique({
        where: {
          team_id:
            finalHomeTeamId,
        },
      });

    if (!homeTeam) {
      return res.status(404).json({
        success: false,
        message:
          "Home team not found",
      });
    }

    if (
      homeTeam.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team is not active",
      });
    }

    // ==================================================
    // 10. CHECK AWAY TEAM
    // ==================================================

    const awayTeam =
      await prisma.team.findUnique({
        where: {
          team_id:
            finalAwayTeamId,
        },
      });

    if (!awayTeam) {
      return res.status(404).json({
        success: false,
        message:
          "Away team not found",
      });
    }

    if (
      awayTeam.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team is not active",
      });
    }

    // ==================================================
    // 11. TEAM GENDER CHECK
    // ==================================================

    if (
      homeTeam.gender !==
      competition.gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team gender does not match the competition",
      });
    }

    if (
      awayTeam.gender !==
      competition.gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team gender does not match the competition",
      });
    }

    // ==================================================
    // 12. CHECK TEAM REGISTRATIONS
    // ==================================================

    const homeRegistration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            competition_id_team_id: {
              competition_id:
                existingMatch.competition_id,
              team_id:
                finalHomeTeamId,
            },
          },
        }
      );

    if (
      !homeRegistration ||
      homeRegistration.registration_status !==
        "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team is not approved for this competition",
      });
    }

    const awayRegistration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            competition_id_team_id: {
              competition_id:
                existingMatch.competition_id,
              team_id:
                finalAwayTeamId,
            },
          },
        }
      );

    if (
      !awayRegistration ||
      awayRegistration.registration_status !==
        "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team is not approved for this competition",
      });
    }

    // ==================================================
    // 13. CHECK VENUE
    // ==================================================

    const venue =
      await prisma.venue.findUnique({
        where: {
          venue_id:
            finalVenueId,
        },
      });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message:
          "Venue not found",
      });
    }

    if (
      venue.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Venue is not active",
      });
    }

    // ==================================================
    // 14. CHECK REFEREE
    // ==================================================

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id:
            finalRefereeId,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message:
          "Referee not found",
      });
    }

    if (
      referee.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee is not active",
      });
    }

    // ==================================================
    // 15. TEAM DATE CONFLICT
    // ==================================================

    const teamConflict =
      await prisma.match.findFirst({
        where: {
          match_id: {
            not: matchId,
          },

          match_date:
            finalMatchDate,

          status: {
            not: MATCH_STATUS.CANCELLED,
          },

          OR: [
            {
              home_team_id:
                finalHomeTeamId,
            },
            {
              away_team_id:
                finalHomeTeamId,
            },
            {
              home_team_id:
                finalAwayTeamId,
            },
            {
              away_team_id:
                finalAwayTeamId,
            },
          ],
        },
      });

    if (teamConflict) {
      return res.status(409).json({
        success: false,
        message:
          "One of the teams already has a match scheduled on this date",
      });
    }

    // ==================================================
    // 16. VENUE TIME CONFLICT
    // ==================================================

    const venueConflict =
      await prisma.match.findFirst({
        where: {
          match_id: {
            not: matchId,
          },

          venue_id:
            finalVenueId,

          match_date:
            finalMatchDate,

          start_time:
            finalStartTime,

          status: {
            not: MATCH_STATUS.CANCELLED,
          },
        },
      });

    if (venueConflict) {
      return res.status(409).json({
        success: false,
        message:
          "Venue is already booked for this date and time",
      });
    }

    // ==================================================
    // 17. REFEREE TIME CONFLICT
    // ==================================================

    const refereeConflict =
      await prisma.match.findFirst({
        where: {
          match_id: {
            not: matchId,
          },

          referee_id:
            finalRefereeId,

          match_date:
            finalMatchDate,

          start_time:
            finalStartTime,

          status: {
            not: MATCH_STATUS.CANCELLED,
          },
        },
      });

    if (refereeConflict) {
      return res.status(409).json({
        success: false,
        message:
          "Referee is already assigned to another match at this date and time",
      });
    }

    // ==================================================
    // 18. BUILD UPDATE DATA
    // ==================================================

    const updateData = {};

    if (
      home_team_id !== undefined
    ) {
      updateData.home_team_id =
        finalHomeTeamId;
    }

    if (
      away_team_id !== undefined
    ) {
      updateData.away_team_id =
        finalAwayTeamId;
    }

    if (
      venue_id !== undefined
    ) {
      updateData.venue_id =
        finalVenueId;
    }

    if (
      referee_id !== undefined
    ) {
      updateData.referee_id =
        finalRefereeId;
    }

    if (
      match_date !== undefined
    ) {
      updateData.match_date =
        finalMatchDate;
    }

    if (
      start_time !== undefined
    ) {
      updateData.start_time =
        finalStartTime;
    }

    if (
      match_notes !== undefined
    ) {
      updateData.match_notes =
        match_notes?.trim() || null;
    }

    // ==================================================
    // 19. UPDATE MATCH
    // ==================================================

    const updatedMatch =
      await prisma.match.update({
        where: {
          match_id: matchId,
        },

        data: updateData,
      });

    // ==================================================
    // 20. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_UPDATED,

      entity_type: "MATCH",

      entity_id:
        matchId,

      details: {
        updated_fields:
          Object.keys(updateData),
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Match updated successfully",
      data: updatedMatch,
    });

  } catch (error) {
    console.error(
      "Update match error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the match",
    });
  }
};

// ======================================================
// CANCEL MATCH
// ======================================================

export const cancelMatch = async (
  req,
  res
) => {
  try {
    const matchId = Number(
      req.params.match_id
    );

    const match =
      await prisma.match.findUnique({
        where: {
          match_id: matchId,
        },
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (
      match.status ===
      MATCH_STATUS.COMPLETED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Completed match cannot be cancelled",
      });
    }

    if (
      match.status ===
      MATCH_STATUS.CANCELLED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match is already cancelled",
      });
    }

    const updatedMatch =
      await prisma.match.update({
        where: {
          match_id: matchId,
        },

        data: {
          status:
            MATCH_STATUS.CANCELLED,
        },
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_CANCELLED,

      entity_type: "MATCH",

      entity_id:
        matchId,

      details: {
        previous_status:
          match.status,

        new_status:
          MATCH_STATUS.CANCELLED,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Match cancelled successfully",
      data: updatedMatch,
    });

  } catch (error) {
    console.error(
      "Cancel match error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while cancelling the match",
    });
  }
};

// ======================================================
// COMPLETE MATCH
// ======================================================

export const completeMatch = async (
  req,
  res
) => {
  try {
    const matchId = Number(
      req.params.match_id
    );

    const match =
      await prisma.match.findUnique({
        where: {
          match_id: matchId,
        },
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (
      match.status ===
      MATCH_STATUS.CANCELLED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled match cannot be completed",
      });
    }

    if (
      match.status ===
      MATCH_STATUS.COMPLETED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match is already completed",
      });
    }

    const updatedMatch =
      await prisma.match.update({
        where: {
          match_id: matchId,
        },

        data: {
          status:
            MATCH_STATUS.COMPLETED,
        },
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_COMPLETED,

      entity_type: "MATCH",

      entity_id:
        matchId,

      details: {
        previous_status:
          match.status,

        new_status:
          MATCH_STATUS.COMPLETED,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Match completed successfully",
      data: updatedMatch,
    });

  } catch (error) {
    console.error(
      "Complete match error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while completing the match",
    });
  }
};