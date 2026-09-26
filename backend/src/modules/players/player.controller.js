import prisma from "../../database/prisma.js";

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

    // Required fields
    if (!name || !date_of_birth || !gender || !position) {
      return res.status(400).json({
        success: false,
        message:
          "Name, date of birth, gender and position are required",
      });
    }

    // Generate a unique registration number
    const registrationNumber = `HPL-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        profile_photo,
        date_of_birth: new Date(date_of_birth),
        gender,
        position,
        phone,
        nationality,
        registration_number: registrationNumber,
        status: "ACTIVE",
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
      message: "Something went wrong while creating the player",
    });
  }
};

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
      message: "Something went wrong while fetching players",
    });
  }
};

export const getPlayerById = async (req, res) => {
  try {
    const playerId = Number(req.params.player_id);

    if (!Number.isInteger(playerId)) {
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
      message: "Something went wrong while fetching the player",
    });
  }
};