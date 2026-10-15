import { guardLegacyRegistration } from "./workflow.guard.js";
import * as workflow from "./workflow.controller.js";
import { rateLimit } from "express-rate-limit";
import express from "express";

import {
  getRegistrations,
  getRegistrationById,
  reviewRegistration,
} from "./registration.controller.js";
import { getAdminRegistration, getAdminRegistrations, getEligibleTeams, getMyRegistrations, updateRegistrationSquad } from "./registration.extra.controller.js";

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
  registrationIdValidation,
  reviewRegistrationValidation,
} from "./registration.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();
router.post("/submissions/:registration_id/release-name", authenticate, authorize(ROLES.SUPER_ADMIN), workflow.releaseName);
const submissionLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, keyGenerator: req => String(req.user.user_id), message: { success: false, message: "Too many registration requests. Please try again later." } });
const uploadLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false, keyGenerator: req => String(req.user.user_id), message: { success: false, message: "Too many uploads. Please try again later." } });
router.get("/submissions", authenticate, workflow.list);
router.post("/submissions", authenticate, submissionLimit, workflow.submit);
router.get("/submissions/:registration_id", authenticate, workflow.detail);
router.put("/submissions/:registration_id", authenticate, submissionLimit, workflow.resubmit);
router.post("/submissions/:registration_id/:kind", authenticate, authorize(ROLES.SUPER_ADMIN), (req, res, next) => ["review", "payment-review"].includes(req.params.kind) ? workflow.review(req, res) : next());
router.post("/:kind", authenticate, uploadLimit, (req, res, next) => ["receipt-upload", "image-upload"].includes(req.params.kind) ? workflow.upload(req, res) : next());
router.get("/receipts/:receipt_id", authenticate, workflow.download);


// ======================================================
// CREATE REGISTRATION
// ======================================================

router.post(
  "/",
  authenticate,
  authorize(
    ROLES.USER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  submissionLimit,
  workflow.submit
);

// ======================================================
// GET ALL REGISTRATIONS
// SUPER ADMIN ONLY
// ======================================================

router.get(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  getAdminRegistrations
);

// ======================================================
// REVIEW REGISTRATION
// SUPER ADMIN ONLY
// ======================================================

router.patch(
  "/:registration_id/review",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  reviewRegistrationValidation,
  handleValidationErrors,
  guardLegacyRegistration,
  reviewRegistration
);

// ======================================================
// GET REGISTRATION BY ID
// OWN REGISTRATION / OWN TEAM / OWN CLUB / SUPER ADMIN
// ======================================================

router.get(
  "/admin/:registration_id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  registrationIdValidation,
  handleValidationErrors,
  getAdminRegistration
);
router.get(
  "/my",
  authenticate,
  authorize(ROLES.USER, ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  getMyRegistrations
);
router.get(
  "/eligible-teams",
  authenticate,
  authorize(ROLES.USER, ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  getEligibleTeams
);
router.put(
  "/:registration_id/squad",
  authenticate,
  authorize(ROLES.USER, ROLES.CLUB_OWNER, ROLES.SUPER_ADMIN),
  registrationIdValidation,
  handleValidationErrors,

  guardLegacyRegistration,
  updateRegistrationSquad
);
router.get(
  "/:registration_id",
  authenticate,
  authorize(
    ROLES.USER,
    ROLES.CLUB_OWNER,
    ROLES.SUPER_ADMIN
  ),
  registrationIdValidation,
  handleValidationErrors,
  getRegistrationById
);

export default router;
