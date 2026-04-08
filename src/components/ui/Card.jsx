import React from "react";

export function Card({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-700 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      {title && (
        <h2 className="mb-2 text-2xl font-bold text-indigo-300">{title}</h2>
      )}
      {subtitle && <p className="mb-6 text-sm text-slate-300">{subtitle}</p>}
      {children}
    </section>
  );
}
