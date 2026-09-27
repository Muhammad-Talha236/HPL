import express from "express";

import {
  createPlayer,
  getPlayers,
  getPlayerById,
} from "./player.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

import {
  playerIdValidation,
  createPlayerValidation,
} from "./player.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

router.get("/", getPlayers);

router.get(
  "/:player_id",
  playerIdValidation,
  handleValidationErrors,
  getPlayerById
);

// ======================================================
// CREATE PLAYER
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
  createPlayerValidation,
  handleValidationErrors,
  createPlayer
);

export default router;