import { db } from "../config/firebase.js";
import { docToObject, snapshotToArray } from "../utils/firestore.js";
import { WALLET_CATEGORIES } from "../utils/categories.js";

const walletsCol = db.collection("wallets");
const transactionsCol = db.collection("transactions");
const notificationsCol = db.collection("notifications");

function sortWallets(wallets) {
  return wallets.sort((a, b) => {
    if (a.type !== b.type) return a.type === "main" ? -1 : 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

export async function listWallets(req, res) {
  const snap = await walletsCol.where("userId", "==", req.userId).get();
  res.json({ wallets: sortWallets(snapshotToArray(snap)) });
}

export async function createWallet(req, res) {
  const { name, category, budget } = req.body;
  if (!name) return res.status(400).json({ message: "Wallet name is required" });

  const meta = WALLET_CATEGORIES[category] || WALLET_CATEGORIES.custom;

  const ref = walletsCol.doc();
  const walletData = {
    userId: req.userId,
    type: "purpose",
    name,
    category: category || "custom",
    balance: 0,
    budget: budget ? Number(budget) : null,
    color: meta.color,
    icon: meta.icon,
    createdAt: new Date().toISOString(),
  };
  await ref.set(walletData);

  res.status(201).json({ wallet: { id: ref.id, ...walletData } });
}

export async function deleteWallet(req, res) {
  const ref = walletsCol.doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().userId !== req.userId) {
    return res.status(404).json({ message: "Wallet not found" });
  }
  const wallet = docToObject(doc);
  if (wallet.type === "main") {
    return res.status(400).json({ message: "The Main Wallet cannot be deleted" });
  }
  if (Number(wallet.balance) > 0) {
    return res.status(400).json({ message: "Move remaining funds out before deleting this wallet" });
  }
  await ref.delete();
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

  const fromRef = walletsCol.doc(fromWalletId);
  const toRef = walletsCol.doc(toWalletId);
  const txnRef = transactionsCol.doc();
  const now = new Date().toISOString();

  const result = await db.runTransaction(async (t) => {
    const [fromSnap, toSnap] = await Promise.all([t.get(fromRef), t.get(toRef)]);

    if (
      !fromSnap.exists ||
      !toSnap.exists ||
      fromSnap.data().userId !== req.userId ||
      toSnap.data().userId !== req.userId
    ) {
      throw Object.assign(new Error("One or both wallets were not found"), { status: 404 });
    }

    const fromWallet = docToObject(fromSnap);
    const toWallet = docToObject(toSnap);

    if (Number(fromWallet.balance) < amt) {
      throw Object.assign(new Error("Insufficient balance in the source wallet"), { status: 400 });
    }

    const newFromBalance = Number(fromWallet.balance) - amt;
    const newToBalance = Number(toWallet.balance) + amt;

    t.update(fromRef, { balance: newFromBalance });
    t.update(toRef, { balance: newToBalance });

    const txnData = {
      userId: req.userId,
      type: "wallet_transfer",
      fromWalletId,
      toWalletId,
      amount: amt,
      note: note || null,
      status: "success",
      createdAt: now,
    };
    t.set(txnRef, txnData);

    return {
      fromWallet: { ...fromWallet, balance: newFromBalance },
      toWallet: { ...toWallet, balance: newToBalance },
      txn: { id: txnRef.id, ...txnData },
    };
  });

  await notificationsCol.doc().set({
    userId: req.userId,
    title: "Wallet transfer complete",
    message: `₹${amt.toFixed(2)} moved from ${result.fromWallet.name} to ${result.toWallet.name}.`,
    type: "wallet",
    isRead: false,
    createdAt: now,
  });

  res.json(result);
}

// Simulated top-up of the Main Wallet (e.g., from a bank account)
export async function topUpMainWallet(req, res) {
  const { amount, note } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: "A positive amount is required" });

  const snap = await walletsCol.where("userId", "==", req.userId).where("type", "==", "main").limit(1).get();
  if (snap.empty) return res.status(404).json({ message: "Main Wallet not found" });

  const walletDoc = snap.docs[0];
  const wallet = docToObject(walletDoc);
  const newBalance = Number(wallet.balance) + amt;
  const now = new Date().toISOString();

  await walletDoc.ref.update({ balance: newBalance });

  const txnRef = transactionsCol.doc();
  const txnData = {
    userId: req.userId,
    type: "topup",
    toWalletId: walletDoc.id,
    amount: amt,
    note: note || "Added money",
    status: "success",
    createdAt: now,
  };
  await txnRef.set(txnData);

  await notificationsCol.doc().set({
    userId: req.userId,
    title: "Money added",
    message: `₹${amt.toFixed(2)} added to your Main Wallet.`,
    type: "wallet",
    isRead: false,
    createdAt: now,
  });

  res.json({ wallet: { ...wallet, balance: newBalance }, txn: { id: txnRef.id, ...txnData } });
}

// Simulated withdrawal from the Main Wallet (e.g., to a bank account)
export async function withdrawFromMainWallet(req, res) {
  const { amount, note } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ message: "A positive amount is required" });

  const snap = await walletsCol.where("userId", "==", req.userId).where("type", "==", "main").limit(1).get();
  if (snap.empty) return res.status(404).json({ message: "Main Wallet not found" });

  const walletDoc = snap.docs[0];
  const wallet = docToObject(walletDoc);
  if (Number(wallet.balance) < amt) {
    return res.status(400).json({ message: "Insufficient balance in the Main Wallet" });
  }
  const newBalance = Number(wallet.balance) - amt;
  const now = new Date().toISOString();

  await walletDoc.ref.update({ balance: newBalance });

  const txnRef = transactionsCol.doc();
  const txnData = {
    userId: req.userId,
    type: "withdrawal",
    fromWalletId: walletDoc.id,
    amount: amt,
    note: note || "Withdrawn to bank",
    status: "success",
    createdAt: now,
  };
  await txnRef.set(txnData);

  await notificationsCol.doc().set({
    userId: req.userId,
    title: "Money withdrawn",
    message: `₹${amt.toFixed(2)} withdrawn from your Main Wallet.`,
    type: "wallet",
    isRead: false,
    createdAt: now,
  });

  res.json({ wallet: { ...wallet, balance: newBalance }, txn: { id: txnRef.id, ...txnData } });
}
