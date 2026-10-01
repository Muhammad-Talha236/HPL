import {
  body,
  param,
  checkExact,
} from "express-validator";

/*
  Validate News ID
*/
export const newsIdValidation = [
  param("news_id")
    .exists()
    .withMessage("News ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "News ID must be a valid positive integer"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  CREATE NEWS

  author_id, status and published_at
  are controlled by the server.
*/
export const createNewsValidation = [
  body("title")
    .exists()
    .withMessage("Title is required")
    .bail()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage(
      "Title must be between 3 and 200 characters"
    ),

  body("content")
    .exists()
    .withMessage("Content is required")
    .bail()
    .isString()
    .withMessage("Content must be a string")
    .bail()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage(
      "Content must be between 10 and 10000 characters"
    ),

  body("featured_image")
    .optional({ nullable: true })
    .isString()
    .withMessage(
      "Featured image must be a string"
    )
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Featured image must not exceed 500 characters"
    ),

  body("category")
    .exists()
    .withMessage("Category is required")
    .bail()
    .isString()
    .withMessage("Category must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      "Category must be between 2 and 50 characters"
    ),

  /*
    Server-controlled fields
  */
  body("author_id")
    .not()
    .exists()
    .withMessage(
      "Author ID cannot be provided"
    ),

  body("status")
    .not()
    .exists()
    .withMessage(
      "Status cannot be provided"
    ),

  body("published_at")
    .not()
    .exists()
    .withMessage(
      "Published date cannot be provided"
    ),

  body("news_id")
    .not()
    .exists()
    .withMessage(
      "News ID cannot be provided"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  UPDATE NEWS

  Allowed:
  - title
  - content
  - featured_image
  - category

  Immutable/server-controlled:
  - author_id
  - status
  - published_at
  - news_id
*/
export const updateNewsValidation = [
  param("news_id")
    .exists()
    .withMessage("News ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "News ID must be a valid positive integer"
    ),

  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage(
      "Title must be between 3 and 200 characters"
    ),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string")
    .bail()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage(
      "Content must be between 10 and 10000 characters"
    ),

  body("featured_image")
    .optional({ nullable: true })
    .isString()
    .withMessage(
      "Featured image must be a string"
    )
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Featured image must not exceed 500 characters"
    ),

  body("category")
    .optional()
    .isString()
    .withMessage("Category must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      "Category must be between 2 and 50 characters"
    ),

  body("author_id")
    .not()
    .exists()
    .withMessage(
      "Author ID cannot be updated"
    ),

  body("status")
    .not()
    .exists()
    .withMessage(
      "Status cannot be updated directly"
    ),

  body("published_at")
    .not()
    .exists()
    .withMessage(
      "Published date cannot be updated directly"
    ),

  body("news_id")
    .not()
    .exists()
    .withMessage(
      "News ID cannot be provided in request body"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  PUBLISH / UNPUBLISH / DELETE

  These endpoints do not accept a request body.
*/
export const newsActionValidation = [
  param("news_id")
    .exists()
    .withMessage("News ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "News ID must be a valid positive integer"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];