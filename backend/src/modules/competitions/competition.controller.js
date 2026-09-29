import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// CONSTANTS
// ======================================================

const COMPETITION_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ======================================================
// CREATE COMPETITION
// ======================================================

export const createCompetition = async (req, res) => {
  try {
    const {
      season_id,
      name,
      gender,
      description,
      registration_fee,
      registration_start_date,
      registration_end_date,
      competition_start_date,
      competition_end_date,
      max_teams,
      squad_size,
      format,
      eligibility_rules,
      refund_policy,
    } = req.body;

    // --------------------------------------------------
    // CHECK SEASON
    // --------------------------------------------------

    const season = await prisma.season.findUnique({
      where: {
        season_id: Number(season_id),
      },
    });

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (season.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message:
          "Competition can only be created under an active season",
      });
    }

    // --------------------------------------------------
    // VALIDATE DATE ORDER
    // --------------------------------------------------

    const registrationStart =
      new Date(registration_start_date);

    const registrationEnd =
      new Date(registration_end_date);

    const competitionStart =
      new Date(competition_start_date);

    const competitionEnd =
      new Date(competition_end_date);

    if (registrationEnd <= registrationStart) {
      return res.status(400).json({
        success: false,
        message:
          "Registration end date must be after registration start date",
      });
    }

    if (competitionStart < registrationEnd) {
      return res.status(400).json({
        success: false,
        message:
          "Competition start date cannot be before registration ends",
      });
    }

    if (competitionEnd <= competitionStart) {
      return res.status(400).json({
        success: false,
        message:
          "Competition end date must be after competition start date",
      });
    }

    // --------------------------------------------------
    // CHECK COMPETITION DATES AGAINST SEASON
    // --------------------------------------------------

    if (
      registrationStart < season.start_date ||
      competitionEnd > season.end_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition dates must fall within the season dates",
      });
    }

    // --------------------------------------------------
    // CHECK DUPLICATE NAME
    // --------------------------------------------------

    const existingCompetition =
      await prisma.competition.findFirst({
        where: {
          season_id: Number(season_id),
          name: name.trim(),
        },
      });

    if (existingCompetition) {
      return res.status(409).json({
        success: false,
        message:
          "A competition with this name already exists in this season",
      });
    }

    // --------------------------------------------------
    // CREATE COMPETITION
    // --------------------------------------------------

    const competition =
      await prisma.competition.create({
        data: {
          season_id: Number(season_id),
          name: name.trim(),
          gender: gender.trim(),
          description:
            description !== undefined
              ? description.trim()
              : undefined,

          registration_fee,

          registration_start_date:
            registrationStart,

          registration_end_date:
            registrationEnd,

          competition_start_date:
            competitionStart,

          competition_end_date:
            competitionEnd,

          max_teams:
            max_teams !== undefined
              ? Number(max_teams)
              : undefined,

          squad_size:
            squad_size !== undefined
              ? Number(squad_size)
              : undefined,

          format: format.trim(),

          eligibility_rules:
            eligibility_rules !== undefined
              ? eligibility_rules.trim()
              : undefined,

          refund_policy:
            refund_policy !== undefined
              ? refund_policy.trim()
              : undefined,

          status: COMPETITION_STATUS.ACTIVE,
        },
      });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.COMPETITION_CREATED,
      entity_type: "COMPETITION",
      entity_id: competition.competition_id,
      details: {
        name: competition.name,
        season_id: competition.season_id,
        gender: competition.gender,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Competition created successfully",
      data: competition,
    });
  } catch (error) {
    console.error(
      "Create competition error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the competition",
    });
  }
};

// ======================================================
// GET ALL COMPETITIONS
// ======================================================

export const getCompetitions = async (req, res) => {
  try {
    const competitions =
      await prisma.competition.findMany({
        orderBy: {
          competition_start_date: "desc",
        },
        include: {
          season: {
            select: {
              season_id: true,
              name: true,
              status: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      data: competitions,
    });
  } catch (error) {
    console.error(
      "Get competitions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching competitions",
    });
  }
};

// ======================================================
// GET COMPETITION BY ID
// ======================================================

export const getCompetitionById = async (
  req,
  res
) => {
  try {
    const competitionId = Number(
      req.params.competition_id
    );

    if (
      !Number.isInteger(competitionId) ||
      competitionId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid competition ID",
      });
    }

    const competition =
      await prisma.competition.findUnique({
        where: {
          competition_id: competitionId,
        },
        include: {
          season: {
            select: {
              season_id: true,
              name: true,
              start_date: true,
              end_date: true,
              status: true,
            },
          },
        },
      });

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: competition,
    });
  } catch (error) {
    console.error(
      "Get competition error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the competition",
    });
  }
};

// ======================================================
// UPDATE COMPETITION
// ======================================================

export const updateCompetition = async (
  req,
  res
) => {
  try {
    const competitionId = Number(
      req.params.competition_id
    );

    if (
      !Number.isInteger(competitionId) ||
      competitionId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid competition ID",
      });
    }

    const competition =
      await prisma.competition.findUnique({
        where: {
          competition_id: competitionId,
        },
        include: {
          season: true,
        },
      });

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    const {
      name,
      description,
      registration_fee,
      registration_start_date,
      registration_end_date,
      competition_start_date,
      competition_end_date,
      max_teams,
      squad_size,
      format,
      eligibility_rules,
      refund_policy,
    } = req.body;

    // --------------------------------------------------
    // CHECK DUPLICATE NAME
    // --------------------------------------------------

    if (name !== undefined) {
      const duplicateCompetition =
        await prisma.competition.findFirst({
          where: {
            season_id: competition.season_id,
            name: name.trim(),
            NOT: {
              competition_id: competitionId,
            },
          },
        });

      if (duplicateCompetition) {
        return res.status(409).json({
          success: false,
          message:
            "A competition with this name already exists in this season",
        });
      }
    }

    // --------------------------------------------------
    // CALCULATE FINAL VALUES
    // --------------------------------------------------

    const finalRegistrationStart =
      registration_start_date !== undefined
        ? new Date(registration_start_date)
        : competition.registration_start_date;

    const finalRegistrationEnd =
      registration_end_date !== undefined
        ? new Date(registration_end_date)
        : competition.registration_end_date;

    const finalCompetitionStart =
      competition_start_date !== undefined
        ? new Date(competition_start_date)
        : competition.competition_start_date;

    const finalCompetitionEnd =
      competition_end_date !== undefined
        ? new Date(competition_end_date)
        : competition.competition_end_date;

    // --------------------------------------------------
    // VALIDATE DATE ORDER
    // --------------------------------------------------

    if (
      finalRegistrationEnd <=
      finalRegistrationStart
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration end date must be after registration start date",
      });
    }

    if (
      finalCompetitionStart <
      finalRegistrationEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition start date cannot be before registration ends",
      });
    }

    if (
      finalCompetitionEnd <=
      finalCompetitionStart
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition end date must be after competition start date",
      });
    }

    // --------------------------------------------------
    // VALIDATE AGAINST SEASON
    // --------------------------------------------------

    if (
      finalRegistrationStart <
        competition.season.start_date ||
      finalCompetitionEnd >
        competition.season.end_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition dates must fall within the season dates",
      });
    }

    // --------------------------------------------------
    // UPDATE COMPETITION
    // --------------------------------------------------

    const updatedCompetition =
      await prisma.competition.update({
        where: {
          competition_id: competitionId,
        },
        data: {
          ...(name !== undefined && {
            name: name.trim(),
          }),

          ...(description !== undefined && {
            description: description.trim(),
          }),

          ...(registration_fee !== undefined && {
            registration_fee,
          }),

          ...(registration_start_date !==
            undefined && {
            registration_start_date:
              finalRegistrationStart,
          }),

          ...(registration_end_date !== undefined && {
            registration_end_date:
              finalRegistrationEnd,
          }),

          ...(competition_start_date !==
            undefined && {
            competition_start_date:
              finalCompetitionStart,
          }),

          ...(competition_end_date !== undefined && {
            competition_end_date:
              finalCompetitionEnd,
          }),

          ...(max_teams !== undefined && {
            max_teams: Number(max_teams),
          }),

          ...(squad_size !== undefined && {
            squad_size: Number(squad_size),
          }),

          ...(format !== undefined && {
            format: format.trim(),
          }),

          ...(eligibility_rules !== undefined && {
            eligibility_rules:
              eligibility_rules.trim(),
          }),

          ...(refund_policy !== undefined && {
            refund_policy:
              refund_policy.trim(),
          }),
        },
      });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.COMPETITION_UPDATED,
      entity_type: "COMPETITION",
      entity_id: competitionId,
      details: {
        previous_name: competition.name,
        new_name: updatedCompetition.name,
        previous_status: competition.status,
        new_status: updatedCompetition.status,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Competition updated successfully",
      data: updatedCompetition,
    });
  } catch (error) {
    console.error(
      "Update competition error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the competition",
    });
  }
};

// ======================================================
// DEACTIVATE COMPETITION
// ======================================================

export const deactivateCompetition = async (
  req,
  res
) => {
  try {
    const competitionId = Number(
      req.params.competition_id
    );

    if (
      !Number.isInteger(competitionId) ||
      competitionId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid competition ID",
      });
    }

    const competition =
      await prisma.competition.findUnique({
        where: {
          competition_id: competitionId,
        },
      });

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    if (
      competition.status ===
      COMPETITION_STATUS.INACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition is already inactive",
      });
    }

    const updatedCompetition =
      await prisma.competition.update({
        where: {
          competition_id: competitionId,
        },
        data: {
          status: COMPETITION_STATUS.INACTIVE,
        },
      });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action:
        AUDIT_ACTIONS.COMPETITION_DEACTIVATED,
      entity_type: "COMPETITION",
      entity_id: competitionId,
      details: {
        previous_status: competition.status,
        new_status: updatedCompetition.status,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Competition deactivated successfully",
      data: updatedCompetition,
    });
  } catch (error) {
    console.error(
      "Deactivate competition error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deactivating the competition",
    });
  }
};

// ======================================================
// ACTIVATE COMPETITION
// ======================================================

export const activateCompetition = async (
  req,
  res
) => {
  try {
    const competitionId = Number(
      req.params.competition_id
    );

    if (
      !Number.isInteger(competitionId) ||
      competitionId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid competition ID",
      });
    }

    const competition =
      await prisma.competition.findUnique({
        where: {
          competition_id: competitionId,
        },
        include: {
          season: true,
        },
      });

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    if (
      competition.status ===
      COMPETITION_STATUS.ACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition is already active",
      });
    }

    // Competition should not be activated
    // under an inactive season.
    if (competition.season.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message:
          "Competition cannot be activated under an inactive season",
      });
    }

    const updatedCompetition =
      await prisma.competition.update({
        where: {
          competition_id: competitionId,
        },
        data: {
          status: COMPETITION_STATUS.ACTIVE,
        },
      });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action:
        AUDIT_ACTIONS.COMPETITION_ACTIVATED,
      entity_type: "COMPETITION",
      entity_id: competitionId,
      details: {
        previous_status: competition.status,
        new_status: updatedCompetition.status,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Competition activated successfully",
      data: updatedCompetition,
    });
  } catch (error) {
    console.error(
      "Activate competition error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while activating the competition",
    });
  }
};