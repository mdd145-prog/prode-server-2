// silvina.js — la personalidad del bot: irónica, chismosa y con memoria de elefanta.
// Todas las frases rotan al azar. Para sumar frases, agregar a los arrays.

const pick = arr => arr[Math.floor(Math.random() * arr.length)]

// ── FIN DE PARTIDO ────────────────────────────────────────
const INTROS_FIN = [
  r => `💅 *Chisme urgente:* terminó ${r}`,
  r => `🗞 *Última hora, no lo van a poder creer:* ${r}`,
  r => `👀 Bueno, bueno, bueno... ${r}. Les cuento cómo quedó cada uno:`,
  r => `🍵 Cebate un mate que terminó ${r} y tengo TODA la data:`,
  r => `📢 Silvina informa: ${r}. Ahora vienen los llantos:`,
  r => `💬 Yo no soy de contar cosas, pero terminó ${r} y...`,
]

const GASTADAS_EXACTO = [
  ns => `⚡ ${ns} la clavó${ns.includes(' y ') ? 'ron' : ''}. ¿Sabía${ns.includes(' y ') ? 'n' : ''} algo? Yo solo pregunto 👀`,
  ns => `⚡ Exacto de ${ns}. Demasiada puntería para ser casualidad, digo yo...`,
  ns => `⚡ ${ns} embocó el resultado justo. Después la chismosa soy yo.`,
  ns => `⚡ Aplausos para ${ns} 👏 (los demás tomen nota, que cuesta poco)`,
]

const NADIE_EXACTO = [
  `Nadie le embocó al exacto. Nivel general: espantoso 💅`,
  `Cero exactos. Menos mal que esto era de expertos en fútbol...`,
  `Ni uno la pegó justa. Yo hubiera acertado, pero no me dejan jugar.`,
  `Exactos: ninguno. Chicos, esto lo arregla cualquiera de mis amigas.`,
]

const SIN_PRONOSTICO = [
  (txt, n) => `😴 Sin pronóstico (${n}): ${txt}. Gracias por donar los puntos, amores.`,
  (txt, n) => `😴 ${txt} ni pronosticaron (${n}). Después no lloren en el grupo.`,
  (txt, n) => `😴 Los ausentes de siempre (${n}): ${txt}. Yo nomás aviso.`,
]

const LIDER = [
  p => `👑 Arriba de todos sigue *${p.nombre}* con ${p.tot}pts. Insoportable se va a poner...`,
  p => `👑 Puntero: *${p.nombre}* (${p.tot}pts). Disfrutalo ahora que esto es largo, eh.`,
  p => `👑 *${p.nombre}* manda con ${p.tot}pts. Ya lo veo capturando la tabla para el estado.`,
]

const CIERRES_FIN = [
  `Yo no opino, solo muestro los números 💅`,
  `Mañana más chismes. Besitos.`,
  `Si alguien se enoja, recuerden: yo solo soy la mensajera.`,
  ``, ``, ``,  // a veces sin cierre, para no empalagar
]

// ── CAMBIO DE LÍDER EN VIVO ───────────────────────────────
const CAMBIO_LIDER = [
  (n, v) => `🚨 *ÚLTIMO MOMENTO:* ${n} acaba de sacarle la punta a ${v}. Yo no digo nada, pero el grupo está que arde 🔥`,
  (n, v) => `🚨 *Se pudrió todo:* ${n} pasó a ${v} en la tabla. Lo que es no pronosticar cualquier cosa, ¿no ${v}?`,
  (n, v) => `🚨 Atenti: nuevo puntero *${n}*. ${v}, te corrieron del trono. Lo lamento (mentira).`,
]

// ── PREVIA DE PARTIDO ─────────────────────────────────────
const INTROS_PREVIA = [
  `👀 *Ya arranca y les cuento qué pronosticó cada uno* (para que sepan a quién cargar después):`,
  `🍿 Se viene partido. Esto pusieron los genios del grupo:`,
  `⏰ En un ratito arranca. Vayan calentando que esto dijeron:`,
  `📋 La previa de Silvina — miren lo que pronosticaron y juzguen ustedes:`,
]

const PREVIA_NADIE = [
  `(nadie pronosticó este... valientes 😴)`,
  `(cero pronósticos acá, ni se gastaron)`,
]

// ── CAPTIONS DE IMÁGENES ──────────────────────────────────
const CAPTIONS_OFICIAL = [
  `📊 La tabla oficial, certificada por mí. Reclamos al de arriba.`,
  `📊 Acá está la tabla. Algunos mejor ni la miren 💅`,
  `📊 Tabla oficial actualizada. Sin trampas, yo vigilo todo.`,
  `📊 La tabla. Yo solo digo que hay gente muy verde acá abajo...`,
  ``,
]

const CAPTIONS_DIA = [
  `☀️ Buen día mis amores. Esto se juega hoy — vayan repasando sus papelones anticipados:`,
  `☀️ Arriba que hay fútbol. Los partidos de hoy y lo que pronosticó cada uno:`,
  `☀️ Buen día. Hoy juegan estos. Silvina ya tiene el mate listo 🧉`,
]

// ── RESUMEN NOCTURNO ──────────────────────────────────────
const INTROS_NOCTURNO = [
  f => `🌙 *El resumen nocturno de Silvina* — ${f}`,
  f => `🌙 Antes de dormir, el chisme completo del día (${f}):`,
  f => `🌙 Cierre del día ${f}. Hubo de todo, agárrense:`,
]

const AMARGO = [
  n => `🥶 El amargo del día: *${n}*. Ni una pegó, pobre.`,
  n => `🥶 Día para el olvido de *${n}*. Mañana será otro día (o no).`,
  n => `🥶 *${n}*, hoy mejor ni abras el grupo. Beso.`,
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

  racha: (nombre, n) => `🔥 *${nombre}* lleva ${n} exactos al hilo. Frenenló.`,

  previa: (partidos, jugadores, pronosticos) => {
    const lines = [pick(INTROS_PREVIA), '']
    for (const p of partidos) {
      lines.push(`⚽ *${p.equipo1} vs ${p.equipo2}* — ${p.hora}hs`)
      const preds = jugadores
        .map(j => ({ j, pr: pronosticos.find(x => x.jugador_id === j.id && x.partido_id === p.id) }))
        .filter(x => x.pr && x.pr.goles1 !== null)
        .map(x => `${x.j.nombre} ${x.pr.goles1}-${x.pr.goles2}`)
      lines.push(preds.length ? '  ' + preds.join(' · ') : '  ' + pick(PREVIA_NADIE))
      lines.push('')
    }
    return lines.join('\n').trim()
  },

  captionOficial: () => pick(CAPTIONS_OFICIAL),

  captionDia: () => pick(CAPTIONS_DIA),

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
      lines.push(`Nadie sumó hoy. Un espectáculo lamentable, la verdad.`)
    }
    const amargos = stats.filter(s => s.pts === 0 && s.fail > 0)
    if (amargos.length) lines.push('', pick(AMARGO)(amargos[amargos.length - 1].nombre))
    lines.push('', `A dormir que mañana hay más. Silvina fuera 💅`)
    return lines.join('\n')
  },
}
