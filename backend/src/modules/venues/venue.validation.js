import {
  body,
  param,
  checkExact,
} from "express-validator";

// ======================================================
// VENUE ID VALIDATION
// ======================================================

export const venueIdValidation = [
  param("venue_id")
    .exists()
    .withMessage(
      "Venue ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Venue ID must be a valid positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// CREATE VENUE VALIDATION
// ======================================================

export const createVenueValidation = [
  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .exists()
    .withMessage(
      "Venue name is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Venue name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Venue name is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Venue name must be between 2 and 150 characters"
    ),

  // ----------------------------------------------------
  // REGION
  // ----------------------------------------------------

  body("region")
    .exists()
    .withMessage(
      "Region is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Region must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Region is required"
    )
    .bail()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Region is too long"
    ),

  // ----------------------------------------------------
  // DISTRICT
  // ----------------------------------------------------

  body("district")
    .exists()
    .withMessage(
      "District is required"
    )
    .bail()
    .isString()
    .withMessage(
      "District must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "District is required"
    )
    .bail()
    .isLength({
      max: 100,
    })
    .withMessage(
      "District is too long"
    ),

  // ----------------------------------------------------
  // CITY
  // ----------------------------------------------------

  body("city")
    .exists()
    .withMessage(
      "City is required"
    )
    .bail()
    .isString()
    .withMessage(
      "City must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "City is required"
    )
    .bail()
    .isLength({
      max: 100,
    })
    .withMessage(
      "City is too long"
    ),

  // ----------------------------------------------------
  // ADDRESS
  // ----------------------------------------------------

  body("address")
    .exists()
    .withMessage(
      "Address is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Address must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Address is required"
    )
    .bail()
    .isLength({
      max: 300,
    })
    .withMessage(
      "Address is too long"
    ),

  // ----------------------------------------------------
  // CAPACITY
  // ----------------------------------------------------

  body("capacity")
    .optional({
      nullable: true,
    })
    .isInt({
      min: 1,
    })
    .withMessage(
      "Capacity must be a positive integer"
    ),

  // ----------------------------------------------------
  // SURFACE TYPE
  // ----------------------------------------------------

  body("surface_type")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Surface type must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Surface type is too long"
    ),

  // ----------------------------------------------------
  // CONTACT PHONE
  // ----------------------------------------------------

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
      "Contact phone is too long"
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
// UPDATE VENUE VALIDATION
// ======================================================

export const updateVenueValidation = [
  // ----------------------------------------------------
  // VENUE ID
  // ----------------------------------------------------

  param("venue_id")
    .exists()
    .withMessage(
      "Venue ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Venue ID must be a valid positive integer"
    ),

  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .optional()
    .isString()
    .withMessage(
      "Venue name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Venue name cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Venue name must be between 2 and 150 characters"
    ),

  // ----------------------------------------------------
  // REGION
  // ----------------------------------------------------

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
    .notEmpty()
    .withMessage(
      "Region cannot be empty"
    )
    .bail()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Region is too long"
    ),

  // ----------------------------------------------------
  // DISTRICT
  // ----------------------------------------------------

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
    .notEmpty()
    .withMessage(
      "District cannot be empty"
    )
    .bail()
    .isLength({
      max: 100,
    })
    .withMessage(
      "District is too long"
    ),

  // ----------------------------------------------------
  // CITY
  // ----------------------------------------------------

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
    .notEmpty()
    .withMessage(
      "City cannot be empty"
    )
    .bail()
    .isLength({
      max: 100,
    })
    .withMessage(
      "City is too long"
    ),

  // ----------------------------------------------------
  // ADDRESS
  // ----------------------------------------------------

  body("address")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Address must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Address cannot be empty"
    )
    .bail()
    .isLength({
      max: 300,
    })
    .withMessage(
      "Address is too long"
    ),

  // ----------------------------------------------------
  // CAPACITY
  // ----------------------------------------------------

  body("capacity")
    .optional({
      nullable: true,
    })
    .isInt({
      min: 1,
    })
    .withMessage(
      "Capacity must be a positive integer"
    ),

  // ----------------------------------------------------
  // SURFACE TYPE
  // ----------------------------------------------------

  body("surface_type")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Surface type must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Surface type is too long"
    ),

  // ----------------------------------------------------
  // CONTACT PHONE
  // ----------------------------------------------------

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
      "Contact phone is too long"
    ),

  // ----------------------------------------------------
  // BLOCK UNEXPECTED FIELDS
  // ----------------------------------------------------

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];