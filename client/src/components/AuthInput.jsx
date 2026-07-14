export function AuthLabel({ children }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
      {children}
    </p>
  );
}

export function AuthInput({ icon: Icon, prefix, className = "", ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#131313] px-4 py-3.5 transition focus-within:border-red-500/50">
      {prefix && (
        <>
          <span className="text-sm font-medium text-white">{prefix}</span>
          <span className="h-4 w-px bg-white/10" />
        </>
      )}
      {Icon && <Icon size={17} className="shrink-0 text-gray-500" />}
      <input
        className={`w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
