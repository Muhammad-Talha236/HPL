import express from "express";

import {
  createPlayer,
  getPlayers,
  getPlayerById,
} from "./player.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// Public
router.get("/", getPlayers);

router.get("/:player_id", getPlayerById);

// Any authenticated user can create a player profile
router.post(
  "/",
  authenticate,
  authorize(
    ROLES.USER,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  createPlayer
);

export default router;