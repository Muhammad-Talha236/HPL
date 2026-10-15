import prisma from "../../database/prisma.js";
import { saveCompetition, publicCompetitions, manageCompetitions, competitionAction } from "../registrations/workflow.controller.js";
import express from "express";

import {
  updateCompetition,
  deactivateCompetition,
  activateCompetition,
} from "./competition.controller.js";
import { getCompetitionParticipants } from "./competition.participants.controller.js";

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
  competitionIdValidation,
  updateCompetitionValidation,
} from "./competition.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();
router.get("/management", authenticate, authorize(ROLES.SUPER_ADMIN), manageCompetitions);
router.get("/management/:competition_id", authenticate, authorize(ROLES.SUPER_ADMIN), manageCompetitions);
router.post("/:competition_id/:action", authenticate, authorize(ROLES.SUPER_ADMIN), competitionAction);

// ======================================================
// PUBLIC ROUTES
// ======================================================

// ------------------------------------------------------
// GET ALL COMPETITIONS
// ------------------------------------------------------

router.get(
  "/",
  publicCompetitions
);

// ------------------------------------------------------
// GET COMPETITION BY ID
// ------------------------------------------------------

router.get(
  "/:competition_id/teams",
  competitionIdValidation,
  handleValidationErrors,
  getCompetitionParticipants
);
router.get(
  "/:competition_id",
  competitionIdValidation,
  handleValidationErrors,
  publicCompetitions
);

// ======================================================
// SUPER ADMIN ROUTES
// ======================================================

// ------------------------------------------------------
// CREATE COMPETITION
// ------------------------------------------------------

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  handleValidationErrors,
  saveCompetition
);

// ------------------------------------------------------
// DEACTIVATE COMPETITION
// ------------------------------------------------------

router.patch(
  "/:competition_id/deactivate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  competitionIdValidation,
  handleValidationErrors,
  deactivateCompetition
);

// ------------------------------------------------------
// ACTIVATE COMPETITION
// ------------------------------------------------------

router.patch(
  "/:competition_id/activate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  competitionIdValidation,
  handleValidationErrors,
  activateCompetition
);

// ------------------------------------------------------
// UPDATE COMPETITION
// ------------------------------------------------------

router.patch(
  "/:competition_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  async (req, res, next) => {
    if (req.body?.registration_type) return saveCompetition(req, res);
    try { const c = await prisma.competition.findUnique({ where: { competition_id: Number(req.params.competition_id) }, select: { registration_workflow: true } });
      if (c?.registration_workflow === "MANUAL_ROSTER") return res.status(409).json({ success: false, message: "Use the competition settings wizard. Tournament setup follows participant finalization." });
      next();
    } catch (error) { next(error); }
  },
  updateCompetitionValidation,
  handleValidationErrors,
  updateCompetition
);

export default router;
