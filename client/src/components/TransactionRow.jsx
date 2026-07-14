import {
  ArrowDownLeft,
  ArrowLeftRight,
  ScanLine,
  Zap,
  ShoppingBag,
  CalendarClock,
  Wallet,
} from "lucide-react";
import { formatCurrency, timeAgo } from "../utils/format";
import { useData } from "../context/DataContext";

const TYPE_META = {
  topup: { label: "Added Money", icon: Wallet, positive: true, color: "#22c55e" },
  wallet_transfer: { label: "Wallet Transfer", icon: ArrowLeftRight, positive: false, color: "#3b82f6" },
  merchant_payment: { label: "Merchant Payment", icon: ShoppingBag, positive: false, color: "#a855f7" },
  qr_payment: { label: "QR Payment", icon: ScanLine, positive: false, color: "#3b82f6" },
  bill_payment: { label: "Bill Payment", icon: Zap, positive: false, color: "#f59e0b" },
  scheduled_payment: { label: "Scheduled Payment", icon: CalendarClock, positive: false, color: "#ef4444" },
  received: { label: "Received", icon: ArrowDownLeft, positive: true, color: "#22c55e" },
};

export default function TransactionRow({ txn, walletId }) {
  const { wallets } = useData();
  const meta = TYPE_META[txn.type] || TYPE_META.merchant_payment;
  const Icon = meta.icon;

  const walletName = (id) => wallets.find((w) => w.id === id)?.name || "Wallet";

  let subtitle = timeAgo(txn.createdAt);
  let isCredit = meta.positive;

  if (txn.type === "wallet_transfer") {
    if (walletId && txn.toWalletId === walletId) {
      subtitle = `From ${walletName(txn.fromWalletId)} · ${timeAgo(txn.createdAt)}`;
      isCredit = true;
    } else {
      subtitle = `To ${walletName(txn.toWalletId)} · ${timeAgo(txn.createdAt)}`;
      isCredit = false;
    }
  } else if (["merchant_payment", "qr_payment", "bill_payment", "scheduled_payment"].includes(txn.type)) {
    subtitle = `${txn.merchantName || "Merchant"} · ${timeAgo(txn.createdAt)}`;
  } else if (txn.type === "topup") {
    subtitle = `To ${walletName(txn.toWalletId)} · ${timeAgo(txn.createdAt)}`;
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={
          txn.status === "failed"
            ? { backgroundColor: "#ef444422", color: "#f87171" }
            : { backgroundColor: `${meta.color}22`, color: meta.color }
        }
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{meta.label}</p>
        <p className="truncate text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-bold ${
            txn.status === "failed"
              ? "text-gray-500 line-through"
              : isCredit
              ? "text-emerald-400"
              : "text-white"
          }`}
        >
          {isCredit ? "+" : "-"}
          {formatCurrency(txn.amount)}
        </p>
        {txn.status === "failed" && (
          <p className="text-[11px] font-medium text-rose-400">Failed</p>
        )}
      </div>
    </div>
  );
}
