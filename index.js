require('dotenv').config()
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const QRCode = require('qrcode')
const pino = require('pino')
const express = require('express')
const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const { generarTablaImagen, generarImagenDia, generarTablaProba, generarTablaChances } = require('./tablaImagen')
const silvina = require('./silvina')

const app = express()
app.use(express.json())

// ── Clientes ──────────────────────────────────────────────
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// ── Constantes ────────────────────────────────────────────
const ADMIN_NUMBER = '5491157671081'
const ADMIN_JID    = process.env.ADMIN_JID || `${ADMIN_NUMBER}@s.whatsapp.net`  // Baileys usa @s.whatsapp.net

const TEAM_MAP = {
  'Mexico': 'México', 'South Africa': 'Sudáfrica',
  'Korea Republic': 'Rep. de Corea', 'South Korea': 'Rep. de Corea',
  'Czechia': 'Rep. Checa', 'Czech Republic': 'Rep. Checa',
  'Canada': 'Canadá', 'Bosnia and Herzegovina': 'Bosnia Herz.',
  'Bosnia & Herzegovina': 'Bosnia Herz.', 'Qatar': 'Catar',
  'Switzerland': 'Suiza', 'Brazil': 'Brasil', 'Morocco': 'Marruecos',
  'Haiti': 'Haití', 'Scotland': 'Escocia',
  'United States': 'Estados Unidos', 'USA': 'Estados Unidos',
  'Paraguay': 'Paraguay', 'Australia': 'Australia', 'Turkey': 'Turquía',
  'Germany': 'Alemania', 'Curaçao': 'Curazao', 'Curacao': 'Curazao',
  "Côte d'Ivoire": 'Costa de Marfil', 'Ivory Coast': 'Costa de Marfil',
  'Ecuador': 'Ecuador', 'Netherlands': 'Países Bajos', 'Japan': 'Japón',
  'Sweden': 'Suecia', 'Tunisia': 'Túnez', 'Belgium': 'Bélgica',
  'Egypt': 'Egipto', 'Iran': 'Irán', 'New Zealand': 'Nueva Zelanda',
  'Spain': 'España', 'Cape Verde': 'Cabo Verde', 'Saudi Arabia': 'Arabia Saudí',
  'Uruguay': 'Uruguay', 'France': 'Francia', 'Senegal': 'Senegal',
  'Norway': 'Noruega', 'Iraq': 'Irak', 'Argentina': 'Argentina',
  'Algeria': 'Argelia', 'Austria': 'Austria', 'Jordan': 'Jordania',
  'Portugal': 'Portugal', 'Colombia': 'Colombia', 'Uzbekistan': 'Uzbekistán',
  'DR Congo': 'RD Congo', 'Congo DR': 'RD Congo',
  'Democratic Republic of Congo': 'RD Congo',
  'England': 'Inglaterra', 'Croatia': 'Croacia',
  'Ghana': 'Ghana', 'Panama': 'Panamá',
}
const mapTeam = n => TEAM_MAP[n] || n

// Fecha de hoy en Argentina (YYYY-MM-DD) — evita el desfasaje con UTC después de las 21:00
const hoyARG = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

// ── Estado global ─────────────────────────────────────────
let botSock  = null
let ultimoQR = null
let charlaSilvina = { turnos: 0, ts: 0, fin: 0 }  // ida y vuelta con Silvina (máx. 3 turnos, ventana 2 min)

// ── Lógica de puntos ──────────────────────────────────────
function calcPts(pred, partido) {
  if (partido.goles1 === null || partido.goles2 === null) return null
  if (!pred || pred.goles1 === null || pred.goles2 === null) return 0
  if (pred.goles1 === partido.goles1 && pred.goles2 === partido.goles2) return 3
  const tend = (a, b) => a > b ? 1 : a < b ? -1 : 0
  return tend(pred.goles1, pred.goles2) === tend(partido.goles1, partido.goles2) ? 1 : 0
}

async function buildBoard() {
  const { data: jugadores }   = await supabase.from('jugadores').select('*').order('orden')
  const { data: partidos }    = await supabase.from('partidos').select('*')
  const { data: pronosticos } = await supabase.from('pronosticos').select('*')
  if (!jugadores) return []
  return jugadores.map(j => {
    let tot = 0, ex = 0, lv = 0, fail = 0, jug = 0
    const preds = pronosticos?.filter(p => p.jugador_id === j.id) || []
    for (const partido of (partidos || [])) {
      if (partido.goles1 === null) continue
      const pred = preds.find(p => p.partido_id === partido.id)
      const pts  = calcPts(pred, partido)
      if (pts === null) continue
      jug++; tot += pts
      if (pts === 3) ex++; else if (pts === 1) lv++; else fail++
    }
    const pct = jug > 0 ? ((ex / jug) * 100).toFixed(0) + '%' : '-'
    return { id: j.id, nombre: j.nombre, tot, ex, lv, fail, jug, pct }
  }).sort((a, b) => b.tot - a.tot)
}

async function tablaTexto() {
  const board = await buildBoard()
  const { data: partidos } = await supabase.from('partidos').select('*')
  const jugados = partidos?.filter(p => p.goles1 !== null).length || 0
  const total   = partidos?.length || 72
  const fecha   = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  const lines   = [`⚽ *PRODE MUNDIAL 2026*`, `📊 TABLA · ${fecha}`, `_${jugados}/${total} partidos jugados_`, ``]
  board.forEach((p, i) => {
    const pos = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
    lines.push(`${pos} *${p.nombre}* — ${p.tot}pts${p.ex > 0 ? ` ⚡${p.ex}` : ''}`)
  })
  lines.push(``, `_⚡Exacto=3pts · 📈Levante=1pt_`)
  return lines.join('\n')
}

async function tablaDiaTexto(fecha) {
  const { data: partidos }    = await supabase.from('partidos').select('*').eq('fecha', fecha)
  if (!partidos?.length) return `No hay partidos el ${fecha}`
  const { data: jugadores }   = await supabase.from('jugadores').select('*').order('orden')
  const { data: pronosticos } = await supabase.from('pronosticos').select('*')
  const lines = [`📅 *PARTIDOS ${fecha}*`, ``]
  for (const p of partidos) {
    const res = p.goles1 !== null ? `${p.goles1}-${p.goles2}` : p.hora
    lines.push(`*${p.equipo1} ${res} ${p.equipo2}* (G${p.grupo})`)
    for (const j of (jugadores || [])) {
      const pred    = pronosticos?.find(pr => pr.jugador_id === j.id && pr.partido_id === p.id)
      const predTxt = pred && pred.goles1 !== null ? `${pred.goles1}-${pred.goles2}` : '-'
      const pts     = calcPts(pred, p)
      const icon    = pts === 3 ? '✅' : pts === 1 ? '📈' : pts === 0 ? '❌' : '⏳'
      lines.push(`  ${icon} ${j.nombre}: ${predTxt}`)
    }
    lines.push(``)
  }
  return lines.join('\n')
}

function rachaExactos(jugadorId, partidos, pronosticos) {
  const jugados = partidos.filter(p => p.goles1 !== null)
    .sort((a, b) => (b.fecha + (b.hora || '')).localeCompare(a.fecha + (a.hora || '')))
  let racha = 0
  for (const p of jugados) {
    const pred = pronosticos.find(x => x.jugador_id === jugadorId && x.partido_id === p.id)
    if (calcPts(pred, p) === 3) racha++
    else break
  }
  return racha
}

async function mensajeFinPartido(partido) {
  const { data: jugadores }   = await supabase.from('jugadores').select('*').order('orden')
  const { data: partidos }    = await supabase.from('partidos').select('*')
  const { data: pronosticos } = await supabase.from('pronosticos').select('*')
  const resTxt = `*${partido.equipo1} ${partido.goles1}-${partido.goles2} ${partido.equipo2}*`

  const filas = [], exactos = [], sinPron = []
  for (const j of (jugadores || [])) {
    const pred = pronosticos?.find(p => p.jugador_id === j.id && p.partido_id === partido.id)
    if (!pred || pred.goles1 === null) { sinPron.push(j.nombre); continue }
    const pts  = calcPts(pred, partido)
    const icon = pts === 3 ? '✅ +3' : pts === 1 ? '📈 +1' : '❌  0'
    if (pts === 3) exactos.push(j.nombre)
    filas.push({ pts, line: `${icon} *${j.nombre}* (${pred.goles1}-${pred.goles2})` })
  }
  filas.sort((a, b) => b.pts - a.pts)

  const lines = [silvina.introFin(resTxt), '', ...filas.map(f => f.line)]
  if (sinPron.length) lines.push(silvina.sinPronostico(sinPron))
  lines.push('', exactos.length ? silvina.gastadaExactos(exactos) : silvina.nadieExacto())

  // rachas de exactos (2 o más al hilo)
  const partidosAct = (partidos || []).map(p => p.id === partido.id ? { ...p, goles1: partido.goles1, goles2: partido.goles2 } : p)
  for (const nombre of exactos) {
    const j = jugadores.find(x => x.nombre === nombre)
    const r = rachaExactos(j.id, partidosAct, pronosticos || [])
    if (r >= 2) lines.push(silvina.racha(nombre, r))
  }

  const board = await buildBoard()
  if (board[0] && board[0].tot > 0) lines.push(silvina.lider(board[0]))
  const cierre = silvina.cierreFin()
  if (cierre) lines.push('', cierre)
  return lines.join('\n')
}

// ── Helpers de envío ──────────────────────────────────────
async function enviarAlGrupo(texto) {
  const g = process.env.GROUP_ID
  if (!g || !botSock) return console.log('⚠ GROUP_ID o bot no disponible')
  await botSock.sendMessage(g, { text: texto })
}

async function enviarImagenAlGrupo(buffer, caption) {
  const g = process.env.GROUP_ID
  if (!g || !botSock) return console.log('⚠ GROUP_ID o bot no disponible')
  await botSock.sendMessage(g, { image: buffer, caption, mimetype: 'image/png' })
}

// ¿El mensaje es una respuesta (quote) a un mensaje del bot? → Silvina sigue la charla
function esReplyAlBot(msg) {
  const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant
  const botJid = botSock?.user?.id
  if (!quotedJid || !botJid) return false
  return quotedJid.split(/[:@]/)[0] === botJid.split(/[:@]/)[0]
}

// ── Handler de mensajes ───────────────────────────────────
async function handleMessage(sock, msg) {
  const groupId     = process.env.GROUP_ID
  const testingMode = !groupId

  const from    = msg.key.remoteJid
  const isGroup = from.endsWith('@g.us')
  const sender  = msg.key.participant || from  // en grupo: JID del que mandó

  const isFromGroup    = from === groupId
  const isPrivateAdmin = !isGroup && sender === ADMIN_JID
  const isGroupAdmin   = isGroup && sender === ADMIN_JID
  const senderIsAdmin  = isPrivateAdmin || isGroupAdmin

  if (!testingMode && !isFromGroup && !isPrivateAdmin) return
  if (testingMode  && !isPrivateAdmin) return

  const texto = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    ''
  ).trim().toLowerCase()

  const respondTo = from
  console.log(`🤖 CMD: "${texto}"${senderIsAdmin ? " [admin]" : ""}`)

  const sendText  = async t => await sock.sendMessage(respondTo, { text: t })
  const sendImage = async (buf, cap) => await sock.sendMessage(respondTo, { image: buf, caption: cap, mimetype: 'image/png' })

  try {
    if (texto === '!tabla') {
      await verificarPartidosEnVivo(false)
      const board = await buildBoard()
      if (!board.length) { await sendText('No hay datos aún'); return }
      const hoyFecha = hoyARG()
      const { data: pAll }  = await supabase.from('partidos').select('id,goles1')
      const { data: pHoy }  = await supabase.from('partidos').select('*').eq('fecha', hoyFecha).not('goles1','is',null)
      const jugados = pAll?.filter(p => p.goles1 !== null).length || 0
      const liveMatches = pHoy || []
      const img = await generarTablaImagen(board, 'nooficial', { jugados, liveMatches })
      await sendImage(img, '')
    }
    else if (texto === '!hoy') {
      const hoy = hoyARG()
      const { data: pHoy }  = await supabase.from('partidos').select('*').eq('fecha', hoy)
      if (!pHoy?.length) { await sendText(`No hay partidos hoy (${hoy})`); return }
      const { data: jugs }  = await supabase.from('jugadores').select('*').order('orden')
      const { data: preds } = await supabase.from('pronosticos').select('*')
      const img = await generarImagenDia(pHoy, jugs || [], preds || [], hoy)
      await sendImage(img, '')
    }
    else if (texto.startsWith('!dia ')) {
      const fecha = texto.replace('!dia ', '').trim()
      const { data: pFecha } = await supabase.from('partidos').select('*').eq('fecha', fecha)
      if (!pFecha?.length) { await sendText(`No hay partidos el ${fecha}`); return }
      const { data: jugs }  = await supabase.from('jugadores').select('*').order('orden')
      const { data: preds } = await supabase.from('pronosticos').select('*')
      const img = await generarImagenDia(pFecha, jugs || [], preds || [], fecha)
      await sendImage(img, '')
    }
    else if (texto === '!chances') {
      const board = await buildBoard()
      if (!board.length) { await sendText('No hay datos aún'); return }
      const { data: partidos } = await supabase.from('partidos').select('id,goles1')
      const img = await generarTablaChances(board, partidos || [])
      await sendImage(img, '')
    }
    // !proba desactivado temporalmente
    // else if (texto === '!proba') { ... }
    else if (texto === '!ayuda' || texto === 'hola' || texto === 'ping') {
      await sendText(
        `🤖 *Prode Mundial 2026 — Comandos:*\n\n` +
        `!tabla → Tabla NO OFICIAL (en vivo)\n` +
        `!hoy → Partidos de hoy + pronósticos\n` +
        `!dia YYYY-MM-DD → Partidos de una fecha\n` +
        `!chances → Quién sigue en carrera\n` +
        `!tetas → Probá y vas a ver 😏\n` +
        `!ayuda → Este mensaje`
      )
    }
    else if (senderIsAdmin && texto === '!oficial') {
      await verificarPartidosEnVivo(false)
      const board = await buildBoard()
      if (!board.length) { await sendText('No hay datos aún'); return }
      const img = await generarTablaImagen(board, 'oficial')
      if (isPrivateAdmin) {
        // Desde privado → preview solo para el admin
        await sendImage(img, '')
      } else {
        // Desde el grupo → manda al grupo
        await enviarImagenAlGrupo(img, '')
      }
    }
    else if (senderIsAdmin && texto === '!resumen') {
      if (!groupId) { await sendText('❌ GROUP_ID no configurado'); return }
      const hoy = hoyARG()
      const { data: pHoy }  = await supabase.from('partidos').select('*').eq('fecha', hoy)
      if (!pHoy?.length) { await sendText(`No hay partidos hoy (${hoy})`); return }
      const { data: jugs }  = await supabase.from('jugadores').select('*').order('orden')
      const { data: preds } = await supabase.from('pronosticos').select('*')
      const img = await generarImagenDia(pHoy, jugs || [], preds || [], hoy)
      await enviarImagenAlGrupo(img, '')
      if (isPrivateAdmin) await sendText('✅ Resumen enviado al grupo')
    }
    else if (senderIsAdmin && texto === '!forzar') {
      if (!groupId) { await sendText('❌ GROUP_ID no configurado'); return }
      const board = await buildBoard()
      const img   = await generarTablaImagen(board, 'oficial')
      await enviarImagenAlGrupo(img, '')
      if (isPrivateAdmin) await sendText('✅ Tabla enviada al grupo')
    }
    else if (senderIsAdmin && texto === '!sync') {
      await sendText('🔄 Sincronizando...')
      await verificarPartidosEnVivo(true)
      await sendText('✅ Sync completado')
    }
    else if (senderIsAdmin && texto.startsWith('!resultado ')) {
      await handleResultadoManual(sock, texto, respondTo)
    }
    else if (senderIsAdmin && texto === '!estado') {
      const { data: p } = await supabase.from('partidos').select('id').not('goles1', 'is', null)
      const { data: j } = await supabase.from('jugadores').select('id')
      await sendText(
        `📊 *Estado:*\nJugadores: ${j?.length || 0}\nPartidos jugados: ${p?.length || 0}/72\n` +
        `GROUP_ID: ${groupId || '❌ NO CONFIGURADO'}\nAPI fútbol: ${process.env.FOOTBALL_API_KEY ? '✅' : '❌'}`
      )
    }
    else if (texto === '!tetas') {
      // Si hay fotos en media/tetas/ manda una al azar; si no, Silvina gastandolos
      const fs = require('fs'), path = require('path')
      const dir = path.join(__dirname, 'media', 'tetas')
      let fotos = []
      try { fotos = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f)) } catch {}
      if (fotos.length) {
        const f = fotos[Math.floor(Math.random() * fotos.length)]
        await sock.sendMessage(respondTo, {
          image: fs.readFileSync(path.join(dir, f)),
          caption: silvina.captionTetas(),
          mimetype: f.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
        })
      } else {
        await sendText(silvina.tetas(msg.pushName))
      }
    }
    else if (!texto.startsWith('!') && (silvina.esMencion(texto) || esReplyAlBot(msg))) {
      // La nombraron (silvina/sil/silvi/mi amor/hermosa...) o respondieron a un mensaje suyo
      // → charla con ida y vuelta: hasta 3 turnos, después cierra y descansa 1 min
      const ahora = Date.now()
      const charlaActiva = charlaSilvina.turnos > 0 && ahora - charlaSilvina.ts < 120000
      if (charlaActiva || ahora - charlaSilvina.fin > 60000) {
        charlaSilvina.turnos = charlaActiva ? charlaSilvina.turnos + 1 : 1
        charlaSilvina.ts = ahora
        await sendText(silvina.charla(texto, charlaSilvina.turnos, msg.pushName))
        if (charlaSilvina.turnos >= 3) charlaSilvina = { turnos: 0, ts: 0, fin: ahora }
      }
    }
    else if (testingMode) {
      await sendText(`Recibí: "${texto.slice(0,50)}". Probá con !ayuda`)
    }
  } catch (e) {
    console.error('Error handler:', e.message)
    try { await sendText(`❌ Error: ${e.message}`) } catch {}
  }
}

// ── Resultado manual (admin) ──────────────────────────────
async function handleResultadoManual(sock, texto, respondTo) {
  const sendText = async t => await sock.sendMessage(respondTo, { text: t })
  const partes = texto.replace('!resultado ', '').trim().split(' ')
  if (partes.length < 4) {
    await sendText('❌ Formato: !resultado Equipo1 goles1 Equipo2 goles2\nEj: !resultado Argentina 2 Francia 1')
    return
  }
  // Buscar los dos últimos números para g1 y g2 (soporta equipos multi-palabra)
  const numIdx = partes.reduce((acc, p, i) => (!isNaN(parseInt(p)) ? [...acc, i] : acc), [])
  if (numIdx.length < 2) { await sendText('❌ No encontré dos números de goles'); return }
  const g1Idx = numIdx[numIdx.length - 2]
  const g2Idx = numIdx[numIdx.length - 1]
  const g1 = parseInt(partes[g1Idx])
  const g2 = parseInt(partes[g2Idx])
  const t1 = partes.slice(0, g1Idx).join(' ')
  const t2 = partes.slice(g1Idx + 1, g2Idx).join(' ')
  if (!t1 || !t2) { await sendText('❌ Formato: !resultado Equipo1 goles1 Equipo2 goles2\nEj: !resultado Argentina 2 Francia 1'); return }

  const { data: partidos } = await supabase.from('partidos').select('*')
  const partido = partidos?.find(p =>
    (p.equipo1.toLowerCase().includes(t1.toLowerCase()) || t1.toLowerCase().includes(p.equipo1.toLowerCase())) &&
    (p.equipo2.toLowerCase().includes(t2.toLowerCase()) || t2.toLowerCase().includes(p.equipo2.toLowerCase()))
  )
  if (!partido) { await sendText(`❌ No encontré "${t1} vs ${t2}"`); return }

  const { error } = await supabase.from('partidos').update({ goles1: g1, goles2: g2 }).eq('id', partido.id)
  if (error) { await sendText(`❌ Error: ${error.message}`); return }

  await sendText(`✅ ${partido.equipo1} ${g1}-${g2} ${partido.equipo2}`)
  const groupId = process.env.GROUP_ID
  if (groupId) {
    const msgFin = await mensajeFinPartido({ ...partido, goles1: g1, goles2: g2 })
    await enviarAlGrupo(msgFin)
    setTimeout(async () => {
      try {
        const board = await buildBoard()
        const img   = await generarTablaImagen(board, 'oficial')
        await enviarImagenAlGrupo(img, silvina.captionOficial())
      } catch(e) { console.error(e.message) }
    }, 3000)
  }
}

// ── Polling football-data.org ─────────────────────────────
const finalizados = new Set()
let liderActual = null  // para detectar cambios de punta en vivo
// ── Odds API (cache 1 hora) ───────────────────────────────
let oddsCache = { data: null, ts: 0 }

async function getOdds() {
  if (!process.env.ODDS_API_KEY) return []
  const now = Date.now()
  if (oddsCache.data && now - oddsCache.ts < 3600000) return oddsCache.data
  try {
    const res = await axios.get('https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/', {
      params: { apiKey: process.env.ODDS_API_KEY, regions: 'eu', markets: 'h2h', dateFormat: 'iso' },
      timeout: 10000
    })
    oddsCache = { data: res.data || [], ts: now }
    console.log(`📊 Odds: ${oddsCache.data.length} partidos`)
    return oddsCache.data
  } catch(e) { console.error('Error odds:', e.message); return oddsCache.data || [] }
}

function buildOddsMap(oddsData, partidos) {
  const map = {}
  if (!oddsData?.length || !partidos?.length) return map
  for (const odd of oddsData) {
    const homeEsp = TEAM_MAP[odd.home_team] || odd.home_team
    const awayEsp = TEAM_MAP[odd.away_team] || odd.away_team
    const partido = partidos.find(p =>
      (p.equipo1 === homeEsp && p.equipo2 === awayEsp) ||
      (p.equipo1 === awayEsp && p.equipo2 === homeEsp)
    )
    if (!partido || partido.goles1 !== null) continue
    let hO = [], dO = [], aO = []
    for (const bm of (odd.bookmakers || [])) {
      const mkt = bm.markets?.find(m => m.key === 'h2h')
      if (!mkt) continue
      for (const o of mkt.outcomes) {
        if (o.name === odd.home_team) hO.push(o.price)
        else if (o.name === odd.away_team) aO.push(o.price)
        else if (o.name === 'Draw') dO.push(o.price)
      }
    }
    if (!hO.length || !aO.length || !dO.length) continue
    const avg = arr => arr.reduce((a, b) => a + b) / arr.length
    const pH = 1 / avg(hO), pD = 1 / avg(dO), pA = 1 / avg(aO)
    const tot = pH + pD + pA
    const flipped = partido.equipo1 === awayEsp
    map[partido.id] = {
      pHome: (flipped ? pA : pH) / tot,
      pDraw: pD / tot,
      pAway: (flipped ? pH : pA) / tot
    }
  }
  return map
}

async function calcProbaBoard() {
  const [board, oddsData] = await Promise.all([buildBoard(), getOdds()])
  const { data: partidos }    = await supabase.from('partidos').select('*')
  const { data: jugadores }   = await supabase.from('jugadores').select('*').order('orden')
  const { data: pronosticos } = await supabase.from('pronosticos').select('*')
  if (!jugadores?.length) return null

  const oddsMap  = buildOddsMap(oddsData, partidos)
  const remaining = (partidos || []).filter(p => p.goles1 === null)
  const oddsCount = Object.keys(oddsMap).length

  // Puntos actuales
  const currentPts = {}
  board.forEach(p => { currentPts[p.id] = p.tot })

  // Monte Carlo 5000 simulaciones
  const N = 5000
  const winCounts = {}
  jugadores.forEach(j => { winCounts[j.id] = 0 })

  for (let sim = 0; sim < N; sim++) {
    const simPts = { ...currentPts }
    for (const match of remaining) {
      const o = oddsMap[match.id]
      if (!o) continue
      const r = Math.random()
      const outcome = r < o.pHome ? 'H' : r < o.pHome + o.pDraw ? 'D' : 'A'
      for (const jug of jugadores) {
        const pred = pronosticos?.find(pr => pr.jugador_id === jug.id && pr.partido_id === match.id)
        if (!pred || pred.goles1 === null) continue
        const predOut = pred.goles1 > pred.goles2 ? 'H' : pred.goles1 < pred.goles2 ? 'A' : 'D'
        if (predOut === outcome) {
          simPts[jug.id] = (simPts[jug.id] || 0) + (Math.random() < 0.15 ? 3 : 1)
        }
      }
    }
    const maxP = Math.max(...jugadores.map(j => simPts[j.id] || 0))
    const winners = jugadores.filter(j => (simPts[j.id] || 0) === maxP)
    for (const w of winners) winCounts[w.id] += 1 / winners.length
  }

  // Puntos esperados
  const results = jugadores.map(j => {
    let ePts = currentPts[j.id] || 0
    for (const match of remaining) {
      const o = oddsMap[match.id]
      if (!o) continue
      const pred = pronosticos?.find(pr => pr.jugador_id === j.id && pr.partido_id === match.id)
      if (!pred || pred.goles1 === null) continue
      const predOut = pred.goles1 > pred.goles2 ? 'H' : pred.goles1 < pred.goles2 ? 'A' : 'D'
      const pOk = predOut === 'H' ? o.pHome : predOut === 'D' ? o.pDraw : o.pAway
      ePts += pOk * (0.15 * 3 + 0.85 * 1)
    }
    return {
      id: j.id,
      nombre: j.nombre,
      winPct: parseFloat(((winCounts[j.id] || 0) / N * 100).toFixed(1)),
      expectedPts: Math.round(ePts * 10) / 10,
      currentPts: currentPts[j.id] || 0
    }
  }).sort((a, b) => b.winPct - a.winPct)

  return { results, oddsCount, sims: N }
}




async function chancesTexto() {
  const board = await buildBoard()
  const { data: partidos } = await supabase.from('partidos').select('*')
  const rem = (partidos || []).filter(p => p.goles1 === null).length
  if (!board.length) return 'No hay datos aún.'
  const top = board[0].tot
  const lines = ['🎯 *CHANCES DE GANAR — PRODE 2026*', '']
  let hayAlguno = false
  board.forEach((p, i) => {
    const maxP = p.tot + rem * 3
    const puede = maxP >= top
    if (puede) {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`
      lines.push(`${medal} *${p.nombre || p.name}* — ${p.tot}pts (máx ${maxP})`)
      hayAlguno = true
    }
  })
  if (!hayAlguno) lines.push('_Nadie puede ganar... algo salió muy mal_ 😅')
  lines.push('')
  lines.push(`_${rem} partidos restantes · Exacto=3pts_`)
  return lines.join('\n')
}

async function verificarPartidosEnVivo(forzar = false) {
  if (!process.env.FOOTBALL_API_KEY) { if (forzar) console.log('⚠ FOOTBALL_API_KEY no configurada'); return }
  try {
    // Ventana de ±1 día: un partido a las 22:00/23:00 ARG ya es "mañana" en UTC para la API
    const ahora       = Date.now()
    const dateFrom    = new Date(ahora - 24 * 3600 * 1000).toISOString().slice(0, 10)
    const dateTo      = new Date(ahora + 24 * 3600 * 1000).toISOString().slice(0, 10)
    const competition = process.env.FOOTBALL_COMPETITION || 'WC'
    const apiBase     = process.env.FOOTBALL_API_BASE || 'https://api.football-data.org'
    const res = await axios.get(`${apiBase}/v4/competitions/${competition}/matches`, {
      params: { dateFrom, dateTo },
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
      timeout: 10000
    })
    const matches = res.data?.matches || []
    if (forzar) console.log(`📡 API: ${matches.length} partidos encontrados (${dateFrom} a ${dateTo})`)
    // Matcheo por nombres contra todos los partidos (en fase de grupos cada cruce es único)
    const { data: dbPartidos } = await supabase.from('partidos').select('*')

    let huboUpdate = false
    for (const f of matches) {
      const status = f.status
      const g1     = f.score?.fullTime?.home ?? null
      const g2     = f.score?.fullTime?.away ?? null
      const t1     = mapTeam(f.homeTeam?.name || '')
      const t2     = mapTeam(f.awayTeam?.name || '')
      const partido = dbPartidos?.find(p => (p.equipo1 === t1 && p.equipo2 === t2) || (p.equipo1 === t2 && p.equipo2 === t1))
      if (!partido) { if (forzar) console.log(`⚠ No encontrado: "${t1}" vs "${t2}"`); continue }

      if (g1 !== null && g2 !== null && (partido.goles1 !== g1 || partido.goles2 !== g2)) {
        await supabase.from('partidos').update({ goles1: g1, goles2: g2 }).eq('id', partido.id)
        huboUpdate = true
        if (forzar) console.log(`📊 ${partido.equipo1} ${g1}-${g2} ${partido.equipo2}`)
      }

      const key = partido.id
      // Solo anunciar finales recientes (evita re-anunciar viejos si el server se reinicia)
      const inicioMs = new Date(f.utcDate || 0).getTime()
      const esReciente = ahora - inicioMs < 4 * 3600 * 1000
      if (status === 'FINISHED' && esReciente && !finalizados.has(key)) {
        finalizados.add(key)
        const msgFin = await mensajeFinPartido({ ...partido, goles1: g1, goles2: g2 })
        await enviarAlGrupo(msgFin)
        console.log(`🏁 FIN: ${partido.equipo1} ${g1}-${g2} ${partido.equipo2}`)
        setTimeout(async () => {
          try {
            const board = await buildBoard()
            const img   = await generarTablaImagen(board, 'oficial')
            await enviarImagenAlGrupo(img, silvina.captionOficial())
          } catch(e) { console.error(e.message) }
        }, 3000)
      }
    }

    // Cambio de líder en vivo (solo con punta en solitario, para no anunciar empates)
    if (huboUpdate) {
      const board = await buildBoard()
      if (board.length > 1 && board[0].tot > board[1].tot) {
        const punta = board[0].nombre
        if (liderActual && punta !== liderActual) {
          await enviarAlGrupo(silvina.cambioLider(punta, liderActual))
          console.log(`👑 Cambio de líder: ${liderActual} → ${punta}`)
        }
        liderActual = punta
      }
    }
  } catch (e) {
    if (e.response?.status === 429) console.log('⚠ Rate limit API')
    else console.error('Error polling:', e.message)
  }
}


cron.schedule('*/2 * * * *', async () => {
  await verificarPartidosEnVivo()
})

// Previa: 15 min antes de cada partido, Silvina cuenta qué pronosticó cada uno
const previaAnunciada = new Set()
const ahoraARGmin = () => {
  const s = new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })
  const [h, m] = s.split(':')
  return parseInt(h) * 60 + parseInt(m)
}

cron.schedule('*/5 * * * *', async () => {
  try {
    if (!process.env.GROUP_ID || !botSock) return
    const hoy = hoyARG()
    const { data: pHoy } = await supabase.from('partidos').select('*').eq('fecha', hoy).is('goles1', null)
    if (!pHoy?.length) return
    const ahora = ahoraARGmin()
    const proximos = pHoy.filter(p => {
      if (!p.hora || previaAnunciada.has(p.id)) return false
      const [h, m] = p.hora.split(':').map(Number)
      const diff = h * 60 + m - ahora
      return diff > 0 && diff <= 15
    })
    if (!proximos.length) return
    proximos.forEach(p => previaAnunciada.add(p.id))
    const { data: jugadores }   = await supabase.from('jugadores').select('*').order('orden')
    const { data: pronosticos } = await supabase.from('pronosticos').select('*')
    await enviarAlGrupo(silvina.previa(proximos, jugadores || [], pronosticos || []))
    console.log(`🍿 Previa enviada: ${proximos.map(p => p.equipo1 + '-' + p.equipo2).join(', ')}`)
  } catch (e) { console.error('Error previa:', e.message) }
})

// Reclamo de pronósticos — 10:00 ARG (13:00 UTC), todos los días hasta el fin de grupos.
// Silvina seduce a los que no completaron sus 72.
const WEB_URL = 'https://mdd145-prog.github.io/Prode-Mundial-2026-LVM/'
cron.schedule('0 13 * * *', async () => {
  try {
    if (hoyARG() > '2026-06-27') return  // termina con la fase de grupos
    const { data: jugadores }   = await supabase.from('jugadores').select('*').order('orden')
    const { data: pronosticos } = await supabase.from('pronosticos').select('jugador_id,goles1')
    if (!jugadores?.length) return
    const conteo = j => (pronosticos || []).filter(p => p.jugador_id === j.id && p.goles1 !== null).length
    const sinNada = [], incompletos = [], completos = []
    for (const j of jugadores) {
      const done = conteo(j)
      if (done === 0) sinNada.push(j.nombre)
      else if (done < 72) incompletos.push({ nombre: j.nombre, done })
      else completos.push(j.nombre)
    }
    if (!sinNada.length && !incompletos.length) return  // todos cumplieron, Silvina descansa
    await enviarAlGrupo(silvina.reclamo(sinNada, incompletos, completos, WEB_URL))
    console.log(`💋 Reclamo enviado: ${sinNada.length} sin nada, ${incompletos.length} a medias`)
  } catch (e) { console.error('Error reclamo:', e.message) }
})

// Resumen nocturno de Silvina — 01:30 ARG (04:30 UTC), cierra el día anterior
cron.schedule('30 4 * * *', async () => {
  try {
    const ayer = new Date(Date.now() - 24 * 3600e3).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
    const { data: partidos } = await supabase.from('partidos').select('*')
    const delDia = (partidos || []).filter(p => p.fecha === ayer && p.goles1 !== null)
    if (!delDia.length) return
    const { data: jugadores }   = await supabase.from('jugadores').select('*').order('orden')
    const { data: pronosticos } = await supabase.from('pronosticos').select('*')
    const stats = (jugadores || []).map(j => {
      let pts = 0, ex = 0, fail = 0
      for (const p of delDia) {
        const pr = pronosticos?.find(x => x.jugador_id === j.id && x.partido_id === p.id)
        const k = calcPts(pr, p)
        if (k === 3) { pts += 3; ex++ } else if (k === 1) { pts++ } else if (k === 0) { fail++ }
      }
      return { nombre: j.nombre, pts, ex, fail }
    }).sort((a, b) => b.pts - a.pts)
    await enviarAlGrupo(silvina.resumenNocturno(ayer, delDia, stats))
    console.log('🌙 Resumen nocturno enviado:', ayer)
  } catch (e) { console.error('Error resumen nocturno:', e.message) }
})

// Cron 8am Argentina (11am UTC) — manda resumen del dia si hay partidos
cron.schedule('0 11 * * *', async () => {
  try {
    const hoy = hoyARG()
    const { data: partidos } = await supabase.from('partidos').select('*').eq('fecha', hoy)
    if (!partidos || partidos.length === 0) return
    console.log('Enviando resumen del dia:', hoy)
    const { data: jugs }  = await supabase.from('jugadores').select('*').order('orden')
    const { data: preds } = await supabase.from('pronosticos').select('*')
    const img = await generarImagenDia(partidos, jugs || [], preds || [], hoy)
    await enviarImagenAlGrupo(img, silvina.captionDia())
  } catch(e) { console.error('Error cron 8am:', e.message) }
})

// ── Conexión WhatsApp (Baileys) ────────────────────────────
async function conectarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_baileys')

  // Obtener versión actual de WhatsApp Web (evita error 405)
  let version = [2, 3000, 1015901307]
  try {
    const latest = await fetchLatestBaileysVersion()
    version = latest.version
    console.log(`📱 WA versión: ${version.join('.')}`)
  } catch(e) {
    console.log('⚠ No se pudo obtener versión WA, usando fallback')
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: undefined,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      ultimoQR = qr
      console.log('\n=== QR disponible en: https://prode-server-2.onrender.com/qr ===\n')
    }
    if (connection === 'close') {
      ultimoQR = null
      botSock  = null
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('Desconectado. Código:', code)
      if (code === 405 || code === DisconnectReason.loggedOut) {
        // Sesión inválida — limpiar credenciales para forzar QR nuevo
        const fs = require('fs')
        try { fs.rmSync('./auth_baileys', { recursive: true, force: true }); console.log('🗑 Credenciales limpiadas') } catch(e) {}
        console.log('Reconectando para nuevo QR...')
        setTimeout(conectarBot, 3000)
      } else {
        console.log('Reconectando en 5s...')
        setTimeout(conectarBot, 5000)
      }
    } else if (connection === 'open') {
      ultimoQR = null
      botSock  = sock
      console.log('✅ Bot conectado!')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (!msg.message) continue
      if (msg.key.fromMe) continue
      try { await handleMessage(sock, msg) } catch(e) { console.error('msg error:', e.message) }
    }
  })
}

// ── Endpoints HTTP ────────────────────────────────────────
app.get('/qr', async (req, res) => {
  if (!ultimoQR) {
    return res.send(`<html><body style="background:#1a1a2e;color:white;font-family:sans-serif;text-align:center;padding:40px">
      <h2>⚽ Prode Bot</h2><p>Bot ya conectado o QR no disponible aún.</p>
      <p>Refrescá en 15 segundos.</p>
      <script>setTimeout(()=>location.reload(),15000)</script></body></html>`)
  }
  try {
    const imgUrl = await QRCode.toDataURL(ultimoQR, { width: 350 })
    res.send(`<html><head><title>QR Prode Bot</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#1a1a2e;color:white;font-family:sans-serif;gap:16px;margin:0">
        <h2 style="margin:0">⚽ Prode Bot — Vincular WhatsApp</h2>
        <img src="${imgUrl}" style="border:8px solid white;border-radius:12px"/>
        <p style="text-align:center;max-width:300px;color:#aaa">iPhone X: WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo</p>
        <p style="color:#f0c030;font-size:13px">El QR expira en ~60 segundos</p>
        <button onclick="location.reload()" style="padding:10px 24px;background:#6a0dad;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">🔄 Refrescar QR</button>
        <script>setTimeout(()=>location.reload(),55000)</script>
      </body></html>`)
  } catch(e) { res.status(500).send('Error: ' + e.message) }
})

// Auth para endpoints /admin/* — requiere header x-admin-token igual a ADMIN_TOKEN
app.use('/admin', (req, res, next) => {
  const token = process.env.ADMIN_TOKEN
  if (!token) return res.status(503).json({ error: 'ADMIN_TOKEN no configurado en el server' })
  if (req.headers['x-admin-token'] !== token) return res.status(401).json({ error: 'No autorizado' })
  next()
})

app.post('/admin/sync', async (req, res) => {
  const { jugadores, pronosticos } = req.body
  if (jugadores) await supabase.from('jugadores').upsert(jugadores)
  if (pronosticos) {
    for (const [jugadorId, preds] of Object.entries(pronosticos)) {
      for (const [partidoId, pred] of Object.entries(preds)) {
        if (pred?.s1 !== null && pred?.s2 !== null) {
          await supabase.from('pronosticos').upsert({ jugador_id: jugadorId, partido_id: partidoId, goles1: pred.s1, goles2: pred.s2 })
        }
      }
    }
  }
  res.json({ ok: true })
})

app.get('/preview/proba', async (req, res) => {
  try {
    if (!process.env.ODDS_API_KEY) return res.send('ODDS_API_KEY no configurada')
    const result = await calcProbaBoard()
    if (!result) return res.send('No hay datos')
    if (result.oddsCount === 0) return res.send('Odds no disponibles aún para el Mundial 2026')
    const img = await generarTablaProba(result.results, result.sims)
    res.setHeader('Content-Type', 'image/png')
    res.send(img)
  } catch(e) { res.status(500).send('Error: ' + e.message) }
})

app.get('/', (req, res) => res.json({ status: 'ok', app: 'Prode Bot 2026 (Baileys)' }))

// ── Preview endpoints (para testear imágenes sin WhatsApp) ──
app.get('/preview/oficial', async (req, res) => {
  try {
    const board = await buildBoard()
    if (!board.length) return res.send('No hay datos')
    const img = await generarTablaImagen(board, 'oficial')
    res.setHeader('Content-Type', 'image/png')
    res.send(img)
  } catch(e) { res.status(500).send('Error: ' + e.message) }
})

app.get('/preview/chances', async (req, res) => {
  try {
    const board = await buildBoard()
    if (!board.length) return res.send('No hay datos')
    const { data: partidos } = await supabase.from('partidos').select('id,goles1')
    const img = await generarTablaChances(board, partidos||[])
    res.setHeader('Content-Type','image/png'); res.send(img)
  } catch(e){res.status(500).send('Error: '+e.message)}
})

app.get('/preview/nooficial', async (req, res) => {
  try {
    const board = await buildBoard()
    if (!board.length) return res.send('No hay datos')
    const { data: pAll } = await supabase.from('partidos').select('id,goles1')
    const jugados = pAll?.filter(p => p.goles1 !== null).length || 0
    const img = await generarTablaImagen(board, 'nooficial', { jugados })
    res.setHeader('Content-Type', 'image/png')
    res.send(img)
  } catch(e) { res.status(500).send('Error: ' + e.message) }
})

app.get('/preview/dia', async (req, res) => {
  try {
    const fecha = req.query.fecha || hoyARG()
    const { data: pHoy }  = await supabase.from('partidos').select('*').eq('fecha', fecha)
    if (!pHoy?.length) return res.send(`No hay partidos el ${fecha}`)
    const { data: jugs }  = await supabase.from('jugadores').select('*').order('orden')
    const { data: preds } = await supabase.from('pronosticos').select('*')
    const img = await generarImagenDia(pHoy, jugs || [], preds || [], fecha)
    res.setHeader('Content-Type', 'image/png')
    res.send(img)
  } catch(e) { res.status(500).send('Error: ' + e.message) }
})

// ── Arrancar ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`HTTP en puerto ${PORT}`))
conectarBot().then(() => console.log('🚀 Iniciando conexión WhatsApp...')).catch(e => console.error('Error init:', e))
