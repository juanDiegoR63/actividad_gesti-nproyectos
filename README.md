# Simulador de Gestion de Proyectos

[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/) [![Vite 5](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/) [![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Zustand 5](https://img.shields.io/badge/Zustand-5-7A5A3A?style=flat-square)](https://zustand-demo.pmnd.rs/) [![PixiJS 8](https://img.shields.io/badge/PixiJS-8-E10098?style=flat-square)](https://pixijs.com/)

## Descripcion

Simulador tactico por turnos donde gestionas un proyecto bajo presion realista de stakeholders, tiempo, presupuesto y calidad.
El objetivo es completar las 5 fases del proyecto sin colapsar recursos y con el mejor resultado final posible.

## Como es el juego

- Cada partida se juega con 3 roles: Direccion, Planificacion y Calidad.
- En cada turno eliges acciones con costo y efecto sobre el estado del proyecto.
- Los oponentes representan fricciones del entorno corporativo (stakeholders, auditoria, comites y presion de cierre).
- El sistema reacciona a tus decisiones con penalizaciones por deuda, eventos de riesgo y cambios de contexto.

## Mecanicas principales

- Recursos centrales: presupuesto, tiempo, calidad, riesgo y avance.
- Sistema de turnos: alternancia entre equipo y entorno adverso.
- Requisitos de accion: si ejecutas sin cumplir condiciones, se activa deuda operativa.
- Presion acumulada: el uso repetido de estrategias pasivas y el desgaste de rondas incrementa el costo de sostener el proyecto.
- Estabilidad del equipo: energia, estres y bajas impactan capacidad de ejecucion.
- Progresion por fases: Inicio, Planificacion, Ejecucion, Monitoreo y Cierre.

## Condiciones de derrota y cierre

- La partida se pierde si el proyecto queda inviable por recursos o por crisis operativa del equipo.
- Al finalizar, se calcula un puntaje de desempeno con base en salud financiera, tiempo, calidad, control de riesgo, avance y estabilidad del equipo.

## Documentacion

- [README tecnico](./README_TECNICO.md)
