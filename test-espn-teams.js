// Validador de nombres de equipos: pide a ESPN todo el Mundial y lista
// los que no tienen mapeo en TEAM_MAP (= van a salir en inglés en Supabase).
// Uso:  node test-espn-teams.js

const TEAM_MAP = {
  'Mexico': 'México', 'South Africa': 'Sudáfrica',
  'Korea Republic': 'Rep. de Corea', 'South Korea': 'Rep. de Corea',
  'Czechia': 'Rep. Checa', 'Czech Republic': 'Rep. Checa',
  'Canada': 'Canadá', 'Bosnia and Herzegovina': 'Bosnia Herz.',
  'Bosnia & Herzegovina': 'Bosnia Herz.', 'Bosnia-Herzegovina': 'Bosnia Herz.',
  'Qatar': 'Catar',
  'Switzerland': 'Suiza', 'Brazil': 'Brasil', 'Morocco': 'Marruecos',
  'Haiti': 'Haití', 'Scotland': 'Escocia',
  'United States': 'Estados Unidos', 'USA': 'Estados Unidos',
  'Paraguay': 'Paraguay', 'Australia': 'Australia',
  'Turkey': 'Turquía', 'Türkiye': 'Turquía',
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

// Set de los nombres que ya están en español como destino (lo que hay en Supabase)
const EQUIPOS_SUPABASE = new Set(Object.values(TEAM_MAP))
// Y los que se quedan igual (Paraguay, Australia, etc.) son válidos también
const PASS_THROUGH = new Set([
  'Paraguay','Australia','Ecuador','Senegal','Argentina','Austria',
  'Portugal','Ghana','Colombia','Uruguay'
])

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

;(async () => {
  // Rango fase de grupos del Mundial 2026: 11 jun → 27 jun (cubre algo más por seguridad)
  const from = '20260611'
  const to   = '20260730'
  console.log(`\n🔎 Pidiendo a ESPN fixture completo (${from}-${to})\n`)
  try {
    const res = await fetch(`${BASE}?dates=${from}-${to}`, { signal: AbortSignal.timeout(15000) })
    const data = await res.json()
    const events = data?.events || []
    console.log(`📡 Partidos devueltos: ${events.length}`)

    const todosLosNombres = new Set()
    for (const ev of events) {
      const competitors = ev.competitions?.[0]?.competitors || []
      for (const c of competitors) {
        const n = c.team?.displayName || c.team?.name
        if (n) todosLosNombres.add(n)
      }
    }
    console.log(`👥 Equipos únicos en el fixture: ${todosLosNombres.size}\n`)

    const okMapped   = []   // TEAM_MAP los lleva a un nombre en español distinto
    const okPass     = []   // ya viene en español o igual en ambos idiomas
    const noMapped   = []   // mapTeam los deja igual pero NO están en la lista de pass-through (sospechosos)
    for (const raw of [...todosLosNombres].sort()) {
      if (TEAM_MAP[raw]) okMapped.push(`${raw}  →  ${TEAM_MAP[raw]}`)
      else if (PASS_THROUGH.has(raw)) okPass.push(raw)
      else noMapped.push(raw)
    }

    if (okMapped.length) {
      console.log(`✅ MAPEADOS (${okMapped.length})`)
      okMapped.forEach(s => console.log('   ' + s))
    }
    if (okPass.length) {
      console.log(`\n✅ PASA DIRECTO sin necesitar mapeo (${okPass.length})`)
      okPass.forEach(s => console.log('   ' + s))
    }
    if (noMapped.length) {
      console.log(`\n⚠  SIN MAPEO — VAN A NO MATCHEAR EN SUPABASE (${noMapped.length}):`)
      noMapped.forEach(s => console.log('   "' + s + '"'))
      console.log('\nAgregalos al TEAM_MAP con la traducción que use Supabase.')
    } else {
      console.log(`\n🎯 Todos los equipos del fixture matchean.`)
    }

    // Equipos que SÍ están en Supabase pero no aparecieron en el fixture (sanity check inverso)
    const finalmenteMapeados = new Set([...todosLosNombres].map(n => TEAM_MAP[n] || n))
    const enSupabaseSinFixture = [...EQUIPOS_SUPABASE].filter(x => !finalmenteMapeados.has(x))
    if (enSupabaseSinFixture.length) {
      console.log(`\nℹ  En Supabase pero NO en el fixture de ESPN (chequear si son reales o están mal escritos):`)
      enSupabaseSinFixture.forEach(s => console.log('   ' + s))
    }
  } catch (e) {
    console.error('❌ Error:', e.message)
  }
})()
