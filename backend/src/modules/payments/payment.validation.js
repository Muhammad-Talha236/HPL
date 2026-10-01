import {
  body,
  param,
} from "express-validator";

// ======================================================
// PAYMENT ID VALIDATION
// ======================================================

export const paymentIdValidation = [
  param("payment_id")
    .exists()
    .withMessage(
      "Payment ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Payment ID must be a positive integer"
    ),
];

// ======================================================
// CREATE PAYMENT VALIDATION
// ======================================================

export const createPaymentValidation = [
  // ----------------------------------------------------
  // REGISTRATION ID
  // ----------------------------------------------------

  body("registration_id")
    .exists()
    .withMessage(
      "Registration ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Registration ID must be a positive integer"
    ),

  // ----------------------------------------------------
  // PAYMENT AMOUNT
  // ----------------------------------------------------

  body("amount")
    .exists()
    .withMessage(
      "Payment amount is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Payment amount must be a string"
    )
    .bail()
    .isDecimal({
      decimal_digits: "0,2",
    })
    .withMessage(
      "Payment amount must be a valid decimal amount"
    )
    .bail()
    .custom((value) => {
      const amount =
        Number(value);

      if (
        !Number.isFinite(amount)
      ) {
        throw new Error(
          "Payment amount must be a valid number"
        );
      }

      if (amount <= 0) {
        throw new Error(
          "Payment amount must be greater than zero"
        );
      }

      if (
        amount >
        9999999999.99
      ) {
        throw new Error(
          "Payment amount is too large"
        );
      }

      return true;
    }),

  // ----------------------------------------------------
  // PAYMENT METHOD
  // ----------------------------------------------------

  body("payment_method")
    .exists()
    .withMessage(
      "Payment method is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Payment method must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Payment method is required"
    )
    .bail()
    .isIn([
      "BANK_TRANSFER",
      "JAZZCASH",
      "EASYPAISA",
      "CASH",
    ])
    .withMessage(
      "Invalid payment method"
    ),

  // ----------------------------------------------------
  // TRANSACTION REFERENCE
  // ----------------------------------------------------

  body("transaction_reference")
    .exists()
    .withMessage(
      "Transaction reference is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Transaction reference must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Transaction reference is required"
    )
    .bail()
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
  // ----------------------------------------------------
  // PAYMENT ID
  // ----------------------------------------------------

  param("payment_id")
    .exists()
    .withMessage(
      "Payment ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Payment ID must be a positive integer"
    ),

  // ----------------------------------------------------
  // REVIEW ACTION
  // ----------------------------------------------------

  body("action")
    .exists()
    .withMessage(
      "Payment review action is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Payment review action must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Payment review action is required"
    )
    .bail()
    .isIn([
      "APPROVE",
      "REJECT",
    ])
    .withMessage(
      "Payment review action must be APPROVE or REJECT"
    ),
];