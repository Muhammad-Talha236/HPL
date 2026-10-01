import express from "express";

import {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deactivateVenue,
  activateVenue,
} from "./venue.controller.js";

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
  venueIdValidation,
  createVenueValidation,
  updateVenueValidation,
} from "./venue.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

router.get(
  "/",
  getVenues
);

router.get(
  "/:venue_id",
  venueIdValidation,
  handleValidationErrors,
  getVenueById
);

// ======================================================
// SUPER ADMIN ONLY
// ======================================================

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  createVenueValidation,
  handleValidationErrors,
  createVenue
);

router.patch(
  "/:venue_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  updateVenueValidation,
  handleValidationErrors,
  updateVenue
);

router.patch(
  "/:venue_id/deactivate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  venueIdValidation,
  handleValidationErrors,
  deactivateVenue
);

router.patch(
  "/:venue_id/activate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  venueIdValidation,
  handleValidationErrors,
  activateVenue
);

export default router;