import express from "express";

import {
  getStandings,
  getStandingById,
} from "./standing.controller.js";

import {
  competitionIdValidation,
  standingIdValidation,
} from "./standing.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

/*
  GET ALL STANDINGS FOR A COMPETITION

  Public endpoint.

  Example:
  GET /api/standings/competition/1
*/
router.get(
  "/competition/:competition_id",
  competitionIdValidation,
  handleValidationErrors,
  getStandings
);

/*
  GET SINGLE STANDING

  Public endpoint.

  Example:
  GET /api/standings/15
*/
router.get(
  "/:standing_id",
  standingIdValidation,
  handleValidationErrors,
  getStandingById
);

export default router;