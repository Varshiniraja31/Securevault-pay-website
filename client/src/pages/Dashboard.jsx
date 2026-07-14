import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Send, QrCode, CalendarClock } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import TotalBalanceCard from "../components/TotalBalanceCard";
import TransactionRow from "../components/TransactionRow";
import EmptyState from "../components/EmptyState";
import AddMoneyModal from "../components/modals/AddMoneyModal";
import CreateWalletModal from "../components/modals/CreateWalletModal";
import TransferModal from "../components/modals/TransferModal";
import ScheduleFormModal from "../components/modals/ScheduleFormModal";
import { formatCurrency, formatDate } from "../utils/format";
import { scheduleMeta, SPEND_TRANSACTION_TYPES } from "../utils/categories";

const QUICK_ACTIONS = [
  { key: "addMoney", label: "Load Money", icon: Download, color: "#ef4444" },
  { key: "transfer", label: "Send Money", icon: Send, color: "#3b82f6" },
  { key: "pay", label: "QR Pay", icon: QrCode, color: "#a855f7" },
  { key: "schedule", label: "Schedule", icon: CalendarClock, color: "#22c55e" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { wallets, transactions, scheduledPayments } = useData();
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  const upcoming = scheduledPayments.filter((p) => p.status === "active").slice(0, 3);

  const { totalBalance, monthlyIncome, monthlySpent } = useMemo(() => {
    const now = new Date();
    const isThisMonth = (dateStr) => {
      const d = new Date(dateStr);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const total = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

    let income = 0;
    let spent = 0;
    for (const txn of transactions) {
      if (txn.status !== "success" || !isThisMonth(txn.createdAt)) continue;
      if (txn.type === "topup") income += Number(txn.amount);
      else if (SPEND_TRANSACTION_TYPES.includes(txn.type)) spent += Number(txn.amount);
    }

    return { totalBalance: total, monthlyIncome: income, monthlySpent: spent };
  }, [wallets, transactions]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-gray-500">{greeting()} 👋</p>
        <h2 className="text-2xl font-bold text-white">{user?.name?.split(" ")[0]}</h2>
      </div>

      <TotalBalanceCard
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlySpent={monthlySpent}
      />

      <div className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => (key === "pay" ? navigate("/pay/qr") : setModal(key))}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[#111111] py-4 transition hover:-translate-y-0.5 hover:border-white/20"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}22`, color }}
            >
              <Icon size={18} />
            </div>
            <span className="text-xs font-semibold text-gray-300">{label}</span>
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <CalendarClock size={16} className="text-red-500" />
            Upcoming Payments
          </h3>
          <Link to="/schedule" className="text-xs font-semibold text-brand-500">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Nothing scheduled"
            description="Set up rent, bills, or subscriptions to run automatically."
            action={
              <button
                onClick={() => setModal("schedule")}
                className="text-sm font-semibold text-brand-500"
              >
                + Schedule a payment
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-white/5">
            {upcoming.map((p) => {
              const meta = scheduleMeta(p.category);
              const Icon = meta.icon;
              return (
                <div key={p.id} className="flex items-center gap-3 py-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.payeeName}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.nextRunDate)}</p>
                  </div>
                  <p className="text-sm font-bold text-white">{formatCurrency(p.amount)}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
          <Link to="/history" className="text-xs font-semibold text-brand-500">
            See all
          </Link>
        </div>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.slice(0, 5).map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </section>

      <AddMoneyModal open={modal === "addMoney"} onClose={() => setModal(null)} />
      <CreateWalletModal open={modal === "wallet"} onClose={() => setModal(null)} />
      <TransferModal open={modal === "transfer"} onClose={() => setModal(null)} />
      <ScheduleFormModal open={modal === "schedule"} onClose={() => setModal(null)} />
    </div>
  );
}
