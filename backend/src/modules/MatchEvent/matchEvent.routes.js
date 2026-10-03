import express from "express";

import {
  createMatchEvent,
  getMatchEvents,
  getMatchEventById,
  updateMatchEvent,
  deleteMatchEvent,
} from "./matchEvent.controller.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { authorizeAssignedRefereeOrAdmin } from "../referees/refereeAssignment.middleware.js";

import {
  matchEventIdValidation,
  createMatchEventValidation,
  matchEventsByMatchValidation,
   updateMatchEventValidation,
   deleteMatchEventValidation,
} from "./matchEvent.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ==================================================
// CREATE MATCH EVENT
// ==================================================
// SUPER_ADMIN, TEAM_OWNER, CLUB_OWNER can create
// live match events.

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.REFEREE
  ),
  authorizeAssignedRefereeOrAdmin,
  createMatchEventValidation,
  handleValidationErrors,
  createMatchEvent
);

// ==================================================
// EVENT ID
// ==================================================
// Reserved for event-specific operations.
// GET SINGLE MATCH EVENT

// GET ALL EVENTS OF A MATCH
router.get(
  "/match/:match_id",
  matchEventsByMatchValidation,
  handleValidationErrors,
  getMatchEvents
);


router.get(
  "/:event_id",
  matchEventIdValidation,
  handleValidationErrors,
   getMatchEventById
) ;

// UPDATE MATCH EVENT
router.patch(
  "/:event_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.REFEREE
  ),
  updateMatchEventValidation,
  handleValidationErrors,
  updateMatchEvent
);

// DELETE MATCH EVENT
router.delete(
  "/:event_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER
  ),
  deleteMatchEventValidation,
  handleValidationErrors,
  deleteMatchEvent
);

export default router;
