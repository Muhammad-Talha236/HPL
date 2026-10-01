import crypto from "crypto";

import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// PLAYER STATUS
// ======================================================

const PLAYER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ======================================================
// PLAYER SELECT
// ======================================================

const playerSelect = {
  player_id: true,
  name: true,
  profile_photo: true,
  date_of_birth: true,
  gender: true,
  position: true,
  phone: true,
  nationality: true,
  registration_number: true,
  status: true,
  created_at: true,
  updated_at: true,
};

// ======================================================
// GENERATE REGISTRATION NUMBER
// ======================================================

const generateRegistrationNumber = () => {
  return `HPL-${crypto
    .randomUUID()
    .replace(/-/g, "")
    .substring(0, 12)
    .toUpperCase()}`;
};

// ======================================================
// CREATE PLAYER
// ======================================================

export const createPlayer = async (req, res) => {
  try {
    const {
      name,
      profile_photo,
      date_of_birth,
      gender,
      position,
      phone,
      nationality,
    } = req.body;

    const registrationNumber =
      generateRegistrationNumber();

    const player = await prisma.player.create({
      data: {
        name: name.trim(),

        profile_photo:
          profile_photo !== undefined &&
          profile_photo !== null
            ? profile_photo.trim()
            : undefined,

        date_of_birth:
          new Date(date_of_birth),

        gender: gender.trim(),

        position:
          position !== undefined &&
          position !== null
            ? position.trim()
            : undefined,

        phone:
          phone !== undefined &&
          phone !== null
            ? phone.trim()
            : undefined,

        nationality:
          nationality !== undefined &&
          nationality !== null
            ? nationality.trim()
            : undefined,

        registration_number:
          registrationNumber,

        status:
          PLAYER_STATUS.ACTIVE,
      },

      select: playerSelect,
    });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PLAYER_CREATED,

      entity_type: "PLAYER",

      entity_id:
        player.player_id,

      details: {
        name: player.name,
        gender: player.gender,
        position: player.position,
      },
    });

    return res.status(201).json({
      success: true,
      message:
        "Player created successfully",
      data: player,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "Could not generate a unique player registration number. Please try again.",
      });
    }

    console.error(
      "Create player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the player",
    });
  }
};

// ======================================================
// GET ALL PLAYERS
// ======================================================

export const getPlayers = async (req, res) => {
  try {
    const players =
      await prisma.player.findMany({
        select: playerSelect,

        orderBy: {
          created_at: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: players,
    });
  } catch (error) {
    console.error(
      "Get players error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching players",
    });
  }
};

// ======================================================
// GET PLAYER BY ID
// ======================================================

export const getPlayerById = async (
  req,
  res
) => {
  try {
    const playerId =
      Number(req.params.player_id);

    const player =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: playerSelect,
      });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: player,
    });
  } catch (error) {
    console.error(
      "Get player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the player",
    });
  }
};

// ======================================================
// UPDATE PLAYER
// ======================================================

export const updatePlayer = async (
  req,
  res
) => {
  try {
    const playerId =
      Number(req.params.player_id);

    const {
      name,
      profile_photo,
      date_of_birth,
      gender,
      position,
      phone,
      nationality,
    } = req.body;

    // --------------------------------------------------
    // CHECK PLAYER EXISTS
    // --------------------------------------------------

    const existingPlayer =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: {
          player_id: true,
          status: true,
        },
      });

    if (!existingPlayer) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // --------------------------------------------------
    // BUILD UPDATE DATA
    // --------------------------------------------------

    const updateData = {};

    if (name !== undefined) {
      updateData.name =
        name.trim();
    }

    if (profile_photo !== undefined) {
      updateData.profile_photo =
        profile_photo === null
          ? null
          : profile_photo.trim();
    }

    if (date_of_birth !== undefined) {
      updateData.date_of_birth =
        new Date(date_of_birth);
    }

    if (gender !== undefined) {
      updateData.gender =
        gender.trim();
    }

    if (position !== undefined) {
      updateData.position =
        position === null
          ? null
          : position.trim();
    }

    if (phone !== undefined) {
      updateData.phone =
        phone === null
          ? null
          : phone.trim();
    }

    if (nationality !== undefined) {
      updateData.nationality =
        nationality === null
          ? null
          : nationality.trim();
    }

    // --------------------------------------------------
    // PREVENT EMPTY UPDATE
    // --------------------------------------------------

    if (
      Object.keys(updateData).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one player field is required",
      });
    }

    // --------------------------------------------------
    // UPDATE WITH STATE PROTECTION
    // --------------------------------------------------

    const updated =
      await prisma.player.updateMany({
        where: {
          player_id: playerId,
          status: existingPlayer.status,
        },

        data: updateData,
      });

    if (updated.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Player was modified by another request. Please try again.",
      });
    }

    // --------------------------------------------------
    // GET UPDATED PLAYER
    // --------------------------------------------------

    const player =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: playerSelect,
      });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PLAYER_UPDATED,

      entity_type: "PLAYER",

      entity_id:
        player.player_id,

      details: {
        name: player.name,
        gender: player.gender,
        position: player.position,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Player updated successfully",
      data: player,
    });
  } catch (error) {
    console.error(
      "Update player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the player",
    });
  }
};

// ======================================================
// DEACTIVATE PLAYER
// ======================================================

export const deactivatePlayer = async (
  req,
  res
) => {
  try {
    const playerId =
      Number(req.params.player_id);

    const updated =
      await prisma.player.updateMany({
        where: {
          player_id: playerId,
          status:
            PLAYER_STATUS.ACTIVE,
        },

        data: {
          status:
            PLAYER_STATUS.INACTIVE,
        },

        select: {
          player_id: true,
        },
      });

    if (updated.count === 0) {
      const player =
        await prisma.player.findUnique({
          where: {
            player_id: playerId,
          },

          select: {
            player_id: true,
            status: true,
          },
        });

      if (!player) {
        return res.status(404).json({
          success: false,
          message:
            "Player not found",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Player is already inactive",
      });
    }

    const player =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: playerSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PLAYER_DEACTIVATED,

      entity_type: "PLAYER",

      entity_id:
        playerId,

      details: {
        name: player.name,
        registration_number:
          player.registration_number,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Player deactivated successfully",
      data: player,
    });
  } catch (error) {
    console.error(
      "Deactivate player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deactivating the player",
    });
  }
};

// ======================================================
// ACTIVATE PLAYER
// ======================================================

export const activatePlayer = async (
  req,
  res
) => {
  try {
    const playerId =
      Number(req.params.player_id);

    const updated =
      await prisma.player.updateMany({
        where: {
          player_id: playerId,
          status:
            PLAYER_STATUS.INACTIVE,
        },

        data: {
          status:
            PLAYER_STATUS.ACTIVE,
        },

        select: {
          player_id: true,
        },
      });

    if (updated.count === 0) {
      const player =
        await prisma.player.findUnique({
          where: {
            player_id: playerId,
          },

          select: {
            player_id: true,
            status: true,
          },
        });

      if (!player) {
        return res.status(404).json({
          success: false,
          message:
            "Player not found",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Player is already active",
      });
    }

    const player =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: playerSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PLAYER_ACTIVATED,

      entity_type: "PLAYER",

      entity_id:
        playerId,

      details: {
        name: player.name,
        registration_number:
          player.registration_number,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Player activated successfully",
      data: player,
    });
  } catch (error) {
    console.error(
      "Activate player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while activating the player",
    });
  }
};