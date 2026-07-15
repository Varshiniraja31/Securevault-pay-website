import clsx from "clsx";

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span>
      )}
      {children}
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
      {!error && hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

const BASE_FIELD =
  "w-full rounded-xl border border-white/10 bg-[#131313] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20";

export default function Input({ className, prefix, ...props }) {
  if (prefix) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
          {prefix}
        </span>
        <input className={clsx(BASE_FIELD, "pl-14", className)} {...props} />
      </div>
    );
  }

  return <input className={clsx(BASE_FIELD, className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={clsx(BASE_FIELD, className)} {...props}>
      {children}
    </select>
  );
}

export function TextArea({ className, ...props }) {
  return <textarea className={clsx(BASE_FIELD, className)} {...props} />;
}
