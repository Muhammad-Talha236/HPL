import express from "express";
import {
  register,
  login,
  getMe,
  updateUserRole,
} from "./auth.controller.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";

import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);

router.patch(
  "/users/:user_id/role",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateUserRole
);


export default router;