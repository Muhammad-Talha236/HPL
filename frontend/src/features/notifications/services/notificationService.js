import apiClient from "../../../services/apiClient";

export const getNotifications = (params) => apiClient.get("/notifications", { params });
export const markNotificationRead = (notificationId) => apiClient.patch(`/notifications/${notificationId}/read`);
export const markAllNotificationsRead = () => apiClient.patch("/notifications/read-all");
export const deleteNotification = (notificationId) => apiClient.delete(`/notifications/${notificationId}`);
