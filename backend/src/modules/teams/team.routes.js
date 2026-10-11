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
  createTeamDocument,
  createTeamKit,
  createTeamStaff,
  deleteTeamDocument,
  deleteTeamKit,
  deleteTeamStaff,
  listTeamDocuments,
  listTeamKits,
  listTeamStaff,
  updateTeamDocument,
  updateTeamKit,
  updateTeamStaff,
} from "./team.detail.controller.js";

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
  getMyIndependentTeamApplications,
  resubmitIndependentTeamApplication,
  submitIndependentTeamApplication,
} from "./teamRegistration.controller.js";

import {
  independentTeamApplicationIdValidation,
  independentTeamApplicationResubmitValidation,
  independentTeamApplicationValidation,
} from "./teamRegistration.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// INDEPENDENT TEAM REGISTRATION
// ======================================================
// Submission creates a reviewable application only. An administrator performs
// the guarded provisional approval and any USER -> TEAM_OWNER promotion later.
router.post(
  "/independent",
  authenticate,
  authorize(ROLES.USER, ROLES.TEAM_OWNER),
  independentTeamApplicationValidation,
  handleValidationErrors,
  submitIndependentTeamApplication
);

router.get(
  "/independent/my",
  authenticate,
  authorize(ROLES.USER, ROLES.TEAM_OWNER),
  getMyIndependentTeamApplications
);

router.patch(
  "/independent/:request_id",
  authenticate,
  authorize(ROLES.USER, ROLES.TEAM_OWNER),
  independentTeamApplicationResubmitValidation,
  handleValidationErrors,
  resubmitIndependentTeamApplication
);

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

router.get(
  "/:team_id/staff",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  listTeamStaff
);

router.post(
  "/:team_id/staff",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  createTeamStaff
);

router.patch(
  "/:team_id/staff/:staff_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  updateTeamStaff
);

router.delete(
  "/:team_id/staff/:staff_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  deleteTeamStaff
);

router.get(
  "/:team_id/kits",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  listTeamKits
);

router.post(
  "/:team_id/kits",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  createTeamKit
);

router.patch(
  "/:team_id/kits/:kit_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  updateTeamKit
);

router.delete(
  "/:team_id/kits/:kit_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  deleteTeamKit
);

router.get(
  "/:team_id/documents",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  listTeamDocuments
);

router.post(
  "/:team_id/documents",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  createTeamDocument
);

router.patch(
  "/:team_id/documents/:document_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  updateTeamDocument
);

router.delete(
  "/:team_id/documents/:document_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  deleteTeamDocument
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
  authorize(ROLES.SUPER_ADMIN),
  transferTeamOwnershipValidation,
  handleValidationErrors,
  transferTeamOwnership
);

export default router;
