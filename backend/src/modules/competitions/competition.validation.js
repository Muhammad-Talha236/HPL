import { body, param } from "express-validator";

// ======================================================
// COMPETITION ID VALIDATION
// ======================================================

export const competitionIdValidation = [
  param("competition_id")
    .isInt({ min: 1 })
    .withMessage(
      "Competition ID must be a positive integer"
    ),
];

// ======================================================
// CREATE COMPETITION VALIDATION
// ======================================================

export const createCompetitionValidation = [
  body("season_id")
    .isInt({ min: 1 })
    .withMessage(
      "Season ID must be a positive integer"
    ),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Competition name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Competition name must be between 2 and 100 characters"
    ),

  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["MEN", "WOMEN"])
    .withMessage(
      "Gender must be either MEN or WOMEN"
    ),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 1000 })
    .withMessage(
      "Description must not exceed 1000 characters"
    ),

  body("registration_fee")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Registration fee must be a valid decimal amount"
    )
    .custom((value) => {
      if (Number(value) < 0) {
        throw new Error(
          "Registration fee cannot be negative"
        );
      }

      return true;
    }),

  body("registration_start_date")
    .notEmpty()
    .withMessage(
      "Registration start date is required"
    )
    .isISO8601()
    .withMessage(
      "Registration start date must be a valid date"
    ),

  body("registration_end_date")
    .notEmpty()
    .withMessage(
      "Registration end date is required"
    )
    .isISO8601()
    .withMessage(
      "Registration end date must be a valid date"
    ),

  body("competition_start_date")
    .notEmpty()
    .withMessage(
      "Competition start date is required"
    )
    .isISO8601()
    .withMessage(
      "Competition start date must be a valid date"
    ),

  body("competition_end_date")
    .notEmpty()
    .withMessage(
      "Competition end date is required"
    )
    .isISO8601()
    .withMessage(
      "Competition end date must be a valid date"
    ),

  body("max_teams")
    .optional({ nullable: true })
    .isInt({ min: 2 })
    .withMessage(
      "Maximum teams must be at least 2"
    ),

  body("squad_size")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage(
      "Squad size must be a positive integer"
    ),

  body("format")
    .trim()
    .notEmpty()
    .withMessage("Competition format is required")
    .isLength({ min: 2, max: 50 })
    .withMessage(
      "Competition format must be between 2 and 50 characters"
    ),

  body("eligibility_rules")
    .optional({ nullable: true })
    .isString()
    .withMessage(
      "Eligibility rules must be a string"
    )
    .isLength({ max: 3000 })
    .withMessage(
      "Eligibility rules must not exceed 3000 characters"
    ),

  body("refund_policy")
    .optional({ nullable: true })
    .isString()
    .withMessage(
      "Refund policy must be a string"
    )
    .isLength({ max: 2000 })
    .withMessage(
      "Refund policy must not exceed 2000 characters"
    ),
];

// ======================================================
// UPDATE COMPETITION VALIDATION
// ======================================================

export const updateCompetitionValidation = [
  param("competition_id")
    .isInt({ min: 1 })
    .withMessage(
      "Competition ID must be a positive integer"
    ),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Competition name cannot be empty"
    )
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Competition name must be between 2 and 100 characters"
    ),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 1000 })
    .withMessage(
      "Description must not exceed 1000 characters"
    ),

  body("registration_fee")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Registration fee must be a valid decimal amount"
    )
    .custom((value) => {
      if (Number(value) < 0) {
        throw new Error(
          "Registration fee cannot be negative"
        );
      }

      return true;
    }),

  body("registration_start_date")
    .optional()
    .isISO8601()
    .withMessage(
      "Registration start date must be a valid date"
    ),

  body("registration_end_date")
    .optional()
    .isISO8601()
    .withMessage(
      "Registration end date must be a valid date"
    ),

  body("competition_start_date")
    .optional()
    .isISO8601()
    .withMessage(
      "Competition start date must be a valid date"
    ),

  body("competition_end_date")
    .optional()
    .isISO8601()
    .withMessage(
      "Competition end date must be a valid date"
    ),

  body("max_teams")
    .optional({ nullable: true })
    .isInt({ min: 2 })
    .withMessage(
      "Maximum teams must be at least 2"
    ),

  body("squad_size")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage(
      "Squad size must be a positive integer"
    ),

  body("format")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Competition format cannot be empty"
    )
    .isLength({ min: 2, max: 50 })
    .withMessage(
      "Competition format must be between 2 and 50 characters"
    ),

  body("eligibility_rules")
    .optional({ nullable: true })
    .isString()
    .withMessage(
      "Eligibility rules must be a string"
    )
    .isLength({ max: 3000 })
    .withMessage(
      "Eligibility rules must not exceed 3000 characters"
    ),

  body("refund_policy")
    .optional({ nullable: true })
    .isString()
    .withMessage(
      "Refund policy must be a string"
    )
    .isLength({ max: 2000 })
    .withMessage(
      "Refund policy must not exceed 2000 characters"
    ),
];