import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { ROLES } from "../../constants/roles.js";
// ======================================================
// CREATE MATCH PLAYER
// ======================================================

export const createMatchPlayer = async (
  req,
  res
) => {
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

          competition: {
            select: {
              competition_id: true,
              squad_size: true,
              gender: true,
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
    // 2. MATCH MUST NOT BE COMPLETED/CANCELLED
    // ==================================================

    if (
      match.status === "COMPLETED" ||
      match.status === "CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Players cannot be added to a completed or cancelled match",
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

    const team =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select: {
          team_id: true,
          name: true,
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

    if (team.gender !== match.competition.gender) {
      return res.status(400).json({
        success: false,
        message:
          "Team gender does not match the competition gender",
      });
    }

    // ==================================================
    // 5. CHECK PLAYER
    // ==================================================

    const player =
      await prisma.player.findUnique({
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
          "Player is not active",
      });
    }

    // ==================================================
    // 6. VERIFY PLAYER GENDER
    // ==================================================

    if (player.gender !== team.gender) {
      return res.status(400).json({
        success: false,
        message:
          "Player gender does not match the team gender",
      });
    }

    // ==================================================
    // 7. VERIFY PLAYER BELONGS TO TEAM
    // ==================================================

    const teamPlayer =
      await prisma.teamPlayer.findFirst({
        where: {
          team_id: teamId,
          player_id: playerId,
          status: "ACTIVE",
        },
      });

    if (!teamPlayer) {
      return res.status(403).json({
        success: false,
        message:
          "This player does not belong to the selected team",
      });
    }

    // ==================================================
    // 8. VERIFY USER CAN MANAGE TEAM SQUAD
    // ==================================================

    const isSuperAdmin =
      req.user.role === "SUPER_ADMIN";

    const isTeamOwner =
      team.owner_id ===
      req.user.user_id;

    const isClubOwner =
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
          "You do not have permission to manage this team's squad",
      });
    }

    // ==================================================
    // 9. CHECK DUPLICATE PLAYER
    // ==================================================

    const existingMatchPlayer =
      await prisma.matchPlayer.findUnique({
        where: {
          match_id_player_id: {
            match_id: matchId,
            player_id: playerId,
          },
        },
      });

    if (existingMatchPlayer) {
      return res.status(409).json({
        success: false,
        message:
          "Player is already selected for this match",
      });
    }

    // ==================================================
    // 10. CHECK SQUAD SIZE LIMIT
    // ==================================================

    if (
      match.competition.squad_size !== null
    ) {
      const squadCount =
        await prisma.matchPlayer.count({
          where: {
            match_id: matchId,
            team_id: teamId,
          },
        });

      if (
        squadCount >=
        match.competition.squad_size
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Maximum squad size of ${match.competition.squad_size} players has been reached`,
        });
      }
    }

    // ==================================================
    // 11. CHECK SHIRT NUMBER
    // ==================================================

    if (
      shirt_number !== undefined &&
      shirt_number !== null
    ) {
      const existingShirtNumber =
        await prisma.matchPlayer.findFirst({
          where: {
            match_id: matchId,
            team_id: teamId,
            shirt_number:
              Number(shirt_number),
          },
        });

      if (existingShirtNumber) {
        return res.status(409).json({
          success: false,
          message:
            "This shirt number is already assigned in this match",
        });
      }
    }

    // ==================================================
    // 12. CHECK STARTING XI LIMIT
    // ==================================================

    if (
      starting_status === "STARTER"
    ) {
      const starterCount =
        await prisma.matchPlayer.count({
          where: {
            match_id: matchId,
            team_id: teamId,
            starting_status: "STARTER",
          },
        });

      if (starterCount >= 11) {
        return res.status(400).json({
          success: false,
          message:
            "A team cannot have more than 11 starting players",
        });
      }
    }

    // ==================================================
    // 13. CREATE MATCH PLAYER
    // ==================================================

const matchPlayer =
  await prisma.matchPlayer.create({
    data: {
      match_id: matchId,

      team_id: teamId,

      player_id: playerId,

      starting_status:
        starting_status,

      is_on_field:
        starting_status === "STARTER",

      position:
        position?.trim() || null,

      shirt_number:
        shirt_number !== undefined &&
        shirt_number !== null
          ? Number(shirt_number)
          : null,

      minutes_played: 0,
    },

    include: {
      player: {
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
    // 14. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.MATCH_PLAYER_ADDED,

      entity_type:
        "MATCH_PLAYER",

      entity_id:
        matchPlayer.match_player_id,

      details: {
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
        starting_status:
          starting_status,
      },
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message:
        "Player added to match successfully",
      data: matchPlayer,
    });

  } catch (error) {
    console.error(
      "Create match player error:",
      error
    );

    if (
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Player is already selected for this match",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while adding the player to the match",
    });
  }
};

export const getMatchSquad = async (
  req,
  res
) => {
  try {
    const matchId = Number(
      req.params.match_id
    );

    const teamId = Number(
      req.params.team_id
    );

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

          competition: {
            select: {
              competition_id: true,
              name: true,
              squad_size: true,
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
    // 2. VERIFY TEAM IS IN MATCH
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
    // 3. CHECK TEAM
    // ==================================================

    const team =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select: {
          team_id: true,
          name: true,
          gender: true,
          logo: true,
        },
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
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

        select: {
          match_player_id: true,
          starting_status: true,
          position: true,
          shirt_number: true,
          minutes_played: true,

          player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
              position: true,
              registration_number: true,
            },
          },
        },

        orderBy: [
          {
            starting_status: "asc",
          },
          {
            shirt_number: "asc",
          },
        ],
      });

    // ==================================================
    // 5. SEPARATE STARTERS & SUBSTITUTES
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

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: {
        match: {
          match_id: match.match_id,
          status: match.status,
          competition:
            match.competition,
        },

        team,

        squad: {
          total_players: squad.length,
          starters_count:
            starters.length,
          substitutes_count:
            substitutes.length,

          starters,
          substitutes,
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
        "Something went wrong while fetching the match squad",
    });
  }
};

export const updateMatchPlayer = async (req, res) => {
  try {
    const matchPlayerId = Number(req.params.match_player_id);

    const {
      starting_status,
      position,
      shirt_number,
      minutes_played,
    } = req.body;

    const existingMatchPlayer =
      await prisma.matchPlayer.findUnique({
        where: {
          match_player_id: matchPlayerId,
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

    if (!existingMatchPlayer) {
      return res.status(404).json({
        success: false,
        message: "Match player not found",
      });
    }

    const { match, team } = existingMatchPlayer;

    // Completed/cancelled matches cannot be modified
    if (
      match.status === "COMPLETED" ||
      match.status === "CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Players cannot be modified after the match is completed or cancelled",
      });
    }

    // Ownership authorization
    const isSuperAdmin =
      req.user.role === ROLES.SUPER_ADMIN;

    const isTeamOwner =
      req.user.user_id === team.owner_id;

    const isClubOwner =
      req.user.user_id === team.club.owner_id;

    if (
      !isSuperAdmin &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to modify this match player",
      });
    }

    // Check duplicate shirt number
    if (shirt_number !== undefined && shirt_number !== null) {
      const duplicateShirtNumber =
        await prisma.matchPlayer.findFirst({
          where: {
            match_id: match.match_id,
            team_id: team.team_id,
            shirt_number: Number(shirt_number),
            match_player_id: {
              not: matchPlayerId,
            },
          },
        });

      if (duplicateShirtNumber) {
        return res.status(409).json({
          success: false,
          message:
            "This shirt number is already assigned to another player in this match",
        });
      }
    }

    // Only 11 starters allowed
    if (starting_status === "STARTER") {
      const starterCount =
        await prisma.matchPlayer.count({
          where: {
            match_id: match.match_id,
            team_id: team.team_id,
            starting_status: "STARTER",
            match_player_id: {
              not: matchPlayerId,
            },
          },
        });

      if (starterCount >= 11) {
        return res.status(400).json({
          success: false,
          message:
            "A team cannot have more than 11 starting players",
        });
      }
    }

    const updateData = {};

    if (starting_status !== undefined) {
      updateData.starting_status =
        starting_status;
    }

    if (position !== undefined) {
      updateData.position = position;
    }

    if (shirt_number !== undefined) {
      updateData.shirt_number =
        shirt_number === null
          ? null
          : Number(shirt_number);
    }

    if (minutes_played !== undefined) {
      updateData.minutes_played =
        minutes_played === null
          ? null
          : Number(minutes_played);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    const updatedMatchPlayer =
      await prisma.matchPlayer.update({
        where: {
          match_player_id: matchPlayerId,
        },
        data: updateData,
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              profile_photo: true,
              position: true,
              registration_number: true,
            },
          },
        },
      });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.MATCH_PLAYER_UPDATED,
      entity_type: "MATCH_PLAYER",
      entity_id: matchPlayerId,
      details: {
        match_id: match.match_id,
        team_id: team.team_id,
        player_id:
          existingMatchPlayer.player_id,
        changes: updateData,
      },
    });

    return res.json({
      success: true,
      message: "Match player updated successfully",
      data: updatedMatchPlayer,
    });
  } catch (error) {
    console.error(
      "Update match player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update match player",
    });
  }
};


export const removeMatchPlayer = async (req, res) => {
  try {
    const matchPlayerId =
      Number(req.params.match_player_id);

    const existingMatchPlayer =
      await prisma.matchPlayer.findUnique({
        where: {
          match_player_id: matchPlayerId,
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

    if (!existingMatchPlayer) {
      return res.status(404).json({
        success: false,
        message: "Match player not found",
      });
    }

    const { match, team } =
      existingMatchPlayer;

    if (
      match.status === "COMPLETED" ||
      match.status === "CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Players cannot be removed after the match is completed or cancelled",
      });
    }

    const isSuperAdmin =
      req.user.role === ROLES.SUPER_ADMIN;

    const isTeamOwner =
      req.user.user_id === team.owner_id;

    const isClubOwner =
      req.user.user_id === team.club.owner_id;

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

    await prisma.matchPlayer.delete({
      where: {
        match_player_id: matchPlayerId,
      },
    });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.MATCH_PLAYER_REMOVED,
      entity_type: "MATCH_PLAYER",
      entity_id: matchPlayerId,
      details: {
        match_id: match.match_id,
        team_id: team.team_id,
        player_id:
          existingMatchPlayer.player_id,
      },
    });

    return res.json({
      success: true,
      message:
        "Player removed from match squad successfully",
    });
  } catch (error) {
    console.error(
      "Remove match player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to remove match player",
    });
  }
};