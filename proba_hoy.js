// !proba_hoy — chances de ganar EL DÍA: quién saca más puntos en los partidos de hoy.
// Mismo formato que !proba pero scope = fecha. Exporta probaHoyBoard(oddsData, date).
require('dotenv').config()
const { simBoard, rowsForDate } = require('./proyeccion')

async function probaHoyBoard(oddsData, date){
  const rows = await rowsForDate(date)
  if (!rows.length) return null                 // no hay partidos ese día
  return simBoard(oddsData, rows)
}

async function probaHoyTexto(oddsData, date){
  const b = await probaHoyBoard(oddsData, date)
  if (!b) return `No hay partidos el ${date}`
  const L=[`📅 *CHANCES DE GANAR EL DÍA* (${date.slice(8,10)}/${date.slice(5,7)})`, `_${b.played}/${b.scope} partidos del día jugados_`, ``]
  b.rows.forEach((r,i)=>{const m=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`
    L.push(`${m} *${r.nombre}* — ${r.winPct}% · ${r.currentPts}pts`)})
  return L.join('\n')
}

module.exports = { probaHoyBoard, probaHoyTexto }

// --- CLI standalone ---
if (require.main === module) {
  const axios=require('axios')
  ;(async()=>{
    const date=process.argv[2]||new Date().toISOString().slice(0,10)
    let od=[]
    try{ const r=await axios.get('https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/',
      {params:{apiKey:process.env.ODDS_API_KEY,regions:'eu',markets:'h2h,totals',dateFormat:'iso'},timeout:15000}); od=r.data }catch(e){}
    console.log(await probaHoyTexto(od, date))
  })()
}
