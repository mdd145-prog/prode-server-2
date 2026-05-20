require('dotenv').config()
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const QRCode = require('qrcode')
const express = require('express')
const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const { generarTablaImagen } = require('./tablaImagen')

const app = express()
app.use(express.json())

// ── Clientes ──────────────────────────────────────────────
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// ── Constantes ────────────────────────────────────────────
const ADMIN_NUMBER = '5491157671081'
const ADMIN_JID    = `${ADMIN_NUMBER}@c.us`

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

// ── QR storage ────────────────────────────────────────────
let ultimoQR = null

// ── WhatsApp Client ───────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas',
      '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu'
    ]
  }
})

client.on('qr', qr => {
  ultimoQR = qr
  console.log('\n=== QR LISTO — abrí en el navegador: https://prode-server-2.onrender.com/qr ===\n')
  qrcode.generate(qr, { small: true })
  console.log('=========================================================================\n')
})
client.on('ready',        () => console.log('✅ Bot conectado!'))
client.on('auth_failure', m  => console.error('❌ Auth error:', m))
client.on('disconnected', r  => console.log('⚠️  Desconectado:', r))

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

async function mensajeFinPartido(partido) {
  const { data: jugadores }   = await supabase.from('jugadores').select('*').order('orden')
  const { data: pronosticos } = await supabase.from('pronosticos').select('*').eq('partido_id', partido.id)
  const lines = [`⚽ *FIN: ${partido.equipo1} ${partido.goles1}-${partido.goles2} ${partido.equipo2}*`, ``]
  ;(jugadores || []).forEach(j => {
    const pred    = pronosticos?.find(p => p.jugador_id === j.id)
    const predTxt = pred && pred.goles1 !== null ? `${pred.goles1}-${pred.goles2}` : '-'
    const pts     = calcPts(pred, partido)
    lines.push(`${pts === 3 ? '✅ +3' : pts === 1 ? '📈 +1' : '❌  0'} *${j.nombre}* pronosticó ${predTxt}`)
  })
  return lines.join('\n')
}

// ── Helpers de envío ──────────────────────────────────────
async function enviarAlGrupo(texto) {
  const g = process.env.GROUP_ID
  if (!g) return console.log('⚠ GROUP_ID no configurado')
  await client.sendMessage(g, texto)
}

async function enviarImagenAlGrupo(buffer, caption) {
  const g = process.env.GROUP_ID
  if (!g) return console.log('⚠ GROUP_ID no configurado')
  const media = new MessageMedia('image/jpeg', buffer.toString('base64'))
  await client.sendMessage(g, media, { caption })
}

// ── Handler de mensajes ───────────────────────────────────
client.on('message', async msg => {
  const groupId     = process.env.GROUP_ID
  const testingMode = !groupId

  if (msg.from.endsWith('@g.us')) {
    console.log(`📨 GRUPO ID: ${msg.from}`)
  }

  const isFromGroup    = msg.from === groupId
  const isPrivateAdmin = !msg.from.endsWith('@g.us') && msg.from === ADMIN_JID
  const isGroupAdmin   = msg.from.endsWith('@g.us') && msg.author === ADMIN_JID
  const senderIsAdmin  = isPrivateAdmin || isGroupAdmin

  if (!testingMode && !isFromGroup && !isPrivateAdmin) return
  if (testingMode  && !isPrivateAdmin) return

  const respondTo = msg.from
  const texto     = msg.body?.trim().toLowerCase() || ''
  console.log(`🤖 CMD: "${texto}"`)

  try {
    if (texto === '!tabla') {
      await client.sendMessage(respondTo, await tablaTexto())
    }
    else if (texto === '!oficial') {
      const board = await buildBoard()
      if (!board.length) { await client.sendMessage(respondTo, 'No hay datos aún'); return }
      const img = await generarTablaImagen(board, 'oficial')
      await client.sendMessage(respondTo, new MessageMedia('image/jpeg', img.toString('base64')), { caption: '🏆 TABLA OFICIAL — PRODE MUNDIAL 2026' })
    }
    else if (texto === '!hoy') {
      await client.sendMessage(respondTo, await tablaDiaTexto(new Date().toISOString().slice(0, 10)))
    }
    else if (texto.startsWith('!dia ')) {
      await client.sendMessage(respondTo, await tablaDiaTexto(texto.replace('!dia ', '').trim()))
    }
    else if (texto === '!ayuda' || texto === 'hola' || texto === 'ping') {
      await client.sendMessage(respondTo,
        `🤖 *Prode Mundial 2026 — Comandos:*\n\n` +
        `!tabla → Tabla de posiciones\n!oficial → Tabla (imagen)\n` +
        `!hoy → Partidos de hoy\n!dia YYYY-MM-DD → Partidos de fecha\n!ayuda → Este mensaje`)
    }
    else if (senderIsAdmin && texto === '!forzar') {
      if (!groupId) { await client.sendMessage(respondTo, '❌ GROUP_ID no configurado'); return }
      const board = await buildBoard()
      const img   = await generarTablaImagen(board, 'oficial')
      await enviarImagenAlGrupo(img, '🏆 TABLA OFICIAL — PRODE MUNDIAL 2026')
      if (isPrivateAdmin) await client.sendMessage(respondTo, '✅ Tabla enviada al grupo')
    }
    else if (senderIsAdmin && texto === '!sync') {
      await client.sendMessage(respondTo, '🔄 Sincronizando...')
      await verificarPartidosEnVivo(true)
      await client.sendMessage(respondTo, '✅ Sync completado')
    }
    else if (senderIsAdmin && texto.startsWith('!resultado ')) {
      await handleResultadoManual(texto, respondTo)
    }
    else if (senderIsAdmin && texto === '!estado') {
      const { data: p } = await supabase.from('partidos').select('id').not('goles1', 'is', null)
      const { data: j } = await supabase.from('jugadores').select('id')
      await client.sendMessage(respondTo,
        `📊 *Estado:*\nJugadores: ${j?.length || 0}\nPartidos jugados: ${p?.length || 0}/72\n` +
        `GROUP_ID: ${groupId || '❌ NO CONFIGURADO'}\nAPI fútbol: ${process.env.FOOTBALL_API_KEY ? '✅' : '❌'}`)
    }
    else if (testingMode) {
      await client.sendMessage(respondTo, `Recibí: "${msg.body}". Probá con !ayuda`)
    }
  } catch (e) {
    console.error('Error handler:', e.message)
    try { await client.sendMessage(respondTo, `❌ Error: ${e.message}`) } catch {}
  }
})

// ── Resultado manual (admin) ──────────────────────────────
async function handleResultadoManual(texto, respondTo) {
  const partes = texto.replace('!resultado ', '').trim().split(' ')
  if (partes.length < 4) {
    await client.sendMessage(respondTo, '❌ Formato: !resultado Equipo1 goles1 Equipo2 goles2\nEj: !resultado Argentina 2 Francia 1')
    return
  }
  const g2 = parseInt(partes[partes.length - 1])
  const g1 = parseInt(partes[partes.length - 2])
  const mid = Math.floor(partes.length / 2)
  const t1 = partes.slice(0, mid).join(' ')
  const t2 = partes.slice(mid, partes.length - 2).join(' ')

  if (isNaN(g1) || isNaN(g2)) { await client.sendMessage(respondTo, '❌ Los goles deben ser números'); return }

  const { data: partidos } = await supabase.from('partidos').select('*')
  const partido = partidos?.find(p =>
    (p.equipo1.toLowerCase().includes(t1.toLowerCase()) || t1.toLowerCase().includes(p.equipo1.toLowerCase())) &&
    (p.equipo2.toLowerCase().includes(t2.toLowerCase()) || t2.toLowerCase().includes(p.equipo2.toLowerCase()))
  )
  if (!partido) { await client.sendMessage(respondTo, `❌ No encontré "${t1} vs ${t2}"`); return }

  const { error } = await supabase.from('partidos').update({ goles1: g1, goles2: g2 }).eq('id', partido.id)
  if (error) { await client.sendMessage(respondTo, `❌ Error: ${error.message}`); return }

  await client.sendMessage(respondTo, `✅ ${partido.equipo1} ${g1}-${g2} ${partido.equipo2}`)
  const groupId = process.env.GROUP_ID
  if (groupId) {
    const msgFin = await mensajeFinPartido({ ...partido, goles1: g1, goles2: g2 })
    await enviarAlGrupo(msgFin)
    setTimeout(async () => {
      try { const board = await buildBoard(); const img = await generarTablaImagen(board, 'oficial'); await enviarImagenAlGrupo(img, '🏆 TABLA ACTUALIZADA') } catch(e) { console.error(e.message) }
    }, 3000)
  }
}

// ── Polling football-data.org ─────────────────────────────
const finalizados = new Set()

async function verificarPartidosEnVivo(forzar = false) {
  if (!process.env.FOOTBALL_API_KEY) { if (forzar) console.log('⚠ FOOTBALL_API_KEY no configurada'); return }
  try {
    const hoy         = new Date().toISOString().slice(0, 10)
    const competition = process.env.FOOTBALL_COMPETITION || 'WC'
    const res = await axios.get(`https://api.football-data.org/v4/competitions/${competition}/matches`, {
      params: { dateFrom: hoy, dateTo: hoy },
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
      timeout: 10000
    })
    const matches = res.data?.matches || []
    if (forzar) console.log(`📡 API: ${matches.length} partidos encontrados`)

    const { data: dbHoy } = await supabase.from('partidos').select('*').eq('fecha', hoy)

    for (const f of matches) {
      const status = f.status
      const g1     = f.score?.fullTime?.home ?? null
      const g2     = f.score?.fullTime?.away ?? null
      const t1     = mapTeam(f.homeTeam?.name || '')
      const t2     = mapTeam(f.awayTeam?.name || '')
      const partido = dbHoy?.find(p => (p.equipo1 === t1 && p.equipo2 === t2) || (p.equipo1 === t2 && p.equipo2 === t1))
      if (!partido) { if (forzar) console.log(`⚠ No encontrado en DB: "${t1}" vs "${t2}"`); continue }

      // Actualizar goles si cambiaron
      if (g1 !== null && g2 !== null && (partido.goles1 !== g1 || partido.goles2 !== g2)) {
        await supabase.from('partidos').update({ goles1: g1, goles2: g2 }).eq('id', partido.id)
        if (forzar) console.log(`📊 ${partido.equipo1} ${g1}-${g2} ${partido.equipo2}`)
      }

      // Partido finalizado → avisar al grupo
      const key = `${hoy}_${partido.id}`
      if (status === 'FINISHED' && !finalizados.has(key)) {
        finalizados.add(key)
        const msgFin = await mensajeFinPartido({ ...partido, goles1: g1, goles2: g2 })
        await enviarAlGrupo(msgFin)
        console.log(`🏁 FIN: ${partido.equipo1} ${g1}-${g2} ${partido.equipo2}`)
        setTimeout(async () => {
          try { const board = await buildBoard(); const img = await generarTablaImagen(board, 'oficial'); await enviarImagenAlGrupo(img, '🏆 TABLA ACTUALIZADA') } catch(e) { console.error(e.message) }
        }, 3000)
      }
    }
  } catch (e) {
    if (e.response?.status === 429) console.log('⚠ Rate limit API fútbol')
    else console.error('Error polling:', e.message)
  }
}

// Polling cada 10 min entre 12 y 23hs (≤66 req/día = dentro del límite gratis)
cron.schedule('*/10 * * * *', async () => {
  if (new Date().getHours() >= 12) await verificarPartidosEnVivo()
})

// ── Endpoints HTTP ────────────────────────────────────────
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

// ── QR endpoint (para escanear desde el navegador) ───────
app.get('/qr', async (req, res) => {
  if (!ultimoQR) {
    return res.send(`
      <html><body style="background:#1a1a2e;color:white;font-family:sans-serif;text-align:center;padding:40px">
        <h2>⚽ Prode Bot</h2>
        <p>Bot ya conectado, o QR aún no generado.</p>
        <p>Refrescá en 15 segundos.</p>
        <script>setTimeout(()=>location.reload(), 15000)</script>
      </body></html>`)
  }
  try {
    const imgUrl = await QRCode.toDataURL(ultimoQR, { width: 350 })
    res.send(`
      <html><head><title>QR Prode Bot</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#1a1a2e;color:white;font-family:sans-serif;gap:16px;margin:0">
        <h2 style="margin:0">⚽ Prode Bot — Vincular WhatsApp</h2>
        <img src="${imgUrl}" style="border:8px solid white;border-radius:12px"/>
        <p style="text-align:center;max-width:300px;color:#aaa">En el iPhone X: WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo</p>
        <p style="color:#f0c030;font-size:13px">El QR expira en ~60 segundos</p>
        <button onclick="location.reload()" style="padding:10px 24px;background:#6a0dad;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">🔄 Refrescar QR</button>
        <script>setTimeout(()=>location.reload(), 55000)</script>
      </body></html>`)
  } catch(e) {
    res.status(500).send('Error generando QR: ' + e.message)
  }
})

app.get('/', (req, res) => res.json({ status: 'ok', app: 'Prode Bot 2026' }))

// ── Arrancar ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`HTTP en puerto ${PORT}`))
client.initialize()
console.log('🚀 Iniciando bot WhatsApp...')
