import express from "express";

import {
  createPlayer,
  getPlayers,
  getPlayerById,
  updatePlayer,
  deactivatePlayer,
  activatePlayer,
} from "./player.controller.js";

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
  playerIdValidation,
  createPlayerValidation,
  updatePlayerValidation,
  playerStatusValidation,
} from "./player.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

router.get(
  "/",
  getPlayers
);

router.get(
  "/:player_id",
  playerIdValidation,
  handleValidationErrors,
  getPlayerById
);

// ======================================================
// SUPER ADMIN ONLY
// ======================================================

// ------------------------------------------------------
// CREATE PLAYER
// ------------------------------------------------------

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  createPlayerValidation,
  handleValidationErrors,
  createPlayer
);

// ------------------------------------------------------
// UPDATE PLAYER
// ------------------------------------------------------

router.patch(
  "/:player_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  updatePlayerValidation,
  handleValidationErrors,
  updatePlayer
);

// ------------------------------------------------------
// DEACTIVATE PLAYER
// ------------------------------------------------------

router.patch(
  "/:player_id/deactivate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  playerStatusValidation,
  handleValidationErrors,
  deactivatePlayer
);

// ------------------------------------------------------
// ACTIVATE PLAYER
// ------------------------------------------------------

router.patch(
  "/:player_id/activate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  playerStatusValidation,
  handleValidationErrors,
  activatePlayer
);

export default router;