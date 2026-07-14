import { db } from "../config/firebase.js";
import { docToObject, snapshotToArray } from "../utils/firestore.js";

const walletsCol = db.collection("wallets");
const transactionsCol = db.collection("transactions");
const notificationsCol = db.collection("notifications");

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

  const walletRef = walletsCol.doc(walletId);
  const txnRef = transactionsCol.doc();
  const now = new Date().toISOString();

  const result = await db.runTransaction(async (t) => {
    const walletSnap = await t.get(walletRef);
    if (!walletSnap.exists || walletSnap.data().userId !== req.userId) {
      throw Object.assign(new Error("Wallet not found"), { status: 404 });
    }
    const wallet = docToObject(walletSnap);
    if (Number(wallet.balance) < amt) {
      throw Object.assign(
        new Error(`Insufficient balance in ${wallet.name}. Top it up from your Main Wallet first.`),
        { status: 400 }
      );
    }

    const newBalance = Number(wallet.balance) - amt;
    t.update(walletRef, { balance: newBalance });

    const txnData = {
      userId: req.userId,
      type: paymentType,
      fromWalletId: walletId,
      amount: amt,
      merchantName: merchantName || "Merchant",
      note: note || null,
      status: "success",
      createdAt: now,
    };
    t.set(txnRef, txnData);

    return { wallet: { ...wallet, balance: newBalance }, txn: { id: txnRef.id, ...txnData } };
  });

  await notificationsCol.doc().set({
    userId: req.userId,
    title: TYPE_LABEL[paymentType],
    message: `₹${amt.toFixed(2)} paid to ${merchantName || "merchant"} from ${result.wallet.name}.`,
    type: "payment",
    isRead: false,
    createdAt: now,
  });

  res.json(result);
}

export async function listTransactions(req, res) {
  const { walletId, limit } = req.query;

  const snap = await transactionsCol.where("userId", "==", req.userId).get();
  let transactions = snapshotToArray(snap);

  if (walletId) {
    transactions = transactions.filter((t) => t.fromWalletId === walletId || t.toWalletId === walletId);
  }

  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  transactions = transactions.slice(0, limit ? Number(limit) : 100);

  res.json({ transactions });
}
