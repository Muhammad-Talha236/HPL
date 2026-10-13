import { normalizeStoredEmail, isValidAccountEmail } from "../../utils/email.util.js";
import {
  body,
  param,
  checkExact,
} from "express-validator";

import { ROLES } from "../../constants/roles.js";

// ============================================================
// REGISTER VALIDATION
// ============================================================

export const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[A-Za-z][A-Za-z\s'-]*$/)
    .withMessage(
      "Name must start with a letter and contain only letters, spaces, apostrophes, or hyphens",
    ),

  body("email")
    .isString().bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .custom(isValidAccountEmail)
    .withMessage("Please provide a valid email address")
    .customSanitizer(normalizeStoredEmail),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .notEmpty()
    .withMessage("Password is required"),

  body("phone")
    .optional({ nullable: true })
    .trim()
    .matches(/^03\d{9}$/)
    .withMessage(
      "Phone number must be an 11-digit mobile number starting with 03",
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

// ============================================================
// LOGIN VALIDATION
// ============================================================

export const loginValidation = [
  body("email")
    .isString().bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .custom(isValidAccountEmail)
    .withMessage("Please provide a valid email address")
    .customSanitizer(normalizeStoredEmail),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .notEmpty()
    .withMessage("Password is required"),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

// ============================================================
// SELF-SERVICE ACCOUNT VALIDATION
// ============================================================

export const updateMyProfileValidation = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[A-Za-z][A-Za-z\s'-]*$/)
    .withMessage(
      "Name must start with a letter and contain only letters, spaces, apostrophes, or hyphens",
    ),

  body("phone")
    .optional({ nullable: true })
    .isString()
    .withMessage("Phone number must be a string")
    .trim()
    .matches(/^03\d{9}$/)
    .withMessage(
      "Phone number must be an 11-digit mobile number starting with 03",
    ),

  body("location").optional({ nullable: true }).isString().withMessage("Location must be a string").trim().isLength({ max: 120 }).withMessage("Location must be 120 characters or fewer"),

  body("date_of_birth").optional({ nullable: true }).isISO8601({ strict: true }).withMessage("Date of birth must be a valid date"),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

export const changeMyPasswordValidation = [
  body("current_password")
    .isString()
    .withMessage("Current password must be a string")
    .notEmpty()
    .withMessage("Current password is required"),

  body("new_password")
    .isString()
    .withMessage("New password must be a string")
    .notEmpty()
    .withMessage("New password is required"),

  body("confirm_password")
    .isString()
    .withMessage("Password confirmation must be a string")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => value === req.body.new_password)
    .withMessage("New password and confirmation must match"),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

// ============================================================
// UPDATE USER ROLE VALIDATION
// ============================================================

export const updateUserRoleValidation = [
  param("user_id")
    .isInt({ min: 1 })
    .withMessage("User ID must be a valid positive integer"),

  body("role")
    .isString()
    .withMessage("Role must be a string")
    .isIn([
      ROLES.SUPER_ADMIN,
      ROLES.CLUB_OWNER,
      ROLES.USER,
    ])
    .withMessage("Invalid role"),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];
