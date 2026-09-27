import { body, param } from "express-validator";

// ======================================================
// PLAYER ID VALIDATION
// ======================================================

export const playerIdValidation = [
  param("player_id")
    .isInt({ min: 1 })
    .withMessage("Player ID must be a positive integer"),
];

// ======================================================
// CREATE PLAYER VALIDATION
// ======================================================

export const createPlayerValidation = [
  // Name
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Player name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Player name must be between 2 and 100 characters"),

  // Profile photo
  body("profile_photo")
    .optional({ nullable: true })
    .isString()
    .withMessage("Profile photo must be a string")
    .isLength({ max: 500 })
    .withMessage("Profile photo is too long"),

  // Date of birth
  body("date_of_birth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Date of birth must be a valid date")
    .custom((value) => {
      const date = new Date(value);

      if (date >= new Date()) {
        throw new Error("Date of birth cannot be in the future");
      }

      return true;
    }),

  // Gender
  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required")
    .isLength({ max: 30 })
    .withMessage("Gender is too long"),

  // Position
  body("position")
    .trim()
    .notEmpty()
    .withMessage("Position is required")
    .isLength({ max: 50 })
    .withMessage("Position is too long"),

  // Phone
  body("phone")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("Phone number is too long"),

  // Nationality
  body("nationality")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 60 })
    .withMessage("Nationality is too long"),
];