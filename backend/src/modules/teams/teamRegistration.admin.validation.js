import { body, param, checkExact } from "express-validator";

export const teamRegistrationRequestIdValidation = [
  param("request_id").isInt({ min: 1 }).withMessage("Application ID must be valid"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];

export const teamRegistrationReviewValidation = [
  param("request_id").isInt({ min: 1 }).withMessage("Application ID must be valid"),
  body("reason").isString().trim().isLength({ min: 5, max: 1000 }).withMessage("A review reason between 5 and 1000 characters is required"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];
