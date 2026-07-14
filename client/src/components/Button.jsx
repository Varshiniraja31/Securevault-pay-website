import clsx from "clsx";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-gradient-to-r from-[#ff5449] to-[#e2362b] text-white hover:brightness-105 shadow-sm shadow-brand-500/30 disabled:opacity-60",
  dark: "bg-[#131313] border border-white/10 text-white hover:bg-[#1a1a1a] disabled:opacity-60",
  outline:
    "border border-white/15 text-gray-200 hover:bg-white/5 disabled:opacity-60",
  ghost: "text-gray-300 hover:bg-white/10 disabled:opacity-60",
  danger: "bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60",
};

const SIZES = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-base px-5 py-3 rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
