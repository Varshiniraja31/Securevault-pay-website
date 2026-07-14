import { ScheduledPayment, Wallet, Notification } from "../models/index.js";

export async function listScheduledPayments(req, res) {
  const scheduledPayments = await ScheduledPayment.findAll({
    where: { userId: req.userId },
    order: [["nextRunDate", "ASC"]],
  });
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

  const wallet = await Wallet.findOne({ where: { id: fromWalletId, userId: req.userId } });
  if (!wallet) return res.status(404).json({ message: "Source wallet not found" });

  const scheduledPayment = await ScheduledPayment.create({
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
  });

  await Notification.create({
    userId: req.userId,
    title: "Payment scheduled",
    message: `₹${amt.toFixed(2)} to ${payeeName} scheduled for ${nextRunDate}.`,
    type: "schedule",
  });

  res.status(201).json({ scheduledPayment });
}

export async function updateScheduledPayment(req, res) {
  const scheduledPayment = await ScheduledPayment.findOne({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!scheduledPayment) return res.status(404).json({ message: "Scheduled payment not found" });
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

  if (fromWalletId) {
    const wallet = await Wallet.findOne({ where: { id: fromWalletId, userId: req.userId } });
    if (!wallet) return res.status(404).json({ message: "Source wallet not found" });
    scheduledPayment.fromWalletId = fromWalletId;
  }
  if (payeeName) scheduledPayment.payeeName = payeeName;
  if (category) scheduledPayment.category = category;
  if (amount) {
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ message: "A positive amount is required" });
    scheduledPayment.amount = amt;
  }
  if (scheduleType) {
    if (scheduleType === "recurring" && !(frequency || scheduledPayment.frequency)) {
      return res.status(400).json({ message: "Frequency is required for recurring payments" });
    }
    scheduledPayment.scheduleType = scheduleType;
    scheduledPayment.frequency = scheduleType === "recurring" ? frequency || scheduledPayment.frequency : null;
  } else if (frequency) {
    scheduledPayment.frequency = frequency;
  }
  if (nextRunDate) scheduledPayment.nextRunDate = nextRunDate;
  if (endDate !== undefined) scheduledPayment.endDate = endDate || null;
  if (note !== undefined) scheduledPayment.note = note || null;

  await scheduledPayment.save();
  res.json({ scheduledPayment });
}

export async function updateScheduledPaymentStatus(req, res) {
  const { status } = req.body;
  if (!["active", "paused", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const scheduledPayment = await ScheduledPayment.findOne({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!scheduledPayment) return res.status(404).json({ message: "Scheduled payment not found" });
  if (scheduledPayment.status === "completed") {
    return res.status(400).json({ message: "This scheduled payment has already completed" });
  }

  scheduledPayment.status = status;
  await scheduledPayment.save();

  res.json({ scheduledPayment });
}

export async function deleteScheduledPayment(req, res) {
  const scheduledPayment = await ScheduledPayment.findOne({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!scheduledPayment) return res.status(404).json({ message: "Scheduled payment not found" });
  await scheduledPayment.destroy();
  res.json({ message: "Scheduled payment deleted" });
}
