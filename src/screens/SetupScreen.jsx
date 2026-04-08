import React from "react";
import { ROLES_DEF } from "../constants/Roles";
import { CASO_ESTUDIO } from "../data/Config";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

const TEAM_OPTIONS = [
  { value: "", label: "Selecciona un equipo..." },
  { value: "1", label: "Equipo 1" },
  { value: "2", label: "Equipo 2" },
  { value: "3", label: "Equipo 3" },
  { value: "4", label: "Equipo 4" },
  { value: "5", label: "Equipo 5" },
  { value: "6", label: "Equipo 6" },
  { value: "8", label: "Equipo 8" },
  { value: "profesor", label: "Profesor" },
];

export function SetupScreen({ engine }) {
  const {
    estado,
    setEstado,
    nombresForm,
    setNombresForm,
    iniciarJuego,
    toastMessage,
  } = engine;

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-indigo-300">
          {CASO_ESTUDIO.titulo}
        </h1>
        <p className="mt-3 text-slate-300">
          Configura el equipo y asigna jugadores. Si un rol queda en blanco, se
          asignará a IA.
        </p>
      </div>

      <Card
        className="mx-auto max-w-2xl"
        title="Preparación de Misión"
        subtitle="Define quién lidera cada frente antes de iniciar la simulación"
      >
        <div className="space-y-4">
          <Input
            as="select"
            label="Nombre del Equipo"
            value={estado.equipo}
            onChange={(e) =>
              setEstado((prev) => ({ ...prev, equipo: e.target.value }))
            }
            options={TEAM_OPTIONS}
          />

          {Object.entries(ROLES_DEF).map(([rolId, def]) => (
            <Input
              key={rolId}
              label={def.nombre}
              placeholder="Nombre del jugador (o vacío para automático)"
              value={nombresForm[rolId]}
              onChange={(e) =>
                setNombresForm((prev) => ({
                  ...prev,
                  [rolId]: e.target.value,
                }))
              }
              helper={def.descripcion}
            />
          ))}

          <Button onClick={iniciarJuego} fullWidth>
            Comenzar Simulación
          </Button>
        </div>
      </Card>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border-l-4 border-indigo-400 bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
