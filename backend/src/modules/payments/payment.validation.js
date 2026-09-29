import { body, param } from "express-validator";

// ======================================================
// PAYMENT ID VALIDATION
// ======================================================

export const paymentIdValidation = [
  param("payment_id")
    .isInt({ min: 1 })
    .withMessage(
      "Payment ID must be a positive integer"
    ),
];

// ======================================================
// CREATE PAYMENT VALIDATION
// ======================================================

export const createPaymentValidation = [
  body("registration_id")
    .isInt({ min: 1 })
    .withMessage(
      "Registration ID must be a positive integer"
    ),

  body("amount")
    .isDecimal({
      decimal_digits: "0,2",
    })
    .withMessage(
      "Amount must be a valid decimal amount"
    )
    .custom((value) => {
      if (Number(value) <= 0) {
        throw new Error(
          "Payment amount must be greater than zero"
        );
      }

      return true;
    }),

  body("payment_method")
    .trim()
    .notEmpty()
    .withMessage(
      "Payment method is required"
    )
    .isIn([
      "BANK_TRANSFER",
      "JAZZCASH",
      "EASYPAISA",
      "CASH",
    ])
    .withMessage(
      "Invalid payment method"
    ),

  body("transaction_reference")
    .trim()
    .notEmpty()
    .withMessage(
      "Transaction reference is required"
    )
    .isLength({
      min: 3,
      max: 100,
    })
    .withMessage(
      "Transaction reference must be between 3 and 100 characters"
    ),
];

// ======================================================
// REVIEW PAYMENT VALIDATION
// ======================================================

export const reviewPaymentValidation = [
  param("payment_id")
    .isInt({ min: 1 })
    .withMessage(
      "Payment ID must be a positive integer"
    ),

  body("action")
    .trim()
    .notEmpty()
    .withMessage(
      "Payment review action is required"
    )
    .isIn([
      "APPROVE",
      "REJECT",
    ])
    .withMessage(
      "Payment review action must be APPROVE or REJECT"
    ),
];