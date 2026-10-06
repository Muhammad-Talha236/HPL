import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

const publicClubSelect = {
  club_id: true,
  name: true,
  logo: true,
  description: true,
  region: true,
  district: true,
  city: true,
};

const publicClubListSelect = {
  ...publicClubSelect,
  _count: { select: { teams: { where: { status: "ACTIVE" } } } },
};

const publicClubTeamSelect = {
  team_id: true,
  name: true,
  logo: true,
  gender: true,
  region: true,
  district: true,
  city: true,
  description: true,
  team_type: true,
  home_venue: { select: { venue_id: true, name: true, city: true } },
};

const publicClubMatchSelect = {
  match_id: true,
  match_date: true,
  start_time: true,
  status: true,
  home_score: true,
  away_score: true,
  competition: { select: { competition_id: true, name: true, gender: true } },
  home_team: { select: { team_id: true, name: true, logo: true, gender: true } },
  away_team: { select: { team_id: true, name: true, logo: true, gender: true } },
  venue: { select: { venue_id: true, name: true, city: true } },
};


// ======================================================
// CREATE CLUB
// ======================================================

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

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Club name is required",
      });
    }

    if (req.user.role === ROLES.USER) {
      if (req.body.owner_id !== undefined) {
        return res.status(400).json({
          success: false,
          message: "Club registration owner is determined by the authenticated user",
        });
      }

      const existingPendingClub = await prisma.club.findFirst({
        where: { owner_id: req.user.user_id, status: "PENDING" },
        select: { club_id: true },
      });

      if (existingPendingClub) {
        return res.status(409).json({
          success: false,
          message: "You already have a pending club registration",
        });
      }
    }

    // A Club Owner can only create their own club. SUPER_ADMIN can select an
    // already-active CLUB_OWNER; the server reloads the account rather than
    // trusting owner details supplied by the UI.
    let owner_id = req.user.user_id;
    if (req.body.owner_id !== undefined) {
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ success: false, message: "Only SUPER_ADMIN can assign a club owner" });
      }
      const selectedOwner = await prisma.user.findUnique({ where: { user_id: Number(req.body.owner_id) }, select: { user_id: true, role: true, status: true } });
      if (!selectedOwner) return res.status(404).json({ success: false, message: "Selected owner not found" });
      if (selectedOwner.role !== ROLES.CLUB_OWNER) return res.status(400).json({ success: false, message: "Selected user must have CLUB_OWNER role" });
      if (selectedOwner.status !== USER_STATUS.ACTIVE) return res.status(400).json({ success: false, message: "Selected user account is not active" });
      owner_id = selectedOwner.user_id;
    }

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
        status: req.user.role === ROLES.USER ? "PENDING" : "ACTIVE",
      },
    });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: req.user.role === ROLES.USER
        ? AUDIT_ACTIONS.CLUB_REGISTRATION_SUBMITTED
        : AUDIT_ACTIONS.CLUB_CREATED,
      entity_type: "CLUB",
      entity_id: club.club_id,
      details: {
        name: club.name,
        owner_id: club.owner_id,
      },
    });

    return res.status(201).json({
      success: true,
      message: req.user.role === ROLES.USER
        ? "Club registration submitted for review"
        : "Club created successfully",
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


// ======================================================
// GET ALL CLUBS
// ======================================================

export const getClubs = async (req, res) => {
  try {
    const query = req.query || {};
    const page = query.page || 1;
    const limit = query.limit || 12;
    const { search, gender, region, district, city } = query;
    const where = {
      status: "ACTIVE",
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(region ? { region: { equals: region, mode: "insensitive" } } : {}),
      ...(district ? { district: { equals: district, mode: "insensitive" } } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(gender ? { teams: { some: { status: "ACTIVE", gender } } } : {}),
    };
    const [clubs, total] = await Promise.all([
      prisma.club.findMany({ where, select: publicClubListSelect, orderBy: [{ name: "asc" }, { club_id: "asc" }], skip: (page - 1) * limit, take: limit }),
      prisma.club.count({ where }),
    ]);
    const data = clubs.map(({ _count, ...club }) => ({ ...club, public_team_count: _count.teams }));

    return res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) },
    });

  } catch (error) {
    console.error("Get clubs error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching clubs",
    });
  }
};


// ======================================================
// GET CLUB BY ID
// ======================================================

export const getClubById = async (req, res) => {
  try {
    const clubId = Number(req.params.club_id);

    const club = await prisma.club.findFirst({
      where: { club_id: clubId, status: "ACTIVE" },
      select: {
        ...publicClubSelect,
        teams: { where: { status: "ACTIVE" }, select: publicClubTeamSelect, orderBy: [{ gender: "asc" }, { name: "asc" }, { team_id: "asc" }], take: 50 },
      },
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const clubMatchWhere = { OR: [{ home_team: { club_id: clubId } }, { away_team: { club_id: clubId } }] };
    const [upcoming_matches, recent_results] = await Promise.all([
      prisma.match.findMany({ where: { ...clubMatchWhere, status: { in: ["SCHEDULED", "LIVE"] } }, select: publicClubMatchSelect, orderBy: [{ match_date: "asc" }, { start_time: "asc" }, { match_id: "asc" }], take: 4 }),
      prisma.match.findMany({ where: { ...clubMatchWhere, status: "COMPLETED" }, select: publicClubMatchSelect, orderBy: [{ match_date: "desc" }, { start_time: "desc" }, { match_id: "desc" }], take: 4 }),
    ]);

    return res.status(200).json({ success: true, data: { ...club, upcoming_matches, recent_results } });

  } catch (error) {
    console.error("Get club error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the club",
    });
  }
};


// ======================================================
// UPDATE CLUB
// ======================================================

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

    // Create audit log
    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.CLUB_UPDATED,
      entity_type: "CLUB",
      entity_id: Number(club_id),
      details: {
        previous_name: club.name,
        new_name: updatedClub.name,
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


// ======================================================
// TRANSFER CLUB OWNERSHIP
// ======================================================

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

    if (
      !Number.isInteger(clubId) ||
      !Number.isInteger(newOwnerId)
    ) {
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

    // New owner must have CLUB_OWNER role
    if (newOwner.role !== ROLES.CLUB_OWNER) {
      return res.status(400).json({
        success: false,
        message: "Selected user must have CLUB_OWNER role",
      });
    }

    // New owner must have an active account
    if (newOwner.status !== USER_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: "Selected user account is not active",
      });
    }

    if (club.owner_id === newOwnerId) {
      return res.status(400).json({
        success: false,
        message: "This user already owns the club",
      });
    }

    // Store old owner for audit logging
    const oldOwnerId = club.owner_id;

    // Ownership is the only field updated here. Neither the old owner's role
    // nor the new owner's role is mutated: a scalar role may also be needed by
    // other clubs or teams. The conditional write makes the transfer atomic.
    const updatedClub = await prisma.$transaction(async (tx) => {
      const result = await tx.club.updateMany({ where: { club_id: clubId, owner_id: oldOwnerId }, data: { owner_id: newOwnerId } });
      if (result.count !== 1) throw new Error("CLUB_OWNER_CHANGED");
      return tx.club.findUnique({ where: { club_id: clubId } });
    }, { isolationLevel: "Serializable" });

    // Create audit log
    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.CLUB_OWNERSHIP_TRANSFERRED,
      entity_type: "CLUB",
      entity_id: clubId,
      details: {
        old_owner_id: oldOwnerId,
        new_owner_id: newOwnerId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Club ownership transferred successfully",
      data: updatedClub,
    });

  } catch (error) {
    if (error.message === "CLUB_OWNER_CHANGED" || error.code === "P2034") {
      return res.status(409).json({ success: false, message: "Ownership transfer conflicted with another request. Please try again." });
    }
    console.error("Transfer club ownership error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while transferring club ownership",
    });
  }
};


// ======================================================
// DEACTIVATE CLUB
// ======================================================

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

    // Create audit log
    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.CLUB_DEACTIVATED,
      entity_type: "CLUB",
      entity_id: clubId,
      details: {
        previous_status: club.status,
        new_status: "INACTIVE",
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
      message:
        "Something went wrong while deactivating the club",
    });
  }
};


// ======================================================
// ACTIVATE CLUB
// ======================================================

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

    // Create audit log
    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.CLUB_ACTIVATED,
      entity_type: "CLUB",
      entity_id: clubId,
      details: {
        previous_status: club.status,
        new_status: "ACTIVE",
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
      message:
        "Something went wrong while activating the club",
    });
  }
};
