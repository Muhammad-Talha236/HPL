import { param, checkExact } from "express-validator";

export const teamVerificationRequestIdValidation = [
  param("request_id").isInt({ min: 1 }).withMessage("Application ID must be valid"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];
