// Reportes en imagen (Arial, estilo de tablaImagen.js / frontend):
//   generarProbaImg(oddsData)          -> CHANCES DE GANAR EL TORNEO (azul)
//   generarProbaHoyImg(oddsData,date)  -> CHANCES DE GANAR HOY (azul)
//   generarReporteAgrupado(p,jug,pron) -> análisis de pronósticos (púrpura)
const { createCanvas } = require('@napi-rs/canvas')
const { proyeccionBoard, resultadosDelDia, tablaFinalDelDia } = require('./proyeccion')
const { probaHoyBoard } = require('./proba_hoy')

const S = 2
const rr = (ctx,x,y,w,h,r)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
const MEDAL = ['#f1c40f','#c0c8d0','#cd7f32']  // oro, plata, bronce

// Tabla tipo ranking (proba). cols: {x,w,label,align,val(r),color(r),bold}
function tablaRanking({titulo, sub, cols, rows, g1, g2, rowA, rowB, banda}){
  const W=524, M=16, tableW=W-M*2, TITLE_H=42, SUB_H=22, HEAD_H=24, ROW_H=26, FOOT_H=22
  const BANDA_H = banda ? 30 + banda.lineas.length*19 : 0
  const H = M + TITLE_H + 12 + SUB_H + BANDA_H + HEAD_H + rows.length*ROW_H + FOOT_H + M
  const cv=createCanvas(W*S,H*S), ctx=cv.getContext('2d'); ctx.scale(S,S)
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H)
  ctx.save(); ctx.translate(M,M)
  // título con gradiente
  const grad=ctx.createLinearGradient(0,0,tableW,TITLE_H); grad.addColorStop(0,g1); grad.addColorStop(1,g2)
  ctx.fillStyle=grad; rr(ctx,0,0,tableW,TITLE_H,9); ctx.fill()
  ctx.fillStyle='#fff'; ctx.font='bold 18px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText(titulo, tableW/2, TITLE_H/2)
  let y=TITLE_H+12
  // subtítulo
  ctx.fillStyle='#888'; ctx.font='11px Arial'; ctx.textAlign='center'; ctx.textBaseline='alphabetic'
  ctx.fillText(sub, tableW/2, y+14); y+=SUB_H
  // banda: resultado esperado por el mercado
  if(banda){
    ctx.fillStyle=rowB; rr(ctx,0,y,tableW,BANDA_H-8,8); ctx.fill()
    ctx.fillStyle=g1; ctx.font='bold 10px Arial'; ctx.textAlign='center'; ctx.fillText(banda.titulo, tableW/2, y+16)
    ctx.fillStyle='#1a1a1a'; ctx.font='13px Arial'
    banda.lineas.forEach((ln,k)=>ctx.fillText(ln, tableW/2, y+34+k*19))
    y+=BANDA_H
  }
  // header de columnas
  ctx.fillStyle=g1; rr(ctx,0,y,tableW,HEAD_H,5); ctx.fill()
  ctx.fillStyle='#fff'; ctx.font='bold 10px Arial'; ctx.textBaseline='middle'
  cols.forEach(c=>{ctx.textAlign=c.align; ctx.fillText(c.label, c.align==='left'?c.x+8:c.x+c.w/2, y+HEAD_H/2)})
  y+=HEAD_H
  // filas
  rows.forEach((r,i)=>{
    const ry=y+i*ROW_H, cy=ry+ROW_H/2
    ctx.fillStyle=i%2?rowB:rowA; ctx.fillRect(0,ry,tableW,ROW_H)
    ctx.textBaseline='middle'
    // POS (badge podio top-3)
    const pc=cols[0]
    if(i<3){ ctx.fillStyle=MEDAL[i]; ctx.beginPath(); ctx.arc(pc.x+pc.w/2, cy, 9, 0, 7); ctx.fill(); ctx.fillStyle='#1a1a1a' }
    else ctx.fillStyle='#666'
    ctx.font='bold 11px Arial'; ctx.textAlign='center'; ctx.fillText(`${i+1}`, pc.x+pc.w/2, cy)
    // resto de columnas
    for(let k=1;k<cols.length;k++){const c=cols[k]
      ctx.fillStyle=c.color?c.color(r):'#1a1a1a'
      ctx.font=(c.bold?'bold ':'')+(c.size||'12')+'px Arial'
      ctx.textAlign=c.align
      ctx.fillText(c.val(r), c.align==='left'?c.x+8:(c.align==='right'?c.x+c.w-8:c.x+c.w/2), cy)
    }
  })
  y+=rows.length*ROW_H
  // footer
  ctx.fillStyle='#f5f5f5'; ctx.fillRect(0,y,tableW,FOOT_H)
  ctx.fillStyle='#aaa'; ctx.font='8px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText('PRODE MUNDIAL 2026  ·  proyección con cuotas reales del mercado', tableW/2, y+FOOT_H/2)
  ctx.restore()
  return cv.encode('png')
}

const nameUp = n => { const u=n.toUpperCase(); return u.length>15?u.slice(0,15)+'…':u }

async function generarProbaImg(oddsData){
  const b=await proyeccionBoard(oddsData)
  const W=524-32  // tableW
  const cols=[
    {x:0,   w:30, label:'#',       align:'center'},
    {x:30,  w:176,label:'JUGADOR', align:'left',  val:r=>nameUp(r.nombre), bold:true, size:12},
    {x:206, w:74, label:'GANAR %', align:'center',val:r=>`${r.winPct}%`,  bold:true, size:13, color:()=>'#1a6b8a'},
    {x:280, w:66, label:'CUOTA',   align:'center',val:r=>`${r.cuota}`,    size:11, color:()=>'#999'},
    {x:346, w:66, label:'HOY',     align:'center',val:r=>`${r.currentPts}`,bold:true,size:12},
    {x:412, w:80, label:'PROY',    align:'center',val:r=>`${r.expectedPts}`,size:12, color:()=>'#e67e22'},
  ]
  return tablaRanking({ titulo:'CHANCES DE GANAR EL TORNEO',
    sub:`${b.played}/72 jugados  ·  ${b.sims.toLocaleString()} simulaciones`,
    cols, rows:b.rows, g1:'#1a6b8a', g2:'#0d4a5e', rowA:'#f0f8ff', rowB:'#e8f4fb' })
}

async function generarProbaHoyImg(oddsData, date){
  const b=await tablaFinalDelDia(oddsData, date); if(!b) return null
  const res=await resultadosDelDia(oddsData, date)
  const banda = res.length ? { titulo:'RESULTADOS DE HOY (estimados por las casas de apuestas)',
    lineas: res.map(r=> r.g1==null ? `${r.eq1}  vs  ${r.eq2}` : `${r.eq1}  ${r.g1} - ${r.g2}  ${r.eq2}${r.jugado?'   · FINAL':''}`) } : null
  const W=524-32, f=`${date.slice(8,10)}/${date.slice(5,7)}`
  const cols=[
    {x:0,   w:34, label:'#',       align:'center'},
    {x:34,  w:230,label:'JUGADOR', align:'left',  val:r=>nameUp(r.nombre), bold:true, size:13},
    {x:264, w:110,label:'HOY',     align:'center',val:r=>`${r.hoy>0?'+':''}${r.hoy}`, bold:true, size:13, color:r=>r.hoy>0?'#e67e22':'#bbb'},
    {x:374, w:118,label:'TOTAL',   align:'center',val:r=>`${r.total}`, bold:true, size:15, color:()=>'#1a6b8a'},
  ]
  return tablaRanking({ titulo:`CÓMO QUEDA LA TABLA HOY · ${f}`,
    sub:`tabla general si los partidos de hoy terminan según los resultados de arriba`, banda,
    cols, rows:b.rows, g1:'#7c3aed', g2:'#5b21b6', rowA:'#f5f0ff', rowB:'#ece3fb' })
}

// ── Análisis de pronósticos agrupados — TABLA (variante A, púrpura) ──
const _meas = createCanvas(10,10).getContext('2d')
// Acomoda nombres como TAGS que fluyen y wrappean dentro de un ancho.
const layoutTags = (names, maxW) => { _meas.font='12px Arial'
  const padX=11, gap=6, lines=[]; let line=[], lw=0
  for(const n of names){ const tw=Math.ceil(_meas.measureText(n).width)+padX*2
    if(lw+tw>maxW && line.length){ lines.push(line); line=[]; lw=0 }
    line.push({n,w:tw}); lw+=tw+gap }
  if(line.length)lines.push(line); return lines }

function generarReporteAgrupado(partido, jugadores, pronosticos){
  const grupos={}
  for(const j of jugadores){
    const pr=(pronosticos||[]).find(x=>x.jugador_id===j.id && x.partido_id===partido.id)
    if(!pr || pr.goles1===null) continue
    const k=`${pr.goles1}-${pr.goles2}`;(grupos[k]=grupos[k]||[]).push(j.nombre)
  }
  const ordenados=Object.entries(grupos).sort((a,b)=>b[1].length-a[1].length)
  const W=524, M=16, tableW=W-M*2, TITLE_H=46, SUB_H=26, HEAD_H=22
  const tagsX=100, tagsMaxW=tableW-tagsX-58, tagH=23, tagGap=6
  const rows=ordenados.map(([mk,ns])=>({mk,n:ns.length,tl:layoutTags(ns,tagsMaxW)}))
  const rowH=r=>r.tl.length*(tagH+tagGap)-tagGap+18
  let bodyH=0; rows.forEach(r=>bodyH+=rowH(r))
  const H=M+TITLE_H+SUB_H+HEAD_H+bodyH+M
  const cv=createCanvas(W*S,H*S), ctx=cv.getContext('2d'); ctx.scale(S,S)
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H); ctx.save(); ctx.translate(M,M)
  // título: equipos
  const g=ctx.createLinearGradient(0,0,tableW,TITLE_H); g.addColorStop(0,'#3d0070'); g.addColorStop(1,'#5b21b6')
  ctx.fillStyle=g; rr(ctx,0,0,tableW,TITLE_H,9); ctx.fill()
  ctx.fillStyle='#fff'; ctx.font='bold 22px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'
  ctx.fillText(`${partido.equipo1}  vs  ${partido.equipo2}`, tableW/2, TITLE_H/2); ctx.textBaseline='alphabetic'
  let y=TITLE_H
  ctx.fillStyle='#999'; ctx.font='11px Arial'; ctx.textAlign='center'
  ctx.fillText(`${partido.grupo?`Grupo ${partido.grupo}  ·  `:''}arranca ${partido.hora||''}  ·  pronósticos cargados`, tableW/2, y+17); y+=SUB_H
  // header de columnas
  ctx.fillStyle='#3d0070'; rr(ctx,0,y,tableW,HEAD_H,5); ctx.fill()
  ctx.fillStyle='#fff'; ctx.font='bold 10px Arial'; ctx.textBaseline='middle'
  ctx.textAlign='left'; ctx.fillText('MARCADOR',10,y+HEAD_H/2); ctx.fillText('JUGADORES',tagsX,y+HEAD_H/2)
  ctx.textAlign='right'; ctx.fillText('CANT',tableW-10,y+HEAD_H/2); ctx.textBaseline='alphabetic'; y+=HEAD_H
  // filas
  rows.forEach((r,i)=>{const h=rowH(r)
    ctx.fillStyle=i%2?'#ece3fb':'#f5f0ff'; ctx.fillRect(0,y,tableW,h)
    ctx.textBaseline='middle'
    ctx.fillStyle=i===0?'#3d0070':'#1a1a1a'; ctx.font='bold 19px Arial'; ctx.textAlign='left'; ctx.fillText(r.mk,10,y+h/2)
    ctx.fillStyle='#7c3aed'; ctx.font='bold 16px Arial'; ctx.textAlign='right'; ctx.fillText(`${r.n}`,tableW-10,y+h/2)
    // tags
    let ty=y+9
    for(const line of r.tl){ let tx=tagsX
      for(const tag of line){
        ctx.fillStyle=i===0?'#d6c3f5':'#e6ddfa'; rr(ctx,tx,ty,tag.w,tagH,tagH/2); ctx.fill()
        ctx.fillStyle=i===0?'#3d0070':'#5b21b6'; ctx.font='12px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText(tag.n, tx+tag.w/2, ty+tagH/2); ctx.textBaseline='alphabetic'
        tx+=tag.w+tagGap }
      ty+=tagH+tagGap }
    y+=h })
  ctx.restore()
  return cv.encode('png')
}

module.exports = { generarProbaImg, generarProbaHoyImg, generarReporteAgrupado }
