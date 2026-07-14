import { sequelize, Wallet, Transaction, Notification } from "../models/index.js";
import { WALLET_CATEGORIES } from "../utils/categories.js";

export async function listWallets(req, res) {
  const wallets = await Wallet.findAll({
    where: { userId: req.userId },
    order: [["type", "DESC"], ["createdAt", "ASC"]],
  });
  res.json({ wallets });
}

export async function createWallet(req, res) {
  const { name, category, budget } = req.body;
  if (!name) return res.status(400).json({ message: "Wallet name is required" });

  const meta = WALLET_CATEGORIES[category] || WALLET_CATEGORIES.custom;

  const wallet = await Wallet.create({
    userId: req.userId,
    type: "purpose",
    name,
    category: category || "custom",
    balance: 0,
    budget: budget ? Number(budget) : null,
    color: meta.color,
    icon: meta.icon,
  });

  res.status(201).json({ wallet });
}

export async function deleteWallet(req, res) {
  const wallet = await Wallet.findOne({ where: { id: req.params.id, userId: req.userId } });
  if (!wallet) return res.status(404).json({ message: "Wallet not found" });
  if (wallet.type === "main") {
    return res.status(400).json({ message: "The Main Wallet cannot be deleted" });
  }
  if (Number(wallet.balance) > 0) {
    return res.status(400).json({ message: "Move remaining funds out before deleting this wallet" });
  }
  await wallet.destroy();
  res.json({ message: "Wallet deleted" });
}

// Move money between two wallets belonging to the same user (Main -> purpose, purpose -> Main, or purpose -> purpose)
export async function transferBetweenWallets(req, res) {
  const { fromWalletId, toWalletId, amount, note } = req.body;
  const amt = Number(amount);

  if (!fromWalletId || !toWalletId || !amt || amt <= 0) {
    return res.status(400).json({ message: "fromWalletId, toWalletId, and a positive amount are required" });
  }
  if (fromWalletId === toWalletId) {
    return res.status(400).json({ message: "Source and destination wallets must be different" });
  }

  const result = await sequelize.transaction(async (t) => {
    const fromWallet = await Wallet.findOne({
      where: { id: fromWalletId, userId: req.userId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    const toWallet = await Wallet.findOne({
      where: { id: toWalletId, userId: req.userId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!fromWallet || !toWallet) {
      throw Object.assign(new Error("One or both wallets were not found"), { status: 404 });
    }
    if (Number(fromWallet.balance) < amt) {
      throw Object.assign(new Error("Insufficient balance in the source wallet"), { status: 400 });
    }

    fromWallet.balance = Number(fromWallet.balance) - amt;
    toWallet.balance = Number(toWallet.balance) + amt;
    await fromWallet.save({ transaction: t });
    await toWallet.save({ transaction: t });

    const txn = await Transaction.create(
      {
        userId: req.userId,
        type: "wallet_transfer",
        fromWalletId,
        toWalletId,
        amount: amt,
        note: note || null,
        status: "success",
      },
      { transaction: t }
    );

    return { fromWallet, toWallet, txn };
  });

  await Notification.create({
    userId: req.userId,
    title: "Wallet transfer complete",
    message: `₹${amt.toFixed(2)} moved from ${result.fromWallet.name} to ${result.toWallet.name}.`,
    type: "wallet",
  });

  res.json(result);
}

// Simulated top-up of the Main Wallet (e.g., from a bank account)
export async function topUpMainWallet(req, res) {
  const { amount, note } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: "A positive amount is required" });

  const wallet = await Wallet.findOne({ where: { userId: req.userId, type: "main" } });
  if (!wallet) return res.status(404).json({ message: "Main Wallet not found" });

  wallet.balance = Number(wallet.balance) + amt;
  await wallet.save();

  const txn = await Transaction.create({
    userId: req.userId,
    type: "topup",
    toWalletId: wallet.id,
    amount: amt,
    note: note || "Added money",
    status: "success",
  });

  await Notification.create({
    userId: req.userId,
    title: "Money added",
    message: `₹${amt.toFixed(2)} added to your Main Wallet.`,
    type: "wallet",
  });

  res.json({ wallet, txn });
}

// Simulated withdrawal from the Main Wallet (e.g., to a bank account)
export async function withdrawFromMainWallet(req, res) {
  const { amount, note } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: "A positive amount is required" });

  const wallet = await Wallet.findOne({ where: { userId: req.userId, type: "main" } });
  if (!wallet) return res.status(404).json({ message: "Main Wallet not found" });
  if (Number(wallet.balance) < amt) {
    return res.status(400).json({ message: "Insufficient balance in the Main Wallet" });
  }

  wallet.balance = Number(wallet.balance) - amt;
  await wallet.save();

  const txn = await Transaction.create({
    userId: req.userId,
    type: "withdrawal",
    fromWalletId: wallet.id,
    amount: amt,
    note: note || "Withdrawn to bank",
    status: "success",
  });

  await Notification.create({
    userId: req.userId,
    title: "Money withdrawn",
    message: `₹${amt.toFixed(2)} withdrawn from your Main Wallet.`,
    type: "wallet",
  });

  res.json({ wallet, txn });
}
