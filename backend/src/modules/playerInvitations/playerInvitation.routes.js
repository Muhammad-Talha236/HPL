import express from "express";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";
import { playerInvitationAcceptanceRateLimiter, playerInvitationResendActorRateLimiter, playerInvitationResendRateLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import { createPlayerInvitationValidation, playerInvitationIdValidation, playerInvitationListValidation, registerPlayerInvitationAccountValidation } from "./playerInvitation.validation.js";
import { acceptPlayerInvitation, createPlayerInvitation, getPlayerInvitations, previewPlayerInvitationAcceptance, registerPlayerInvitationAccount, resendPlayerInvitation, revokePlayerInvitation } from "./playerInvitation.controller.js";

const router = express.Router();
// Token routes must stay before the authenticated owner namespace so they can
// neither be shadowed nor inherit inviter-only authorization.
router.get("/accept/:token", playerInvitationAcceptanceRateLimiter, previewPlayerInvitationAcceptance);
router.post("/accept/:token/register", playerInvitationAcceptanceRateLimiter, registerPlayerInvitationAccountValidation, handleValidationErrors, registerPlayerInvitationAccount);
router.post("/accept/:token", authenticate, authorize(ROLES.USER), acceptPlayerInvitation);
router.use(authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER));
router.post("/", createPlayerInvitationValidation, handleValidationErrors, createPlayerInvitation);
router.get("/", playerInvitationListValidation, handleValidationErrors, getPlayerInvitations);
router.post("/:invitation_id/resend", playerInvitationResendActorRateLimiter, playerInvitationResendRateLimiter, playerInvitationIdValidation, handleValidationErrors, resendPlayerInvitation);
router.post("/:invitation_id/revoke", playerInvitationIdValidation, handleValidationErrors, revokePlayerInvitation);
export default router;
