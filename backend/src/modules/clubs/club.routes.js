import express from "express";

import { createClub } from "./club.controller.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// POST /api/clubs
router.post(
  "/",
  authenticate,
  authorize(ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  createClub
);

export default router;