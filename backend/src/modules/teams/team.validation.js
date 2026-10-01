import {
  body,
  param,
  checkExact,
} from "express-validator";

// ======================================================
// TEAM ID VALIDATION
// ======================================================

export const teamIdValidation = [
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

// ======================================================
// CREATE TEAM VALIDATION
// ======================================================

export const createTeamValidation = [
  body("club_id")
    .exists()
    .withMessage(
      "Club ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Club ID must be a valid positive integer"
    ),

  body("home_venue_id")
    .exists()
    .withMessage(
      "Home venue ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Home venue ID must be a valid positive integer"
    ),

  body("name")
    .exists()
    .withMessage(
      "Team name is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Team name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Team name is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Team name must be between 2 and 100 characters"
    ),

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
      "MEN",
      "WOMEN",
    ])
    .withMessage(
      "Gender must be MEN or WOMEN"
    ),

  body("team_type")
    .exists()
    .withMessage(
      "Team type is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Team type must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Team type is required"
    )
    .bail()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Team type must not exceed 50 characters"
    ),

  body("logo")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Logo must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Logo must not exceed 500 characters"
    ),

  body("region")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Region must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Region must not exceed 100 characters"
    ),

  body("district")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "District must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "District must not exceed 100 characters"
    ),

  body("city")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "City must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "City must not exceed 100 characters"
    ),

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

  body("contact_email")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Contact email must be a string"
    )
    .bail()
    .trim()
    .isEmail()
    .withMessage(
      "Contact email must be valid"
    )
    .normalizeEmail(),

  body("contact_phone")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Contact phone must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage(
      "Contact phone must not exceed 30 characters"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// UPDATE TEAM VALIDATION
// ======================================================

export const updateTeamValidation = [
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

  body("home_venue_id")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Home venue ID must be a valid positive integer"
    ),

  body("name")
    .optional()
    .isString()
    .withMessage(
      "Team name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Team name cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Team name must be between 2 and 100 characters"
    ),

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
      "MEN",
      "WOMEN",
    ])
    .withMessage(
      "Gender must be MEN or WOMEN"
    ),

  body("team_type")
    .optional()
    .isString()
    .withMessage(
      "Team type must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Team type cannot be empty"
    )
    .bail()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Team type must not exceed 50 characters"
    ),

  body("logo")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Logo must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Logo must not exceed 500 characters"
    ),

  body("region")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Region must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Region must not exceed 100 characters"
    ),

  body("district")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "District must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "District must not exceed 100 characters"
    ),

  body("city")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "City must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "City must not exceed 100 characters"
    ),

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

  body("contact_email")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Contact email must be a string"
    )
    .bail()
    .trim()
    .isEmail()
    .withMessage(
      "Contact email must be valid"
    )
    .normalizeEmail(),

  body("contact_phone")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Contact phone must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage(
      "Contact phone must not exceed 30 characters"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// TRANSFER TEAM OWNERSHIP VALIDATION
// ======================================================

export const transferTeamOwnershipValidation = [
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

  body("owner_id")
    .exists()
    .withMessage(
      "New owner ID is required"
    )
    .bail()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Owner ID must be a valid positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];