import { useState, useEffect } from "react";
import Modal from "../Modal";
import Input, { Field, Select, TextArea } from "../Input";
import Button from "../Button";
import { transferBetweenWallets } from "../../api/wallets";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/format";

export default function TransferModal({ open, onClose, defaultFromWalletId }) {
  const { wallets, refreshWallets, refreshTransactions } = useData();
  const toast = useToast();
  const [form, setForm] = useState({ fromWalletId: "", toWalletId: "", amount: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        fromWalletId: defaultFromWalletId || wallets[0]?.id || "",
        toWalletId: "",
        amount: "",
        note: "",
      });
      setError("");
    }
  }, [open, defaultFromWalletId, wallets]);

  const fromWallet = wallets.find((w) => w.id === form.fromWalletId);
  const toOptions = wallets.filter((w) => w.id !== form.fromWalletId);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await transferBetweenWallets({ ...form, amount: Number(form.amount) });
      await Promise.all([refreshWallets(), refreshTransactions()]);
      toast.success("Transfer complete");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Transfer Between Wallets">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="From">
          <Select
            value={form.fromWalletId}
            onChange={(e) => setForm({ ...form, fromWalletId: e.target.value, toWalletId: "" })}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} · {formatCurrency(w.balance)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="To">
          <Select
            required
            value={form.toWalletId}
            onChange={(e) => setForm({ ...form, toWalletId: e.target.value })}
          >
            <option value="" disabled>
              Select destination wallet
            </option>
            {toOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            required
            prefix="₹"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </Field>
        <Field label="Note" hint="Optional">
          <TextArea
            rows={2}
            placeholder="What's this for?"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </Field>
        {fromWallet && Number(form.amount) > Number(fromWallet.balance) && (
          <p className="text-sm text-amber-600">
            This exceeds the available balance in {fromWallet.name}.
          </p>
        )}
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Transfer
        </Button>
      </form>
    </Modal>
  );
}
