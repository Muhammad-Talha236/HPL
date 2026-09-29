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
    // 3. TEAM MUST BE PART OF MATCH
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
    // 4. CHECK TEAM
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
    // 5. CHECK PLAYER
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
    // 6. PLAYER MUST BE IN MATCH SQUAD
    // ==================================================

    const matchPlayer =
      await prisma.matchPlayer.findUnique({
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
        },
      });

    if (!matchPlayer) {
      return res.status(400).json({
        success: false,
        message:
          "Player is not selected for this match",
      });
    }

    if (matchPlayer.team_id !== teamId) {
      return res.status(400).json({
        success: false,
        message:
          "Player does not belong to the selected match team",
      });
    }

    // ==================================================
    // 7. VERIFY USER CAN MANAGE MATCH EVENTS
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
    // 8. SUBSTITUTION VALIDATION
    // ==================================================

    let incomingMatchPlayer = null;

    if (
      event_type === EVENT_TYPES.SUBSTITUTION
    ) {
      if (!relatedPlayerId) {
        return res.status(400).json({
          success: false,
          message:
            "A substitution requires a player coming into the match",
        });
      }

      if (relatedPlayerId === playerId) {
        return res.status(400).json({
          success: false,
          message:
            "Substitution players must be different",
        });
      }

      incomingMatchPlayer =
        await prisma.matchPlayer.findUnique({
          where: {
            match_id_player_id: {
              match_id: matchId,
              player_id: relatedPlayerId,
            },
          },

          select: {
            match_player_id: true,
            team_id: true,
            starting_status: true,
            is_on_field: true,
          },
        });

      if (!incomingMatchPlayer) {
        return res.status(400).json({
          success: false,
          message:
            "Incoming player is not selected for this match",
        });
      }

      if (
        incomingMatchPlayer.team_id !==
        teamId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Incoming player does not belong to this team",
        });
      }

      if (
        incomingMatchPlayer.starting_status !==
        "SUBSTITUTE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Incoming player must be a substitute",
        });
      }

      // Incoming player must currently be off the field
      if (incomingMatchPlayer.is_on_field) {
        return res.status(400).json({
          success: false,
          message:
            "Incoming player is already on the field",
        });
      }

      // Outgoing player must currently be on the field
      if (!matchPlayer.is_on_field) {
        return res.status(400).json({
          success: false,
          message:
            "Outgoing player is not currently on the field",
        });
      }
    }

    // ==================================================
    // 9. RELATED PLAYER MUST NOT BE USED
    //    FOR NON-SUBSTITUTION EVENTS
    // ==================================================

    if (
      event_type !== EVENT_TYPES.SUBSTITUTION &&
      relatedPlayerId !== null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Related player can only be used for substitutions",
      });
    }

    // ==================================================
    // 10. CREATE EVENT + UPDATE MATCH STATE
    // ==================================================

    const result = await prisma.$transaction(
      async (tx) => {
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
            match.home_team_id
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
        // SUBSTITUTION → UPDATE PLAYER STATES
        // ==========================================

        if (
          event_type ===
          EVENT_TYPES.SUBSTITUTION
        ) {
          // OUT → no longer on field
          await tx.matchPlayer.update({
            where: {
              match_player_id:
                matchPlayer.match_player_id,
            },

            data: {
              is_on_field: false,
            },
          });

          // IN → now on field
          await tx.matchPlayer.update({
            where: {
              match_player_id:
                incomingMatchPlayer.match_player_id,
            },

            data: {
              is_on_field: true,
            },
          });
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
      },
    });

    // ==================================================
    // RESPONSE
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

    const match =
      await prisma.match.findUnique({
        where: {
          match_id: matchId,
        },

        select: {
          match_id: true,
          status: true,
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
          team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
            },
          },

          player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
            },
          },

          related_player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,

      match: {
        match_id: match.match_id,
        status: match.status,
        home_score: match.home_score,
        away_score: match.away_score,
      },

      count: events.length,

      events,
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

    const event =
      await prisma.matchEvent.findUnique({
        where: {
          event_id: eventId,
        },

        include: {
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

          team: {
            select: {
              team_id: true,
              name: true,
              logo: true,
            },
          },

          player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
            },
          },

          related_player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
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

    return res.status(200).json({
      success: true,
      event,
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

    const event =
      await prisma.matchEvent.findUnique({
        where: {
          event_id: eventId,
        },

        include: {
          match: true,

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

    // Completed/cancelled matches cannot be modified
    if (
      event.match.status ===
        MATCH_STATUS.COMPLETED ||
      event.match.status ===
        MATCH_STATUS.CANCELLED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Events cannot be modified after match completion or cancellation",
      });
    }

    // ==================================================
    // AUTHORIZATION
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
    // UPDATE
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
    // AUDIT
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
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Match event updated successfully",
      event: updatedEvent,
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

    const event =
      await prisma.matchEvent.findUnique({
        where: {
          event_id: eventId,
        },

        include: {
          match: true,

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

    // Completed/cancelled matches cannot be modified
    if (
      event.match.status ===
        MATCH_STATUS.COMPLETED ||
      event.match.status ===
        MATCH_STATUS.CANCELLED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Events cannot be deleted after match completion or cancellation",
      });
    }

    // ==================================================
    // AUTHORIZATION
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
          "You do not have permission to delete this event",
      });
    }

    // ==================================================
    // DELETE + RESTORE MATCH STATE
    // ==================================================

    await prisma.$transaction(
      async (tx) => {
        // ==============================================
        // GOAL → DECREASE SCORE
        // ==============================================

        if (
          event.event_type ===
          EVENT_TYPES.GOAL
        ) {
          if (
            event.team_id ===
            event.match.home_team_id
          ) {
            await tx.match.update({
              where: {
                match_id:
                  event.match_id,
              },

              data: {
                home_score: {
                  decrement: 1,
                },
              },
            });
          } else if (
            event.team_id ===
            event.match.away_team_id
          ) {
            await tx.match.update({
              where: {
                match_id:
                  event.match_id,
              },

              data: {
                away_score: {
                  decrement: 1,
                },
              },
            });
          }
        }

        // ==============================================
        // SUBSTITUTION
        // ==============================================

        if (
          event.event_type ===
          EVENT_TYPES.SUBSTITUTION
        ) {
          // Player who came IN goes back to bench
          await tx.matchPlayer.updateMany({
            where: {
              match_id:
                event.match_id,

              player_id:
                event.related_player_id,
            },

            data: {
              is_on_field: false,
            },
          });

          // Player who went OUT returns to field
          await tx.matchPlayer.updateMany({
            where: {
              match_id:
                event.match_id,

              player_id:
                event.player_id,
            },

            data: {
              is_on_field: true,
            },
          });
        }

        // ==============================================
        // DELETE EVENT
        // ==============================================

        await tx.matchEvent.delete({
          where: {
            event_id: eventId,
          },
        });
      }
    );

    // ==================================================
    // AUDIT
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_EVENT_DELETED,

      entity_type:
        "MATCH_EVENT",

      entity_id: eventId,

      details: {
        match_id:
          event.match_id,

        event_type:
          event.event_type,

        team_id:
          event.team_id,

        player_id:
          event.player_id,

        related_player_id:
          event.related_player_id,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Match event deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete match event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete match event",
    });
  }
};