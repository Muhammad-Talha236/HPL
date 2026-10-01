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

export const createSeason = async (
  req,
  res
) => {
  try {
    const {
      name,
      start_date,
      end_date,
      description,
    } = req.body;

    // ==================================================
    // 1. NORMALIZE INPUT
    // ==================================================

    const normalizedName =
      name.trim();

    const startDate =
      new Date(start_date);

    const endDate =
      new Date(end_date);

    // ==================================================
    // 2. CHECK DATE VALIDITY
    // ==================================================

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid season dates",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message:
          "End date must be after start date",
      });
    }

    // ==================================================
    // 3. CHECK DUPLICATE SEASON NAME
    // ==================================================

    const existingSeason =
      await prisma.season.findFirst({
        where: {
          name: normalizedName,
        },

        select: {
          season_id: true,
        },
      });

    if (existingSeason) {
      return res.status(409).json({
        success: false,
        message:
          "A season with this name already exists",
      });
    }

    // ==================================================
    // 4. CREATE SEASON
    // ==================================================

    const season =
      await prisma.season.create({
        data: {
          name:
            normalizedName,

          start_date:
            startDate,

          end_date:
            endDate,

          description:
            description !==
            undefined
              ? description?.trim() ||
                null
              : null,

          // Server controls initial status
          status:
            SEASON_STATUS.ACTIVE,
        },

        select: {
          season_id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
          description: true,
          created_at: true,
          updated_at: true,
        },
      });

    // ==================================================
    // 5. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.SEASON_CREATED,

      entity_type:
        "SEASON",

      entity_id:
        season.season_id,

      details: {
        name:
          season.name,

        start_date:
          season.start_date.toISOString(),

        end_date:
          season.end_date.toISOString(),
      },
    });

    // ==================================================
    // 6. RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Season created successfully",

      data: season,
    });
  } catch (error) {
    console.error(
      "Create season error:",
      error
    );

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

export const getSeasons = async (
  req,
  res
) => {
  try {
    const seasons =
      await prisma.season.findMany({
        orderBy: [
          {
            start_date: "desc",
          },
          {
            season_id: "desc",
          },
        ],

        select: {
          season_id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
          description: true,
          created_at: true,
          updated_at: true,
        },
      });

    return res.status(200).json({
      success: true,

      data: seasons,
    });
  } catch (error) {
    console.error(
      "Get seasons error:",
      error
    );

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

export const getSeasonById = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE SEASON ID
    // ==================================================

    const seasonId =
      Number(
        req.params.season_id
      );

    if (
      !Number.isInteger(
        seasonId
      ) ||
      seasonId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Season ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. GET SEASON
    // ==================================================

    const season =
      await prisma.season.findUnique({
        where: {
          season_id:
            seasonId,
        },

        select: {
          season_id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
          description: true,
          created_at: true,
          updated_at: true,
        },
      });

    if (!season) {
      return res.status(404).json({
        success: false,
        message:
          "Season not found",
      });
    }

    // ==================================================
    // 3. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: season,
    });
  } catch (error) {
    console.error(
      "Get season error:",
      error
    );

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

export const updateSeason = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE SEASON ID
    // ==================================================

    const seasonId =
      Number(
        req.params.season_id
      );

    if (
      !Number.isInteger(
        seasonId
      ) ||
      seasonId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Season ID must be a positive integer",
      });
    }

    const {
      name,
      start_date,
      end_date,
      description,
    } = req.body;

    // ==================================================
    // 2. FIND EXISTING SEASON
    // ==================================================

    const season =
      await prisma.season.findUnique({
        where: {
          season_id:
            seasonId,
        },

        select: {
          season_id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
          description: true,
        },
      });

    if (!season) {
      return res.status(404).json({
        success: false,
        message:
          "Season not found",
      });
    }

    // ==================================================
    // 3. BUILD UPDATE DATA
    // ==================================================

    const updateData = {};

    if (name !== undefined) {
      updateData.name =
        name.trim();
    }

    if (
      start_date !==
      undefined
    ) {
      const newStartDate =
        new Date(start_date);

      if (
        Number.isNaN(
          newStartDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid season start date",
        });
      }

      updateData.start_date =
        newStartDate;
    }

    if (
      end_date !==
      undefined
    ) {
      const newEndDate =
        new Date(end_date);

      if (
        Number.isNaN(
          newEndDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid season end date",
        });
      }

      updateData.end_date =
        newEndDate;
    }

    if (
      description !==
      undefined
    ) {
      updateData.description =
        description?.trim() ||
        null;
    }

    // ==================================================
    // 4. CHECK EMPTY UPDATE
    // ==================================================

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No fields were provided for update",
      });
    }

    // ==================================================
    // 5. DETERMINE FINAL DATES
    // ==================================================

    const finalStartDate =
      updateData.start_date ??
      season.start_date;

    const finalEndDate =
      updateData.end_date ??
      season.end_date;

    if (
      finalEndDate <=
      finalStartDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date must be after start date",
      });
    }

    // ==================================================
    // 6. CHECK DUPLICATE NAME
    // ==================================================

    if (
      updateData.name !==
        undefined &&
      updateData.name !==
        season.name
    ) {
      const duplicateSeason =
        await prisma.season.findFirst({
          where: {
            name:
              updateData.name,

            NOT: {
              season_id:
                seasonId,
            },
          },

          select: {
            season_id: true,
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

    // ==================================================
    // 7. UPDATE SEASON
    // ==================================================

    const updatedSeason =
      await prisma.season.update({
        where: {
          season_id:
            seasonId,
        },

        data: updateData,

        select: {
          season_id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
          description: true,
          created_at: true,
          updated_at: true,
        },
      });

    // ==================================================
    // 8. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.SEASON_UPDATED,

      entity_type:
        "SEASON",

      entity_id:
        seasonId,

      details: {
        updated_fields:
          Object.keys(
            updateData
          ),

        previous_name:
          season.name,

        new_name:
          updatedSeason.name,

        previous_start_date:
          season.start_date.toISOString(),

        new_start_date:
          updatedSeason.start_date.toISOString(),

        previous_end_date:
          season.end_date.toISOString(),

        new_end_date:
          updatedSeason.end_date.toISOString(),
      },
    });

    // ==================================================
    // 9. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Season updated successfully",

      data: updatedSeason,
    });
  } catch (error) {
    console.error(
      "Update season error:",
      error
    );

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

export const deactivateSeason = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE SEASON ID
    // ==================================================

    const seasonId =
      Number(
        req.params.season_id
      );

    if (
      !Number.isInteger(
        seasonId
      ) ||
      seasonId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Season ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. FIND SEASON
    // ==================================================

    const season =
      await prisma.season.findUnique({
        where: {
          season_id:
            seasonId,
        },

        select: {
          season_id: true,
          name: true,
          status: true,
        },
      });

    if (!season) {
      return res.status(404).json({
        success: false,
        message:
          "Season not found",
      });
    }

    // ==================================================
    // 3. CHECK CURRENT STATUS
    // ==================================================

    if (
      season.status ===
      SEASON_STATUS.INACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Season is already inactive",
      });
    }

    // ==================================================
    // 4. CONDITIONAL STATUS UPDATE
    // ==================================================

    const updateResult =
      await prisma.season.updateMany({
        where: {
          season_id:
            seasonId,

          status:
            SEASON_STATUS.ACTIVE,
        },

        data: {
          status:
            SEASON_STATUS.INACTIVE,
        },
      });

    if (
      updateResult.count !==
      1
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Season status changed before deactivation could be completed",
      });
    }

    // ==================================================
    // 5. GET UPDATED SEASON
    // ==================================================

    const updatedSeason =
      await prisma.season.findUnique({
        where: {
          season_id:
            seasonId,
        },

        select: {
          season_id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
          description: true,
          created_at: true,
          updated_at: true,
        },
      });

    // ==================================================
    // 6. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.SEASON_DEACTIVATED,

      entity_type:
        "SEASON",

      entity_id:
        seasonId,

      details: {
        previous_status:
          season.status,

        new_status:
          updatedSeason.status,
      },
    });

    // ==================================================
    // 7. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Season deactivated successfully",

      data: updatedSeason,
    });
  } catch (error) {
    console.error(
      "Deactivate season error:",
      error
    );

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

export const activateSeason = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE SEASON ID
    // ==================================================

    const seasonId =
      Number(
        req.params.season_id
      );

    if (
      !Number.isInteger(
        seasonId
      ) ||
      seasonId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Season ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. FIND SEASON
    // ==================================================

    const season =
      await prisma.season.findUnique({
        where: {
          season_id:
            seasonId,
        },

        select: {
          season_id: true,
          name: true,
          status: true,
        },
      });

    if (!season) {
      return res.status(404).json({
        success: false,
        message:
          "Season not found",
      });
    }

    // ==================================================
    // 3. CHECK CURRENT STATUS
    // ==================================================

    if (
      season.status ===
      SEASON_STATUS.ACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Season is already active",
      });
    }

    // ==================================================
    // 4. CONDITIONAL STATUS UPDATE
    // ==================================================

    const updateResult =
      await prisma.season.updateMany({
        where: {
          season_id:
            seasonId,

          status:
            SEASON_STATUS.INACTIVE,
        },

        data: {
          status:
            SEASON_STATUS.ACTIVE,
        },
      });

    if (
      updateResult.count !==
      1
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Season status changed before activation could be completed",
      });
    }

    // ==================================================
    // 5. GET UPDATED SEASON
    // ==================================================

    const updatedSeason =
      await prisma.season.findUnique({
        where: {
          season_id:
            seasonId,
        },

        select: {
          season_id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
          description: true,
          created_at: true,
          updated_at: true,
        },
      });

    // ==================================================
    // 6. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.SEASON_ACTIVATED,

      entity_type:
        "SEASON",

      entity_id:
        seasonId,

      details: {
        previous_status:
          season.status,

        new_status:
          updatedSeason.status,
      },
    });

    // ==================================================
    // 7. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Season activated successfully",

      data: updatedSeason,
    });
  } catch (error) {
    console.error(
      "Activate season error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while activating the season",
    });
  }
};