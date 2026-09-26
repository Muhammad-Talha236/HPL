import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";

export const createTeam = async (req, res) => {
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

    // Required fields
    if (!club_id || !home_venue_id || !name || !gender || !team_type) {
      return res.status(400).json({
        success: false,
        message:
          "Club ID, home venue ID, team name, gender and team type are required",
      });
    }

    const clubId = Number(club_id);
    const venueId = Number(home_venue_id);

    // Validate IDs
    if (!Number.isInteger(clubId) || !Number.isInteger(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID or venue ID",
      });
    }

    // Find club
    const club = await prisma.club.findUnique({
      where: {
        club_id: clubId,
      },
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // Club must be active
    if (club.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Cannot create a team under an inactive club",
      });
    }

    // Ownership check
    if (
      req.user.role !== ROLES.SUPER_ADMIN &&
      club.owner_id !== req.user.user_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create teams for your own club",
      });
    }

    // Find venue
    const venue = await prisma.venue.findUnique({
      where: {
        venue_id: venueId,
      },
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Home venue not found",
      });
    }

    // Venue must be active
    if (venue.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign an inactive venue to a team",
      });
    }

    // Prevent duplicate team name inside same club
    const existingTeam = await prisma.team.findFirst({
      where: {
        club_id: clubId,
        name: name.trim(),
      },
    });

    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: "A team with this name already exists in this club",
      });
    }

    /*
     * For a Club Owner:
     * owner_id = authenticated user.
     *
     * For Super Admin:
     * owner_id = club owner.
     *
     * This prevents Super Admin from accidentally becoming
     * the owner of every team they create.
     */
    const teamOwnerId =
      req.user.role === ROLES.SUPER_ADMIN
        ? club.owner_id
        : req.user.user_id;

    const team = await prisma.team.create({
      data: {
        club_id: clubId,
        owner_id: teamOwnerId,
        home_venue_id: venueId,

        name: name.trim(),
        logo,
        gender,
        region,
        district,
        city,
        description,
        contact_email,
        contact_phone,
        team_type,

        status: "ACTIVE",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: team,
    });
  } catch (error) {
    console.error("Create team error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the team",
    });
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      orderBy: {
        created_at: "desc",
      },

      include: {
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
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error("Get teams error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching teams",
    });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const teamId = Number(req.params.team_id);

    if (!Number.isInteger(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        team_id: teamId,
      },

      include: {
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
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error("Get team error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the team",
    });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const teamId = Number(req.params.team_id);

    if (!Number.isInteger(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        team_id: teamId,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Only team owner or Super Admin can update
    if (
      req.user.role !== ROLES.SUPER_ADMIN &&
      team.owner_id !== req.user.user_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own team",
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

    // Validate venue if provided
    if (home_venue_id !== undefined) {
      const venueId = Number(home_venue_id);

      if (!Number.isInteger(venueId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid venue ID",
        });
      }

      const venue = await prisma.venue.findUnique({
        where: {
          venue_id: venueId,
        },
      });

      if (!venue) {
        return res.status(404).json({
          success: false,
          message: "Home venue not found",
        });
      }

      if (venue.status !== "ACTIVE") {
        return res.status(400).json({
          success: false,
          message: "Cannot assign an inactive venue",
        });
      }
    }

    // Check duplicate name
    if (name !== undefined) {
      const existingTeam = await prisma.team.findFirst({
        where: {
          club_id: team.club_id,
          name: name.trim(),
          NOT: {
            team_id: teamId,
          },
        },
      });

      if (existingTeam) {
        return res.status(409).json({
          success: false,
          message: "A team with this name already exists in this club",
        });
      }
    }

    const updatedTeam = await prisma.team.update({
      where: {
        team_id: teamId,
      },

      data: {
        ...(home_venue_id !== undefined && {
          home_venue_id: Number(home_venue_id),
        }),

        ...(name !== undefined && {
          name: name.trim(),
        }),

        ...(logo !== undefined && { logo }),
        ...(gender !== undefined && { gender }),
        ...(region !== undefined && { region }),
        ...(district !== undefined && { district }),
        ...(city !== undefined && { city }),
        ...(description !== undefined && { description }),
        ...(contact_email !== undefined && { contact_email }),
        ...(contact_phone !== undefined && { contact_phone }),
        ...(team_type !== undefined && { team_type }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Team updated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("Update team error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the team",
    });
  }
};

export const deactivateTeam = async (req, res) => {
  try {
    const teamId = Number(req.params.team_id);

    if (!Number.isInteger(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        team_id: teamId,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Only team owner, club owner or Super Admin
    if (
      req.user.role !== ROLES.SUPER_ADMIN &&
      team.owner_id !== req.user.user_id
    ) {
      // Check whether user is the club owner
      const club = await prisma.club.findUnique({
        where: {
          club_id: team.club_id,
        },
      });

      if (!club || club.owner_id !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to deactivate this team",
        });
      }
    }

    if (team.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Team is already inactive",
      });
    }

    const updatedTeam = await prisma.team.update({
      where: {
        team_id: teamId,
      },
      data: {
        status: "INACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Team deactivated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("Deactivate team error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deactivating the team",
    });
  }
};


export const activateTeam = async (req, res) => {
  try {
    const teamId = Number(req.params.team_id);

    if (!Number.isInteger(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        team_id: teamId,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Only Super Admin can activate
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can activate a team",
      });
    }

    if (team.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Team is already active",
      });
    }

    // Check club status before activating team
    const club = await prisma.club.findUnique({
      where: {
        club_id: team.club_id,
      },
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Team's club not found",
      });
    }

    if (club.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Cannot activate a team under an inactive club",
      });
    }

    const updatedTeam = await prisma.team.update({
      where: {
        team_id: teamId,
      },
      data: {
        status: "ACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Team activated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("Activate team error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while activating the team",
    });
  }
};

export const transferTeamOwnership = async (req, res) => {
  try {
    const teamId = Number(req.params.team_id);
    const { owner_id } = req.body;

    if (!Number.isInteger(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    const newOwnerId = Number(owner_id);

    if (!Number.isInteger(newOwnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid new owner ID",
      });
    }

    const team = await prisma.team.findUnique({
      where: {
        team_id: teamId,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Only current team owner, club owner or Super Admin
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      const club = await prisma.club.findUnique({
        where: {
          club_id: team.club_id,
        },
      });

      const isTeamOwner = team.owner_id === req.user.user_id;
      const isClubOwner = club?.owner_id === req.user.user_id;

      if (!isTeamOwner && !isClubOwner) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to transfer this team",
        });
      }
    }

    // Prevent transferring to the current owner
    if (team.owner_id === newOwnerId) {
      return res.status(400).json({
        success: false,
        message: "This user is already the team owner",
      });
    }

    // Find new owner
    const newOwner = await prisma.user.findUnique({
      where: {
        user_id: newOwnerId,
      },
    });

    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: "New owner not found",
      });
    }

    // Block inactive/blocked users
    if (newOwner.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "New owner must have an active account",
      });
    }

    const updatedTeam = await prisma.team.update({
      where: {
        team_id: teamId,
      },
      data: {
        owner_id: newOwnerId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Team ownership transferred successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("Transfer team ownership error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while transferring team ownership",
    });
  }
};