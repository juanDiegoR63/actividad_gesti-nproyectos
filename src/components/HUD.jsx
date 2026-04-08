import React from "react";
import { StatBar } from "./StatBar";
import { METRICAS_INICIALES } from "../data/Config";

export function HUD({ estado }) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-lg w-full mb-6 relative border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-center text-yellow-500 tracking-wider uppercase border-b border-gray-700 pb-2">
        Tablero de Mando Compartido
      </h2>

      {/* Esquinas / Zonas de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Zona Compartida (Riesgo) */}
        <div className="md:col-span-2 w-full text-center text-sm font-semibold text-red-400 flex justify-center items-center gap-1 border border-red-900/50 rounded bg-red-900/20 p-2">
          🔥 Fallo Crítico: {estado.falloCritico}%
        </div>

        {/* Zona Director (Esquina Inferior Izquierda / Completa) */}
        <div className="md:col-span-2 flex gap-4 items-center p-3 bg-gray-800 rounded border border-gray-700 relative mt-2">
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
        </div>
      </div>
    </div>
  );
}
