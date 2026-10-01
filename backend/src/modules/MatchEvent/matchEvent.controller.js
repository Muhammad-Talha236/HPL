import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { createAuditLog } from "../../utils/auditLog.util.js";

// ==================================================
// MATCH STATUS
// ==================================================

const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  POSTPONED: "POSTPONED",
};

// ==================================================
// EVENT TYPES
// ==================================================

const EVENT_TYPES = {
  GOAL: "GOAL",
  YELLOW_CARD: "YELLOW_CARD",
  RED_CARD: "RED_CARD",
  SUBSTITUTION: "SUBSTITUTION",
};

// ==================================================
// CREATE MATCH EVENT
// ==================================================

export const createMatchEvent = async (req, res) => {
  try {
    const {
      match_id,
      team_id,
      player_id,
      related_player_id,
      event_type,
      minute,
      extra_time,
      description,
    } = req.body;

    const matchId = Number(match_id);
    const teamId = Number(team_id);
    const playerId = Number(player_id);

    const relatedPlayerId =
      related_player_id !== undefined &&
      related_player_id !== null
        ? Number(related_player_id)
        : null;

    const eventMinute = Number(minute);

    // ==================================================
    // 1. CHECK MATCH
    // ==================================================

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

    // ==================================================
    // 2. MATCH MUST BE LIVE
    // ==================================================

    if (match.status !== MATCH_STATUS.LIVE) {
      return res.status(400).json({
        success: false,
        message:
          "Match events can only be created while the match is live",
      });
    }

    // ==================================================
    // 3. MATCH MUST HAVE START TIME
    // ==================================================

    if (!match.started_at) {
      return res.status(400).json({
        success: false,
        message: "Match start time is missing",
      });
    }

    // ==================================================
    // 4. TEAM MUST BE PART OF MATCH
    // ==================================================

    if (
      match.home_team_id !== teamId &&
      match.away_team_id !== teamId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This team is not participating in the selected match",
      });
    }

    // ==================================================
    // 5. CHECK TEAM
    // ==================================================

    const team = await prisma.team.findUnique({
      where: {
        team_id: teamId,
      },

      select: {
        team_id: true,
        name: true,
        owner_id: true,

        club: {
          select: {
            owner_id: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // ==================================================
    // 6. CHECK PLAYER
    // ==================================================

    const player = await prisma.player.findUnique({
      where: {
        player_id: playerId,
      },

      select: {
        player_id: true,
        name: true,
        status: true,
      },
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    if (player.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Player is not active",
      });
    }

    // ==================================================
    // 7. VERIFY USER PERMISSION
    // ==================================================

    const isSuperAdmin =
      req.user.role === ROLES.SUPER_ADMIN;

    const isTeamOwner =
      team.owner_id === req.user.user_id;

    const isClubOwner =
      team.club.owner_id === req.user.user_id;

    if (
      !isSuperAdmin &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to manage events for this team",
      });
    }

    // ==================================================
    // 8. SERVER EVENT TIME
    // ==================================================

    const eventTime = new Date();

    // ==================================================
    // 9. EVENT MINUTE VALIDATION
    // ==================================================

    const elapsedMilliseconds =
      eventTime.getTime() -
      match.started_at.getTime();

    const elapsedMinutes = Math.max(
      0,
      Math.floor(
        elapsedMilliseconds /
          (1000 * 60)
      )
    );

    // Allow a small tolerance because the official
    // may enter an event a little after it happened.
    const EVENT_MINUTE_TOLERANCE = 2;

    if (
      eventMinute >
      elapsedMinutes +
        EVENT_MINUTE_TOLERANCE
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Event minute cannot be ahead of the current match time. Current match time is approximately ${elapsedMinutes} minutes`,
      });
    }

    // Extra time should not be used for
    // an event before the 45th minute.
    if (
      extra_time !== undefined &&
      extra_time !== null &&
      Number(extra_time) > 0 &&
      eventMinute < 45
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Extra time cannot be recorded before minute 45",
      });
    }

    // ==================================================
    // 10. TRANSACTION
    // ==================================================

    const result = await prisma.$transaction(
      async (tx) => {
        // ------------------------------------------
        // RE-CHECK MATCH INSIDE TRANSACTION
        // ------------------------------------------

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

        // ------------------------------------------
        // RE-CHECK EVENT TIMING INSIDE TRANSACTION
        // ------------------------------------------

        const transactionElapsedMilliseconds =
          eventTime.getTime() -
          currentMatch.started_at.getTime();

        const transactionElapsedMinutes =
          Math.max(
            0,
            Math.floor(
              transactionElapsedMilliseconds /
                (1000 * 60)
            )
          );

        if (
          eventMinute >
          transactionElapsedMinutes +
            EVENT_MINUTE_TOLERANCE
        ) {
          throw new Error(
            "EVENT_MINUTE_AHEAD"
          );
        }

        // ------------------------------------------
        // GET LATEST PLAYER STATE
        // ------------------------------------------

        const matchPlayer =
          await tx.matchPlayer.findUnique({
            where: {
              match_id_player_id: {
                match_id: matchId,
                player_id: playerId,
              },
            },

            select: {
              match_player_id: true,
              team_id: true,
              starting_status: true,
              is_on_field: true,
              entered_at: true,
              exited_at: true,
              minutes_played: true,
            },
          });

        if (!matchPlayer) {
          throw new Error(
            "PLAYER_NOT_IN_SQUAD"
          );
        }

        if (
          matchPlayer.team_id !== teamId
        ) {
          throw new Error(
            "PLAYER_WRONG_TEAM"
          );
        }

        // ------------------------------------------
        // NON-SUBSTITUTION EVENTS
        // ------------------------------------------

        if (
          event_type !==
          EVENT_TYPES.SUBSTITUTION
        ) {
          if (!matchPlayer.is_on_field) {
            throw new Error(
              "PLAYER_NOT_ON_FIELD"
            );
          }

          if (!matchPlayer.entered_at) {
            throw new Error(
              "PLAYER_ENTRY_TIME_MISSING"
            );
          }

          if (matchPlayer.exited_at) {
            throw new Error(
              "PLAYER_ALREADY_LEFT"
            );
          }
        }

        // ------------------------------------------
        // SUBSTITUTION
        // ------------------------------------------

        let incomingMatchPlayer = null;

        if (
          event_type ===
          EVENT_TYPES.SUBSTITUTION
        ) {
          if (!relatedPlayerId) {
            throw new Error(
              "SUBSTITUTION_INCOMING_REQUIRED"
            );
          }

          if (
            relatedPlayerId === playerId
          ) {
            throw new Error(
              "SUBSTITUTION_PLAYERS_SAME"
            );
          }

          incomingMatchPlayer =
            await tx.matchPlayer.findUnique({
              where: {
                match_id_player_id: {
                  match_id: matchId,
                  player_id:
                    relatedPlayerId,
                },
              },

              select: {
                match_player_id: true,
                team_id: true,
                starting_status: true,
                is_on_field: true,
                entered_at: true,
                exited_at: true,
                minutes_played: true,
              },
            });

          if (!incomingMatchPlayer) {
            throw new Error(
              "INCOMING_PLAYER_NOT_IN_SQUAD"
            );
          }

          if (
            incomingMatchPlayer.team_id !==
            teamId
          ) {
            throw new Error(
              "INCOMING_PLAYER_WRONG_TEAM"
            );
          }

          if (
            incomingMatchPlayer.starting_status !==
            "SUBSTITUTE"
          ) {
            throw new Error(
              "INCOMING_PLAYER_NOT_SUBSTITUTE"
            );
          }

          if (
            incomingMatchPlayer.is_on_field
          ) {
            throw new Error(
              "INCOMING_PLAYER_ALREADY_ON_FIELD"
            );
          }

          if (
            incomingMatchPlayer.entered_at
          ) {
            throw new Error(
              "SUBSTITUTE_ALREADY_ENTERED"
            );
          }

          if (!matchPlayer.is_on_field) {
            throw new Error(
              "OUTGOING_PLAYER_NOT_ON_FIELD"
            );
          }

          if (!matchPlayer.entered_at) {
            throw new Error(
              "OUTGOING_PLAYER_ENTRY_TIME_MISSING"
            );
          }

          if (matchPlayer.exited_at) {
            throw new Error(
              "OUTGOING_PLAYER_ALREADY_LEFT"
            );
          }
        }

        // ------------------------------------------
        // RELATED PLAYER VALIDATION
        // ------------------------------------------

        if (
          event_type !==
            EVENT_TYPES.SUBSTITUTION &&
          relatedPlayerId !== null
        ) {
          throw new Error(
            "RELATED_PLAYER_NOT_ALLOWED"
          );
        }

        // ------------------------------------------
        // CREATE EVENT
        // ------------------------------------------

        const event =
          await tx.matchEvent.create({
            data: {
              match_id: matchId,
              team_id: teamId,
              player_id: playerId,
              related_player_id:
                relatedPlayerId,
              event_type,
              minute: eventMinute,
              extra_time:
                extra_time !== undefined &&
                extra_time !== null
                  ? Number(extra_time)
                  : null,
              description:
                description?.trim() || null,
            },
          });

        let updatedMatch = null;

        // ==========================================
        // GOAL → UPDATE SCORE
        // ==========================================

        if (
          event_type === EVENT_TYPES.GOAL
        ) {
          if (
            teamId ===
            currentMatch.home_team_id
          ) {
            updatedMatch =
              await tx.match.update({
                where: {
                  match_id: matchId,
                },

                data: {
                  home_score: {
                    increment: 1,
                  },
                },

                select: {
                  match_id: true,
                  home_score: true,
                  away_score: true,
                  status: true,
                },
              });
          } else {
            updatedMatch =
              await tx.match.update({
                where: {
                  match_id: matchId,
                },

                data: {
                  away_score: {
                    increment: 1,
                  },
                },

                select: {
                  match_id: true,
                  home_score: true,
                  away_score: true,
                  status: true,
                },
              });
          }
        }

        // ==========================================
        // RED CARD → PLAYER LEAVES FIELD
        // ==========================================

        if (
          event_type ===
          EVENT_TYPES.RED_CARD
        ) {
          const millisecondsPlayed =
            eventTime.getTime() -
            matchPlayer.entered_at.getTime();

          const minutesPlayed =
            Math.max(
              0,
              Math.floor(
                millisecondsPlayed /
                  (1000 * 60)
              )
            );

          const playerUpdate =
            await tx.matchPlayer.updateMany({
              where: {
                match_player_id:
                  matchPlayer.match_player_id,
                is_on_field: true,
                exited_at: null,
              },

              data: {
                is_on_field: false,
                exited_at: eventTime,
                minutes_played:
                  minutesPlayed,
              },
            });

          if (playerUpdate.count !== 1) {
            throw new Error(
              "PLAYER_STATE_CHANGED"
            );
          }
        }

        // ==========================================
        // SUBSTITUTION
        // ==========================================

        if (
          event_type ===
          EVENT_TYPES.SUBSTITUTION
        ) {
          const millisecondsPlayed =
            eventTime.getTime() -
            matchPlayer.entered_at.getTime();

          const minutesPlayed =
            Math.max(
              0,
              Math.floor(
                millisecondsPlayed /
                  (1000 * 60)
              )
            );

          // ----------------------------------------
          // OUTGOING PLAYER
          // ----------------------------------------

          const outgoingUpdate =
            await tx.matchPlayer.updateMany({
              where: {
                match_player_id:
                  matchPlayer.match_player_id,
                is_on_field: true,
                exited_at: null,
              },

              data: {
                is_on_field: false,
                exited_at: eventTime,
                minutes_played:
                  minutesPlayed,
              },
            });

          if (outgoingUpdate.count !== 1) {
            throw new Error(
              "PLAYER_STATE_CHANGED"
            );
          }

          // ----------------------------------------
          // INCOMING PLAYER
          // ----------------------------------------

          const incomingUpdate =
            await tx.matchPlayer.updateMany({
              where: {
                match_player_id:
                  incomingMatchPlayer.match_player_id,
                is_on_field: false,
                entered_at: null,
              },

              data: {
                is_on_field: true,
                entered_at: eventTime,
                exited_at: null,
                minutes_played: 0,
              },
            });

          if (incomingUpdate.count !== 1) {
            throw new Error(
              "INCOMING_PLAYER_STATE_CHANGED"
            );
          }
        }

        return {
          event,
          updatedMatch,
        };
      }
    );

    // ==================================================
    // 11. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_EVENT_CREATED,

      entity_type:
        "MATCH_EVENT",

      entity_id:
        result.event.event_id,

      details: {
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
        related_player_id:
          relatedPlayerId,
        event_type,
        minute: eventMinute,
        event_time:
          eventTime.toISOString(),
      },
    });

    // ==================================================
    // 12. RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Match event created successfully",

      data: {
        event: result.event,

        score:
          result.updatedMatch
            ? {
                home_score:
                  result.updatedMatch
                    .home_score,

                away_score:
                  result.updatedMatch
                    .away_score,
              }
            : {
                home_score:
                  match.home_score,

                away_score:
                  match.away_score,
              },
      },
    });
  } catch (error) {
    // ==================================================
    // EXPECTED STATE ERRORS
    // ==================================================

    const stateErrors = {
      MATCH_NOT_FOUND: {
        status: 404,
        message: "Match not found",
      },

      MATCH_NOT_LIVE: {
        status: 400,
        message:
          "Match events can only be created while the match is live",
      },

      MATCH_START_TIME_MISSING: {
        status: 400,
        message:
          "Match start time is missing",
      },

      EVENT_MINUTE_AHEAD: {
        status: 400,
        message:
          "Event minute cannot be ahead of the current match time",
      },

      PLAYER_NOT_IN_SQUAD: {
        status: 400,
        message:
          "Player is not selected for this match",
      },

      PLAYER_WRONG_TEAM: {
        status: 400,
        message:
          "Player does not belong to the selected match team",
      },

      PLAYER_NOT_ON_FIELD: {
        status: 400,
        message:
          "This player is not currently on the field",
      },

      PLAYER_ENTRY_TIME_MISSING: {
        status: 400,
        message:
          "Player entry time is missing",
      },

      PLAYER_ALREADY_LEFT: {
        status: 400,
        message:
          "This player has already left the field",
      },

      SUBSTITUTION_INCOMING_REQUIRED: {
        status: 400,
        message:
          "A substitution requires a player coming into the match",
      },

      SUBSTITUTION_PLAYERS_SAME: {
        status: 400,
        message:
          "Substitution players must be different",
      },

      INCOMING_PLAYER_NOT_IN_SQUAD: {
        status: 400,
        message:
          "Incoming player is not selected for this match",
      },

      INCOMING_PLAYER_WRONG_TEAM: {
        status: 400,
        message:
          "Incoming player does not belong to this team",
      },

      INCOMING_PLAYER_NOT_SUBSTITUTE: {
        status: 400,
        message:
          "Incoming player must be a substitute",
      },

      INCOMING_PLAYER_ALREADY_ON_FIELD: {
        status: 400,
        message:
          "Incoming player is already on the field",
      },

      SUBSTITUTE_ALREADY_ENTERED: {
        status: 400,
        message:
          "This substitute has already entered the match",
      },

      OUTGOING_PLAYER_NOT_ON_FIELD: {
        status: 400,
        message:
          "Outgoing player is not currently on the field",
      },

      OUTGOING_PLAYER_ENTRY_TIME_MISSING: {
        status: 400,
        message:
          "Outgoing player's entry time is missing",
      },

      OUTGOING_PLAYER_ALREADY_LEFT: {
        status: 400,
        message:
          "Outgoing player has already left the field",
      },

      RELATED_PLAYER_NOT_ALLOWED: {
        status: 400,
        message:
          "Related player can only be used for substitutions",
      },

      PLAYER_STATE_CHANGED: {
        status: 409,
        message:
          "Player state changed while processing the event. Please try again.",
      },

      INCOMING_PLAYER_STATE_CHANGED: {
        status: 409,
        message:
          "Incoming player state changed while processing the substitution. Please try again.",
      },
    };

    const expectedError =
      stateErrors[error.message];

    if (expectedError) {
      return res.status(expectedError.status).json({
        success: false,
        message: expectedError.message,
      });
    }

    console.error(
      "Create match event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the match event",
    });
  }
};

// ==================================================
// GET ALL MATCH EVENTS
// ==================================================

export const getMatchEvents = async (
  req,
  res
) => {
  try {
    const matchId =
      Number(req.params.match_id);

    // ==================================================
    // 1. CHECK MATCH
    // ==================================================

    const match =
      await prisma.match.findUnique({
        where: {
          match_id: matchId,
        },

        select: {
          match_id: true,
          status: true,
          home_team_id: true,
          away_team_id: true,
          home_score: true,
          away_score: true,

          home_team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
            },
          },

          away_team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
            },
          },
        },
      });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // ==================================================
    // 2. GET MATCH EVENTS
    // ==================================================

    const events =
      await prisma.matchEvent.findMany({
        where: {
          match_id: matchId,
        },

        orderBy: [
          {
            minute: "asc",
          },
          {
            extra_time: "asc",
          },
          {
            created_at: "asc",
          },
        ],

        include: {
          // --------------------------------------------
          // TEAM
          // --------------------------------------------

          team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
            },
          },

          // --------------------------------------------
          // MAIN PLAYER
          // --------------------------------------------

          player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
              position: true,
            },
          },

          // --------------------------------------------
          // RELATED PLAYER
          // Used mainly for substitutions
          // --------------------------------------------

          related_player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
              position: true,
            },
          },
        },
      });

    // ==================================================
    // 3. FORMAT EVENTS FOR FRONTEND
    // ==================================================

    const formattedEvents =
      events.map((event) => ({
        event_id:
          event.event_id,

        event_type:
          event.event_type,

        minute:
          event.minute,

        extra_time:
          event.extra_time,

        description:
          event.description,

        created_at:
          event.created_at,

        team: {
          team_id:
            event.team.team_id,

          name:
            event.team.name,

          logo:
            event.team.logo,
        },

        player: {
          player_id:
            event.player.player_id,

          name:
            event.player.name,

          profile_photo:
            event.player.profile_photo,

          position:
            event.player.position,
        },

        related_player:
          event.related_player
            ? {
                player_id:
                  event.related_player
                    .player_id,

                name:
                  event.related_player.name,

                profile_photo:
                  event.related_player
                    .profile_photo,

                position:
                  event.related_player.position,
              }
            : null,
      }));

    // ==================================================
    // 4. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: {
        match: {
          match_id:
            match.match_id,

          status:
            match.status,

          home_team:
            match.home_team,

          away_team:
            match.away_team,

          score: {
            home:
              match.home_score,

            away:
              match.away_score,
          },
        },

        events: {
          count:
            formattedEvents.length,

          items:
            formattedEvents,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get match events error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch match events",
    });
  }
};
// ==================================================
// GET SINGLE MATCH EVENT
// ==================================================

export const getMatchEventById = async (
  req,
  res
) => {
  try {
    const eventId =
      Number(req.params.event_id);

    // ==================================================
    // 1. GET EVENT
    // ==================================================

    const event =
      await prisma.matchEvent.findUnique({
        where: {
          event_id: eventId,
        },

        include: {
          // --------------------------------------------
          // MATCH
          // --------------------------------------------

          match: {
            select: {
              match_id: true,
              match_date: true,
              start_time: true,
              status: true,
              home_score: true,
              away_score: true,

              home_team: {
                select: {
                  team_id: true,
                  name: true,
                  logo: true,
                },
              },

              away_team: {
                select: {
                  team_id: true,
                  name: true,
                  logo: true,
                },
              },
            },
          },

          // --------------------------------------------
          // EVENT TEAM
          // --------------------------------------------

          team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
            },
          },

          // --------------------------------------------
          // MAIN PLAYER
          // --------------------------------------------

          player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
              position: true,
            },
          },

          // --------------------------------------------
          // RELATED PLAYER
          // Mainly used for substitutions
          // --------------------------------------------

          related_player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
              position: true,
            },
          },
        },
      });

    // ==================================================
    // 2. EVENT NOT FOUND
    // ==================================================

    if (!event) {
      return res.status(404).json({
        success: false,
        message:
          "Match event not found",
      });
    }

    // ==================================================
    // 3. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: {
        event_id:
          event.event_id,

        event_type:
          event.event_type,

        minute:
          event.minute,

        extra_time:
          event.extra_time,

        description:
          event.description,

        created_at:
          event.created_at,

        match:
          event.match,

        team:
          event.team,

        player:
          event.player,

        related_player:
          event.related_player,
      },
    });
  } catch (error) {
    console.error(
      "Get match event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch match event",
    });
  }
};

// ==================================================
// UPDATE MATCH EVENT
// ==================================================

export const updateMatchEvent = async (
  req,
  res
) => {
  try {
    const eventId =
      Number(req.params.event_id);

    const { description } = req.body;

    // ==================================================
    // 1. FIND EVENT
    // ==================================================

    const event =
      await prisma.matchEvent.findUnique({
        where: {
          event_id: eventId,
        },

        include: {
          match: {
            select: {
              match_id: true,
              status: true,
            },
          },

          team: {
            select: {
              team_id: true,
              owner_id: true,

              club: {
                select: {
                  owner_id: true,
                },
              },
            },
          },
        },
      });

    if (!event) {
      return res.status(404).json({
        success: false,
        message:
          "Match event not found",
      });
    }

    // ==================================================
    // 2. MATCH MUST BE LIVE
    // ==================================================

    if (
      event.match.status !==
      MATCH_STATUS.LIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match events can only be modified while the match is live",
      });
    }

    // ==================================================
    // 3. AUTHORIZATION
    // ==================================================

    const isSuperAdmin =
      req.user.role ===
      ROLES.SUPER_ADMIN;

    const isTeamOwner =
      req.user.role ===
        ROLES.TEAM_OWNER &&
      event.team.owner_id ===
        req.user.user_id;

    const isClubOwner =
      req.user.role ===
        ROLES.CLUB_OWNER &&
      event.team.club.owner_id ===
        req.user.user_id;

    if (
      !isSuperAdmin &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to modify this event",
      });
    }

    // ==================================================
    // 4. UPDATE ONLY DESCRIPTION
    // ==================================================

    const updatedEvent =
      await prisma.matchEvent.update({
        where: {
          event_id: eventId,
        },

        data: {
          description:
            description !== undefined
              ? description
              : event.description,
        },
      });

    // ==================================================
    // 5. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_EVENT_UPDATED,

      entity_type:
        "MATCH_EVENT",

      entity_id:
        updatedEvent.event_id,

      details: {
        action:
          "DESCRIPTION_UPDATED",

        match_id:
          updatedEvent.match_id,

        previous_description:
          event.description,

        new_description:
          updatedEvent.description,
      },
    });

    // ==================================================
    // 6. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Match event updated successfully",

      data: {
        event:
          updatedEvent,
      },
    });
  } catch (error) {
    console.error(
      "Update match event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update match event",
    });
  }
};

// ==================================================
// DELETE MATCH EVENT
// ==================================================

export const deleteMatchEvent = async (
  req,
  res
) => {
  try {
    const eventId =
      Number(req.params.event_id);

    // ==================================================
    // 1. CHECK EVENT
    // ==================================================

    const event =
      await prisma.matchEvent.findUnique({
        where: {
          event_id: eventId,
        },

        select: {
          event_id: true,
          match_id: true,
          event_type: true,
          minute: true,
          team_id: true,
          player_id: true,
          related_player_id: true,

          match: {
            select: {
              match_id: true,
              status: true,
            },
          },
        },
      });

    if (!event) {
      return res.status(404).json({
        success: false,
        message:
          "Match event not found",
      });
    }

    // ==================================================
    // 2. EVENT DELETION IS NOT ALLOWED
    // ==================================================

    return res.status(400).json({
      success: false,
      message:
        "Match events cannot be deleted because removing an event can make the match score and player state inconsistent",
    });
  } catch (error) {
    console.error(
      "Delete match event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process match event deletion",
    });
  }
};