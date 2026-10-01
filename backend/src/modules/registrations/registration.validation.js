import {
  body,
  param,
} from "express-validator";

// ======================================================
// REGISTRATION ID VALIDATION
// ======================================================

export const registrationIdValidation = [
  param("registration_id")
    .exists()
    .withMessage(
      "Registration ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Registration ID must be a positive integer"
    ),
];

// ======================================================
// CREATE REGISTRATION VALIDATION
// ======================================================

export const createRegistrationValidation = [
  // ----------------------------------------------------
  // COMPETITION ID
  // ----------------------------------------------------

  body("competition_id")
    .exists()
    .withMessage(
      "Competition ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Competition ID must be a positive integer"
    ),

  // ----------------------------------------------------
  // TEAM ID
  // ----------------------------------------------------

  body("team_id")
    .exists()
    .withMessage(
      "Team ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Team ID must be a positive integer"
    ),
];

// ======================================================
// REVIEW REGISTRATION VALIDATION
// ======================================================

export const reviewRegistrationValidation = [
  // ----------------------------------------------------
  // REGISTRATION ID
  // ----------------------------------------------------

  param("registration_id")
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
  // REVIEW ACTION
  // ----------------------------------------------------

  body("action")
    .exists()
    .withMessage(
      "Review action is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Review action must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Review action is required"
    )
    .bail()
    .isIn([
      "APPROVE",
      "REJECT",
    ])
    .withMessage(
      "Review action must be APPROVE or REJECT"
    ),

  // ----------------------------------------------------
  // REMARKS
  // ----------------------------------------------------

  body("remarks")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Remarks must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Remarks must not exceed 1000 characters"
    ),
];