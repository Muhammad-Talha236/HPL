import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
export const createClub = async (req, res) => {
  try {
    const {
      name,
      logo,
      description,
      region,
      district,
      city,
      contact_email,
      contact_phone,
      representative_name,
    } = req.body;

    // 1. Validate required field
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Club name is required",
      });
    }

    // 2. Get authenticated user's ID from JWT
    const owner_id = req.user.user_id;

    // 3. Check for duplicate club name
    const existingClub = await prisma.club.findFirst({
      where: {
        name,
      },
    });

    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: "A club with this name already exists",
      });
    }

    // 4. Create club
    const club = await prisma.club.create({
      data: {
        owner_id,
        name,
        logo,
        description,
        region,
        district,
        city,
        contact_email,
        contact_phone,
        representative_name,
        status: "ACTIVE",
      },
    });

    // 5. Return created club
    return res.status(201).json({
      success: true,
      message: "Club created successfully",
      data: club,
    });

  } catch (error) {
    console.error("Create club error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the club",
    });
  }
};

export const getClubs = async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: clubs,
    });
  } catch (error) {
    console.error("Get clubs error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching clubs",
    });
  }
};

export const getClubById = async (req, res) => {
  try {
    const { club_id } = req.params;

    const club = await prisma.club.findUnique({
      where: {
        club_id: Number(club_id),
      },
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: club,
    });
  } catch (error) {
    console.error("Get club error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the club",
    });
  }
};

export const updateClub = async (req, res) => {
  try {
    const { club_id } = req.params;

    const club = await prisma.club.findUnique({
      where: {
        club_id: Number(club_id),
      },
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // Super Admin can update any club.
    // Club Owner can update only their own club.
    if (
      req.user.role !== ROLES.SUPER_ADMIN &&
      club.owner_id !== req.user.user_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own club",
      });
    }

    const {
      name,
      logo,
      description,
      region,
      district,
      city,
      contact_email,
      contact_phone,
      representative_name,
    } = req.body;

    // Prevent empty club name if name is provided.
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Club name cannot be empty",
      });
    }

    const updatedClub = await prisma.club.update({
      where: {
        club_id: Number(club_id),
      },
      data: {
        ...(name !== undefined && { name }),
        ...(logo !== undefined && { logo }),
        ...(description !== undefined && { description }),
        ...(region !== undefined && { region }),
        ...(district !== undefined && { district }),
        ...(city !== undefined && { city }),
        ...(contact_email !== undefined && { contact_email }),
        ...(contact_phone !== undefined && { contact_phone }),
        ...(representative_name !== undefined && {
          representative_name,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Club updated successfully",
      data: updatedClub,
    });
  } catch (error) {
    console.error("Update club error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the club",
    });
  }
};

export const transferClubOwnership = async (req, res) => {
  try {
    const { club_id } = req.params;
    const { owner_id } = req.body;

    if (!owner_id) {
      return res.status(400).json({
        success: false,
        message: "New owner ID is required",
      });
    }

    const clubId = Number(club_id);
    const newOwnerId = Number(owner_id);

    if (!Number.isInteger(clubId) || !Number.isInteger(newOwnerId)) {
      return res.status(400).json({
        success: false,
        message: "Club ID and owner ID must be valid numbers",
      });
    }

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

    if (newOwner.role !== ROLES.CLUB_OWNER) {
      return res.status(400).json({
        success: false,
        message: "Selected user must have CLUB_OWNER role",
      });
    }

    if (club.owner_id === newOwnerId) {
      return res.status(400).json({
        success: false,
        message: "This user already owns the club",
      });
    }

    const updatedClub = await prisma.club.update({
      where: {
        club_id: clubId,
      },
      data: {
        owner_id: newOwnerId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Club ownership transferred successfully",
      data: updatedClub,
    });
  } catch (error) {
    console.error("Transfer club ownership error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while transferring club ownership",
    });
  }
};

export const deactivateClub = async (req, res) => {
  try {
    const { club_id } = req.params;

    const clubId = Number(club_id);

    if (!Number.isInteger(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

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

    // Super Admin can deactivate any club.
    // Club Owner can deactivate only their own club.
    if (
      req.user.role !== ROLES.SUPER_ADMIN &&
      club.owner_id !== req.user.user_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only deactivate your own club",
      });
    }

    if (club.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Club is already inactive",
      });
    }

    const updatedClub = await prisma.club.update({
      where: {
        club_id: clubId,
      },
      data: {
        status: "INACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Club deactivated successfully",
      data: updatedClub,
    });
  } catch (error) {
    console.error("Deactivate club error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deactivating the club",
    });
  }
};

export const activateClub = async (req, res) => {
  try {
    const { club_id } = req.params;

    const clubId = Number(club_id);

    if (!Number.isInteger(clubId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid club ID",
      });
    }

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

    if (club.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Club is already active",
      });
    }

    const updatedClub = await prisma.club.update({
      where: {
        club_id: clubId,
      },
      data: {
        status: "ACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Club activated successfully",
      data: updatedClub,
    });
  } catch (error) {
    console.error("Activate club error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while activating the club",
    });
  }
};