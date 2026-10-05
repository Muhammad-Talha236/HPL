import {
  param,
  query,
  checkExact,
} from "express-validator";

export const notificationListValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50")
    .toInt(),

  query("status")
    .optional()
    .isIn(["ALL", "UNREAD", "READ"])
    .withMessage("Status must be ALL, UNREAD, or READ"),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  Validate notification ID from URL params.
*/
export const notificationIdValidation = [
  param("notification_id")
    .exists()
    .withMessage("Notification ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Notification ID must be a valid positive integer"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];

/*
  Validation for actions that only require
  notification_id.

  Currently used for:
  - Mark as read
  - Delete
*/
export const notificationActionValidation = [
  param("notification_id")
    .exists()
    .withMessage("Notification ID is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage(
      "Notification ID must be a valid positive integer"
    ),

  checkExact([], {
    message: "Unexpected fields are not allowed",
  }),
];
