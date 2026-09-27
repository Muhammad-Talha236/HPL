import express from "express";

import {
  createClub,
  getClubs,
  getClubById,
  updateClub,
  transferClubOwnership,
  deactivateClub,
  activateClub,
} from "./club.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";


import {
  clubIdValidation,
  createClubValidation,
  updateClubValidation,
  transferClubOwnershipValidation,
} from "./club.validation.js";

import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";



const router = express.Router();

// Public routes
router.get("/", getClubs);

router.get(
  "/:club_id",
  clubIdValidation,
  handleValidationErrors,
  getClubById
);

// Protected route
router.post(
  "/",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  createClubValidation,
  handleValidationErrors,
  createClub
);

router.patch(
  "/:club_id",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  updateClubValidation,
  handleValidationErrors,
  updateClub
);
router.patch(
  "/:club_id/owner",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  transferClubOwnershipValidation,
  handleValidationErrors,
  transferClubOwnership
);

router.patch(
  "/:club_id/deactivate",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  clubIdValidation,
  handleValidationErrors,
  deactivateClub
);

router.patch(
  "/:club_id/activate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  clubIdValidation,
  handleValidationErrors,
  activateClub
);

export default router;