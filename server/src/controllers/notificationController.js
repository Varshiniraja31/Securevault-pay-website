import { db } from "../config/firebase.js";
import { docToObject, snapshotToArray } from "../utils/firestore.js";

const notificationsCol = db.collection("notifications");

export async function listNotifications(req, res) {
  const snap = await notificationsCol.where("userId", "==", req.userId).get();
  const notifications = snapshotToArray(snap)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);
  res.json({ notifications });
}

export async function markNotificationRead(req, res) {
  const ref = notificationsCol.doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().userId !== req.userId) {
    return res.status(404).json({ message: "Notification not found" });
  }
  await ref.update({ isRead: true });
  const updated = await ref.get();
  res.json({ notification: docToObject(updated) });
}

export async function markAllNotificationsRead(req, res) {
  const snap = await notificationsCol.where("userId", "==", req.userId).where("isRead", "==", false).get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { isRead: true }));
  await batch.commit();
  res.json({ message: "All notifications marked as read" });
}
