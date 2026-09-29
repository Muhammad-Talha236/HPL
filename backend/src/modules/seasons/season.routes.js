import express from "express";

import {
  createSeason,
  getSeasons,
  getSeasonById,
  updateSeason,
  deactivateSeason,
  activateSeason,
} from "./season.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

import {
  seasonIdValidation,
  createSeasonValidation,
  updateSeasonValidation,
} from "./season.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

// Get all seasons
router.get("/", getSeasons);

// Get season by ID
router.get(
  "/:season_id",
  seasonIdValidation,
  handleValidationErrors,
  getSeasonById
);

// ======================================================
// SUPER ADMIN ROUTES
// ======================================================

// Create season
router.post(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  createSeasonValidation,
  handleValidationErrors,
  createSeason
);

// Update season
router.patch(
  "/:season_id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateSeasonValidation,
  handleValidationErrors,
  updateSeason
);

// Deactivate season
router.patch(
  "/:season_id/deactivate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  seasonIdValidation,
  handleValidationErrors,
  deactivateSeason
);

// Activate season
router.patch(
  "/:season_id/activate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  seasonIdValidation,
  handleValidationErrors,
  activateSeason
);

export default router;