import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { useData } from "../context/DataContext";
import { formatCurrency, formatCurrencyShort } from "../utils/format";
import { walletMeta, SPEND_TRANSACTION_TYPES } from "../utils/categories";

const RANGES = [
  { key: "1M", label: "1M", days: 30 },
  { key: "3M", label: "3M", days: 90 },
  { key: "6M", label: "6M", days: 180 },
  { key: "1Y", label: "1Y", days: 365 },
];

const SPENT_COLOR = "#ef4444";
const INCOME_COLOR = "#22c55e";

function pctChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function StatTile({ label, value, delta, deltaGood }) {
  const positive = delta >= 0;
  const good = deltaGood === undefined ? positive : deltaGood;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${good ? "text-emerald-400" : "text-amber-400"}`}>
        {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {positive ? "+" : ""}
        {delta.toFixed(0)}%
      </p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#181818] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrencyShort(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { transactions, wallets } = useData();
  const [range, setRange] = useState("6M");
  const rangeDays = RANGES.find((r) => r.key === range).days;

  const walletById = useMemo(() => {
    const map = {};
    wallets.forEach((w) => (map[w.id] = w));
    return map;
  }, [wallets]);

  const analytics = useMemo(() => {
    const now = new Date();
    const rangeStart = new Date(now.getTime() - rangeDays * 86400000);
    const prevStart = new Date(now.getTime() - 2 * rangeDays * 86400000);

    const current = [];
    const previous = [];
    for (const txn of transactions) {
      if (txn.status !== "success") continue;
      const d = new Date(txn.createdAt);
      if (d >= rangeStart) current.push(txn);
      else if (d >= prevStart) previous.push(txn);
    }

    const sumBy = (list, types) =>
      list.reduce((sum, t) => (types.includes(t.type) ? sum + Number(t.amount) : sum), 0);

    const spent = sumBy(current, SPEND_TRANSACTION_TYPES);
    const income = sumBy(current, ["topup"]);
    const spentPrev = sumBy(previous, SPEND_TRANSACTION_TYPES);
    const incomePrev = sumBy(previous, ["topup"]);

    const saved = income - spent;
    const savedPrev = incomePrev - spentPrev;
    const avgDaily = spent / rangeDays;
    const avgDailyPrev = spentPrev / rangeDays;

    // Time buckets: daily for 1M, monthly otherwise.
    const buckets = [];
    if (rangeDays <= 30) {
      for (let i = rangeDays - 1; i >= 0; i -= Math.ceil(rangeDays / 15)) {
        const start = new Date(now.getTime() - (i + Math.ceil(rangeDays / 15) - 1) * 86400000);
        const end = new Date(now.getTime() - i * 86400000 + 86400000);
        buckets.push({ label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), start, end });
      }
    } else {
      const months = Math.round(rangeDays / 30);
      for (let i = months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        buckets.push({ label: start.toLocaleDateString("en-IN", { month: "short" }), start, end });
      }
    }

    const series = buckets.map((b) => {
      let spending = 0;
      let incomeAmt = 0;
      for (const txn of current) {
        const d = new Date(txn.createdAt);
        if (d >= b.start && d < b.end) {
          if (SPEND_TRANSACTION_TYPES.includes(txn.type)) spending += Number(txn.amount);
          else if (txn.type === "topup") incomeAmt += Number(txn.amount);
        }
      }
      return { label: b.label, Spending: spending, Income: incomeAmt };
    });

    // Category breakdown — spend transactions grouped by the source wallet's category.
    const categoryTotals = {};
    for (const txn of current) {
      if (!SPEND_TRANSACTION_TYPES.includes(txn.type)) continue;
      const wallet = walletById[txn.fromWalletId];
      const category = wallet?.category || "custom";
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(txn.amount);
    }
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount, meta: walletMeta(category) }))
      .sort((a, b) => b.amount - a.amount);

    // Wallet-wise spending — purpose wallets only.
    const walletTotals = {};
    for (const txn of current) {
      if (!SPEND_TRANSACTION_TYPES.includes(txn.type)) continue;
      walletTotals[txn.fromWalletId] = (walletTotals[txn.fromWalletId] || 0) + Number(txn.amount);
    }
    const walletBreakdown = Object.entries(walletTotals)
      .map(([walletId, amount]) => ({ wallet: walletById[walletId], amount }))
      .filter((w) => w.wallet)
      .sort((a, b) => b.amount - a.amount);

    return {
      spent,
      income,
      saved,
      avgDaily,
      txnCount: current.length,
      spentDelta: pctChange(spent, spentPrev),
      savedDelta: pctChange(saved, savedPrev),
      avgDailyDelta: pctChange(avgDaily, avgDailyPrev),
      txnDelta: pctChange(current.length, previous.length),
      series,
      categoryBreakdown,
      walletBreakdown,
    };
  }, [transactions, walletById, rangeDays]);

  const maxWalletAmount = analytics.walletBreakdown[0]?.amount || 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <div className="flex gap-1 rounded-xl bg-[#111111] p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                range === r.key ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Total Spent" value={formatCurrencyShort(analytics.spent)} delta={analytics.spentDelta} deltaGood={false} />
        <StatTile label="Total Saved" value={formatCurrencyShort(analytics.saved)} delta={analytics.savedDelta} />
        <StatTile label="Avg Daily" value={formatCurrencyShort(analytics.avgDaily)} delta={analytics.avgDailyDelta} deltaGood={false} />
        <StatTile label="Transactions" value={analytics.txnCount} delta={analytics.txnDelta} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Spending vs Income</h3>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SPENT_COLOR }} />
              Spending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: INCOME_COLOR }} />
              Income
            </span>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.series} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2a" vertical={false} />
              <XAxis dataKey="label" stroke="#898781" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#898781"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrencyShort(v)}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="Spending" stroke={SPENT_COLOR} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Income" stroke={INCOME_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <h3 className="mb-4 text-sm font-bold text-white">Category Breakdown</h3>
        {analytics.categoryBreakdown.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No spending in this period yet.</p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="#111111"
                    strokeWidth={2}
                  >
                    {analytics.categoryBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={entry.meta.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-white/10 bg-[#181818] px-3 py-2 text-xs shadow-xl">
                          <p style={{ color: payload[0].payload.meta.color }} className="font-semibold">
                            {payload[0].payload.meta.label}: {formatCurrency(payload[0].value)}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {analytics.categoryBreakdown.map(({ category, amount, meta }) => (
                <div key={category} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="flex-1 text-gray-300">{meta.label}</span>
                  <span className="font-semibold text-white">{formatCurrencyShort(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <h3 className="mb-4 text-sm font-bold text-white">Wallet-wise Spending</h3>
        {analytics.walletBreakdown.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Receipt size={20} className="mb-2 text-gray-600" />
            <p className="text-sm text-gray-500">No wallet spending in this period yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.walletBreakdown.map(({ wallet, amount }) => (
              <div key={wallet.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-300">{wallet.name}</span>
                  <span className="font-semibold text-white">{formatCurrencyShort(amount)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(amount / maxWalletAmount) * 100}%`,
                      backgroundColor: wallet.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
