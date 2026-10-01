import express from "express";

import {
  createSeason,
  getSeasons,
  getSeasonById,
  updateSeason,
  deactivateSeason,
  activateSeason,
} from "./season.controller.js";

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
  seasonIdValidation,
  createSeasonValidation,
  updateSeasonValidation,
} from "./season.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

// ------------------------------------------------------
// GET ALL SEASONS
// ------------------------------------------------------

router.get(
  "/",
  getSeasons
);

// ------------------------------------------------------
// GET SEASON BY ID
// ------------------------------------------------------

router.get(
  "/:season_id",
  seasonIdValidation,
  handleValidationErrors,
  getSeasonById
);

// ======================================================
// SUPER ADMIN ROUTES
// ======================================================

// ------------------------------------------------------
// CREATE SEASON
// ------------------------------------------------------

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  createSeasonValidation,
  handleValidationErrors,
  createSeason
);

// ------------------------------------------------------
// DEACTIVATE SEASON
// ------------------------------------------------------

router.patch(
  "/:season_id/deactivate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  seasonIdValidation,
  handleValidationErrors,
  deactivateSeason
);

// ------------------------------------------------------
// ACTIVATE SEASON
// ------------------------------------------------------

router.patch(
  "/:season_id/activate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  seasonIdValidation,
  handleValidationErrors,
  activateSeason
);

// ------------------------------------------------------
// UPDATE SEASON
// ------------------------------------------------------

router.patch(
  "/:season_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  updateSeasonValidation,
  handleValidationErrors,
  updateSeason
);

export default router;