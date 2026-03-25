// src/engine/AgentEngine.js
import { ROLES } from "../constants/Roles.js";

export class AgentEngine {
  constructor(currentState) {
    this.state = currentState;
  }

  // Define qué parte del estado "ve" cada rol para tomar su decisión
  getPartialView(rolId) {
    const state = this.state || {};

    switch (rolId) {
      case ROLES.DIRECTOR:
        return {
          tiempo: state.tiempoRestante,
          satisfaccion: state.satisfaccionStakeholders,
          riesgo: state.riesgoProyecto,
        };
      case ROLES.PLANIFICACION:
        return {
          presupuesto: state.presupuestoRestante,
          riesgo: state.riesgoProyecto,
          tiempo: state.tiempoRestante,
        };
      case ROLES.CALIDAD:
        return {
          calidad: state.calidadProyecto,
          satisfaccion: state.satisfaccionStakeholders,
          riesgo: state.riesgoProyecto,
        };
      default:
        return state;
    }
  }

  // Obtiene el valor esperado de un impacto (considera riesgo oculto estocástico)
  _getExpectedImpact(impactoMetrica) {
    // Si el impacto es un número simple (formato antiguo), retornarlo directamente
    if (typeof impactoMetrica === "number") {
      return impactoMetrica;
    }

    // Si es un objeto con estructura estocástica
    if (impactoMetrica && typeof impactoMetrica === "object") {
      const base = impactoMetrica.base || 0;
      const riesgoOculto = impactoMetrica.riesgoOculto;

      if (riesgoOculto && riesgoOculto.prob && riesgoOculto.extra) {
        // Valor esperado = base + (probabilidad * impacto_extra)
        return base + riesgoOculto.prob * riesgoOculto.extra;
      }

      return base;
    }

    return 0;
  }

  // Obtiene los pesos de utilidad para cada rol
  _getUtilityWeights(rolId) {
    const weights = {
      [ROLES.DIRECTOR]: {
        tiempo: 2.0,
        presupuesto: 0.0001, // Normalizado por escala monetaria
        calidad: 0.5,
        riesgo: -1.0,
        satisfaccion: 1.5,
      },
      [ROLES.PLANIFICACION]: {
        tiempo: 1.5,
        presupuesto: 0.0002, // Mayor peso al presupuesto
        calidad: 0.3,
        riesgo: -2.0, // Alta aversión al riesgo
        satisfaccion: 0.5,
      },
      [ROLES.CALIDAD]: {
        tiempo: 0.5,
        presupuesto: 0.00005,
        calidad: 2.5, // Mayor peso a calidad
        riesgo: -1.5,
        satisfaccion: 2.0,
      },
    };

    return weights[rolId] || weights[ROLES.DIRECTOR];
  }

  // Calcula la utilidad esperada de una opción para un rol específico
  evaluateExpectedUtility(opcion, rolId) {
    if (!opcion || !opcion.impactos) return 0;

    const weights = this._getUtilityWeights(rolId);
    const impactos = opcion.impactos;
    let utilidadEsperada = 0;

    // Factor de aversión al riesgo para planificación cuando presupuesto < 30,000
    const factorAversionPresupuesto =
      rolId === ROLES.PLANIFICACION && this.state.presupuestoRestante < 30000
        ? 3.0
        : 1.0;

    // Calcular utilidad esperada para cada métrica
    Object.keys(impactos).forEach((metrica) => {
      const valorEsperado = this._getExpectedImpact(impactos[metrica]);
      const peso = weights[metrica] || 0;

      // Aplicar factor de aversión al riesgo en penalizaciones de presupuesto
      if (metrica === "presupuesto" && valorEsperado < 0) {
        utilidadEsperada += valorEsperado * peso * factorAversionPresupuesto;
      } else {
        utilidadEsperada += valorEsperado * peso;
      }
    });

    // Bonus por etiquetas alineadas con el sesgo del rol
    const rolSesgo = this._getRolBias(rolId);
    if (opcion.etiquetas) {
      if (opcion.etiquetas.includes(rolSesgo.principal)) utilidadEsperada += 10;
      if (opcion.etiquetas.includes(rolSesgo.secundario)) utilidadEsperada += 5;
      if (opcion.etiquetas.includes(rolSesgo.contrario)) utilidadEsperada -= 8;
    }

    return utilidadEsperada;
  }

  _getRolBias(rolId) {
    const biases = {
      [ROLES.DIRECTOR]: {
        principal: "equilibrada",
        secundario: "orientada_a_stakeholders",
        contrario: "burocratica",
      },
      [ROLES.PLANIFICACION]: {
        principal: "orientada_a_control",
        secundario: "conservadora",
        contrario: "agresiva",
      },
      [ROLES.CALIDAD]: {
        principal: "orientada_a_calidad",
        secundario: "orientada_a_stakeholders",
        contrario: "orientada_a_costo",
      },
    };
    return biases[rolId] || biases[ROLES.DIRECTOR];
  }

  // Emite un voto basado en utilidad esperada, con 15% de error humano
  emitirVoto(opciones, rolId) {
    if (!opciones || opciones.length === 0) {
      return {
        opcionElegida: null,
        razonamiento: "No hay opciones disponibles",
      };
    }

    // Calcular utilidad esperada para cada opción
    const scoredOptions = opciones
      .map((opt, index) => ({
        ...opt,
        originalIndex: index,
        utilidadEsperada: this.evaluateExpectedUtility(opt, rolId),
      }))
      .sort((a, b) => b.utilidadEsperada - a.utilidadEsperada);

    // Probabilidad de error humano: 15%
    const errorHumano = Math.random() < 0.15;
    let opcionElegida;
    let razonamiento;

    if (errorHumano && scoredOptions.length > 1) {
      // Error humano: elegir la segunda mejor opción
      opcionElegida = scoredOptions[1];
      razonamiento = `Error de juicio: eligió una opción subóptima (segunda mejor) debido a sesgos cognitivos.`;
    } else {
      // Decisión racional: elegir la mejor opción
      opcionElegida = scoredOptions[0];
      razonamiento = `Decisión racional basada en maximizar utilidad esperada (${opcionElegida.utilidadEsperada.toFixed(2)}).`;
    }

    return {
      opcionElegida,
      razonamiento,
      utilidadCalculada: opcionElegida.utilidadEsperada,
      todasLasUtilidades: scoredOptions.map((o) => ({
        texto: o.texto.substring(0, 50) + "...",
        utilidad: o.utilidadEsperada.toFixed(2),
      })),
    };
  }

  // Resuelve los impactos estocásticos (ejecuta el "dado" para riesgos ocultos)
  resolverImpactosEstocasticos(opcion) {
    if (!opcion || !opcion.impactos) return opcion.impactos;

    const impactosResueltos = {};
    const riesgosActivados = [];

    Object.keys(opcion.impactos).forEach((metrica) => {
      const impacto = opcion.impactos[metrica];

      // Si es formato simple (número), usar directamente
      if (typeof impacto === "number") {
        impactosResueltos[metrica] = impacto;
        return;
      }

      // Si es formato estocástico
      if (impacto && typeof impacto === "object") {
        let valorFinal = impacto.base || 0;

        // Verificar si se activa el riesgo oculto
        if (impacto.riesgoOculto && impacto.riesgoOculto.prob) {
          const seActiva = Math.random() < impacto.riesgoOculto.prob;
          if (seActiva) {
            valorFinal += impacto.riesgoOculto.extra || 0;
            riesgosActivados.push({
              metrica,
              extra: impacto.riesgoOculto.extra,
              probabilidad: impacto.riesgoOculto.prob,
            });
          }
        }

        impactosResueltos[metrica] = valorFinal;
      }
    });

    return {
      impactos: impactosResueltos,
      riesgosActivados,
    };
  }

  // Método legacy para compatibilidad
  decide(opciones, rolId) {
    return this.emitirVoto(opciones, rolId);
  }
}
