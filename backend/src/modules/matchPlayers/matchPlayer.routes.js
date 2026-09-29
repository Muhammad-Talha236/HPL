import express from "express";

import {
  createMatchPlayer,
  getMatchSquad,
  updateMatchPlayer,
  removeMatchPlayer,
} from "./matchPlayer.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

import {
  matchPlayerIdValidation,
  createMatchPlayerValidation,
  updateMatchPlayerValidation,
  matchSquadValidation,
} from "./matchPlayer.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// Get match squad
router.get(
  "/match/:match_id/team/:team_id",
  matchSquadValidation,
  handleValidationErrors,
  getMatchSquad
);

// Add player to match squad
router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER
  ),
  createMatchPlayerValidation,
  handleValidationErrors,
  createMatchPlayer
);

// Update match player
router.patch(
  "/:match_player_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER
  ),
  updateMatchPlayerValidation,
  handleValidationErrors,
  updateMatchPlayer
);

// Remove player from match squad
router.delete(
  "/:match_player_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER
  ),
  matchPlayerIdValidation,
  handleValidationErrors,
  removeMatchPlayer
);

export default router;