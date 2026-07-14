import { useState } from "react";
import Modal from "../Modal";
import Input, { Field, Select } from "../Input";
import Button from "../Button";
import { createWallet } from "../../api/wallets";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { WALLET_CATEGORIES } from "../../utils/categories";

const CATEGORY_OPTIONS = Object.entries(WALLET_CATEGORIES).filter(([key]) => key !== "main");

export default function CreateWalletModal({ open, onClose }) {
  const { refreshWallets } = useData();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", category: "grocery", customCategory: "", budget: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCustom = form.category === "custom";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (isCustom && !form.customCategory.trim()) {
      setError("Tell us what this custom category is for.");
      return;
    }

    setLoading(true);
    try {
      await createWallet({
        name: form.name,
        category: isCustom ? form.customCategory.trim() : form.category,
        budget: form.budget ? Number(form.budget) : null,
      });
      await refreshWallets();
      toast.success(`${form.name} wallet created`);
      setForm({ name: "", category: "grocery", customCategory: "", budget: "" });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Purpose Wallet">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Wallet name">
          <Input
            required
            placeholder="e.g. Grocery Wallet"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </Field>
        <Field label="Category">
          <Select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORY_OPTIONS.map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>
        {isCustom && (
          <Field label="What's this category for?" hint="e.g. Freelance Fund, Pet Care, Emergency">
            <Input
              required
              placeholder="Enter a category name"
              value={form.customCategory}
              onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
              autoFocus
            />
          </Field>
        )}
        <Field label="Monthly budget" hint="Optional — shows a spending progress bar">
          <Input
            type="number"
            min="1"
            step="0.01"
            prefix="₹"
            placeholder="e.g. 5000"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
          />
        </Field>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create Wallet
        </Button>
      </form>
    </Modal>
  );
}
