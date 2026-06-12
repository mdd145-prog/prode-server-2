// "Día del prode" — el bot agrupa partidos por ciclos de 8 AM → 8 AM ARG en
// lugar del calendario 00:00 → 00:00. Un partido de calendario 13/06 que
// arranca a las 06:00 cuenta como parte del día prode 12/06.
//
// Esto sólo afecta el AGRUPAMIENTO/REPORTES (qué partidos lista !hoy, qué
// muestra el cron de las 8:01, etc). NO afecta la sincronización con ESPN,
// los anuncios de gol/kickoff/fin, ni el análisis 20-min-antes — esos siguen
// disparándose por reloj real y eventos.

const CUTOFF = '08:00'

// Suma n días a una fecha 'YYYY-MM-DD' y devuelve 'YYYY-MM-DD'.
const sumarDias = (fecha, n) => {
  const d = new Date(fecha + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Fecha calendario de hoy en ARG (YYYY-MM-DD)
const hoyCalARG = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

// "Día del prode" actual: si la hora ARG es < 08:00, devuelve ayer calendario.
function diaProdeARG() {
  const h = +new Date().toLocaleString('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', hour12: false
  })
  return h >= 8 ? hoyCalARG() : sumarDias(hoyCalARG(), -1)
}

// ¿El partido pertenece al día prode dado? (para filtrar listas en memoria)
const esDelDiaProde = (partido, fechaProde) => {
  if (!partido.fecha) return false
  if (partido.fecha === fechaProde) return (partido.hora || '00:00') >= CUTOFF
  if (partido.fecha === sumarDias(fechaProde, 1)) return (partido.hora || '24:00') < CUTOFF
  return false
}

// Trae los partidos del día prode `fechaProde` desde Supabase: une los del
// calendario `fechaProde` con hora >= 08:00 y los del calendario siguiente
// con hora < 08:00. `cols` permite acotar columnas (default: '*').
async function partidosDelDia(supabase, fechaProde, cols = '*') {
  const fechaSig = sumarDias(fechaProde, 1)
  const [r1, r2] = await Promise.all([
    supabase.from('partidos').select(cols).eq('fecha', fechaProde).gte('hora', CUTOFF),
    supabase.from('partidos').select(cols).eq('fecha', fechaSig).lt('hora', CUTOFF),
  ])
  return [...(r1.data || []), ...(r2.data || [])]
}

module.exports = { CUTOFF, sumarDias, hoyCalARG, diaProdeARG, esDelDiaProde, partidosDelDia }
