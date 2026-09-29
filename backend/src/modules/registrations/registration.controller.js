import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";
import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// REGISTRATION CONSTANTS
// ======================================================

const REGISTRATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
};

// ======================================================
// DATE-ONLY HELPER
// ======================================================

const getTodayDateOnly = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateOnly = (date) => {
  const year = date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ======================================================
// CREATE REGISTRATION
// ======================================================

export const createRegistration = async (
  req,
  res
) => {
  try {
    const competitionId = Number(
      req.body.competition_id
    );

    const teamId = Number(
      req.body.team_id
    );

    // --------------------------------------------------
    // FIND COMPETITION
    // --------------------------------------------------

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

    // --------------------------------------------------
    // COMPETITION STATUS
    // --------------------------------------------------

    if (competition.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message:
          "Registration is not available for this competition",
      });
    }

    // --------------------------------------------------
    // SEASON STATUS
    // --------------------------------------------------

    if (
      competition.season.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration is not available because the season is inactive",
      });
    }

    // --------------------------------------------------
    // REGISTRATION PERIOD
    // --------------------------------------------------

    const today = getTodayDateOnly();

    const registrationStart =
      formatDateOnly(
        competition.registration_start_date
      );

    const registrationEnd =
      formatDateOnly(
        competition.registration_end_date
      );

    if (
      today < registrationStart ||
      today > registrationEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration period is not currently open",
      });
    }

    // --------------------------------------------------
    // FIND TEAM
    // --------------------------------------------------

    const team = await prisma.team.findUnique({
      where: {
        team_id: teamId,
      },
      include: {
        club: true,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // --------------------------------------------------
    // TEAM STATUS
    // --------------------------------------------------

    if (team.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message:
          "Inactive teams cannot register",
      });
    }

    // --------------------------------------------------
    // OWNERSHIP CHECK
    // --------------------------------------------------

    const isSuperAdmin =
      req.user.role === ROLES.SUPER_ADMIN;

    const isTeamOwner =
      team.owner_id === req.user.user_id;

    const isClubOwner =
      team.club.owner_id === req.user.user_id;

    if (
      !isSuperAdmin &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to register this team",
      });
    }

    // --------------------------------------------------
    // GENDER CHECK
    // --------------------------------------------------

    if (
      team.gender !== competition.gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team gender does not match competition gender",
      });
    }

    // --------------------------------------------------
    // DUPLICATE REGISTRATION CHECK
    // --------------------------------------------------

    const existingRegistration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            competition_id_team_id: {
              competition_id: competitionId,
              team_id: teamId,
            },
          },
        }
      );

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message:
          "This team is already registered for this competition",
      });
    }

    // --------------------------------------------------
    // MAXIMUM TEAM LIMIT
    // --------------------------------------------------

    if (competition.max_teams !== null) {
      const registrationCount =
        await prisma.competitionRegistration.count({
          where: {
            competition_id: competitionId,
            registration_status: {
              not: REGISTRATION_STATUS.REJECTED,
            },
          },
        });

      if (
        registrationCount >=
        competition.max_teams
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum number of teams has been reached",
        });
      }
    }

    // --------------------------------------------------
    // CREATE REGISTRATION
    // --------------------------------------------------

    const registration =
      await prisma.competitionRegistration.create({
        data: {
          competition_id: competitionId,
          team_id: teamId,
          registered_by: req.user.user_id,

          registration_status:
            REGISTRATION_STATUS.PENDING,

          payment_status:
            PAYMENT_STATUS.UNPAID,

          registration_date:
            new Date(),
        },

        include: {
          competition: {
            select: {
              competition_id: true,
              name: true,
              gender: true,
            },
          },

          team: {
            select: {
              team_id: true,
              name: true,
              gender: true,
            },
          },
        },
      });

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.REGISTRATION_CREATED,

      entity_type: "REGISTRATION",

      entity_id:
        registration.registration_id,

      details: {
        competition_id:
          competitionId,

        team_id:
          teamId,

        registration_status:
          registration.registration_status,
      },
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Team registration submitted successfully",
      data: registration,
    });
  } catch (error) {
    console.error(
      "Create registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the registration",
    });
  }
};

// ======================================================
// GET ALL REGISTRATIONS
// ======================================================

export const getRegistrations = async (
  req,
  res
) => {
  try {
    const registrations =
      await prisma.competitionRegistration.findMany({
        orderBy: {
          created_at: "desc",
        },

        include: {
          competition: {
            select: {
              competition_id: true,
              name: true,
              gender: true,
            },
          },

          team: {
            select: {
              team_id: true,
              name: true,
              gender: true,
            },
          },

          registered_user: {
            select: {
              user_id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error(
      "Get registrations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching registrations",
    });
  }
};

// ======================================================
// GET REGISTRATION BY ID
// ======================================================

export const getRegistrationById = async (
  req,
  res
) => {
  try {
    const registrationId = Number(
      req.params.registration_id
    );

    const registration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            registration_id: registrationId,
          },

          include: {
            competition: {
              select: {
                competition_id: true,
                name: true,
                gender: true,
                registration_fee: true,
                registration_start_date: true,
                registration_end_date: true,
                competition_start_date: true,
                competition_end_date: true,
                status: true,
              },
            },

            team: {
              select: {
                team_id: true,
                name: true,
                gender: true,
                owner_id: true,
                club: {
                  select: {
                    club_id: true,
                    name: true,
                    owner_id: true,
                  },
                },
              },
            },

            registered_user: {
              select: {
                user_id: true,
                name: true,
                email: true,
              },
            },
          },
        }
      );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // --------------------------------------------------
    // AUTHORIZATION / OWNERSHIP CHECK
    // --------------------------------------------------

    const isSuperAdmin =
      req.user.role === ROLES.SUPER_ADMIN;

    const isRegisteredUser =
      registration.registered_by ===
      req.user.user_id;

    const isTeamOwner =
      registration.team.owner_id ===
      req.user.user_id;

    const isClubOwner =
      registration.team.club.owner_id ===
      req.user.user_id;

    if (
      !isSuperAdmin &&
      !isRegisteredUser &&
      !isTeamOwner &&
      !isClubOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view this registration",
      });
    }

    return res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error(
      "Get registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the registration",
    });
  }
};

// ======================================================
// REVIEW REGISTRATION
// ======================================================

export const reviewRegistration = async (
  req,
  res
) => {
  try {
    const registrationId = Number(
      req.params.registration_id
    );

    const {
      action,
      remarks,
    } = req.body;

    // --------------------------------------------------
    // FIND REGISTRATION
    // --------------------------------------------------

    const registration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            registration_id:
              registrationId,
          },
        }
      );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // --------------------------------------------------
    // ONLY PENDING REGISTRATIONS
    // --------------------------------------------------

    if (
      registration.registration_status !==
      REGISTRATION_STATUS.PENDING
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending registrations can be reviewed",
      });
    }

    // --------------------------------------------------
    // DETERMINE NEW STATUS
    // --------------------------------------------------

    const newStatus =
      action === "APPROVE"
        ? REGISTRATION_STATUS.APPROVED
        : REGISTRATION_STATUS.REJECTED;

    // --------------------------------------------------
    // TRANSACTION
    // --------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          const updatedRegistration =
            await tx.competitionRegistration.update(
              {
                where: {
                  registration_id:
                    registrationId,
                },

                data: {
                  registration_status:
                    newStatus,

                  approved_at:
                    newStatus ===
                    REGISTRATION_STATUS.APPROVED
                      ? new Date()
                      : null,

                  rejection_reason:
                    newStatus ===
                    REGISTRATION_STATUS.REJECTED
                      ? remarks?.trim() || null
                      : null,
                },
              }
            );

          const history =
            await tx.registrationApprovalHistory.create(
              {
                data: {
                  registration_id:
                    registrationId,

                  reviewed_by:
                    req.user.user_id,

                  action,

                  remarks:
                    remarks?.trim() || null,
                },
              }
            );

          return {
            updatedRegistration,
            history,
          };
        }
      );

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.REGISTRATION_REVIEWED,

      entity_type: "REGISTRATION",

      entity_id:
        registrationId,

      details: {
        action,

        previous_status:
          registration.registration_status,

        new_status:
          newStatus,
      },
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        `Registration ${action.toLowerCase()}d successfully`,
      data: result.updatedRegistration,
    });
  } catch (error) {
    console.error(
      "Review registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while reviewing the registration",
    });
  }
};