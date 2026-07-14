export const WALLET_CATEGORIES = {
  grocery: { label: "Grocery", icon: "shopping-cart", color: "#22C55E" },
  utility: { label: "Utility", icon: "zap", color: "#F59E0B" },
  shopping: { label: "Shopping", icon: "shopping-bag", color: "#EC4899" },
  travel: { label: "Travel", icon: "plane", color: "#3B82F6" },
  entertainment: { label: "Entertainment", icon: "film", color: "#8B5CF6" },
  savings: { label: "Savings", icon: "piggy-bank", color: "#14B8A6" },
  custom: { label: "Custom", icon: "wallet", color: "#6C5CE7" },
};

export const SCHEDULE_CATEGORIES = {
  rent: "Rent",
  utility: "Utility Bill",
  subscription: "Subscription",
  salary: "Salary",
  scholarship: "Scholarship",
  gift: "Gift",
  refund: "Refund",
  emi: "EMI",
  insurance: "Insurance Payout",
  bonus: "Festival Bonus",
  cashback: "Cashback",
  family: "Family Transfer",
  custom: "Custom",
};

export async function createNotification(Notification, { userId, title, message, type }) {
  return Notification.create({ userId, title, message, type });
}
