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
// CHECK REGISTRATION OWNERSHIP
// ======================================================

const canManageRegistration = (
  registration,
  user
) => {
  // SUPER_ADMIN can manage any registration
  if (user.role === ROLES.SUPER_ADMIN) {
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
    const registrationId = Number(
      req.body.registration_id
    );

    const amount = req.body.amount;

    const paymentMethod =
      req.body.payment_method;

    const transactionReference =
      req.body.transaction_reference.trim();

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

          include: {
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
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // --------------------------------------------------
    // OWNERSHIP CHECK
    // --------------------------------------------------

    if (
      !canManageRegistration(
        registration,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to submit payment for this registration",
      });
    }

    // --------------------------------------------------
    // REGISTRATION STATUS CHECK
    // --------------------------------------------------

    if (
      registration.registration_status !==
      "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment can only be submitted for a pending registration",
      });
    }

    // --------------------------------------------------
    // PREVENT DUPLICATE PAYMENT
    // --------------------------------------------------

    const existingPayment =
      await prisma.payment.findFirst({
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
      });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message:
          "A payment has already been submitted for this registration",
      });
    }

    // --------------------------------------------------
    // VERIFY ACTUAL COMPETITION FEE
    // --------------------------------------------------

    const requiredFee =
      registration.competition
        .registration_fee;

    /*
     * IMPORTANT:
     *
     * The amount received from the client
     * is NOT trusted.
     *
     * The actual fee comes from the database.
     */

    const submittedAmount =
      Number(amount);

    const actualFee =
      Number(requiredFee);

    if (
      !Number.isFinite(submittedAmount) ||
      submittedAmount !== actualFee
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match the competition registration fee",
        data: {
          required_amount:
            actualFee,
        },
      });
    }

    // --------------------------------------------------
    // CREATE PAYMENT
    // --------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
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
            });

          // --------------------------------------------
          // UPDATE REGISTRATION PAYMENT STATUS
          // --------------------------------------------

          await tx.competitionRegistration.update(
            {
              where: {
                registration_id:
                  registrationId,
              },

              data: {
                payment_status:
                  PAYMENT_STATUS.PENDING,
              },
            }
          );

          return payment;
        }
      );

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PAYMENT_CREATED,

      entity_type: "PAYMENT",

      entity_id:
        result.payment_id,

      details: {
        registration_id:
          registrationId,

        competition_id:
          registration.competition
            .competition_id,

        team_id:
          registration.team.team_id,

        amount:
          requiredFee.toString(),

        payment_method:
          paymentMethod,

        payment_status:
          PAYMENT_STATUS.PENDING,
      },
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Payment submitted successfully and is pending verification",
      data: {
        payment_id:
          result.payment_id,

        registration_id:
          result.registration_id,

        amount:
          result.amount,

        payment_method:
          result.payment_method,

        transaction_reference:
          result.transaction_reference,

        payment_status:
          result.payment_status,
      },
    });
  } catch (error) {
    // --------------------------------------------------
    // UNIQUE TRANSACTION REFERENCE
    // --------------------------------------------------

    if (
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This transaction reference has already been used",
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
    const paymentId = Number(
      req.params.payment_id
    );

    const {
      action,
    } = req.body;

    // --------------------------------------------------
    // FIND PAYMENT
    // --------------------------------------------------

    const payment =
      await prisma.payment.findUnique({
        where: {
          payment_id: paymentId,
        },

        include: {
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
        message: "Payment not found",
      });
    }

    // --------------------------------------------------
    // ONLY PENDING PAYMENTS CAN BE REVIEWED
    // --------------------------------------------------

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

    // --------------------------------------------------
    // DETERMINE NEW STATUS
    // --------------------------------------------------

    const newPaymentStatus =
      action === "APPROVE"
        ? PAYMENT_STATUS.PAID
        : PAYMENT_STATUS.REJECTED;

    // --------------------------------------------------
    // TRANSACTION
    // --------------------------------------------------

    const result =
      await prisma.$transaction(
        async (tx) => {
          // --------------------------------------------
          // UPDATE PAYMENT
          // --------------------------------------------

          const updatedPayment =
            await tx.payment.update({
              where: {
                payment_id: paymentId,
              },

              data: {
                payment_status:
                  newPaymentStatus,

                paid_at:
                  newPaymentStatus ===
                  PAYMENT_STATUS.PAID
                    ? new Date()
                    : null,
              },
            });

          // --------------------------------------------
          // UPDATE REGISTRATION PAYMENT STATUS
          // --------------------------------------------

          await tx.competitionRegistration.update(
            {
              where: {
                registration_id:
                  payment.registration
                    .registration_id,
              },

              data: {
                payment_status:
                  newPaymentStatus,
              },
            }
          );

          return updatedPayment;
        }
      );

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PAYMENT_REVIEWED,

      entity_type: "PAYMENT",

      entity_id:
        paymentId,

      details: {
        action,

        registration_id:
          payment.registration
            .registration_id,

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
      },
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        `Payment ${action.toLowerCase()}d successfully`,

      data: {
        payment_id:
          result.payment_id,

        registration_id:
          result.registration_id,

        amount:
          result.amount,

        payment_method:
          result.payment_method,

        transaction_reference:
          result.transaction_reference,

        payment_status:
          result.payment_status,

        paid_at:
          result.paid_at,
      },
    });
  } catch (error) {
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