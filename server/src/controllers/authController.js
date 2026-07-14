import bcrypt from "bcryptjs";
import { User, Wallet, Notification } from "../models/index.js";
import { signToken } from "../utils/jwt.js";

const AVATAR_COLORS = ["#6C5CE7", "#3B82F6", "#22C55E", "#F59E0B", "#EC4899", "#14B8A6"];

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
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

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone: phone || null,
    passwordHash,
    avatarColor,
  });

  await Wallet.create({
    userId: user.id,
    type: "main",
    name: "Main Wallet",
    category: "main",
    balance: 0,
    color: "#1E1B4B",
    icon: "shield",
  });

  await Notification.create({
    userId: user.id,
    title: "Welcome to SecureVault Pay",
    message: "Your Main Wallet has been created. Add money to get started.",
    type: "system",
  });

  const token = signToken({ userId: user.id });
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id });
  res.json({ token, user: publicUser(user) });
}

export async function me(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(user) });
}

export async function updateMe(req, res) {
  const { name, phone, twoFactorEnabled } = req.body;
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone || null;
  if (typeof twoFactorEnabled === "boolean") user.twoFactorEnabled = twoFactorEnabled;
  await user.save();

  res.json({ user: publicUser(user) });
}

export async function setPin(req, res) {
  const { pin } = req.body;
  if (!/^\d{4,6}$/.test(pin || "")) {
    return res.status(400).json({ message: "PIN must be 4 to 6 digits" });
  }

  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.pinHash = await bcrypt.hash(pin, 10);
  user.pinEnabled = true;
  await user.save();

  res.json({ user: publicUser(user) });
}

export async function disablePin(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.pinHash = null;
  user.pinEnabled = false;
  await user.save();

  res.json({ user: publicUser(user) });
}
