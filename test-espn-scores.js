// Test de ESPN scoreboard para Mundial.
// Uso:  node test-espn-scores.js           (todos los partidos del scoreboard ahora)
//       node test-espn-scores.js 20260611  (partidos de un día)

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

const fecha = process.argv[2] // opcional YYYYMMDD
const url = fecha
  ? `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fecha}`
  : `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`

;(async () => {
  const t0 = Date.now()
  console.log(`\n🔎 Consultando ESPN ${fecha ? `(día ${fecha})` : '(scoreboard actual)'}\n`)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const ms = Date.now() - t0
    const data = await res.json()
    console.log(`⏱  Latencia: ${ms} ms · HTTP ${res.status}`)
    const events = data?.events || []
    console.log(`📡 Partidos: ${events.length}\n`)
    if (!events.length) {
      console.log('(Sin partidos. Probá con una fecha:  node test-espn-scores.js 20260611)')
      return
    }
    for (const ev of events) {
      const comp = ev.competitions?.[0]
      const compet = comp?.competitors || []
      const home = compet.find(c => c.homeAway === 'home')
      const away = compet.find(c => c.homeAway === 'away')
      const rawH = home?.team?.displayName || home?.team?.name || '?'
      const rawA = away?.team?.displayName || away?.team?.name || '?'
      const sH   = home?.score ?? '-'
      const sA   = away?.score ?? '-'
      const st   = ev.status?.type
      const state = st?.state // 'pre' | 'in' | 'post'
      const detail = st?.shortDetail || st?.detail || st?.description || ''
      const hora = ev.date?.slice(11, 16) + 'Z'
      const dia  = ev.date?.slice(0, 10)
      const t1 = mapTeam(rawH)
      const t2 = mapTeam(rawA)
      const m1 = t1 !== rawH ? '✓' : '⚠ sin map'
      const m2 = t2 !== rawA ? '✓' : '⚠ sin map'
      const emoji = state === 'in' ? '🔴 LIVE' : state === 'post' ? '🏁 FIN' : '⏰ ' + (detail || 'NS')
      console.log(`${dia} ${hora} · ${emoji} ${rawH} ${sH}-${sA} ${rawA}  [${detail}]`)
      console.log(`             → ${t1} (${m1}) vs ${t2} (${m2})  state=${state}`)
    }
  } catch (e) {
    console.error('❌ Error:', e.message)
  }
})()
