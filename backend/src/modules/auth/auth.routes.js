import express from "express";
import { register, login, getMe, updateUserRole } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";

import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { loginRateLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import {
  registerValidation,
  loginValidation,
  updateUserRoleValidation,
} from "./auth.validation.js";
import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();
// POST /api/auth/register
router.post("/register", registerValidation, handleValidationErrors, register);

router.post(
  "/login",
  loginRateLimiter,
  loginValidation,
  handleValidationErrors,
  login,
);

router.get("/me", authenticate, getMe);

router.patch(
  "/users/:user_id/role",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateUserRoleValidation,
  handleValidationErrors,
  updateUserRole,
);

export default router;
