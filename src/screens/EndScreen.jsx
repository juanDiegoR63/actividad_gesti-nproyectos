import React from "react";
import { PantallaCierre } from "../components/PantallaCierre";

export function EndScreen({ engine }) {
  const { estado, evaluarFinal, reiniciarProyecto, enviarDrive, toastMessage } =
    engine;

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <main className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
        <PantallaCierre
          estado={estado}
          resultado={evaluarFinal()}
          reiniciar={reiniciarProyecto}
          enviarDrive={enviarDrive}
        />
      </main>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border-l-4 border-indigo-400 bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
