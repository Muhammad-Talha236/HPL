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

    const eventMinute = Number(minute);

    const eventExtraTime =
      extra_time !== undefined &&
      extra_time !== null
        ? Number(extra_time)
        : null;

    /*
     * --------------------------------------------------
     * INITIAL MATCH CHECK
     * --------------------------------------------------
     */

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

    /*
     * Events are only allowed during a LIVE match.
     */
    if (
      match.status !==
      MATCH_STATUS.LIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match events can only be created while the match is live",
      });
    }

    /*
     * A LIVE match must always have started_at.
     */
    if (!match.started_at) {
      return res.status(400).json({
        success: false,
        message:
          "Match start time is missing",
      });
    }

    /*
     * --------------------------------------------------
     * MATCH TIME VALIDATION
     * --------------------------------------------------
     */

    const eventTime = new Date();

    const elapsedMilliseconds =
      eventTime.getTime() -
      match.started_at.getTime();

    /*
     * Important:
     *
     * Do not silently convert a negative elapsed time
     * into zero.
     *
     * If the server clock says the event is being
     * created before the match started, reject it.
     */
    if (
      elapsedMilliseconds < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Event cannot be recorded before the match start time",
      });
    }

    const elapsedMinutes =
      Math.floor(
        elapsedMilliseconds /
          (1000 * 60)
      );

    /*
     * Small tolerance is allowed because the event
     * may reach the server slightly after the actual
     * football minute.
     */
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

    /*
     * Extra time cannot be supplied before the
     * normal 45-minute period.
     */
    if (
      eventExtraTime !== null &&
      eventExtraTime > 0 &&
      eventMinute < 45
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Extra time cannot be recorded before minute 45",
      });
    }

    /*
     * --------------------------------------------------
     * TEAM PARTICIPATION
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * TEAM + OWNERSHIP
     * --------------------------------------------------
     */

    const team =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select: {
          team_id: true,
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

    const isSuperAdmin =
      req.user.role ===
      ROLES.SUPER_ADMIN;

    const isTeamOwner =
      req.user.role ===
        ROLES.TEAM_OWNER &&
      team.owner_id ===
        req.user.user_id;

    const isClubOwner =
      req.user.role ===
        ROLES.CLUB_OWNER &&
      team.club.owner_id ===
        req.user.user_id;

    if (
      !isSuperAdmin &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to create match events for this team",
      });
    }

    /*
     * --------------------------------------------------
     * PLAYER CHECK
     * --------------------------------------------------
     */

    const player =
      await prisma.player.findUnique({
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

    if (
      player.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only active players can be involved in match events",
      });
    }

    /*
     * --------------------------------------------------
     * RELATED PLAYER VALIDATION
     * --------------------------------------------------
     *
     * related_player_id is only meaningful for
     * substitutions.
     */

    if (
      event_type !==
        EVENT_TYPES.SUBSTITUTION &&
      related_player_id !==
        undefined &&
      related_player_id !== null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Related player can only be used for substitutions",
      });
    }

    const relatedPlayerId =
      related_player_id !== undefined &&
      related_player_id !== null
        ? Number(related_player_id)
        : null;

    /*
     * Substitution requires another player.
     */
    if (
      event_type ===
        EVENT_TYPES.SUBSTITUTION &&
      relatedPlayerId === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Related player is required for a substitution",
      });
    }

    /*
     * A player cannot substitute themselves.
     */
    if (
      relatedPlayerId !== null &&
      relatedPlayerId === playerId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A player cannot be substituted with themselves",
      });
    }

    /*
     * --------------------------------------------------
     * TRANSACTION
     * --------------------------------------------------
     *
     * All important match-event state changes happen
     * inside one transaction.
     */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * ------------------------------------------------
           * FRESH MATCH STATE
           * ------------------------------------------------
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
                home_score: true,
                away_score: true,
              },
            });

          if (!currentMatch) {
            throw new Error(
              "MATCH_NOT_FOUND"
            );
          }

          if (
            currentMatch.status !==
            MATCH_STATUS.LIVE
          ) {
            throw new Error(
              "MATCH_NOT_LIVE"
            );
          }

          if (
            !currentMatch.started_at
          ) {
            throw new Error(
              "MATCH_START_TIME_MISSING"
            );
          }

          /*
           * Recalculate time inside the transaction.
           *
           * This protects against the match state
           * changing between the initial query and
           * the transaction.
           */
          const transactionEventTime =
            new Date();

          const transactionElapsed =
            transactionEventTime.getTime() -
            currentMatch.started_at.getTime();

          if (
            transactionElapsed < 0
          ) {
            throw new Error(
              "EVENT_BEFORE_MATCH_START"
            );
          }

          const transactionElapsedMinutes =
            Math.floor(
              transactionElapsed /
                (1000 * 60)
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

          /*
           * Re-check team participation.
           */
          if (
            currentMatch.home_team_id !==
              teamId &&
            currentMatch.away_team_id !==
              teamId
          ) {
            throw new Error(
              "TEAM_NOT_IN_MATCH"
            );
          }

          /*
           * ------------------------------------------------
           * FRESH PLAYER STATE
           * ------------------------------------------------
           */

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
                match_id: true,
                team_id: true,
                player_id: true,
                starting_status: true,
                is_on_field: true,
                entered_at: true,
                exited_at: true,
              },
            });

          if (!matchPlayer) {
            throw new Error(
              "PLAYER_NOT_IN_SQUAD"
            );
          }

          /*
           * The event player must belong to the
           * team creating the event.
           */
          if (
            matchPlayer.team_id !==
            teamId
          ) {
            throw new Error(
              "PLAYER_NOT_IN_TEAM"
            );
          }

          /*
           * ------------------------------------------------
           * NON-SUBSTITUTION EVENTS
           * ------------------------------------------------
           *
           * Goals/cards require the player to
           * currently be on the field.
           */

          if (
            event_type !==
            EVENT_TYPES.SUBSTITUTION
          ) {
            if (
              !matchPlayer.is_on_field
            ) {
              throw new Error(
                "PLAYER_NOT_ON_FIELD"
              );
            }

            if (
              !matchPlayer.entered_at
            ) {
              throw new Error(
                "PLAYER_ENTRY_TIME_MISSING"
              );
            }

            if (
              matchPlayer.entered_at <
              currentMatch.started_at
            ) {
              throw new Error(
                "PLAYER_ENTRY_BEFORE_MATCH"
              );
            }

            if (
              matchPlayer.entered_at >
              transactionEventTime
            ) {
              throw new Error(
                "PLAYER_ENTRY_IN_FUTURE"
              );
            }
          }

          /*
           * ------------------------------------------------
           * SUBSTITUTION
           * ------------------------------------------------
           */

          let relatedMatchPlayer =
            null;

          if (
            event_type ===
            EVENT_TYPES.SUBSTITUTION
          ) {
            /*
             * Incoming player.
             *
             * In our API:
             * player_id = incoming player
             * related_player_id = outgoing player
             */

            relatedMatchPlayer =
              await tx.matchPlayer.findUnique({
                where: {
                  match_id_player_id: {
                    match_id:
                      matchId,
                    player_id:
                      relatedPlayerId,
                  },
                },

                select: {
                  match_player_id: true,
                  match_id: true,
                  team_id: true,
                  player_id: true,
                  starting_status: true,
                  is_on_field: true,
                  entered_at: true,
                  exited_at: true,
                },
              });

            if (
              !relatedMatchPlayer
            ) {
              throw new Error(
                "RELATED_PLAYER_NOT_IN_SQUAD"
              );
            }

            /*
             * Both players must belong to
             * the same team.
             */
            if (
              matchPlayer.team_id !==
                teamId ||
              relatedMatchPlayer.team_id !==
                teamId
            ) {
              throw new Error(
                "SUBSTITUTION_TEAM_MISMATCH"
              );
            }

            /*
             * Incoming player must be a substitute.
             */
            if (
              matchPlayer.starting_status !==
              "SUBSTITUTE"
            ) {
              throw new Error(
                "INCOMING_PLAYER_NOT_SUBSTITUTE"
              );
            }

            /*
             * Incoming player must not already
             * be on the field.
             */
            if (
              matchPlayer.is_on_field
            ) {
              throw new Error(
                "INCOMING_PLAYER_ALREADY_ON_FIELD"
              );
            }

            if (
              matchPlayer.entered_at
            ) {
              throw new Error(
                "INCOMING_PLAYER_ALREADY_ENTERED"
              );
            }

            /*
             * Outgoing player must currently
             * be on the field.
             */
            if (
              !relatedMatchPlayer.is_on_field
            ) {
              throw new Error(
                "OUTGOING_PLAYER_NOT_ON_FIELD"
              );
            }

            if (
              !relatedMatchPlayer.entered_at
            ) {
              throw new Error(
                "OUTGOING_PLAYER_ENTRY_TIME_MISSING"
              );
            }

            if (
              relatedMatchPlayer.entered_at <
              currentMatch.started_at
            ) {
              throw new Error(
                "OUTGOING_PLAYER_ENTRY_BEFORE_MATCH"
              );
            }

            if (
              relatedMatchPlayer.entered_at >
              transactionEventTime
            ) {
              throw new Error(
                "OUTGOING_PLAYER_ENTRY_IN_FUTURE"
              );
            }

            /*
             * Outgoing player must not already
             * have an exit time.
             */
            if (
              relatedMatchPlayer.exited_at
            ) {
              throw new Error(
                "OUTGOING_PLAYER_ALREADY_EXITED"
              );
            }

            /*
             * Close the outgoing player.
             */
            const outgoingUpdate =
              await tx.matchPlayer.updateMany({
                where: {
                  match_player_id:
                    relatedMatchPlayer.match_player_id,

                  is_on_field: true,

                  exited_at: null,
                },

                data: {
                  is_on_field:
                    false,

                  exited_at:
                    transactionEventTime,

                  minutes_played:
                    Math.max(
                      0,
                      Math.floor(
                        (
                          transactionEventTime.getTime() -
                          relatedMatchPlayer
                            .entered_at
                            .getTime()
                        ) /
                          (1000 * 60)
                      )
                    ),
                },
              });

            if (
              outgoingUpdate.count !==
              1
            ) {
              throw new Error(
                "OUTGOING_PLAYER_STATE_CHANGED"
              );
            }

            /*
             * Put incoming player on the field.
             */
            const incomingUpdate =
              await tx.matchPlayer.updateMany({
                where: {
                  match_player_id:
                    matchPlayer.match_player_id,

                  starting_status:
                    "SUBSTITUTE",

                  is_on_field: false,

                  entered_at: null,
                },

                data: {
                  is_on_field:
                    true,

                  entered_at:
                    transactionEventTime,

                  exited_at: null,

                  minutes_played: 0,
                },
              });

            if (
              incomingUpdate.count !==
              1
            ) {
              throw new Error(
                "INCOMING_PLAYER_STATE_CHANGED"
              );
            }
          }

          /*
           * ------------------------------------------------
           * CREATE EVENT
           * ------------------------------------------------
           */

          const createdEvent =
            await tx.matchEvent.create({
              data: {
                match_id:
                  matchId,

                team_id:
                  teamId,

                player_id:
                  playerId,

                related_player_id:
                  relatedPlayerId,

                event_type:
                  event_type,

                minute:
                  eventMinute,

                extra_time:
                  eventExtraTime,

                description:
                  description !==
                  undefined
                    ? description
                    : null,
              },

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
              },
            });

          /*
           * ------------------------------------------------
           * GOAL SCORE UPDATE
           * ------------------------------------------------
           *
           * Score is controlled by the server.
           * Client never sends the new score.
           */

          if (
            event_type ===
            EVENT_TYPES.GOAL
          ) {
            if (
              teamId ===
              currentMatch.home_team_id
            ) {
              await tx.match.updateMany({
                where: {
                  match_id:
                    matchId,

                  status:
                    MATCH_STATUS.LIVE,
                },

                data: {
                  home_score: {
                    increment: 1,
                  },
                },
              });
            } else if (
              teamId ===
              currentMatch.away_team_id
            ) {
              await tx.match.updateMany({
                where: {
                  match_id:
                    matchId,

                  status:
                    MATCH_STATUS.LIVE,
                },

                data: {
                  away_score: {
                    increment: 1,
                  },
                },
              });
            } else {
              throw new Error(
                "TEAM_NOT_IN_MATCH"
              );
            }
          }

          /*
           * ------------------------------------------------
           * RED CARD
           * ------------------------------------------------
           *
           * A red-carded player leaves the field.
           */

          if (
            event_type ===
            EVENT_TYPES.RED_CARD
          ) {
            const redCardUpdate =
              await tx.matchPlayer.updateMany({
                where: {
                  match_player_id:
                    matchPlayer.match_player_id,

                  is_on_field: true,

                  exited_at: null,
                },

                data: {
                  is_on_field:
                    false,

                  exited_at:
                    transactionEventTime,

                  minutes_played:
                    Math.max(
                      0,
                      Math.floor(
                        (
                          transactionEventTime.getTime() -
                          matchPlayer
                            .entered_at
                            .getTime()
                        ) /
                          (1000 * 60)
                      )
                    ),
                },
              });

            if (
              redCardUpdate.count !==
              1
            ) {
              throw new Error(
                "RED_CARD_PLAYER_STATE_CHANGED"
              );
            }
          }

          /*
           * ------------------------------------------------
           * FINAL MATCH STATE
           * ------------------------------------------------
           */

          const finalMatch =
            await tx.match.findUnique({
              where: {
                match_id:
                  matchId,
              },

              select: {
                match_id: true,
                status: true,
                home_score: true,
                away_score: true,
                started_at: true,
              },
            });

          return {
            event:
              createdEvent,

            match:
              finalMatch,
          };
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
        AUDIT_ACTIONS.MATCH_EVENT_CREATED,

      entity_type:
        "MATCH_EVENT",

      entity_id:
        result.event.event_id,

      details: {
        match_id:
          result.event.match_id,

        team_id:
          result.event.team_id,

        player_id:
          result.event.player_id,

        related_player_id:
          result.event.related_player_id,

        event_type:
          result.event.event_type,

        minute:
          result.event.minute,

        extra_time:
          result.event.extra_time,

        home_score:
          result.match.home_score,

        away_score:
          result.match.away_score,
      },
    });

    return res.status(201).json({
      success: true,

      message:
        "Match event created successfully",

      data: {
        event:
          result.event,

        match: {
          match_id:
            result.match.match_id,

          status:
            result.match.status,

          home_score:
            result.match.home_score,

          away_score:
            result.match.away_score,

          started_at:
            result.match.started_at,
        },
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
      "MATCH_NOT_LIVE"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match is no longer live",
      });
    }

    if (
      error.message ===
      "MATCH_START_TIME_MISSING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match start time is missing",
      });
    }

    if (
      error.message ===
      "EVENT_BEFORE_MATCH_START"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Event cannot be recorded before the match start time",
      });
    }

    if (
      error.message ===
      "EVENT_MINUTE_AHEAD"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Event minute cannot be ahead of the current match time",
      });
    }

    if (
      error.message ===
      "TEAM_NOT_IN_MATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This team is not participating in the selected match",
      });
    }

    if (
      error.message ===
      "PLAYER_NOT_IN_SQUAD"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Player is not included in this match squad",
      });
    }

    if (
      error.message ===
      "PLAYER_NOT_IN_TEAM"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Player does not belong to the selected team in this match",
      });
    }

    if (
      error.message ===
      "PLAYER_NOT_ON_FIELD"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Player must currently be on the field for this event",
      });
    }

    if (
      error.message ===
      "PLAYER_ENTRY_TIME_MISSING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Player entry time is missing",
      });
    }

    if (
      error.message ===
      "PLAYER_ENTRY_BEFORE_MATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Player entry time cannot be before the match started",
      });
    }

    if (
      error.message ===
      "PLAYER_ENTRY_IN_FUTURE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Player entry time cannot be in the future",
      });
    }

    if (
      error.message ===
      "RELATED_PLAYER_NOT_IN_SQUAD"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Related player is not included in this match squad",
      });
    }

    if (
      error.message ===
      "SUBSTITUTION_TEAM_MISMATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Both substitution players must belong to the same team",
      });
    }

    if (
      error.message ===
      "INCOMING_PLAYER_NOT_SUBSTITUTE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incoming player must be a substitute",
      });
    }

    if (
      error.message ===
      "INCOMING_PLAYER_ALREADY_ON_FIELD"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incoming player is already on the field",
      });
    }

    if (
      error.message ===
      "INCOMING_PLAYER_ALREADY_ENTERED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incoming player has already entered the match",
      });
    }

    if (
      error.message ===
      "OUTGOING_PLAYER_NOT_ON_FIELD"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Outgoing player must currently be on the field",
      });
    }

    if (
      error.message ===
      "OUTGOING_PLAYER_ENTRY_TIME_MISSING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Outgoing player entry time is missing",
      });
    }

    if (
      error.message ===
      "OUTGOING_PLAYER_ENTRY_BEFORE_MATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Outgoing player entry time cannot be before the match started",
      });
    }

    if (
      error.message ===
      "OUTGOING_PLAYER_ENTRY_IN_FUTURE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Outgoing player entry time cannot be in the future",
      });
    }

    if (
      error.message ===
      "OUTGOING_PLAYER_ALREADY_EXITED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Outgoing player has already left the field",
      });
    }

    if (
      error.message ===
      "OUTGOING_PLAYER_STATE_CHANGED" ||
      error.message ===
      "INCOMING_PLAYER_STATE_CHANGED" ||
      error.message ===
      "RED_CARD_PLAYER_STATE_CHANGED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Player state changed while processing the event. Please refresh the match and try again",
      });
    }

    console.error(
      "Create match event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create match event",
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
    // ==================================================
    // 1. VALIDATE MATCH ID
    // ==================================================

    const matchId =
      Number(req.params.match_id);

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
    // 2. CHECK MATCH
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
        message:
          "Match not found",
      });
    }

    // ==================================================
    // 3. GET MATCH EVENTS
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
          {
            event_id: "asc",
          },
        ],

        select: {
          event_id: true,

          team_id: true,

          player_id: true,
          related_player_id: true,

          event_type: true,

          minute: true,
          extra_time: true,

          description: true,

          created_at: true,

          // ==================================================
          // EVENT TEAM
          // ==================================================

          team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
            },
          },

          // ==================================================
          // MAIN PLAYER
          // ==================================================

          player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
              position: true,
            },
          },

          // ==================================================
          // RELATED PLAYER
          // Mainly used for substitutions
          // ==================================================

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
    // 4. FORMAT EVENTS
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
                  event.related_player
                    .name,

                profile_photo:
                  event.related_player
                    .profile_photo,

                position:
                  event.related_player
                    .position,
              }
            : null,
      }));

    // ==================================================
    // 5. RESPONSE
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
    // ==================================================
    // 1. VALIDATE EVENT ID
    // ==================================================

    const eventId =
      Number(req.params.event_id);

    if (
      !Number.isInteger(eventId) ||
      eventId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Event ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. GET EVENT
    // ==================================================

    const event =
      await prisma.matchEvent.findUnique({
        where: {
          event_id: eventId,
        },

        select: {
          // ==================================================
          // EVENT INFORMATION
          // ==================================================

          event_id: true,

          team_id: true,

          player_id: true,
          related_player_id: true,

          event_type: true,

          minute: true,
          extra_time: true,

          description: true,

          created_at: true,

          // ==================================================
          // MATCH
          // ==================================================

          match: {
            select: {
              match_id: true,

              match_date: true,
              start_time: true,
              started_at: true,

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

          // ==================================================
          // EVENT TEAM
          // ==================================================

          team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
            },
          },

          // ==================================================
          // MAIN PLAYER
          // ==================================================

          player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
              position: true,
            },
          },

          // ==================================================
          // RELATED PLAYER
          // Mainly used for substitutions
          // ==================================================

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
    // 3. EVENT NOT FOUND
    // ==================================================

    if (!event) {
      return res.status(404).json({
        success: false,
        message:
          "Match event not found",
      });
    }

    // ==================================================
    // 4. RESPONSE
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

export const updateMatchEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.event_id);
    const { description } = req.body;

    const event = await prisma.matchEvent.findUnique({
      where: {
        event_id: eventId,
      },
      select: {
        event_id: true,
        match_id: true,
        description: true,

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
        message: "Match event not found",
      });
    }

    if (event.match.status !== MATCH_STATUS.LIVE) {
      return res.status(400).json({
        success: false,
        message:
          "Match events can only be modified while the match is live",
      });
    }

    const isSuperAdmin =
      req.user.role === ROLES.SUPER_ADMIN;

    const isTeamOwner =
      req.user.role === ROLES.TEAM_OWNER &&
      event.team.owner_id === req.user.user_id;

    const isClubOwner =
      req.user.role === ROLES.CLUB_OWNER &&
      event.team.club.owner_id === req.user.user_id;

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

    const updatedEvent = await prisma.$transaction(
      async (tx) => {
        /*
         * Re-check the match state inside the transaction.
         *
         * This protects against a race condition where:
         *
         * Request A:
         *   checks match = LIVE
         *
         * Request B:
         *   completes the match
         *
         * Request A:
         *   tries to update the event
         *
         * The second check prevents Request A from
         * modifying an event after the match is completed.
         */
        const currentEvent =
          await tx.matchEvent.findUnique({
            where: {
              event_id: eventId,
            },
            select: {
              event_id: true,
              match_id: true,
              description: true,
              match: {
                select: {
                  status: true,
                },
              },
            },
          });

        if (!currentEvent) {
          throw new Error(
            "EVENT_NOT_FOUND"
          );
        }

        if (
          currentEvent.match.status !==
          MATCH_STATUS.LIVE
        ) {
          throw new Error(
            "MATCH_NOT_LIVE"
          );
        }

        const updateResult =
          await tx.matchEvent.updateMany({
            where: {
              event_id: eventId,

              /*
               * Extra protection:
               * update only if the event still belongs
               * to a currently LIVE match.
               */
              match: {
                status: MATCH_STATUS.LIVE,
              },
            },

            data: {
              description:
                description !== undefined
                  ? description
                  : currentEvent.description,
            },
          });

        if (updateResult.count !== 1) {
          throw new Error(
            "EVENT_UPDATE_CONFLICT"
          );
        }

        return await tx.matchEvent.findUnique({
          where: {
            event_id: eventId,
          },
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
            updated_at: true,
          },
        });
      }
    );

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

    return res.status(200).json({
      success: true,

      message:
        "Match event updated successfully",

      data: {
        event: updatedEvent,
      },
    });
  } catch (error) {
    if (
      error.message ===
      "EVENT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Match event not found",
      });
    }

    if (
      error.message ===
        "MATCH_NOT_LIVE" ||
      error.message ===
        "EVENT_UPDATE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match event could not be updated because the match state changed",
      });
    }

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