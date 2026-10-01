import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";
import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// PAYMENT STATUS
// ======================================================

const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  REJECTED: "REJECTED",
};

// ======================================================
// REGISTRATION STATUS
// ======================================================

const REGISTRATION_STATUS = {
  PENDING: "PENDING",
};

// ======================================================
// CHECK REGISTRATION OWNERSHIP
// ======================================================

const canManageRegistration = (
  registration,
  user
) => {
  // SUPER_ADMIN can manage any registration
  if (
    user.role ===
    ROLES.SUPER_ADMIN
  ) {
    return true;
  }

  // User who submitted the registration
  if (
    registration.registered_by ===
    user.user_id
  ) {
    return true;
  }

  // Team owner
  if (
    registration.team.owner_id ===
    user.user_id
  ) {
    return true;
  }

  // Club owner
  if (
    registration.team.club.owner_id ===
    user.user_id
  ) {
    return true;
  }

  return false;
};

// ======================================================
// CREATE PAYMENT
// ======================================================

export const createPayment = async (
  req,
  res
) => {
  try {
    const registrationId =
      Number(
        req.body.registration_id
      );

    const paymentMethod =
      typeof req.body.payment_method ===
      "string"
        ? req.body.payment_method.trim()
        : "";

    const transactionReference =
      typeof req.body.transaction_reference ===
      "string"
        ? req.body.transaction_reference.trim()
        : "";

    const result =
      await prisma.$transaction(
        async (tx) => {
          // ------------------------------------------------
          // FIND REGISTRATION
          // ------------------------------------------------

          const registration =
            await tx.competitionRegistration.findUnique(
              {
                where: {
                  registration_id:
                    registrationId,
                },

                select: {
                  registration_id: true,
                  registered_by: true,
                  registration_status: true,
                  payment_status: true,

                  competition: {
                    select: {
                      competition_id: true,
                      name: true,
                      registration_fee: true,
                    },
                  },

                  team: {
                    select: {
                      team_id: true,
                      name: true,
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
                },
              }
            );

          if (!registration) {
            throw new Error(
              "REGISTRATION_NOT_FOUND"
            );
          }

          // ------------------------------------------------
          // OWNERSHIP CHECK
          // ------------------------------------------------

          if (
            !canManageRegistration(
              registration,
              req.user
            )
          ) {
            throw new Error(
              "PAYMENT_FORBIDDEN"
            );
          }

          // ------------------------------------------------
          // REGISTRATION STATUS CHECK
          // ------------------------------------------------

          if (
            registration.registration_status !==
            REGISTRATION_STATUS.PENDING
          ) {
            throw new Error(
              "REGISTRATION_NOT_PENDING"
            );
          }

          // ------------------------------------------------
          // PAYMENT STATUS CHECK
          // ------------------------------------------------

          if (
            registration.payment_status ===
              PAYMENT_STATUS.PENDING ||
            registration.payment_status ===
              PAYMENT_STATUS.PAID
          ) {
            throw new Error(
              "PAYMENT_ALREADY_SUBMITTED"
            );
          }

          // ------------------------------------------------
          // CHECK EXISTING PAYMENT
          // ------------------------------------------------

          const existingPayment =
            await tx.payment.findFirst({
              where: {
                registration_id:
                  registrationId,

                payment_status: {
                  in: [
                    PAYMENT_STATUS.PENDING,
                    PAYMENT_STATUS.PAID,
                  ],
                },
              },

              select: {
                payment_id: true,
                payment_status: true,
              },
            });

          if (existingPayment) {
            throw new Error(
              "PAYMENT_ALREADY_SUBMITTED"
            );
          }

          // ------------------------------------------------
          // VERIFY PAYMENT AMOUNT
          // ------------------------------------------------

          /*
           * The payment amount is deliberately NOT
           * taken from the client.
           *
           * The competition registration fee stored
           * in the database is the source of truth.
           */

          const requiredFee =
            registration.competition
              .registration_fee;

          if (
            req.body.amount ===
            undefined ||
            req.body.amount ===
            null
          ) {
            throw new Error(
              "PAYMENT_AMOUNT_MISSING"
            );
          }

          const submittedAmount =
            String(
              req.body.amount
            ).trim();

          const requiredAmount =
            requiredFee.toString();

          if (
            submittedAmount !==
            requiredAmount
          ) {
            throw new Error(
              "PAYMENT_AMOUNT_MISMATCH"
            );
          }

          // ------------------------------------------------
          // CREATE PAYMENT
          // ------------------------------------------------

          const payment =
            await tx.payment.create({
              data: {
                registration_id:
                  registrationId,

                amount:
                  requiredFee,

                payment_method:
                  paymentMethod,

                transaction_reference:
                  transactionReference,

                payment_status:
                  PAYMENT_STATUS.PENDING,
              },

              select: {
                payment_id: true,
                registration_id: true,
                amount: true,
                payment_method: true,
                transaction_reference: true,
                payment_status: true,
                paid_at: true,
                created_at: true,
                updated_at: true,
              },
            });

          // ------------------------------------------------
          // UPDATE REGISTRATION PAYMENT STATUS
          // ------------------------------------------------

          const registrationUpdate =
            await tx.competitionRegistration.updateMany(
              {
                where: {
                  registration_id:
                    registrationId,

                  registration_status:
                    REGISTRATION_STATUS.PENDING,

                  payment_status: {
                    not: PAYMENT_STATUS.PENDING,
                  },
                },

                data: {
                  payment_status:
                    PAYMENT_STATUS.PENDING,
                },
              }
            );

          if (
            registrationUpdate.count !==
            1
          ) {
            throw new Error(
              "PAYMENT_STATE_CONFLICT"
            );
          }

          return {
            payment,
            registration,
          };
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
        AUDIT_ACTIONS.PAYMENT_CREATED,

      entity_type:
        "PAYMENT",

      entity_id:
        result.payment.payment_id,

      details: {
        registration_id:
          result.payment
            .registration_id,

        competition_id:
          result.registration
            .competition
            .competition_id,

        team_id:
          result.registration
            .team
            .team_id,

        amount:
          result.payment.amount
            .toString(),

        payment_method:
          result.payment
            .payment_method,

        payment_status:
          result.payment
            .payment_status,
      },
    });

    // ----------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Payment submitted successfully and is pending verification",

      data: {
        payment_id:
          result.payment
            .payment_id,

        registration_id:
          result.payment
            .registration_id,

        amount:
          result.payment.amount,

        payment_method:
          result.payment
            .payment_method,

        transaction_reference:
          result.payment
            .transaction_reference,

        payment_status:
          result.payment
            .payment_status,
      },
    });
  } catch (error) {
    // ----------------------------------------------------
    // KNOWN ERRORS
    // ----------------------------------------------------

    if (
      error.message ===
      "REGISTRATION_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Registration not found",
      });
    }

    if (
      error.message ===
      "PAYMENT_FORBIDDEN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to submit payment for this registration",
      });
    }

    if (
      error.message ===
      "REGISTRATION_NOT_PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment can only be submitted for a pending registration",
      });
    }

    if (
      error.message ===
      "PAYMENT_ALREADY_SUBMITTED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A payment has already been submitted for this registration",
      });
    }

    if (
      error.message ===
      "PAYMENT_AMOUNT_MISSING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount is required",
      });
    }

    if (
      error.message ===
      "PAYMENT_AMOUNT_MISMATCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match the competition registration fee",
      });
    }

    if (
      error.message ===
      "PAYMENT_STATE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Payment state changed during the request. Please try again.",
      });
    }

    // ----------------------------------------------------
    // UNIQUE CONSTRAINT
    // ----------------------------------------------------

    if (
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This transaction reference has already been used",
      });
    }

    // ----------------------------------------------------
    // SERIALIZABLE CONFLICT
    // ----------------------------------------------------

    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Payment request conflicted with another request. Please try again.",
      });
    }

    console.error(
      "Create payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the payment",
    });
  }
};

// ======================================================
// REVIEW PAYMENT
// SUPER ADMIN ONLY
// ======================================================

export const reviewPayment = async (
  req,
  res
) => {
  try {
    const paymentId =
      Number(
        req.params.payment_id
      );

    const action =
      typeof req.body.action ===
      "string"
        ? req.body.action
            .trim()
            .toUpperCase()
        : "";

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
          "Review action must be APPROVE or REJECT",
      });
    }

    // ------------------------------------------------
    // FIND PAYMENT
    // ------------------------------------------------

    const payment =
      await prisma.payment.findUnique({
        where: {
          payment_id:
            paymentId,
        },

        select: {
          payment_id: true,
          registration_id: true,
          amount: true,
          payment_method: true,
          transaction_reference: true,
          payment_status: true,
          paid_at: true,

          registration: {
            select: {
              registration_id: true,
              payment_status: true,

              competition: {
                select: {
                  competition_id: true,
                  name: true,
                  registration_fee: true,
                },
              },

              team: {
                select: {
                  team_id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    // ------------------------------------------------
    // ONLY PENDING PAYMENTS CAN BE REVIEWED
    // ------------------------------------------------

    if (
      payment.payment_status !==
      PAYMENT_STATUS.PENDING
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending payments can be reviewed",
      });
    }

    // ------------------------------------------------
    // DETERMINE NEW STATUS
    // ------------------------------------------------

    const newPaymentStatus =
      action === "APPROVE"
        ? PAYMENT_STATUS.PAID
        : PAYMENT_STATUS.REJECTED;

    const reviewedAt =
      new Date();

    // ------------------------------------------------
    // TRANSACTION
    // ------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          // --------------------------------------------
          // ATOMIC PAYMENT STATE TRANSITION
          // --------------------------------------------

          const updatedPaymentResult =
            await tx.payment.updateMany({
              where: {
                payment_id:
                  paymentId,

                payment_status:
                  PAYMENT_STATUS.PENDING,
              },

              data: {
                payment_status:
                  newPaymentStatus,

                paid_at:
                  newPaymentStatus ===
                  PAYMENT_STATUS.PAID
                    ? reviewedAt
                    : null,
              },
            });

          if (
            updatedPaymentResult.count !==
            1
          ) {
            throw new Error(
              "PAYMENT_ALREADY_REVIEWED"
            );
          }

          // --------------------------------------------
          // UPDATE REGISTRATION PAYMENT STATUS
          // --------------------------------------------

          const registrationUpdate =
            await tx.competitionRegistration.updateMany(
              {
                where: {
                  registration_id:
                    payment.registration_id,

                  payment_status:
                    PAYMENT_STATUS.PENDING,
                },

                data: {
                  payment_status:
                    newPaymentStatus,
                },
              }
            );

          if (
            registrationUpdate.count !==
            1
          ) {
            throw new Error(
              "REGISTRATION_PAYMENT_STATE_CONFLICT"
            );
          }

          // --------------------------------------------
          // FETCH UPDATED PAYMENT
          // --------------------------------------------

          const updatedPayment =
            await tx.payment.findUnique({
              where: {
                payment_id:
                  paymentId,
              },

              select: {
                payment_id: true,
                registration_id: true,
                amount: true,
                payment_method: true,
                transaction_reference: true,
                payment_status: true,
                paid_at: true,
                created_at: true,
                updated_at: true,
              },
            });

          return updatedPayment;
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
        AUDIT_ACTIONS.PAYMENT_REVIEWED,

      entity_type:
        "PAYMENT",

      entity_id:
        paymentId,

      details: {
        action,

        registration_id:
          payment.registration_id,

        competition_id:
          payment.registration
            .competition
            .competition_id,

        team_id:
          payment.registration
            .team
            .team_id,

        previous_status:
          payment.payment_status,

        new_status:
          newPaymentStatus,

        reviewed_at:
          reviewedAt.toISOString(),
      },
    });

    // ----------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        `Payment ${action.toLowerCase()}d successfully`,

      data: result,
    });
  } catch (error) {
    // ----------------------------------------------------
    // KNOWN ERRORS
    // ----------------------------------------------------

    if (
      error.message ===
      "PAYMENT_ALREADY_REVIEWED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Payment has already been reviewed or is no longer pending",
      });
    }

    if (
      error.message ===
      "REGISTRATION_PAYMENT_STATE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Registration payment state changed during the review. Please try again.",
      });
    }

    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Payment review conflicted with another request. Please try again.",
      });
    }

    console.error(
      "Review payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while reviewing the payment",
    });
  }
};