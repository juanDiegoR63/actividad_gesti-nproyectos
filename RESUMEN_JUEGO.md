# 📊 Simulador de Proyectos Estratégicos - Resumen General

## 🎮 Descripción General

**Simulador de Proyectos Estratégicos** es un juego educativo que simula la gestión de un proyecto corporativo de alto impacto. Combina mecánicas de RPG estilo Pokémon con principios del PMBOK (Project Management Body of Knowledge) para ofrecer una experiencia interactiva donde los jugadores toman decisiones estratégicas y gerenciales.

**Objetivo Principal:** Guiar un proyecto de "CorpTech Solutions" a través de 5 fases de gestión, manteniendo el equilibrio entre costo, tiempo, calidad y riesgo.

---

## 📈 Métricas del Juego

El juego utiliza 5 métricas principales representadas como atributos RPG:

| Métrica | Inicial | Significado | Impacto |
|---------|---------|-------------|--------|
| **AP (Puntos de Acción)** | 12 | Tiempo disponible | Si llega a 0: Game Over (sin suficiente tiempo) |
| **HP (Salud/Presupuesto)** | $150,000 | Presupuesto del proyecto | Si llega a 0: Game Over (bancarrota) |
| **AC (Clase de Armadura/Calidad)** | 100 | Niveles de calidad del proyecto | Afecta satisfacción y éxito final |
| **Fallo Crítico** | 20% | Riesgo/Probabilidad de fallos | Puede dispararse en eventos problemáticos |
| **Avance Proyecto** | 0% | Progreso completado | Debe alcanzar 100% al final |

---

## 👥 Roles Disponibles

El juego permite configurar 3 integrantes del equipo con roles específicos:

### 1. **Director de Proyecto** 🎯
- **Descripción:** Lidera al equipo y toma decisiones estratégicas para alcanzar hitos.
- **Sesgo:** Prioriza el **avance** del proyecto
- **Probabilidades de decisión:** 50% principal, 30% neutra, 15% mediocre, 5% opuesta
- **Enfoque:** Mantener continuidad y momentum

### 2. **Gerente de Planificación** 📋
- **Descripción:** Garantiza uso eficiente del presupuesto y controla el cronograma.
- **Sesgo:** Prioriza **control** de costos, tiempo y reducción de riesgo
- **Enfoque:** Evitar desviaciones presupuestarias y de cronograma

### 3. **Líder de Calidad** ✨
- **Descripción:** Asegura altos estándares de calidad en todas las entregas.
- **Sesgo:** Prioriza **calidad** y satisfacción de stakeholders
- **Enfoque:** Mantener AC alto y controlar el riesgo

---

## ⚡ Fases del Proyecto (5 Etapas)

### **Fase 0: Configuración** ⚙️
Los jugadores crean su equipo ingresando nombres para cada rol. Esta es la preparación inicial.

### **Fase 1: Inicio** 🚀
- Primer encuentro con stakeholders
- Definición del alcance del proyecto
- Aparecen demandas inesperadas (ej: "¡Un Stakeholder Salvaje ha aparecido!")
- Decisiones impactan AC (calidad) y Fallo Crítico

### **Fase 2: Planificación** 📐
- Establecimiento de cronogramas y presupuestos
- Riesgos identificados
- Crucial para mantener HP y AP

### **Fase 3: Ejecución** 🔨
- Implementación de los entregables
- Mayor consumo de recursos
- Eventos pueden afectar directamente HP y AP

### **Fase 4: Monitoreo y Control** 👁️
- Seguimiento del progreso
- Control de desviaciones
- Oportunidad de ajustes correctivos

### **Fase 5: Cierre** 🎁
- Finalización del proyecto
- Evaluación de resultados
- Generación de veredicto final

---

## 🎲 Sistema de Decisiones

### Mecanismo de Votación
En eventos, los 3 miembros del equipo votan sobre qué decisión tomar:
- Cada rol tiene **sesgos propios** que influyen su voto
- El Director favorece **avance** (acción rápida)
- El Planificador favorece **control** (mitigación de riesgos)
- El Líder de Calidad favorece **calidad** (estándares altos)
- La decisión con más votos se ejecuta
- Los otros miembros pueden **apoyar** (positivo) u **oponerse** (negativo) a la decisión

### Impactos de Decisiones
Cada opción tiene etiquetas como:
- `[Ataque Agresivo]` - Riesgo alto, recompensa alta
- `[Control de Terreno]` - Defensivo, seguro
- `[Defensa Conservadora]` - Minimiza daño
- `[Hechizo de Calidad]` - Mejora AC
- `[Carisma de Gremio]` - Mejora alineación con stakeholders

---

## 🏆 Sistema de Puntuación Final

Al completar las 5 fases, el juego calcula un **puntaje del 0-100**:

```
Puntaje = (25 máx. del AP) + (25 máx. del HP) + (25 máx. del AC)
  + (25 máx. Anti-Riesgo) = 100 puntos
```

---

## 📊 Veredictos Finales

### ❌ **Bancarrota y Despido** (Puntaje 0)
- **Condición:** HP ≤ 0 O AP ≤ 0
- **Mensaje:** El proyecto fue inviable. Rescisión inmediata de contrato.

### 🏅 **Éxito Parcial** (Puntaje 70-84)
- Proyecto completado pero con compromisos
- Se lograron objetivos básicos

### ⭐ **Certificación PMP** (Puntaje ≥ 85)
- **Variantes según decisiones:**
  - Si usó metodología Ágil: *"Maestros de la Colcha"* 🧵
  - Enfoque tradicional: *"Arquitectos del Puzzle"* 🧩
- **Recompensa:** Desbloquea habilidades pasivas para futuras partidas
- **Logro:** Impecable historial corporativo

---

## 🎲 Características de Gameplay

### Sistema de Narrativa Dinámica
- Cada evento tiene una descripción temática estilo RPG
- Ejemplos: "¡Un Stakeholder Salvaje ha aparecido!", "¡Encuentro Salvaje!"
- Las decisiones se registran en un **histórico** para rastrear el camino del proyecto

### Historial de Decisiones
- Cada decisión queda registrada en el estado del juego
- Permite analizar el camino recorrido
- Afecta el veredicto final (ej: detección de metodología Ágil vs. tradicional)

### HUD (Interfaz de Usuario)
- Visualización de métricas en tiempo real
- Contador de fases completadas
- Log de acciones (ActionLog) 
- Carteleras de notificaciones (Toast messages)

### Sala del Consejo (Council Room)
- Interfaz de votación donde es visible el voto de cada rol
- Apoyo/Oposición de miembros visualizados
- Animaciones de decisión

---

## 🔧 Arquitectura Técnica

### Componentes Principales

1. **AgentEngine.js** - Motor de IA que genera comportamiento de roles
2. **useProjectEngine.js** - Hook React que maneja la lógica del juego
3. **Events.js** - Base de datos de eventos y decisiones
4. **Config.js** - Configuración inicial del juego
5. **Roles.js** - Definición de roles y comportamientos

### Pantallas del Flujo
1. **SetupScreen** - Creación de equipo
2. **GameScreen** - Gameplay principal
3. **EndScreen** - Resultado final

---

## 🎯 Lecciones de PMBOK Integradas

El juego enseña implícitamente:
- **Restricción Triple (Alcance-Tiempo-Costo):** Reflejada en AC, AP, HP
- **Gestión de Riesgos:** Métrica de Fallo Crítico
- **Stakeholder Management:** Eventos que demand cambios de alcance
- **Dinámica de Equipo:** Votación y diálogo entre roles
- **Balance en Decisiones:** No hay una solución "correcta", solo trade-offs

---

## 📝 Notas Finales

- El juego está desarrollado en **React** con **Vite**
- Usa **Tailwind CSS** para estilos
- Implementa un sistema de componentes reutilizables
- Estado centralizado para toda la lógica del juego
- Diseñado como actividad educativa de gestión de proyectos

Este simulador transforma conceptos complejos de PMBOK en un formato gamificado y accesible, permitiendo que los jugadores experimenten las consecuencias reales de sus decisiones gerenciales.
