import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";
import { docToObject } from "../utils/firestore.js";
import { signToken } from "../utils/jwt.js";

const AVATAR_COLORS = ["#6C5CE7", "#3B82F6", "#22C55E", "#F59E0B", "#EC4899", "#14B8A6"];

const usersCol = db.collection("users");
const walletsCol = db.collection("wallets");
const notificationsCol = db.collection("notifications");

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
    twoFactorEnabled: user.twoFactorEnabled ?? true,
    pinEnabled: user.pinEnabled ?? false,
  };
}

export async function register(req, res) {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const normalizedEmail = email.toLowerCase();
  const existingSnap = await usersCol.where("email", "==", normalizedEmail).limit(1).get();
  if (!existingSnap.empty) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const now = new Date().toISOString();

  const userRef = usersCol.doc();
  const userData = {
    name,
    email: normalizedEmail,
    phone: phone || null,
    passwordHash,
    avatarColor,
    twoFactorEnabled: true,
    pinEnabled: false,
    pinHash: null,
    createdAt: now,
  };
  await userRef.set(userData);

  await walletsCol.doc().set({
    userId: userRef.id,
    type: "main",
    name: "Main Wallet",
    category: "main",
    balance: 0,
    budget: null,
    color: "#1E1B4B",
    icon: "shield",
    createdAt: now,
  });

  await notificationsCol.doc().set({
    userId: userRef.id,
    title: "Welcome to SecureVault Pay",
    message: "Your Main Wallet has been created. Add money to get started.",
    type: "system",
    isRead: false,
    createdAt: now,
  });

  const token = signToken({ userId: userRef.id });
  res.status(201).json({ token, user: publicUser({ id: userRef.id, ...userData }) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const snap = await usersCol.where("email", "==", email.toLowerCase()).limit(1).get();
  if (snap.empty) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const user = docToObject(snap.docs[0]);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id });
  res.json({ token, user: publicUser(user) });
}

export async function me(req, res) {
  const doc = await usersCol.doc(req.userId).get();
  if (!doc.exists) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(docToObject(doc)) });
}

export async function updateMe(req, res) {
  const { name, phone, twoFactorEnabled } = req.body;
  const ref = usersCol.doc(req.userId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ message: "User not found" });

  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone || null;
  if (typeof twoFactorEnabled === "boolean") updates.twoFactorEnabled = twoFactorEnabled;
  await ref.update(updates);

  const updated = await ref.get();
  res.json({ user: publicUser(docToObject(updated)) });
}

export async function setPin(req, res) {
  const { pin } = req.body;
  if (!/^\d{4,6}$/.test(pin || "")) {
    return res.status(400).json({ message: "PIN must be 4 to 6 digits" });
  }

  const ref = usersCol.doc(req.userId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ message: "User not found" });

  const pinHash = await bcrypt.hash(pin, 10);
  await ref.update({ pinHash, pinEnabled: true });

  const updated = await ref.get();
  res.json({ user: publicUser(docToObject(updated)) });
}

export async function verifyPinLogin(req, res) {
  const { userId, pin } = req.body;
  if (!userId || !pin) {
    return res.status(400).json({ message: "User and PIN are required" });
  }

  const doc = await usersCol.doc(userId).get();
  if (!doc.exists) return res.status(404).json({ message: "User not found" });
  const user = docToObject(doc);

  if (!user.pinEnabled || !user.pinHash) {
    return res.status(400).json({ message: "PIN lock is not enabled for this account" });
  }

  const valid = await bcrypt.compare(pin, user.pinHash);
  if (!valid) {
    return res.status(401).json({ message: "Incorrect PIN" });
  }

  res.json({ valid: true });
}

export async function disablePin(req, res) {
  const ref = usersCol.doc(req.userId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ message: "User not found" });

  await ref.update({ pinHash: null, pinEnabled: false });

  const updated = await ref.get();
  res.json({ user: publicUser(docToObject(updated)) });
}
