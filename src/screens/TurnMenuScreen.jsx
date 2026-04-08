import React, { useEffect } from "react";
import { useGameStore } from "../core/store/gameStore";
import { audioService } from "../core/services/audioService";

export function TurnMenuScreen() {
  const goToCreation = useGameStore((state) => state.goToCreation);

  useEffect(() => {
    audioService.playMusic("menu");
  }, []);

  const handleStart = async () => {
    await audioService.unlock();
    audioService.playSfx("confirm");
    goToCreation();
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-center px-4 py-5 sm:px-6 sm:py-8">
      <div className="border-4 border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-8">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-amber-300">
          Retro Corporate Tactical RPG
        </p>
        <h1 className="mb-4 text-3xl font-black uppercase text-slate-100 sm:text-4xl">
          PMBOK Turn Battle
        </h1>
        <p className="mb-8 max-w-3xl text-slate-300">
          Controla Director, Planning y Calidad en combates por turnos contra amenazas
          institucionales. Cada decision consume recursos reales del proyecto.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border-2 border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Run Goal</p>
            <p className="mt-2 text-lg font-semibold text-slate-200">20-30 min</p>
          </div>
          <div className="border-2 border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Modelo</p>
            <p className="mt-2 text-lg font-semibold text-slate-200">Hibrido PMBOK + Team</p>
          </div>
          <div className="border-2 border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Fase actual</p>
            <p className="mt-2 text-lg font-semibold text-slate-200">Campaña completa 5 fases</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleStart();
          }}
          className="mt-8 inline-flex items-center justify-center border-2 border-amber-400 bg-amber-300 px-8 py-3 text-sm font-black uppercase tracking-wider text-slate-900 transition hover:bg-amber-200"
        >
          Iniciar Campaña
        </button>
      </div>
    </div>
  );
}
