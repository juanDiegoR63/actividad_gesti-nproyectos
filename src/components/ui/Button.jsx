import React from "react";

const VARIANTS = {
  primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
  secondary: "bg-slate-700 hover:bg-slate-600 text-white",
  danger: "bg-rose-600 hover:bg-rose-500 text-white",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
  fullWidth = false,
}) {
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900",
        variantClasses,
        disabled ? "cursor-not-allowed opacity-50" : "",
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
