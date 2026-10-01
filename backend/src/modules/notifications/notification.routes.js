import express from "express";

import {
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "./notification.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";

import {
  notificationIdValidation,
  notificationActionValidation,
} from "./notification.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

/*
  GET ALL NOTIFICATIONS

  Only authenticated users can access
  their own notifications.

  The controller automatically filters
  notifications using req.user.user_id.
*/
router.get(
  "/",
  authenticate,
  getNotifications
);

/*
  GET SINGLE NOTIFICATION

  The controller verifies that the
  notification belongs to the current user.
*/
router.get(
  "/:notification_id",
  authenticate,
  notificationIdValidation,
  handleValidationErrors,
  getNotificationById
);

/*
  MARK SINGLE NOTIFICATION AS READ
*/
router.patch(
  "/:notification_id/read",
  authenticate,
  notificationActionValidation,
  handleValidationErrors,
  markNotificationAsRead
);

/*
  MARK ALL CURRENT USER'S NOTIFICATIONS AS READ

  No notification ID is required.
*/
router.patch(
  "/read-all",
  authenticate,
  markAllNotificationsAsRead
);

/*
  DELETE SINGLE NOTIFICATION

  The controller ensures that only the
  notification owner can delete it.
*/
router.delete(
  "/:notification_id",
  authenticate,
  notificationActionValidation,
  handleValidationErrors,
  deleteNotification
);

export default router;