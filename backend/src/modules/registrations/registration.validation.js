import { body, param } from "express-validator";

// ======================================================
// REGISTRATION ID VALIDATION
// ======================================================

export const registrationIdValidation = [
  param("registration_id")
    .isInt({ min: 1 })
    .withMessage(
      "Registration ID must be a positive integer"
    ),
];

// ======================================================
// CREATE REGISTRATION VALIDATION
// ======================================================

export const createRegistrationValidation = [
  body("competition_id")
    .isInt({ min: 1 })
    .withMessage(
      "Competition ID must be a positive integer"
    ),

  body("team_id")
    .isInt({ min: 1 })
    .withMessage(
      "Team ID must be a positive integer"
    ),
];

// ======================================================
// REVIEW REGISTRATION VALIDATION
// ======================================================

export const reviewRegistrationValidation = [
  param("registration_id")
    .isInt({ min: 1 })
    .withMessage(
      "Registration ID must be a positive integer"
    ),

  body("action")
    .trim()
    .notEmpty()
    .withMessage(
      "Review action is required"
    )
    .isIn([
      "APPROVE",
      "REJECT",
    ])
    .withMessage(
      "Review action must be APPROVE or REJECT"
    ),

  body("remarks")
    .optional({ nullable: true })
    .isString()
    .withMessage(
      "Remarks must be a string"
    )
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Remarks must not exceed 1000 characters"
    ),
];