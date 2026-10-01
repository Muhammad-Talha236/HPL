import {
  param,
  checkExact,
} from "express-validator";

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