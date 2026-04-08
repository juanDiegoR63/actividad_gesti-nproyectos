import React from "react";

export function Input({
  label,
  helper,
  value,
  onChange,
  placeholder,
  type = "text",
  as = "input",
  options = [],
  className = "",
}) {
  const controlClasses = [
    "w-full rounded-lg border border-slate-600 bg-slate-950 px-4 py-3 text-slate-100",
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
    className,
  ].join(" ");

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-slate-200">{label}</label>
      )}

      {as === "select" ? (
        <select value={value} onChange={onChange} className={controlClasses}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={controlClasses}
        />
      )}

      {helper && <p className="text-xs text-slate-400">{helper}</p>}
    </div>
  );
}
