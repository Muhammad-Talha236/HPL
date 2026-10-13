import express from "express";
import { param, checkExact } from "express-validator";
import { createPlayerValidation } from "../players/player.validation.js";
import { playerInvitationSendRateLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import { declinePlayerInvitation, getMyPlayerInvitations, completePlayerProfile, activateAcceptedInvitation, getMyPlayerProfile } from "./playerInvitation.controller.js";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { handleValidationErrors } from "../../middleware/auth/validation.middleware.js";
import { playerInvitationAcceptanceRateLimiter, playerInvitationResendActorRateLimiter, playerInvitationResendRateLimiter } from "../../middleware/auth/rateLimit.middleware.js";
import { createPlayerInvitationValidation, playerInvitationIdValidation, playerInvitationListValidation, registerPlayerInvitationAccountValidation } from "./playerInvitation.validation.js";
import { acceptPlayerInvitation, createPlayerInvitation, getPlayerInvitations, previewPlayerInvitationAcceptance, registerPlayerInvitationAccount, resendPlayerInvitation, revokePlayerInvitation } from "./playerInvitation.controller.js";

const router = express.Router();
router.use((req, res, next) => { res.set("Cache-Control", "no-store"); res.set("Referrer-Policy", "no-referrer"); next(); });
router.get("/me/profile", authenticate, getMyPlayerProfile);
router.put("/me/profile", authenticate, playerInvitationAcceptanceRateLimiter, createPlayerValidation, handleValidationErrors, completePlayerProfile);
router.post("/me/invitations/:invitation_id/activate", authenticate, playerInvitationAcceptanceRateLimiter, param("invitation_id").isInt({ min: 1 }).toInt(), checkExact([], { message: "Unexpected fields are not allowed" }), handleValidationErrors, activateAcceptedInvitation);
router.get("/me/invitations", authenticate, getMyPlayerInvitations);
router.post("/me/invitations/:invitation_id/profile", authenticate, playerInvitationAcceptanceRateLimiter, param("invitation_id").isInt({ min: 1 }).toInt(), createPlayerValidation, handleValidationErrors, completePlayerProfile);
router.post("/accept/:token/decline", playerInvitationAcceptanceRateLimiter, param("token").isString(), checkExact([], { message: "Unexpected fields are not allowed" }), handleValidationErrors, declinePlayerInvitation);

// Token routes must stay before the authenticated owner namespace so they can
// neither be shadowed nor inherit inviter-only authorization.
router.get("/accept/:token", playerInvitationAcceptanceRateLimiter, previewPlayerInvitationAcceptance);
router.post("/accept/:token/register", playerInvitationAcceptanceRateLimiter, registerPlayerInvitationAccountValidation, handleValidationErrors, registerPlayerInvitationAccount);
router.post("/accept/:token", authenticate, playerInvitationAcceptanceRateLimiter, param("token").isString(), checkExact([], { message: "Unexpected fields are not allowed" }), handleValidationErrors, acceptPlayerInvitation);
router.use(authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.CLUB_OWNER, ROLES.TEAM_OWNER));
router.post("/", playerInvitationSendRateLimiter, createPlayerInvitationValidation, handleValidationErrors, createPlayerInvitation);
router.get("/", playerInvitationListValidation, handleValidationErrors, getPlayerInvitations);
router.post("/:invitation_id/resend", playerInvitationResendActorRateLimiter, playerInvitationResendRateLimiter, playerInvitationIdValidation, handleValidationErrors, resendPlayerInvitation);
router.post("/:invitation_id/revoke", playerInvitationIdValidation, handleValidationErrors, revokePlayerInvitation);
export default router;
