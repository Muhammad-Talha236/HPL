import express from "express";

import {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  reviewRegistration,
} from "./registration.controller.js";
import { getAdminRegistration, getAdminRegistrations, getEligibleTeams, getMyRegistrations, updateRegistrationSquad } from "./registration.extra.controller.js";

import {
  authenticate,
} from "../../middleware/auth/auth.middleware.js";

import {
  authorize,
} from "../../middleware/auth/role.middleware.js";

import {
  ROLES,
} from "../../constants/roles.js";

import {
  registrationIdValidation,
  createRegistrationValidation,
  reviewRegistrationValidation,
} from "./registration.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

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
  authorize(
    ROLES.SUPER_ADMIN
  ),
  getAdminRegistrations
);

// ======================================================
// REVIEW REGISTRATION
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:registration_id/review",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  reviewRegistrationValidation,
  handleValidationErrors,
  reviewRegistration
);

// ======================================================
// GET REGISTRATION BY ID
// OWN REGISTRATION / OWN TEAM / OWN CLUB / SUPER ADMIN
// ======================================================

router.get(
  "/admin/:registration_id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  registrationIdValidation,
  handleValidationErrors,
  getAdminRegistration
);
router.get(
  "/my",
  authenticate,
  authorize(ROLES.USER, ROLES.TEAM_OWNER, ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  getMyRegistrations
);
router.get(
  "/eligible-teams",
  authenticate,
  authorize(ROLES.USER, ROLES.TEAM_OWNER, ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  getEligibleTeams
);
router.put(
  "/:registration_id/squad",
  authenticate,
  authorize(ROLES.USER, ROLES.TEAM_OWNER, ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  registrationIdValidation,
  handleValidationErrors,
  updateRegistrationSquad
);
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

export default router;
