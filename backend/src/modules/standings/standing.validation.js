import {
  param,
  checkExact,
} from "express-validator";

/*
  Validate competition ID from URL.
*/
export const competitionIdValidation = [
  param("competition_id")
    .exists()
    .withMessage("Competition ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Competition ID must be a valid positive integer"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  Validate standing ID from URL.
*/
export const standingIdValidation = [
  param("standing_id")
    .exists()
    .withMessage("Standing ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Standing ID must be a valid positive integer"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];