import { sequelize, Wallet, Transaction, Notification } from "../models/index.js";

const TYPE_LABEL = {
  merchant_payment: "Merchant payment",
  qr_payment: "QR payment",
  bill_payment: "Bill payment",
};

export async function makePayment(req, res) {
  const { walletId, amount, merchantName, note, type } = req.body;
  const amt = Number(amount);
  const paymentType = ["merchant_payment", "qr_payment", "bill_payment"].includes(type)
    ? type
    : "merchant_payment";

  if (!walletId || !amt || amt <= 0) {
    return res.status(400).json({ message: "walletId and a positive amount are required" });
  }

  const result = await sequelize.transaction(async (t) => {
    const wallet = await Wallet.findOne({
      where: { id: walletId, userId: req.userId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!wallet) throw Object.assign(new Error("Wallet not found"), { status: 404 });
    if (Number(wallet.balance) < amt) {
      throw Object.assign(
        new Error(`Insufficient balance in ${wallet.name}. Top it up from your Main Wallet first.`),
        { status: 400 }
      );
    }

    wallet.balance = Number(wallet.balance) - amt;
    await wallet.save({ transaction: t });

    const txn = await Transaction.create(
      {
        userId: req.userId,
        type: paymentType,
        fromWalletId: walletId,
        amount: amt,
        merchantName: merchantName || "Merchant",
        note: note || null,
        status: "success",
      },
      { transaction: t }
    );

    return { wallet, txn };
  });

  await Notification.create({
    userId: req.userId,
    title: TYPE_LABEL[paymentType],
    message: `₹${amt.toFixed(2)} paid to ${merchantName || "merchant"} from ${result.wallet.name}.`,
    type: "payment",
  });

  res.json(result);
}

export async function listTransactions(req, res) {
  const { walletId, limit } = req.query;
  const where = { userId: req.userId };

  const { Op } = await import("sequelize");
  if (walletId) {
    where[Op.or] = [{ fromWalletId: walletId }, { toWalletId: walletId }];
  }

  const transactions = await Transaction.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: limit ? Number(limit) : 100,
  });

  res.json({ transactions });
}
