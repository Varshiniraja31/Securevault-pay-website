import { useState, useEffect } from "react";
import Modal from "../Modal";
import Input, { Field, Select, TextArea } from "../Input";
import Button from "../Button";
import { createScheduledPayment, updateScheduledPayment } from "../../api/scheduledPayments";
import { useData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";
import { SCHEDULE_CATEGORIES } from "../../utils/categories";

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  fromWalletId: "",
  payeeName: "",
  payeePhone: "",
  category: "rent",
  customCategory: "",
  amount: "",
  scheduleType: "one-time",
  frequency: "monthly",
  nextRunDate: tomorrow(),
  endDate: "",
  note: "",
};

export default function ScheduleFormModal({ open, onClose, editingPayment }) {
  const { wallets, refreshScheduledPayments, refreshWallets, refreshTransactions } = useData();
  const toast = useToast();
  const isEditing = Boolean(editingPayment);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCustom = form.category === "custom";

  useEffect(() => {
    if (!open) return;
    setError("");
    if (editingPayment) {
      const knownCategory = Boolean(SCHEDULE_CATEGORIES[editingPayment.category]);
      setForm({
        fromWalletId: editingPayment.fromWalletId,
        payeeName: editingPayment.payeeName,
        payeePhone: editingPayment.payeePhone || "",
        category: knownCategory ? editingPayment.category : "custom",
        customCategory: knownCategory ? "" : editingPayment.category,
        amount: String(editingPayment.amount),
        scheduleType: editingPayment.scheduleType,
        frequency: editingPayment.frequency || "monthly",
        nextRunDate: editingPayment.nextRunDate,
        endDate: editingPayment.endDate || "",
        note: editingPayment.note || "",
      });
    } else {
      setForm({ ...EMPTY_FORM, fromWalletId: wallets[0]?.id || "", nextRunDate: tomorrow() });
    }
  }, [open, wallets, editingPayment]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (isCustom && !form.customCategory.trim()) {
      setError("Tell us what this custom category is for.");
      return;
    }

    setLoading(true);
    const payload = {
      ...form,
      category: isCustom ? form.customCategory.trim() : form.category,
      amount: Number(form.amount),
    };
    delete payload.customCategory;

    try {
      if (isEditing) {
        await updateScheduledPayment(editingPayment.id, payload);
        toast.success(`Payment to ${form.payeeName} updated`);
      } else {
        await createScheduledPayment(payload);
        toast.success(
          payload.scheduleType === "recurring"
            ? `Payment to ${form.payeeName} scheduled`
            : `₹${payload.amount.toFixed(2)} reserved and scheduled for ${form.payeeName}`
        );
      }
      await Promise.all([refreshScheduledPayments(), refreshWallets(), refreshTransactions()]);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Scheduled Payment" : "Schedule a Payment"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pay from">
          <Select
            value={form.fromWalletId}
            onChange={(e) => setForm({ ...form, fromWalletId: e.target.value })}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payee name">
          <Input
            required
            placeholder="e.g. Landlord, Netflix, Mom"
            value={form.payeeName}
            onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
          />
        </Field>
        <Field label="Phone number" hint="Optional">
          <Input
            type="tel"
            prefix="+91"
            placeholder="Enter payee's mobile number"
            value={form.payeePhone}
            onChange={(e) => setForm({ ...form, payeePhone: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <Select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {Object.entries(SCHEDULE_CATEGORIES).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>
        </Field>
        {isCustom && (
          <Field label="What's this category for?" hint="e.g. Tutoring Fees, Pet Care, Society Dues">
            <Input
              required
              placeholder="Enter a category name"
              value={form.customCategory}
              onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
              autoFocus
            />
          </Field>
        )}
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Schedule type">
            <Select
              value={form.scheduleType}
              onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}
            >
              <option value="one-time">One-time</option>
              <option value="recurring">Recurring</option>
            </Select>
          </Field>
          {form.scheduleType === "recurring" && (
            <Field label="Frequency">
              <Select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={form.scheduleType === "recurring" ? "Starts on" : "Pay on"}>
            <Input
              type="date"
              required
              min={tomorrow()}
              value={form.nextRunDate}
              onChange={(e) => setForm({ ...form, nextRunDate: e.target.value })}
            />
          </Field>
          {form.scheduleType === "recurring" && (
            <Field label="Ends on" hint="Optional">
              <Input
                type="date"
                min={form.nextRunDate}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          )}
        </div>

        <Field label="Note" hint="Optional">
          <TextArea
            rows={2}
            placeholder="Add a memo"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </Field>

        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {isEditing ? "Save Changes" : "Schedule Payment"}
        </Button>
      </form>
    </Modal>
  );
}
