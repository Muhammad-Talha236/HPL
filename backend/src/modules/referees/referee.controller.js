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

    // --------------------------------------------------
    // CHECK DUPLICATE LICENSE NUMBER
    // --------------------------------------------------

    const existingReferee =
      await prisma.referee.findUnique({
        where: {
          license_number:
            license_number.trim(),
        },
      });

    if (existingReferee) {
      return res.status(409).json({
        success: false,
        message:
          "A referee with this license number already exists",
      });
    }

    // --------------------------------------------------
    // CREATE REFEREE
    // --------------------------------------------------

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
            license_number.trim(),

          // Never trust client for status
          status: "ACTIVE",
        },
      });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.REFEREE_CREATED,

      entity_type: "REFEREE",

      entity_id:
        referee.referee_id,

      details: {
        name: referee.name,
        license_number:
          referee.license_number,
      },
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Referee created successfully",
      data: referee,
    });
  } catch (error) {
    // --------------------------------------------------
    // UNIQUE LICENSE NUMBER
    // --------------------------------------------------

    if (error.code === "P2002") {
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
        orderBy: {
          name: "asc",
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
    const refereeId = Number(
      req.params.referee_id
    );

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message: "Referee not found",
      });
    }

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
    const refereeId = Number(
      req.params.referee_id
    );

    const {
      name,
      profile_photo,
      phone,
      region,
      district,
      city,
      license_number,
    } = req.body;

    // --------------------------------------------------
    // FIND REFEREE
    // --------------------------------------------------

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message: "Referee not found",
      });
    }

    // --------------------------------------------------
    // CHECK LICENSE NUMBER
    // --------------------------------------------------

    if (
      license_number &&
      license_number.trim() !==
        referee.license_number
    ) {
      const existingReferee =
        await prisma.referee.findUnique({
          where: {
            license_number:
              license_number.trim(),
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

    // --------------------------------------------------
    // BUILD UPDATE DATA
    // --------------------------------------------------

    const updateData = {};

    if (name !== undefined) {
      updateData.name =
        name.trim();
    }

    if (
      profile_photo !== undefined
    ) {
      updateData.profile_photo =
        profile_photo?.trim() || null;
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

    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    const updatedReferee =
      await prisma.referee.update({
        where: {
          referee_id: refereeId,
        },

        data: updateData,
      });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.REFEREE_UPDATED,

      entity_type: "REFEREE",

      entity_id:
        refereeId,

      details: {
        updated_fields:
          Object.keys(updateData),
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Referee updated successfully",
      data: updatedReferee,
    });
  } catch (error) {
    if (error.code === "P2002") {
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
    const refereeId = Number(
      req.params.referee_id
    );

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message: "Referee not found",
      });
    }

    if (referee.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message:
          "Referee is already inactive",
      });
    }

    const updatedReferee =
      await prisma.referee.update({
        where: {
          referee_id: refereeId,
        },

        data: {
          status: "INACTIVE",
        },
      });

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
    const refereeId = Number(
      req.params.referee_id
    );

    const referee =
      await prisma.referee.findUnique({
        where: {
          referee_id: refereeId,
        },
      });

    if (!referee) {
      return res.status(404).json({
        success: false,
        message: "Referee not found",
      });
    }

    if (referee.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message:
          "Referee is already active",
      });
    }

    const updatedReferee =
      await prisma.referee.update({
        where: {
          referee_id: refereeId,
        },

        data: {
          status: "ACTIVE",
        },
      });

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