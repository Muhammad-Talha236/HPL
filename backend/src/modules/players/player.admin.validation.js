import { body, checkExact, param } from "express-validator";

const safeImageUrl = (value) => {
  if (value.startsWith("/uploads/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
};

export const adminPlayerUpdateValidation = [
  param("player_id").isInt({ min: 1 }).withMessage("Player ID must be valid"),
  body("name").optional().isString().trim().isLength({ min: 2, max: 100 }),
  body("profile_photo").optional({ nullable: true }).isString().trim().isLength({ max: 500 }).custom(safeImageUrl).withMessage("Profile photo must be an HTTPS URL or an /uploads/ path"),
  body("date_of_birth").optional().isISO8601({ strict: true }),
  body("gender").optional().isIn(["MALE", "FEMALE"]),
  body("position").optional({ nullable: true }).isString().trim().isLength({ max: 50 }),
  body("phone").optional({ nullable: true }).isString().trim().isLength({ max: 30 }),
  body("nationality").optional({ nullable: true }).isString().trim().isLength({ max: 80 }),
  body("height_cm").optional({ nullable: true }).isInt({ min: 100, max: 260 }),
  body("weight_kg").optional({ nullable: true }).isInt({ min: 25, max: 250 }),
  body("preferred_foot").optional({ nullable: true }).isIn(["LEFT", "RIGHT", "BOTH"]),
  body("bio").optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];

export const adminPlayerStatusValidation = [
  param("player_id").isInt({ min: 1 }).withMessage("Player ID must be valid"),
  body("reason").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];
