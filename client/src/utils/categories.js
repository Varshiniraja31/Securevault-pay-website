import {
  ShoppingCart,
  Zap,
  ShoppingBag,
  Plane,
  Film,
  PiggyBank,
  Wallet,
  Shield,
  Building2,
  Repeat,
  ShieldCheck,
  GraduationCap,
  Gift,
  Undo2,
  CreditCard,
  PartyPopper,
  Banknote,
  Users,
  Receipt,
} from "lucide-react";

export const WALLET_CATEGORIES = {
  grocery: { label: "Grocery", icon: ShoppingCart, color: "#22C55E" },
  utility: { label: "Utility", icon: Zap, color: "#F59E0B" },
  shopping: { label: "Shopping", icon: ShoppingBag, color: "#EC4899" },
  travel: { label: "Travel", icon: Plane, color: "#3B82F6" },
  entertainment: { label: "Entertainment", icon: Film, color: "#8B5CF6" },
  savings: { label: "Savings", icon: PiggyBank, color: "#14B8A6" },
  custom: { label: "Custom", icon: Wallet, color: "#6C5CE7" },
  main: { label: "Main Wallet", icon: Shield, color: "#1E1B4B" },
};

export const SCHEDULE_CATEGORIES = {
  rent: { label: "Rent", icon: Building2, color: "#ef4444" },
  utility: { label: "Utility Bill", icon: Zap, color: "#f59e0b" },
  subscription: { label: "Subscription", icon: Repeat, color: "#8b5cf6" },
  salary: { label: "Salary", icon: Banknote, color: "#22c55e" },
  scholarship: { label: "Scholarship", icon: GraduationCap, color: "#3b82f6" },
  gift: { label: "Gift", icon: Gift, color: "#ec4899" },
  refund: { label: "Refund", icon: Undo2, color: "#14b8a6" },
  emi: { label: "EMI", icon: CreditCard, color: "#f97316" },
  insurance: { label: "Insurance Payout", icon: ShieldCheck, color: "#3b82f6" },
  bonus: { label: "Festival Bonus", icon: PartyPopper, color: "#f59e0b" },
  cashback: { label: "Cashback", icon: Receipt, color: "#22c55e" },
  family: { label: "Family Transfer", icon: Users, color: "#8b5cf6" },
  custom: { label: "Custom", icon: Wallet, color: "#6c5ce7" },
};

function titleCase(text) {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function walletIcon(category) {
  return walletMeta(category).icon;
}

// Any category string that isn't one of the built-in keys is treated as a
// user-typed custom label — shown as-is (title-cased) with the custom icon/color,
// rather than falling back to a generic "Custom" everywhere.
export function walletMeta(category) {
  const key = (category || "").toLowerCase();
  if (WALLET_CATEGORIES[key]) return WALLET_CATEGORIES[key];
  if (!category) return WALLET_CATEGORIES.custom;
  return { ...WALLET_CATEGORIES.custom, label: titleCase(category) };
}

export function scheduleMeta(category) {
  const key = (category || "").toLowerCase();
  if (SCHEDULE_CATEGORIES[key]) return SCHEDULE_CATEGORIES[key];
  if (!category) return SCHEDULE_CATEGORIES.custom;
  return { ...SCHEDULE_CATEGORIES.custom, label: titleCase(category) };
}

export const SPEND_TRANSACTION_TYPES = [
  "merchant_payment",
  "qr_payment",
  "bill_payment",
  "scheduled_payment",
];
