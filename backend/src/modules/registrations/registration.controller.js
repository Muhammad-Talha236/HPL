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

  const year = now.getUTCFullYear();

  const month = String(
    now.getUTCMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getUTCDate()
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

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------
          // FIND COMPETITION
          // ------------------------------------------------

          const competition =
            await tx.competition.findUnique({
              where: {
                competition_id:
                  competitionId,
              },

              select: {
                competition_id: true,
                name: true,
                gender: true,
                status: true,
                max_teams: true,
                registration_start_date: true,
                registration_end_date: true,
                season: {
                  select: {
                    season_id: true,
                    status: true,
                  },
                },
              },
            });

          if (!competition) {
            throw new Error(
              "COMPETITION_NOT_FOUND"
            );
          }

          // ------------------------------------------------
          // COMPETITION STATUS
          // ------------------------------------------------

          if (
            competition.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "COMPETITION_INACTIVE"
            );
          }

          // ------------------------------------------------
          // SEASON STATUS
          // ------------------------------------------------

          if (
            competition.season.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "SEASON_INACTIVE"
            );
          }

          // ------------------------------------------------
          // REGISTRATION PERIOD
          // ------------------------------------------------

          const today =
            getTodayDateOnly();

          const registrationStart =
            formatDateOnly(
              competition.registration_start_date
            );

          const registrationEnd =
            formatDateOnly(
              competition.registration_end_date
            );

          if (
            today <
              registrationStart ||
            today >
              registrationEnd
          ) {
            throw new Error(
              "REGISTRATION_CLOSED"
            );
          }

          // ------------------------------------------------
          // FIND TEAM
          // ------------------------------------------------

          const team =
            await tx.team.findUnique({
              where: {
                team_id: teamId,
              },

              select: {
                team_id: true,
                name: true,
                gender: true,
                status: true,
                owner_id: true,
                club: {
                  select: {
                    club_id: true,
                    name: true,
                    owner_id: true,
                  },
                },
              },
            });

          if (!team) {
            throw new Error(
              "TEAM_NOT_FOUND"
            );
          }

          // ------------------------------------------------
          // TEAM STATUS
          // ------------------------------------------------

          if (
            team.status !==
            "ACTIVE"
          ) {
            throw new Error(
              "TEAM_INACTIVE"
            );
          }

          // ------------------------------------------------
          // OWNERSHIP CHECK
          // ------------------------------------------------

          const isSuperAdmin =
            req.user.role ===
            ROLES.SUPER_ADMIN;

          const isTeamOwner =
            team.owner_id ===
            req.user.user_id;

          const isClubOwner =
            team.club.owner_id ===
            req.user.user_id;

          if (
            !isSuperAdmin &&
            !isTeamOwner &&
            !isClubOwner
          ) {
            throw new Error(
              "REGISTRATION_FORBIDDEN"
            );
          }

          // ------------------------------------------------
          // GENDER CHECK
          // ------------------------------------------------

          if (
            team.gender !==
            competition.gender
          ) {
            throw new Error(
              "GENDER_MISMATCH"
            );
          }

          // ------------------------------------------------
          // DUPLICATE REGISTRATION CHECK
          // ------------------------------------------------

          const existingRegistration =
            await tx.competitionRegistration.findUnique(
              {
                where: {
                  competition_id_team_id: {
                    competition_id:
                      competitionId,
                    team_id: teamId,
                  },
                },

                select: {
                  registration_id: true,
                },
              }
            );

          if (existingRegistration) {
            throw new Error(
              "REGISTRATION_EXISTS"
            );
          }

          // ------------------------------------------------
          // MAXIMUM TEAM LIMIT
          // ------------------------------------------------

          if (
            competition.max_teams !==
            null
          ) {
            const registrationCount =
              await tx.competitionRegistration.count(
                {
                  where: {
                    competition_id:
                      competitionId,

                    registration_status: {
                      not:
                        REGISTRATION_STATUS.REJECTED,
                    },
                  },
                }
              );

            if (
              registrationCount >=
              competition.max_teams
            ) {
              throw new Error(
                "MAX_TEAMS_REACHED"
              );
            }
          }

          // ------------------------------------------------
          // CREATE REGISTRATION
          // ------------------------------------------------

          const registration =
            await tx.competitionRegistration.create(
              {
                data: {
                  competition_id:
                    competitionId,

                  team_id:
                    teamId,

                  registered_by:
                    req.user.user_id,

                  registration_status:
                    REGISTRATION_STATUS.PENDING,

                  payment_status:
                    PAYMENT_STATUS.UNPAID,

                  registration_date:
                    new Date(),
                },

                select: {
                  registration_id: true,
                  competition_id: true,
                  team_id: true,
                  registered_by: true,
                  registration_status: true,
                  payment_status: true,
                  registration_date: true,
                  approved_at: true,
                  rejection_reason: true,
                  created_at: true,
                  updated_at: true,

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
              }
            );

          return registration;
        },
        {
          isolationLevel:
            "Serializable",
        }
      );

    // ----------------------------------------------------
    // AUDIT LOG
    // ----------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.REGISTRATION_CREATED,

      entity_type:
        "REGISTRATION",

      entity_id:
        result.registration_id,

      details: {
        competition_id:
          result.competition_id,

        team_id:
          result.team_id,

        registration_status:
          result.registration_status,
      },
    });

    // ----------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Team registration submitted successfully",
      data: result,
    });
  } catch (error) {
    // ----------------------------------------------------
    // KNOWN ERRORS
    // ----------------------------------------------------

    if (
      error.message ===
      "COMPETITION_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Competition not found",
      });
    }

    if (
      error.message ===
      "COMPETITION_INACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration is not available for this competition",
      });
    }

    if (
      error.message ===
      "SEASON_INACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration is not available because the season is inactive",
      });
    }

    if (
      error.message ===
      "REGISTRATION_CLOSED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration period is not currently open",
      });
    }

    if (
      error.message ===
      "TEAM_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    if (
      error.message ===
      "TEAM_INACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Inactive teams cannot register",
      });
    }

    if (
      error.message ===
      "REGISTRATION_FORBIDDEN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to register this team",
      });
    }

    if (
      error.message ===
      "GENDER_MISMATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team gender does not match competition gender",
      });
    }

    if (
      error.message ===
      "REGISTRATION_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This team is already registered for this competition",
      });
    }

    if (
      error.message ===
      "MAX_TEAMS_REACHED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum number of teams has been reached",
      });
    }

    // ----------------------------------------------------
    // PRISMA UNIQUE CONSTRAINT
    // ----------------------------------------------------

    if (
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This team is already registered for this competition",
      });
    }

    // ----------------------------------------------------
    // SERIALIZABLE TRANSACTION CONFLICT
    // ----------------------------------------------------

    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Registration request conflicted with another registration. Please try again.",
      });
    }

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
    // ------------------------------------------------
    // DEFENSE-IN-DEPTH AUTHORIZATION
    // ------------------------------------------------

    if (
      !req.user ||
      req.user.role !==
        ROLES.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view all registrations",
      });
    }

    // ------------------------------------------------
    // FETCH REGISTRATIONS
    // ------------------------------------------------

    const registrations =
      await prisma.competitionRegistration.findMany(
        {
          orderBy: {
            created_at: "desc",
          },

          select: {
            registration_id: true,
            competition_id: true,
            team_id: true,
            registered_by: true,
            registration_status: true,
            payment_status: true,
            registration_date: true,
            approved_at: true,
            rejection_reason: true,
            created_at: true,
            updated_at: true,

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
        }
      );

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

    // ------------------------------------------------
    // FIND REGISTRATION
    // ------------------------------------------------

    const registration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            registration_id:
              registrationId,
          },

          select: {
            registration_id: true,
            competition_id: true,
            team_id: true,
            registered_by: true,
            registration_status: true,
            payment_status: true,
            registration_date: true,
            approved_at: true,
            rejection_reason: true,
            created_at: true,
            updated_at: true,

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
        message:
          "Registration not found",
      });
    }

    // ------------------------------------------------
    // AUTHORIZATION / OWNERSHIP CHECK
    // ------------------------------------------------

    const isSuperAdmin =
      req.user.role ===
      ROLES.SUPER_ADMIN;

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

    const action =
      typeof req.body.action ===
      "string"
        ? req.body.action
            .trim()
            .toUpperCase()
        : "";

    const remarks =
      typeof req.body.remarks ===
      "string"
        ? req.body.remarks.trim()
        : null;

    // ------------------------------------------------
    // VALIDATE ACTION
    // ------------------------------------------------

    if (
      ![
        "APPROVE",
        "REJECT",
      ].includes(action)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Action must be either APPROVE or REJECT",
      });
    }

    // ------------------------------------------------
    // FIND REGISTRATION
    // ------------------------------------------------

    const registration =
      await prisma.competitionRegistration.findUnique(
        {
          where: {
            registration_id:
              registrationId,
          },

          select: {
            registration_id: true,
            competition_id: true,
            team_id: true,
            registration_status: true,
            payment_status: true,
          },
        }
      );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message:
          "Registration not found",
      });
    }

    // ------------------------------------------------
    // ONLY PENDING REGISTRATIONS
    // ------------------------------------------------

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

    // ------------------------------------------------
    // DETERMINE NEW STATUS
    // ------------------------------------------------

    const newStatus =
      action === "APPROVE"
        ? REGISTRATION_STATUS.APPROVED
        : REGISTRATION_STATUS.REJECTED;

    const reviewedAt =
      new Date();

    // ------------------------------------------------
    // TRANSACTION
    // ------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          // --------------------------------------------
          // ATOMIC STATE TRANSITION
          // --------------------------------------------

          const updateData = {
            registration_status:
              newStatus,

            approved_at:
              newStatus ===
              REGISTRATION_STATUS.APPROVED
                ? reviewedAt
                : null,

            rejection_reason:
              newStatus ===
              REGISTRATION_STATUS.REJECTED
                ? remarks || null
                : null,
          };

          const updateResult =
            await tx.competitionRegistration.updateMany(
              {
                where: {
                  registration_id:
                    registrationId,

                  registration_status:
                    REGISTRATION_STATUS.PENDING,
                },

                data: updateData,
              }
            );

          if (
            updateResult.count !== 1
          ) {
            throw new Error(
              "REGISTRATION_ALREADY_REVIEWED"
            );
          }

          // --------------------------------------------
          // CREATE APPROVAL HISTORY
          // --------------------------------------------

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
                    remarks || null,
                },
              }
            );

          // --------------------------------------------
          // FETCH UPDATED REGISTRATION
          // --------------------------------------------

          const updatedRegistration =
            await tx.competitionRegistration.findUnique(
              {
                where: {
                  registration_id:
                    registrationId,
                },

                select: {
                  registration_id: true,
                  competition_id: true,
                  team_id: true,
                  registered_by: true,
                  registration_status: true,
                  payment_status: true,
                  registration_date: true,
                  approved_at: true,
                  rejection_reason: true,
                  created_at: true,
                  updated_at: true,
                },
              }
            );

          return {
            updatedRegistration,
            history,
          };
        },
        {
          isolationLevel:
            "Serializable",
        }
      );

    // ------------------------------------------------
    // AUDIT LOG
    // ------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.REGISTRATION_REVIEWED,

      entity_type:
        "REGISTRATION",

      entity_id:
        registrationId,

      details: {
        action,

        previous_status:
          registration.registration_status,

        new_status:
          newStatus,

        reviewed_at:
          reviewedAt.toISOString(),
      },
    });

    // ------------------------------------------------
    // RESPONSE
    // ------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        `Registration ${action.toLowerCase()}d successfully`,
      data:
        result.updatedRegistration,
    });
  } catch (error) {
    // ------------------------------------------------
    // KNOWN ERRORS
    // ------------------------------------------------

    if (
      error.message ===
      "REGISTRATION_ALREADY_REVIEWED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Registration has already been reviewed or is no longer pending",
      });
    }

    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Registration review conflicted with another request. Please try again.",
      });
    }

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