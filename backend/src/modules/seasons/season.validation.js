import {
  body,
  param,
} from "express-validator";

// ======================================================
// SEASON ID VALIDATION
// ======================================================

export const seasonIdValidation = [
  param("season_id")
    .isInt({ min: 1 })
    .withMessage(
      "Season ID must be a positive integer"
    ),
];

// ======================================================
// CREATE SEASON VALIDATION
// ======================================================

export const createSeasonValidation = [
  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .exists()
    .withMessage(
      "Season name is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Season name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Season name is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Season name must be between 2 and 100 characters"
    ),

  // ----------------------------------------------------
  // START DATE
  // ----------------------------------------------------

  body("start_date")
    .exists()
    .withMessage(
      "Start date is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Start date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Start date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // END DATE
  // ----------------------------------------------------

  body("end_date")
    .exists()
    .withMessage(
      "End date is required"
    )
    .bail()
    .isString()
    .withMessage(
      "End date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "End date must be a valid ISO date"
    )
    .bail()
    .custom(
      (value, { req }) => {
        const startDate =
          new Date(
            req.body.start_date
          );

        const endDate =
          new Date(value);

        if (
          endDate <= startDate
        ) {
          throw new Error(
            "End date must be after start date"
          );
        }

        return true;
      }
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
];

// ======================================================
// UPDATE SEASON VALIDATION
// ======================================================

export const updateSeasonValidation = [
  // ----------------------------------------------------
  // SEASON ID
  // ----------------------------------------------------

  param("season_id")
    .isInt({ min: 1 })
    .withMessage(
      "Season ID must be a positive integer"
    ),

  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .optional()
    .isString()
    .withMessage(
      "Season name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Season name cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Season name must be between 2 and 100 characters"
    ),

  // ----------------------------------------------------
  // START DATE
  // ----------------------------------------------------

  body("start_date")
    .optional()
    .isString()
    .withMessage(
      "Start date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Start date must be a valid ISO date"
    ),

  // ----------------------------------------------------
  // END DATE
  // ----------------------------------------------------

  body("end_date")
    .optional()
    .isString()
    .withMessage(
      "End date must be a string"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "End date must be a valid ISO date"
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
];