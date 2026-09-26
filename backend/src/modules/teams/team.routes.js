import express from "express";

import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deactivateTeam,
  activateTeam,
  transferTeamOwnership,
} from "./team.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  createTeam
);

// Public
router.get("/", getTeams);

router.get("/:team_id", getTeamById);

// Protected
router.patch(
  "/:team_id",
  authenticate,
  authorize(ROLES.TEAM_OWNER, ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  updateTeam
);

router.patch(
  "/:team_id/deactivate",
  authenticate,
  authorize(
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  deactivateTeam
);

router.patch(
  "/:team_id/activate",
  authenticate,
  authorize(
     ROLES.USER,
  ROLES.TEAM_OWNER,
  ROLES.CLUB_OWNER,
  ROLES.SUPER_ADMIN
  ),
  activateTeam
);
router.patch(
  "/:team_id/owner",
  authenticate,
  authorize(
    ROLES.USER,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  transferTeamOwnership
);

export default router;