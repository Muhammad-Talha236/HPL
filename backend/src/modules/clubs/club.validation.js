import {
  body,
  param,
  checkExact,
} from "express-validator";
// Validate club ID in URL
export const clubIdValidation = [
  param("club_id")
    .isInt({ min: 1 })
    .withMessage("Club ID must be a valid positive integer"),
  checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];

// Create Club validation
export const createClubValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Club name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Club name must be between 2 and 100 characters"),

  body("logo")
    .optional({ nullable: true })
    .isString()
    .withMessage("Logo must be a string")
    .isLength({ max: 500 })
    .withMessage("Logo is too long"),

  body("region")
    .optional({ nullable: true })
    .isString()
    .withMessage("Region must be a string")
    .isLength({ max: 100 })
    .withMessage("Region is too long"),

  body("district")
    .optional({ nullable: true })
    .isString()
    .withMessage("District must be a string")
    .isLength({ max: 100 })
    .withMessage("District is too long"),

  body("city")
    .optional({ nullable: true })
    .isString()
    .withMessage("City must be a string")
    .isLength({ max: 100 })
    .withMessage("City is too long"),

 body("description")
  .optional({ nullable: true })
  .isString()
  .withMessage("Description must be a string")
  .isLength({ max: 1000 })
  .withMessage("Description is too long"),

  body("contact_email")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("Contact email must be valid")
    .normalizeEmail(),

  body("contact_phone")
    .optional({ nullable: true })
    .isString()
    .withMessage("Contact phone must be a string")
    .isLength({ max: 30 })
    .withMessage("Contact phone is too long"),

    checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];

// Update Club validation
export const updateClubValidation = [
  param("club_id")
    .isInt({ min: 1 })
    .withMessage("Club ID must be a valid positive integer"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Club name must be between 2 and 100 characters"),

  body("logo")
    .optional({ nullable: true })
    .isString()
    .withMessage("Logo must be a string")
    .isLength({ max: 500 })
    .withMessage("Logo is too long"),

  body("region")
    .optional({ nullable: true })
    .isString()
    .withMessage("Region must be a string")
    .isLength({ max: 100 })
    .withMessage("Region is too long"),

  body("district")
    .optional({ nullable: true })
    .isString()
    .withMessage("District must be a string")
    .isLength({ max: 100 })
    .withMessage("District is too long"),

  body("city")
    .optional({ nullable: true })
    .isString()
    .withMessage("City must be a string")
    .isLength({ max: 100 })
    .withMessage("City is too long"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description is too long")
    .isLength({ max: 1000 })
    .withMessage("Description is too long"),

  body("contact_email")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("Contact email must be valid")
    .normalizeEmail(),

  body("contact_phone")
    .optional({ nullable: true })
    .isString()
    .withMessage("Contact phone must be a string")
    .isLength({ max: 30 })
    .withMessage("Contact phone is too long"),

    checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];

// Transfer Club Ownership validation
export const transferClubOwnershipValidation = [
  param("club_id")
    .isInt({ min: 1 })
    .withMessage("Club ID must be a valid positive integer"),

  body("owner_id")
    .isInt({ min: 1 })
    .withMessage("Owner ID must be a valid positive integer"),

    checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];