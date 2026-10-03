import express from "express";

import {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  updateCompetition,
  deactivateCompetition,
  activateCompetition,
} from "./competition.controller.js";
import { getCompetitionParticipants } from "./competition.participants.controller.js";

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
  competitionIdValidation,
  createCompetitionValidation,
  updateCompetitionValidation,
} from "./competition.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

// ------------------------------------------------------
// GET ALL COMPETITIONS
// ------------------------------------------------------

router.get(
  "/",
  getCompetitions
);

// ------------------------------------------------------
// GET COMPETITION BY ID
// ------------------------------------------------------

router.get(
  "/:competition_id/teams",
  competitionIdValidation,
  handleValidationErrors,
  getCompetitionParticipants
);
router.get(
  "/:competition_id",
  competitionIdValidation,
  handleValidationErrors,
  getCompetitionById
);

// ======================================================
// SUPER ADMIN ROUTES
// ======================================================

// ------------------------------------------------------
// CREATE COMPETITION
// ------------------------------------------------------

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  createCompetitionValidation,
  handleValidationErrors,
  createCompetition
);

// ------------------------------------------------------
// DEACTIVATE COMPETITION
// ------------------------------------------------------

router.patch(
  "/:competition_id/deactivate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  competitionIdValidation,
  handleValidationErrors,
  deactivateCompetition
);

// ------------------------------------------------------
// ACTIVATE COMPETITION
// ------------------------------------------------------

router.patch(
  "/:competition_id/activate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  competitionIdValidation,
  handleValidationErrors,
  activateCompetition
);

// ------------------------------------------------------
// UPDATE COMPETITION
// ------------------------------------------------------

router.patch(
  "/:competition_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  updateCompetitionValidation,
  handleValidationErrors,
  updateCompetition
);

export default router;
