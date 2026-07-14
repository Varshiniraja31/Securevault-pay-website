import { api } from "./client";

export const fetchNotifications = () =>
  api.get("/notifications").then((r) => r.data.notifications);
export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data.notification);
export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all").then((r) => r.data);
