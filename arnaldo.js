// arnaldo.js — la personalidad del bot: amable, profesional, respetuoso y cordial.
// Responde únicamente sobre el prode. Todas las frases rotan al azar.
// Para sumar frases, agregar a los arrays.

const pick = arr => arr[Math.floor(Math.random() * arr.length)]

// ── FIN DE PARTIDO ────────────────────────────────────────
const INTROS_FIN = [
  r => `📣 Finalizó ${r}. Les comparto cómo quedó cada uno:`,
  r => `✅ Resultado final: ${r}. Acá va el detalle por jugador:`,
  r => `📊 Partido terminado — ${r}. Estos son los puntos sumados:`,
  r => `🏁 Cerramos ${r}. Paso el reporte:`,
  r => `📋 Terminó ${r}. A continuación, los resultados de la jugada:`,
  r => `⚽ ${r}, final. Les comparto el detalle:`,
]

const GASTADAS_EXACTO = [
  ns => `⚡ ¡Felicitaciones a ${ns} por el resultado exacto!`,
  ns => `⚡ Resultado exacto de ${ns}. Excelente lectura del partido.`,
  ns => `⚡ ${ns}: pronóstico clavado. Un aplauso 👏`,
  ns => `⚡ Muy buen acierto exacto de ${ns}. Felicitaciones.`,
  ns => `⚡ ${ns} se llevó los 3 puntos del exacto. Bien jugado.`,
]

const NADIE_EXACTO = [
  `Esta vez nadie acertó el exacto. Quedará para la próxima.`,
  `Sin resultados exactos en este partido. A seguir intentando.`,
  `Ningún exacto esta vez. Mucha suerte en el próximo.`,
  `No hubo aciertos exactos. Será cuestión de afinar para el siguiente.`,
]

const SIN_PRONOSTICO = [
  (txt, n) => `📭 Sin pronóstico cargado (${n}): ${txt}. Recuerden completar a tiempo.`,
  (txt, n) => `📭 No registramos pronóstico de ${txt} (${n}).`,
  (txt, n) => `📭 Quedaron sin pronóstico (${n}): ${txt}. Los esperamos en la próxima.`,
]

const LIDER = [
  p => `👑 Lidera la tabla *${p.nombre}* con ${p.tot} puntos. ¡Felicitaciones!`,
  p => `👑 Puntero actual: *${p.nombre}* (${p.tot} pts). Muy bien jugado.`,
  p => `👑 *${p.nombre}* sigue al frente con ${p.tot} puntos.`,
  p => `👑 En la cima: *${p.nombre}* con ${p.tot} pts. A sostenerlo.`,
]

const CIERRES_FIN = [
  `Cualquier consulta, !ayuda. Buena jornada para todos.`,
  `Quedo a disposición. Saludos cordiales.`,
  `A seguir disfrutando del Mundial. 🙂`,
  `Gracias por participar. Nos vemos en el próximo partido.`,
  ``, ``, ``,  // a veces sin cierre, para no sobrecargar
]

// ── CAMBIO DE LÍDER EN VIVO ───────────────────────────────
const CAMBIO_LIDER = [
  (n, v) => `🚨 Atención: *${n}* pasa al frente de la tabla, superando a ${v}. ¡Felicitaciones!`,
  (n, v) => `🚨 Cambio en la punta: *${n}* es el nuevo líder. ${v} pasa al segundo lugar.`,
  (n, v) => `🚨 Nuevo puntero: *${n}*. Muy buena actuación. ${v} queda a la espera.`,
  (n, v) => `🚨 *${n}* asume el liderazgo de la tabla. Felicitaciones por el desempeño.`,
]

// ── ANÁLISIS PREVIO (20 min antes de cada partido) ────────
const INTROS_ANALISIS = [
  p => `⏰ En 20 minutos arranca *${p.equipo1} vs ${p.equipo2}*`,
  p => `⏰ En unos minutos arranca *${p.equipo1} vs ${p.equipo2}*`,
  p => `⚽ Ya casi arranca *${p.equipo1} vs ${p.equipo2}*`,
]

// ── CAPTIONS DE IMÁGENES ──────────────────────────────────
const CAPTIONS_OFICIAL = [
  `📊 Tabla oficial actualizada.`,
  `📊 Acá va la tabla oficial. Suerte a todos.`,
  `📊 Tabla oficial al día. Cualquier consulta, !ayuda.`,
  `📊 Posiciones oficiales actualizadas.`,
  ``,
]

const CAPTIONS_DIA = [`*Partidos del Día*`]

// ── RESUMEN NOCTURNO ──────────────────────────────────────
const INTROS_NOCTURNO = [
  f => `🌙 *Resumen del día ${f}*`,
  f => `🌙 Cierre de la jornada ${f}. Comparto el resumen:`,
  f => `🌙 Resumen de actividad del ${f}:`,
  f => `🌙 Detalle de la jornada (${f}):`,
]

const AMARGO = [
  n => `🥶 Día sin puntos para *${n}*. Mucha suerte mañana.`,
  n => `🥶 Jornada complicada para *${n}*. A confiar para la próxima.`,
  n => `🥶 *${n}* no sumó en el día. La revancha es mañana.`,
  n => `🥶 Sin acertar hoy, *${n}*. Que la próxima sea mejor.`,
]

// ── RECLAMO DE PRONÓSTICOS ────────────────────────────────
const INTROS_RECLAMO = [
  `🔔 Buen día. Les recuerdo que aún hay pronósticos pendientes de cargar.`,
  `🔔 Buenos días. Paso a recordar a quienes les falta completar sus pronósticos.`,
  `🔔 Buen día a todos. Pequeño recordatorio para los que tienen pronósticos pendientes.`,
  `🔔 Buenos días. Acá va el aviso amistoso para los que aún no cargaron todo.`,
]
const CIERRES_RECLAMO = [
  url => `Lo pueden completar en este link, es rápido:\n${url}`,
  url => `El link para cargar está acá:\n${url}`,
  url => `Acá pueden cargar sus pronósticos cuando puedan:\n${url}`,
  url => `Les dejo el link para completar:\n${url}`,
]
const PIROPOS_CUMPLIDORES = [
  ns => `Un gracias especial a ${ns} por haber completado todo a tiempo. 👍`,
  ns => `Mención para ${ns}, que ya cumplieron con sus 72 pronósticos. Muchas gracias.`,
  ns => `Felicitaciones a ${ns} por la prolijidad: tienen todo cargado. 🙂`,
  ns => `${ns}: gracias por estar al día con los pronósticos.`,
]

// ── CHARLA: cuando lo nombran ─────────────────────────────
// Apodos que lo despiertan (palabra completa, no distingue mayúsculas)
const ALIAS_RE = /\b(arnaldo|arnal|arnaldito|don arnaldo|sr\.? arnaldo|se[ñn]or arnaldo)\b/i

// Arnaldo solo responde sobre el prode. Cualquier mención se contesta con
// cortesía y se redirige al uso de comandos. Sin coqueteos, sin temas externos.

const SALUDOS = [
  n => `Buenas, ${n}. ¿En qué puedo ayudarlo? Puede ver los comandos con *!ayuda*.`,
  n => `Hola ${n}, a sus órdenes. Para ver qué puedo hacer, escriba *!ayuda*.`,
  n => `Buenas, ${n}. Estoy para ayudarlo con el prode. *!ayuda* muestra todos los comandos disponibles.`,
  n => `Hola ${n}. Para ver los partidos del día escriba *!hoy*; el listado completo, *!ayuda*.`,
  n => `A sus órdenes, ${n}. Cualquier consulta sobre el prode, acá estoy. Pruebe con *!ayuda*.`,
  n => `Buenas, ${n}. ¿Quiere ver los partidos de hoy (*!hoy*), las chances (*!chances*), o el listado completo (*!ayuda*)?`,
]

const SEGUNDAS = [
  n => `Disculpe ${n}, solo puedo ayudarlo con temas del prode. ¿Necesita la tabla, los partidos del día, o algo puntual?`,
  n => `Le pido disculpas, ${n}, pero mi función se limita al prode. ¿En qué le puedo ser útil al respecto?`,
  n => `${n}, con gusto lo ayudo en lo que tenga que ver con el prode. Para todo lo demás, no soy el más indicado. 🙂`,
  n => `Gracias por la charla, ${n}, pero prefiero mantenerme en lo nuestro: el prode. ¿Le sirve la tabla o los partidos de hoy?`,
  n => `${n}, mejor me quedo en lo mío que es el prode. Si necesita resultados, tabla o pronósticos, estoy a disposición.`,
]

const DESPEDIDAS = [
  n => `Cualquier otra consulta sobre el prode, acá estoy, ${n}. Saludos cordiales.`,
  n => `Lo dejo, ${n}. Si necesita algo del prode más tarde, no dude en escribirme. 🙂`,
  n => `Gracias por el saludo, ${n}. Quedo atento a cualquier consulta del prode.`,
  n => `A seguir disfrutando del Mundial, ${n}. Cualquier cosa, me avisa.`,
]

// ── API del módulo ────────────────────────────────────────
const juntarNombres = ns => ns.length === 1 ? `*${ns[0]}*` :
  ns.slice(0, -1).map(n => `*${n}*`).join(', ') + ' y *' + ns[ns.length - 1] + '*'

module.exports = {
  pick,

  introFin: resTxt => pick(INTROS_FIN)(resTxt),

  gastadaExactos: nombres => pick(GASTADAS_EXACTO)(juntarNombres(nombres)),

  nadieExacto: () => pick(NADIE_EXACTO),

  sinPronostico: nombres => {
    const txt = nombres.length <= 4 ? nombres.join(', ') : nombres.slice(0, 3).join(', ') + ' y otros'
    return pick(SIN_PRONOSTICO)(txt, `x${nombres.length}`)
  },

  lider: p => pick(LIDER)(p),

  cierreFin: () => pick(CIERRES_FIN),

  cambioLider: (nuevo, viejo) => pick(CAMBIO_LIDER)(nuevo, viejo),

  racha: (nombre, n) => `🔥 *${nombre}* lleva ${n} exactos al hilo. Excelente racha.`,

  analisisPartido: (partido, jugadores, pronosticos) => {
    const grupos = {}
    for (const j of jugadores) {
      const pr = pronosticos.find(x => x.jugador_id === j.id && x.partido_id === partido.id)
      if (!pr || pr.goles1 === null) continue
      const key = `${pr.goles1}-${pr.goles2}`
      if (!grupos[key]) grupos[key] = []
      grupos[key].push(j.nombre)
    }
    const ordenados = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length)
    const lines = [pick(INTROS_ANALISIS)(partido), '', '📋 Pronósticos cargados:']
    for (const [marcador, nombres] of ordenados) lines.push(`*${marcador}* → ${nombres.join(', ')}`)
    return lines.join('\n')
  },

  captionOficial: () => pick(CAPTIONS_OFICIAL),

  captionDia: () => pick(CAPTIONS_DIA),

  gol: (eq1, g1, eq2, g2) => `Gol: ${eq1} ${g1} ${eq2} ${g2}`,

  arranco: (eq1, eq2) => `🟢 ¡Comienza *${eq1}* vs *${eq2}*! Acá va la tabla parcial (NO oficial), arranca 0-0:`,

  // ¿El texto menciona a Arnaldo por alguno de sus apodos?
  esMencion: texto => ALIAS_RE.test(texto),

  // Charla con ida y vuelta cortés: turno 1 saluda y redirige, turno 2 vuelve a encauzar al prode,
  // turno 3 cierra amablemente. Arnaldo NO entra en temas que no sean del prode.
  charla: (texto, turno, nombre) => {
    const n = nombre || 'estimado'
    if (turno >= 3) return pick(DESPEDIDAS)(n)
    if (turno === 1) return pick(SALUDOS)(n)
    return pick(SEGUNDAS)(n)
  },

  reclamo: (sinNada, incompletos, completos, url) => {
    const lines = [pick(INTROS_RECLAMO), '']
    if (sinNada.length) lines.push(`📝 Aún no cargaron sus pronósticos: *${sinNada.join(', ')}*`)
    if (incompletos.length) lines.push(`🧮 Pronósticos a medio cargar: ${incompletos.map(x => `*${x.nombre}* (${x.done}/72)`).join(', ')}`)
    lines.push('', pick(CIERRES_RECLAMO)(url))
    if (completos.length) lines.push('', pick(PIROPOS_CUMPLIDORES)(completos.join(', ')))
    return lines.join('\n')
  },

  // Anuncio puntual de las 3 formas de cargar + edición (se dispara con !novedades)
  novedades: url => [
    '📢 *Aviso del prode — formas de cargar pronósticos*',
    '',
    'Buenas a todos. Les comparto las tres formas disponibles para cargar el prode: el *código de siempre*, *directo en la web* o bajándose un *archivo Excel* para completar tranquilo en la computadora y subirlo.',
    '',
    'Si se equivocaron en algún resultado, pueden pegar nuevamente su código, editar lo que necesiten y volver a enviarlo. *No se duplican datos*: el sistema los reconoce por el nombre aunque entren desde otro dispositivo.',
    '',
    'Los pronósticos de cada uno son *privados*: nadie ve los del resto.',
    '',
    `A cargar que el Mundial no espera 👉 ${url}`,
    '',
    'Saludos cordiales.',
  ].join('\n'),

  resumenNocturno: (fecha, partidosDia, stats) => {
    const f = new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    const lines = [pick(INTROS_NOCTURNO)(f), '']
    lines.push(`⚽ Se jugaron: ${partidosDia.map(p => `${p.equipo1} ${p.goles1}-${p.goles2} ${p.equipo2}`).join(' · ')}`, '')
    const conPts = stats.filter(s => s.pts > 0)
    if (conPts.length) {
      const podio = ['🥇', '🥈', '🥉']
      lines.push(`*Los del día:*`)
      conPts.slice(0, 3).forEach((s, i) => lines.push(`${podio[i]} ${s.nombre} +${s.pts}${s.ex > 0 ? ` (⚡${s.ex} exacto${s.ex > 1 ? 's' : ''})` : ''}`))
    } else {
      lines.push(`Hoy nadie sumó puntos. A confiar para mañana.`)
    }
    const amargos = stats.filter(s => s.pts === 0 && s.fail > 0)
    if (amargos.length) lines.push('', pick(AMARGO)(amargos[amargos.length - 1].nombre))
    lines.push('', `Buenas noches. Mañana hay más partidos. Saludos cordiales.`)
    return lines.join('\n')
  },
}
