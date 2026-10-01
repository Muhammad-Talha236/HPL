import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";

import {
  createAuditLog,
} from "../../utils/auditLog.util.js";

import {
  AUDIT_ACTIONS,
} from "../../constants/auditActions.js";

// ======================================================
// TEAM STATUS
// ======================================================

const TEAM_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ======================================================
// MATCH STATUS
// ======================================================

const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
};

// ======================================================
// TEAM SELECT
// ======================================================

const teamSelect = {
  team_id: true,
  club_id: true,
  owner_id: true,
  home_venue_id: true,

  name: true,
  logo: true,
  gender: true,

  region: true,
  district: true,
  city: true,

  description: true,

  contact_email: true,
  contact_phone: true,

  team_type: true,
  status: true,

  created_at: true,
  updated_at: true,

  club: {
    select: {
      club_id: true,
      name: true,
      logo: true,
    },
  },

  home_venue: {
    select: {
      venue_id: true,
      name: true,
      city: true,
      address: true,
    },
  },
};

// ======================================================
// TEAM OWNERSHIP CHECK
// ======================================================

const canManageTeam = async ({
  req,
  team,
}) => {
  // Super Admin can manage every team
  if (
    req.user.role === ROLES.SUPER_ADMIN
  ) {
    return true;
  }

  // Team Owner can manage own team
  if (
    req.user.role === ROLES.TEAM_OWNER &&
    team.owner_id === req.user.user_id
  ) {
    return true;
  }

  // Club Owner can manage teams
  // belonging to their own club
  if (
    req.user.role === ROLES.CLUB_OWNER
  ) {
    const club =
      await prisma.club.findUnique({
        where: {
          club_id: team.club_id,
        },

        select: {
          owner_id: true,
        },
      });

    return (
      club &&
      club.owner_id === req.user.user_id
    );
  }

  return false;
};

// ======================================================
// CREATE TEAM
// ======================================================

export const createTeam = async (
  req,
  res
) => {
  try {
    const {
      club_id,
      home_venue_id,
      name,
      logo,
      gender,
      region,
      district,
      city,
      description,
      contact_email,
      contact_phone,
      team_type,
    } = req.body;

    const clubId =
      Number(club_id);

    const venueId =
      Number(home_venue_id);

    // --------------------------------------------------
    // FIND CLUB AND VENUE
    // --------------------------------------------------

    const club =
      await prisma.club.findUnique({
        where: {
          club_id: clubId,
        },

        select: {
          club_id: true,
          owner_id: true,
          status: true,
        },
      });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (
      club.status !==
      TEAM_STATUS.ACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot create a team under an inactive club",
      });
    }

    // --------------------------------------------------
    // OWNERSHIP CHECK
    // --------------------------------------------------

    if (
      req.user.role !==
        ROLES.SUPER_ADMIN &&
      club.owner_id !==
        req.user.user_id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only create teams for your own club",
      });
    }

    const venue =
      await prisma.venue.findUnique({
        where: {
          venue_id: venueId,
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
          "Home venue not found",
      });
    }

    if (
      venue.status !==
      TEAM_STATUS.ACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot assign an inactive venue to a team",
      });
    }

    // --------------------------------------------------
    // TEAM OWNER
    // --------------------------------------------------

    const teamOwnerId =
      req.user.role ===
      ROLES.SUPER_ADMIN
        ? club.owner_id
        : req.user.user_id;

    // --------------------------------------------------
    // CREATE WITH TRANSACTION
    // --------------------------------------------------

    try {
      const team =
        await prisma.$transaction(
          async (tx) => {
            const existingTeam =
              await tx.team.findFirst({
                where: {
                  club_id: clubId,
                  name: name.trim(),
                },

                select: {
                  team_id: true,
                },
              });

            if (existingTeam) {
              const error =
                new Error(
                  "TEAM_NAME_EXISTS"
                );

              throw error;
            }

            return tx.team.create({
              data: {
                club_id: clubId,
                owner_id:
                  teamOwnerId,
                home_venue_id:
                  venueId,

                name:
                  name.trim(),

                logo:
                  logo !== undefined &&
                  logo !== null
                    ? logo.trim()
                    : undefined,

                gender:
                  gender.trim(),

                region:
                  region !== undefined &&
                  region !== null
                    ? region.trim()
                    : undefined,

                district:
                  district !== undefined &&
                  district !== null
                    ? district.trim()
                    : undefined,

                city:
                  city !== undefined &&
                  city !== null
                    ? city.trim()
                    : undefined,

                description:
                  description !== undefined &&
                  description !== null
                    ? description.trim()
                    : undefined,

                contact_email:
                  contact_email !== undefined &&
                  contact_email !== null
                    ? contact_email.trim()
                    : undefined,

                contact_phone:
                  contact_phone !== undefined &&
                  contact_phone !== null
                    ? contact_phone.trim()
                    : undefined,

                team_type:
                  team_type.trim(),

                status:
                  TEAM_STATUS.ACTIVE,
              },

              select:
                teamSelect,
            });
          },

          {
            isolationLevel:
              "Serializable",
          }
        );

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS.TEAM_CREATED,

        entity_type: "TEAM",

        entity_id:
          team.team_id,

        details: {
          name:
            team.name,

          club_id:
            team.club_id,

          owner_id:
            team.owner_id,
        },
      });

      return res.status(201).json({
        success: true,
        message:
          "Team created successfully",
        data: team,
      });
    } catch (error) {
      if (
        error.message ===
        "TEAM_NAME_EXISTS"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A team with this name already exists in this club",
        });
      }

      throw error;
    }
  } catch (error) {
    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Team creation conflicted with another request. Please try again.",
      });
    }

    console.error(
      "Create team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the team",
    });
  }
};

// ======================================================
// GET ALL TEAMS
// ======================================================

export const getTeams = async (
  req,
  res
) => {
  try {
    const teams =
      await prisma.team.findMany({
        select:
          teamSelect,

        orderBy: {
          created_at: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error(
      "Get teams error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching teams",
    });
  }
};

// ======================================================
// GET TEAM BY ID
// ======================================================

export const getTeamById = async (
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

        select:
          teamSelect,
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error(
      "Get team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the team",
    });
  }
};

// ======================================================
// UPDATE TEAM
// ======================================================

export const updateTeam = async (
  req,
  res
) => {
  try {
    const teamId =
      Number(req.params.team_id);

    const existingTeam =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select: {
          team_id: true,
          club_id: true,
          owner_id: true,
          home_venue_id: true,
          status: true,
          name: true,
          gender: true,
        },
      });

    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

    const allowed =
      await canManageTeam({
        req,
        team: existingTeam,
      });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this team",
      });
    }

    const {
      home_venue_id,
      name,
      logo,
      gender,
      region,
      district,
      city,
      description,
      contact_email,
      contact_phone,
      team_type,
    } = req.body;

    // --------------------------------------------------
    // BUILD UPDATE DATA
    // --------------------------------------------------

    const updateData = {};

    if (
      home_venue_id !==
      undefined
    ) {
      const venueId =
        Number(home_venue_id);

      const venue =
        await prisma.venue.findUnique({
          where: {
            venue_id: venueId,
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
            "Home venue not found",
        });
      }

      if (
        venue.status !==
        TEAM_STATUS.ACTIVE
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot assign an inactive venue",
        });
      }

      updateData.home_venue_id =
        venueId;
    }

    if (name !== undefined) {
      const trimmedName =
        name.trim();

      // ----------------------------------------------
      // DUPLICATE TEAM NAME CHECK
      // ----------------------------------------------

      const existingName =
        await prisma.team.findFirst({
          where: {
            club_id:
              existingTeam.club_id,

            name:
              trimmedName,

            NOT: {
              team_id:
                teamId,
            },
          },

          select: {
            team_id: true,
          },
        });

      if (existingName) {
        return res.status(409).json({
          success: false,
          message:
            "A team with this name already exists in this club",
        });
      }

      updateData.name =
        trimmedName;
    }

    if (logo !== undefined) {
      updateData.logo =
        logo === null
          ? null
          : logo.trim();
    }

    if (gender !== undefined) {
      updateData.gender =
        gender.trim();
    }

    if (region !== undefined) {
      updateData.region =
        region === null
          ? null
          : region.trim();
    }

    if (district !== undefined) {
      updateData.district =
        district === null
          ? null
          : district.trim();
    }

    if (city !== undefined) {
      updateData.city =
        city === null
          ? null
          : city.trim();
    }

    if (description !== undefined) {
      updateData.description =
        description === null
          ? null
          : description.trim();
    }

    if (
      contact_email !==
      undefined
    ) {
      updateData.contact_email =
        contact_email === null
          ? null
          : contact_email.trim();
    }

    if (
      contact_phone !==
      undefined
    ) {
      updateData.contact_phone =
        contact_phone === null
          ? null
          : contact_phone.trim();
    }

    if (
      team_type !== undefined
    ) {
      updateData.team_type =
        team_type.trim();
    }

    // --------------------------------------------------
    // EMPTY UPDATE
    // --------------------------------------------------

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one team field is required",
      });
    }

    // --------------------------------------------------
    // UPDATE WITH STATE PROTECTION
    // --------------------------------------------------

    const result =
      await prisma.team.updateMany({
        where: {
          team_id: teamId,

          owner_id:
            existingTeam.owner_id,

          club_id:
            existingTeam.club_id,

          status:
            existingTeam.status,
        },

        data:
          updateData,
      });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Team was modified by another request. Please try again.",
      });
    }

    // --------------------------------------------------
    // GET UPDATED TEAM
    // --------------------------------------------------

    const updatedTeam =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select:
          teamSelect,
      });

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        message:
          "Team no longer exists",
      });
    }

    // --------------------------------------------------
    // AUDIT
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.TEAM_UPDATED,

      entity_type:
        "TEAM",

      entity_id:
        teamId,

      details: {
        previous_name:
          existingTeam.name,

        new_name:
          updatedTeam.name,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Team updated successfully",

      data:
        updatedTeam,
    });
  } catch (error) {
    console.error(
      "Update team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the team",
    });
  }
};

// ======================================================
// DEACTIVATE TEAM
// ======================================================

export const deactivateTeam = async (
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
          club_id: true,
          owner_id: true,
          name: true,
          status: true,
        },
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

    const allowed =
      await canManageTeam({
        req,
        team,
      });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to deactivate this team",
      });
    }

    if (
      team.status ===
      TEAM_STATUS.INACTIVE
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Team is already inactive",
      });
    }

    // --------------------------------------------------
    // PROTECT SCHEDULED / LIVE MATCHES
    // --------------------------------------------------

    const activeMatch =
      await prisma.match.findFirst({
        where: {
          OR: [
            {
              home_team_id:
                teamId,
            },
            {
              away_team_id:
                teamId,
            },
          ],

          status: {
            in: [
              MATCH_STATUS.SCHEDULED,
              MATCH_STATUS.LIVE,
            ],
          },
        },

        select: {
          match_id: true,
        },
      });

    if (activeMatch) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot deactivate a team involved in a scheduled or live match",
      });
    }

    // --------------------------------------------------
    // CONDITIONAL UPDATE
    // --------------------------------------------------

    const result =
      await prisma.team.updateMany({
        where: {
          team_id: teamId,
          status:
            TEAM_STATUS.ACTIVE,
        },

        data: {
          status:
            TEAM_STATUS.INACTIVE,
        },
      });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Team status changed before the operation completed. Please try again.",
      });
    }

    const updatedTeam =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select:
          teamSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.TEAM_DEACTIVATED,

      entity_type: "TEAM",

      entity_id:
        teamId,

      details: {
        previous_status:
          TEAM_STATUS.ACTIVE,

        new_status:
          TEAM_STATUS.INACTIVE,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Team deactivated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error(
      "Deactivate team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deactivating the team",
    });
  }
};

// ======================================================
// ACTIVATE TEAM
// ======================================================

export const activateTeam = async (
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
          club_id: true,
          owner_id: true,
          name: true,
          status: true,
        },
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // --------------------------------------------------
    // ONLY SUPER ADMIN
    // --------------------------------------------------

    if (
      req.user.role !==
      ROLES.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Super Admin can activate a team",
      });
    }

    if (
      team.status ===
      TEAM_STATUS.ACTIVE
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Team is already active",
      });
    }

    // --------------------------------------------------
    // CLUB MUST BE ACTIVE
    // --------------------------------------------------

    const club =
      await prisma.club.findUnique({
        where: {
          club_id:
            team.club_id,
        },

        select: {
          club_id: true,
          status: true,
        },
      });

    if (!club) {
      return res.status(404).json({
        success: false,
        message:
          "Team's club not found",
      });
    }

    if (
      club.status !==
      TEAM_STATUS.ACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot activate a team under an inactive club",
      });
    }

    // --------------------------------------------------
    // CONDITIONAL UPDATE
    // --------------------------------------------------

    const result =
      await prisma.team.updateMany({
        where: {
          team_id: teamId,
          status:
            TEAM_STATUS.INACTIVE,
        },

        data: {
          status:
            TEAM_STATUS.ACTIVE,
        },
      });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Team status changed before the operation completed. Please try again.",
      });
    }

    const updatedTeam =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select:
          teamSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.TEAM_ACTIVATED,

      entity_type: "TEAM",

      entity_id:
        teamId,

      details: {
        previous_status:
          TEAM_STATUS.INACTIVE,

        new_status:
          TEAM_STATUS.ACTIVE,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Team activated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error(
      "Activate team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while activating the team",
    });
  }
};

// ======================================================
// TRANSFER TEAM OWNERSHIP
// ======================================================

export const transferTeamOwnership =
  async (
    req,
    res
  ) => {
    try {
      const teamId =
        Number(
          req.params.team_id
        );

      const newOwnerId =
        Number(
          req.body.owner_id
        );

      // ------------------------------------------------
      // GET TEAM
      // ------------------------------------------------

      const team =
        await prisma.team.findUnique({
          where: {
            team_id: teamId,
          },

          select: {
            team_id: true,
            club_id: true,
            owner_id: true,
            status: true,
          },
        });

      if (!team) {
        return res.status(404).json({
          success: false,
          message:
            "Team not found",
        });
      }

      // ------------------------------------------------
      // AUTHORIZATION
      // ------------------------------------------------

      const allowed =
        await canManageTeam({
          req,
          team,
        });

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to transfer this team",
        });
      }

      // ------------------------------------------------
      // CURRENT OWNER
      // ------------------------------------------------

      if (
        team.owner_id ===
        newOwnerId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This user is already the team owner",
        });
      }

      // ------------------------------------------------
      // NEW OWNER
      // ------------------------------------------------

      const newOwner =
        await prisma.user.findUnique({
          where: {
            user_id:
              newOwnerId,
          },

          select: {
            user_id: true,
            role: true,
            status: true,
          },
        });

      if (!newOwner) {
        return res.status(404).json({
          success: false,
          message:
            "New owner not found",
        });
      }

      if (
        newOwner.role !==
        ROLES.TEAM_OWNER
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected user must have TEAM_OWNER role",
        });
      }

      if (
        newOwner.status !==
        "ACTIVE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New owner must have an active account",
        });
      }

      // ------------------------------------------------
      // TRANSACTION
      // ------------------------------------------------

      const updatedTeam =
        await prisma.$transaction(
          async (tx) => {
            const result =
              await tx.team.updateMany({
                where: {
                  team_id:
                    teamId,

                  owner_id:
                    team.owner_id,
                },

                data: {
                  owner_id:
                    newOwnerId,
                },
              });

            if (
              result.count === 0
            ) {
              const error =
                new Error(
                  "TEAM_OWNER_CHANGED"
                );

              throw error;
            }

            return tx.team.findUnique({
              where: {
                team_id:
                  teamId,
              },

              select:
                teamSelect,
            });
          },

          {
            isolationLevel:
              "Serializable",
          }
        );

      // ------------------------------------------------
      // AUDIT
      // ------------------------------------------------

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS
            .TEAM_OWNERSHIP_TRANSFERRED,

        entity_type:
          "TEAM",

        entity_id:
          teamId,

        details: {
          old_owner_id:
            team.owner_id,

          new_owner_id:
            newOwnerId,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "Team ownership transferred successfully",
        data: updatedTeam,
      });
    } catch (error) {
      if (
        error.message ===
        "TEAM_OWNER_CHANGED"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Team ownership changed before the transfer completed. Please try again.",
        });
      }

      if (
        error.code === "P2034"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Ownership transfer conflicted with another request. Please try again.",
        });
      }

      console.error(
        "Transfer team ownership error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while transferring team ownership",
      });
    }
  };