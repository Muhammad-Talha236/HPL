import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// CONSTANTS
// ======================================================

const SEASON_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ======================================================
// CREATE SEASON
// ======================================================

export const createSeason = async (req, res) => {
  try {
    const {
      name,
      start_date,
      end_date,
      description,
    } = req.body;

    // --------------------------------------------------
    // CHECK DUPLICATE SEASON
    // --------------------------------------------------

    const existingSeason = await prisma.season.findFirst({
      where: {
        name: name.trim(),
      },
    });

    if (existingSeason) {
      return res.status(409).json({
        success: false,
        message: "A season with this name already exists",
      });
    }

    // --------------------------------------------------
    // CREATE SEASON
    // --------------------------------------------------

    const season = await prisma.season.create({
      data: {
        name: name.trim(),

        start_date: new Date(start_date),

        end_date: new Date(end_date),

        description:
          description !== undefined
            ? description.trim()
            : undefined,

        // Server controls initial status
        status: SEASON_STATUS.ACTIVE,
      },
    });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.SEASON_CREATED,
      entity_type: "SEASON",
      entity_id: season.season_id,
      details: {
        name: season.name,
        start_date: season.start_date,
        end_date: season.end_date,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Season created successfully",
      data: season,
    });
  } catch (error) {
    console.error("Create season error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the season",
    });
  }
};

// ======================================================
// GET ALL SEASONS
// ======================================================

export const getSeasons = async (req, res) => {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: {
        start_date: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: seasons,
    });
  } catch (error) {
    console.error("Get seasons error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching seasons",
    });
  }
};

// ======================================================
// GET SEASON BY ID
// ======================================================

export const getSeasonById = async (req, res) => {
  try {
    const seasonId = Number(req.params.season_id);

    if (!Number.isInteger(seasonId) || seasonId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid season ID",
      });
    }

    const season = await prisma.season.findUnique({
      where: {
        season_id: seasonId,
      },
    });

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: season,
    });
  } catch (error) {
    console.error("Get season error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the season",
    });
  }
};

// ======================================================
// UPDATE SEASON
// ======================================================

export const updateSeason = async (req, res) => {
  try {
    const seasonId = Number(req.params.season_id);

    if (!Number.isInteger(seasonId) || seasonId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid season ID",
      });
    }

    // --------------------------------------------------
    // FIND EXISTING SEASON
    // --------------------------------------------------

    const season = await prisma.season.findUnique({
      where: {
        season_id: seasonId,
      },
    });

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    const {
      name,
      start_date,
      end_date,
      description,
    } = req.body;

    // --------------------------------------------------
    // DUPLICATE NAME CHECK
    // --------------------------------------------------

    if (name !== undefined) {
      const duplicateSeason =
        await prisma.season.findFirst({
          where: {
            name: name.trim(),
            NOT: {
              season_id: seasonId,
            },
          },
        });

      if (duplicateSeason) {
        return res.status(409).json({
          success: false,
          message:
            "A season with this name already exists",
        });
      }
    }

    // --------------------------------------------------
    // DETERMINE FINAL DATES
    // --------------------------------------------------

    const finalStartDate =
      start_date !== undefined
        ? new Date(start_date)
        : season.start_date;

    const finalEndDate =
      end_date !== undefined
        ? new Date(end_date)
        : season.end_date;

    if (finalEndDate <= finalStartDate) {
      return res.status(400).json({
        success: false,
        message:
          "End date must be after start date",
      });
    }

    // --------------------------------------------------
    // UPDATE SEASON
    // --------------------------------------------------

    const updatedSeason =
      await prisma.season.update({
        where: {
          season_id: seasonId,
        },
        data: {
          ...(name !== undefined && {
            name: name.trim(),
          }),

          ...(start_date !== undefined && {
            start_date: finalStartDate,
          }),

          ...(end_date !== undefined && {
            end_date: finalEndDate,
          }),

          ...(description !== undefined && {
            description: description.trim(),
          }),
        },
      });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.SEASON_UPDATED,
      entity_type: "SEASON",
      entity_id: seasonId,
      details: {
        previous_name: season.name,
        new_name: updatedSeason.name,
        previous_start_date: season.start_date,
        new_start_date: updatedSeason.start_date,
        previous_end_date: season.end_date,
        new_end_date: updatedSeason.end_date,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Season updated successfully",
      data: updatedSeason,
    });
  } catch (error) {
    console.error("Update season error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the season",
    });
  }
};

// ======================================================
// DEACTIVATE SEASON
// ======================================================

export const deactivateSeason = async (req, res) => {
  try {
    const seasonId = Number(req.params.season_id);

    if (!Number.isInteger(seasonId) || seasonId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid season ID",
      });
    }

    const season = await prisma.season.findUnique({
      where: {
        season_id: seasonId,
      },
    });

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (season.status === SEASON_STATUS.INACTIVE) {
      return res.status(400).json({
        success: false,
        message: "Season is already inactive",
      });
    }

    const updatedSeason =
      await prisma.season.update({
        where: {
          season_id: seasonId,
        },
        data: {
          status: SEASON_STATUS.INACTIVE,
        },
      });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.SEASON_DEACTIVATED,
      entity_type: "SEASON",
      entity_id: seasonId,
      details: {
        previous_status: season.status,
        new_status: updatedSeason.status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Season deactivated successfully",
      data: updatedSeason,
    });
  } catch (error) {
    console.error("Deactivate season error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deactivating the season",
    });
  }
};

// ======================================================
// ACTIVATE SEASON
// ======================================================

export const activateSeason = async (req, res) => {
  try {
    const seasonId = Number(req.params.season_id);

    if (!Number.isInteger(seasonId) || seasonId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid season ID",
      });
    }

    const season = await prisma.season.findUnique({
      where: {
        season_id: seasonId,
      },
    });

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (season.status === SEASON_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: "Season is already active",
      });
    }

    const updatedSeason =
      await prisma.season.update({
        where: {
          season_id: seasonId,
        },
        data: {
          status: SEASON_STATUS.ACTIVE,
        },
      });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.SEASON_ACTIVATED,
      entity_type: "SEASON",
      entity_id: seasonId,
      details: {
        previous_status: season.status,
        new_status: updatedSeason.status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Season activated successfully",
      data: updatedSeason,
    });
  } catch (error) {
    console.error("Activate season error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while activating the season",
    });
  }
};