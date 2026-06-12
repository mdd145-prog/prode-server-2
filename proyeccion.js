// PROYECCIÓN full-torneo con CUOTAS REALES (the-odds-api: h2h + totals).
// h2h -> quién gana ; totals -> goles esperados ; => λ por equipo y partido.
// Exporta proyeccionTexto(oddsData) para el bot; corre standalone con `node proyeccion.js`.
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const {NAMES,matches,data}=require('./pronosticos20.json')
const N=NAMES.length, M=matches.length
const EN2AB={'Algeria':'ALG','Argentina':'ARG','Australia':'AUS','Austria':'AUT','Belgium':'BEL','Bosnia & Herzegovina':'BIH','Brazil':'BRA','Canada':'CAN','Cape Verde':'CPV','Colombia':'COL','Croatia':'CRO','Curaçao':'CUW','Czech Republic':'CHE','DR Congo':'COD','Ecuador':'ECU','Egypt':'EGI','England':'ING','France':'FRA','Germany':'ALE','Ghana':'GHA','Haiti':'HAI','Iran':'IRN','Iraq':'IRQ','Ivory Coast':'CIV','Japan':'JPN','Jordan':'JOR','Mexico':'MEX','Morocco':'MAR','Netherlands':'HOL','New Zealand':'NZL','Norway':'NOR','Panama':'PAN','Paraguay':'PAR','Portugal':'POR','Qatar':'QAT','Saudi Arabia':'KSA','Scotland':'SCO','Senegal':'SEN','South Africa':'RSA','South Korea':'KOR','Spain':'ESP','Sweden':'SUE','Switzerland':'SUI','Tunisia':'TUN','Turkey':'TUR','USA':'USA','Uruguay':'URU','Uzbekistan':'UZB'}
const ES2AB={'México':'MEX','Sudáfrica':'RSA','Rep. de Corea':'KOR','Rep. Checa':'CHE','Canadá':'CAN','Bosnia Herz.':'BIH','Catar':'QAT','Suiza':'SUI','Brasil':'BRA','Marruecos':'MAR','Haití':'HAI','Escocia':'SCO','Estados Unidos':'USA','Paraguay':'PAR','Australia':'AUS','Turquía':'TUR','Alemania':'ALE','Curazao':'CUW','Costa de Marfil':'CIV','Ecuador':'ECU','Países Bajos':'HOL','Japón':'JPN','Suecia':'SUE','Túnez':'TUN','Bélgica':'BEL','Egipto':'EGI','Irán':'IRN','Nueva Zelanda':'NZL','España':'ESP','Cabo Verde':'CPV','Arabia Saudí':'KSA','Uruguay':'URU','Francia':'FRA','Senegal':'SEN','Noruega':'NOR','Irak':'IRQ','Argentina':'ARG','Argelia':'ALG','Austria':'AUT','Jordania':'JOR','Portugal':'POR','Colombia':'COL','Uzbekistán':'UZB','RD Congo':'COD','Inglaterra':'ING','Croacia':'CRO','Ghana':'GHA','Panamá':'PAN'}
const esAb=n=>ES2AB[n]||n.slice(0,3).toUpperCase()

// --- Poisson ---
function pmf(l,k){let p=Math.exp(-l);for(let i=1;i<=k;i++)p*=l/i;return p}
function homeWin(lh,la){let h=0;for(let x=0;x<=12;x++)for(let y=0;y<=12;y++)if(x>y)h+=pmf(lh,x)*pmf(la,y);return h}
function solveS(T,pH){let lo=-5,hi=5;for(let it=0;it<50;it++){const m=(lo+hi)/2;homeWin(Math.max(0.08,T/2+m/2),Math.max(0.08,T/2-m/2))<pH?lo=m:hi=m}return (lo+hi)/2}

// raw oddsData (array de the-odds-api con markets h2h,totals) -> {key 'A|B' ordenado: {home, lh, la}}
function buildLambdas(oddsData){
  const map={}
  for(const m of (oddsData||[])){
    const H=EN2AB[m.home_team], A=EN2AB[m.away_team]; if(!H||!A) continue
    const hP=[],dP=[],aP=[], lines=[], ovP=[]
    for(const bm of (m.bookmakers||[])){
      const h2h=bm.markets?.find(x=>x.key==='h2h')
      if(h2h){for(const o of h2h.outcomes){if(o.name===m.home_team)hP.push(o.price);else if(o.name===m.away_team)aP.push(o.price);else dP.push(o.price)}}
      const tot=bm.markets?.find(x=>x.key==='totals')
      if(tot){const pts=[...new Set(tot.outcomes.map(o=>o.point))].sort((a,b)=>Math.abs(a-2.6)-Math.abs(b-2.6))
        const L=pts[0]; const ov=tot.outcomes.find(o=>o.name==='Over'&&o.point===L), un=tot.outcomes.find(o=>o.name==='Under'&&o.point===L)
        if(ov&&un){lines.push(L); ovP.push((1/ov.price)/((1/ov.price)+(1/un.price)))}}
    }
    if(!hP.length||!aP.length||!dP.length) continue
    const avg=a=>a.reduce((x,y)=>x+y,0)/a.length
    const pH=1/avg(hP),pD=1/avg(dP),pA=1/avg(aP),z=pH+pD+pA
    const L=lines.length?avg(lines):2.6, pov=ovP.length?avg(ovP):0.5
    const T=Math.max(1.6,Math.min(5.5, L+2*(pov-0.5)))
    const s=solveS(T,pH/z)
    map[[H,A].sort().join('|')]={home:H, lh:Math.max(0.08,T/2+s/2), la:Math.max(0.08,T/2-s/2)}
  }
  return map
}

const tend=(a,b)=>a>b?1:a<b?2:0
const pts=(p,r)=>(p[0]===r[0]&&p[1]===r[1])?3:(tend(p[0],p[1])===tend(r[0],r[1])?1:0)
const keyOf=l=>l.split(' ').slice(1).join(' ')
const teamsOf=l=>keyOf(l).split('·')
const pois=l=>{let L=Math.exp(-l),x=0,p=1;do{x++;p*=Math.random()}while(p>L);return x-1}

// Devuelve texto para WhatsApp. oddsData = salida cruda de getOdds() (h2h,totals).
async function proyeccionTexto(oddsData){
  const odds=buildLambdas(oddsData)
  const {data:partidos}=await supabase.from('partidos').select('*')
  const real={}; for(const p of (partidos||[])) if(p.goles1!==null&&p.goles2!==null) real[esAb(p.equipo1)+'·'+esAb(p.equipo2)]=[p.goles1,p.goles2]
  const played=[],pend=[]; matches.forEach((l,r)=>real[keyOf(l)]?played.push(r):pend.push(r))
  const lock=new Array(N).fill(0)
  for(const r of played){const res=real[keyOf(matches[r])];for(let c=0;c<N;c++)lock[c]+=pts(data[c][r],res)}
  const lam=pend.map(r=>{const[t1,t2]=teamsOf(matches[r]);const o=odds[[t1,t2].sort().join('|')]
    if(!o)return [1.3,1.3]; return o.home===t1?[o.lh,o.la]:[o.la,o.lh]})
  const SIM=20000, wins=new Array(N).fill(0)
  for(let s=0;s<SIM;s++){const sc=lock.slice()
    for(let i=0;i<pend.length;i++){const r=pend[i],res=[pois(lam[i][0]),pois(lam[i][1])];for(let c=0;c<N;c++)sc[c]+=pts(data[c][r],res)}
    const mx=Math.max(...sc),w=[];for(let c=0;c<N;c++)if(sc[c]===mx)w.push(c);for(const x of w)wins[x]+=1/w.length}
  const rows=NAMES.map((n,c)=>({n,lock:lock[c],win:100*wins[c]/SIM,cuota:wins[c]>0?SIM/wins[c]:999})).sort((a,b)=>b.win-a.win)
  const fuente = Object.keys(odds).length ? `cuotas reales (${Object.keys(odds).length} partidos)` : 'sin odds'
  const L=[`🎲 *PRODE 2026 — PROBABILIDADES* 🎲`, `_${played.length}/${M} jugados · ${fuente}_`, ``]
  rows.forEach((r,i)=>{const m=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`
    L.push(`${m} *${r.n}* — ${r.win.toFixed(1)}% _(cuota ${r.cuota.toFixed(1)})_ · ${r.lock}pts`)})
  return L.join('\n')
}

module.exports = { proyeccionTexto, buildLambdas }

// --- CLI standalone ---
if (require.main === module) {
  const axios=require('axios')
  ;(async()=>{
    const {data:od}=await axios.get('https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/',
      {params:{apiKey:process.env.ODDS_API_KEY,regions:'eu',markets:'h2h,totals',dateFormat:'iso'},timeout:15000})
    console.log(await proyeccionTexto(od))
  })()
}
