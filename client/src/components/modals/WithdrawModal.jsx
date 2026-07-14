import { useState } from "react";
import Modal from "../Modal";
import Input, { Field } from "../Input";
import Button from "../Button";
import { withdrawFromMainWallet } from "../../api/wallets";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/format";

export default function WithdrawModal({ open, onClose }) {
  const { mainWallet, refreshWallets, refreshTransactions } = useData();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await withdrawFromMainWallet({ amount: Number(amount) });
      await Promise.all([refreshWallets(), refreshTransactions()]);
      toast.success(`₹${amount} withdrawn from your Main Vault`);
      setAmount("");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Withdraw from Main Vault">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Amount" hint={mainWallet ? `Available: ${formatCurrency(mainWallet.balance)}` : undefined}>
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
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Withdraw
        </Button>
        <p className="text-center text-xs text-gray-400">
          Simulated withdrawal for demo purposes. No real bank account is credited.
        </p>
      </form>
    </Modal>
  );
}
