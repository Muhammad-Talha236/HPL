import {
  body,
  param,
  checkExact,
} from "express-validator";

const profileDetailsValidation = [
  body("height_cm")
    .optional({ nullable: true })
    .isInt({ min: 100, max: 260 })
    .withMessage("Height must be between 100 and 260 cm"),
  body("weight_kg")
    .optional({ nullable: true })
    .isInt({ min: 25, max: 250 })
    .withMessage("Weight must be between 25 and 250 kg"),
  body("preferred_foot")
    .optional({ nullable: true })
    .isString()
    .bail()
    .trim()
    .isIn(["LEFT", "RIGHT", "BOTH"])
    .withMessage("Preferred foot must be LEFT, RIGHT, or BOTH"),
  body("bio")
    .optional({ nullable: true })
    .isString()
    .bail()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Bio is too long"),
];

const isSafeImageUrl = (value) => {
  if (value.startsWith("/uploads/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
};

// ======================================================
// PLAYER ID VALIDATION
// ======================================================

export const playerIdValidation = [
  param("player_id")
    .exists()
    .withMessage(
      "Player ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Player ID must be a positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// CREATE PLAYER VALIDATION
// ======================================================

export const createPlayerValidation = [

  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .exists()
    .withMessage(
      "Player name is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Player name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Player name is required"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Player name must be between 2 and 100 characters"
    ),

  // ----------------------------------------------------
  // PROFILE PHOTO
  // ----------------------------------------------------

  body("profile_photo")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Profile photo must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Profile photo is too long"
    )
    .bail()
    .custom(isSafeImageUrl)
    .withMessage("Profile photo must be an HTTPS URL or an /uploads/ path"),

  // ----------------------------------------------------
  // DATE OF BIRTH
  // ----------------------------------------------------

  body("date_of_birth")
    .exists()
    .withMessage(
      "Date of birth is required"
    )
    .bail()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Date of birth must be a valid date"
    )
    .bail()
    .custom((value) => {
      const date =
        new Date(value);

      const today =
        new Date();

      const minimumDate =
        new Date(
          "1900-01-01T00:00:00.000Z"
        );

      if (date > today) {
        throw new Error(
          "Date of birth cannot be in the future"
        );
      }

      if (date < minimumDate) {
        throw new Error(
          "Date of birth is not valid"
        );
      }

      return true;
    }),

  // ----------------------------------------------------
  // GENDER
  // ----------------------------------------------------

  body("gender")
    .exists()
    .withMessage(
      "Gender is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Gender must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Gender is required"
    )
    .bail()
    .isIn([
      "MALE",
      "FEMALE",
    ])
    .withMessage(
      "Gender must be MALE or FEMALE"
    ),

  // ----------------------------------------------------
  // POSITION
  // ----------------------------------------------------

  body("position")
    .exists()
    .withMessage(
      "Position is required"
    )
    .bail()
    .isString()
    .withMessage(
      "Position must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Position is required"
    )
    .bail()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Position is too long"
    ),

  // ----------------------------------------------------
  // PHONE
  // ----------------------------------------------------

  body("phone")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Phone number must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage(
      "Phone number is too long"
    ),

  // ----------------------------------------------------
  // NATIONALITY
  // ----------------------------------------------------

  body("nationality")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Nationality must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 60,
    })
    .withMessage(
      "Nationality is too long"
    ),

  ...profileDetailsValidation,

  // ----------------------------------------------------
  // BLOCK UNEXPECTED FIELDS
  // ----------------------------------------------------

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// UPDATE PLAYER VALIDATION
// ======================================================

export const updatePlayerValidation = [

  // ----------------------------------------------------
  // PLAYER ID
  // ----------------------------------------------------

  param("player_id")
    .exists()
    .withMessage(
      "Player ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Player ID must be a positive integer"
    ),

  // ----------------------------------------------------
  // NAME
  // ----------------------------------------------------

  body("name")
    .optional()
    .isString()
    .withMessage(
      "Player name must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Player name cannot be empty"
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Player name must be between 2 and 100 characters"
    ),

  // ----------------------------------------------------
  // PROFILE PHOTO
  // ----------------------------------------------------

  body("profile_photo")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Profile photo must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Profile photo is too long"
    )
    .bail()
    .custom(isSafeImageUrl)
    .withMessage("Profile photo must be an HTTPS URL or an /uploads/ path"),

  // ----------------------------------------------------
  // DATE OF BIRTH
  // ----------------------------------------------------

  body("date_of_birth")
    .optional()
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Date of birth must be a valid date"
    )
    .bail()
    .custom((value) => {
      const date =
        new Date(value);

      const today =
        new Date();

      const minimumDate =
        new Date(
          "1900-01-01T00:00:00.000Z"
        );

      if (date > today) {
        throw new Error(
          "Date of birth cannot be in the future"
        );
      }

      if (date < minimumDate) {
        throw new Error(
          "Date of birth is not valid"
        );
      }

      return true;
    }),

  // ----------------------------------------------------
  // GENDER
  // ----------------------------------------------------

  body("gender")
    .optional()
    .isString()
    .withMessage(
      "Gender must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Gender cannot be empty"
    )
    .bail()
    .isIn([
      "MALE",
      "FEMALE",
    ])
    .withMessage(
      "Gender must be MALE or FEMALE"
    ),

  // ----------------------------------------------------
  // POSITION
  // ----------------------------------------------------

  body("position")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Position must be a string"
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Position cannot be empty"
    )
    .bail()
    .isLength({
      max: 50,
    })
    .withMessage(
      "Position is too long"
    ),

  // ----------------------------------------------------
  // PHONE
  // ----------------------------------------------------

  body("phone")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Phone number must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 30,
    })
    .withMessage(
      "Phone number is too long"
    ),

  // ----------------------------------------------------
  // NATIONALITY
  // ----------------------------------------------------

  body("nationality")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Nationality must be a string"
    )
    .bail()
    .trim()
    .isLength({
      max: 60,
    })
    .withMessage(
      "Nationality is too long"
    ),

  ...profileDetailsValidation,

  // ----------------------------------------------------
  // BLOCK UNEXPECTED FIELDS
  // ----------------------------------------------------

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

// ======================================================
// ACTIVATE / DEACTIVATE VALIDATION
// ======================================================

export const playerStatusValidation = [
  param("player_id")
    .exists()
    .withMessage(
      "Player ID is required"
    )
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Player ID must be a positive integer"
    ),

  checkExact([], {
    message:
      "Unexpected fields are not allowed",
  }),
];

export const createPlayerAchievementValidation = [
  param("player_id").isInt({ min: 1 }).withMessage("Player ID must be a positive integer"),
  body("title").isString().bail().trim().isLength({ min: 2, max: 160 }).withMessage("Achievement title must be 2 to 160 characters"),
  body("achievement_type").isString().bail().trim().isLength({ min: 2, max: 60 }).withMessage("Achievement type must be 2 to 60 characters"),
  body("awarded_year").optional({ nullable: true }).isInt({ min: 1900, max: 2100 }).withMessage("Award year is invalid"),
  body("season_id").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Season ID must be a positive integer"),
  body("team_id").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Team ID must be a positive integer"),
  body("competition_id").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Competition ID must be a positive integer"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];

export const playerAchievementIdValidation = [
  param("player_id").isInt({ min: 1 }).withMessage("Player ID must be a positive integer"),
  param("achievement_id").isInt({ min: 1 }).withMessage("Achievement ID must be a positive integer"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];

export const addPlayerGalleryPhotoValidation = [
  param("player_id").isInt({ min: 1 }).withMessage("Player ID must be a positive integer"),
  body("image_url").isString().bail().trim().isLength({ min: 1, max: 500 }).bail().custom(isSafeImageUrl).withMessage("Image URL must be an HTTPS URL or an /uploads/ path"),
  body("caption").optional({ nullable: true }).isString().bail().trim().isLength({ max: 240 }).withMessage("Caption is too long"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];

export const playerGalleryPhotoIdValidation = [
  param("player_id").isInt({ min: 1 }).withMessage("Player ID must be a positive integer"),
  param("photo_id").isInt({ min: 1 }).withMessage("Photo ID must be a positive integer"),
  checkExact([], { message: "Unexpected fields are not allowed" }),
];
