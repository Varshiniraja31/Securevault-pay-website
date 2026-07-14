import cron from "node-cron";
import { Op } from "sequelize";
import { sequelize, ScheduledPayment, Wallet, Transaction, Notification } from "../models/index.js";

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

  try {
    await sequelize.transaction(async (t) => {
      const wallet = await Wallet.findOne({
        where: { id: scheduledPayment.fromWalletId },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!wallet || Number(wallet.balance) < Number(scheduledPayment.amount)) {
        await Transaction.create(
          {
            userId: scheduledPayment.userId,
            type: "scheduled_payment",
            fromWalletId: scheduledPayment.fromWalletId,
            amount: scheduledPayment.amount,
            merchantName: scheduledPayment.payeeName,
            note: scheduledPayment.note,
            status: "failed",
          },
          { transaction: t }
        );
        await Notification.create(
          {
            userId: scheduledPayment.userId,
            title: "Scheduled payment failed",
            message: `₹${Number(scheduledPayment.amount).toFixed(2)} to ${scheduledPayment.payeeName} could not be processed due to insufficient balance.`,
            type: "schedule",
          },
          { transaction: t }
        );
        return;
      }

      wallet.balance = Number(wallet.balance) - Number(scheduledPayment.amount);
      await wallet.save({ transaction: t });

      await Transaction.create(
        {
          userId: scheduledPayment.userId,
          type: "scheduled_payment",
          fromWalletId: scheduledPayment.fromWalletId,
          amount: scheduledPayment.amount,
          merchantName: scheduledPayment.payeeName,
          note: scheduledPayment.note,
          status: "success",
        },
        { transaction: t }
      );

      await Notification.create(
        {
          userId: scheduledPayment.userId,
          title: "Scheduled payment sent",
          message: `₹${Number(scheduledPayment.amount).toFixed(2)} sent to ${scheduledPayment.payeeName}.`,
          type: "schedule",
        },
        { transaction: t }
      );
    });
  } finally {
    scheduledPayment.lastRunDate = today;

    if (scheduledPayment.scheduleType === "recurring") {
      const next = computeNextRunDate(scheduledPayment.nextRunDate, scheduledPayment.frequency);
      if (scheduledPayment.endDate && next > scheduledPayment.endDate) {
        scheduledPayment.status = "completed";
      } else {
        scheduledPayment.nextRunDate = next;
      }
    } else {
      scheduledPayment.status = "completed";
    }

    await scheduledPayment.save();
  }
}

export async function runDuePayments() {
  const today = todayDateOnly();
  const due = await ScheduledPayment.findAll({
    where: { status: "active", nextRunDate: { [Op.lte]: today } },
  });

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
