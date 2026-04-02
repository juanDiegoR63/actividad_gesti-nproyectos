import React, { useState } from "react";
import { ROLES_DEF } from "../constants/Roles";

export function NarrativeEngine({ evento, estado, onSelectOption }) {
  const [seleccionesPersuasion, setSeleccionesPersuasion] = useState([]);

  if (!evento) return null;

  const rolActual = evento.rol;
  const nombreRol = estado.rolesAsignados[rolActual]?.nombre || "Sistema";

  const renderImpacto = (imp) => {
    if (typeof imp === "number") return imp;
    if (imp?.riesgoOculto?.prob) {
      return `${imp.base || 0} (${imp.riesgoOculto.prob}%: ${imp.riesgoOculto.impacto})`;
    }
    return imp?.base || 0;
  };

  const tooglePersuasion = (rol) => {
    if (seleccionesPersuasion.includes(rol)) {
      setSeleccionesPersuasion(seleccionesPersuasion.filter((r) => r !== rol));
    } else {
      setSeleccionesPersuasion([...seleccionesPersuasion, rol]);
    }
  };

  // Bot que no sean de este humano
  const rolesIA = Object.entries(estado.rolesAsignados).filter(
    ([r, asig]) => asig.tipo === "auto",
  );

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

        {rolesIA.length > 0 && (
          <div className="mt-4 p-3 bg-gray-800 border border-indigo-900/50 rounded">
            <h5 className="text-indigo-400 font-bold text-sm mb-2">
              Habilidad de Persuasión 🗣️
            </h5>
            <p className="text-xs text-gray-400 mb-2">
              Gasta 15 MP para obligar a un miembro de la IA a alinearse con tu
              voto.
            </p>
            <div className="flex gap-2 flex-wrap">
              {rolesIA.map(([r, asig]) => {
                const isSelected = seleccionesPersuasion.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => tooglePersuasion(r)}
                    disabled={
                      estado.mp <
                      (seleccionesPersuasion.length + (isSelected ? 0 : 1)) * 15
                    }
                    className={`text-xs px-2 py-1 border rounded transition ${isSelected ? "bg-indigo-600 border-indigo-400 text-white" : "bg-gray-700 border-gray-500 text-gray-300 hover:bg-gray-600"}`}
                  >
                    {isSelected ? "✓ " : ""}
                    {ROLES_DEF[r].nombre}
                  </button>
                );
              })}
            </div>
            {seleccionesPersuasion.length > 0 && (
              <p className="text-xs text-rose-300 mt-2">
                Costo total de persuasión: {seleccionesPersuasion.length * 15}{" "}
                MP
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {evento.opciones.map((opcion, index) => {
          return (
            <button
              key={index}
              onClick={() =>
                onSelectOption(evento, opcion, seleccionesPersuasion)
              }
              className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-all border border-gray-600 hover:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <div className="font-semibold text-gray-100 flex items-center justify-between">
                <span>{opcion.texto}</span>
              </div>
              <div className="mt-2 text-sm text-gray-400 font-mono">
                Impactos: [ HP: {renderImpacto(opcion.impactos.hp)} | MP:{" "}
                {renderImpacto(opcion.impactos.mp)} | AC:{" "}
                {renderImpacto(opcion.impactos.ac)} | AP:{" "}
                {renderImpacto(opcion.impactos.ap)} | Riesgo:{" "}
                {renderImpacto(opcion.impactos.falloCritico)} ]
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
    </div>
  );
}
