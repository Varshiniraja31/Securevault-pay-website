import { useState } from "react";
import Modal from "../Modal";
import Input, { Field } from "../Input";
import Button from "../Button";
import { topUpMainWallet } from "../../api/wallets";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

export default function AddMoneyModal({ open, onClose }) {
  const { refreshWallets, refreshTransactions } = useData();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await topUpMainWallet({ amount: Number(amount) });
      await Promise.all([refreshWallets(), refreshTransactions()]);
      toast.success(`₹${amount} added to your Main Wallet`);
      setAmount("");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Money to Main Wallet">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Amount">
          <Input
            type="number"
            min="1"
            step="0.01"
            required
            prefix="₹"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              type="button"
              key={amt}
              onClick={() => setAmount(String(amt))}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-brand-500"
            >
              +₹{amt}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Add Money
        </Button>
        <p className="text-center text-xs text-gray-400">
          Simulated top-up for demo purposes. No real bank account is charged.
        </p>
      </form>
    </Modal>
  );
}
