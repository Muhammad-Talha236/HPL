import prisma from "../../database/prisma.js";

import {
  createAuditLog,
} from "../../utils/auditLog.util.js";

import {
  AUDIT_ACTIONS,
} from "../../constants/auditActions.js";

// ======================================================
// CONSTANTS
// ======================================================

const COMPETITION_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

const SEASON_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ======================================================
// CREATE COMPETITION
// ======================================================

export const createCompetition = async (
  req,
  res
) => {
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

    // ==================================================
    // 1. NORMALIZE BASIC INPUT
    // ==================================================

    const seasonId =
      Number(season_id);

    const normalizedName =
      name.trim();

    const normalizedGender =
      gender.trim();

    const normalizedFormat =
      format.trim();

    const registrationStart =
      new Date(
        registration_start_date
      );

    const registrationEnd =
      new Date(
        registration_end_date
      );

    const competitionStart =
      new Date(
        competition_start_date
      );

    const competitionEnd =
      new Date(
        competition_end_date
      );

    // ==================================================
    // 2. VALIDATE DATES
    // ==================================================

    if (
      Number.isNaN(
        registrationStart.getTime()
      ) ||
      Number.isNaN(
        registrationEnd.getTime()
      ) ||
      Number.isNaN(
        competitionStart.getTime()
      ) ||
      Number.isNaN(
        competitionEnd.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more competition dates are invalid",
      });
    }

    if (
      registrationEnd <=
      registrationStart
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration end date must be after registration start date",
      });
    }

    if (
      competitionStart <
      registrationEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition start date cannot be before registration ends",
      });
    }

    if (
      competitionEnd <=
      competitionStart
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition end date must be after competition start date",
      });
    }

    // ==================================================
    // 3. FIND SEASON
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
        },
      });

    if (!season) {
      return res.status(404).json({
        success: false,
        message:
          "Season not found",
      });
    }

    if (
      season.status !==
      SEASON_STATUS.ACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition can only be created under an active season",
      });
    }

    // ==================================================
    // 4. VALIDATE COMPETITION DATES AGAINST SEASON
    // ==================================================

    if (
      registrationStart <
        season.start_date ||
      competitionEnd >
        season.end_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Competition dates must fall within the season dates",
      });
    }

    // ==================================================
    // 5. CHECK DUPLICATE NAME
    // ==================================================

    const existingCompetition =
      await prisma.competition.findFirst({
        where: {
          season_id:
            seasonId,

          name:
            normalizedName,
        },

        select: {
          competition_id: true,
        },
      });

    if (existingCompetition) {
      return res.status(409).json({
        success: false,
        message:
          "A competition with this name already exists in this season",
      });
    }

    // ==================================================
    // 6. CREATE COMPETITION
    // ==================================================

    const competition =
      await prisma.competition.create({
        data: {
          season_id:
            seasonId,

          name:
            normalizedName,

          gender:
            normalizedGender,

          description:
            description !==
            undefined
              ? description?.trim() ||
                null
              : null,

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
            max_teams !==
            undefined
              ? Number(max_teams)
              : null,

          squad_size:
            squad_size !==
            undefined
              ? Number(squad_size)
              : null,

          format:
            normalizedFormat,

          eligibility_rules:
            eligibility_rules !==
            undefined
              ? eligibility_rules?.trim() ||
                null
              : null,

          refund_policy:
            refund_policy !==
            undefined
              ? refund_policy?.trim() ||
                null
              : null,

          // Server controls status
          status:
            COMPETITION_STATUS.ACTIVE,
        },

        select: {
          competition_id: true,
          season_id: true,
          name: true,
          gender: true,
          description: true,
          registration_fee: true,
          registration_start_date: true,
          registration_end_date: true,
          competition_start_date: true,
          competition_end_date: true,
          max_teams: true,
          squad_size: true,
          format: true,
          eligibility_rules: true,
          refund_policy: true,
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
        AUDIT_ACTIONS.COMPETITION_CREATED,

      entity_type:
        "COMPETITION",

      entity_id:
        competition.competition_id,

      details: {
        name:
          competition.name,

        season_id:
          competition.season_id,

        gender:
          competition.gender,

        registration_start_date:
          competition.registration_start_date.toISOString(),

        registration_end_date:
          competition.registration_end_date.toISOString(),

        competition_start_date:
          competition.competition_start_date.toISOString(),

        competition_end_date:
          competition.competition_end_date.toISOString(),
      },
    });

    // ==================================================
    // 8. RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Competition created successfully",

      data:
        competition,
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

export const getCompetitions = async (
  req,
  res
) => {
  try {
    const competitions =
      await prisma.competition.findMany({
        orderBy: [
          {
            competition_start_date:
              "desc",
          },
          {
            competition_id:
              "desc",
          },
        ],

        select: {
          competition_id: true,
          season_id: true,
          name: true,
          gender: true,
          description: true,
          registration_fee: true,
          registration_start_date: true,
          registration_end_date: true,
          competition_start_date: true,
          competition_end_date: true,
          max_teams: true,
          squad_size: true,
          format: true,
          eligibility_rules: true,
          refund_policy: true,
          status: true,
          created_at: true,
          updated_at: true,

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

      data:
        competitions,
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

export const getCompetitionById =
  async (
    req,
    res
  ) => {
    try {
      const competitionId =
        Number(
          req.params.competition_id
        );

      if (
        !Number.isInteger(
          competitionId
        ) ||
        competitionId < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Competition ID must be a positive integer",
        });
      }

      const competition =
        await prisma.competition.findUnique({
          where: {
            competition_id:
              competitionId,
          },

          select: {
            competition_id: true,
            season_id: true,
            name: true,
            gender: true,
            description: true,
            registration_fee: true,
            registration_start_date: true,
            registration_end_date: true,
            competition_start_date: true,
            competition_end_date: true,
            max_teams: true,
            squad_size: true,
            format: true,
            eligibility_rules: true,
            refund_policy: true,
            status: true,
            created_at: true,
            updated_at: true,

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
          message:
            "Competition not found",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          competition,
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

export const updateCompetition =
  async (
    req,
    res
  ) => {
    try {
      const competitionId =
        Number(
          req.params.competition_id
        );

      if (
        !Number.isInteger(
          competitionId
        ) ||
        competitionId < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Competition ID must be a positive integer",
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

      // ==================================================
      // 1. FIND CURRENT COMPETITION
      // ==================================================

      const competition =
        await prisma.competition.findUnique({
          where: {
            competition_id:
              competitionId,
          },

          select: {
            competition_id: true,
            season_id: true,
            name: true,
            gender: true,
            description: true,
            registration_fee: true,
            registration_start_date: true,
            registration_end_date: true,
            competition_start_date: true,
            competition_end_date: true,
            max_teams: true,
            squad_size: true,
            format: true,
            eligibility_rules: true,
            refund_policy: true,
            status: true,

            season: {
              select: {
                season_id: true,
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
          message:
            "Competition not found",
        });
      }

      // ==================================================
      // 2. BUILD UPDATE DATA
      // ==================================================

      const updateData = {};

      if (name !== undefined) {
        updateData.name =
          name.trim();
      }

      if (
        description !==
        undefined
      ) {
        updateData.description =
          description?.trim() ||
          null;
      }

      if (
        registration_fee !==
        undefined
      ) {
        updateData.registration_fee =
          registration_fee;
      }

      if (
        registration_start_date !==
        undefined
      ) {
        const date =
          new Date(
            registration_start_date
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Registration start date is invalid",
          });
        }

        updateData.registration_start_date =
          date;
      }

      if (
        registration_end_date !==
        undefined
      ) {
        const date =
          new Date(
            registration_end_date
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Registration end date is invalid",
          });
        }

        updateData.registration_end_date =
          date;
      }

      if (
        competition_start_date !==
        undefined
      ) {
        const date =
          new Date(
            competition_start_date
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Competition start date is invalid",
          });
        }

        updateData.competition_start_date =
          date;
      }

      if (
        competition_end_date !==
        undefined
      ) {
        const date =
          new Date(
            competition_end_date
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Competition end date is invalid",
          });
        }

        updateData.competition_end_date =
          date;
      }

      if (
        max_teams !==
        undefined
      ) {
        updateData.max_teams =
          Number(max_teams);
      }

      if (
        squad_size !==
        undefined
      ) {
        updateData.squad_size =
          Number(squad_size);
      }

      if (format !== undefined) {
        updateData.format =
          format.trim();
      }

      if (
        eligibility_rules !==
        undefined
      ) {
        updateData.eligibility_rules =
          eligibility_rules?.trim() ||
          null;
      }

      if (
        refund_policy !==
        undefined
      ) {
        updateData.refund_policy =
          refund_policy?.trim() ||
          null;
      }

      // ==================================================
      // 3. CHECK EMPTY UPDATE
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
      // 4. DETERMINE FINAL DATES
      // ==================================================

      const finalRegistrationStart =
        updateData.registration_start_date ??
        competition.registration_start_date;

      const finalRegistrationEnd =
        updateData.registration_end_date ??
        competition.registration_end_date;

      const finalCompetitionStart =
        updateData.competition_start_date ??
        competition.competition_start_date;

      const finalCompetitionEnd =
        updateData.competition_end_date ??
        competition.competition_end_date;

      // ==================================================
      // 5. VALIDATE DATE ORDER
      // ==================================================

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

      // ==================================================
      // 6. VALIDATE AGAINST SEASON
      // ==================================================

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

      // ==================================================
      // 7. CHECK DUPLICATE NAME
      // ==================================================

      if (
        updateData.name !==
          undefined &&
        updateData.name !==
          competition.name
      ) {
        const duplicateCompetition =
          await prisma.competition.findFirst({
            where: {
              season_id:
                competition.season_id,

              name:
                updateData.name,

              NOT: {
                competition_id:
                  competitionId,
              },
            },

            select: {
              competition_id: true,
            },
          });

        if (
          duplicateCompetition
        ) {
          return res.status(409).json({
            success: false,
            message:
              "A competition with this name already exists in this season",
          });
        }
      }

      // ==================================================
      // 8. CHECK EXISTING REGISTRATIONS
      // ==================================================

      const registrationCount =
        await prisma.competitionRegistration.count({
          where: {
            competition_id:
              competitionId,
          },
        });

      // max_teams cannot become smaller than
      // the number of already-created registrations.
      if (
        updateData.max_teams !==
          undefined &&
        updateData.max_teams !==
          null &&
        updateData.max_teams <
          registrationCount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum teams cannot be less than the number of existing registrations",
        });
      }

      // ==================================================
      // 9. CHECK EXISTING REGISTRATION DATES
      // ==================================================

      const invalidRegistration =
        await prisma.competitionRegistration.findFirst({
          where: {
            competition_id:
              competitionId,

            OR: [
              {
                registration_date: {
                  lt:
                    finalRegistrationStart,
                },
              },
              {
                registration_date: {
                  gt:
                    finalRegistrationEnd,
                },
              },
            ],
          },

          select: {
            registration_id: true,
          },
        });

      if (invalidRegistration) {
        return res.status(400).json({
          success: false,
          message:
            "Competition registration dates cannot exclude an existing team registration",
        });
      }

      // ==================================================
      // 10. CHECK EXISTING MATCH DATES
      // ==================================================

      const invalidMatch =
        await prisma.match.findFirst({
          where: {
            competition_id:
              competitionId,

            OR: [
              {
                match_date: {
                  lt:
                    finalCompetitionStart,
                },
              },
              {
                match_date: {
                  gt:
                    finalCompetitionEnd,
                },
              },
            ],
          },

          select: {
            match_id: true,
          },
        });

      if (invalidMatch) {
        return res.status(400).json({
          success: false,
          message:
            "Competition dates cannot exclude an existing match",
        });
      }

      // ==================================================
      // 11. UPDATE COMPETITION
      // ==================================================

      const updatedCompetition =
        await prisma.competition.update({
          where: {
            competition_id:
              competitionId,
          },

          data: updateData,

          select: {
            competition_id: true,
            season_id: true,
            name: true,
            gender: true,
            description: true,
            registration_fee: true,
            registration_start_date: true,
            registration_end_date: true,
            competition_start_date: true,
            competition_end_date: true,
            max_teams: true,
            squad_size: true,
            format: true,
            eligibility_rules: true,
            refund_policy: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        });

      // ==================================================
      // 12. AUDIT LOG
      // ==================================================

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS.COMPETITION_UPDATED,

        entity_type:
          "COMPETITION",

        entity_id:
          competitionId,

        details: {
          updated_fields:
            Object.keys(
              updateData
            ),

          previous_name:
            competition.name,

          new_name:
            updatedCompetition.name,

          previous_registration_start_date:
            competition.registration_start_date.toISOString(),

          new_registration_start_date:
            updatedCompetition.registration_start_date.toISOString(),

          previous_registration_end_date:
            competition.registration_end_date.toISOString(),

          new_registration_end_date:
            updatedCompetition.registration_end_date.toISOString(),

          previous_competition_start_date:
            competition.competition_start_date.toISOString(),

          new_competition_start_date:
            updatedCompetition.competition_start_date.toISOString(),

          previous_competition_end_date:
            competition.competition_end_date.toISOString(),

          new_competition_end_date:
            updatedCompetition.competition_end_date.toISOString(),
        },
      });

      // ==================================================
      // 13. RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Competition updated successfully",

        data:
          updatedCompetition,
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

export const deactivateCompetition =
  async (
    req,
    res
  ) => {
    try {
      const competitionId =
        Number(
          req.params.competition_id
        );

      if (
        !Number.isInteger(
          competitionId
        ) ||
        competitionId < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Competition ID must be a positive integer",
        });
      }

      const competition =
        await prisma.competition.findUnique({
          where: {
            competition_id:
              competitionId,
          },

          select: {
            competition_id: true,
            name: true,
            status: true,
          },
        });

      if (!competition) {
        return res.status(404).json({
          success: false,
          message:
            "Competition not found",
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

      // ==================================================
      // CONDITIONAL STATE TRANSITION
      // ==================================================

      const updateResult =
        await prisma.competition.updateMany({
          where: {
            competition_id:
              competitionId,

            status:
              COMPETITION_STATUS.ACTIVE,
          },

          data: {
            status:
              COMPETITION_STATUS.INACTIVE,
          },
        });

      if (
        updateResult.count !==
        1
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Competition status changed before deactivation could be completed",
        });
      }

      const updatedCompetition =
        await prisma.competition.findUnique({
          where: {
            competition_id:
              competitionId,
          },

          select: {
            competition_id: true,
            season_id: true,
            name: true,
            gender: true,
            description: true,
            registration_fee: true,
            registration_start_date: true,
            registration_end_date: true,
            competition_start_date: true,
            competition_end_date: true,
            max_teams: true,
            squad_size: true,
            format: true,
            eligibility_rules: true,
            refund_policy: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        });

      // ==================================================
      // AUDIT LOG
      // ==================================================

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS.COMPETITION_DEACTIVATED,

        entity_type:
          "COMPETITION",

        entity_id:
          competitionId,

        details: {
          previous_status:
            competition.status,

          new_status:
            updatedCompetition.status,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Competition deactivated successfully",

        data:
          updatedCompetition,
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

export const activateCompetition =
  async (
    req,
    res
  ) => {
    try {
      const competitionId =
        Number(
          req.params.competition_id
        );

      if (
        !Number.isInteger(
          competitionId
        ) ||
        competitionId < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Competition ID must be a positive integer",
        });
      }

      const competition =
        await prisma.competition.findUnique({
          where: {
            competition_id:
              competitionId,
          },

          select: {
            competition_id: true,
            name: true,
            status: true,

            season: {
              select: {
                season_id: true,
                status: true,
              },
            },
          },
        });

      if (!competition) {
        return res.status(404).json({
          success: false,
          message:
            "Competition not found",
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

      // ==================================================
      // SEASON MUST BE ACTIVE
      // ==================================================

      if (
        competition.season.status !==
        SEASON_STATUS.ACTIVE
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Competition cannot be activated under an inactive season",
        });
      }

      // ==================================================
      // CONDITIONAL STATE TRANSITION
      // ==================================================

      const updateResult =
        await prisma.competition.updateMany({
          where: {
            competition_id:
              competitionId,

            status:
              COMPETITION_STATUS.INACTIVE,
          },

          data: {
            status:
              COMPETITION_STATUS.ACTIVE,
          },
        });

      if (
        updateResult.count !==
        1
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Competition status changed before activation could be completed",
        });
      }

      const updatedCompetition =
        await prisma.competition.findUnique({
          where: {
            competition_id:
              competitionId,
          },

          select: {
            competition_id: true,
            season_id: true,
            name: true,
            gender: true,
            description: true,
            registration_fee: true,
            registration_start_date: true,
            registration_end_date: true,
            competition_start_date: true,
            competition_end_date: true,
            max_teams: true,
            squad_size: true,
            format: true,
            eligibility_rules: true,
            refund_policy: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        });

      // ==================================================
      // AUDIT LOG
      // ==================================================

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS.COMPETITION_ACTIVATED,

        entity_type:
          "COMPETITION",

        entity_id:
          competitionId,

        details: {
          previous_status:
            competition.status,

          new_status:
            updatedCompetition.status,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Competition activated successfully",

        data:
          updatedCompetition,
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