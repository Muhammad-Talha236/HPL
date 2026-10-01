import { body, param } from "express-validator";

// ======================================================
// MATCH PLAYER ID VALIDATION
// ======================================================

export const matchPlayerIdValidation = [
  param("match_player_id")
    .isInt({ min: 1 })
    .withMessage(
      "Match player ID must be a positive integer"
    ),
];

// ======================================================
// CREATE MATCH PLAYER VALIDATION
// ======================================================

export const createMatchPlayerValidation = [
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

  body("starting_status")
    .trim()
    .notEmpty()
    .withMessage(
      "Starting status is required"
    )
    .isIn([
      "STARTER",
      "SUBSTITUTE",
    ])
    .withMessage(
      "Starting status must be STARTER or SUBSTITUTE"
    ),

  body("position")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Position must be a string"
    )
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Position must not exceed 50 characters"
    ),

  body("shirt_number")
    .optional({
      nullable: true,
    })
    .isInt({
      min: 1,
      max: 99,
    })
    .withMessage(
      "Shirt number must be between 1 and 99"
    ),
];

// ======================================================
// UPDATE MATCH PLAYER VALIDATION
// ======================================================

export const updateMatchPlayerValidation = [
  param("match_player_id")
    .isInt({ min: 1 })
    .withMessage(
      "Match player ID must be a positive integer"
    ),

  body("starting_status")
    .optional()
    .trim()
    .isIn([
      "STARTER",
      "SUBSTITUTE",
    ])
    .withMessage(
      "Starting status must be STARTER or SUBSTITUTE"
    ),

  body("position")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Position must be a string"
    )
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Position must not exceed 50 characters"
    ),

  body("shirt_number")
    .optional({
      nullable: true,
    })
    .isInt({
      min: 1,
      max: 99,
    })
    .withMessage(
      "Shirt number must be between 1 and 99"
    ),

  
];

export const matchSquadValidation = [
  param("match_id")
    .isInt({ min: 1 })
    .withMessage(
      "Match ID must be a positive integer"
    ),

  param("team_id")
    .isInt({ min: 1 })
    .withMessage(
      "Team ID must be a positive integer"
    ),
];