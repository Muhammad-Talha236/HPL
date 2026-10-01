import {
  body,
  param,
} from "express-validator";

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
  // ----------------------------------------------------
  // SEASON ID
  // ----------------------------------------------------

  body("season_id")
    .exists()
    .withMessage(
      "Season ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Season ID must be a positive integer"
    ),

  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .exists()
    .withMessage(
      "Competition name is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Competition name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Competition name is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Competition name must be between 2 and 100 characters"
    ),

  // ----------------------------------------------------
  // GENDER
  // ----------------------------------------------------

  body("gender")
    .exists()
    .withMessage(
      "Gender is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Gender must be a string"
    )
    .bail()
    .trim()
    .isIn([
      "MEN",
      "WOMEN",
    ])
    .withMessage(
      "Gender must be either MEN or WOMEN"
    ),

  // ----------------------------------------------------
  // DESCRIPTION
  // ----------------------------------------------------

  body("description")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Description must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Description must not exceed 1000 characters"
    ),

  // ----------------------------------------------------
  // REGISTRATION FEE
  // ----------------------------------------------------

  body("registration_fee")
    .exists()
    .withMessage(
      "Registration fee is required"
    )
    .bail()
    .isDecimal({
      decimal_digits: "0,2",
    })
    .withMessage(
      "Registration fee must be a valid decimal amount"
    )
    .bail()
    .custom((value) => {
      const amount =
        Number(value);

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        throw new Error(
          "Registration fee cannot be negative"
        );
      }

      if (
        amount >
        9999999999.99
      ) {
        throw new Error(
          "Registration fee is too large"
        );
      }

      return true;
    }),

  // ----------------------------------------------------
  // REGISTRATION START DATE
  // ----------------------------------------------------

  body("registration_start_date")
    .exists()
    .withMessage(
      "Registration start date is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Registration start date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Registration start date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // REGISTRATION END DATE
  // ----------------------------------------------------

  body("registration_end_date")
    .exists()
    .withMessage(
      "Registration end date is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Registration end date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Registration end date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // COMPETITION START DATE
  // ----------------------------------------------------

  body("competition_start_date")
    .exists()
    .withMessage(
      "Competition start date is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Competition start date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Competition start date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // COMPETITION END DATE
  // ----------------------------------------------------

  body("competition_end_date")
    .exists()
    .withMessage(
      "Competition end date is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Competition end date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Competition end date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // MAX TEAMS
  // ----------------------------------------------------

  body("max_teams")
    .optional()
    .isInt({ min: 2 })
    .withMessage(
      "Maximum teams must be at least 2"
    ),

  // ----------------------------------------------------
  // SQUAD SIZE
  // ----------------------------------------------------

  body("squad_size")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Squad size must be a positive integer"
    ),

  // ----------------------------------------------------
  // FORMAT
  // ----------------------------------------------------

  body("format")
    .exists()
    .withMessage(
      "Competition format is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Competition format must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Competition format is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 50,
    })
    .withMessage(
      "Competition format must be between 2 and 50 characters"
    ),

  // ----------------------------------------------------
  // ELIGIBILITY RULES
  // ----------------------------------------------------

  body("eligibility_rules")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Eligibility rules must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 3000,
    })
    .withMessage(
      "Eligibility rules must not exceed 3000 characters"
    ),

  // ----------------------------------------------------
  // REFUND POLICY
  // ----------------------------------------------------

  body("refund_policy")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Refund policy must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 2000,
    })
    .withMessage(
      "Refund policy must not exceed 2000 characters"
    ),
];

// ======================================================
// UPDATE COMPETITION VALIDATION
// ======================================================

export const updateCompetitionValidation = [
  // ----------------------------------------------------
  // COMPETITION ID
  // ----------------------------------------------------

  param("competition_id")
    .isInt({ min: 1 })
    .withMessage(
      "Competition ID must be a positive integer"
    ),

  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .optional()
    .isString()
    .withMessage(
      "Competition name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Competition name cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Competition name must be between 2 and 100 characters"
    ),

  // ----------------------------------------------------
  // DESCRIPTION
  // ----------------------------------------------------

  body("description")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Description must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Description must not exceed 1000 characters"
    ),

  // ----------------------------------------------------
  // REGISTRATION FEE
  // ----------------------------------------------------

  body("registration_fee")
    .optional()
    .isDecimal({
      decimal_digits: "0,2",
    })
    .withMessage(
      "Registration fee must be a valid decimal amount"
    )
    .bail()
    .custom((value) => {
      const amount =
        Number(value);

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        throw new Error(
          "Registration fee cannot be negative"
        );
      }

      if (
        amount >
        9999999999.99
      ) {
        throw new Error(
          "Registration fee is too large"
        );
      }

      return true;
    }),

  // ----------------------------------------------------
  // REGISTRATION START DATE
  // ----------------------------------------------------

  body("registration_start_date")
    .optional()
    .isString()
    .withMessage(
      "Registration start date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Registration start date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // REGISTRATION END DATE
  // ----------------------------------------------------

  body("registration_end_date")
    .optional()
    .isString()
    .withMessage(
      "Registration end date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Registration end date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // COMPETITION START DATE
  // ----------------------------------------------------

  body("competition_start_date")
    .optional()
    .isString()
    .withMessage(
      "Competition start date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Competition start date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // COMPETITION END DATE
  // ----------------------------------------------------

  body("competition_end_date")
    .optional()
    .isString()
    .withMessage(
      "Competition end date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Competition end date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // MAX TEAMS
  // ----------------------------------------------------

  body("max_teams")
    .optional()
    .isInt({ min: 2 })
    .withMessage(
      "Maximum teams must be at least 2"
    ),

  // ----------------------------------------------------
  // SQUAD SIZE
  // ----------------------------------------------------

  body("squad_size")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Squad size must be a positive integer"
    ),

  // ----------------------------------------------------
  // FORMAT
  // ----------------------------------------------------

  body("format")
    .optional()
    .isString()
    .withMessage(
      "Competition format must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Competition format cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 50,
    })
    .withMessage(
      "Competition format must be between 2 and 50 characters"
    ),

  // ----------------------------------------------------
  // ELIGIBILITY RULES
  // ----------------------------------------------------

  body("eligibility_rules")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Eligibility rules must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 3000,
    })
    .withMessage(
      "Eligibility rules must not exceed 3000 characters"
    ),

  // ----------------------------------------------------
  // REFUND POLICY
  // ----------------------------------------------------

  body("refund_policy")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Refund policy must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 2000,
    })
    .withMessage(
      "Refund policy must not exceed 2000 characters"
    ),
];