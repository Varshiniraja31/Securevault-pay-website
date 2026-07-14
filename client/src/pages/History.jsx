import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { fetchTransactions } from "../api/payments";
import { Select } from "../components/Input";
import TransactionRow from "../components/TransactionRow";
import EmptyState from "../components/EmptyState";
import { History as HistoryIcon } from "lucide-react";

export default function History() {
  const { wallets } = useData();
  const [walletId, setWalletId] = useState("");
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTransactions(walletId ? { walletId } : {})
      .then(setTxns)
      .finally(() => setLoading(false));
  }, [walletId]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">All wallet activity in one place.</p>
        <Select
          className="max-w-[200px]"
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
        >
          <option value="">All wallets</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        {!loading && txns.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="No transactions found" />
        ) : (
          <div className="divide-y divide-white/5">
            {txns.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} walletId={walletId || undefined} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
