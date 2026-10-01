import prisma from "../../database/prisma.js";

/*
  Safe fields returned to the client.

  user_id is intentionally not exposed unnecessarily.
*/
const notificationSelect = {
  notification_id: true,
  title: true,
  message: true,
  notification_type: true,
  reference_type: true,
  reference_id: true,
  is_read: true,
  created_at: true,
};

/*
  GET ALL NOTIFICATIONS FOR CURRENT USER

  A user can only see notifications where
  user_id matches req.user.user_id.
*/
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const notifications = await prisma.notification.findMany({
      where: {
        user_id: userId,
      },
      select: notificationSelect,
      orderBy: {
        created_at: "desc",
      },
    });

    const unreadCount = notifications.filter(
      (notification) => !notification.is_read
    ).length;

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unread_count: unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    next(error);
  }
};

/*
  GET SINGLE NOTIFICATION

  IDOR protection:
  The notification must belong to the
  currently authenticated user.
*/
export const getNotificationById = async (
  req,
  res,
  next
) => {
  try {
    const notificationId = Number(
      req.params.notification_id
    );

    const notification =
      await prisma.notification.findFirst({
        where: {
          notification_id: notificationId,
          user_id: req.user.user_id,
        },
        select: notificationSelect,
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(
      "Get notification by ID error:",
      error
    );

    next(error);
  }
};

/*
  MARK NOTIFICATION AS READ

  Only the owner of the notification can
  mark it as read.

  updateMany is used with user_id in the
  WHERE condition to prevent IDOR and
  avoid updating another user's notification.
*/
export const markNotificationAsRead = async (
  req,
  res,
  next
) => {
  try {
    const notificationId = Number(
      req.params.notification_id
    );

    const result = await prisma.notification.updateMany({
      where: {
        notification_id: notificationId,
        user_id: req.user.user_id,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    if (result.count === 0) {
      const notification =
        await prisma.notification.findFirst({
          where: {
            notification_id: notificationId,
            user_id: req.user.user_id,
          },
          select: {
            notification_id: true,
            is_read: true,
          },
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Notification is already marked as read",
      });
    }

    const updatedNotification =
      await prisma.notification.findFirst({
        where: {
          notification_id: notificationId,
          user_id: req.user.user_id,
        },
        select: notificationSelect,
      });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    next(error);
  }
};

/*
  MARK ALL NOTIFICATIONS AS READ

  Only the current user's notifications
  are affected.
*/
export const markAllNotificationsAsRead = async (
  req,
  res,
  next
) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        user_id: req.user.user_id,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updated_count: result.count,
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

    next(error);
  }
};

/*
  DELETE NOTIFICATION

  Users can delete only their own notifications.
*/
export const deleteNotification = async (
  req,
  res,
  next
) => {
  try {
    const notificationId = Number(
      req.params.notification_id
    );

    const result = await prisma.notification.deleteMany({
      where: {
        notification_id: notificationId,
        user_id: req.user.user_id,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete notification error:",
      error
    );

    next(error);
  }
};