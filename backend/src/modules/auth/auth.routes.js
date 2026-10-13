import { normalizeStoredEmail, isValidAccountEmail } from "../../utils/email.util.js";
import { forgotPassword, resetPassword } from "./passwordReset.controller.js";
import { body } from "express-validator";
import { passwordResetIpLimiter, passwordResetEmailLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import express from "express";
import { register, login, getMe, updateMyProfile, changeMyPassword, updateUserRole, verifyEmail, resendEmailVerification } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";

import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { loginRateLimiter, emailVerificationResendRateLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import {
  registerValidation,
  loginValidation,
  updateUserRoleValidation,
  updateMyProfileValidation,
  changeMyPasswordValidation,
} from "./auth.validation.js";
import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";

const router = express.Router();
router.use(["/forgot-password", "/reset-password"], (req, res, next) => { res.set("Cache-Control", "no-store"); res.set("Referrer-Policy", "no-referrer"); next(); });
router.post("/forgot-password", passwordResetIpLimiter, body("email").isString().bail().trim().isLength({ max: 254 }).custom(isValidAccountEmail).customSanitizer(normalizeStoredEmail), handleValidationErrors, passwordResetEmailLimiter, forgotPassword);
router.post("/reset-password", passwordResetIpLimiter, resetPassword);

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
router.post("/me/email-verification/resend", authenticate, emailVerificationResendRateLimiter, resendEmailVerification);

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
