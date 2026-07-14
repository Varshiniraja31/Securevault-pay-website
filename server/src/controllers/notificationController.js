import { Notification } from "../models/index.js";

export async function listNotifications(req, res) {
  const notifications = await Notification.findAll({
    where: { userId: req.userId },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
  res.json({ notifications });
}

export async function markNotificationRead(req, res) {
  const notification = await Notification.findOne({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  notification.isRead = true;
  await notification.save();
  res.json({ notification });
}

export async function markAllNotificationsRead(req, res) {
  await Notification.update({ isRead: true }, { where: { userId: req.userId, isRead: false } });
  res.json({ message: "All notifications marked as read" });
}
