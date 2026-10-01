import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { ROLES } from "../../constants/roles.js";
// ======================================================
// CREATE MATCH PLAYER
// ======================================================

export const createMatchPlayer = async (req, res) => {
  try {
    const {
      match_id,
      team_id,
      player_id,
      starting_status,
      position,
      shirt_number,
    } = req.body;

    const matchId = Number(match_id);
    const teamId = Number(team_id);
    const playerId = Number(player_id);

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
        competition_id: true,
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

    if (
      match.status !==
      MATCH_STATUS.SCHEDULED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match squad can only be modified while the match is scheduled",
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

    const team = await prisma.team.findUnique({
      where: {
        team_id: teamId,
      },

      select: {
        team_id: true,
        owner_id: true,
        gender: true,

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

    /*
     * --------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------
     */

    const isSuperAdmin =
      req.user.role === ROLES.SUPER_ADMIN;

    const isTeamOwner =
      req.user.role === ROLES.TEAM_OWNER &&
      team.owner_id === req.user.user_id;

    const isClubOwner =
      req.user.role === ROLES.CLUB_OWNER &&
      team.club.owner_id === req.user.user_id;

    if (
      !isSuperAdmin &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to manage this team's match squad",
      });
    }

    /*
     * --------------------------------------------------
     * PLAYER CHECK
     * --------------------------------------------------
     */

    const player = await prisma.player.findUnique({
      where: {
        player_id: playerId,
      },

      select: {
        player_id: true,
        name: true,
        gender: true,
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
          "Only active players can be added to a match squad",
      });
    }

    if (
      player.gender !== team.gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Player gender does not match the team",
      });
    }

    /*
     * --------------------------------------------------
     * TEAM MEMBERSHIP
     * --------------------------------------------------
     */

    const teamPlayer =
      await prisma.teamPlayer.findUnique({
        where: {
          team_id_player_id: {
            team_id: teamId,
            player_id: playerId,
          },
        },

        select: {
          team_player_id: true,
          status: true,
          left_at: true,
        },
      });

    if (!teamPlayer) {
      return res.status(400).json({
        success: false,
        message:
          "Player is not registered with this team",
      });
    }

    if (
      teamPlayer.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Player is not currently active for this team",
      });
    }

    if (teamPlayer.left_at) {
      return res.status(400).json({
        success: false,
        message:
          "Player is no longer a member of this team",
      });
    }

    /*
     * --------------------------------------------------
     * TRANSACTION
     * --------------------------------------------------
     */

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Get fresh match state.
         */
        const currentMatch =
          await tx.match.findUnique({
            where: {
              match_id: matchId,
            },

            select: {
              match_id: true,
              status: true,
              competition_id: true,
              home_team_id: true,
              away_team_id: true,

              competition: {
                select: {
                  competition_id: true,
                  squad_size: true,
                },
              },
            },
          });

        if (!currentMatch) {
          throw new Error(
            "MATCH_NOT_FOUND"
          );
        }

        /*
         * Match must still be scheduled.
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
         * Verify team still belongs to match.
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
         * --------------------------------------------------
         * COMPETITION SQUAD SIZE
         * --------------------------------------------------
         */

        const configuredSquadSize =
          currentMatch.competition
            .squad_size;

        /*
         * If competition has no configured
         * squad size, use a safe default.
         */
        const MAX_DEFAULT_SQUAD_SIZE = 23;

        const maxSquadSize =
          configuredSquadSize ??
          MAX_DEFAULT_SQUAD_SIZE;

        /*
         * Invalid configuration should never
         * silently allow unlimited players.
         */
        if (
          !Number.isInteger(
            maxSquadSize
          ) ||
          maxSquadSize < 11
        ) {
          throw new Error(
            "INVALID_SQUAD_SIZE_CONFIGURATION"
          );
        }

        /*
         * --------------------------------------------------
         * DUPLICATE PLAYER
         * --------------------------------------------------
         */

        const existingPlayer =
          await tx.matchPlayer.findUnique({
            where: {
              match_id_player_id: {
                match_id: matchId,
                player_id: playerId,
              },
            },

            select: {
              match_player_id: true,
            },
          });

        if (existingPlayer) {
          throw new Error(
            "PLAYER_ALREADY_IN_SQUAD"
          );
        }

        /*
         * --------------------------------------------------
         * CURRENT SQUAD SIZE
         * --------------------------------------------------
         */

        const squadCount =
          await tx.matchPlayer.count({
            where: {
              match_id: matchId,
              team_id: teamId,
            },
          });

        if (
          squadCount >=
          maxSquadSize
        ) {
          throw new Error(
            "SQUAD_LIMIT_REACHED"
          );
        }

        /*
         * --------------------------------------------------
         * STARTER LIMIT
         * --------------------------------------------------
         */

        if (
          starting_status ===
          "STARTER"
        ) {
          const starterCount =
            await tx.matchPlayer.count({
              where: {
                match_id: matchId,
                team_id: teamId,
                starting_status:
                  "STARTER",
              },
            });

          if (
            starterCount >= 11
          ) {
            throw new Error(
              "STARTER_LIMIT_REACHED"
            );
          }
        }

        /*
         * --------------------------------------------------
         * SHIRT NUMBER
         * --------------------------------------------------
         */

        if (
          shirt_number !== undefined &&
          shirt_number !== null
        ) {
          const existingShirt =
            await tx.matchPlayer.findFirst({
              where: {
                match_id: matchId,
                team_id: teamId,
                shirt_number:
                  Number(shirt_number),
              },

              select: {
                match_player_id: true,
              },
            });

          if (existingShirt) {
            throw new Error(
              "SHIRT_NUMBER_ALREADY_USED"
            );
          }
        }

        /*
         * --------------------------------------------------
         * CREATE MATCH PLAYER
         * --------------------------------------------------
         */

        const matchPlayer =
          await tx.matchPlayer.create({
            data: {
              match_id: matchId,
              team_id: teamId,
              player_id: playerId,

              starting_status:
                starting_status,

              is_on_field: false,

              entered_at: null,

              exited_at: null,

              minutes_played: 0,

              position:
                position !== undefined
                  ? position
                  : null,

              shirt_number:
                shirt_number !== undefined
                  ? Number(shirt_number)
                  : null,
            },

            include: {
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
          });

        return {
          matchPlayer,
          squadCount:
            squadCount + 1,
          maxSquadSize,
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
        AUDIT_ACTIONS.MATCH_PLAYER_ADDED,

      entity_type:
        "MATCH_PLAYER",

      entity_id:
        result.matchPlayer
          .match_player_id,

      details: {
        match_id:
          result.matchPlayer.match_id,

        team_id:
          result.matchPlayer.team_id,

        player_id:
          result.matchPlayer.player_id,

        starting_status:
          result.matchPlayer
            .starting_status,

        shirt_number:
          result.matchPlayer
            .shirt_number,

        squad_size:
          result.squadCount,

        max_squad_size:
          result.maxSquadSize,
      },
    });

    return res.status(201).json({
      success: true,

      message:
        "Player added to match squad successfully",

      data: {
        match_player:
          result.matchPlayer,

        squad: {
          current:
            result.squadCount,

          maximum:
            result.maxSquadSize,
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
        message: "Match not found",
      });
    }

    if (
      error.message ===
      "MATCH_NOT_SCHEDULED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match squad can no longer be modified because the match is no longer scheduled",
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
      "INVALID_SQUAD_SIZE_CONFIGURATION"
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Competition squad size configuration is invalid",
      });
    }

    if (
      error.message ===
      "PLAYER_ALREADY_IN_SQUAD"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Player is already included in this match squad",
      });
    }

    if (
      error.message ===
      "SQUAD_LIMIT_REACHED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum squad size for this competition has been reached",
      });
    }

    if (
      error.message ===
      "STARTER_LIMIT_REACHED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A team cannot have more than 11 starters",
      });
    }

    if (
      error.message ===
      "SHIRT_NUMBER_ALREADY_USED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This shirt number is already assigned to another player in the squad",
      });
    }

    if (
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Player is already assigned to this match squad",
      });
    }

    console.error(
      "Create match player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add player to match squad",
    });
  }
};

export const getMatchSquad = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE IDS
    // ==================================================

    const matchId =
      Number(req.params.match_id);

    const teamId =
      Number(req.params.team_id);

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

    if (
      !Number.isInteger(teamId) ||
      teamId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team ID must be a positive integer",
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

          started_at: true,

          home_team_id: true,
          away_team_id: true,

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
    // 3. TEAM MUST BE PART OF MATCH
    // ==================================================

    if (
      match.home_team_id !==
        teamId &&
      match.away_team_id !==
        teamId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This team is not participating in the selected match",
      });
    }

    // ==================================================
    // 4. GET MATCH SQUAD
    // ==================================================

    const squad =
      await prisma.matchPlayer.findMany({
        where: {
          match_id: matchId,

          team_id: teamId,
        },

        orderBy: [
          {
            starting_status:
              "asc",
          },

          {
            shirt_number:
              "asc",
          },

          {
            match_player_id:
              "asc",
          },
        ],

        select: {
          // ==================================================
          // MATCH PLAYER
          // ==================================================

          match_player_id: true,

          match_id: true,
          team_id: true,
          player_id: true,

          starting_status: true,

          // ==================================================
          // LIVE PLAYER STATE
          // ==================================================

          is_on_field: true,

          entered_at: true,

          exited_at: true,

          minutes_played: true,

          // ==================================================
          // PLAYER MATCH INFORMATION
          // ==================================================

          position: true,

          shirt_number: true,

          created_at: true,

          updated_at: true,

          // ==================================================
          // PLAYER
          // ==================================================

          player: {
            select: {
              player_id: true,

              name: true,

              profile_photo: true,

              position: true,

              registration_number:
                true,

              gender: true,

              status: true,
            },
          },
        },
      });

    // ==================================================
    // 5. CALCULATE SQUAD COUNTS
    // ==================================================

    const starters =
      squad.filter(
        (player) =>
          player.starting_status ===
          "STARTER"
      );

    const substitutes =
      squad.filter(
        (player) =>
          player.starting_status ===
          "SUBSTITUTE"
      );

    const playersOnField =
      squad.filter(
        (player) =>
          player.is_on_field ===
          true
      );

    // ==================================================
    // 6. DETERMINE SELECTED TEAM
    // ==================================================

    const selectedTeam =
      match.home_team_id ===
      teamId
        ? match.home_team
        : match.away_team;

    // ==================================================
    // 7. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: {
        match: {
          match_id:
            match.match_id,

          status:
            match.status,

          started_at:
            match.started_at,

          home_team:
            match.home_team,

          away_team:
            match.away_team,
        },

        team:
          selectedTeam,

        team_id:
          teamId,

        squad: {
          total:
            squad.length,

          starters:
            starters.length,

          substitutes:
            substitutes.length,

          players_on_field:
            playersOnField.length,

          players:
            squad,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get match squad error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch match squad",
    });
  }
};

export const updateMatchPlayer = async (req, res) => {
  try {
    const matchPlayerId = Number(
      req.params.match_player_id
    );

    const {
      starting_status,
      position,
      shirt_number,
    } = req.body;

    /*
     * --------------------------------------------------
     * INITIAL MATCH PLAYER CHECK
     * --------------------------------------------------
     */

    const matchPlayer =
      await prisma.matchPlayer.findUnique({
        where: {
          match_player_id:
            matchPlayerId,
        },

        select: {
          match_player_id: true,
          match_id: true,
          team_id: true,
          player_id: true,
          starting_status: true,
          shirt_number: true,
          position: true,

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

    if (!matchPlayer) {
      return res.status(404).json({
        success: false,
        message:
          "Match player not found",
      });
    }

    /*
     * Squad can only be modified before
     * the match starts.
     */
    if (
      matchPlayer.match.status !==
      MATCH_STATUS.SCHEDULED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match squad can only be modified while the match is scheduled",
      });
    }

    /*
     * --------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------
     */

    const isSuperAdmin =
      req.user.role ===
      ROLES.SUPER_ADMIN;

    const isTeamOwner =
      req.user.role ===
        ROLES.TEAM_OWNER &&
      matchPlayer.team.owner_id ===
        req.user.user_id;

    const isClubOwner =
      req.user.role ===
        ROLES.CLUB_OWNER &&
      matchPlayer.team.club.owner_id ===
        req.user.user_id;

    if (
      !isSuperAdmin &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this match player",
      });
    }

    /*
     * --------------------------------------------------
     * TRANSACTION
     * --------------------------------------------------
     */

    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Fresh match-player state.
         */
        const currentPlayer =
          await tx.matchPlayer.findUnique({
            where: {
              match_player_id:
                matchPlayerId,
            },

            select: {
              match_player_id: true,
              match_id: true,
              team_id: true,
              player_id: true,
              starting_status: true,
              shirt_number: true,
              position: true,

              match: {
                select: {
                  match_id: true,
                  status: true,
                },
              },
            },
          });

        if (!currentPlayer) {
          throw new Error(
            "MATCH_PLAYER_NOT_FOUND"
          );
        }

        /*
         * Match must still be scheduled.
         */
        if (
          currentPlayer.match.status !==
          MATCH_STATUS.SCHEDULED
        ) {
          throw new Error(
            "MATCH_NOT_SCHEDULED"
          );
        }

        /*
         * --------------------------------------------------
         * STARTER LIMIT
         * --------------------------------------------------
         *
         * Only check the limit when the player is
         * actually being changed to STARTER.
         */
        if (
          starting_status ===
            "STARTER" &&
          currentPlayer.starting_status !==
            "STARTER"
        ) {
          const starterCount =
            await tx.matchPlayer.count({
              where: {
                match_id:
                  currentPlayer.match_id,

                team_id:
                  currentPlayer.team_id,

                starting_status:
                  "STARTER",
              },
            });

          if (
            starterCount >= 11
          ) {
            throw new Error(
              "STARTER_LIMIT_REACHED"
            );
          }
        }

        /*
         * --------------------------------------------------
         * SHIRT NUMBER
         * --------------------------------------------------
         */

        if (
          shirt_number !== undefined &&
          shirt_number !== null
        ) {
          const requestedShirtNumber =
            Number(shirt_number);

          /*
           * Check whether another player in
           * the same team and match already
           * owns this shirt number.
           */
          const existingShirt =
            await tx.matchPlayer.findFirst({
              where: {
                match_id:
                  currentPlayer.match_id,

                team_id:
                  currentPlayer.team_id,

                shirt_number:
                  requestedShirtNumber,

                NOT: {
                  match_player_id:
                    matchPlayerId,
                },
              },

              select: {
                match_player_id: true,
              },
            });

          if (existingShirt) {
            throw new Error(
              "SHIRT_NUMBER_ALREADY_USED"
            );
          }
        }

        /*
         * --------------------------------------------------
         * SAFE UPDATE DATA
         * --------------------------------------------------
         *
         * Never allow the client to modify:
         *
         * is_on_field
         * entered_at
         * exited_at
         * minutes_played
         * match_id
         * team_id
         * player_id
         */
        const updateData = {};

        if (
          starting_status !==
          undefined
        ) {
          updateData.starting_status =
            starting_status;
        }

        if (
          position !== undefined
        ) {
          updateData.position =
            position;
        }

        if (
          shirt_number !== undefined
        ) {
          updateData.shirt_number =
            shirt_number !== null
              ? Number(shirt_number)
              : null;
        }

        /*
         * Prevent an empty update.
         */
        if (
          Object.keys(updateData)
            .length === 0
        ) {
          throw new Error(
            "NO_UPDATE_FIELDS"
          );
        }

        /*
         * --------------------------------------------------
         * UPDATE
         * --------------------------------------------------
         */

        const updated =
          await tx.matchPlayer.updateMany({
            where: {
              match_player_id:
                matchPlayerId,

              /*
               * Important concurrency protection:
               * only update while match is still
               * scheduled.
               */
              match: {
                status:
                  MATCH_STATUS.SCHEDULED,
              },
            },

            data: updateData,
          });

        if (updated.count !== 1) {
          throw new Error(
            "MATCH_PLAYER_UPDATE_CONFLICT"
          );
        }

        /*
         * Return final state.
         */
        const updatedPlayer =
          await tx.matchPlayer.findUnique({
            where: {
              match_player_id:
                matchPlayerId,
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
              minutes_played: true,
              position: true,
              shirt_number: true,
              created_at: true,
              updated_at: true,

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
          });

        return updatedPlayer;
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
        AUDIT_ACTIONS.MATCH_PLAYER_UPDATED,

      entity_type:
        "MATCH_PLAYER",

      entity_id:
        result.match_player_id,

      details: {
        match_id:
          result.match_id,

        team_id:
          result.team_id,

        player_id:
          result.player_id,

        previous_starting_status:
          matchPlayer.starting_status,

        new_starting_status:
          result.starting_status,

        previous_position:
          matchPlayer.position,

        new_position:
          result.position,

        previous_shirt_number:
          matchPlayer.shirt_number,

        new_shirt_number:
          result.shirt_number,
      },
    });

    return res.status(200).json({
      success: true,

      message:
        "Match player updated successfully",

      data: {
        match_player:
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
      "MATCH_PLAYER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Match player not found",
      });
    }

    if (
      error.message ===
      "MATCH_NOT_SCHEDULED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match squad can no longer be modified because the match is no longer scheduled",
      });
    }

    if (
      error.message ===
      "STARTER_LIMIT_REACHED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A team cannot have more than 11 starters",
      });
    }

    if (
      error.message ===
      "SHIRT_NUMBER_ALREADY_USED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This shirt number is already assigned to another player in the squad",
      });
    }

    if (
      error.message ===
      "NO_UPDATE_FIELDS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field must be provided for update",
      });
    }

    if (
      error.message ===
      "MATCH_PLAYER_UPDATE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Match player could not be updated because the match state changed",
      });
    }

    if (
      error.code ===
      "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This match player information conflicts with an existing record",
      });
    }

    console.error(
      "Update match player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update match player",
    });
  }
};
export const removeMatchPlayer = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE MATCH PLAYER ID
    // ==================================================

    const matchPlayerId =
      Number(req.params.match_player_id);

    if (
      !Number.isInteger(
        matchPlayerId
      ) ||
      matchPlayerId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Match player ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. FIND MATCH PLAYER
    // ==================================================

    const existingMatchPlayer =
      await prisma.matchPlayer.findUnique({
        where: {
          match_player_id:
            matchPlayerId,
        },

        select: {
          match_player_id: true,

          match_id: true,

          team_id: true,

          player_id: true,

          starting_status: true,

          shirt_number: true,

          position: true,

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

          player: {
            select: {
              player_id: true,

              name: true,
            },
          },
        },
      });

    if (!existingMatchPlayer) {
      return res.status(404).json({
        success: false,
        message:
          "Match player not found",
      });
    }

    // ==================================================
    // 3. MATCH MUST STILL BE SCHEDULED
    // ==================================================

    if (
      existingMatchPlayer.match
        .status !==
      MATCH_STATUS.SCHEDULED
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Players can only be removed before the match starts",
      });
    }

    // ==================================================
    // 4. OWNERSHIP AUTHORIZATION
    // ==================================================

    const isSuperAdmin =
      req.user.role ===
      ROLES.SUPER_ADMIN;

    const isTeamOwner =
      req.user.role ===
        ROLES.TEAM_OWNER &&
      existingMatchPlayer.team
        .owner_id ===
        req.user.user_id;

    const isClubOwner =
      req.user.role ===
        ROLES.CLUB_OWNER &&
      existingMatchPlayer.team
        .club.owner_id ===
        req.user.user_id;

    if (
      !isSuperAdmin &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to remove this match player",
      });
    }

    // ==================================================
    // 5. DELETE WITH STATE PROTECTION
    // ==================================================

    const deleteResult =
      await prisma.$transaction(
        async (tx) => {
          const deleteOperation =
            await tx.matchPlayer.deleteMany(
              {
                where: {
                  match_player_id:
                    matchPlayerId,

                  match: {
                    status:
                      MATCH_STATUS.SCHEDULED,
                  },
                },
              }
            );

          if (
            deleteOperation.count !==
            1
          ) {
            throw new Error(
              "MATCH_PLAYER_DELETE_CONFLICT"
            );
          }

          return deleteOperation;
        }
      );

    // ==================================================
    // 6. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_PLAYER_REMOVED,

      entity_type:
        "MATCH_PLAYER",

      entity_id:
        matchPlayerId,

      details: {
        match_id:
          existingMatchPlayer.match_id,

        team_id:
          existingMatchPlayer.team_id,

        player_id:
          existingMatchPlayer.player_id,

        player_name:
          existingMatchPlayer.player
            ?.name ?? null,

        starting_status:
          existingMatchPlayer
            .starting_status,

        shirt_number:
          existingMatchPlayer
            .shirt_number,

        position:
          existingMatchPlayer
            .position,

        previous_match_status:
          existingMatchPlayer.match
            .status,
      },
    });

    // ==================================================
    // 7. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Player removed from match squad successfully",

      data: {
        match_player_id:
          matchPlayerId,

        match_id:
          existingMatchPlayer.match_id,

        team_id:
          existingMatchPlayer.team_id,

        player_id:
          existingMatchPlayer.player_id,
      },
    });
  } catch (error) {
    // ==================================================
    // MATCH PLAYER DELETE CONFLICT
    // ==================================================

    if (
      error.message ===
      "MATCH_PLAYER_DELETE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Player could not be removed because the match has already started or the match player no longer exists",
      });
    }

    // ==================================================
    // UNEXPECTED ERROR
    // ==================================================

    console.error(
      "Remove match player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove match player",
    });
  }
};