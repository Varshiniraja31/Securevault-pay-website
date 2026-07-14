import { ShieldCheck, TrendingUp } from "lucide-react";
import { formatCurrency, formatCurrencyShort as formatShort } from "../utils/format";

export default function TotalBalanceCard({ totalBalance, monthlyIncome, monthlySpent }) {
  const net = monthlyIncome - monthlySpent;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a0f0f] via-[#1a0d0d] to-black p-6 text-white shadow-xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-red-400/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-red-300">
          <ShieldCheck size={16} />
          Total Balance
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Secure
        </span>
      </div>

      <p className="relative mt-6 flex items-baseline gap-1 text-3xl font-bold tracking-tight sm:text-4xl">
        {formatCurrency(totalBalance).replace(/\.\d{2}$/, "")}
        <span className="text-lg font-semibold text-white/50">
          .{formatCurrency(totalBalance).split(".")[1]}
        </span>
      </p>

      {net !== 0 && (
        <p
          className={`relative mt-1 flex items-center gap-1 text-xs font-semibold ${
            net >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          <TrendingUp size={13} />
          {net >= 0 ? "+" : "-"}
          {formatShort(Math.abs(net))} this month
        </p>
      )}

      <div className="relative mt-5 flex items-center gap-6 border-t border-white/10 pt-4">
        <div>
          <p className="text-[11px] text-white/40">Income</p>
          <p className="text-sm font-bold text-emerald-400">{formatShort(monthlyIncome)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/40">Spent</p>
          <p className="text-sm font-bold text-white">{formatShort(monthlySpent)}</p>
        </div>
      </div>
    </div>
  );
}
