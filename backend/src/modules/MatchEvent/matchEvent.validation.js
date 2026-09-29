import { body, param } from "express-validator";

// ==================================================
// MATCH EVENT ID VALIDATION
// ==================================================

export const matchEventIdValidation = [
  param("event_id")
    .isInt({ min: 1 })
    .withMessage(
      "Event ID must be a positive integer"
    ),
];

// ==================================================
// CREATE MATCH EVENT VALIDATION
// ==================================================

export const createMatchEventValidation = [
  body("match_id")
    .isInt({ min: 1 })
    .withMessage(
      "Match ID must be a positive integer"
    ),

  body("team_id")
    .isInt({ min: 1 })
    .withMessage(
      "Team ID must be a positive integer"
    ),

  body("player_id")
    .isInt({ min: 1 })
    .withMessage(
      "Player ID must be a positive integer"
    ),

  body("event_type")
    .trim()
    .notEmpty()
    .withMessage(
      "Event type is required"
    )
    .isIn([
      "GOAL",
      "YELLOW_CARD",
      "RED_CARD",
      "SUBSTITUTION",
    ])
    .withMessage(
      "Invalid match event type"
    ),

  body("minute")
    .isInt({ min: 0, max: 130 })
    .withMessage(
      "Minute must be between 0 and 130"
    ),

  body("extra_time")
    .optional({
      nullable: true,
    })
    .isInt({ min: 0, max: 30 })
    .withMessage(
      "Extra time must be between 0 and 30"
    ),

  body("related_player_id")
    .optional({
      nullable: true,
    })
    .isInt({ min: 1 })
    .withMessage(
      "Related player ID must be a positive integer"
    ),

  body("description")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Description must be a string"
    )
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Description must not exceed 1000 characters"
    ),
];

export const matchEventsByMatchValidation = [
  param("match_id")
    .isInt({ min: 1 })
    .withMessage(
      "Match ID must be a positive integer"
    ),
];


export const updateMatchEventValidation = [
  param("event_id")
    .isInt({ min: 1 })
    .withMessage(
      "Event ID must be a positive integer"
    ),

  body("description")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Description must be a string"
    )
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Description must not exceed 1000 characters"
    ),
];

export const deleteMatchEventValidation = [
  param("event_id")
    .isInt({ min: 1 })
    .withMessage(
      "Event ID must be a positive integer"
    ),
];