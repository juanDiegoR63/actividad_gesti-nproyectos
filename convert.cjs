
const { baseDatos } = require('./src/data.js');
const fs = require('fs');

const ETIQUETAS = {
  CONSERVADORA: 'conservadora',
  AGRESIVA: 'agresiva',
  CALIDAD: 'orientada_a_calidad',
  CONTROL: 'orientada_a_control',
  EQUILIBRADA: 'equilibrada',
  STAKEHOLDERS: 'orientada_a_stakeholders',
  RIESGO: 'arriesgada'
};

const mapFase = (rawEvents, faseKey, defaultRoles) => {
  return rawEvents.map((ev, i) => {
    const opcionesConEtiquetas = ev.opciones.map(opt => {
      let tags = [];
      if (opt.presupuesto > 0 || opt.riesgo < 0) tags.push(ETIQUETAS.CONTROL, ETIQUETAS.CONSERVADORA);
      if (opt.tiempo < 0 || opt.riesgo > 0) tags.push(ETIQUETAS.AGRESIVA);
      if (opt.calidad > 0 || opt.satisfaccion > 0) tags.push(ETIQUETAS.CALIDAD, ETIQUETAS.STAKEHOLDERS);
      if (tags.length === 0) tags.push(ETIQUETAS.EQUILIBRADA);
      return { texto: opt.texto, etiquetas: tags, impactos: { tiempo: opt.tiempo||0, presupuesto: opt.presupuesto||0, calidad: opt.calidad||0, riesgo: opt.riesgo||0, satisfaccion: opt.satisfaccion||0 }};
    });
    
    return {
      id: ev.id,
      fase: faseKey,
      rol: defaultRoles[i % defaultRoles.length],
      titulo: ev.texto,
      descripcion: ev.texto,
      opciones: opcionesConEtiquetas
    };
  });
};

const ROLES = ['director', 'planificacion', 'calidad'];
const newEvents = [
  ...mapFase(baseDatos.inicio || [], 'inicio', ROLES),
  ...mapFase(baseDatos.planificacion || [], 'planificacion', ROLES),
  ...mapFase(baseDatos.ejecucion || [], 'ejecucion', ROLES),
  ...mapFase(baseDatos.monitoreo || [], 'monitoreo', ROLES)
];

const outContent = 'import { ROLES, ETIQUETAS } from \'../constants/Roles\';\n\n' +
'export const eventoFase = (fase) => {\n' +
'  return baseDatos.eventos.filter(e => e.fase === fase);\n' +
'}\n\n' +
'export const deciderOpcionAutomatica = (opciones, rolId) => {\n' +
'  const prob = Math.random();\n' +
'  const rolDef = {\n' +
'    director: { sesgo: ETIQUETAS.EQUILIBRADA, backup: ETIQUETAS.AGRESIVA },\n' +
'    planificacion: { sesgo: ETIQUETAS.CONTROL, backup: ETIQUETAS.CONSERVADORA },\n' +
'    calidad: { sesgo: ETIQUETAS.CALIDAD, backup: ETIQUETAS.STAKEHOLDERS }\n' +
'  };\n' +
'  \n' +
'  const sesgoPrincipal = rolDef[rolId].sesgo;\n' +
'  const sesgoSecundario = rolDef[rolId].backup;\n' +
'  \n' +
'  if (prob < 0.5) {\n' +
'    const opts = opciones.filter(o => o.etiquetas && o.etiquetas.includes(sesgoPrincipal));\n' +
'    if (opts.length > 0) return opts[Math.floor(Math.random() * opts.length)];\n' +
'  } else if (prob < 0.8) {\n' +
'    const opts = opciones.filter(o => o.etiquetas && o.etiquetas.includes(sesgoSecundario));\n' +
'    if (opts.length > 0) return opts[Math.floor(Math.random() * opts.length)];\n' +
'  }\n' +
'  \n' +
'  return opciones[Math.floor(Math.random() * opciones.length)];\n' +
'};\n\n' +
'export const baseDatos = {\n' +
'  fases: [\n' +
'    { id: 0, titulo: \'Configuración\', clave: \'config\' },\n' +
'    { id: 1, titulo: \'Fase 1: Inicio\', clave: \'inicio\' },\n' +
'    { id: 2, titulo: \'Fase 2: Planificación\', clave: \'planificacion\' },\n' +
'    { id: 3, titulo: \'Fase 3: Ejecución\', clave: \'ejecucion\' },\n' +
'    { id: 4, titulo: \'Fase 4: Monitoreo y Control\', clave: \'monitoreo\' },\n' +
'    { id: 5, titulo: \'Fase 5: Cierre\', clave: \'cierre\' }\n' +
'  ],\n' +
'  eventos: ' + JSON.stringify(newEvents, null, 2) + '\n' +
'};\n';

fs.writeFileSync('src/data/Events.js', outContent);

