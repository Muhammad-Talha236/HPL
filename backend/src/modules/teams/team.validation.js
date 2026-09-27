
import {
  body,
  param,
  checkExact,
} from "express-validator";
// Validate team ID in URL
export const teamIdValidation = [
  param("team_id")
    .isInt({ min: 1 })
    .withMessage("Team ID must be a valid positive integer"),

    checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];

// Create Team validation
export const createTeamValidation = [
  body("club_id")
    .isInt({ min: 1 })
    .withMessage("Club ID must be a valid positive integer"),

  body("home_venue_id")
    .isInt({ min: 1 })
    .withMessage("Home venue ID must be a valid positive integer"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Team name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Team name must be between 2 and 100 characters"),

  body("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["MEN", "WOMEN"])
    .withMessage("Gender must be MEN or WOMEN"),

  body("team_type")
    .trim()
    .notEmpty()
    .withMessage("Team type is required")
    .isLength({ max: 50 })
    .withMessage("Team type is too long"),

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

// Update Team validation
export const updateTeamValidation = [
  param("team_id")
    .isInt({ min: 1 })
    .withMessage("Team ID must be a valid positive integer"),

  body("home_venue_id")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Home venue ID must be a valid positive integer"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Team name must be between 2 and 100 characters"),

  body("gender")
    .optional()
    .trim()
    .isIn(["MEN", "WOMEN"])
    .withMessage("Gender must be MEN or WOMEN"),

  body("team_type")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Team type is too long"),

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

// Transfer Team Ownership validation
export const transferTeamOwnershipValidation = [
  param("team_id")
    .isInt({ min: 1 })
    .withMessage("Team ID must be a valid positive integer"),

  body("owner_id")
    .isInt({ min: 1 })
    .withMessage("Owner ID must be a valid positive integer"),
    
    checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];