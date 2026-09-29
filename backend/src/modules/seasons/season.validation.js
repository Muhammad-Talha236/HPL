import { body, param } from "express-validator";

// ======================================================
// SEASON ID VALIDATION
// ======================================================

export const seasonIdValidation = [
  param("season_id")
    .isInt({ min: 1 })
    .withMessage("Season ID must be a positive integer"),
];

// ======================================================
// CREATE SEASON VALIDATION
// ======================================================

export const createSeasonValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Season name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Season name must be between 2 and 100 characters"
    ),

  body("start_date")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  body("end_date")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid date")
    .custom((value, { req }) => {
      if (
        req.body.start_date &&
        new Date(value) <= new Date(req.body.start_date)
      ) {
        throw new Error(
          "End date must be after start date"
        );
      }

      return true;
    }),

  body("status")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Status is too long"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
];

// ======================================================
// UPDATE SEASON VALIDATION
// ======================================================

export const updateSeasonValidation = [
  param("season_id")
    .isInt({ min: 1 })
    .withMessage("Season ID must be a positive integer"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Season name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Season name must be between 2 and 100 characters"
    ),

  body("start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  body("end_date")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),

  body("status")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Status is too long"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
];