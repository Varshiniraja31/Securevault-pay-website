import { useState, useEffect } from "react";
import Modal from "../Modal";
import Input, { Field, Select } from "../Input";
import Button from "../Button";
import { makePayment } from "../../api/payments";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../utils/format";

const PAYMENT_TYPES = [
  { value: "qr_payment", label: "QR Payment" },
  { value: "merchant_payment", label: "Merchant Payment" },
  { value: "bill_payment", label: "Bill Payment" },
];

export default function PayModal({
  open,
  onClose,
  defaultWalletId,
  defaultMerchantName,
  defaultAmount,
}) {
  const { purposeWallets, refreshWallets, refreshTransactions } = useData();
  const toast = useToast();
  const [form, setForm] = useState({
    walletId: "",
    type: "qr_payment",
    merchantName: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        walletId: defaultWalletId || purposeWallets[0]?.id || "",
        type: "qr_payment",
        merchantName: defaultMerchantName || "",
        amount: defaultAmount || "",
      });
      setError("");
    }
  }, [open, defaultWalletId, defaultMerchantName, defaultAmount, purposeWallets]);

  const wallet = purposeWallets.find((w) => w.id === form.walletId);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await makePayment({ ...form, amount: Number(form.amount) });
      await Promise.all([refreshWallets(), refreshTransactions()]);
      toast.success(`Payment of ₹${form.amount} sent`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (purposeWallets.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title="Pay">
        <p className="text-sm text-gray-500">
          Create a purpose-based wallet first, then top it up from your Main Wallet to make
          payments.
        </p>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Pay Merchant / QR / Bill">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pay from">
          <Select
            value={form.walletId}
            onChange={(e) => setForm({ ...form, walletId: e.target.value })}
          >
            {purposeWallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} · {formatCurrency(w.balance)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment type">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {PAYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Merchant / Payee name">
          <Input
            required
            placeholder="e.g. FreshMart Grocery"
            value={form.merchantName}
            onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
          />
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
        {wallet && Number(form.amount) > Number(wallet.balance) && (
          <p className="text-sm text-amber-600">
            This exceeds the available balance in {wallet.name}. Top it up from your Main Wallet.
          </p>
        )}
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Pay Now
        </Button>
      </form>
    </Modal>
  );
}
