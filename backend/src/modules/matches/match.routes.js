import express from "express";

import {
  createMatch,
  getMatches,
  getMatchById,
  updateMatch,
  cancelMatch,
  completeMatch,
   startMatch,
  postponeMatch,
} from "./match.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { authorizeMatchOfficial } from "../referees/refereeAssignment.middleware.js";
import { broadcastSuccessfulMatchChange } from "./match.realtime.middleware.js";

import {
  matchIdValidation,
  createMatchValidation,
  updateMatchValidation,
  startMatchValidation,
} from "./match.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

// Get all matches
router.get(
  "/",
  getMatches
);

// Get single match
router.get(
  "/:match_id",
  matchIdValidation,
  handleValidationErrors,
  getMatchById
);

// ======================================================
// SUPER ADMIN ROUTES
// ======================================================

// Create / schedule match
router.post(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  createMatchValidation,
  handleValidationErrors,
  broadcastSuccessfulMatchChange("fixture-created"),
  createMatch
);

// Update scheduled match
router.patch(
  "/:match_id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateMatchValidation,
  handleValidationErrors,
  broadcastSuccessfulMatchChange("fixture-updated"),
  updateMatch
);

// Cancel match
router.patch(
  "/:match_id/cancel",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  matchIdValidation,
  handleValidationErrors,
  broadcastSuccessfulMatchChange("match-cancelled"),
  cancelMatch
);

router.patch(
  "/:match_id/postpone",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  matchIdValidation,
  handleValidationErrors,
  broadcastSuccessfulMatchChange("match-postponed"),
  postponeMatch
);

// Complete match
router.patch(
  "/:match_id/complete",
  authenticate,
  authorizeMatchOfficial,
  matchIdValidation,
  handleValidationErrors,
  broadcastSuccessfulMatchChange("match-completed"),
  completeMatch
);


router.post(
  "/:match_id/start",
  authenticate,
  authorizeMatchOfficial,
  startMatchValidation,
  handleValidationErrors,
  broadcastSuccessfulMatchChange("match-started"),
  startMatch
);
export default router;
