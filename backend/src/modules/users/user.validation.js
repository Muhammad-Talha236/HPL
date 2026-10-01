import {
  body,
  param,
  checkExact,
} from "express-validator";

/*
  Validate User ID
*/
export const userIdValidation = [
  param("user_id")
    .exists()
    .withMessage("User ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "User ID must be a valid positive integer"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  UPDATE USER PROFILE

  Allowed:
  - name
  - phone
  - profile_image

  Not allowed:
  - email
  - password
  - password_hash
  - role
  - status
  - user_id
*/
export const updateUserValidation = [
  param("user_id")
    .exists()
    .withMessage("User ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "User ID must be a valid positive integer"
    ),

  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Name must be between 2 and 100 characters"
    ),

  body("phone")
    .optional({ nullable: true })
    .isString()
    .withMessage("Phone must be a string")
    .bail()
    .trim()
    .isLength({ max: 30 })
    .withMessage(
      "Phone must not exceed 30 characters"
    ),

  body("profile_image")
    .optional({ nullable: true })
    .isString()
    .withMessage(
      "Profile image must be a string"
    )
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Profile image must not exceed 500 characters"
    ),

  /*
    These fields must never be changed
    through the profile update endpoint.
  */
  body("email")
    .not()
    .exists()
    .withMessage(
      "Email cannot be updated through this endpoint"
    ),

  body("password")
    .not()
    .exists()
    .withMessage(
      "Password cannot be updated through this endpoint"
    ),

  body("password_hash")
    .not()
    .exists()
    .withMessage(
      "Password hash cannot be provided"
    ),

  body("role")
    .not()
    .exists()
    .withMessage(
      "Role cannot be updated through this endpoint"
    ),

  body("status")
    .not()
    .exists()
    .withMessage(
      "Status cannot be updated directly"
    ),

  body("user_id")
    .not()
    .exists()
    .withMessage(
      "User ID cannot be provided in request body"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  UPDATE USER ROLE

  Only SUPER_ADMIN can reach this endpoint.
*/
export const updateUserRoleValidation = [
  param("user_id")
    .exists()
    .withMessage("User ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "User ID must be a valid positive integer"
    ),

  body("role")
    .exists()
    .withMessage("Role is required")
    .bail()
    .isString()
    .withMessage("Role must be a string")
    .bail()
    .trim()
    .isIn([
      "SUPER_ADMIN",
      "CLUB_OWNER",
      "TEAM_OWNER",
      "USER",
    ])
    .withMessage(
      "Invalid user role"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  STATUS ENDPOINTS

  No request body is accepted.
*/
export const userStatusValidation = [
  param("user_id")
    .exists()
    .withMessage("User ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "User ID must be a valid positive integer"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];