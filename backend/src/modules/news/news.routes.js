import express from "express";

import {
  getNews,
  getNewsCategories,
  getNewsById,
  createNews,
  updateNews,
  publishNews,
  unpublishNews,
  deleteNews,
} from "./news.controller.js";

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
  newsIdValidation,
  createNewsValidation,
  updateNewsValidation,
  newsActionValidation,
} from "./news.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

/*
  GET ALL PUBLISHED NEWS

  Public endpoint.
*/
router.get(
  "/",
  getNews
);

router.get(
  "/categories",
  getNewsCategories
);

/*
  GET NEWS BY ID

  Public endpoint.

  This public route always queries only news
  that is PUBLISHED and has a publication date.
  Draft and unpublished records return 404.
*/
router.get(
  "/:news_id",
  newsIdValidation,
  handleValidationErrors,
  getNewsById
);

/*
  CREATE NEWS

  SUPER_ADMIN and CLUB_OWNER can create
  league news.

  The author_id is taken from req.user.
*/
router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER
  ),
  createNewsValidation,
  handleValidationErrors,
  createNews
);

/*
  UPDATE NEWS

  Allowed roles can reach the controller,
  while the controller verifies that the
  user actually owns the article or is
  SUPER_ADMIN.
*/
router.patch(
  "/:news_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER
  ),
  updateNewsValidation,
  handleValidationErrors,
  updateNews
);

/*
  PUBLISH NEWS

  SUPER_ADMIN / CLUB_OWNER

  Controller verifies actual ownership.
*/
router.patch(
  "/:news_id/publish",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER
  ),
  newsActionValidation,
  handleValidationErrors,
  publishNews
);

/*
  UNPUBLISH NEWS

  SUPER_ADMIN / CLUB_OWNER

  Controller verifies actual ownership.
*/
router.patch(
  "/:news_id/unpublish",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER
  ),
  newsActionValidation,
  handleValidationErrors,
  unpublishNews
);

/*
  DELETE NEWS

  ONLY SUPER_ADMIN.

  Permanent deletion is intentionally
  restricted to administrators.
*/
router.delete(
  "/:news_id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  newsActionValidation,
  handleValidationErrors,
  deleteNews
);

export default router;
