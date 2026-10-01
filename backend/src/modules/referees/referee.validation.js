import {
  body,
  param,
} from "express-validator";

// ======================================================
// REFEREE ID VALIDATION
// ======================================================

export const refereeIdValidation = [
  param("referee_id")
    .isInt({ min: 1 })
    .withMessage(
      "Referee ID must be a positive integer"
    ),
];

// ======================================================
// CREATE REFEREE VALIDATION
// ======================================================

export const createRefereeValidation = [
  // --------------------------------------------------
  // NAME
  // --------------------------------------------------

  body("name")
    .exists()
    .withMessage(
      "Referee name is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Referee name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Referee name is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Referee name must be between 2 and 100 characters"
    ),

  // --------------------------------------------------
  // PROFILE PHOTO
  // --------------------------------------------------

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
      "Profile photo URL is too long"
    ),

  // --------------------------------------------------
  // PHONE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // REGION
  // --------------------------------------------------

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
      "Region is too long"
    ),

  // --------------------------------------------------
  // DISTRICT
  // --------------------------------------------------

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
      "District is too long"
    ),

  // --------------------------------------------------
  // CITY
  // --------------------------------------------------

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
      "City is too long"
    ),

  // --------------------------------------------------
  // LICENSE NUMBER
  // --------------------------------------------------

  body("license_number")
    .exists()
    .withMessage(
      "License number is required"
    )
    .bail()
    .isString()
    .withMessage(
      "License number must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "License number is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "License number must be between 2 and 100 characters"
    ),
];

// ======================================================
// UPDATE REFEREE VALIDATION
// ======================================================

export const updateRefereeValidation = [
  // --------------------------------------------------
  // REFEREE ID
  // --------------------------------------------------

  param("referee_id")
    .isInt({ min: 1 })
    .withMessage(
      "Referee ID must be a positive integer"
    ),

  // --------------------------------------------------
  // NAME
  // --------------------------------------------------

  body("name")
    .optional()
    .isString()
    .withMessage(
      "Referee name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Referee name cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Referee name must be between 2 and 100 characters"
    ),

  // --------------------------------------------------
  // PROFILE PHOTO
  // --------------------------------------------------

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
      "Profile photo URL is too long"
    ),

  // --------------------------------------------------
  // PHONE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // REGION
  // --------------------------------------------------

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
      "Region is too long"
    ),

  // --------------------------------------------------
  // DISTRICT
  // --------------------------------------------------

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
      "District is too long"
    ),

  // --------------------------------------------------
  // CITY
  // --------------------------------------------------

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
      "City is too long"
    ),

  // --------------------------------------------------
  // LICENSE NUMBER
  // --------------------------------------------------

  body("license_number")
    .optional()
    .isString()
    .withMessage(
      "License number must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "License number cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "License number must be between 2 and 100 characters"
    ),
];