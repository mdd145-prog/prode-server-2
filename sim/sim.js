// Simulación pre-Mundial: usa partidos reales del Brasileirão (BSA) para probar
// el flujo completo del bot (polling → DB → puntos) SIN tocar el grupo de WhatsApp.
//
// Uso (desde prode-server-2/):
//   node sim/sim.js partidos          → lista partidos de BSA de los próximos días (API)
//   node sim/sim.js setup [fecha]     → inserta partidos de prueba + jugador TEST_BOT con pronósticos
//   node sim/sim.js status            → compara DB vs API en vivo y muestra puntos del TEST_BOT
//   node sim/sim.js cleanup           → borra TODOS los datos de prueba
//
// Requiere .env con: FOOTBALL_API_KEY, SUPABASE_URL, SUPABASE_KEY (service_role)

require('dotenv').config()
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

const COMP = process.env.SIM_COMPETITION || 'BSA'
const TEST_PREFIX = 'test_'
const TEST_JUGADOR = { id: 'ptest_bot', nombre: 'TEST_BOT', orden: 999 }

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const argFecha = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
const argHora  = d => new Date(d).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false })

async function apiMatches(diasAdelante = 5) {
  const ahora = Date.now()
  const dateFrom = new Date(ahora - 24 * 3600e3).toISOString().slice(0, 10)
  const dateTo   = new Date(ahora + diasAdelante * 24 * 3600e3).toISOString().slice(0, 10)
  const res = await axios.get(`https://api.football-data.org/v4/competitions/${COMP}/matches`, {
    params: { dateFrom, dateTo },
    headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
    timeout: 15000
  })
  return res.data?.matches || []
}

// igual que calcPts del server
function calcPts(pred, g1, g2) {
  if (g1 === null || g2 === null) return null
  if (!pred || pred.goles1 === null) return 0
  if (pred.goles1 === g1 && pred.goles2 === g2) return 3
  const tend = (a, b) => a > b ? 1 : a < b ? -1 : 0
  return tend(pred.goles1, pred.goles2) === tend(g1, g2) ? 1 : 0
}

async function cmdPartidos() {
  const matches = await apiMatches()
  if (!matches.length) return console.log(`Sin partidos de ${COMP} en los próximos días.`)
  console.log(`\n📡 ${COMP} — ${matches.length} partidos (hora argentina):\n`)
  for (const m of matches) {
    const score = m.score?.fullTime?.home !== null ? ` [${m.score.fullTime.home}-${m.score.fullTime.away}]` : ''
    console.log(`  ${argFecha(m.utcDate)} ${argHora(m.utcDate)}  ${m.homeTeam.name} vs ${m.awayTeam.name}  · ${m.status}${score}`)
  }
  console.log(`\nPara armar la prueba: node sim/sim.js setup <fecha de arriba>\n`)
}

async function cmdSetup(fecha) {
  fecha = fecha || argFecha(new Date())
  const matches = (await apiMatches()).filter(m => argFecha(m.utcDate) === fecha)
  if (!matches.length) return console.log(`No hay partidos de ${COMP} el ${fecha}. Probá con: node sim/sim.js partidos`)

  const rows = matches.map(m => ({
    id: `${TEST_PREFIX}${m.id}`,
    grupo: 'T',
    equipo1: m.homeTeam.name,   // nombre EXACTO de la API → el bot lo matchea directo
    equipo2: m.awayTeam.name,
    goles1: null, goles2: null,
    fecha, hora: argHora(m.utcDate)
  }))
  const { error: e1 } = await sb.from('partidos').upsert(rows)
  if (e1) return console.error('Error insertando partidos:', e1.message)

  const { error: e2 } = await sb.from('jugadores').upsert(TEST_JUGADOR)
  if (e2) return console.error('Error insertando jugador:', e2.message)

  // pronósticos variados para ver exacto/levante/fallado
  const preds = rows.map((r, i) => ({
    jugador_id: TEST_JUGADOR.id,
    partido_id: r.id,
    goles1: i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 0,
    goles2: i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 0,
  }))
  const { error: e3 } = await sb.from('pronosticos').upsert(preds, { onConflict: 'jugador_id,partido_id' })
  if (e3) return console.error('Error insertando pronósticos:', e3.message)

  console.log(`\n✅ Listo. ${rows.length} partidos de prueba + TEST_BOT con pronósticos:\n`)
  rows.forEach((r, i) => console.log(`  ${r.id}  ${r.equipo1} vs ${r.equipo2}  ${r.hora}hs  · pronóstico TEST_BOT: ${preds[i].goles1}-${preds[i].goles2}`))
  console.log(`\nAhora en Render: FOOTBALL_COMPETITION=${COMP} y GROUP_ID vacío (¡para no tocar el grupo!).`)
  console.log(`Monitorear con: node sim/sim.js status\n`)
}

async function cmdStatus() {
  const { data: testPartidos } = await sb.from('partidos').select('*').like('id', `${TEST_PREFIX}%`)
  if (!testPartidos?.length) return console.log('No hay partidos de prueba en la DB. Corré: node sim/sim.js setup')
  const { data: preds } = await sb.from('pronosticos').select('*').eq('jugador_id', TEST_JUGADOR.id)
  const matches = await apiMatches()

  console.log(`\n🔎 ${new Date().toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} — DB vs API:\n`)
  for (const p of testPartidos) {
    const m = matches.find(x => `${TEST_PREFIX}${x.id}` === p.id)
    const api = m ? `${m.score?.fullTime?.home ?? '-'}-${m.score?.fullTime?.away ?? '-'} (${m.status})` : 'no encontrado en API'
    const db  = p.goles1 !== null ? `${p.goles1}-${p.goles2}` : 'sin resultado'
    const sync = m && ((m.score?.fullTime?.home ?? null) === p.goles1 && (m.score?.fullTime?.away ?? null) === p.goles2) ? '✅ sync' : '⏳ difieren'
    const pred = preds?.find(x => x.partido_id === p.id)
    const pts = calcPts(pred, p.goles1, p.goles2)
    const ptsTxt = pred ? ` · TEST_BOT ${pred.goles1}-${pred.goles2}${pts !== null ? ` → ${pts}pts` : ''}` : ''
    console.log(`  ${p.equipo1} vs ${p.equipo2}\n    DB: ${db} · API: ${api} · ${sync}${ptsTxt}\n`)
  }
}

async function cmdCleanup() {
  const { error: e1 } = await sb.from('pronosticos').delete().like('partido_id', `${TEST_PREFIX}%`)
  const { error: e2 } = await sb.from('pronosticos').delete().eq('jugador_id', TEST_JUGADOR.id)
  const { error: e3 } = await sb.from('jugadores').delete().eq('id', TEST_JUGADOR.id)
  const { error: e4 } = await sb.from('partidos').delete().like('id', `${TEST_PREFIX}%`)
  const errs = [e1, e2, e3, e4].filter(Boolean)
  if (errs.length) return errs.forEach(e => console.error('Error:', e.message))
  console.log('🗑 Datos de prueba eliminados (partidos test_*, TEST_BOT y sus pronósticos).')
  console.log('Acordate de restaurar en Render: FOOTBALL_COMPETITION=WC y el GROUP_ID real.')
}

const cmd = process.argv[2]
const run = { partidos: cmdPartidos, setup: () => cmdSetup(process.argv[3]), status: cmdStatus, cleanup: cmdCleanup }[cmd]
if (!run) { console.log('Uso: node sim/sim.js partidos|setup [fecha]|status|cleanup'); process.exit(1) }
run().catch(e => { console.error('Error:', e.response?.status ? `HTTP ${e.response.status} — ${JSON.stringify(e.response.data)}` : e.message); process.exit(1) })
