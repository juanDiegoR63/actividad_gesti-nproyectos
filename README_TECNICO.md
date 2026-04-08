# README Tecnico - Simulador de Gestion de Proyectos

[![GitHub last commit](https://img.shields.io/github/last-commit/Eduardo37830/actividad_gesti-nproyectos/main?style=flat-square)](https://github.com/Eduardo37830/actividad_gesti-nproyectos/commits/main) [![Package version](https://img.shields.io/github/package-json/v/Eduardo37830/actividad_gesti-nproyectos?style=flat-square)](https://github.com/Eduardo37830/actividad_gesti-nproyectos) [![Top language](https://img.shields.io/github/languages/top/Eduardo37830/actividad_gesti-nproyectos?style=flat-square)](https://github.com/Eduardo37830/actividad_gesti-nproyectos)

## Resumen

Aplicacion frontend con React + Vite que implementa un sistema de simulacion por turnos orientado a gestion de proyectos.
El flujo operativo actual usa pantallas de menu, creacion, batalla y resultados sobre un estado global en Zustand.

## Stack actual

- React 18
- Vite 5
- TypeScript 6 (coexistencia con archivos JS/JSX)
- Zustand 5
- PixiJS 8
- Framer Motion 12
- Howler 2
- Zod 4

## Scripts de trabajo

- `npm run dev`: servidor de desarrollo.
- `npm run build`: build de produccion.
- `npm run preview`: preview del build.
- `npm run typecheck`: chequeo de tipos.
- `npm run sim:balance -- --runs=<n>`: simulaciones de balance.

## Arquitectura funcional

- `src/core/store/gameStore.ts`: estado central de partida, turnos, encuentro y transiciones de pantalla.
- `src/core/engine/`: resolutores de reglas (decision, enemigo, incidentes, requisitos, scoring, turnos, staffing).
- `src/data/actions.ts`: catalogo de decisiones del jugador.
- `src/data/phases/`: definicion de fases y encuentros.
- `src/types/game.ts`: modelo de dominio tipado.
- `src/screens/`: pantallas del ciclo de juego.
- `src/render/pixi/BattleScene.js`: escena de combate en PixiJS.

## Dominio y reglas

- Recursos de proyecto: presupuesto, tiempo, calidad, riesgo y avance.
- Equipo: roles asignados, energia, estres, disciplina y estado operativo.
- Turnos: secuencia por rol con alternancia de turno enemigo.
- Requisitos de accion: si no se cumplen, se aplica deuda con penalizaciones.
- Presion de encuentro: penalizaciones acumulativas por rondas y patrones de juego.
- Puntaje final: compuesto por salud de recursos, control de riesgo, avance y estabilidad del equipo.

## Flujo de ejecucion

1. `src/main.jsx` inicia la aplicacion.
2. `src/App.jsx` enruta la pantalla segun `currentScreen`.
3. `startRun` inicializa estado, equipo y primer encuentro.
4. `pickAction` resuelve decisiones y efectos sobre proyecto/equipo/enemigos.
5. `resolveEnemyTurn` ejecuta la respuesta del entorno.
6. `advanceEncounter` gestiona progresion por fases.
7. `computeFinalScore` determina score, rank y desglose final.

## Referencias

- README funcional: `README.md`
