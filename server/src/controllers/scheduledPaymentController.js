import { db } from "../config/firebase.js";
import { docToObject, snapshotToArray } from "../utils/firestore.js";

const walletsCol = db.collection("wallets");
const scheduledPaymentsCol = db.collection("scheduledPayments");
const notificationsCol = db.collection("notifications");

export async function listScheduledPayments(req, res) {
  const snap = await scheduledPaymentsCol.where("userId", "==", req.userId).get();
  const scheduledPayments = snapshotToArray(snap).sort(
    (a, b) => new Date(a.nextRunDate) - new Date(b.nextRunDate)
  );
  res.json({ scheduledPayments });
}

export async function createScheduledPayment(req, res) {
  const {
    fromWalletId,
    payeeName,
    category,
    amount,
    scheduleType,
    frequency,
    nextRunDate,
    endDate,
    note,
  } = req.body;

  const amt = Number(amount);
  if (!fromWalletId || !payeeName || !amt || amt <= 0 || !nextRunDate) {
    return res
      .status(400)
      .json({ message: "fromWalletId, payeeName, amount, and nextRunDate are required" });
  }
  if (scheduleType === "recurring" && !frequency) {
    return res.status(400).json({ message: "Frequency is required for recurring payments" });
  }

  const walletDoc = await walletsCol.doc(fromWalletId).get();
  if (!walletDoc.exists || walletDoc.data().userId !== req.userId) {
    return res.status(404).json({ message: "Source wallet not found" });
  }

  const ref = scheduledPaymentsCol.doc();
  const now = new Date().toISOString();
  const data = {
    userId: req.userId,
    fromWalletId,
    payeeName,
    category: category || "custom",
    amount: amt,
    scheduleType: scheduleType === "recurring" ? "recurring" : "one-time",
    frequency: scheduleType === "recurring" ? frequency : null,
    nextRunDate,
    endDate: endDate || null,
    note: note || null,
    status: "active",
    lastRunDate: null,
    createdAt: now,
  };
  await ref.set(data);

  await notificationsCol.doc().set({
    userId: req.userId,
    title: "Payment scheduled",
    message: `₹${amt.toFixed(2)} to ${payeeName} scheduled for ${nextRunDate}.`,
    type: "schedule",
    isRead: false,
    createdAt: now,
  });

  res.status(201).json({ scheduledPayment: { id: ref.id, ...data } });
}

export async function updateScheduledPayment(req, res) {
  const ref = scheduledPaymentsCol.doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().userId !== req.userId) {
    return res.status(404).json({ message: "Scheduled payment not found" });
  }
  const scheduledPayment = docToObject(doc);
  if (["completed", "cancelled"].includes(scheduledPayment.status)) {
    return res.status(400).json({ message: "This scheduled payment can no longer be edited" });
  }

  const {
    fromWalletId,
    payeeName,
    category,
    amount,
    scheduleType,
    frequency,
    nextRunDate,
    endDate,
    note,
  } = req.body;

  const updates = {};

  if (fromWalletId) {
    const walletDoc = await walletsCol.doc(fromWalletId).get();
    if (!walletDoc.exists || walletDoc.data().userId !== req.userId) {
      return res.status(404).json({ message: "Source wallet not found" });
    }
    updates.fromWalletId = fromWalletId;
  }
  if (payeeName) updates.payeeName = payeeName;
  if (category) updates.category = category;
  if (amount) {
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ message: "A positive amount is required" });
    updates.amount = amt;
  }
  if (scheduleType) {
    const effectiveFrequency = frequency || scheduledPayment.frequency;
    if (scheduleType === "recurring" && !effectiveFrequency) {
      return res.status(400).json({ message: "Frequency is required for recurring payments" });
    }
    updates.scheduleType = scheduleType;
    updates.frequency = scheduleType === "recurring" ? effectiveFrequency : null;
  } else if (frequency) {
    updates.frequency = frequency;
  }
  if (nextRunDate) updates.nextRunDate = nextRunDate;
  if (endDate !== undefined) updates.endDate = endDate || null;
  if (note !== undefined) updates.note = note || null;

  await ref.update(updates);
  const updated = await ref.get();
  res.json({ scheduledPayment: docToObject(updated) });
}

export async function updateScheduledPaymentStatus(req, res) {
  const { status } = req.body;
  if (!["active", "paused", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const ref = scheduledPaymentsCol.doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().userId !== req.userId) {
    return res.status(404).json({ message: "Scheduled payment not found" });
  }
  if (doc.data().status === "completed") {
    return res.status(400).json({ message: "This scheduled payment has already completed" });
  }

  await ref.update({ status });
  const updated = await ref.get();
  res.json({ scheduledPayment: docToObject(updated) });
}

export async function deleteScheduledPayment(req, res) {
  const ref = scheduledPaymentsCol.doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().userId !== req.userId) {
    return res.status(404).json({ message: "Scheduled payment not found" });
  }
  await ref.delete();
  res.json({ message: "Scheduled payment deleted" });
}
