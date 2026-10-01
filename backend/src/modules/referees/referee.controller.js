import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// CREATE REFEREE
// ======================================================

export const createReferee = async (
  req,
  res
) => {
  try {
    const {
      name,
      profile_photo,
      phone,
      region,
      district,
      city,
      license_number,
    } = req.body;

    // ==================================================
    // 1. NORMALIZE INPUT
    // ==================================================

    const normalizedLicenseNumber =
      license_number.trim();

    // ==================================================
    // 2. CHECK DUPLICATE LICENSE NUMBER
    // ==================================================

    const existingReferee =
      await prisma.referee.findUnique({
        where: {
          license_number:
            normalizedLicenseNumber,
        },
        select: {
          referee_id: true,
        },
      });

    if (existingReferee) {
      return res.status(409).json({
        success: false,
        message:
          "A referee with this license number already exists",
      });
    }

    // ==================================================
    // 3. CREATE REFEREE
    // ==================================================

    const referee =
      await prisma.referee.create({
        data: {
          name: name.trim(),

          profile_photo:
            profile_photo?.trim() || null,

          phone:
            phone?.trim() || null,

          region:
            region?.trim() || null,

          district:
            district?.trim() || null,

          city:
            city?.trim() || null,

          license_number:
            normalizedLicenseNumber,

          // Never trust client for status
          status: "ACTIVE",
        },

        select: {
          referee_id: true,
          name: true,
          profile_photo: true,
          phone: true,
          region: true,
          district: true,
          city: true,
          license_number: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

    // ==================================================
    // 4. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.REFEREE_CREATED,

      entity_type:
        "REFEREE",

      entity_id:
        referee.referee_id,

      details: {
        name:
          referee.name,

        license_number:
          referee.license_number,
      },
    });

    // ==================================================
    // 5. RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Referee created successfully",

      data: referee,
    });
  } catch (error) {
    // ==================================================
    // UNIQUE LICENSE NUMBER
    // ==================================================

    if (
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A referee with this license number already exists",
      });
    }

    console.error(
      "Create referee error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the referee",
    });
  }
};

// ======================================================
// GET ALL REFEREES
// ======================================================

export const getReferees = async (
  req,
  res
) => {
  try {
    const referees =
      await prisma.referee.findMany({
        orderBy: [
          {
            name: "asc",
          },
          {
            referee_id: "asc",
          },
        ],

        select: {
          referee_id: true,
          name: true,
          profile_photo: true,
          phone: true,
          region: true,
          district: true,
          city: true,
          license_number: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

    return res.status(200).json({
      success: true,

      data: referees,
    });
  } catch (error) {
    console.error(
      "Get referees error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching referees",
    });
  }
};

// ======================================================
// GET REFEREE BY ID
// ======================================================

export const getRefereeById = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE REFEREE ID
    // ==================================================

    const refereeId =
      Number(
        req.params.referee_id
      );

    if (
      !Number.isInteger(
        refereeId
      ) ||
      refereeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. GET REFEREE
    // ==================================================

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },

        select: {
          referee_id: true,
          name: true,
          profile_photo: true,
          phone: true,
          region: true,
          district: true,
          city: true,
          license_number: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message:
          "Referee not found",
      });
    }

    // ==================================================
    // 3. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: referee,
    });
  } catch (error) {
    console.error(
      "Get referee error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the referee",
    });
  }
};

// ======================================================
// UPDATE REFEREE
// ======================================================

export const updateReferee = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE REFEREE ID
    // ==================================================

    const refereeId =
      Number(
        req.params.referee_id
      );

    if (
      !Number.isInteger(
        refereeId
      ) ||
      refereeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee ID must be a positive integer",
      });
    }

    const {
      name,
      profile_photo,
      phone,
      region,
      district,
      city,
      license_number,
    } = req.body;

    // ==================================================
    // 2. FIND REFEREE
    // ==================================================

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },

        select: {
          referee_id: true,
          name: true,
          profile_photo: true,
          phone: true,
          region: true,
          district: true,
          city: true,
          license_number: true,
          status: true,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message:
          "Referee not found",
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
      profile_photo !== undefined
    ) {
      updateData.profile_photo =
        profile_photo?.trim() ||
        null;
    }

    if (phone !== undefined) {
      updateData.phone =
        phone?.trim() || null;
    }

    if (region !== undefined) {
      updateData.region =
        region?.trim() || null;
    }

    if (district !== undefined) {
      updateData.district =
        district?.trim() || null;
    }

    if (city !== undefined) {
      updateData.city =
        city?.trim() || null;
    }

    if (
      license_number !== undefined
    ) {
      updateData.license_number =
        license_number.trim();
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
    // 5. CHECK DUPLICATE LICENSE NUMBER
    // ==================================================

    if (
      license_number !==
        undefined &&
      updateData.license_number !==
        referee.license_number
    ) {
      const existingReferee =
        await prisma.referee.findUnique({
          where: {
            license_number:
              updateData.license_number,
          },

          select: {
            referee_id: true,
          },
        });

      if (
        existingReferee &&
        existingReferee.referee_id !==
          refereeId
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A referee with this license number already exists",
        });
      }
    }

    // ==================================================
    // 6. UPDATE REFEREE
    // ==================================================

    const updatedReferee =
      await prisma.referee.update({
        where: {
          referee_id: refereeId,
        },

        data: updateData,

        select: {
          referee_id: true,
          name: true,
          profile_photo: true,
          phone: true,
          region: true,
          district: true,
          city: true,
          license_number: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

    // ==================================================
    // 7. AUDIT LOG
    // ==================================================

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.REFEREE_UPDATED,

      entity_type:
        "REFEREE",

      entity_id:
        refereeId,

      details: {
        updated_fields:
          Object.keys(updateData),
      },
    });

    // ==================================================
    // 8. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Referee updated successfully",

      data: updatedReferee,
    });
  } catch (error) {
    // ==================================================
    // UNIQUE LICENSE NUMBER
    // ==================================================

    if (
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A referee with this license number already exists",
      });
    }

    console.error(
      "Update referee error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the referee",
    });
  }
};

// ======================================================
// DEACTIVATE REFEREE
// ======================================================

export const deactivateReferee = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE REFEREE ID
    // ==================================================

    const refereeId =
      Number(
        req.params.referee_id
      );

    if (
      !Number.isInteger(
        refereeId
      ) ||
      refereeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. FIND REFEREE
    // ==================================================

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },

        select: {
          referee_id: true,
          name: true,
          status: true,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message:
          "Referee not found",
      });
    }

    // ==================================================
    // 3. CHECK CURRENT STATUS
    // ==================================================

    if (
      referee.status ===
      "INACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee is already inactive",
      });
    }

    // ==================================================
    // 4. CONDITIONAL STATUS UPDATE
    // ==================================================

    const updateResult =
      await prisma.referee.updateMany({
        where: {
          referee_id: refereeId,

          status: "ACTIVE",
        },

        data: {
          status: "INACTIVE",
        },
      });

    if (
      updateResult.count !==
      1
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Referee status changed before deactivation could be completed",
      });
    }

    // ==================================================
    // 5. GET UPDATED REFEREE
    // ==================================================

    const updatedReferee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },

        select: {
          referee_id: true,
          name: true,
          profile_photo: true,
          phone: true,
          region: true,
          district: true,
          city: true,
          license_number: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

    // ==================================================
    // 6. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Referee deactivated successfully",

      data: updatedReferee,
    });
  } catch (error) {
    console.error(
      "Deactivate referee error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deactivating the referee",
    });
  }
};

// ======================================================
// ACTIVATE REFEREE
// ======================================================

export const activateReferee = async (
  req,
  res
) => {
  try {
    // ==================================================
    // 1. VALIDATE REFEREE ID
    // ==================================================

    const refereeId =
      Number(
        req.params.referee_id
      );

    if (
      !Number.isInteger(
        refereeId
      ) ||
      refereeId < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee ID must be a positive integer",
      });
    }

    // ==================================================
    // 2. FIND REFEREE
    // ==================================================

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },

        select: {
          referee_id: true,
          name: true,
          status: true,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message:
          "Referee not found",
      });
    }

    // ==================================================
    // 3. CHECK CURRENT STATUS
    // ==================================================

    if (
      referee.status ===
      "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Referee is already active",
      });
    }

    // ==================================================
    // 4. CONDITIONAL STATUS UPDATE
    // ==================================================

    const updateResult =
      await prisma.referee.updateMany({
        where: {
          referee_id: refereeId,

          status: "INACTIVE",
        },

        data: {
          status: "ACTIVE",
        },
      });

    if (
      updateResult.count !==
      1
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Referee status changed before activation could be completed",
      });
    }

    // ==================================================
    // 5. GET UPDATED REFEREE
    // ==================================================

    const updatedReferee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },

        select: {
          referee_id: true,
          name: true,
          profile_photo: true,
          phone: true,
          region: true,
          district: true,
          city: true,
          license_number: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

    // ==================================================
    // 6. RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "Referee activated successfully",

      data: updatedReferee,
    });
  } catch (error) {
    console.error(
      "Activate referee error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while activating the referee",
    });
  }
};