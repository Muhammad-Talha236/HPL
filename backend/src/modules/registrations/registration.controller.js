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

const canManageRegistrationTeam = (user, team) => {
  if (!user || !team) return false;
  if (user.status !== undefined && user.status !== "ACTIVE") return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;

  return user.role === ROLES.CLUB_OWNER &&
    team.club_id !== null &&
    team.club?.owner_id === user.user_id;
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

export { submit as createRegistration } from "./workflow.controller.js";

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
                squad_size: true,
                season: { select: { season_id: true, name: true } },
              },
            },

            team: {
              select: {
                team_id: true,
                name: true,
                gender: true,
                owner_id: true,
                club_id: true,

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

            players: {
              select: {
                competition_player_id: true,
                player_id: true,
                player: { select: { player_id: true, name: true, position: true, profile_photo: true } },
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

    if (
      !isSuperAdmin &&
      !isRegisteredUser &&
      !canManageRegistrationTeam(req.user, registration.team)
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
          // Approval consumes a real competition slot. Re-check eligibility and
          // capacity inside the serializable transaction so concurrent reviews
          // cannot overbook the competition.
          if (newStatus === REGISTRATION_STATUS.APPROVED) {
            const competition = await tx.competition.findUnique({ where: { competition_id: registration.competition_id }, select: { status: true, max_teams: true, competition_start_date: true } });
            if (!competition || competition.status !== "ACTIVE" || competition.competition_start_date <= new Date()) throw new Error("APPROVAL_NOT_ELIGIBLE");
            if (competition.max_teams !== null) {
              const approvedCount = await tx.competitionRegistration.count({ where: { competition_id: registration.competition_id, registration_status: REGISTRATION_STATUS.APPROVED } });
              if (approvedCount >= competition.max_teams) throw new Error("MAX_TEAMS_REACHED");
            }
          }
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

    if (error.message === "APPROVAL_NOT_ELIGIBLE") return res.status(400).json({ success: false, message: "Registration can no longer be approved for this competition" });
    if (error.message === "MAX_TEAMS_REACHED") return res.status(409).json({ success: false, message: "Competition capacity has been reached" });

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
