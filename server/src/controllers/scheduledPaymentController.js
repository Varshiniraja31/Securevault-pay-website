import { db } from "../config/firebase.js";
import { docToObject, snapshotToArray } from "../utils/firestore.js";

const walletsCol = db.collection("wallets");
const scheduledPaymentsCol = db.collection("scheduledPayments");
const transactionsCol = db.collection("transactions");
const notificationsCol = db.collection("notifications");

// One-time scheduled payments reserve (deduct) their amount from the source wallet
// immediately, since there's no future date range to defer them across. Recurring
// payments can't be reserved up front (unknown number of future cycles), so they
// keep deducting per cycle at execution time instead.
async function reserveFunds({ userId, fromWalletId, amount, payeeName }) {
  const walletRef = walletsCol.doc(fromWalletId);
  const now = new Date().toISOString();

  await db.runTransaction(async (t) => {
    const walletSnap = await t.get(walletRef);
    if (!walletSnap.exists || walletSnap.data().userId !== userId) {
      throw Object.assign(new Error("Source wallet not found"), { status: 404 });
    }
    const wallet = docToObject(walletSnap);
    if (Number(wallet.balance) < amount) {
      throw Object.assign(new Error("Insufficient balance in the source wallet"), { status: 400 });
    }
    t.update(walletRef, { balance: Number(wallet.balance) - amount });
    t.set(transactionsCol.doc(), {
      userId,
      type: "schedule_reserve",
      fromWalletId,
      amount,
      merchantName: payeeName,
      note: `Reserved for scheduled payment to ${payeeName}`,
      status: "success",
      createdAt: now,
    });
  });
}

// Refunds a previously-reserved amount back to the user's Main Wallet.
async function refundToMainWallet({ userId, amount, payeeName }) {
  const mainSnap = await walletsCol.where("userId", "==", userId).where("type", "==", "main").limit(1).get();
  if (mainSnap.empty) throw Object.assign(new Error("Main Wallet not found"), { status: 404 });
  const mainRef = mainSnap.docs[0].ref;
  const now = new Date().toISOString();

  await db.runTransaction(async (t) => {
    const snap = await t.get(mainRef);
    const wallet = docToObject(snap);
    t.update(mainRef, { balance: Number(wallet.balance) + amount });
    t.set(transactionsCol.doc(), {
      userId,
      type: "schedule_refund",
      toWalletId: mainRef.id,
      amount,
      merchantName: payeeName,
      note: `Refund from cancelled scheduled payment to ${payeeName}`,
      status: "success",
      createdAt: now,
    });
  });
}

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
    payeePhone,
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

  const isOneTime = scheduleType !== "recurring";
  if (isOneTime) {
    await reserveFunds({ userId: req.userId, fromWalletId, amount: amt, payeeName });
  }

  const ref = scheduledPaymentsCol.doc();
  const now = new Date().toISOString();
  const data = {
    userId: req.userId,
    fromWalletId,
    payeeName,
    payeePhone: payeePhone || null,
    category: category || "custom",
    amount: amt,
    scheduleType: isOneTime ? "one-time" : "recurring",
    frequency: isOneTime ? null : frequency,
    nextRunDate,
    endDate: endDate || null,
    note: note || null,
    status: "active",
    lastRunDate: null,
    reserved: isOneTime,
    createdAt: now,
  };
  await ref.set(data);

  await notificationsCol.doc().set({
    userId: req.userId,
    title: "Payment scheduled",
    message: isOneTime
      ? `₹${amt.toFixed(2)} reserved and scheduled for ${payeeName} on ${nextRunDate}.`
      : `₹${amt.toFixed(2)} to ${payeeName} scheduled for ${nextRunDate}.`,
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
    payeePhone,
    category,
    amount,
    scheduleType,
    frequency,
    nextRunDate,
    endDate,
    note,
  } = req.body;

  const updates = {};

  const nextFromWalletId = fromWalletId || scheduledPayment.fromWalletId;
  if (fromWalletId) {
    const walletDoc = await walletsCol.doc(fromWalletId).get();
    if (!walletDoc.exists || walletDoc.data().userId !== req.userId) {
      return res.status(404).json({ message: "Source wallet not found" });
    }
    updates.fromWalletId = fromWalletId;
  }
  if (payeeName) updates.payeeName = payeeName;
  if (payeePhone !== undefined) updates.payeePhone = payeePhone || null;
  if (category) updates.category = category;

  const nextAmount = amount ? Number(amount) : Number(scheduledPayment.amount);
  if (amount) {
    if (!nextAmount || nextAmount <= 0) return res.status(400).json({ message: "A positive amount is required" });
    updates.amount = nextAmount;
  }

  let nextIsOneTime = scheduledPayment.scheduleType === "one-time";
  if (scheduleType) {
    const effectiveFrequency = frequency || scheduledPayment.frequency;
    if (scheduleType === "recurring" && !effectiveFrequency) {
      return res.status(400).json({ message: "Frequency is required for recurring payments" });
    }
    updates.scheduleType = scheduleType;
    updates.frequency = scheduleType === "recurring" ? effectiveFrequency : null;
    nextIsOneTime = scheduleType !== "recurring";
  } else if (frequency) {
    updates.frequency = frequency;
  }
  if (nextRunDate) updates.nextRunDate = nextRunDate;
  if (endDate !== undefined) updates.endDate = endDate || null;
  if (note !== undefined) updates.note = note || null;

  // If this payment's reservation status, source wallet, or amount changed, unwind the old
  // reservation (if any) and re-reserve under the new terms so wallet balances stay correct.
  const wasReserved = Boolean(scheduledPayment.reserved);
  const reservationChanged =
    nextIsOneTime !== wasReserved ||
    (wasReserved && (nextFromWalletId !== scheduledPayment.fromWalletId || nextAmount !== Number(scheduledPayment.amount)));

  if (reservationChanged) {
    if (wasReserved) {
      await refundToMainWallet({
        userId: req.userId,
        amount: Number(scheduledPayment.amount),
        payeeName: scheduledPayment.payeeName,
      });
    }
    if (nextIsOneTime) {
      await reserveFunds({
        userId: req.userId,
        fromWalletId: nextFromWalletId,
        amount: nextAmount,
        payeeName: payeeName || scheduledPayment.payeeName,
      });
    }
    updates.reserved = nextIsOneTime;
  }

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
  const scheduledPayment = docToObject(doc);
  if (scheduledPayment.status === "completed") {
    return res.status(400).json({ message: "This scheduled payment has already completed" });
  }

  const updates = { status };

  if (status === "cancelled" && scheduledPayment.reserved) {
    await refundToMainWallet({
      userId: req.userId,
      amount: Number(scheduledPayment.amount),
      payeeName: scheduledPayment.payeeName,
    });
    updates.reserved = false;
  }

  await ref.update(updates);
  const updated = await ref.get();
  res.json({ scheduledPayment: docToObject(updated) });
}

export async function deleteScheduledPayment(req, res) {
  const ref = scheduledPaymentsCol.doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().userId !== req.userId) {
    return res.status(404).json({ message: "Scheduled payment not found" });
  }
  const scheduledPayment = docToObject(doc);
  if (scheduledPayment.reserved && !["completed", "cancelled"].includes(scheduledPayment.status)) {
    await refundToMainWallet({
      userId: req.userId,
      amount: Number(scheduledPayment.amount),
      payeeName: scheduledPayment.payeeName,
    });
  }
  await ref.delete();
  res.json({ message: "Scheduled payment deleted" });
}
