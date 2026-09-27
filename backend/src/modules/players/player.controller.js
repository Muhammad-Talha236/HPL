import crypto from "crypto";

import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

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

    // ==================================================
    // GENERATE UNIQUE REGISTRATION NUMBER
    // ==================================================

    const registrationNumber = `HPL-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .substring(0, 12)
      .toUpperCase()}`;

    // ==================================================
    // CREATE PLAYER
    // ==================================================

    const player = await prisma.player.create({
      data: {
        name: name.trim(),

        profile_photo:
          profile_photo !== undefined
            ? profile_photo.trim()
            : undefined,

        date_of_birth: new Date(date_of_birth),

        gender: gender.trim(),

        position: position.trim(),

        phone:
          phone !== undefined
            ? phone.trim()
            : undefined,

        nationality:
          nationality !== undefined
            ? nationality.trim()
            : undefined,

        registration_number:
          registrationNumber,

        status: "ACTIVE",
      },
    });

    // ==================================================
    // AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.PLAYER_CREATED,
      entity_type: "PLAYER",
      entity_id: player.player_id,
      details: {
        name: player.name,
        gender: player.gender,
        position: player.position,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Player created successfully",
      data: player,
    });
  } catch (error) {
    console.error("Create player error:", error);

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
    const players = await prisma.player.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: players,
    });
  } catch (error) {
    console.error("Get players error:", error);

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

export const getPlayerById = async (req, res) => {
  try {
    const playerId = Number(req.params.player_id);

    if (!Number.isInteger(playerId) || playerId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid player ID",
      });
    }

    const player = await prisma.player.findUnique({
      where: {
        player_id: playerId,
      },
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
    console.error("Get player error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the player",
    });
  }
};