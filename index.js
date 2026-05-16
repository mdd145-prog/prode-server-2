require('dotenv').config()
const express = require('express')
const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const { generarTablaImagen } = require('./tablaImagen')

const app = express()
app.use(express.json())

// ── Clientes ──────────────────────────────────────────────
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// ── Helpers WhatsApp ──────────────────────────────────────
async function enviarMensaje(to, texto) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}/messages`,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: texto } },
    { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' } }
  )
}

async function enviarImagen(to, imagenBuffer, caption) {
  // Subir imagen como form-data
  const FormData = require('form-data')
  const form = new FormData()
  form.append('file', imagenBuffer, { filename: 'tabla.jpg', contentType: 'image/jpeg' })
  form.append('type', 'image/jpeg')
  form.append('messaging_product', 'whatsapp')

  const uploadRes = await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}/media`,
    form,
    { headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.WA_TOKEN}` } }
  )
  const mediaId = uploadRes.data.id

  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}/messages`,
    { messaging_product: 'whatsapp', to, type: 'image', image: { id: mediaId, caption } },
    { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' } }
  )
}

// ── Lógica de puntos ──────────────────────────────────────
function calcPts(pred, partido) {
  if (partido.goles1 === null || partido.goles2 === null) return null
  if (!pred || pred.goles1 === null || pred.goles2 === null) return 0
  if (pred.goles1 === partido.goles1 && pred.goles2 === partido.goles2) return 3
  const tendPred = pred.goles1 > pred.goles2 ? 1 : pred.goles1 < pred.goles2 ? -1 : 0
  const tendReal = partido.goles1 > partido.goles2 ? 1 : partido.goles1 < partido.goles2 ? -1 : 0
  return tendPred === tendReal ? 1 : 0
}

async function buildBoard() {
  const { data: jugadores } = await supabase.from('jugadores').select('*').order('orden')
  const { data: partidos } = await supabase.from('partidos').select('*')
  const { data: pronosticos } = await supabase.from('pronosticos').select('*')

  return jugadores.map(j => {
    let tot = 0, ex = 0, lv = 0, fail = 0, jug = 0
    const preds = pronosticos.filter(p => p.jugador_id === j.id)
    for (const partido of partidos) {
      if (partido.goles1 === null) continue
      const pred = preds.find(p => p.partido_id === partido.id)
      const pts = calcPts(pred, partido)
      if (pts === null) continue
      jug++; tot += pts
      if (pts === 3) ex++
      else if (pts === 1) lv++
      else fail++
    }
    const pct = jug > 0 ? ((ex / jug) * 100).toFixed(0) + '%' : '-'
    return { ...j, tot, ex, lv, fail, jug, pct }
  }).sort((a, b) => b.tot - a.tot)
}

// ── Formatear tabla texto ─────────────────────────────────
async function tablaTexto(oficial = false) {
  const board = await buildBoard()
  const { data: partidos } = await supabase.from('partidos').select('*')
  const jugados = partidos.filter(p => p.goles1 !== null).length
  const total = partidos.length

  // Partido en vivo (si existe)
  const ahora = new Date()
  const enVivo = partidos.find(p => {
    if (!p.en_vivo) return false
    return true
  })

  const titulo = oficial ? '🏆 TABLA OFICIAL' : '📊 TABLA'
  const fecha = ahora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  const lines = [
    `⚽ *PRODE MUNDIAL 2026*`,
    `${titulo} · ${fecha}`,
    `_${jugados}/${total} partidos jugados_`,
  ]

  if (enVivo) {
    lines.push(``, `🔴 *EN VIVO* ${enVivo.equipo1} ${enVivo.goles1 ?? 0}-${enVivo.goles2 ?? 0} ${enVivo.equipo2} (${enVivo.minuto || ''}')`)
  }

  lines.push(``)
  board.forEach((p, i) => {
    const pos = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
    const ex = p.ex > 0 ? ` ⚡${p.ex}` : ''
    lines.push(`${pos} *${p.nombre}* — ${p.tot}pts${ex}`)
  })
  lines.push(``, `_⚡Exacto=3pts · 📈Levante=1pt_`)
  return lines.join('\n')
}

// ── Tabla del día texto ───────────────────────────────────
async function tablaDiaTexto(fecha) {
  const { data: partidos } = await supabase.from('partidos').select('*').eq('fecha', fecha)
  if (!partidos || !partidos.length) return `No hay partidos el ${fecha}`

  const { data: jugadores } = await supabase.from('jugadores').select('*').order('orden')
  const { data: pronosticos } = await supabase.from('pronosticos').select('*')

  const lines = [`📅 *PARTIDOS ${fecha}*`, ``]
  for (const p of partidos) {
    const res = p.goles1 !== null ? `${p.goles1}-${p.goles2}` : p.en_vivo ? `${p.goles1 ?? 0}-${p.goles2 ?? 0} 🔴` : p.hora
    lines.push(`*${p.equipo1} ${res} ${p.equipo2}* (G${p.grupo})`)
    for (const j of jugadores) {
      const pred = pronosticos.find(pr => pr.jugador_id === j.id && pr.partido_id === p.id)
      const predTxt = pred && pred.goles1 !== null ? `${pred.goles1}-${pred.goles2}` : '-'
      const pts = calcPts(pred, p)
      const icon = pts === 3 ? '✅' : pts === 1 ? '📈' : pts === 0 ? '❌' : '⏳'
      lines.push(`  ${icon} ${j.nombre}: ${predTxt}`)
    }
    lines.push(``)
  }
  return lines.join('\n')
}

// ── Mensaje fin de partido ────────────────────────────────
async function mensajeFinPartido(partido) {
  const { data: jugadores } = await supabase.from('jugadores').select('*').order('orden')
  const { data: pronosticos } = await supabase.from('pronosticos').select('*').eq('partido_id', partido.id)

  const lines = [
    `⚽ *FIN: ${partido.equipo1} ${partido.goles1}-${partido.goles2} ${partido.equipo2}*`,
    ``
  ]
  jugadores.forEach(j => {
    const pred = pronosticos.find(p => p.jugador_id === j.id)
    const predTxt = pred && pred.goles1 !== null ? `${pred.goles1}-${pred.goles2}` : '-'
    const pts = calcPts(pred, partido)
    const icon = pts === 3 ? '✅ +3' : pts === 1 ? '📈 +1' : '❌ 0'
    lines.push(`${icon} *${j.nombre}* pronosticó ${predTxt}`)
  })
  return lines.join('\n')
}

// ── Webhook Meta ──────────────────────────────────────────
// ── Webhook Meta ──────────────────────────────────────────
app.get('/webhook', (req, res) => {
  // Ponemos la contraseña fija directamente acá
  const miContrasena = "MiProdeMundial2026";
  
  if (req.query['hub.verify_token'] === miContrasena) {
    res.send(req.query['hub.challenge'])
  } else {
    res.sendStatus(403)
  }
})

app.post('/webhook', async (req, res) => {
  res.sendStatus(200)
  try {
    const entry = req.body.entry?.[0]
    const changes = entry?.changes?.[0]
    const msg = changes?.value?.messages?.[0]
    if (!msg || msg.type !== 'text') return

    const from = msg.from
    const texto = msg.text.body.trim().toLowerCase()
    const groupId = process.env.GROUP_ID

    // Solo responder si viene del grupo
    if (from !== groupId) return

    if (texto === '!tabla') {
      const txt = await tablaTexto(false)
      await enviarMensaje(groupId, txt)
    }
    else if (texto === '!oficial') {
      const board = await buildBoard()
      const img = await generarTablaImagen(board, 'oficial')
      await enviarImagen(groupId, img, '🏆 TABLA OFICIAL — PRODE MUNDIAL 2026')
    }
    else if (texto === '!hoy') {
      const hoy = new Date().toISOString().slice(0, 10)
      const txt = await tablaDiaTexto(hoy)
      await enviarMensaje(groupId, txt)
    }
    else if (texto.startsWith('!dia ')) {
      const fecha = texto.replace('!dia ', '').trim()
      const txt = await tablaDiaTexto(fecha)
      await enviarMensaje(groupId, txt)
    }
    else if (texto === '!ayuda') {
      await enviarMensaje(groupId,
        `🤖 *Comandos disponibles:*\n\n` +
        `!tabla → Tabla de posiciones\n` +
        `!oficial → Tabla oficial (imagen)\n` +
        `!hoy → Partidos de hoy\n` +
        `!dia YYYY-MM-DD → Partidos de una fecha\n` +
        `!ayuda → Este mensaje`
      )
    }
  } catch (e) {
    console.error('Webhook error:', e.message)
  }
})

// ── Polling API-Sports ────────────────────────────────────
const partidosFinalizados = new Set()

async function verificarPartidosEnVivo() {
  if (!process.env.APISPORTS_KEY) return
  try {
    const hoy = new Date().toISOString().slice(0, 10)
    const res = await axios.get('https://v3.football.api-sports.io/fixtures', {
      params: { date: hoy, league: 1, season: 2026 },
      headers: { 'x-apisports-key': process.env.APISPORTS_KEY }
    })

    const fixtures = res.data.response || []
    for (const f of fixtures) {
      const status = f.fixture.status.short
      const apiId = f.fixture.id
      const home = f.teams.home.name
      const away = f.teams.away.name
      const g1 = f.goals.home
      const g2 = f.goals.away
      const minuto = f.fixture.status.elapsed

      // Buscar partido en nuestra DB por equipos
      const { data: partido } = await supabase.from('partidos')
        .select('*')
        .ilike('equipo1', `%${home.slice(0,4)}%`)
        .ilike('equipo2', `%${away.slice(0,4)}%`)
        .single()

      if (!partido) continue

      // Actualizar goles en tiempo real
      if (['1H','HT','2H','ET','BT','P'].includes(status)) {
        await supabase.from('partidos').update({ goles1: g1, goles2: g2, en_vivo: true, minuto }).eq('id', partido.id)
      }

      // Partido finalizado
      if (status === 'FT' && !partidosFinalizados.has(apiId)) {
        partidosFinalizados.add(apiId)
        await supabase.from('partidos').update({ goles1: g1, goles2: g2, en_vivo: false, minuto: null }).eq('id', partido.id)

        // Mandar resultado al grupo
        const partActualizado = { ...partido, goles1: g1, goles2: g2 }
        const msgFin = await mensajeFinPartido(partActualizado)
        await enviarMensaje(process.env.GROUP_ID, msgFin)

        // Esperar 3 segundos y mandar tabla oficial como imagen
        setTimeout(async () => {
          const board = await buildBoard()
          const img = await generarTablaImagen(board, 'oficial')
          await enviarImagen(process.env.GROUP_ID, img, '🏆 TABLA ACTUALIZADA')
        }, 3000)
      }
    }
  } catch (e) {
    console.error('Polling error:', e.message)
  }
}

// Polling adaptativo: cada 2 min durante el día del partido
cron.schedule('*/2 * * * *', async () => {
  const hora = new Date().getHours()
  if (hora >= 12 && hora <= 23) {
    await verificarPartidosEnVivo()
  }
})

// ── Cargar fixture inicial en DB ──────────────────────────
app.post('/admin/cargar-fixture', async (req, res) => {
  // Este endpoint lo llama la app admin para sincronizar los partidos
  const { partidos } = req.body
  if (!partidos) return res.status(400).json({ error: 'Falta partidos' })
  const { error } = await supabase.from('partidos').upsert(partidos)
  if (error) return res.status(500).json({ error })
  res.json({ ok: true, count: partidos.length })
})

// ── Sincronizar jugadores y pronósticos desde app ─────────
app.post('/admin/sync', async (req, res) => {
  const { jugadores, pronosticos } = req.body
  if (jugadores) await supabase.from('jugadores').upsert(jugadores)
  if (pronosticos) {
    for (const [jugadorId, preds] of Object.entries(pronosticos)) {
      for (const [partidoId, pred] of Object.entries(preds)) {
        if (pred && pred.s1 !== null && pred.s2 !== null) {
          await supabase.from('pronosticos').upsert({
            jugador_id: jugadorId,
            partido_id: partidoId,
            goles1: pred.s1,
            goles2: pred.s2
          })
        }
      }
    }
  }
  res.json({ ok: true })
})

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', app: 'Prode Bot 2026' }))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`))
