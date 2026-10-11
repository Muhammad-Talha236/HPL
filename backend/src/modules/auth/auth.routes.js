import express from "express";
import { register, login, getMe, updateMyProfile, changeMyPassword, updateUserRole, verifyEmail, resendEmailVerification } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";

import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { loginRateLimiter, playerInvitationResendActorRateLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import {
  registerValidation,
  loginValidation,
  updateUserRoleValidation,
  updateMyProfileValidation,
  changeMyPasswordValidation,
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
router.get("/verify-email", verifyEmail);
router.post("/me/email-verification/resend", authenticate, playerInvitationResendActorRateLimiter, resendEmailVerification);

router.patch(
  "/me",
  authenticate,
  authorize(ROLES.USER),
  updateMyProfileValidation,
  handleValidationErrors,
  updateMyProfile,
);

router.patch(
  "/me/password",
  authenticate,
  authorize(ROLES.USER),
  changeMyPasswordValidation,
  handleValidationErrors,
  changeMyPassword,
);

router.patch(
  "/users/:user_id/role",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateUserRoleValidation,
  handleValidationErrors,
  updateUserRole,
);

export default router;
