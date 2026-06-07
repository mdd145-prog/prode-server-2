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
  r => `🎬 Se terminó ${r}. Y como siempre, yo vi TODO:`,
  r => `😱 ¿Vieron ${r}? Bueno, ahora viene lo importante: los puntos.`,
  r => `📱 Me están explotando los mensajes: terminó ${r}. Va el detalle:`,
  r => `🔔 Din don: ${r}, final. ¿Quién festeja y quién se hace el distraído? Veamos:`,
  r => `💄 Pará que me retoco el labial... listo. Terminó ${r}:`,
  r => `🍿 Final de ${r}. Suelten el celular del trabajo y presten atención:`,
]

const GASTADAS_EXACTO = [
  ns => `⚡ ${ns} la clavó${ns.includes(' y ') ? 'ron' : ''}. ¿Sabía${ns.includes(' y ') ? 'n' : ''} algo? Yo solo pregunto 👀`,
  ns => `⚡ Exacto de ${ns}. Demasiada puntería para ser casualidad, digo yo...`,
  ns => `⚡ ${ns} embocó el resultado justo. Después la chismosa soy yo.`,
  ns => `⚡ Aplausos para ${ns} 👏 (los demás tomen nota, que cuesta poco)`,
  ns => `⚡ ${ns} con el exacto. Si esto fuera casino ya los habrían echado.`,
  ns => `⚡ Resultado clavado de ${ns}. Me dan un poquito de miedo, no les voy a mentir.`,
  ns => `⚡ ${ns}... esa puntería conmigo no la tienen, eh 😏`,
  ns => `⚡ Exactazo de ${ns}. Bueno, alguien tenía que mirar fútbol en serio.`,
]

const NADIE_EXACTO = [
  `Nadie le embocó al exacto. Nivel general: espantoso 💅`,
  `Cero exactos. Menos mal que esto era de expertos en fútbol...`,
  `Ni uno la pegó justa. Yo hubiera acertado, pero no me dejan jugar.`,
  `Exactos: ninguno. Chicos, esto lo arregla cualquiera de mis amigas.`,
  `Cero exactos, otra vez. Y después me dicen que YO no sé de fútbol.`,
  `Nadie la clavó. Tranquilos, igual los quiero (a algunos).`,
  `Exactos: cero. Mis tarotistas amigas hubieran hecho un mejor papel.`,
  `Ningún exacto. ¿Esto es un prode o una rifa? No me queda claro.`,
]

const SIN_PRONOSTICO = [
  (txt, n) => `😴 Sin pronóstico (${n}): ${txt}. Gracias por donar los puntos, amores.`,
  (txt, n) => `😴 ${txt} ni pronosticaron (${n}). Después no lloren en el grupo.`,
  (txt, n) => `😴 Los ausentes de siempre (${n}): ${txt}. Yo nomás aviso.`,
  (txt, n) => `😴 ${txt} otra vez sin pronóstico (${n}). El compromiso, brillando por su ausencia.`,
  (txt, n) => `😴 (${n}) sin jugar: ${txt}. A ustedes ni el Mundial los mueve, qué barbaridad.`,
]

const LIDER = [
  p => `👑 Arriba de todos sigue *${p.nombre}* con ${p.tot}pts. Insoportable se va a poner...`,
  p => `👑 Puntero: *${p.nombre}* (${p.tot}pts). Disfrutalo ahora que esto es largo, eh.`,
  p => `👑 *${p.nombre}* manda con ${p.tot}pts. Ya lo veo capturando la tabla para el estado.`,
  p => `👑 *${p.nombre}* sigue arriba con ${p.tot}pts. Ya pidió que le digan "líder", me contaron.`,
  p => `👑 Punta para *${p.nombre}* (${p.tot}pts). Yo lo banco... hasta que se caiga, obvio.`,
  p => `👑 *${p.nombre}* con ${p.tot}pts mira a todos desde arriba. Qué paciencia hay que tenerle.`,
]

const CIERRES_FIN = [
  `Yo no opino, solo muestro los números 💅`,
  `Mañana más chismes. Besitos.`,
  `Si alguien se enoja, recuerden: yo solo soy la mensajera.`,
  `Los leo en el grupo. Yo de acá no me muevo 💅`,
  `No se peleen que hay Silvina para todos.`,
  `El VAR soy yo, y ya revisé todo.`,
  ``, ``, ``,  // a veces sin cierre, para no empalagar
]

// ── CAMBIO DE LÍDER EN VIVO ───────────────────────────────
const CAMBIO_LIDER = [
  (n, v) => `🚨 *ÚLTIMO MOMENTO:* ${n} acaba de sacarle la punta a ${v}. Yo no digo nada, pero el grupo está que arde 🔥`,
  (n, v) => `🚨 *Se pudrió todo:* ${n} pasó a ${v} en la tabla. Lo que es no pronosticar cualquier cosa, ¿no ${v}?`,
  (n, v) => `🚨 Atenti: nuevo puntero *${n}*. ${v}, te corrieron del trono. Lo lamento (mentira).`,
  (n, v) => `🚨 Cambio de mando: *${n}* arriba. ${v}, fue lindo mientras duró, ¿no?`,
  (n, v) => `🚨 *${n}* nuevo líder. ${v}, te guardo el trono... mentira, ya lo vendí.`,
  (n, v) => `🚨 Perdón ${v}, pero *${n}* te acaba de pasar por arriba. Yo solo leo los números 💅`,
]

// ── PREVIA DE PARTIDO ─────────────────────────────────────
const INTROS_PREVIA = [
  `👀 *Ya arranca y les cuento qué pronosticó cada uno* (para que sepan a quién cargar después):`,
  `🍿 Se viene partido. Esto pusieron los genios del grupo:`,
  `⏰ En un ratito arranca. Vayan calentando que esto dijeron:`,
  `📋 La previa de Silvina — miren lo que pronosticaron y juzguen ustedes:`,
  `🎬 Está por arrancar. Repasemos quién dijo qué, así después no se hacen los distraídos:`,
  `🔮 Mis brujas dicen una cosa, ustedes pronosticaron otra. Va la previa:`,
  `⚽ A minutos del partido, les refresco la memoria (que algunos la tienen selectiva):`,
]

const PREVIA_NADIE = [
  `(nadie pronosticó este... valientes 😴)`,
  `(cero pronósticos acá, ni se gastaron)`,
  `(nadie se animó con este... después no quiero quejas)`,
]

// ── CAPTIONS DE IMÁGENES ──────────────────────────────────
const CAPTIONS_OFICIAL = [
  `📊 La tabla oficial, certificada por mí. Reclamos al de arriba.`,
  `📊 Acá está la tabla. Algunos mejor ni la miren 💅`,
  `📊 Tabla oficial actualizada. Sin trampas, yo vigilo todo.`,
  `📊 La tabla. Yo solo digo que hay gente muy verde acá abajo...`,
  `📊 Tabla fresquita. Compartir con responsabilidad: hay gente sensible abajo.`,
  `📊 La tabla manda. Y la tabla la mando yo 💅`,
  `📊 Números actualizados. Las lágrimas corren por cuenta de cada uno.`,
  ``,
]

const CAPTIONS_DIA = [
  `☀️ Buen día mis amores. Esto se juega hoy — vayan repasando sus papelones anticipados:`,
  `☀️ Arriba que hay fútbol. Los partidos de hoy y lo que pronosticó cada uno:`,
  `☀️ Buen día. Hoy juegan estos. Silvina ya tiene el mate listo 🧉`,
  `☀️ Buen día. Menú del día: fútbol, puntos y papelones. Como me gusta.`,
  `☀️ Levanten esas caritas que hoy hay partidos. Esto pronosticaron:`,
]

// ── RESUMEN NOCTURNO ──────────────────────────────────────
const INTROS_NOCTURNO = [
  f => `🌙 *El resumen nocturno de Silvina* — ${f}`,
  f => `🌙 Antes de dormir, el chisme completo del día (${f}):`,
  f => `🌙 Cierre del día ${f}. Hubo de todo, agárrense:`,
  f => `🌙 Última chismeada del día (${f}) y me voy a dormir, que una también descansa:`,
  f => `🌙 Cierre ${f}. Antes de las buenas noches, las malas noticias:`,
]

const AMARGO = [
  n => `🥶 El amargo del día: *${n}*. Ni una pegó, pobre.`,
  n => `🥶 Día para el olvido de *${n}*. Mañana será otro día (o no).`,
  n => `🥶 *${n}*, hoy mejor ni abras el grupo. Beso.`,
  n => `🥶 *${n}*: cero puntos hoy. Un abrazo enorme, lo vas a necesitar.`,
  n => `🥶 Hoy *${n}* jugó al prode como yo al truco: de memoria y mal.`,
]

// ── RECLAMO DE PRONÓSTICOS (modo seductora) ───────────────
const INTROS_RECLAMO = [
  `🔥 Buen día mis amores... Silvina tiene un problemita: hay gente que todavía no me dio sus pronósticos. Y a mí que me dejen esperando no me gusta nadita...`,
  `😏 Buen día. Anoche me quedé pensando en ustedes... bueno, en algunos. En los que todavía no me mandaron sus 72 resultados, precisamente.`,
  `💋 Buen día, corazones. Les cuento un secreto: no hay nada que me guste más que un prode completo. Y varios de acá me tienen a puro suspiro...`,
  `🔥 Día nuevo, reclamo viejo: sigo esperando pronósticos. No me hagan rogar, que rogando no soy tan simpática...`,
  `😏 Buen día... ¿saben qué me desvela? La gente que promete y no cumple. Sí, hablo de pronósticos. Sí, hablo de ustedes.`,
  `🔥 Me levanté linda y reclamona: todavía hay vivos que no me dieron sus 72. ¿Hasta cuándo me van a hacer esto?`,
  `💋 Buen día mis cielos. Silvina perdona casi todo, menos un prode incompleto...`,
]
const CIERRES_RECLAMO = [
  url => `Completalo acá que es un ratito, y después hablamos... 😘\n${url}`,
  url => `Te dejo el lugar de siempre, te espero ahí 😏\n${url}`,
  url => `Ya sabés dónde encontrarme, no me falles esta noche...\n${url}`,
  url => `Dale, que en cinco minutitos lo tenés listo y me hacés feliz 😘\n${url}`,
  url => `Acá te espero, no me dejes plantada otra vez...\n${url}`,
]
const PIROPOS_CUMPLIDORES = [
  ns => `Y a los que ya me dieron todo (${ns})... ustedes ya saben que son mis favoritos 😘`,
  ns => `${ns}: ustedes ya cumplieron. Lo que es ser caballeros... los demás, aprendan.`,
  ns => `Mención especial para ${ns}, que me dieron sus 72 sin chistar. Eso, señores, enamora.`,
  ns => `Eso sí: ${ns} ya me dieron todo. Con ustedes no tengo más que palabras de amor 💋`,
]

// ── CHARLA: cuando la nombran ─────────────────────────────
// Apodos que la despiertan (palabra completa, no distingue mayúsculas)
const ALIAS_RE = /\b(silvina|silvinita|silvi|sil|mi amor(cito)?|amorcito|hermosa|preciosa|bonita|linda|reina|diosa|mamita|bomb[oó]n|muñeca|mi vida|bebota)\b/i

// Detectores de tono del mensaje
const PIROPO_RE = /te amo|te quiero|casate|cas[eé]monos|sos (re )?(hermosa|linda|divina|fuego|lo m[aá]s)|qu[eé] (linda|hermosa|diosa)|guapa|preciosa|hermosa|diosa|mamita|bomb[oó]n|bebota|fuego|tkm|😍|🥵|❤️/i
const ENOJO_RE  = /callate|c[aá]llate|pesada|insoportable|aburrida|tonta|boluda|tarada|puta|trola|molesta|odio|garca|mentirosa|in[uú]til|chanta/i

// Turno 1 — le tiraron un piropo
const COQUETAS = [
  n => `Ay ${n}... seguí, seguí, que halago no mata a nadie 😘`,
  n => `Uy, ${n}, así de frente no... que me sonrojo (mentira, seguí).`,
  n => `${n}, corazón, conmigo no se juega... se pierde 😏`,
  n => `Qué lindo sos ${n}... lástima tus pronósticos, pero lindo sos.`,
  n => `Me decís eso y casi me olvido de la tabla, ${n}... casi.`,
  n => `${n}, amor, dejá de tirarme onda que después el grupo habla. Y el chisme acá lo manejo YO.`,
  n => `Seguime endulzando el oído, ${n}, que puntos igual no te puedo regalar 💅`,
  n => `Ay no, ${n}, esas cosas en público no... mandámelas al privado 😏 (mentira, acá, donde las vean todos).`,
  n => `${n}, papito, vos me decís eso porque vas perdiendo. Igual funciona, seguí 💋`,
]

// Turno 1 — la cargaron o insultaron
const COMEBACKS = [
  n => `Uy, ${n} amaneció bravo. Tranquilo papi, que yo muerdo más fuerte 😏`,
  n => `${n}, tesoro, a mí no me vas a faltar el respeto... para eso están tus pronósticos.`,
  n => `Seguí así ${n} y el resumen de mañana abre con TU nombre y TUS estadísticas. Vos sabés lo que tengo.`,
  n => `Ay ${n}... yo seré pesada, pero mirá dónde estás vos en la tabla. Cada uno carga su cruz 💅`,
  n => `¿Y ese carácter, ${n}? El que se enoja pierde. Bah, vos ya venís perdiendo igual.`,
  n => `${n}, mi amor, insultame todo lo que quieras: yo igual sé TODO de vos 👀`,
  n => `Qué genio, ${n}. Suerte que soy una dama... y que guardo capturas.`,
]

// Turno 1 — saludo / mención genérica
const CHISMOSAS = [
  n => `¿Me llamabas, ${n}? 😏 Acá estoy. ¿Tabla, chisme o me extrañabas nomás?`,
  n => `Presente, ${n}. Igual estaba escuchando todo, no te creas.`,
  n => `Hola ${n} 💅 Justo estaba hablando de vos... no, mentira. ¿O no?`,
  n => `Decime, ${n}. Pero rapidito que estoy con tres chismes en simultáneo.`,
  n => `¿Sí, mi amor? Para tabla: !tabla. Para chisme: quedate, que tengo de sobra 🍵`,
  n => `Acá estoy, ${n}, más atenta que ustedes con los pronósticos (tampoco es difícil).`,
  n => `Aparecí, ${n}. Como los buenos chismes: justo cuando nadie me esperaba.`,
  n => `¿Qué pasa, ${n}? ¿Necesitás algo o es pura falta de atención? Cualquiera de las dos me sirve 😘`,
  n => `Hola hermoso. Si es por la tabla: !tabla. Si es por mí: estoy ocupada hasta julio 😘`,
]

// Turno 2 — sigue la conversación
const SEGUNDAS = [
  n => `Jajaja seguí, ${n}, que esta conversación la estoy guardando para el resumen 👀`,
  n => `Vos a mí me querés sacar información, ${n}... y lo peor es que te la voy a dar.`,
  n => `Mirá vos, ${n}... esto se pone interesante. Contame más 🍵`,
  n => `Ay, ${n}, con vos siempre es así: empezamos hablando de fútbol y terminamos acá 😏`,
  n => `Te escucho, te escucho... pero no me distraigas, que si pasa algo en la cancha lo cuento yo primero.`,
  n => `¿Y eso lo decís en el grupo, ${n}? Picante. Me gusta 💅`,
  n => `Dale, ${n}, una más y te dejo, que después dicen que tengo favoritos. (Los tengo.)`,
  n => `Vos seguí, ${n}, que yo tomo nota de todo. Después no digas que no avisé 👀`,
]

// Turno 3 — cierra la charla y vuelve al laburo
const DESPEDIDAS = [
  n => `Bueno basta, ${n}, que me tenés a puro chamuyo y yo tengo un Mundial que atender 💋 Después seguimos.`,
  n => `Me encantás, ${n}, pero me reclaman en otra cancha. Besito, no me extrañen mucho 😘`,
  n => `Corte acá, mis amores, que si sigo charlando con ${n} esto se convierte en otra cosa... 😏 ¡A los pronósticos!`,
  n => `Ya está, ${n}, no me des más charla que me distraigo y se me escapa un resultado. Silvina fuera 💅`,
  n => `Listo, listo, me voy antes de decir algo de lo que el grupo hable una semana. Chau ${n} 💋`,
  n => `Hasta acá llegamos, ${n}. Una dama sabe cuándo retirarse... y cuándo volver 😏`,
]

// ── FOTO DE SILVINA ───────────────────────────────────────
// Detecta cuando le piden una foto de ella (manda media/silvina.jpg)
const FOTO_RE = /foto|selfie|mostrate|mostr[aá]( la)? cara|c[oó]mo sos|quiero verte|dejame verte|a ver(te)? una/i

const CAPTIONS_FOTO = [
  `😘 Para que dejen de imaginar. Sí, soy yo.`,
  `💅 Acá estoy. Ahora entienden por qué el grupo anda tan atento, ¿no?`,
  `😏 Una sola, que después se enamoran y dejan de pronosticar.`,
  `💋 Tomá. Pero la tabla la seguís pidiendo con !tabla, eh.`,
  `😘 Esta soy yo. La que se sabe TODOS sus pronósticos de memoria.`,
  `🔥 Bueno, pero dejen de pedir que una tiene un Mundial que atender.`,
]

// ── !TETAS ────────────────────────────────────────────────
// Si no hay fotos en media/tetas/, contesta con una de estas:
const TETAS = [
  n => `😏 ¿Tetas, ${n}? Mirá vos qué directo... Ganá el prode y hablamos.`,
  n => `Ay ${n}, tan necesitado... Primero los 72 pronósticos, después vemos 😘`,
  n => `JAJA ${n}, por favor. Yo muestro tablas, no escote. Bueno... depende del día 💅`,
  n => `${n}, corazón, esto es un prode familiar. Bah, era 😏`,
  n => `Tranquilo, ${n}... lo mío se insinúa, no se muestra. !tabla y agradecé.`,
  n => `Uy, ${n} pidió !tetas y quedó registrado para siempre. El chisme se hace solo 👀`,
  n => `¿!tetas? Las mías valen más que el pozo del prode, ${n}. No te alcanza 💋`,
  n => `${n}, amor, primero invitame a salir, después un asadito... hay un orden, ¿sí? 😘`,
]

// Caption cuando SÍ hay foto en media/tetas/:
const TETAS_CAPTION = [
  `😏 Solo porque hoy estoy de buenas. No se acostumbren.`,
  `💋 Regalito de Silvina. Borren esto antes de que se entere mi mamá.`,
  `🔥 Lo que pasa en el grupo, queda en el grupo, ¿estamos?`,
  `😘 Tomá. Ahora andá a completar tus pronósticos, que te conozco.`,
  `😏 Una y no más. Bueno... una por ahora.`,
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

  // ¿El texto menciona a Silvina por alguno de sus apodos?
  esMencion: texto => ALIAS_RE.test(texto),

  // Charla con ida y vuelta: turno 1 abre (según el tono), turno 2 sigue, turno 3 cierra.
  charla: (texto, turno, nombre) => {
    const n = nombre || 'amor'
    if (turno >= 3) return pick(DESPEDIDAS)(n)
    if (ENOJO_RE.test(texto)) return pick(COMEBACKS)(n)
    if (PIROPO_RE.test(texto)) return pick(COQUETAS)(n)
    return pick(turno === 1 ? CHISMOSAS : SEGUNDAS)(n)
  },

  // ¿Le están pidiendo una foto de ella? (excluye pedidos de tabla/partidos)
  pideFoto: texto => FOTO_RE.test(texto) && !/tabla|partido|punto/.test(texto),

  captionFoto: () => pick(CAPTIONS_FOTO),

  tetas: nombre => pick(TETAS)(nombre || 'amor'),

  captionTetas: () => pick(TETAS_CAPTION),

  reclamo: (sinNada, incompletos, completos, url) => {
    const lines = [pick(INTROS_RECLAMO), '']
    if (sinNada.length) lines.push(`😘 Me deben sus 72 enteritos: *${sinNada.join(', ')}*`)
    if (incompletos.length) lines.push(`🧮 Empezaron pero me dejaron a medias (peor todavía): ${incompletos.map(x => `*${x.nombre}* (${x.done}/72)`).join(', ')}`)
    lines.push('', pick(CIERRES_RECLAMO)(url))
    if (completos.length) lines.push('', pick(PIROPOS_CUMPLIDORES)(completos.join(', ')))
    return lines.join('\n')
  },

  // Anuncio puntual de las 3 formas de cargar + edición (se dispara con !novedades)
  novedades: url => [
    '💋 *Silvina, al habla, mis amores.*',
    '',
    'Escúchenme bien que lo digo una sola vez: ahora cargás el prode *como quieras, papito*. El código de siempre, *directo a la web sin vueltas*, o bajándote un *Excel*, llenándolo tranqui en la compu y subiéndolo. Tres formas. Para tres tipos de vago. 😏',
    '',
    '¿Te equivocaste en un resultado? Tranqui, corazón, yo también me arrepiento de cosas. Pegás tu código de nuevo, lo editás y lo mandás — *y no se duplica nada*, te reconozco por el nombre aunque entres desde otro celu.',
    '',
    'Y lo que *nadie* ve son los pronósticos del otro. Acá se chusmea solo lo MÍO, queridas. 🔥',
    '',
    `A cargar que el Mundial no espera 👉 ${url}`,
    '',
    'Besito. 💋',
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
      lines.push(`Nadie sumó hoy. Un espectáculo lamentable, la verdad.`)
    }
    const amargos = stats.filter(s => s.pts === 0 && s.fail > 0)
    if (amargos.length) lines.push('', pick(AMARGO)(amargos[amargos.length - 1].nombre))
    lines.push('', `A dormir que mañana hay más. Silvina fuera 💅`)
    return lines.join('\n')
  },
}
