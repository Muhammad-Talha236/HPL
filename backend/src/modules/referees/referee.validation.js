import { body, param } from "express-validator";

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
  body("name")
    .trim()
    .notEmpty()
    .withMessage(
      "Referee name is required"
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Referee name must be between 2 and 100 characters"
    ),

  body("profile_photo")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Profile photo must be a string"
    )
    .isLength({
      max: 500,
    })
    .withMessage(
      "Profile photo URL is too long"
    ),

  body("phone")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage(
      "Phone number is too long"
    ),

  body("region")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Region is too long"
    ),

  body("district")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "District is too long"
    ),

  body("city")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "City is too long"
    ),

  body("license_number")
    .trim()
    .notEmpty()
    .withMessage(
      "License number is required"
    )
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
  param("referee_id")
    .isInt({ min: 1 })
    .withMessage(
      "Referee ID must be a positive integer"
    ),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Referee name cannot be empty"
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Referee name must be between 2 and 100 characters"
    ),

  body("profile_photo")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Profile photo must be a string"
    )
    .isLength({
      max: 500,
    })
    .withMessage(
      "Profile photo URL is too long"
    ),

  body("phone")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage(
      "Phone number is too long"
    ),

  body("region")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Region is too long"
    ),

  body("district")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "District is too long"
    ),

  body("city")
    .optional({
      nullable: true,
    })
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "City is too long"
    ),

  body("license_number")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "License number cannot be empty"
    )
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "License number must be between 2 and 100 characters"
    ),
];