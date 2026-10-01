import express from "express";

import {
  createPayment,
  reviewPayment,
} from "./payment.controller.js";

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
  createPaymentValidation,
  reviewPaymentValidation,
} from "./payment.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

// ======================================================
// CREATE PAYMENT
// USER / TEAM OWNER / CLUB OWNER / SUPER ADMIN
// ======================================================

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.USER,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  createPaymentValidation,
  handleValidationErrors,
  createPayment
);

// ======================================================
// REVIEW PAYMENT
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:payment_id/review",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  reviewPaymentValidation,
  handleValidationErrors,
  reviewPayment
);

export default router;