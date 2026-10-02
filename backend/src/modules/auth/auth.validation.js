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
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

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
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

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
      ROLES.TEAM_OWNER,
      ROLES.USER,
    ])
    .withMessage("Invalid role"),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];
