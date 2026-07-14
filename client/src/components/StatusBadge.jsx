const STYLES = {
  active: "bg-emerald-500/10 text-emerald-400",
  paused: "bg-amber-500/10 text-amber-400",
  completed: "bg-white/10 text-gray-400",
  cancelled: "bg-rose-500/10 text-rose-400",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
        STYLES[status] || STYLES.completed
      }`}
    >
      {status}
    </span>
  );
}
