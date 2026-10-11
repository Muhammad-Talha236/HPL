import { body, param, checkExact } from "express-validator";

const applicationFields = () => [
  body("name").isString().trim().isLength({ min: 2, max: 100 }).withMessage("Team name must be between 2 and 100 characters"),
  body("gender").isIn(["MEN", "WOMEN"]).withMessage("Gender must be MEN or WOMEN"),
  body("team_type").isString().trim().isLength({ min: 1, max: 50 }).withMessage("Team type is required"),
  body("home_venue_id").isInt({ min: 1 }).withMessage("Select a valid home venue"),
  body("contact_phone").isString().trim().isLength({ min: 7, max: 30 }).withMessage("A valid owner contact phone is required"),
  body("declaration_accepted").equals("true").withMessage("You must accept the HPL registration declaration").toBoolean(),
  body("logo").optional({ nullable: true }).isString().trim().isLength({ max: 500 }), body("region").optional({ nullable: true }).isString().trim().isLength({ max: 100 }), body("district").optional({ nullable: true }).isString().trim().isLength({ max: 100 }), body("city").optional({ nullable: true }).isString().trim().isLength({ max: 100 }), body("description").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
];

export const independentTeamApplicationValidation = [...applicationFields(), checkExact([], { message: "Unexpected fields are not allowed" })];
export const independentTeamApplicationIdValidation = [param("request_id").isInt({ min: 1 }).withMessage("Application ID must be valid"), checkExact([], { message: "Unexpected fields are not allowed" })];
export const independentTeamApplicationResubmitValidation = [param("request_id").isInt({ min: 1 }).withMessage("Application ID must be valid"), ...applicationFields(), checkExact([], { message: "Unexpected fields are not allowed" })];
