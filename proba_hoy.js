// !proba_hoy — línea del día: cuotas reales (the-odds-api) + resultado + qué hizo cada uno.
// Exporta probaHoyTexto(oddsData, date); corre standalone con `node proba_hoy.js [YYYY-MM-DD]`.
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const {NAMES,matches,data}=require('./pronosticos20.json')
const EN2AB={'Algeria':'ALG','Argentina':'ARG','Australia':'AUS','Austria':'AUT','Belgium':'BEL','Bosnia & Herzegovina':'BIH','Brazil':'BRA','Canada':'CAN','Cape Verde':'CPV','Colombia':'COL','Croatia':'CRO','Curaçao':'CUW','Czech Republic':'CHE','DR Congo':'COD','Ecuador':'ECU','Egypt':'EGI','England':'ING','France':'FRA','Germany':'ALE','Ghana':'GHA','Haiti':'HAI','Iran':'IRN','Iraq':'IRQ','Ivory Coast':'CIV','Japan':'JPN','Jordan':'JOR','Mexico':'MEX','Morocco':'MAR','Netherlands':'HOL','New Zealand':'NZL','Norway':'NOR','Panama':'PAN','Paraguay':'PAR','Portugal':'POR','Qatar':'QAT','Saudi Arabia':'KSA','Scotland':'SCO','Senegal':'SEN','South Africa':'RSA','South Korea':'KOR','Spain':'ESP','Sweden':'SUE','Switzerland':'SUI','Tunisia':'TUN','Turkey':'TUR','USA':'USA','Uruguay':'URU','Uzbekistan':'UZB'}
const ES2AB={'México':'MEX','Sudáfrica':'RSA','Rep. de Corea':'KOR','Rep. Checa':'CHE','Canadá':'CAN','Bosnia Herz.':'BIH','Catar':'QAT','Suiza':'SUI','Brasil':'BRA','Marruecos':'MAR','Haití':'HAI','Escocia':'SCO','Estados Unidos':'USA','Paraguay':'PAR','Australia':'AUS','Turquía':'TUR','Alemania':'ALE','Curazao':'CUW','Costa de Marfil':'CIV','Ecuador':'ECU','Países Bajos':'HOL','Japón':'JPN','Suecia':'SUE','Túnez':'TUN','Bélgica':'BEL','Egipto':'EGI','Irán':'IRN','Nueva Zelanda':'NZL','España':'ESP','Cabo Verde':'CPV','Arabia Saudí':'KSA','Uruguay':'URU','Francia':'FRA','Senegal':'SEN','Noruega':'NOR','Irak':'IRQ','Argentina':'ARG','Argelia':'ALG','Austria':'AUT','Jordania':'JOR','Portugal':'POR','Colombia':'COL','Uzbekistán':'UZB','RD Congo':'COD','Inglaterra':'ING','Croacia':'CRO','Ghana':'GHA','Panamá':'PAN'}
const esAb=n=>ES2AB[n]||n.slice(0,3).toUpperCase()
const tend=(a,b)=>a>b?'1':a<b?'2':'X'
const pts=(p,r)=>(p[0]===r[0]&&p[1]===r[1])?3:(tend(p[0],p[1])===tend(r[0],r[1])?1:0)
const rowOf=key=>matches.findIndex(m=>m.split(' ').slice(1).join(' ')===key)
const predAll=row=>NAMES.map((n,c)=>({n,p:data[c][row]}))

// línea 1X2 (%) real de un partido desde oddsData, por par de abreviaturas
function lineFor(oddsData, t1, t2){
  for(const m of (oddsData||[])){
    const H=EN2AB[m.home_team], A=EN2AB[m.away_team]
    if(!((H===t1&&A===t2)||(H===t2&&A===t1))) continue
    const hP=[],dP=[],aP=[]
    for(const bm of (m.bookmakers||[])){const h2h=bm.markets?.find(x=>x.key==='h2h');if(!h2h)continue
      for(const o of h2h.outcomes){if(o.name===m.home_team)hP.push(o.price);else if(o.name===m.away_team)aP.push(o.price);else dP.push(o.price)}}
    if(!hP.length) continue
    const avg=a=>a.reduce((x,y)=>x+y,0)/a.length
    const pH=1/avg(hP),pD=1/avg(dP),pA=1/avg(aP),z=pH+pD+pA
    // devolver orientado a t1 (home del PDF)
    return H===t1 ? {p1:pH/z,pX:pD/z,p2:pA/z} : {p1:pA/z,pX:pD/z,p2:pH/z}
  }
  return null
}

async function probaHoyTexto(oddsData, date){
  const {data:partidos}=await supabase.from('partidos').select('*').eq('fecha',date).order('hora')
  if(!partidos?.length) return `No hay partidos el ${date}`
  const out=[`📅 *PRODE — LÍNEA DE HOY* (${date.slice(8,10)}/${date.slice(5,7)})`,'']
  for(const m of partidos){
    const t1=esAb(m.equipo1), t2=esAb(m.equipo2), key=t1+'·'+t2, row=rowOf(key)
    if(row<0){ out.push(`⚽ ${m.equipo1} vs ${m.equipo2} (sin datos)`,''); continue }
    if(m.goles1!==null){
      const res=[m.goles1,m.goles2]
      out.push(`⚽ *${m.equipo1} ${res[0]}-${res[1]} ${m.equipo2}* ✅ FINAL`)
      const ex=[],ac=[],no=[]
      predAll(row).forEach(({n,p})=>{const q=pts(p,res);(q===3?ex:q===1?ac:no).push(q===3?n:`${n} ${p[0]}-${p[1]}`)})
      if(ex.length) out.push(`  🎯 Exacto +3: ${ex.join(', ')}`)
      if(ac.length) out.push(`  ✔️ Resultado +1: ${ac.join(', ')}`)
      if(no.length) out.push(`  ❌ Cero: ${no.join(', ')}`)
    } else {
      out.push(`⚽ *${m.equipo1} vs ${m.equipo2}* — ${m.hora||''} · POR JUGARSE`)
      const L=lineFor(oddsData,t1,t2)
      if(L) out.push(`  📊 Línea real: ${m.equipo1} ${(L.p1*100).toFixed(0)}% · Empate ${(L.pX*100).toFixed(0)}% · ${m.equipo2} ${(L.p2*100).toFixed(0)}%`)
      else out.push('  📊 (sin línea real disponible todavía)')
      const g={'1':[],'X':[],'2':[]}; predAll(row).forEach(({n,p})=>g[tend(p[0],p[1])].push(`${n} ${p[0]}-${p[1]}`))
      out.push(`  ➡️ Gana ${m.equipo1} (${g['1'].length}): ${g['1'].join(', ')||'-'}`)
      out.push(`  ➡️ Empate (${g['X'].length}): ${g['X'].join(', ')||'-'}`)
      out.push(`  ➡️ Gana ${m.equipo2} (${g['2'].length}): ${g['2'].join(', ')||'-'}`)
    }
    out.push('')
  }
  return out.join('\n')
}

module.exports = { probaHoyTexto }

// --- CLI standalone ---
if (require.main === module) {
  const axios=require('axios')
  ;(async()=>{
    const date=process.argv[2]||new Date().toISOString().slice(0,10)
    let od=[]
    try{ const r=await axios.get('https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/',
      {params:{apiKey:process.env.ODDS_API_KEY,regions:'eu',markets:'h2h',dateFormat:'iso'},timeout:15000}); od=r.data }catch(e){}
    console.log(await probaHoyTexto(od, date))
  })()
}
