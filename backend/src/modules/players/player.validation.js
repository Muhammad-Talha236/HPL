import {
  body,
  param,
  checkExact,
} from "express-validator";

// ======================================================
// PLAYER ID VALIDATION
// ======================================================

export const playerIdValidation = [
  param("player_id")
    .exists()
    .withMessage(
      "Player ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Player ID must be a positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// CREATE PLAYER VALIDATION
// ======================================================

export const createPlayerValidation = [

  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .exists()
    .withMessage(
      "Player name is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Player name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Player name is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Player name must be between 2 and 100 characters"
    ),

  // ----------------------------------------------------
  // PROFILE PHOTO
  // ----------------------------------------------------

  body("profile_photo")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Profile photo must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Profile photo is too long"
    ),

  // ----------------------------------------------------
  // DATE OF BIRTH
  // ----------------------------------------------------

  body("date_of_birth")
    .exists()
    .withMessage(
      "Date of birth is required"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Date of birth must be a valid date"
    )
    .bail()
    .custom((value) => {
      const date =
        new Date(value);

      const today =
        new Date();

      const minimumDate =
        new Date(
          "1900-01-01T00:00:00.000Z"
        );

      if (date > today) {
        throw new Error(
          "Date of birth cannot be in the future"
        );
      }

      if (date < minimumDate) {
        throw new Error(
          "Date of birth is not valid"
        );
      }

      return true;
    }),

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
    .notEmpty()
    .withMessage(
      "Gender is required"
    )
    .bail()
    .isIn([
      "MALE",
      "FEMALE",
    ])
    .withMessage(
      "Gender must be MALE or FEMALE"
    ),

  // ----------------------------------------------------
  // POSITION
  // ----------------------------------------------------

  body("position")
    .exists()
    .withMessage(
      "Position is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Position must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Position is required"
    )
    .bail()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Position is too long"
    ),

  // ----------------------------------------------------
  // PHONE
  // ----------------------------------------------------

  body("phone")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Phone number must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage(
      "Phone number is too long"
    ),

  // ----------------------------------------------------
  // NATIONALITY
  // ----------------------------------------------------

  body("nationality")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Nationality must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 60,
    })
    .withMessage(
      "Nationality is too long"
    ),

  // ----------------------------------------------------
  // BLOCK UNEXPECTED FIELDS
  // ----------------------------------------------------

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// UPDATE PLAYER VALIDATION
// ======================================================

export const updatePlayerValidation = [

  // ----------------------------------------------------
  // PLAYER ID
  // ----------------------------------------------------

  param("player_id")
    .exists()
    .withMessage(
      "Player ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Player ID must be a positive integer"
    ),

  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .optional()
    .isString()
    .withMessage(
      "Player name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Player name cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Player name must be between 2 and 100 characters"
    ),

  // ----------------------------------------------------
  // PROFILE PHOTO
  // ----------------------------------------------------

  body("profile_photo")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Profile photo must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Profile photo is too long"
    ),

  // ----------------------------------------------------
  // DATE OF BIRTH
  // ----------------------------------------------------

  body("date_of_birth")
    .optional()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Date of birth must be a valid date"
    )
    .bail()
    .custom((value) => {
      const date =
        new Date(value);

      const today =
        new Date();

      const minimumDate =
        new Date(
          "1900-01-01T00:00:00.000Z"
        );

      if (date > today) {
        throw new Error(
          "Date of birth cannot be in the future"
        );
      }

      if (date < minimumDate) {
        throw new Error(
          "Date of birth is not valid"
        );
      }

      return true;
    }),

  // ----------------------------------------------------
  // GENDER
  // ----------------------------------------------------

  body("gender")
    .optional()
    .isString()
    .withMessage(
      "Gender must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Gender cannot be empty"
    )
    .bail()
    .isIn([
      "MALE",
      "FEMALE",
    ])
    .withMessage(
      "Gender must be MALE or FEMALE"
    ),

  // ----------------------------------------------------
  // POSITION
  // ----------------------------------------------------

  body("position")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Position must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Position cannot be empty"
    )
    .bail()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Position is too long"
    ),

  // ----------------------------------------------------
  // PHONE
  // ----------------------------------------------------

  body("phone")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Phone number must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage(
      "Phone number is too long"
    ),

  // ----------------------------------------------------
  // NATIONALITY
  // ----------------------------------------------------

  body("nationality")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Nationality must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 60,
    })
    .withMessage(
      "Nationality is too long"
    ),

  // ----------------------------------------------------
  // BLOCK UNEXPECTED FIELDS
  // ----------------------------------------------------

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// ACTIVATE / DEACTIVATE VALIDATION
// ======================================================

export const playerStatusValidation = [
  param("player_id")
    .exists()
    .withMessage(
      "Player ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Player ID must be a positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];