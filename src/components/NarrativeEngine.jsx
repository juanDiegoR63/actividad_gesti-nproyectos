import React from "react";
import { ROLES_DEF } from "../constants/Roles";

export function NarrativeEngine({ evento, estado, onSelectOption }) {
  if (!evento) return null;

  const rolActual = evento.rol;
  const nombreRol = estado.rolesAsignados[rolActual]?.nombre || "Sistema";

  const renderImpacto = (imp, metrica) => {
    if (!imp && imp !== 0) return "0";
    let base = typeof imp === "number" ? imp : imp?.base || 0;

    const getRango = (val) => {
      const abs = Math.abs(val);
      if (metrica === "hp") {
        if (abs >= 40000000)
          return val < 0 ? "PÉRDIDA MASIVA" : "GANANCIA MASIVA";
        if (abs >= 10000000) return val < 0 ? "PÉRDIDA ALTA" : "GANANCIA ALTA";
        if (abs >= 2000000) return val < 0 ? "PÉRDIDA MEDIA" : "GANANCIA MEDIA";
        if (abs > 0) return val < 0 ? "PÉRDIDA BAJA" : "GANANCIA BAJA";
      } else {
        if (abs >= 15) return val < 0 ? "MUY NEGATIVO" : "MUY POSITIVO";
        if (abs >= 5) return val < 0 ? "NEGATIVO" : "POSITIVO";
        if (abs > 0) return val < 0 ? "LEVE" : "LEVE/MODERADO";
      }
      return "NULO";
    };

    let p = base;
    if (typeof imp === "object" && imp.riesgoOculto?.prob) {
      p = `${base} (${imp.riesgoOculto.prob}%: ${imp.riesgoOculto.impacto})`;
    }

    // Role-based visibility
    if (
      rolActual === "director" &&
      (metrica === "ap" || metrica === "falloCritico")
    )
      return p;
    if (rolActual === "planificacion" && (metrica === "hp" || metrica === "ap"))
      return p;
    if (rolActual === "calidad" && metrica === "ac") return p;

    // Secret for others
    return `[${getRango(base)}]`;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 w-full mb-6">
      <div className="mb-4 pb-4 border-b border-gray-700">
        <h3 className="text-2xl font-bold text-yellow-500 mb-2">
          {evento.titulo}
        </h3>
        <p className="text-gray-300 text-lg leading-relaxed">
          {evento.descripcion}
        </p>
      </div>

      <div className="mb-4 bg-gray-900 p-4 border border-gray-700 rounded-lg">
        <h4 className="text-lg text-white font-bold mb-2">
          Es el turno de votar de:
        </h4>
        <span className="inline-block bg-purple-900/50 text-purple-300 px-3 py-1 rounded text-lg mb-2 border border-purple-700">
          {ROLES_DEF[rolActual]?.nombre}:{" "}
          <strong className="text-purple-100">{nombreRol}</strong>
        </span>
        <p className="text-sm text-gray-400">
          Por favor, discutan y elige tu postura final.
        </p>
      </div>

      {estado.rolesAsignados[rolActual]?.tipo === "auto" ? (
        <div className="bg-indigo-900/20 p-6 rounded-lg border border-indigo-500 text-center">
          <p className="text-indigo-300 mb-4 font-semibold">
            🤖 La IA está analizando la mejor opción según su rol...
          </p>
          <button
            onClick={() => onSelectOption(evento, null)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg border border-indigo-400 cursor-pointer"
          >
            Procesar Decisión Automática
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {evento.opciones.map((opcion, index) => {
            return (
              <button
                key={index}
                onClick={() => onSelectOption(evento, opcion)}
                className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-all border border-gray-600 hover:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <div className="font-semibold text-gray-100 flex items-center justify-between">
                  <span>{opcion.texto}</span>
                </div>
                <div className="mt-2 text-sm text-gray-400 font-mono">
                  Impactos: [ HP: {renderImpacto(opcion.impactos.hp, "hp")} |
                  AC: {renderImpacto(opcion.impactos.ac, "ac")} | AP:{" "}
                  {renderImpacto(opcion.impactos.ap, "ap")} | Riesgo:{" "}
                  {renderImpacto(opcion.impactos.falloCritico, "falloCritico")}{" "}
                  ]
                </div>
                {opcion.etiquetas && opcion.etiquetas.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {opcion.etiquetas.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-900 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
