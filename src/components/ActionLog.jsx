import React, { useRef, useEffect } from "react";
import { ROLES_DEF } from "../constants/Roles";

export function ActionLog({ historico }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historico]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 w-full mb-6">
      <h2 className="text-lg font-bold mb-3 text-gray-300">
        Historial de Eventos
      </h2>
      <div
        ref={scrollRef}
        className="bg-gray-900 border border-gray-700 rounded p-3 h-48 overflow-y-auto space-y-2 text-sm"
      >
        {historico.length === 0 ? (
          <div className="text-gray-500 italic text-center mt-8">
            Aún no hay acciones registradas.
          </div>
        ) : (
          historico.map((h, i) => (
            <div
              key={i}
              className="pb-2 border-b border-gray-800 last:border-0"
            >
              <span className="text-purple-400 font-semibold">
                [{ROLES_DEF[h.rol]?.nombre || h.rol}]
              </span>{" "}
              <span className="text-gray-300">en</span>{" "}
              <span className="text-yellow-600 font-medium">{h.evento}</span>
              <br />
              <span className="text-gray-400">► {h.decision}</span>
              {h.mitigacion && h.mitigacion !== "" && (
                <div className="text-green-500 text-xs mt-1">
                  🛡️ {h.mitigacion}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
