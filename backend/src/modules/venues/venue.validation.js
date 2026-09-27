import { body, param , checkExact} from "express-validator";

// Validate venue ID
export const venueIdValidation = [
  param("venue_id")
    .isInt({ min: 1 })
    .withMessage("Venue ID must be a valid positive integer"),

    checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];

// Create Venue validation
export const createVenueValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Venue name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Venue name must be between 2 and 150 characters"),

  body("address")
    .optional({ nullable: true })
    .isString()
    .withMessage("Address must be a string")
    .isLength({ max: 300 })
    .withMessage("Address is too long"),

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

  body("capacity")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 1000 })
    .withMessage("Description is too long"),

    checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];

// Update Venue validation
export const updateVenueValidation = [
  param("venue_id")
    .isInt({ min: 1 })
    .withMessage("Venue ID must be a valid positive integer"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Venue name must be between 2 and 150 characters"),

  body("address")
    .optional({ nullable: true })
    .isString()
    .withMessage("Address must be a string")
    .isLength({ max: 300 })
    .withMessage("Address is too long"),

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

  body("capacity")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 1000 })
    .withMessage("Description is too long"),


    checkExact([], {
  message: "Unexpected fields are not allowed",
}),
];