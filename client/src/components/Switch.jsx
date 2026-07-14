export default function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex h-6 w-11 shrink-0 items-center overflow-hidden rounded-full transition-colors ${
        checked ? "bg-brand-500" : "bg-white/15"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <span
        className={`ml-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
