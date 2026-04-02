import React from "react";
import { ROLES_DEF } from "../constants/Roles";
import { METRICAS_INICIALES } from "../data/Config";

export function CouncilRoom({ estado, ultimoResultadoVotacion }) {
  const getAvatar = (rolId) => {
    switch (rolId) {
      case "director":
        return "👑";
      case "planificacion":
        return "🗺️";
      case "calidad":
        return "🛡️";
      default:
        return "👤";
    }
  };

  const isRoleInCrisis = (rolId) => {
    switch (rolId) {
      case "director":
        return estado.ap < METRICAS_INICIALES.ap * 0.3;
      case "planificacion":
        return estado.hp < METRICAS_INICIALES.hp * 0.3;
      case "calidad":
        return estado.ac < 40; // Calidad stress at < 40 AC
      default:
        return false;
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 w-full mb-6 relative overflow-hidden">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-300 tracking-wider">
        Mesa de Análisis
      </h2>

      <div className="flex flex-col md:flex-row gap-4 justify-around">
        {Object.entries(estado.rolesAsignados).map(([rolId, asig]) => {
          const inCrisis = isRoleInCrisis(rolId);
          const voteData = ultimoResultadoVotacion
            ? ultimoResultadoVotacion[rolId]
            : null;

          return (
            <div
              key={rolId}
              className={`flex-1 p-4 rounded border flex flex-col items-center text-center transition-all ${
                inCrisis
                  ? "border-red-500 animate-pulse bg-red-900/20"
                  : "border-gray-700 bg-gray-800"
              }`}
            >
              <div className="text-4xl mb-2">{getAvatar(rolId)}</div>
              <div
                className={`font-bold mb-1 ${inCrisis ? "text-red-400" : "text-yellow-400"}`}
              >
                {ROLES_DEF[rolId]?.nombre}
              </div>
              <div
                className={`text-sm mb-3 ${inCrisis ? "text-red-200" : "text-gray-400"}`}
              >
                {asig.nombre} ({asig.tipo})
              </div>

              {voteData && (
                <div className="mt-auto w-full bg-gray-900 p-2 rounded border border-gray-600 text-xs text-left">
                  <div className="font-semibold text-blue-300 mb-1">
                    {voteData.tipo === "auto" ? "Intención (IA):" : "Votó:"}
                  </div>
                  <div
                    className="text-gray-300 mb-2 truncate"
                    title={voteData.opcion?.texto}
                  >
                    "{voteData.opcion?.texto || "..."}"
                  </div>
                  {voteData.razonamiento && (
                    <>
                      <div className="font-semibold text-green-400 mb-1">
                        Razonamiento:
                      </div>
                      <div className="text-gray-400 italic text-[11px] leading-tight break-words">
                        {voteData.razonamiento}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
