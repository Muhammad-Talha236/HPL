import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { ROLES } from "../../constants/roles.js";

const TEAM_PLAYER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const TEAM_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const CLUB_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const PLAYER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const teamPlayerSelect = {
  team_player_id: true,
  team_id: true,
  player_id: true,
  jersey_number: true,
  joined_at: true,
  left_at: true,
  status: true,
  created_at: true,
  updated_at: true,

  team: {
    select: {
      team_id: true,
      name: true,
      gender: true,
      status: true,
      club_id: true,
      owner_id: true,
    },
  },

  player: {
    select: {
      player_id: true,
      name: true,
      gender: true,
      position: true,
      registration_number: true,
      status: true,
    },
  },
};

/*
  Check whether the authenticated user
  can manage a particular team.

  SUPER_ADMIN:
  Can manage every team.

  TEAM_OWNER:
  Can manage only their own team.

  CLUB_OWNER:
  Can manage teams belonging
  to their club.
*/
const canManageTeam = ({
  req,
  team,
}) => {
  if (
    req.user.role ===
    ROLES.SUPER_ADMIN
  ) {
    return true;
  }

  if (
    req.user.role ===
      ROLES.TEAM_OWNER &&
    team.owner_id ===
      req.user.user_id
  ) {
    return true;
  }

  if (
    req.user.role ===
      ROLES.CLUB_OWNER &&
    team.club?.owner_id ===
      req.user.user_id
  ) {
    return true;
  }

  return false;
};

/*
  Team gender must match player gender.

  MEN   -> MALE
  WOMEN -> FEMALE
*/
const isGenderCompatible = (
  teamGender,
  playerGender
) => {
  if (teamGender === "MEN") {
    return playerGender === "MALE";
  }

  if (teamGender === "WOMEN") {
    return playerGender === "FEMALE";
  }

  return false;
};

/*
  GET ALL TEAM PLAYER RECORDS

  Public endpoint.
*/
export const getTeamPlayers = async (
  req,
  res
) => {
  try {
    const teamPlayers =
      await prisma.teamPlayer.findMany({
        select: teamPlayerSelect,
        orderBy: {
          created_at: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: teamPlayers,
    });
  } catch (error) {
    console.error(
      "Get team players error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching team players",
    });
  }
};

/*
  GET ACTIVE TEAM SQUAD

  Public endpoint.
*/
export const getTeamSquad = async (
  req,
  res
) => {
  try {
    const teamId =
      Number(req.params.team_id);

    const team =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },
        select: {
          team_id: true,
          name: true,
          gender: true,
          status: true,
        },
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const squad =
      await prisma.teamPlayer.findMany({
        where: {
          team_id: teamId,
          status:
            TEAM_PLAYER_STATUS.ACTIVE,
        },
        select: teamPlayerSelect,
        orderBy: [
          {
            jersey_number: "asc",
          },
          {
            created_at: "asc",
          },
        ],
      });

    return res.status(200).json({
      success: true,
      data: squad,
    });
  } catch (error) {
    console.error(
      "Get team squad error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the team squad",
    });
  }
};

/*
  GET TEAM PLAYER BY ID

  Public endpoint.
*/
export const getTeamPlayerById =
  async (req, res) => {
    try {
      const teamPlayerId =
        Number(
          req.params.team_player_id
        );

      const teamPlayer =
        await prisma.teamPlayer.findUnique({
          where: {
            team_player_id:
              teamPlayerId,
          },
          select: teamPlayerSelect,
        });

      if (!teamPlayer) {
        return res.status(404).json({
          success: false,
          message:
            "Team player record not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: teamPlayer,
      });
    } catch (error) {
      console.error(
        "Get team player error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while fetching the team player",
      });
    }
  };

/*
  CREATE TEAM PLAYER

  Adds an existing Player to a Team.

  Security:
  - authenticated user
  - RBAC through routes
  - ownership / IDOR protection
  - active team
  - active club
  - active player
  - gender compatibility
  - duplicate relationship protection
  - jersey number conflict protection
  - Serializable transaction
*/
export const createTeamPlayer =
  async (req, res) => {
    try {
      const teamId =
        Number(req.body.team_id);

      const playerId =
        Number(req.body.player_id);

      const jerseyNumber =
        req.body.jersey_number !==
          undefined &&
        req.body.jersey_number !== null
          ? Number(
              req.body.jersey_number
            )
          : null;

      const joinedAt =
        new Date(
          req.body.joined_at
        );

      const leftAt =
        req.body.left_at !==
          undefined &&
        req.body.left_at !== null
          ? new Date(
              req.body.left_at
            )
          : null;

      /*
        Defense-in-depth date checks.
      */
      if (
        Number.isNaN(
          joinedAt.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Joined date is invalid",
        });
      }

      if (
        leftAt &&
        Number.isNaN(
          leftAt.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Left date is invalid",
        });
      }

      if (
        leftAt &&
        leftAt < joinedAt
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Left date cannot be before joined date",
        });
      }

      const result =
        await prisma.$transaction(
          async (tx) => {
            const team =
              await tx.team.findUnique({
                where: {
                  team_id: teamId,
                },
                select: {
                  team_id: true,
                  name: true,
                  gender: true,
                  status: true,
                  club_id: true,
                  owner_id: true,
                  club: {
                    select: {
                      club_id: true,
                      owner_id: true,
                      status: true,
                    },
                  },
                },
              });

            if (!team) {
              return {
                error:
                  "TEAM_NOT_FOUND",
              };
            }

            if (
              !canManageTeam({
                req,
                team,
              })
            ) {
              return {
                error: "FORBIDDEN",
              };
            }

            if (
              team.status !==
              TEAM_STATUS.ACTIVE
            ) {
              return {
                error:
                  "TEAM_INACTIVE",
              };
            }

            if (
              !team.club ||
              team.club.status !==
                CLUB_STATUS.ACTIVE
            ) {
              return {
                error:
                  "CLUB_INACTIVE",
              };
            }

            const player =
              await tx.player.findUnique({
                where: {
                  player_id: playerId,
                },
                select: {
                  player_id: true,
                  name: true,
                  gender: true,
                  status: true,
                  registration_number:
                    true,
                },
              });

            if (!player) {
              return {
                error:
                  "PLAYER_NOT_FOUND",
              };
            }

            if (
              player.status !==
              PLAYER_STATUS.ACTIVE
            ) {
              return {
                error:
                  "PLAYER_INACTIVE",
              };
            }

            if (
              !isGenderCompatible(
                team.gender,
                player.gender
              )
            ) {
              return {
                error:
                  "GENDER_MISMATCH",
              };
            }

            /*
              Prisma schema already has:

              @@unique([team_id, player_id])

              So duplicate relationship is
              also protected at database level.
            */
            const existing =
              await tx.teamPlayer.findUnique(
                {
                  where: {
                    team_id_player_id: {
                      team_id: teamId,
                      player_id: playerId,
                    },
                  },
                  select: {
                    team_player_id:
                      true,
                    status: true,
                  },
                }
              );

            if (existing) {
              return {
                error:
                  existing.status ===
                  TEAM_PLAYER_STATUS.ACTIVE
                    ? "ALREADY_ACTIVE"
                    : "ALREADY_EXISTS_INACTIVE",
              };
            }

            /*
              Jersey numbers must be unique
              among ACTIVE players of the team.
            */
            if (
              jerseyNumber !== null
            ) {
              const jerseyConflict =
                await tx.teamPlayer.findFirst(
                  {
                    where: {
                      team_id: teamId,
                      jersey_number:
                        jerseyNumber,
                      status:
                        TEAM_PLAYER_STATUS.ACTIVE,
                    },
                    select: {
                      team_player_id:
                        true,
                    },
                  }
                );

              if (jerseyConflict) {
                return {
                  error:
                    "JERSEY_NUMBER_TAKEN",
                };
              }
            }

            const teamPlayer =
              await tx.teamPlayer.create({
                data: {
                  team_id: teamId,
                  player_id: playerId,
                  jersey_number:
                    jerseyNumber,
                  joined_at:
                    joinedAt,
                  left_at:
                    leftAt,
                  status:
                    TEAM_PLAYER_STATUS.ACTIVE,
                },
                select:
                  teamPlayerSelect,
              });

            return {
              teamPlayer,
            };
          },
          {
            isolationLevel:
              "Serializable",
          }
        );

      if (result.error) {
        switch (result.error) {
          case "TEAM_NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Team not found",
            });

          case "FORBIDDEN":
            return res.status(403).json({
              success: false,
              message:
                "You do not have permission to manage this team's players",
            });

          case "TEAM_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot add a player to an inactive team",
            });

          case "CLUB_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot add a player to a team belonging to an inactive club",
            });

          case "PLAYER_NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Player not found",
            });

          case "PLAYER_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot add an inactive player to a team",
            });

          case "GENDER_MISMATCH":
            return res.status(400).json({
              success: false,
              message:
                "Player gender does not match team gender",
            });

          case "ALREADY_ACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Player is already part of this team",
            });

          case "ALREADY_EXISTS_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "An inactive roster record already exists for this player and team",
            });

          case "JERSEY_NUMBER_TAKEN":
            return res.status(409).json({
              success: false,
              message:
                "This jersey number is already assigned to an active player in this team",
            });

          default:
            break;
        }
      }

      await createAuditLog({
        actor_user_id:
          req.user.user_id,
        action:
          AUDIT_ACTIONS.TEAM_PLAYER_ADDED,
        entity_type:
          "TEAM_PLAYER",
        entity_id:
          result.teamPlayer
            .team_player_id,
        details: {
          team_id:
            result.teamPlayer.team_id,
          player_id:
            result.teamPlayer.player_id,
          jersey_number:
            result.teamPlayer
              .jersey_number,
        },
      });

      return res.status(201).json({
        success: true,
        message:
          "Player added to team successfully",
        data:
          result.teamPlayer,
      });
    } catch (error) {
      if (
        error.code === "P2002"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This player is already associated with this team",
        });
      }

      if (
        error.code === "P2034"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Roster was modified by another request. Please try again.",
        });
      }

      console.error(
        "Create team player error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while adding the player to the team",
      });
    }
  };

/*
  UPDATE TEAM PLAYER

  Only:
  - jersey_number
  - joined_at
  - left_at

  team_id, player_id and status
  cannot be changed.

  Jersey conflict check and update
  happen inside the SAME transaction.
*/
export const updateTeamPlayer =
  async (req, res) => {
    try {
      const teamPlayerId =
        Number(
          req.params.team_player_id
        );

      const {
        jersey_number,
        joined_at,
        left_at,
      } = req.body;

      const result =
        await prisma.$transaction(
          async (tx) => {
            const existing =
              await tx.teamPlayer.findUnique(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                  },
                  select: {
                    team_player_id:
                      true,
                    team_id: true,
                    player_id: true,
                    jersey_number:
                      true,
                    joined_at: true,
                    left_at: true,
                    status: true,
                    team: {
                      select: {
                        team_id: true,
                        owner_id: true,
                        club_id: true,
                        status: true,
                        club: {
                          select: {
                            owner_id:
                              true,
                            status:
                              true,
                          },
                        },
                      },
                    },
                  },
                }
              );

            if (!existing) {
              return {
                error:
                  "NOT_FOUND",
              };
            }

            if (
              !canManageTeam({
                req,
                team: existing.team,
              })
            ) {
              return {
                error:
                  "FORBIDDEN",
              };
            }

            if (
              existing.team.status !==
              TEAM_STATUS.ACTIVE
            ) {
              return {
                error:
                  "TEAM_INACTIVE",
              };
            }

            if (
              !existing.team.club ||
              existing.team.club.status !==
                CLUB_STATUS.ACTIVE
            ) {
              return {
                error:
                  "CLUB_INACTIVE",
              };
            }

            const player =
              await tx.player.findUnique({
                where: {
                  player_id:
                    existing.player_id,
                },
                select: {
                  player_id: true,
                  gender: true,
                  status: true,
                },
              });

            if (!player) {
              return {
                error:
                  "PLAYER_NOT_FOUND",
              };
            }

            if (
              player.status !==
              PLAYER_STATUS.ACTIVE
            ) {
              return {
                error:
                  "PLAYER_INACTIVE",
              };
            }

            /*
              Re-check gender compatibility
              because player/team data may
              have changed since the relationship
              was created.
            */
            const team =
              await tx.team.findUnique({
                where: {
                  team_id:
                    existing.team_id,
                },
                select: {
                  gender: true,
                },
              });

            if (
              !team ||
              !isGenderCompatible(
                team.gender,
                player.gender
              )
            ) {
              return {
                error:
                  "GENDER_MISMATCH",
              };
            }

            const finalJoinedAt =
              joined_at !== undefined
                ? new Date(joined_at)
                : existing.joined_at;

            const finalLeftAt =
              left_at !== undefined
                ? left_at === null
                  ? null
                  : new Date(left_at)
                : existing.left_at;

            if (
              Number.isNaN(
                finalJoinedAt.getTime()
              )
            ) {
              return {
                error:
                  "INVALID_JOINED_DATE",
              };
            }

            if (
              finalLeftAt &&
              Number.isNaN(
                finalLeftAt.getTime()
              )
            ) {
              return {
                error:
                  "INVALID_LEFT_DATE",
              };
            }

            if (
              finalLeftAt &&
              finalLeftAt <
                finalJoinedAt
            ) {
              return {
                error:
                  "INVALID_DATE_RANGE",
              };
            }

            const updateData = {};

            if (
              jersey_number !==
              undefined
            ) {
              updateData.jersey_number =
                jersey_number === null
                  ? null
                  : Number(
                      jersey_number
                    );
            }

            if (
              joined_at !== undefined
            ) {
              updateData.joined_at =
                finalJoinedAt;
            }

            if (
              left_at !== undefined
            ) {
              updateData.left_at =
                finalLeftAt;
            }

            if (
              Object.keys(updateData)
                .length === 0
            ) {
              return {
                error:
                  "NO_FIELDS",
              };
            }

            /*
              Jersey conflict check and
              update are inside one
              Serializable transaction.
            */
            if (
              jersey_number !==
                undefined &&
              jersey_number !== null
            ) {
              const jerseyConflict =
                await tx.teamPlayer.findFirst(
                  {
                    where: {
                      team_id:
                        existing.team_id,
                      jersey_number:
                        Number(
                          jersey_number
                        ),
                      status:
                        TEAM_PLAYER_STATUS.ACTIVE,
                      NOT: {
                        team_player_id:
                          teamPlayerId,
                      },
                    },
                    select: {
                      team_player_id:
                        true,
                    },
                  }
                );

              if (jerseyConflict) {
                return {
                  error:
                    "JERSEY_NUMBER_TAKEN",
                };
              }
            }

            const updated =
              await tx.teamPlayer.updateMany(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                    team_id:
                      existing.team_id,
                    player_id:
                      existing.player_id,
                    status:
                      existing.status,
                  },
                  data: updateData,
                }
              );

            if (
              updated.count === 0
            ) {
              return {
                error:
                  "CONFLICT",
              };
            }

            const teamPlayer =
              await tx.teamPlayer.findUnique(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                  },
                  select:
                    teamPlayerSelect,
                }
              );

            return {
              teamPlayer,
            };
          },
          {
            isolationLevel:
              "Serializable",
          }
        );

      if (result.error) {
        switch (result.error) {
          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Team player record not found",
            });

          case "FORBIDDEN":
            return res.status(403).json({
              success: false,
              message:
                "You do not have permission to manage this team's players",
            });

          case "TEAM_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot update a player in an inactive team",
            });

          case "CLUB_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot update a player in a team belonging to an inactive club",
            });

          case "PLAYER_NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Player not found",
            });

          case "PLAYER_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot update an inactive player",
            });

          case "GENDER_MISMATCH":
            return res.status(400).json({
              success: false,
              message:
                "Player gender does not match team gender",
            });

          case "INVALID_JOINED_DATE":
            return res.status(400).json({
              success: false,
              message:
                "Joined date is invalid",
            });

          case "INVALID_LEFT_DATE":
            return res.status(400).json({
              success: false,
              message:
                "Left date is invalid",
            });

          case "INVALID_DATE_RANGE":
            return res.status(400).json({
              success: false,
              message:
                "Left date cannot be before joined date",
            });

          case "NO_FIELDS":
            return res.status(400).json({
              success: false,
              message:
                "At least one team player field is required",
            });

          case "JERSEY_NUMBER_TAKEN":
            return res.status(409).json({
              success: false,
              message:
                "This jersey number is already assigned to another active player in this team",
            });

          case "CONFLICT":
            return res.status(409).json({
              success: false,
              message:
                "Team player record was modified by another request. Please try again.",
            });

          default:
            break;
        }
      }

      await createAuditLog({
        actor_user_id:
          req.user.user_id,
        action:
          AUDIT_ACTIONS.TEAM_PLAYER_UPDATED,
        entity_type:
          "TEAM_PLAYER",
        entity_id:
          teamPlayerId,
        details: {
          team_id:
            result.teamPlayer.team_id,
          player_id:
            result.teamPlayer.player_id,
          jersey_number:
            result.teamPlayer
              .jersey_number,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "Team player updated successfully",
        data:
          result.teamPlayer,
      });
    } catch (error) {
      if (
        error.code === "P2034"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Roster was modified by another request. Please try again.",
        });
      }

      console.error(
        "Update team player error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while updating the team player",
      });
    }
  };

/*
  REMOVE TEAM PLAYER

  Soft removal:
  status -> INACTIVE
  left_at -> current date

  Historical record remains in database.
*/
export const removeTeamPlayer =
  async (req, res) => {
    try {
      const teamPlayerId =
        Number(
          req.params.team_player_id
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            const existing =
              await tx.teamPlayer.findUnique(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                  },
                  select: {
                    team_player_id:
                      true,
                    team_id: true,
                    player_id: true,
                    status: true,
                    joined_at: true,
                    left_at: true,
                    team: {
                      select: {
                        team_id: true,
                        owner_id: true,
                        club_id: true,
                        status: true,
                        club: {
                          select: {
                            owner_id:
                              true,
                            status:
                              true,
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
                }
              );

            if (!existing) {
              return {
                error:
                  "NOT_FOUND",
              };
            }

            if (
              !canManageTeam({
                req,
                team: existing.team,
              })
            ) {
              return {
                error:
                  "FORBIDDEN",
              };
            }

            if (
              existing.status !==
              TEAM_PLAYER_STATUS.ACTIVE
            ) {
              return {
                error:
                  "ALREADY_INACTIVE",
              };
            }

            const leftAt =
              new Date();

            if (
              leftAt <
              existing.joined_at
            ) {
              return {
                error:
                  "INVALID_DATE",
              };
            }

            const updated =
              await tx.teamPlayer.updateMany(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                    status:
                      TEAM_PLAYER_STATUS.ACTIVE,
                  },
                  data: {
                    status:
                      TEAM_PLAYER_STATUS.INACTIVE,
                    left_at:
                      leftAt,
                  },
                }
              );

            if (
              updated.count === 0
            ) {
              return {
                error:
                  "CONFLICT",
              };
            }

            const teamPlayer =
              await tx.teamPlayer.findUnique(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                  },
                  select:
                    teamPlayerSelect,
                }
              );

            return {
              teamPlayer,
              playerName:
                existing.player
                  .name,
            };
          }
        );

      if (result.error) {
        switch (result.error) {
          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Team player record not found",
            });

          case "FORBIDDEN":
            return res.status(403).json({
              success: false,
              message:
                "You do not have permission to manage this team's players",
            });

          case "ALREADY_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Team player is already inactive",
            });

          case "INVALID_DATE":
            return res.status(400).json({
              success: false,
              message:
                "Player cannot be removed before the joined date",
            });

          case "CONFLICT":
            return res.status(409).json({
              success: false,
              message:
                "Team player was modified by another request. Please try again.",
            });

          default:
            break;
        }
      }

      await createAuditLog({
        actor_user_id:
          req.user.user_id,
        action:
          AUDIT_ACTIONS.TEAM_PLAYER_REMOVED,
        entity_type:
          "TEAM_PLAYER",
        entity_id:
          teamPlayerId,
        details: {
          team_id:
            result.teamPlayer.team_id,
          player_id:
            result.teamPlayer.player_id,
          player_name:
            result.playerName,
          left_at:
            result.teamPlayer.left_at
              ?.toISOString(),
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "Player removed from team successfully",
        data:
          result.teamPlayer,
      });
    } catch (error) {
      if (
        error.code === "P2034"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Roster was modified by another request. Please try again.",
        });
      }

      console.error(
        "Remove team player error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while removing the player from the team",
      });
    }
  };

/*
  ACTIVATE TEAM PLAYER

  Restores an inactive roster relationship.

  Security:
  - ownership
  - active team
  - active club
  - active player
  - gender compatibility
  - jersey conflict
  - Serializable transaction
  - conditional state update
*/
export const activateTeamPlayer =
  async (req, res) => {
    try {
      const teamPlayerId =
        Number(
          req.params.team_player_id
        );

      const result =
        await prisma.$transaction(
          async (tx) => {
            const existing =
              await tx.teamPlayer.findUnique(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                  },
                  select: {
                    team_player_id:
                      true,
                    team_id: true,
                    player_id: true,
                    jersey_number:
                      true,
                    joined_at: true,
                    left_at: true,
                    status: true,
                    team: {
                      select: {
                        team_id: true,
                        name: true,
                        gender: true,
                        owner_id: true,
                        club_id: true,
                        status: true,
                        club: {
                          select: {
                            owner_id:
                              true,
                            status:
                              true,
                          },
                        },
                      },
                    },
                    player: {
                      select: {
                        player_id: true,
                        name: true,
                        gender: true,
                        status: true,
                      },
                    },
                  },
                }
              );

            if (!existing) {
              return {
                error:
                  "NOT_FOUND",
              };
            }

            if (
              !canManageTeam({
                req,
                team: existing.team,
              })
            ) {
              return {
                error:
                  "FORBIDDEN",
              };
            }

            if (
              existing.status ===
              TEAM_PLAYER_STATUS.ACTIVE
            ) {
              return {
                error:
                  "ALREADY_ACTIVE",
              };
            }

            if (
              existing.team.status !==
              TEAM_STATUS.ACTIVE
            ) {
              return {
                error:
                  "TEAM_INACTIVE",
              };
            }

            if (
              !existing.team.club ||
              existing.team.club.status !==
                CLUB_STATUS.ACTIVE
            ) {
              return {
                error:
                  "CLUB_INACTIVE",
              };
            }

            if (
              existing.player.status !==
              PLAYER_STATUS.ACTIVE
            ) {
              return {
                error:
                  "PLAYER_INACTIVE",
              };
            }

            if (
              !isGenderCompatible(
                existing.team.gender,
                existing.player.gender
              )
            ) {
              return {
                error:
                  "GENDER_MISMATCH",
              };
            }

            /*
              Check jersey conflict inside
              the same Serializable transaction.
            */
            if (
              existing.jersey_number !==
              null
            ) {
              const jerseyConflict =
                await tx.teamPlayer.findFirst(
                  {
                    where: {
                      team_id:
                        existing.team_id,
                      jersey_number:
                        existing.jersey_number,
                      status:
                        TEAM_PLAYER_STATUS.ACTIVE,
                      NOT: {
                        team_player_id:
                          teamPlayerId,
                      },
                    },
                    select: {
                      team_player_id:
                        true,
                    },
                  }
                );

              if (jerseyConflict) {
                return {
                  error:
                    "JERSEY_NUMBER_TAKEN",
                };
              }
            }

            const updated =
              await tx.teamPlayer.updateMany(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                    status:
                      TEAM_PLAYER_STATUS.INACTIVE,
                  },
                  data: {
                    status:
                      TEAM_PLAYER_STATUS.ACTIVE,
                    left_at: null,
                  },
                }
              );

            if (
              updated.count === 0
            ) {
              return {
                error:
                  "CONFLICT",
              };
            }

            const teamPlayer =
              await tx.teamPlayer.findUnique(
                {
                  where: {
                    team_player_id:
                      teamPlayerId,
                  },
                  select:
                    teamPlayerSelect,
                }
              );

            return {
              teamPlayer,
            };
          },
          {
            isolationLevel:
              "Serializable",
          }
        );

      if (result.error) {
        switch (result.error) {
          case "NOT_FOUND":
            return res.status(404).json({
              success: false,
              message:
                "Team player record not found",
            });

          case "FORBIDDEN":
            return res.status(403).json({
              success: false,
              message:
                "You do not have permission to manage this team's players",
            });

          case "ALREADY_ACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Team player is already active",
            });

          case "TEAM_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot activate a player in an inactive team",
            });

          case "CLUB_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot activate a player in a team belonging to an inactive club",
            });

          case "PLAYER_INACTIVE":
            return res.status(409).json({
              success: false,
              message:
                "Cannot activate an inactive player",
            });

          case "GENDER_MISMATCH":
            return res.status(400).json({
              success: false,
              message:
                "Player gender does not match team gender",
            });

          case "JERSEY_NUMBER_TAKEN":
            return res.status(409).json({
              success: false,
              message:
                "The player's jersey number is already assigned to another active player in this team",
            });

          case "CONFLICT":
            return res.status(409).json({
              success: false,
              message:
                "Team player was modified by another request. Please try again.",
            });

          default:
            break;
        }
      }

      await createAuditLog({
        actor_user_id:
          req.user.user_id,
        action:
          AUDIT_ACTIONS.TEAM_PLAYER_ACTIVATED,
        entity_type:
          "TEAM_PLAYER",
        entity_id:
          teamPlayerId,
        details: {
          team_id:
            result.teamPlayer.team_id,
          player_id:
            result.teamPlayer.player_id,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "Team player activated successfully",
        data:
          result.teamPlayer,
      });
    } catch (error) {
      if (
        error.code === "P2034"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Roster was modified by another request. Please try again.",
        });
      }

      console.error(
        "Activate team player error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while activating the team player",
      });
    }
  };