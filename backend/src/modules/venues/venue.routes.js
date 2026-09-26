import express from "express";

import {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deactivateVenue,
  activateVenue,
} from "./venue.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// Public
router.get("/", getVenues);

router.get("/:venue_id", getVenueById);

// Super Admin only
router.post(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  createVenue
);

router.patch(
  "/:venue_id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateVenue
);

router.patch(
  "/:venue_id/deactivate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  deactivateVenue
);

router.patch(
  "/:venue_id/activate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  activateVenue
);

export default router;