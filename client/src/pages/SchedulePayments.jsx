import { useMemo, useState } from "react";
import { Plus, Pause, Play, Pencil, Trash2, CalendarClock, Repeat } from "lucide-react";
import { useData } from "../context/DataContext";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import ScheduleFormModal from "../components/modals/ScheduleFormModal";
import { formatCurrency, formatDate } from "../utils/format";
import { scheduleMeta } from "../utils/categories";
import {
  updateScheduledPaymentStatus,
  deleteScheduledPayment,
} from "../api/scheduledPayments";
import { useToast } from "../context/ToastContext";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function currentWeekDays() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

export default function SchedulePayments() {
  const { scheduledPayments, wallets, refreshScheduledPayments } = useData();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const walletName = (id) => wallets.find((w) => w.id === id)?.name || "Wallet";
  const weekDays = useMemo(currentWeekDays, []);
  const today = new Date();

  const stats = useMemo(() => {
    const active = scheduledPayments.filter((p) => p.status === "active");
    return {
      upcoming: active.length,
      due: active.reduce((sum, p) => sum + Number(p.amount), 0),
      recurring: active.filter((p) => p.scheduleType === "recurring").length,
    };
  }, [scheduledPayments]);

  async function handleStatus(payment, status) {
    try {
      await updateScheduledPaymentStatus(payment.id, status);
      await refreshScheduledPayments();
      toast.success(`Payment ${status}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteScheduledPayment(deleteTarget.id);
      await refreshScheduledPayments();
      toast.success("Scheduled payment removed");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(payment) {
    setEditingPayment(payment);
    setShowForm(true);
  }

  function openCreate() {
    setEditingPayment(null);
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Scheduled</h2>
          <p className="text-sm text-gray-500">
            {today.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#ff5449] to-[#e2362b] text-white shadow-[0_8px_24px_rgba(226,54,43,0.35)] transition hover:brightness-105"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {weekDays.map((d) => {
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div
              key={d.toISOString()}
              className={`flex min-w-[44px] flex-col items-center gap-1 rounded-xl py-2.5 ${
                isToday ? "bg-gradient-to-br from-[#ff5449] to-[#e2362b] text-white" : "bg-[#111111] text-gray-400"
              }`}
            >
              <span className="text-[11px] font-medium">{WEEKDAY_LETTERS[d.getDay()]}</span>
              <span className="text-sm font-bold">{d.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
          {stats.upcoming} Upcoming
        </span>
        <span className="rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400">
          {formatCurrency(stats.due)} Due
        </span>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
          {stats.recurring} Recurring
        </span>
      </div>

      <h3 className="text-sm font-bold text-white">All Scheduled</h3>

      {scheduledPayments.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No scheduled payments"
          description="Set up rent, utility bills, subscriptions, or gifts to run automatically."
          action={
            <button onClick={openCreate} className="text-sm font-semibold text-brand-500">
              + Schedule your first payment
            </button>
          }
        />
      ) : (
        <div className="space-y-0">
          {scheduledPayments.map((p, index) => {
            const meta = scheduleMeta(p.category);
            const Icon = meta.icon;
            const isLast = index === scheduledPayments.length - 1;
            const editable = p.status === "active" || p.status === "paused";

            return (
              <div key={p.id} className="flex gap-3">
                <div className="flex flex-col items-center pt-5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border-2"
                    style={{ borderColor: meta.color }}
                  />
                  {!isLast && <span className="w-px flex-1 bg-white/10" />}
                </div>

                <div className="flex-1 rounded-2xl border border-white/10 bg-[#111111] p-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{p.payeeName}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {meta.label} · from {walletName(p.fromWalletId)}
                      </p>
                    </div>
                    <p className="text-base font-bold text-white">{formatCurrency(p.amount)}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(p.nextRunDate)}</span>
                      {p.scheduleType === "recurring" && (
                        <span className="flex items-center gap-1">
                          <Repeat size={12} />
                          {p.frequency} recurring
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {p.status === "active" && (
                        <button
                          onClick={() => handleStatus(p, "paused")}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-500/10 hover:text-amber-400"
                          title="Pause"
                        >
                          <Pause size={14} />
                        </button>
                      )}
                      {p.status === "paused" && (
                        <button
                          onClick={() => handleStatus(p, "active")}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                          title="Resume"
                        >
                          <Play size={14} />
                        </button>
                      )}
                      {editable ? (
                        <>
                          <button
                            onClick={() => openEdit(p)}
                            className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/10"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleStatus(p, "cancelled")}
                            className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ScheduleFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        editingPayment={editingPayment}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove scheduled payment"
        message={`Remove the scheduled payment to ${deleteTarget?.payeeName}? This cannot be undone.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
