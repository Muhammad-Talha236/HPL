import express from "express";

import {
  createReferee,
  getReferees,
  getRefereeById,
  updateReferee,
  deactivateReferee,
  activateReferee,
} from "./referee.controller.js";
import { getPublicReferee, getPublicRefereeMatches, getPublicReferees } from "./referee.public.controller.js";
import { createRefereeEvaluation, getMyAssignments, getMyDashboard, getMyMatchWorkspace, getMyRefereeProfile, getMyUpcomingAssignments, linkRefereeAccount, rebuildRankings } from "./referee.advanced.controller.js";
import { getRefereeRankings } from "./referee.ranking.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";

import { authorize } from "../../middleware/auth/role.middleware.js";

import { ROLES } from "../../constants/roles.js";

import {
  refereeIdValidation,
  createRefereeValidation,
  updateRefereeValidation,
} from "./referee.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// GET ALL REFEREES
// PUBLIC
// ======================================================

router.get(
  "/",
  getPublicReferees
);

router.get("/rankings", getRefereeRankings);
router.post("/rankings/rebuild", authenticate, authorize(ROLES.SUPER_ADMIN), rebuildRankings);
router.get("/me/profile", authenticate, authorize(ROLES.REFEREE), getMyRefereeProfile);
router.get("/me/dashboard", authenticate, authorize(ROLES.REFEREE), getMyDashboard);
router.get("/me/matches", authenticate, authorize(ROLES.REFEREE), getMyAssignments);
router.get("/me/upcoming", authenticate, authorize(ROLES.REFEREE), getMyUpcomingAssignments);
router.get("/me/matches/:match_id", authenticate, authorize(ROLES.REFEREE), getMyMatchWorkspace);
router.post("/:referee_id/link-account", authenticate, authorize(ROLES.SUPER_ADMIN), refereeIdValidation, handleValidationErrors, linkRefereeAccount);
router.post("/:referee_id/evaluations", authenticate, authorize(ROLES.SUPER_ADMIN), refereeIdValidation, handleValidationErrors, createRefereeEvaluation);
router.get("/:referee_id/matches", refereeIdValidation, handleValidationErrors, getPublicRefereeMatches);

// ======================================================
// CREATE REFEREE
// SUPER ADMIN ONLY
// ======================================================

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  createRefereeValidation,
  handleValidationErrors,
  createReferee
);

// ======================================================
// DEACTIVATE REFEREE
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:referee_id/deactivate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  refereeIdValidation,
  handleValidationErrors,
  deactivateReferee
);

// ======================================================
// ACTIVATE REFEREE
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:referee_id/activate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  refereeIdValidation,
  handleValidationErrors,
  activateReferee
);

// ======================================================
// UPDATE REFEREE
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:referee_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  updateRefereeValidation,
  handleValidationErrors,
  updateReferee
);

// ======================================================
// GET REFEREE BY ID
// PUBLIC
// ======================================================

router.get(
  "/:referee_id",
  refereeIdValidation,
  handleValidationErrors,
  getPublicReferee
);

export default router;
