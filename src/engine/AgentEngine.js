// src/engine/AgentEngine.js
import { ROLES } from "../constants/Roles.js";
import { METRICAS_INICIALES } from "../data/Config.js";

export class AgentEngine {
  constructor(currentState) {
    this.state = currentState;
    // Añadir personalidad aleatoria al inicializar
    this.agresividad = Math.random(); // 0 a 1
    this.aversidadRiesgo = Math.random(); // 0 a 1
  }

  // Define qué parte del estado "ve" cada rol para tomar su decisión
  getPartialView(rolId) {
    const state = this.state || {};

    switch (rolId) {
      case ROLES.DIRECTOR:
        return {
          ap: state.ap,
          falloCritico: state.falloCritico,
        };
      case ROLES.PLANIFICACION:
        return {
          hp: state.hp,
          falloCritico: state.falloCritico,
          ap: state.ap,
        };
      case ROLES.CALIDAD:
        return {
          ac: state.ac,
          falloCritico: state.falloCritico,
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
  _getUtilityWeights(rolId, currentState) {
    const baseBudget = METRICAS_INICIALES.hp; // Presupuesto inicial para normalizar

    let weights = {
      [ROLES.DIRECTOR]: {
        ap: 2.0,
        hp: 15 / baseBudget, // Equivalent to 15 / 150000 = 0.0001
        ac: 0.5,
        falloCritico: -1.0,
      },
      [ROLES.PLANIFICACION]: {
        ap: 1.5,
        hp: 30 / baseBudget, // Equivalent to 30 / 150000 = 0.0002
        ac: 0.3,
        falloCritico: -2.0, // Alta aversión al riesgo
      },
      [ROLES.CALIDAD]: {
        ap: 0.5,
        hp: 7.5 / baseBudget, // Equivalent to 7.5 / 150000 = 0.00005
        ac: 2.5, // Mayor peso a calidad
        falloCritico: -1.5,
      },
    };

    let w = weights[rolId] || weights[ROLES.DIRECTOR];

    // Lógica de supervivencia
    // Si HP (presupuesto) es muy bajo (<20%), todos priorizan presupuesto
    const MAX_HP = baseBudget;
    if (currentState && currentState.hp < MAX_HP * 0.2) {
      w.hp *= 5.0; // Multiplicar drásticamente el peso del hp
    }

    // Si AC es muy bajo, Calidad entra en pánico
    if (rolId === ROLES.CALIDAD && currentState && currentState.ac < 40) {
      w.ac *= 3.0;
    }

    return w;
  }

  // Calcula la utilidad esperada de una opción para un rol específico
  evaluateExpectedUtility(opcion, rolId) {
    if (!opcion || !opcion.impactos) return 0;

    const weights = this._getUtilityWeights(rolId, this.state);
    const impactos = opcion.impactos;
    let utilidadEsperada = 0;

    // Factor de aversión al riesgo para planificación cuando presupuesto < 30,000
    const factorAversionPresupuesto =
      rolId === ROLES.PLANIFICACION && this.state.hp < 30000 ? 3.0 : 1.0;

    // Calcular utilidad esperada para cada métrica
    Object.keys(impactos).forEach((metrica) => {
      const valorEsperado = this._getExpectedImpact(impactos[metrica]);
      const peso = weights[metrica] || 0;

      // Aplicar factor de aversión al riesgo en penalizaciones de presupuesto
      if (metrica === "hp" && valorEsperado < 0) {
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
        principal: "[Postura Equilibrada]",
        secundario: "[Carisma de Gremio]",
        contrario: "burocratica",
      },
      [ROLES.PLANIFICACION]: {
        principal: "[Control de Terreno]",
        secundario: "[Defensa Conservadora]",
        contrario: "[Ataque Agresivo]",
      },
      [ROLES.CALIDAD]: {
        principal: "[Hechizo de Calidad]",
        secundario: "[Carisma de Gremio]",
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

    // Probabilidad de error humano dependiente de agresividad
    const errorHumano = Math.random() < 0.1 + this.agresividad * 0.1;
    let opcionElegida;
    let razonamiento;

    if (errorHumano && scoredOptions.length > 1) {
      // Error humano: elegir la segunda mejor opción
      opcionElegida = scoredOptions[1];
      razonamiento = `Error de juicio por exceso de agresividad/estrés. Toma opción subóptima.`;
    } else {
      // Decisión racional: elegir la mejor opción
      opcionElegida = scoredOptions[0];

      const metricaFuerte = Object.keys(opcionElegida.impactos).reduce(
        (a, b) =>
          this._getExpectedImpact(opcionElegida.impactos[a]) >
          this._getExpectedImpact(opcionElegida.impactos[b])
            ? a
            : b,
      );

      razonamiento = `Busca maximizar la utilidad (${opcionElegida.utilidadEsperada.toFixed(1)}), favoreciendo el impacto en ${metricaFuerte}.`;
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

  // Nueva función de mitigación (Armadura)
  mitigarDanio(dañoBase, ac) {
    if (dañoBase >= 0) return dañoBase; // No es daño
    const multiplicador = 100 / (100 + ac);
    return Math.round(dañoBase * multiplicador);
  }

  // Resuelve los impactos estocásticos (ejecuta el "dado" para riesgos ocultos)
  resolverImpactosEstocasticos(
    opcion,
    nivelFalloCriticoActual = this.state.falloCritico,
  ) {
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

        // Verificar si se activa el riesgo oculto usando D20
        if (impacto.riesgoOculto && impacto.riesgoOculto.prob != null) {
          const tiradaD20 = Math.floor(Math.random() * 20) + 1;
          const umbralFallo = nivelFalloCriticoActual / 5; // Escalado de 100% a D20

          if (tiradaD20 <= umbralFallo) {
            console.warn(
              `🎲 ¡Fallo Crítico detectado! (Tirada: ${tiradaD20} vs Umbral: ${umbralFallo})`,
            );
            valorFinal += impacto.riesgoOculto.extra || 0;
            riesgosActivados.push({
              metrica,
              extra: impacto.riesgoOculto.extra,
              d20: tiradaD20,
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
}
