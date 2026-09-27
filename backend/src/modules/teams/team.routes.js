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

import {
  teamIdValidation,
  createTeamValidation,
  updateTeamValidation,
  transferTeamOwnershipValidation,
} from "./team.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// Create Team
router.post(
  "/",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  createTeamValidation,
  handleValidationErrors,
  createTeam
);

// Public
router.get("/", getTeams);

router.get(
  "/:team_id",
  teamIdValidation,
  handleValidationErrors,
  getTeamById
);

// Update Team
router.patch(
  "/:team_id",
  authenticate,
  authorize(
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  updateTeamValidation,
  handleValidationErrors,
  updateTeam
);

// Deactivate Team
router.patch(
  "/:team_id/deactivate",
  authenticate,
  authorize(
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  teamIdValidation,
  handleValidationErrors,
  deactivateTeam
);

// Activate Team
// Only Super Admin can activate a team
router.patch(
  "/:team_id/activate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  teamIdValidation,
  handleValidationErrors,
  activateTeam
);

// Transfer Team Ownership
router.patch(
  "/:team_id/owner",
  authenticate,
  authorize(
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  transferTeamOwnershipValidation,
  handleValidationErrors,
  transferTeamOwnership
);

export default router;