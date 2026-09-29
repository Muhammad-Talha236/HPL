import { body, param } from "express-validator";

// ======================================================
// MATCH ID VALIDATION
// ======================================================

export const matchIdValidation = [
  param("match_id")
    .isInt({ min: 1 })
    .withMessage(
      "Match ID must be a positive integer"
    ),
];

// ======================================================
// CREATE MATCH VALIDATION
// ======================================================

export const createMatchValidation = [
  body("competition_id")
    .isInt({ min: 1 })
    .withMessage(
      "Competition ID must be a positive integer"
    ),

  body("season_id")
    .isInt({ min: 1 })
    .withMessage(
      "Season ID must be a positive integer"
    ),

  body("home_team_id")
    .isInt({ min: 1 })
    .withMessage(
      "Home team ID must be a positive integer"
    ),

  body("away_team_id")
    .isInt({ min: 1 })
    .withMessage(
      "Away team ID must be a positive integer"
    )
    .custom((value, { req }) => {
      if (
        Number(value) ===
        Number(req.body.home_team_id)
      ) {
        throw new Error(
          "Home team and away team cannot be the same"
        );
      }

      return true;
    }),

  body("venue_id")
    .isInt({ min: 1 })
    .withMessage(
      "Venue ID must be a positive integer"
    ),

  body("referee_id")
    .isInt({ min: 1 })
    .withMessage(
      "Referee ID must be a positive integer"
    ),

  body("match_date")
    .notEmpty()
    .withMessage(
      "Match date is required"
    )
    .isISO8601()
    .withMessage(
      "Match date must be a valid date"
    ),

  body("start_time")
    .notEmpty()
    .withMessage(
      "Start time is required"
    )
    .matches(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    )
    .withMessage(
      "Start time must be in HH:MM format"
    ),

  body("match_notes")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Match notes must be a string"
    )
    .trim()
    .isLength({
      max: 2000,
    })
    .withMessage(
      "Match notes must not exceed 2000 characters"
    ),
];

// ======================================================
// UPDATE MATCH VALIDATION
// ======================================================

export const updateMatchValidation = [
  param("match_id")
    .isInt({ min: 1 })
    .withMessage(
      "Match ID must be a positive integer"
    ),

  body("home_team_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Home team ID must be a positive integer"
    ),

  body("away_team_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Away team ID must be a positive integer"
    ),

  body("venue_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Venue ID must be a positive integer"
    ),

  body("referee_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Referee ID must be a positive integer"
    ),

  body("match_date")
    .optional()
    .isISO8601()
    .withMessage(
      "Match date must be a valid date"
    ),

  body("start_time")
    .optional()
    .matches(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    )
    .withMessage(
      "Start time must be in HH:MM format"
    ),

  body("match_notes")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Match notes must be a string"
    )
    .trim()
    .isLength({
      max: 2000,
    })
    .withMessage(
      "Match notes must not exceed 2000 characters"
    ),
];