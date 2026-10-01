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
  teamIdValidation,
  createTeamValidation,
  updateTeamValidation,
  transferTeamOwnershipValidation,
} from "./team.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

// ------------------------------------------------------
// GET ALL TEAMS
// ------------------------------------------------------

router.get(
  "/",
  getTeams
);

// ------------------------------------------------------
// GET TEAM BY ID
// ------------------------------------------------------

router.get(
  "/:team_id",
  teamIdValidation,
  handleValidationErrors,
  getTeamById
);

// ======================================================
// AUTHENTICATED TEAM MANAGEMENT
// ======================================================

// ------------------------------------------------------
// CREATE TEAM
// ------------------------------------------------------
// CLUB_OWNER:
//   Can create a team under their own club.
//
// SUPER_ADMIN:
//   Can create a team under any active club.

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  createTeamValidation,
  handleValidationErrors,
  createTeam
);

// ------------------------------------------------------
// UPDATE TEAM
// ------------------------------------------------------
// TEAM_OWNER:
//   Can update their own team.
//
// CLUB_OWNER:
//   Can update teams inside their own club.
//
// SUPER_ADMIN:
//   Can update any team.

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

// ------------------------------------------------------
// DEACTIVATE TEAM
// ------------------------------------------------------
// TEAM_OWNER:
//   Can deactivate their own team.
//
// CLUB_OWNER:
//   Can deactivate teams inside their own club.
//
// SUPER_ADMIN:
//   Can deactivate any team.
//
// Controller additionally prevents deactivation when
// the team has a scheduled/live match.

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

// ------------------------------------------------------
// ACTIVATE TEAM
// ------------------------------------------------------
// Only SUPER_ADMIN can activate a team.
//
// Controller additionally checks that the club is active.

router.patch(
  "/:team_id/activate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  teamIdValidation,
  handleValidationErrors,
  activateTeam
);

// ------------------------------------------------------
// TRANSFER TEAM OWNERSHIP
// ------------------------------------------------------
// TEAM_OWNER:
//   Can transfer their own team.
//
// CLUB_OWNER:
//   Can transfer teams inside their own club.
//
// SUPER_ADMIN:
//   Can transfer any team.
//
// New owner must be an active TEAM_OWNER.

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