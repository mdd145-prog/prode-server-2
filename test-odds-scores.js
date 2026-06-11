// Test de The Odds API /scores como fuente alternativa de resultados.
// Uso:  ODDS_API_KEY=tu_key node test-odds-scores.js
const KEY = process.env.ODDS_API_KEY
if (!KEY) { console.error('❌ Falta ODDS_API_KEY'); process.exit(1) }

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

;(async () => {
  const url = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores/?apiKey=${KEY}&daysFrom=1`
  const t0 = Date.now()
  console.log(`\n🔎 Consultando The Odds API /scores (Mundial)\n`)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const ms = Date.now() - t0
    const data = await res.json()
    console.log(`⏱  Latencia: ${ms} ms · HTTP ${res.status}`)
    console.log(`📊 Quota: usados ${res.headers.get('x-requests-used') || '?'} · restantes ${res.headers.get('x-requests-remaining') || '?'}`)
    if (!Array.isArray(data)) { console.log('Respuesta:', data); return }
    console.log(`📡 Partidos: ${data.length}\n`)
    for (const m of data) {
      const hora = m.commence_time?.slice(11, 16)
      const fecha = m.commence_time?.slice(0, 10)
      const home = m.home_team
      const away = m.away_team
      const t1 = mapTeam(home)
      const t2 = mapTeam(away)
      const sH = m.scores?.find(s => s.name === home)?.score ?? '-'
      const sA = m.scores?.find(s => s.name === away)?.score ?? '-'
      const estado = m.completed ? '🏁 FIN' : (m.scores ? '🔴 LIVE' : '⏰ NS')
      const lastUpd = m.last_update ? ` · upd ${m.last_update.slice(11, 19)}Z` : ''
      console.log(`${fecha} ${hora}Z · ${estado} ${home} ${sH}-${sA} ${away}${lastUpd}`)
      const m1ok = t1 !== home ? '✓' : '⚠ sin map'
      const m2ok = t2 !== away ? '✓' : '⚠ sin map'
      console.log(`             → ${t1} (${m1ok}) vs ${t2} (${m2ok})`)
    }
  } catch (e) {
    console.error('❌ Error:', e.message)
  }
})()
