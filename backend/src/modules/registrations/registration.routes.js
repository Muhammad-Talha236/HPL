import express from "express";

import {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  reviewRegistration,
} from "./registration.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

import {
  registrationIdValidation,
  createRegistrationValidation,
  reviewRegistrationValidation,
} from "./registration.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// CREATE REGISTRATION
// ======================================================

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.USER,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  createRegistrationValidation,
  handleValidationErrors,
  createRegistration
);

// ======================================================
// GET ALL REGISTRATIONS
// SUPER ADMIN ONLY
// ======================================================

router.get(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  getRegistrations
);

// ======================================================
// GET REGISTRATION BY ID
// OWN REGISTRATION / OWN TEAM / OWN CLUB / SUPER ADMIN
// ======================================================

router.get(
  "/:registration_id",
  authenticate,
  authorize(
    ROLES.USER,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  registrationIdValidation,
  handleValidationErrors,
  getRegistrationById
);

// ======================================================
// REVIEW REGISTRATION
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:registration_id/review",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  reviewRegistrationValidation,
  handleValidationErrors,
  reviewRegistration
);

export default router;