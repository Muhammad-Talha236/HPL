import { isValidAccountEmail } from "../../utils/email.util.js";
import { body, param, query, checkExact } from "express-validator";
import { normalizePlayerInvitationEmail } from "../../utils/playerInvitationEmail.util.js";

const invitationStatuses = ["PENDING", "ACCEPTED_PENDING_PROFILE", "ACCEPTED", "DECLINED", "EXPIRED", "REVOKED"];

export const createPlayerInvitationValidation = [
  body("player_id").optional().isInt({ min: 1 }).withMessage("Player ID must be a positive integer").toInt(),
  body("team_id").isInt({ min: 1 }).withMessage("Team ID must be a positive integer").toInt(),
  body("invited_email").isString().bail().trim().custom(isValidAccountEmail).withMessage("Please provide a valid invitation email").customSanitizer(normalizePlayerInvitationEmail),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];

export const playerInvitationListValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50").toInt(),
  query("team_id").optional().isInt({ min: 1 }).withMessage("Team ID must be a positive integer").toInt(),
  query("player_id").optional().isInt({ min: 1 }).withMessage("Player ID must be a positive integer").toInt(),
  query("status").optional().isIn(invitationStatuses).withMessage("Invalid invitation status"),
  query("view").optional().isIn(["PENDING", "HISTORY"]).withMessage("Invalid invitation view"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];

export const playerInvitationIdValidation = [
  param("invitation_id").isInt({ min: 1 }).withMessage("Invitation ID must be a positive integer").toInt(),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];

export const registerPlayerInvitationAccountValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters").matches(/^[A-Za-z][A-Za-z\s'-]*$/).withMessage("Name must start with a letter and contain only letters, spaces, apostrophes, or hyphens"),
  body("password").isString().withMessage("Password must be a string").notEmpty().withMessage("Password is required"),
  body("confirm_password").isString().withMessage("Password confirmation must be a string").notEmpty().withMessage("Password confirmation is required").custom((value, { req }) => value === req.body.password).withMessage("Password and confirmation must match"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];
