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

const router = express.Router();

// Public routes
router.get("/", getClubs);

router.get("/:club_id", getClubById);

// Protected route
router.post(
  "/",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  createClub
);

router.patch(
  "/:club_id",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  updateClub
);

router.patch(
  "/:club_id/owner",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  transferClubOwnership
);

router.patch(
  "/:club_id/deactivate",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  deactivateClub
);

router.patch(
  "/:club_id/activate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  activateClub
);

export default router;