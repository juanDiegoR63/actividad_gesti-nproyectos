import React, { useState, useEffect, useRef } from "react";

export function StatBar({ label, value, max, color, icon, isCurrency }) {
  const [flashing, setFlashing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value < prevValue.current) {
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 500);
      return () => clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value]);

  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      className={`flex flex-col mb-2 w-full transition-all duration-200 ${flashing ? "scale-105" : ""}`}
    >
      <div
        className={`flex justify-between items-center text-sm font-semibold mb-1 ${flashing ? "text-red-400" : "text-gray-300"}`}
      >
        <span className="flex items-center gap-1">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-mono">
          {isCurrency && "$"}
          {Math.floor(value).toLocaleString()}
          {!isCurrency && label === "Calidad (AC)" && "%"}
        </span>
      </div>
      <div
        className={`w-full h-3 bg-gray-700 rounded-full overflow-hidden ${flashing ? "bg-red-900/50" : ""}`}
      >
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
