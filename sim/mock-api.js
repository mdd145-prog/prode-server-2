// API falsa de football-data.org que simula el partido inaugural del Mundial
// (México vs Sudáfrica — m1 en la DB) transmitido "en vivo" acelerado.
//
// Línea de tiempo desde el arranque del script:
//   0-2 min   → IN_PLAY  0-0
//   2-4 min   → IN_PLAY  1-0  (gol de México)
//   4-6 min   → IN_PLAY  1-1  (empata Sudáfrica)
//   6-8 min   → IN_PLAY  2-1  (gol de México)
//   8+  min   → FINISHED 2-1
//
// Uso:  node sim/mock-api.js          (escucha en :4000)
// El bot local se apunta con: FOOTBALL_API_BASE=http://localhost:4000

const express = require('express')
const app = express()

const INICIO = Date.now()

function estadoActual() {
  const min = (Date.now() - INICIO) / 60000
  if (min < 2) return { status: 'IN_PLAY', home: 0, away: 0 }
  if (min < 4) return { status: 'IN_PLAY', home: 1, away: 0 }
  if (min < 6) return { status: 'IN_PLAY', home: 1, away: 1 }
  if (min < 8) return { status: 'IN_PLAY', home: 2, away: 1 }
  return { status: 'FINISHED', home: 2, away: 1 }
}

app.get('/v4/competitions/:comp/matches', (req, res) => {
  const e = estadoActual()
  console.log(`📡 consulta del bot → ${e.status} ${e.home}-${e.away}`)
  res.json({
    matches: [{
      id: 999001,
      utcDate: new Date(INICIO).toISOString(),
      status: e.status,
      homeTeam: { name: 'Mexico' },        // nombres como los devuelve football-data
      awayTeam: { name: 'South Africa' },  // → TEAM_MAP los traduce a México/Sudáfrica
      score: { fullTime: { home: e.home, away: e.away } }
    }]
  })
})

app.listen(4000, () => console.log('⚽ Mock API en :4000 — México vs Sudáfrica EN VIVO (8 min de partido)'))
