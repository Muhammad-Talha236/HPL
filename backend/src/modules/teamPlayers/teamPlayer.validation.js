import {
  body,
  param,
  checkExact,
} from "express-validator";

/*
  Validate Team Player ID.
*/
export const teamPlayerIdValidation = [
  param("team_player_id")
    .exists()
    .withMessage(
      "Team player ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Team player ID must be a valid positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

/*
  Validate Team ID for squad endpoints.
*/
export const teamSquadValidation = [
  param("team_id")
    .exists()
    .withMessage(
      "Team ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Team ID must be a valid positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

/*
  CREATE TEAM PLAYER

  Allowed fields:
  - team_id
  - player_id
  - jersey_number
  - joined_at
  - left_at

  Status is server-controlled.
*/
export const createTeamPlayerValidation = [
  body("team_id")
    .exists()
    .withMessage(
      "Team ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Team ID must be a valid positive integer"
    ),

  body("player_id")
    .exists()
    .withMessage(
      "Player ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Player ID must be a valid positive integer"
    ),

  body("jersey_number")
    .optional({
      nullable: true,
    })
    .isInt({
      min: 1,
      max: 99,
    })
    .withMessage(
      "Jersey number must be between 1 and 99"
    ),

  body("joined_at")
    .exists()
    .withMessage(
      "Joined date is required"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Joined date must be a valid date"
    )
    .bail()
    .custom((value) => {
      const date =
        new Date(value);

      const minimumDate =
        new Date(
          "1900-01-01T00:00:00.000Z"
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        throw new Error(
          "Joined date is invalid"
        );
      }

      if (
        date < minimumDate
      ) {
        throw new Error(
          "Joined date is not valid"
        );
      }

      return true;
    }),

  body("left_at")
    .optional({
      nullable: true,
    })
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Left date must be a valid date"
    )
    .bail()
    .custom((value, { req }) => {
      if (
        value === null ||
        value === undefined
      ) {
        return true;
      }

      const leftDate =
        new Date(value);

      const joinedDate =
        new Date(
          req.body.joined_at
        );

      if (
        Number.isNaN(
          leftDate.getTime()
        )
      ) {
        throw new Error(
          "Left date is invalid"
        );
      }

      if (
        leftDate < joinedDate
      ) {
        throw new Error(
          "Left date cannot be before joined date"
        );
      }

      return true;
    }),

  /*
    Status must never be supplied
    by the client.
  */
  body("status")
    .not()
    .exists()
    .withMessage(
      "Status cannot be provided"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

/*
  UPDATE TEAM PLAYER

  team_id and player_id are intentionally
  NOT updateable.

  Only roster-specific fields can change.
*/
export const updateTeamPlayerValidation = [
  param("team_player_id")
    .exists()
    .withMessage(
      "Team player ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Team player ID must be a valid positive integer"
    ),

  body("jersey_number")
    .optional({
      nullable: true,
    })
    .isInt({
      min: 1,
      max: 99,
    })
    .withMessage(
      "Jersey number must be between 1 and 99"
    ),

  body("joined_at")
    .optional()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Joined date must be a valid date"
    ),

  body("left_at")
    .optional({
      nullable: true,
    })
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Left date must be a valid date"
    ),

  /*
    These fields are not allowed
    during an update.
  */
  body("team_id")
    .not()
    .exists()
    .withMessage(
      "Team ID cannot be updated"
    ),

  body("player_id")
    .not()
    .exists()
    .withMessage(
      "Player ID cannot be updated"
    ),

  body("status")
    .not()
    .exists()
    .withMessage(
      "Status cannot be updated directly"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

/*
  STATUS endpoints do not accept
  a request body.
*/
export const teamPlayerStatusValidation = [
  param("team_player_id")
    .exists()
    .withMessage(
      "Team player ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Team player ID must be a valid positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];