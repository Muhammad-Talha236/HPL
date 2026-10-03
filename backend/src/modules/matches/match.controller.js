import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { recalculateCompetitionStandings } from "../standings/standing.util.js";
import { recalculateTeamRankings } from "../rankings/ranking.service.js";

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

export const createMatch = async (req, res) => {
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

    // ==================================================
    // 1. CONVERT IDS
    // ==================================================

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
    // 2. BASIC ID VALIDATION
    // ==================================================

    if (
      !Number.isInteger(
        competitionId
      ) ||
      competitionId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid competition ID",
      });
    }

    if (
      !Number.isInteger(
        seasonId
      ) ||
      seasonId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid season ID",
      });
    }

    if (
      !Number.isInteger(
        homeTeamId
      ) ||
      homeTeamId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid home team ID",
      });
    }

    if (
      !Number.isInteger(
        awayTeamId
      ) ||
      awayTeamId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid away team ID",
      });
    }

    if (
      !Number.isInteger(
        venueId
      ) ||
      venueId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid venue ID",
      });
    }

    if (
      !Number.isInteger(
        refereeId
      ) ||
      refereeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid referee ID",
      });
    }

    // ==================================================
    // 3. HOME / AWAY TEAM CHECK
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

    /*
     * Match uses @db.Date.
     *
     * Normalize the supplied date so that
     * conflict checks compare only the date,
     * not an accidental time component.
     */
    const matchDateOnly =
      formatDateOnly(
        matchDateObject
      );

    const normalizedMatchDate =
      new Date(
        `${matchDateOnly}T00:00:00.000Z`
      );

    // ==================================================
    // 5. PARSE START TIME
    // ==================================================

    const startTimeObject =
      parseTimeToDate(start_time);

    /*
     * parseTimeToDate() must produce a valid
     * Date object.
     */
    if (
      !(startTimeObject instanceof Date) ||
      Number.isNaN(
        startTimeObject.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid match start time",
      });
    }

    // ==================================================
    // 6. SERIALIZABLE TRANSACTION
    // ==================================================
    /*
     * All important checks and the final create
     * happen inside the same transaction.
     *
     * Serializable isolation protects against
     * concurrent requests attempting to create
     * conflicting matches at the same time.
     */

    const match =
      await prisma.$transaction(
        async (tx) => {
          // ==================================================
          // 7. CHECK COMPETITION
          // ==================================================

          const competition =
            await tx.competition.findUnique({
              where: {
                competition_id:
                  competitionId,
              },

              select: {
                competition_id: true,
                season_id: true,
                gender: true,
                status: true,
                competition_start_date:
                  true,
                competition_end_date:
                  true,
              },
            });

          if (!competition) {
            throw new Error(
              "COMPETITION_NOT_FOUND"
            );
          }

          if (
            competition.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "COMPETITION_NOT_ACTIVE"
            );
          }

          // ==================================================
          // 8. CHECK SEASON
          // ==================================================

          const season =
            await tx.season.findUnique({
              where: {
                season_id: seasonId,
              },

              select: {
                season_id: true,
                start_date: true,
                end_date: true,
                status: true,
              },
            });

          if (!season) {
            throw new Error(
              "SEASON_NOT_FOUND"
            );
          }

          if (
            season.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "SEASON_NOT_ACTIVE"
            );
          }

          // ==================================================
          // 9. COMPETITION MUST BELONG TO SEASON
          // ==================================================

          if (
            competition.season_id !==
            seasonId
          ) {
            throw new Error(
              "COMPETITION_SEASON_MISMATCH"
            );
          }

          // ==================================================
          // 10. MATCH DATE WITHIN SEASON
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
            matchDateOnly <
              seasonStart ||
            matchDateOnly >
              seasonEnd
          ) {
            throw new Error(
              "MATCH_DATE_OUTSIDE_SEASON"
            );
          }

          // ==================================================
          // 11. MATCH DATE WITHIN COMPETITION
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
            throw new Error(
              "MATCH_DATE_OUTSIDE_COMPETITION"
            );
          }

          // ==================================================
          // 12. CHECK HOME TEAM
          // ==================================================

          const homeTeam =
            await tx.team.findUnique({
              where: {
                team_id:
                  homeTeamId,
              },

              select: {
                team_id: true,
                gender: true,
                status: true,
              },
            });

          if (!homeTeam) {
            throw new Error(
              "HOME_TEAM_NOT_FOUND"
            );
          }

          if (
            homeTeam.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "HOME_TEAM_NOT_ACTIVE"
            );
          }

          // ==================================================
          // 13. CHECK AWAY TEAM
          // ==================================================

          const awayTeam =
            await tx.team.findUnique({
              where: {
                team_id:
                  awayTeamId,
              },

              select: {
                team_id: true,
                gender: true,
                status: true,
              },
            });

          if (!awayTeam) {
            throw new Error(
              "AWAY_TEAM_NOT_FOUND"
            );
          }

          if (
            awayTeam.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "AWAY_TEAM_NOT_ACTIVE"
            );
          }

          // ==================================================
          // 14. TEAM GENDER
          // ==================================================

          if (
            homeTeam.gender !==
            competition.gender
          ) {
            throw new Error(
              "HOME_TEAM_GENDER_MISMATCH"
            );
          }

          if (
            awayTeam.gender !==
            competition.gender
          ) {
            throw new Error(
              "AWAY_TEAM_GENDER_MISMATCH"
            );
          }

          // ==================================================
          // 15. HOME TEAM REGISTRATION
          // ==================================================

          const homeRegistration =
            await tx.competitionRegistration.findUnique(
              {
                where: {
                  competition_id_team_id: {
                    competition_id:
                      competitionId,

                    team_id:
                      homeTeamId,
                  },
                },

                select: {
                  registration_status:
                    true,
                },
              }
            );

          if (
            !homeRegistration ||
            homeRegistration.registration_status !==
              "APPROVED"
          ) {
            throw new Error(
              "HOME_TEAM_NOT_APPROVED"
            );
          }

          // ==================================================
          // 16. AWAY TEAM REGISTRATION
          // ==================================================

          const awayRegistration =
            await tx.competitionRegistration.findUnique(
              {
                where: {
                  competition_id_team_id: {
                    competition_id:
                      competitionId,

                    team_id:
                      awayTeamId,
                  },
                },

                select: {
                  registration_status:
                    true,
                },
              }
            );

          if (
            !awayRegistration ||
            awayRegistration.registration_status !==
              "APPROVED"
          ) {
            throw new Error(
              "AWAY_TEAM_NOT_APPROVED"
            );
          }

          // ==================================================
          // 17. CHECK VENUE
          // ==================================================

          const venue =
            await tx.venue.findUnique({
              where: {
                venue_id:
                  venueId,
              },

              select: {
                venue_id: true,
                status: true,
              },
            });

          if (!venue) {
            throw new Error(
              "VENUE_NOT_FOUND"
            );
          }

          if (
            venue.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "VENUE_NOT_ACTIVE"
            );
          }

          // ==================================================
          // 18. CHECK REFEREE
          // ==================================================

          const referee =
            await tx.referee.findUnique({
              where: {
                referee_id:
                  refereeId,
              },

              select: {
                referee_id: true,
                status: true,
              },
            });

          if (!referee) {
            throw new Error(
              "REFEREE_NOT_FOUND"
            );
          }

          if (
            referee.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "REFEREE_NOT_ACTIVE"
            );
          }

          // ==================================================
          // 19. TEAM SCHEDULE CONFLICT
          // ==================================================

          const teamConflict =
            await tx.match.findFirst({
              where: {
                match_date:
                  normalizedMatchDate,

                status: {
                  not:
                    MATCH_STATUS.CANCELLED,
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

              select: {
                match_id: true,
              },
            });

          if (teamConflict) {
            throw new Error(
              "TEAM_SCHEDULE_CONFLICT"
            );
          }

          // ==================================================
          // 20. VENUE TIME CONFLICT
          // ==================================================

          const venueConflict =
            await tx.match.findFirst({
              where: {
                venue_id:
                  venueId,

                match_date:
                  normalizedMatchDate,

                start_time:
                  startTimeObject,

                status: {
                  not:
                    MATCH_STATUS.CANCELLED,
                },
              },

              select: {
                match_id: true,
              },
            });

          if (venueConflict) {
            throw new Error(
              "VENUE_TIME_CONFLICT"
            );
          }

          // ==================================================
          // 21. REFEREE TIME CONFLICT
          // ==================================================

          const refereeConflict =
            await tx.match.findFirst({
              where: {
                referee_id:
                  refereeId,

                match_date:
                  normalizedMatchDate,

                start_time:
                  startTimeObject,

                status: {
                  not:
                    MATCH_STATUS.CANCELLED,
                },
              },

              select: {
                match_id: true,
              },
            });

          if (refereeConflict) {
            throw new Error(
              "REFEREE_TIME_CONFLICT"
            );
          }

          // ==================================================
          // 22. CREATE MATCH
          // ==================================================

          const createdMatch =
            await tx.match.create({
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
                  normalizedMatchDate,

                start_time:
                  startTimeObject,

                status:
                  MATCH_STATUS.SCHEDULED,

                home_score: 0,

                away_score: 0,

                started_at:
                  null,

                match_notes:
                  match_notes?.trim() ||
                  null,
              },
            });

          return createdMatch;
        },

        {
          /*
           * PostgreSQL isolation level.
           *
           * If two concurrent requests try to create
           * conflicting matches, PostgreSQL can abort
           * one transaction instead of allowing both
           * to pass the conflict checks.
           */
          isolationLevel:
            "Serializable",
        }
      );

    // ==================================================
    // 23. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_CREATED,

      entity_type:
        "MATCH",

      entity_id:
        match.match_id,

      details: {
        competition_id:
          match.competition_id,

        season_id:
          match.season_id,

        home_team_id:
          match.home_team_id,

        away_team_id:
          match.away_team_id,

        venue_id:
          match.venue_id,

        referee_id:
          match.referee_id,

        match_date:
          matchDateOnly,

        start_time:
          start_time,

        status:
          match.status,
      },
    });

    // ==================================================
    // 24. RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Match scheduled successfully",

      data: {
        match,
      },
    });
  } catch (error) {
    // ==================================================
    // EXPECTED ERRORS
    // ==================================================

    if (
      error.message ===
      "COMPETITION_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Competition not found",
      });
    }

    if (
      error.message ===
      "COMPETITION_NOT_ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition is not active",
      });
    }

    if (
      error.message ===
      "SEASON_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Season not found",
      });
    }

    if (
      error.message ===
      "SEASON_NOT_ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Season is not active",
      });
    }

    if (
      error.message ===
      "COMPETITION_SEASON_MISMATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition does not belong to the selected season",
      });
    }

    if (
      error.message ===
      "MATCH_DATE_OUTSIDE_SEASON"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match date must be within the season dates",
      });
    }

    if (
      error.message ===
      "MATCH_DATE_OUTSIDE_COMPETITION"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match date must be within the competition dates",
      });
    }

    if (
      error.message ===
      "HOME_TEAM_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Home team not found",
      });
    }

    if (
      error.message ===
      "HOME_TEAM_NOT_ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team is not active",
      });
    }

    if (
      error.message ===
      "AWAY_TEAM_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Away team not found",
      });
    }

    if (
      error.message ===
      "AWAY_TEAM_NOT_ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team is not active",
      });
    }

    if (
      error.message ===
      "HOME_TEAM_GENDER_MISMATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team gender does not match the competition",
      });
    }

    if (
      error.message ===
      "AWAY_TEAM_GENDER_MISMATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team gender does not match the competition",
      });
    }

    if (
      error.message ===
      "HOME_TEAM_NOT_APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team is not approved for this competition",
      });
    }

    if (
      error.message ===
      "AWAY_TEAM_NOT_APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team is not approved for this competition",
      });
    }

    if (
      error.message ===
      "VENUE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Venue not found",
      });
    }

    if (
      error.message ===
      "VENUE_NOT_ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Venue is not active",
      });
    }

    if (
      error.message ===
      "REFEREE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Referee not found",
      });
    }

    if (
      error.message ===
      "REFEREE_NOT_ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee is not active",
      });
    }

    if (
      error.message ===
      "TEAM_SCHEDULE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "One of the teams already has a match scheduled on this date",
      });
    }

    if (
      error.message ===
      "VENUE_TIME_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Venue is already booked for this date and time",
      });
    }

    if (
      error.message ===
      "REFEREE_TIME_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Referee is already assigned to another match at this date and time",
      });
    }

    /*
     * Prisma P2034 means a serializable transaction
     * failed because of a write conflict/deadlock.
     *
     * The client can safely retry the request.
     */
    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match could not be scheduled because another match was being created or modified at the same time. Please try again",
      });
    }

    // ==================================================
    // UNEXPECTED ERROR
    // ==================================================

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

export const getMatches = async (req, res) => {
  try {
    // ==================================================
    // 1. READ OPTIONAL QUERY PARAMETERS
    // ==================================================

    const {
      competition_id,
      season_id,
      team_id,
      status,
      gender,
      date_from,
      date_to,
      page = "1",
      limit = "50",
    } = req.query;

    // ==================================================
    // 2. PAGINATION VALIDATION
    // ==================================================

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Page must be a positive integer",
      });
    }

    if (
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Limit must be between 1 and 100",
      });
    }

    // ==================================================
    // 3. BUILD WHERE CLAUSE
    // ==================================================

    const where = {};

    // --------------------------------------------------
    // Competition filter
    // --------------------------------------------------

    if (
      competition_id !== undefined
    ) {
      const competitionId =
        Number(competition_id);

      if (
        !Number.isInteger(
          competitionId
        ) ||
        competitionId < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Competition ID must be a positive integer",
        });
      }

      where.competition_id =
        competitionId;
    }

    // --------------------------------------------------
    // Season filter
    // --------------------------------------------------

    if (
      season_id !== undefined
    ) {
      const seasonId =
        Number(season_id);

      if (
        !Number.isInteger(
          seasonId
        ) ||
        seasonId < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Season ID must be a positive integer",
        });
      }

      where.season_id =
        seasonId;
    }

    // --------------------------------------------------
    // Team filter
    // --------------------------------------------------

    if (
      team_id !== undefined
    ) {
      const teamId =
        Number(team_id);

      if (
        !Number.isInteger(
          teamId
        ) ||
        teamId < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Team ID must be a positive integer",
        });
      }

      where.OR = [
        {
          home_team_id:
            teamId,
        },
        {
          away_team_id:
            teamId,
        },
      ];
    }

    // --------------------------------------------------
    // Status filter
    // --------------------------------------------------

    if (
      status !== undefined
    ) {
      const allowedStatuses = [
        MATCH_STATUS.SCHEDULED,
        MATCH_STATUS.LIVE,
        MATCH_STATUS.COMPLETED,
        MATCH_STATUS.CANCELLED,
        MATCH_STATUS.POSTPONED,
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid match status",
        });
      }

      where.status = status;
    }

    // --------------------------------------------------
    // Gender filter
    // --------------------------------------------------

    if (
      gender !== undefined
    ) {
      const allowedGenders = [
        "MEN",
        "WOMEN",
      ];

      if (
        !allowedGenders.includes(
          gender
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid gender",
        });
      }

      /*
       * Match itself does not have a gender field.
       *
       * Competition gender is the authoritative
       * gender for a match.
       */
      where.competition = {
        gender,
      };
    }

    // --------------------------------------------------
    // Date range filter
    // --------------------------------------------------

    if (
      date_from !== undefined ||
      date_to !== undefined
    ) {
      where.match_date = {};

      if (
        date_from !== undefined
      ) {
        const fromDate =
          new Date(date_from);

        if (
          Number.isNaN(
            fromDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid date_from",
          });
        }

        where.match_date.gte =
          new Date(
            `${formatDateOnly(
              fromDate
            )}T00:00:00.000Z`
          );
      }

      if (
        date_to !== undefined
      ) {
        const toDate =
          new Date(date_to);

        if (
          Number.isNaN(
            toDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid date_to",
          });
        }

        where.match_date.lte =
          new Date(
            `${formatDateOnly(
              toDate
            )}T00:00:00.000Z`
          );
      }

      if (
        where.match_date.gte &&
        where.match_date.lte &&
        where.match_date.gte >
          where.match_date.lte
      ) {
        return res.status(400).json({
          success: false,
          message:
            "date_from cannot be later than date_to",
        });
      }
    }

    // ==================================================
    // 4. PAGINATION OFFSET
    // ==================================================

    const skip =
      (pageNumber - 1) *
      limitNumber;

    // ==================================================
    // 5. FETCH MATCHES + TOTAL COUNT
    // ==================================================

    const [matches, total] =
      await prisma.$transaction([
        prisma.match.findMany({
          where,

          select: {
            match_id: true,
            competition_id: true,
            season_id: true,

            home_team_id: true,
            away_team_id: true,

            venue_id: true,
            referee_id: true,

            match_date: true,
            start_time: true,
            started_at: true,

            status: true,

            home_score: true,
            away_score: true,

            match_notes: true,

            created_at: true,
            updated_at: true,

            // ------------------------------------------------
            // Competition
            // ------------------------------------------------

            competition: {
              select: {
                competition_id: true,
                name: true,
                gender: true,
              },
            },

            // ------------------------------------------------
            // Season
            // ------------------------------------------------

            season: {
              select: {
                season_id: true,
                name: true,
              },
            },

            // ------------------------------------------------
            // Home team
            // ------------------------------------------------

            home_team: {
              select: {
                team_id: true,
                name: true,
                logo: true,
                gender: true,
              },
            },

            // ------------------------------------------------
            // Away team
            // ------------------------------------------------

            away_team: {
              select: {
                team_id: true,
                name: true,
                logo: true,
                gender: true,
              },
            },

            // ------------------------------------------------
            // Venue
            // ------------------------------------------------

            venue: {
              select: {
                venue_id: true,
                name: true,
                city: true,
              },
            },

            // ------------------------------------------------
            // Referee
            // ------------------------------------------------

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
            {
              match_id: "asc",
            },
          ],

          skip,

          take: limitNumber,
        }),

        prisma.match.count({
          where,
        }),
      ]);

    // ==================================================
    // 6. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: {
        matches,

        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          total_pages:
            Math.ceil(
              total /
                limitNumber
            ),
          has_next_page:
            pageNumber *
              limitNumber <
            total,
          has_previous_page:
            pageNumber > 1,
        },
      },
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
    // ==================================================
    // 1. VALIDATE MATCH ID
    // ==================================================

    const matchId = Number(
      req.params.match_id
    );

    if (
      !Number.isInteger(matchId) ||
      matchId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. FETCH MATCH
    // ==================================================

    const match =
      await prisma.match.findUnique({
        where: {
          match_id: matchId,
        },

        select: {
          // ==================================================
          // BASIC MATCH INFORMATION
          // ==================================================

          match_id: true,

          competition_id: true,
          season_id: true,

          home_team_id: true,
          away_team_id: true,

          venue_id: true,
          referee_id: true,

          match_date: true,
          start_time: true,
          started_at: true,

          status: true,

          home_score: true,
          away_score: true,

          match_notes: true,

          created_at: true,
          updated_at: true,

          // ==================================================
          // COMPETITION
          // ==================================================

          competition: {
            select: {
              competition_id: true,
              name: true,
              gender: true,
            },
          },

          // ==================================================
          // SEASON
          // ==================================================

          season: {
            select: {
              season_id: true,
              name: true,
            },
          },

          // ==================================================
          // HOME TEAM
          // ==================================================

          home_team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
              gender: true,
            },
          },

          // ==================================================
          // AWAY TEAM
          // ==================================================

          away_team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
              gender: true,
            },
          },

          // ==================================================
          // VENUE
          // ==================================================

          venue: {
            select: {
              venue_id: true,
              name: true,
              city: true,
            },
          },

          // ==================================================
          // REFEREE
          // ==================================================

          referee: {
            select: {
              referee_id: true,
              name: true,
            },
          },

          // ==================================================
          // MATCH EVENTS
          // ==================================================

          events: {
            orderBy: [
              {
                minute: "asc",
              },
              {
                extra_time: "asc",
              },
              {
                event_id: "asc",
              },
            ],

            select: {
              event_id: true,

              match_id: true,
              team_id: true,

              player_id: true,
              related_player_id: true,

              event_type: true,

              minute: true,
              extra_time: true,

              description: true,

              created_at: true,

              // ------------------------------------------------
              // Event team
              // ------------------------------------------------

              team: {
                select: {
                  team_id: true,
                  name: true,
                  logo: true,
                },
              },

              // ------------------------------------------------
              // Main event player
              // ------------------------------------------------

              player: {
                select: {
                  player_id: true,
                  name: true,
                  profile_photo: true,
                  position: true,
                  registration_number: true,
                },
              },

              // ------------------------------------------------
              // Related player
              // Used for substitutions
              // ------------------------------------------------

              related_player: {
                select: {
                  player_id: true,
                  name: true,
                  profile_photo: true,
                  position: true,
                  registration_number: true,
                },
              },
            },
          },

          // ==================================================
          // MATCH SQUAD / PLAYERS
          // ==================================================

          players: {
            orderBy: [
              {
                team_id: "asc",
              },
              {
                starting_status: "asc",
              },
              {
                shirt_number: "asc",
              },
              {
                match_player_id: "asc",
              },
            ],

            select: {
              match_player_id: true,

              match_id: true,
              team_id: true,
              player_id: true,

              starting_status: true,

              is_on_field: true,

              entered_at: true,
              exited_at: true,

              minutes_played: true,

              position: true,
              shirt_number: true,

              created_at: true,
              updated_at: true,

              // ------------------------------------------------
              // Team
              // ------------------------------------------------

              team: {
                select: {
                  team_id: true,
                  name: true,
                  logo: true,
                },
              },

              // ------------------------------------------------
              // Player
              // ------------------------------------------------

              player: {
                select: {
                  player_id: true,
                  name: true,
                  profile_photo: true,
                  position: true,
                  registration_number: true,
                  gender: true,
                  status: true,
                },
              },
            },
          },
        },
      });

    // ==================================================
    // 3. MATCH NOT FOUND
    // ==================================================

    if (!match) {
      return res.status(404).json({
        success: false,
        message:
          "Match not found",
      });
    }

    // ==================================================
    // 4. ORGANIZE SQUADS
    // ==================================================

    const homePlayers =
      match.players.filter(
        (player) =>
          player.team_id ===
          match.home_team_id
      );

    const awayPlayers =
      match.players.filter(
        (player) =>
          player.team_id ===
          match.away_team_id
      );

    // ==================================================
    // 5. ORGANIZE EVENTS
    // ==================================================

    const homeEvents =
      match.events.filter(
        (event) =>
          event.team_id ===
          match.home_team_id
      );

    const awayEvents =
      match.events.filter(
        (event) =>
          event.team_id ===
          match.away_team_id
      );

    // ==================================================
    // 6. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: {
        match: {
          match_id:
            match.match_id,

          competition_id:
            match.competition_id,

          season_id:
            match.season_id,

          home_team_id:
            match.home_team_id,

          away_team_id:
            match.away_team_id,

          venue_id:
            match.venue_id,

          referee_id:
            match.referee_id,

          match_date:
            match.match_date,

          start_time:
            match.start_time,

          started_at:
            match.started_at,

          status:
            match.status,

          home_score:
            match.home_score,

          away_score:
            match.away_score,

          match_notes:
            match.match_notes,

          created_at:
            match.created_at,

          updated_at:
            match.updated_at,
        },

        competition:
          match.competition,

        season:
          match.season,

        home_team:
          match.home_team,

        away_team:
          match.away_team,

        venue:
          match.venue,

        referee:
          match.referee,

        events: {
          total:
            match.events.length,

          home:
            homeEvents,

          away:
            awayEvents,

          all:
            match.events,
        },

        squads: {
          home: {
            total:
              homePlayers.length,

            starters:
              homePlayers.filter(
                (player) =>
                  player.starting_status ===
                  "STARTER"
              ).length,

            substitutes:
              homePlayers.filter(
                (player) =>
                  player.starting_status ===
                  "SUBSTITUTE"
              ).length,

            players:
              homePlayers,
          },

          away: {
            total:
              awayPlayers.length,

            starters:
              awayPlayers.filter(
                (player) =>
                  player.starting_status ===
                  "STARTER"
              ).length,

            substitutes:
              awayPlayers.filter(
                (player) =>
                  player.starting_status ===
                  "SUBSTITUTE"
              ).length,

            players:
              awayPlayers,
          },
        },
      },
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

export const updateMatch = async (req, res) => {
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

        select: {
          match_id: true,
          competition_id: true,
          season_id: true,
          home_team_id: true,
          away_team_id: true,
          venue_id: true,
          referee_id: true,
          match_date: true,
          start_time: true,
          started_at: true,
          status: true,
          home_score: true,
          away_score: true,
          match_notes: true,
        },
      });

    if (!existingMatch) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // ==================================================
    // 2. MATCH STATE CHECK
    // ==================================================

    /*
     * Only scheduled matches can have their
     * fixture details changed.
     *
     * LIVE matches must not have their teams,
     * venue, referee, date or kickoff time changed.
     */
    if (
      existingMatch.status !==
      MATCH_STATUS.SCHEDULED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only scheduled matches can be updated",
      });
    }

    /*
     * A scheduled match must not have started_at.
     */
    if (existingMatch.started_at) {
      return res.status(400).json({
        success: false,
        message:
          "A match with a start time cannot be updated as a scheduled match",
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
    // 4. BASIC ID VALIDATION
    // ==================================================

    if (
      !Number.isInteger(
        finalHomeTeamId
      ) ||
      finalHomeTeamId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid home team ID",
      });
    }

    if (
      !Number.isInteger(
        finalAwayTeamId
      ) ||
      finalAwayTeamId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid away team ID",
      });
    }

    if (
      !Number.isInteger(
        finalVenueId
      ) ||
      finalVenueId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid venue ID",
      });
    }

    if (
      !Number.isInteger(
        finalRefereeId
      ) ||
      finalRefereeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid referee ID",
      });
    }

    // ==================================================
    // 5. HOME/AWAY TEAM CHECK
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
    // 6. CHECK DATE
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
    // 7. GET COMPETITION + SEASON
    // ==================================================

    const competition =
      await prisma.competition.findUnique({
        where: {
          competition_id:
            existingMatch.competition_id,
        },

        select: {
          competition_id: true,
          season_id: true,
          gender: true,
          competition_start_date: true,
          competition_end_date: true,
          status: true,
        },
      });

    if (!competition) {
      return res.status(404).json({
        success: false,
        message:
          "Competition not found",
      });
    }

    /*
     * The match's competition cannot be changed,
     * but the competition itself must still exist.
     */
    const season =
      await prisma.season.findUnique({
        where: {
          season_id:
            existingMatch.season_id,
        },

        select: {
          season_id: true,
          start_date: true,
          end_date: true,
          status: true,
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
    // 8. DATE MUST REMAIN WITHIN COMPETITION
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
    // 9. DATE MUST REMAIN WITHIN SEASON
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
    // 10. CHECK HOME TEAM
    // ==================================================

    const homeTeam =
      await prisma.team.findUnique({
        where: {
          team_id:
            finalHomeTeamId,
        },

        select: {
          team_id: true,
          gender: true,
          status: true,
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
      homeTeam.status !==
      "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team is not active",
      });
    }

    // ==================================================
    // 11. CHECK AWAY TEAM
    // ==================================================

    const awayTeam =
      await prisma.team.findUnique({
        where: {
          team_id:
            finalAwayTeamId,
        },

        select: {
          team_id: true,
          gender: true,
          status: true,
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
      awayTeam.status !==
      "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team is not active",
      });
    }

    // ==================================================
    // 12. TEAM GENDER CHECK
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
    // 13. CHECK TEAM REGISTRATIONS
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

          select: {
            registration_status: true,
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

          select: {
            registration_status: true,
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
    // 14. CHECK VENUE
    // ==================================================

    const venue =
      await prisma.venue.findUnique({
        where: {
          venue_id:
            finalVenueId,
        },

        select: {
          venue_id: true,
          status: true,
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
      venue.status !==
      "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Venue is not active",
      });
    }

    // ==================================================
    // 15. CHECK REFEREE
    // ==================================================

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id:
            finalRefereeId,
        },

        select: {
          referee_id: true,
          status: true,
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
      referee.status !==
      "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee is not active",
      });
    }

    // ==================================================
    // 16. TEAM DATE CONFLICT
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

        select: {
          match_id: true,
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
    // 17. VENUE TIME CONFLICT
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

        select: {
          match_id: true,
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
    // 18. REFEREE TIME CONFLICT
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

        select: {
          match_id: true,
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
    // 19. BUILD UPDATE DATA
    // ==================================================

    const updateData = {};

    if (
      home_team_id !==
      undefined
    ) {
      updateData.home_team_id =
        finalHomeTeamId;
    }

    if (
      away_team_id !==
      undefined
    ) {
      updateData.away_team_id =
        finalAwayTeamId;
    }

    if (
      venue_id !==
      undefined
    ) {
      updateData.venue_id =
        finalVenueId;
    }

    if (
      referee_id !==
      undefined
    ) {
      updateData.referee_id =
        finalRefereeId;
    }

    if (
      match_date !==
      undefined
    ) {
      updateData.match_date =
        finalMatchDate;
    }

    if (
      start_time !==
      undefined
    ) {
      updateData.start_time =
        finalStartTime;
    }

    if (
      match_notes !==
      undefined
    ) {
      updateData.match_notes =
        match_notes?.trim() || null;
    }

    // ==================================================
    // 20. EMPTY UPDATE CHECK
    // ==================================================

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field must be provided for update",
      });
    }

    // ==================================================
    // 21. TRANSACTION + FRESH STATE CHECK
    // ==================================================

    const updatedMatch =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Re-read the match inside the transaction.
           *
           * This is important because another request
           * may have started or cancelled the match
           * after our initial validation.
           */
          const currentMatch =
            await tx.match.findUnique({
              where: {
                match_id: matchId,
              },

              select: {
                match_id: true,
                status: true,
                started_at: true,
              },
            });

          if (!currentMatch) {
            throw new Error(
              "MATCH_NOT_FOUND"
            );
          }

          /*
           * Only scheduled matches may be edited.
           */
          if (
            currentMatch.status !==
            MATCH_STATUS.SCHEDULED
          ) {
            throw new Error(
              "MATCH_NOT_SCHEDULED"
            );
          }

          /*
           * A scheduled match must not have
           * started_at.
           */
          if (
            currentMatch.started_at
          ) {
            throw new Error(
              "MATCH_ALREADY_STARTED"
            );
          }

          /*
           * Conditional update:
           *
           * If another request changes the state
           * before this update, zero rows will be
           * affected.
           */
          const updateResult =
            await tx.match.updateMany({
              where: {
                match_id: matchId,

                status:
                  MATCH_STATUS.SCHEDULED,

                started_at: null,
              },

              data: updateData,
            });

          if (
            updateResult.count !== 1
          ) {
            throw new Error(
              "MATCH_UPDATE_CONFLICT"
            );
          }

          /*
           * Fetch final state.
           */
          return await tx.match.findUnique({
            where: {
              match_id: matchId,
            },
          });
        }
      );

    // ==================================================
    // 22. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_UPDATED,

      entity_type:
        "MATCH",

      entity_id:
        matchId,

      details: {
        updated_fields:
          Object.keys(updateData),

        previous_values: {
          home_team_id:
            existingMatch.home_team_id,

          away_team_id:
            existingMatch.away_team_id,

          venue_id:
            existingMatch.venue_id,

          referee_id:
            existingMatch.referee_id,

          match_date:
            existingMatch.match_date,

          start_time:
            existingMatch.start_time,

          match_notes:
            existingMatch.match_notes,
        },

        new_values: {
          home_team_id:
            updatedMatch.home_team_id,

          away_team_id:
            updatedMatch.away_team_id,

          venue_id:
            updatedMatch.venue_id,

          referee_id:
            updatedMatch.referee_id,

          match_date:
            updatedMatch.match_date,

          start_time:
            updatedMatch.start_time,

          match_notes:
            updatedMatch.match_notes,
        },
      },
    });

    // ==================================================
    // 23. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Match updated successfully",

      data: {
        match:
          updatedMatch,
      },
    });
  } catch (error) {
    // ==================================================
    // EXPECTED ERRORS
    // ==================================================

    if (
      error.message ===
      "MATCH_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Match not found",
      });
    }

    if (
      error.message ===
        "MATCH_NOT_SCHEDULED" ||
      error.message ===
        "MATCH_ALREADY_STARTED" ||
      error.message ===
        "MATCH_UPDATE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match cannot be updated because its state has changed or it has already started",
      });
    }

    // ==================================================
    // UNEXPECTED ERROR
    // ==================================================

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

export const cancelMatch = async (req, res) => {
  try {
    const matchId = Number(
      req.params.match_id
    );

    /*
     * --------------------------------------------------
     * INITIAL MATCH CHECK
     * --------------------------------------------------
     */

    const match =
      await prisma.match.findUnique({
        where: {
          match_id: matchId,
        },

        select: {
          match_id: true,
          status: true,
          started_at: true,
          home_score: true,
          away_score: true,
        },
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message:
          "Match not found",
      });
    }

    /*
     * A match can only be cancelled
     * before it starts.
     */
    if (
      match.status !==
      MATCH_STATUS.SCHEDULED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only scheduled matches can be cancelled",
      });
    }

    /*
     * A scheduled match should not
     * have a start timestamp.
     */
    if (match.started_at) {
      return res.status(400).json({
        success: false,
        message:
          "A match with a start time cannot be cancelled as a scheduled match",
      });
    }

    /*
     * --------------------------------------------------
     * TRANSACTION
     * --------------------------------------------------
     *
     * Re-check the match state inside the
     * transaction so concurrent requests such as:
     *
     * startMatch()
     * cancelMatch()
     *
     * cannot both successfully change the
     * same match.
     */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Fresh match state.
           */
          const currentMatch =
            await tx.match.findUnique({
              where: {
                match_id: matchId,
              },

              select: {
                match_id: true,
                status: true,
                started_at: true,
                home_score: true,
                away_score: true,
              },
            });

          if (!currentMatch) {
            throw new Error(
              "MATCH_NOT_FOUND"
            );
          }

          /*
           * Only SCHEDULED matches can
           * transition to CANCELLED.
           */
          if (
            currentMatch.status !==
            MATCH_STATUS.SCHEDULED
          ) {
            throw new Error(
              "MATCH_NOT_SCHEDULED"
            );
          }

          /*
           * A scheduled match must not have
           * started_at.
           */
          if (
            currentMatch.started_at
          ) {
            throw new Error(
              "MATCH_ALREADY_STARTED"
            );
          }

          /*
           * ------------------------------------------------
           * SAFE STATE TRANSITION
           * ------------------------------------------------
           */

          const updateResult =
            await tx.match.updateMany({
              where: {
                match_id: matchId,

                status:
                  MATCH_STATUS.SCHEDULED,

                started_at: null,
              },

              data: {
                status:
                  MATCH_STATUS.CANCELLED,
              },
            });

          /*
           * If another request changed the
           * match state first, no row will
           * be updated.
           */
          if (
            updateResult.count !== 1
          ) {
            throw new Error(
              "MATCH_CANCEL_CONFLICT"
            );
          }

          /*
           * ------------------------------------------------
           * FINAL MATCH STATE
           * ------------------------------------------------
           */

          const cancelledMatch =
            await tx.match.findUnique({
              where: {
                match_id: matchId,
              },

              select: {
                match_id: true,
                competition_id: true,
                season_id: true,
                home_team_id: true,
                away_team_id: true,
                venue_id: true,
                referee_id: true,
                match_date: true,
                start_time: true,
                started_at: true,
                status: true,
                home_score: true,
                away_score: true,
                match_notes: true,
                created_at: true,
                updated_at: true,
              },
            });

          return cancelledMatch;
        }
      );

    /*
     * --------------------------------------------------
     * AUDIT LOG
     * --------------------------------------------------
     */

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_CANCELLED,

      entity_type:
        "MATCH",

      entity_id:
        result.match_id,

      details: {
        previous_status:
          MATCH_STATUS.SCHEDULED,

        new_status:
          MATCH_STATUS.CANCELLED,

        cancelled_at:
          new Date().toISOString(),

        home_score:
          result.home_score,

        away_score:
          result.away_score,
      },
    });

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return res.status(200).json({
      success: true,

      message:
        "Match cancelled successfully",

      data: {
        match:
          result,
      },
    });
  } catch (error) {
    /*
     * --------------------------------------------------
     * EXPECTED ERRORS
     * --------------------------------------------------
     */

    if (
      error.message ===
      "MATCH_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Match not found",
      });
    }

    if (
      error.message ===
        "MATCH_NOT_SCHEDULED" ||
      error.message ===
        "MATCH_ALREADY_STARTED" ||
      error.message ===
        "MATCH_CANCEL_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match cannot be cancelled because it has already started or its state has changed",
      });
    }

    /*
     * --------------------------------------------------
     * UNEXPECTED ERROR
     * --------------------------------------------------
     */

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

export const completeMatch = async (req, res) => {
  try {
    const matchId = Number(req.params.match_id);

    const match = await prisma.match.findUnique({
      where: {
        match_id: matchId,
      },
      select: {
        match_id: true,
        competition_id: true,
        status: true,
        started_at: true,
        home_score: true,
        away_score: true,
      },
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (match.status !== MATCH_STATUS.LIVE) {
      return res.status(400).json({
        success: false,
        message:
          `Match cannot be completed because its current status is ${match.status}`,
      });
    }

    if (!match.started_at) {
      return res.status(400).json({
        success: false,
        message: "Match start time is missing",
      });
    }

    if (!match.competition_id) {
      return res.status(400).json({
        success: false,
        message:
          "Match cannot be completed because competition information is missing",
      });
    }

    const completedAt = new Date();

    if (completedAt < match.started_at) {
      return res.status(400).json({
        success: false,
        message:
          "Match cannot be completed before its start time",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Re-check match state inside the transaction.
         */
        const currentMatch =
          await tx.match.findUnique({
            where: {
              match_id: matchId,
            },
            select: {
              match_id: true,
              competition_id: true,
              status: true,
              started_at: true,
              home_score: true,
              away_score: true,
            },
          });

        if (!currentMatch) {
          throw new Error("MATCH_NOT_FOUND");
        }

        if (
          currentMatch.status !==
          MATCH_STATUS.LIVE
        ) {
          throw new Error("MATCH_NOT_LIVE");
        }

        if (!currentMatch.started_at) {
          throw new Error(
            "MATCH_START_TIME_MISSING"
          );
        }

        if (!currentMatch.competition_id) {
          throw new Error(
            "MATCH_COMPETITION_MISSING"
          );
        }

        if (
          completedAt <
          currentMatch.started_at
        ) {
          throw new Error(
            "INVALID_COMPLETION_TIME"
          );
        }

        /*
         * Atomically change LIVE → COMPLETED.
         */
        const matchUpdate =
          await tx.match.updateMany({
            where: {
              match_id: matchId,
              status: MATCH_STATUS.LIVE,
              started_at: {
                not: null,
              },
            },

            data: {
              status:
                MATCH_STATUS.COMPLETED,
            },
          });

        if (matchUpdate.count !== 1) {
          throw new Error(
            "MATCH_ALREADY_COMPLETED"
          );
        }

        /*
         * Find every player who is currently
         * on the field.
         */
        const activePlayers =
          await tx.matchPlayer.findMany({
            where: {
              match_id: matchId,
              is_on_field: true,
            },

            select: {
              match_player_id: true,
              player_id: true,
              entered_at: true,
            },
          });

        for (const player of activePlayers) {
          /*
           * Every active player must have an
           * entry timestamp.
           */
          if (!player.entered_at) {
            throw new Error(
              `PLAYER_ENTRY_TIME_MISSING:${player.match_player_id}`
            );
          }

          /*
           * Player cannot have entered before
           * the match itself started.
           */
          if (
            player.entered_at <
            currentMatch.started_at
          ) {
            throw new Error(
              `PLAYER_ENTRY_BEFORE_MATCH:${player.match_player_id}`
            );
          }

          /*
           * Player cannot have an entry time
           * in the future.
           */
          if (
            player.entered_at >
            completedAt
          ) {
            throw new Error(
              `PLAYER_ENTRY_IN_FUTURE:${player.match_player_id}`
            );
          }

          const millisecondsPlayed =
            completedAt.getTime() -
            player.entered_at.getTime();

          const minutesPlayed = Math.max(
            0,
            Math.floor(
              millisecondsPlayed /
                (1000 * 60)
            )
          );

          await tx.matchPlayer.update({
            where: {
              match_player_id:
                player.match_player_id,
            },

            data: {
              is_on_field: false,
              exited_at: completedAt,
              minutes_played:
                minutesPlayed,
            },
          });
        }

        /*
         * Recalculate the complete competition
         * standings after this match becomes
         * COMPLETED.
         *
         * IMPORTANT:
         * This happens inside the SAME transaction.
         *
         * Therefore:
         * - Match completion succeeds
         * - Player closing succeeds
         * - Standings calculation succeeds
         *
         * OR everything rolls back together.
         */
        const standings =
          await recalculateCompetitionStandings(
            tx,
            currentMatch.competition_id
          );

        // Rankings are a separate overall ELO table. Rebuild from the
        // canonical completed-match history in this same transaction, so a
        // completed fixture cannot update standings without rankings.
        const rankings = await recalculateTeamRankings(tx);

        /*
         * Fetch final match state after
         * match, player, and standings updates.
         */
        const completedMatch =
          await tx.match.findUnique({
            where: {
              match_id: matchId,
            },

            select: {
              match_id: true,
              competition_id: true,
              status: true,
              started_at: true,
              home_score: true,
              away_score: true,
              updated_at: true,
            },
          });

        return {
          completedMatch,

          playersClosed:
            activePlayers.length,

          standingsUpdated:
            standings.length,

          rankingsUpdated:
            rankings.length,
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_COMPLETED,

      entity_type:
        "MATCH",

      entity_id:
        matchId,

      details: {
        previous_status:
          MATCH_STATUS.LIVE,

        new_status:
          MATCH_STATUS.COMPLETED,

        completed_at:
          completedAt.toISOString(),

        home_score:
          result.completedMatch
            .home_score,

        away_score:
          result.completedMatch
            .away_score,

        players_closed:
          result.playersClosed,

        standings_updated:
          result.standingsUpdated,

        rankings_updated:
          result.rankingsUpdated,
      },
    });

    return res.status(200).json({
      success: true,

      message:
        "Match completed successfully",

      data: {
        match:
          result.completedMatch,

        players_closed:
          result.playersClosed,

        standings_updated:
          result.standingsUpdated,

        rankings_updated:
          result.rankingsUpdated,
      },
    });
  } catch (error) {
    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "The match was updated concurrently. Please retry completion.",
      });
    }

    if (
      error.message ===
      "MATCH_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (
      error.message ===
        "MATCH_NOT_LIVE" ||
      error.message ===
        "MATCH_ALREADY_COMPLETED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match has already been completed or is no longer live",
      });
    }

    if (
      error.message ===
        "MATCH_START_TIME_MISSING" ||
      error.message ===
        "INVALID_COMPLETION_TIME" ||
      error.message ===
        "MATCH_COMPETITION_MISSING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match timing or competition information is invalid",
      });
    }

    if (
      error.message.startsWith(
        "PLAYER_ENTRY_TIME_MISSING:"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "An active player is missing an entry time",
      });
    }

    if (
      error.message.startsWith(
        "PLAYER_ENTRY_BEFORE_MATCH:"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "An active player has an invalid entry time before the match started",
      });
    }

    if (
      error.message.startsWith(
        "PLAYER_ENTRY_IN_FUTURE:"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "An active player has an invalid future entry time",
      });
    }

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


export const startMatch = async (req, res) => {
  try {
    const matchId = Number(req.params.match_id);

    const match = await prisma.match.findUnique({
      where: {
        match_id: matchId,
      },
      select: {
        match_id: true,
        status: true,
        started_at: true,
        home_team_id: true,
        away_team_id: true,
      },
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (match.status !== MATCH_STATUS.SCHEDULED) {
      return res.status(400).json({
        success: false,
        message:
          "Only scheduled matches can be started",
      });
    }

    if (match.started_at) {
      return res.status(400).json({
        success: false,
        message:
          "Match has already been started",
      });
    }

    const startedAt = new Date();

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Re-check the match state inside the transaction.
         *
         * The match may have changed between the initial
         * database read and this transaction.
         */
        const currentMatch =
          await tx.match.findUnique({
            where: {
              match_id: matchId,
            },
            select: {
              match_id: true,
              status: true,
              started_at: true,
              home_team_id: true,
              away_team_id: true,
            },
          });

        if (!currentMatch) {
          throw new Error(
            "MATCH_NOT_FOUND"
          );
        }

        if (
          currentMatch.status !==
          MATCH_STATUS.SCHEDULED
        ) {
          throw new Error(
            "MATCH_NOT_SCHEDULED"
          );
        }

        if (currentMatch.started_at) {
          throw new Error(
            "MATCH_ALREADY_STARTED"
          );
        }

        /*
         * IMPORTANT:
         * Count starters again inside the transaction.
         *
         * This prevents the match from starting based on
         * an outdated starter count.
         */
        const homeStarters =
          await tx.matchPlayer.count({
            where: {
              match_id: matchId,
              team_id:
                currentMatch.home_team_id,
              starting_status: "STARTER",
            },
          });

        const awayStarters =
          await tx.matchPlayer.count({
            where: {
              match_id: matchId,
              team_id:
                currentMatch.away_team_id,
              starting_status: "STARTER",
            },
          });

        if (homeStarters !== 11) {
          throw new Error(
            "INVALID_HOME_STARTERS"
          );
        }

        if (awayStarters !== 11) {
          throw new Error(
            "INVALID_AWAY_STARTERS"
          );
        }

        /*
         * Atomically change:
         *
         * SCHEDULED → LIVE
         *
         * and set started_at.
         */
        const matchUpdate =
          await tx.match.updateMany({
            where: {
              match_id: matchId,
              status:
                MATCH_STATUS.SCHEDULED,
              started_at: null,
            },

            data: {
              status:
                MATCH_STATUS.LIVE,

              started_at:
                startedAt,
            },
          });

        if (matchUpdate.count !== 1) {
          throw new Error(
            "MATCH_START_CONFLICT"
          );
        }

        /*
         * Put all 11 starters on the field.
         */
        await tx.matchPlayer.updateMany({
          where: {
            match_id: matchId,
            starting_status: "STARTER",
          },

          data: {
            is_on_field: true,
            entered_at: startedAt,
            exited_at: null,
            minutes_played: 0,
          },
        });

        /*
         * Make sure substitutes are not accidentally
         * marked as active players.
         */
        await tx.matchPlayer.updateMany({
          where: {
            match_id: matchId,
            starting_status: "SUBSTITUTE",
          },

          data: {
            is_on_field: false,
            entered_at: null,
            exited_at: null,
            minutes_played: 0,
          },
        });

        /*
         * Return the final match state.
         */
        const updatedMatch =
          await tx.match.findUnique({
            where: {
              match_id: matchId,
            },

            select: {
              match_id: true,
              competition_id: true,
              season_id: true,
              home_team_id: true,
              away_team_id: true,
              venue_id: true,
              referee_id: true,
              match_date: true,
              start_time: true,
              started_at: true,
              status: true,
              home_score: true,
              away_score: true,
              match_notes: true,
              created_at: true,
              updated_at: true,
            },
          });

        return {
          match: updatedMatch,
          homeStarters,
          awayStarters,
        };
      }
    );

    /*
     * Audit only after the transaction succeeds.
     */
    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_STARTED,

      entity_type:
        "MATCH",

      entity_id:
        result.match.match_id,

      details: {
        started_at:
          startedAt.toISOString(),

        home_team_id:
          result.match.home_team_id,

        away_team_id:
          result.match.away_team_id,

        home_starters:
          result.homeStarters,

        away_starters:
          result.awayStarters,
      },
    });

    return res.status(200).json({
      success: true,

      message:
        "Match started successfully",

      data: {
        match:
          result.match,
      },
    });
  } catch (error) {
    if (
      error.message ===
      "MATCH_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (
      error.message ===
        "MATCH_NOT_SCHEDULED" ||
      error.message ===
        "MATCH_ALREADY_STARTED" ||
      error.message ===
        "MATCH_START_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match has already started or is no longer scheduled",
      });
    }

    if (
      error.message ===
      "INVALID_HOME_STARTERS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Home team must have exactly 11 starters before the match can start",
      });
    }

    if (
      error.message ===
      "INVALID_AWAY_STARTERS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Away team must have exactly 11 starters before the match can start",
      });
    }

    console.error(
      "Start match error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while starting the match",
    });
  }
};
