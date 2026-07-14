import { Shield, ChevronRight, Download, ArrowUpFromLine, ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format";
import { walletMeta } from "../utils/categories";

export function MainVaultCard({ wallet, onLoad, onWithdraw, onTransfer }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a0f0f] via-[#1a0d0d] to-black p-6 text-white shadow-xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-red-400/10 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-red-300">
          <Shield size={16} />
          Main Vault
        </div>
        <div className="text-right">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Secured
          </span>
          <p className="mt-1 text-[11px] text-white/40">2FA Active</p>
        </div>
      </div>

      <p className="relative mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        {formatCurrency(wallet?.balance ?? 0)}
      </p>
      <p className="relative mt-1 text-xs text-white/40">Available Balance</p>

      <div className="relative mt-5 grid grid-cols-3 gap-2">
        <button
          onClick={onLoad}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff5449] to-[#e2362b] py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(226,54,43,0.35)] transition hover:brightness-105"
        >
          <Download size={15} />
          Load
        </button>
        <button
          onClick={onWithdraw}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <ArrowUpFromLine size={15} />
          Withdraw
        </button>
        <button
          onClick={onTransfer}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <ArrowLeftRight size={15} />
          Transfer
        </button>
      </div>
    </div>
  );
}

export function PurposeWalletCard({ wallet }) {
  const meta = walletMeta(wallet.category);
  const Icon = meta.icon;
  const budget = Number(wallet.budget || 0);
  const balance = Number(wallet.balance || 0);
  const pct = budget > 0 ? Math.min(100, Math.round((balance / budget) * 100)) : null;

  return (
    <Link
      to={`/wallets/${wallet.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#111111] p-4 transition hover:-translate-y-0.5 hover:border-white/20"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${wallet.color}22`, color: wallet.color }}
        >
          <Icon size={20} />
        </div>
        <ChevronRight size={16} className="text-gray-600 transition group-hover:text-gray-400" />
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-gray-500">{wallet.name}</p>
        <p className="mt-0.5 text-lg font-bold text-white">{formatCurrency(wallet.balance)}</p>
      </div>
      {pct !== null && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: wallet.color }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500">
            {pct}% of ₹{Math.round(budget / 1000)}K budget
          </p>
        </div>
      )}
    </Link>
  );
}
