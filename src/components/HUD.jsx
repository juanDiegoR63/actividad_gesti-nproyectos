import React from "react";
import { StatBar } from "./StatBar";
import { METRICAS_INICIALES } from "../data/Config";

export function HUD({
  estado,
  activatingMuro,
  activatingPurificacion,
  muroContencion,
}) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-lg w-full mb-6 relative border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-center text-yellow-500 tracking-wider uppercase border-b border-gray-700 pb-2">
        Tablero de Mando Compartido
      </h2>

      {/* Esquinas / Zonas de Roles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Zona Planificación (Esquina Superior Izquierda) */}
        <div className="flex flex-col gap-2 p-3 bg-gray-800 rounded border border-gray-700 relative">
          <div className="text-xs uppercase text-gray-400 absolute top-0 right-2 -mt-2 bg-gray-900 px-1">
            Planificación
          </div>
          <StatBar
            label="Presupuesto (HP)"
            value={estado.hp}
            max={METRICAS_INICIALES.hp}
            color={
              estado.hp < METRICAS_INICIALES.hp * 0.2
                ? "bg-red-500"
                : "bg-green-500"
            }
            icon="💰"
          />
          {estado.hp < METRICAS_INICIALES.hp * 0.2 && (
            <div className="text-xs text-red-400 font-bold animate-pulse">
              ¡Estrés Crítico!
            </div>
          )}
        </div>

        {/* Zona Compartida (Centro Arriba) */}
        <div className="flex flex-col justify-center items-center gap-2 p-3 bg-gray-800 rounded border border-blue-900/50">
          <StatBar
            label="Satisfacción (MP)"
            value={estado.mp}
            max={100}
            color="bg-blue-500"
            icon="✨"
          />
          <div className="w-full text-center text-sm font-semibold text-red-400 flex justify-center items-center gap-1 border border-red-900/50 rounded bg-red-900/20 p-1">
            🔥 Fallo Crítico: {estado.falloCritico}%
          </div>
        </div>

        {/* Zona Calidad (Esquina Superior Derecha) */}
        <div className="flex flex-col gap-2 p-3 bg-gray-800 rounded border border-gray-700 relative">
          <div className="text-xs uppercase text-gray-400 absolute top-0 left-2 -mt-2 bg-gray-900 px-1">
            Calidad
          </div>
          <StatBar
            label="Calidad (AC)"
            value={estado.ac}
            max={100}
            color="bg-zinc-400"
            icon="🛡️"
          />
          {estado.ac < 40 && (
            <div className="text-xs text-red-400 font-bold animate-pulse">
              ¡Estrés Crítico!
            </div>
          )}
        </div>

        {/* Zona Director (Esquina Inferior Izquierda / Completa) */}
        <div className="col-span-2 md:col-span-3 flex gap-4 items-center p-3 bg-gray-800 rounded border border-gray-700 relative mt-2">
          <div className="text-xs uppercase text-gray-400 absolute top-0 left-2 -mt-2 bg-gray-900 px-1">
            Director
          </div>
          <div className="flex-1">
            <StatBar
              label="Tiempo (AP)"
              value={estado.ap}
              max={METRICAS_INICIALES.ap}
              color="bg-yellow-400"
              icon="⌛"
            />
            {estado.ap < METRICAS_INICIALES.ap * 0.3 && (
              <div className="text-xs text-red-400 font-bold animate-pulse">
                ¡Estrés Crítico!
              </div>
            )}
          </div>

          <div className="flex gap-2 min-w-[250px]">
            <button
              onClick={activatingMuro}
              disabled={estado.mp < 20 || muroContencion}
              className="flex-1 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-2 rounded transition-colors border border-indigo-500"
            >
              🛡️ Muro (20 MP)
            </button>
            <button
              onClick={activatingPurificacion}
              disabled={estado.mp < 15 || estado.falloCritico <= 0}
              className="flex-1 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-2 rounded transition-colors border border-teal-500"
            >
              ✨ Purificar (15)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
