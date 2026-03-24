// src/engine/AgentEngine.js
import ROLES from "../constants/Roles.js";

export class AgentEngine {
  constructor(currentState) {
    this.state = currentState;
  }

  // Define qué parte del estado "ve" cada rol para tomar su decisión
  getPartialView(rolId) {
    const { metrics } = this.state || {}; // Assume metrics exist in state
    if (!metrics) return {};

    switch (rolId) {
      case ROLES.DIRECTOR_PROYECTO:
        return {
          progreso: metrics.progreso,
          tiempo: metrics.tiempo,
          continuidad: metrics.continuidad,
        };
      case ROLES.PLANIFICACION_CONTROL:
        return {
          presupuesto: metrics.presupuesto,
          riesgo: metrics.riesgo,
          tiempo: metrics.tiempo,
        };
      case ROLES.INTERESADOS_CALIDAD:
        return {
          calidad: metrics.calidad,
          satisfaccion: metrics.satisfaccion,
          aceptacion: metrics.aceptacion,
        };
      default:
        return metrics;
    }
  }

  evaluateOptionForRole(option, rolId) {
    const view = this.getPartialView(rolId) || {};
    let perceivedValue = 0;

    Object.keys(view).forEach((metric) => {
      if (option.impactos && option.impactos[metric]) {
        perceivedValue += option.impactos[metric];
      }
    });

    const rolSesgo = this._getRolBias(rolId);
    if (option.etiquetas) {
      if (option.etiquetas.includes(rolSesgo.principal)) perceivedValue += 15;
      if (option.etiquetas.includes(rolSesgo.secundario)) perceivedValue += 5;
      if (option.etiquetas.includes(rolSesgo.contrario)) perceivedValue -= 10;
    }

    return perceivedValue;
  }

  _getRolBias(rolId) {
    const biases = {
      [ROLES.DIRECTOR_PROYECTO]: {
        principal: "equilibrada",
        secundario: "preventiva",
        contrario: "burocratica",
      },
      [ROLES.PLANIFICACION_CONTROL]: {
        principal: "orientada_a_control",
        secundario: "conservadora",
        contrario: "agresiva",
      },
      [ROLES.INTERESADOS_CALIDAD]: {
        principal: "orientada_a_calidad",
        secundario: "orientada_a_stakeholders",
        contrario: "orientada_a_costo",
      },
    };
    return biases[rolId] || biases[ROLES.DIRECTOR_PROYECTO];
  }

  decide(opciones, rolId) {
    const scoredOptions = opciones
      .map((opt) => ({
        ...opt,
        score: this.evaluateOptionForRole(opt, rolId),
      }))
      .sort((a, b) => b.score - a.score);

    const rand = Math.random() * 100;
    let chosenIndex = 0;
    let fallbackRaison = "";

    if (rand <= 50) {
      chosenIndex = 0;
      fallbackRaison = "Decidió basándose fuertemente en su sesgo principal.";
    } else if (rand <= 80 && scoredOptions.length > 1) {
      chosenIndex = Math.floor(scoredOptions.length / 2);
      fallbackRaison =
        "Optó por una aproximación intermedia, evitando extremos.";
    } else if (rand <= 95 && scoredOptions.length > 2) {
      chosenIndex = scoredOptions.length - 1;
      fallbackRaison =
        "Tomó una decisión muy perjudicial debido a una visión limitada del contexto.";
    } else {
      chosenIndex = Math.floor(Math.random() * scoredOptions.length);
      fallbackRaison =
        "Respondió de forma atípica, ignorando parte de sus propios lineamientos.";
    }

    return {
      opcionElegida: scoredOptions[chosenIndex],
      razonamiento: fallbackRaison,
    };
  }
}
