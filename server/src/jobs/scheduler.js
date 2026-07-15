import cron from "node-cron";
import { db } from "../config/firebase.js";
import { docToObject, snapshotToArray } from "../utils/firestore.js";

const walletsCol = db.collection("wallets");
const transactionsCol = db.collection("transactions");
const notificationsCol = db.collection("notifications");
const scheduledPaymentsCol = db.collection("scheduledPayments");

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function computeNextRunDate(currentDate, frequency) {
  const date = new Date(`${currentDate}T00:00:00`);
  if (frequency === "daily") date.setDate(date.getDate() + 1);
  else if (frequency === "weekly") date.setDate(date.getDate() + 7);
  else if (frequency === "monthly") date.setMonth(date.getMonth() + 1);
  else if (frequency === "yearly") date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

async function executePayment(scheduledPayment) {
  const today = todayDateOnly();
  const now = new Date().toISOString();
  const walletRef = walletsCol.doc(scheduledPayment.fromWalletId);

  if (scheduledPayment.reserved) {
    // One-time payments already had their amount deducted (and held) when they were
    // scheduled — just record the completed transaction, no further balance change.
    await transactionsCol.doc().set({
      userId: scheduledPayment.userId,
      type: "scheduled_payment",
      fromWalletId: scheduledPayment.fromWalletId,
      amount: scheduledPayment.amount,
      merchantName: scheduledPayment.payeeName,
      note: scheduledPayment.note,
      status: "success",
      createdAt: now,
    });
    await notificationsCol.doc().set({
      userId: scheduledPayment.userId,
      title: "Scheduled payment sent",
      message: `₹${Number(scheduledPayment.amount).toFixed(2)} sent to ${scheduledPayment.payeeName}.`,
      type: "schedule",
      isRead: false,
      createdAt: now,
    });
  } else {
    await db.runTransaction(async (t) => {
      const walletSnap = await t.get(walletRef);
      const wallet = walletSnap.exists ? docToObject(walletSnap) : null;

      if (!wallet || Number(wallet.balance) < Number(scheduledPayment.amount)) {
        t.set(transactionsCol.doc(), {
          userId: scheduledPayment.userId,
          type: "scheduled_payment",
          fromWalletId: scheduledPayment.fromWalletId,
          amount: scheduledPayment.amount,
          merchantName: scheduledPayment.payeeName,
          note: scheduledPayment.note,
          status: "failed",
          createdAt: now,
        });
        t.set(notificationsCol.doc(), {
          userId: scheduledPayment.userId,
          title: "Scheduled payment failed",
          message: `₹${Number(scheduledPayment.amount).toFixed(2)} to ${scheduledPayment.payeeName} could not be processed due to insufficient balance.`,
          type: "schedule",
          isRead: false,
          createdAt: now,
        });
        return;
      }

      t.update(walletRef, { balance: Number(wallet.balance) - Number(scheduledPayment.amount) });

      t.set(transactionsCol.doc(), {
        userId: scheduledPayment.userId,
        type: "scheduled_payment",
        fromWalletId: scheduledPayment.fromWalletId,
        amount: scheduledPayment.amount,
        merchantName: scheduledPayment.payeeName,
        note: scheduledPayment.note,
        status: "success",
        createdAt: now,
      });

      t.set(notificationsCol.doc(), {
        userId: scheduledPayment.userId,
        title: "Scheduled payment sent",
        message: `₹${Number(scheduledPayment.amount).toFixed(2)} sent to ${scheduledPayment.payeeName}.`,
        type: "schedule",
        isRead: false,
        createdAt: now,
      });
    });
  }

  const updates = { lastRunDate: today };
  if (scheduledPayment.reserved) updates.reserved = false;

  if (scheduledPayment.scheduleType === "recurring") {
    const next = computeNextRunDate(scheduledPayment.nextRunDate, scheduledPayment.frequency);
    if (scheduledPayment.endDate && next > scheduledPayment.endDate) {
      updates.status = "completed";
    } else {
      updates.nextRunDate = next;
    }
  } else {
    updates.status = "completed";
  }

  await scheduledPaymentsCol.doc(scheduledPayment.id).update(updates);
}

export async function runDuePayments() {
  const today = todayDateOnly();
  // Fetch all active schedules (single equality filter avoids needing a composite
  // index for status + nextRunDate) and filter the date range in JS.
  const snap = await scheduledPaymentsCol.where("status", "==", "active").get();
  const due = snapshotToArray(snap).filter((p) => p.nextRunDate <= today);

  for (const payment of due) {
    await executePayment(payment);
  }

  return due.length;
}

export function startScheduler() {
  // Runs every minute so scheduled/recurring payments execute promptly once their date arrives.
  cron.schedule("* * * * *", () => {
    runDuePayments().catch((err) => console.error("Scheduler error:", err));
  });
}
