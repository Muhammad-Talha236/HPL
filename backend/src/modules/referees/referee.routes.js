import express from "express";

import {
  createReferee,
  getReferees,
  getRefereeById,
  updateReferee,
  deactivateReferee,
  activateReferee,
} from "./referee.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

import {
  refereeIdValidation,
  createRefereeValidation,
  updateRefereeValidation,
} from "./referee.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// GET ALL REFEREES
// PUBLIC
// ======================================================

router.get(
  "/",
  getReferees
);

// ======================================================
// GET REFEREE BY ID
// PUBLIC
// ======================================================

router.get(
  "/:referee_id",
  refereeIdValidation,
  handleValidationErrors,
  getRefereeById
);

// ======================================================
// CREATE REFEREE
// SUPER ADMIN ONLY
// ======================================================

router.post(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  createRefereeValidation,
  handleValidationErrors,
  createReferee
);

// ======================================================
// UPDATE REFEREE
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:referee_id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateRefereeValidation,
  handleValidationErrors,
  updateReferee
);

// ======================================================
// DEACTIVATE REFEREE
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:referee_id/deactivate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  refereeIdValidation,
  handleValidationErrors,
  deactivateReferee
);

// ======================================================
// ACTIVATE REFEREE
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:referee_id/activate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  refereeIdValidation,
  handleValidationErrors,
  activateReferee
);

export default router;