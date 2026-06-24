const { createCanvas } = require('@napi-rs/canvas')

const S = 2

const TEAM_ABBR = {
  'México':'MEX','Sudáfrica':'RSA','Rep. de Corea':'KOR','Rep. Checa':'CHE',
  'Canadá':'CAN','Bosnia Herz.':'BIH','Catar':'QAT','Suiza':'SUI',
  'Brasil':'BRA','Marruecos':'MAR','Haití':'HAI','Escocia':'SCO',
  'Estados Unidos':'USA','Paraguay':'PAR','Australia':'AUS','Turquía':'TUR',
  'Alemania':'ALE','Curazao':'CUW','Costa de Marfil':'CIV','Ecuador':'ECU',
  'Países Bajos':'HOL','Japón':'JPN','Suecia':'SUE','Túnez':'TUN',
  'Bélgica':'BEL','Egipto':'EGP','Irán':'IRN','Nueva Zelanda':'NZL',
  'España':'ESP','Cabo Verde':'CPV','Arabia Saudí':'KSA','Uruguay':'URU',
  'Francia':'FRA','Senegal':'SEN','Noruega':'NOR','Irak':'IRQ',
  'Argentina':'ARG','Argelia':'DZA','Austria':'AUT','Jordania':'JOR',
  'Portugal':'POR','Colombia':'COL','Uzbekistán':'UZB','RD Congo':'COD',
  'Inglaterra':'ING','Croacia':'CRO','Ghana':'GHA','Panamá':'PAN',
}
const abbr = n => TEAM_ABBR[n] || n.slice(0,3).toUpperCase()

// Detecta marcador de eliminado (❌) en el nombre del jugador.
// El admin marca eliminados editando el nombre desde el panel; este parser
// strippea el ❌ del texto a renderizar y devuelve un flag para que el
// canvas dibuje el badge a mano (porque el canvas de Render no tiene
// fuente de emoji color).
const ELIM_MARKER = '❌'
function parseEliminado(rawName) {
  const src = rawName || ''
  const isElim = src.includes(ELIM_MARKER)
  const name = src.split(ELIM_MARKER).join('').trim()
  return { name, isElim }
}

// Tachado rojo horizontal sobre el texto, desde (x,y) ancho w.
function drawStrikethrough(ctx, x, y, w) {
  ctx.save()
  ctx.strokeStyle = '#cc0000'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()
  ctx.restore()
}

// X roja dibujada a mano como badge centrada en (x,y).
function drawXBadge(ctx, x, y, size = 5) {
  ctx.save()
  ctx.strokeStyle = '#cc0000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - size, y - size)
  ctx.lineTo(x + size, y + size)
  ctx.moveTo(x + size, y - size)
  ctx.lineTo(x - size, y + size)
  ctx.stroke()
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ── Tabla genérica (oficial / nooficial) ──────────────────
async function generarTablaGenerica(board, config) {
  const {
    titulo, colH1, colH2, colH3,   // colores header cols
    titleBg,                        // color titulo
    rowEven, rowOdd,
    jugados = 0,
    footerText,
    liveMatches = []               // partidos en vivo hoy
  } = config

  const M       = 16   // margen blanco exterior (= proba)
  const GAP     = 12   // espacio entre titulo y tabla
  const TITLE_H = 42   // = proba
  const COL_H   = 24
  const ROW_H   = 28
  const FOOTER_H= 22
  const tableW  = 492  // = proba (W total 524)
  const H = M + TITLE_H + GAP + COL_H + board.length * ROW_H + FOOTER_H + M
  const W = tableW + M * 2

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(M, M)

  // Título flotante con bordes redondeados
  ctx.fillStyle = titleBg
  roundRect(ctx, 0, 0, tableW, TITLE_H, 8)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(titulo, tableW / 2, TITLE_H / 2)

  // EN VIVO — texto en el gap blanco, sin color, sin altura extra
  if (liveMatches.length > 0) {
    const ABBR = {'México':'MEX','Sudáfrica':'RSA','Rep. de Corea':'KOR','Rep. Checa':'CHE','Canadá':'CAN','Bosnia Herz.':'BIH','Catar':'QAT','Suiza':'SUI','Brasil':'BRA','Marruecos':'MAR','Haití':'HAI','Escocia':'SCO','Estados Unidos':'USA','Paraguay':'PAR','Australia':'AUS','Turquía':'TUR','Alemania':'ALE','Curazao':'CUW','Costa de Marfil':'CIV','Ecuador':'ECU','Países Bajos':'HOL','Japón':'JPN','Suecia':'SUE','Túnez':'TUN','Bélgica':'BEL','Egipto':'EGP','Irán':'IRN','Nueva Zelanda':'NZL','España':'ESP','Cabo Verde':'CPV','Arabia Saudí':'KSA','Uruguay':'URU','Francia':'FRA','Senegal':'SEN','Noruega':'NOR','Irak':'IRQ','Argentina':'ARG','Argelia':'DZA','Austria':'AUT','Jordania':'JOR','Portugal':'POR','Colombia':'COL','Uzbekistán':'UZB','RD Congo':'COD','Inglaterra':'ING','Croacia':'CRO','Ghana':'GHA','Panamá':'PAN'}
    const ab = n => ABBR[n] || (n ? n.slice(0,3).toUpperCase() : '???')
    const parts = liveMatches.map(m => {
      const score = m.goles1 !== null ? `${m.goles1}-${m.goles2}` : '-'
      return `${ab(m.equipo1)} ${score} ${ab(m.equipo2)}`
    })
    const midY = TITLE_H + GAP / 2

    // Calcular ancho total para centrar
    ctx.font = 'bold 8px Arial'
    const redLabel = '● EN VIVO  '
    const matchText = parts.join('   ·   ')
    const totalW = ctx.measureText(redLabel).width + ctx.measureText(matchText).width
    let curX = (tableW - totalW) / 2

    // "● EN VIVO" en rojo
    ctx.fillStyle = '#cc0000'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(redLabel, curX, midY)
    curX += ctx.measureText(redLabel).width

    // Partidos en negro
    ctx.fillStyle = '#1a1a1a'
    ctx.font = '8px Arial'
    ctx.fillText(matchText, curX, midY)
  }
  const liveOffsetY = 0

  // Columnas (después del gap)
  const tY = TITLE_H + GAP + liveOffsetY
  const cols = [
    { x: 0,   w: 30,  label: 'POS',     bg: colH1, align: 'center' },
    { x: 30,  w: 176, label: 'JUGADOR', bg: colH1, align: 'left'   },
    { x: 206, w: 44,  label: 'PTS',     bg: colH1, align: 'center' },
    { x: 250, w: 32,  label: 'JUG',     bg: colH1, align: 'center' },
    { x: 282, w: 40,  label: '3',       bg: colH2, align: 'center' },
    { x: 322, w: 40,  label: '1',       bg: colH2, align: 'center' },
    { x: 362, w: 40,  label: '0',       bg: colH2, align: 'center' },
    { x: 402, w: tableW-402, label: '%', bg: colH3, align: 'center' },
  ]

  cols.forEach(col => {
    ctx.fillStyle = col.bg
    ctx.fillRect(col.x, tY, col.w, COL_H)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = col.align === 'left' ? 'left' : 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(col.label, col.align === 'left' ? col.x + 8 : col.x + col.w / 2, tY + COL_H / 2)
  })

  // Filas
  board.forEach((p, i) => {
    const y  = tY + COL_H + i * ROW_H
    ctx.fillStyle = i % 2 === 0 ? rowEven : rowOdd
    ctx.fillRect(0, y, tableW, ROW_H)
    const cy = y + ROW_H / 2
    ctx.textBaseline = 'middle'

    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${i+1}`, cols[0].x + cols[0].w/2, cy)

    const { name: rawName, isElim } = parseEliminado(p.nombre)
    const nombre = rawName.toUpperCase()
    const disp = nombre.length > 15 ? nombre.slice(0,15)+'…' : nombre
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.fillStyle = isElim ? '#999999' : '#1a1a1a'
    ctx.fillText(disp, cols[1].x + 8, cy)
    if (isElim) {
      const w = ctx.measureText(disp).width
      drawStrikethrough(ctx, cols[1].x + 8, cy, w)
      drawXBadge(ctx, cols[1].x + 8 + w + 10, cy)
      ctx.fillStyle = '#1a1a1a'
    }

    ctx.font = 'bold 15px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${p.tot}`, cols[2].x + cols[2].w/2, cy)

    ctx.fillStyle = '#888888'
    ctx.font = '10px Arial'
    ctx.fillText(`${p.jug}`, cols[3].x + cols[3].w/2, cy)

    ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 11px Arial'
    ctx.fillText(`${p.ex}`,   cols[4].x + cols[4].w/2, cy)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillText(`${p.lv}`,   cols[5].x + cols[5].w/2, cy)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillText(`${p.fail}`, cols[6].x + cols[6].w/2, cy)

    const pct = p.jug > 0 ? ((p.tot/(p.jug*3))*100).toFixed(2)+' %' : '-'
    ctx.fillStyle = '#555555'; ctx.font = '10px Arial'
    ctx.fillText(pct, cols[7].x + cols[7].w/2, cy)
  })

  // Footer
  const footerY = tY + COL_H + board.length * ROW_H
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, footerY, tableW, FOOTER_H)
  ctx.fillStyle = '#aaaaaa'; ctx.font = '8px Arial'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(footerText, tableW/2, footerY + FOOTER_H/2)

  ctx.restore()
  const buf = await canvas.encode('png')
  console.log(`📊 ${titulo}: ${board.length} jugadores, ${buf.length} bytes`)
  return buf
}

async function generarTablaOficial(board) {
  const fecha = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'})
  return generarTablaGenerica(board, {
    titulo: 'TABLA OFICIAL',
    colH1: '#7c3aed', colH2: '#27ae60', colH3: '#1a6b8a',
    titleBg: '#3d0070',
    rowEven: '#ebebeb', rowOdd: '#ffffff',
    footerText: `PRODE MUNDIAL 2026  ·  ${fecha}  ·  exacto=3pts  levante=1pt`
  })
}

async function generarTablaNoOficial(board, jugados = 0, liveMatches = []) {
  const fecha = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'})
  return generarTablaGenerica(board, {
    titulo: 'TABLA NO OFICIAL',
    colH1: '#4a8fc4', colH2: '#2e75a8', colH3: '#1d5c8a',
    titleBg: '#2c6fa8',
    rowEven: '#e8f4ff', rowOdd: '#ffffff',
    jugados,
    liveMatches,
    footerText: `PRODE MUNDIAL 2026  ·  ${fecha}  ·  NO OFICIAL  ·  exacto=3pts  levante=1pt`
  })
}

// ── IMAGEN DEL DÍA ────────────────────────────────────────
async function generarImagenDia(partidos, jugadores, pronosticos, fecha) {
  // ordenar columnas por hora del partido (solo presentación, no toca datos)
  // Orden cronológico real (fecha+hora): en el ciclo prode 8am→8am los partidos
  // de madrugada tienen fecha del día calendario siguiente, así van últimos (la
  // 1am del 14 va después del 22:00 del 13), no primeros como con ordenar por hora.
  partidos = [...partidos].sort((a, b) =>
    ((a.fecha || '') + (a.hora || '')).localeCompare((b.fecha || '') + (b.hora || '')))
  const M        = 16
  const GAP      = 12
  const nM       = partidos.length
  const nameW    = 132
  const matchW   = nM <= 4 ? 66 : nM <= 6 ? 56 : 48
  const TITLE_H  = 42
  const DATE_H   = 48
  const CTRY_H   = 34
  const HORA_H   = 18
  const RES_H    = 30
  const ROW_H    = 30
  const FOOTER_H = 0

  const tableW = nameW + nM * matchW + 28
  const W      = tableW + M * 2
  const tableH = DATE_H + CTRY_H + HORA_H + RES_H + jugadores.length * ROW_H
  const H      = M + TITLE_H + GAP + tableH + M

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(M, M)

  // Título flotante
  const tgrad = ctx.createLinearGradient(0, 0, tableW, TITLE_H)
  tgrad.addColorStop(0, '#3d0070'); tgrad.addColorStop(1, '#5b21b6')
  ctx.fillStyle = tgrad
  roundRect(ctx, 0, 0, tableW, TITLE_H, 9)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('RESULTADOS DEL DÍA', tableW/2, TITLE_H/2)

  const tY = TITLE_H + GAP
  const fmtFecha = fecha ? new Date(fecha+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'}).toUpperCase() : ''

  // Celda fecha (cubre fila equipo1 + equipo2 + hora)
  ctx.fillStyle = '#f0e8ff'
  ctx.fillRect(0, tY, 14 + nameW, DATE_H + CTRY_H + HORA_H)
  ctx.fillStyle = '#3d0070'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(fmtFecha, (14 + nameW)/2, tY + (DATE_H + CTRY_H + HORA_H)/2)

  // Headers países
  partidos.forEach((p, j) => {
    const cx = 14 + nameW + j * matchW + matchW/2
    ctx.fillStyle = '#7c3aed'
    ctx.fillRect(14 + nameW + j*matchW, tY, matchW, DATE_H)
    ctx.fillStyle = '#6d28d9'
    ctx.fillRect(14 + nameW + j*matchW, tY + DATE_H, matchW, CTRY_H)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(abbr(p.equipo1), cx, tY + DATE_H/2)
    ctx.fillText(abbr(p.equipo2), cx, tY + DATE_H + CTRY_H/2)
  })

  // Fila hora del partido
  const horaY = tY + DATE_H + CTRY_H
  partidos.forEach((p, j) => {
    ctx.fillStyle = '#5b21b6'
    ctx.fillRect(14 + nameW + j*matchW, horaY, matchW, HORA_H)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(p.hora || '', 14+nameW+j*matchW+matchW/2, horaY + HORA_H/2)
  })

  // Fila resultado
  const resY = tY + DATE_H + CTRY_H + HORA_H
  ctx.fillStyle = '#ddd0f5'
  ctx.fillRect(0, resY, tableW, RES_H)
  ctx.fillStyle = '#3d0070'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('RESULTADO', 18, resY + RES_H/2)
  partidos.forEach((p, j) => {
    ctx.textAlign = 'center'
    ctx.font = 'bold 13px Arial'
    ctx.fillText(p.goles1!==null?`${p.goles1}-${p.goles2}`:'-', 14+nameW+j*matchW+matchW/2, resY+RES_H/2)
  })

  // Filas jugadores
  jugadores.forEach((jug, ji) => {
    const y  = resY + RES_H + ji * ROW_H
    ctx.fillStyle = ji%2===0 ? '#ebebeb' : '#ffffff'
    ctx.fillRect(0, y, tableW, ROW_H)
    const cy = y + ROW_H/2
    const num = String(ji+1).padStart(2,' ')
    const { name: rawName, isElim } = parseEliminado(jug.nombre)
    const nombre = rawName.toUpperCase()
    const disp = nombre.length > 13 ? nombre.slice(0,13)+'…' : nombre
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const prefix = `${num} `
    ctx.fillStyle = '#1a1a1a'
    ctx.fillText(prefix, 18, cy)
    const prefixW = ctx.measureText(prefix).width
    ctx.fillStyle = isElim ? '#999999' : '#1a1a1a'
    ctx.fillText(disp, 18 + prefixW, cy)
    if (isElim) {
      const w = ctx.measureText(disp).width
      drawStrikethrough(ctx, 18 + prefixW, cy, w)
      drawXBadge(ctx, 18 + prefixW + w + 10, cy)
      ctx.fillStyle = '#1a1a1a'
    }
    ctx.font = '12px Arial'
    partidos.forEach((p, pi) => {
      const pred = pronosticos?.find(pr=>pr.jugador_id===jug.id&&pr.partido_id===p.id)
      const txt  = pred&&pred.goles1!==null?`${pred.goles1}-${pred.goles2}`:'-'
      ctx.textAlign = 'center'
      ctx.fillText(txt, 14+nameW+pi*matchW+matchW/2, cy)
    })
  })

  ctx.restore()
  const buf = await canvas.encode('png')
  console.log(`📊 imagenDia: ${partidos.length} partidos, ${jugadores.length} jugadores, ${buf.length} bytes`)
  return buf
}

// ── TABLA CHANCES ─────────────────────────────────────────
async function generarTablaChances(board, partidos) {
  const rem = (partidos||[]).filter(p=>p.goles1===null).length
  const top = board[0]?.tot || 0
  const data = board.map(p=>({...p, maxP: p.tot + rem*3, puede: p.tot + rem*3 >= top}))

  const M       = 20
  const GAP     = 12
  const TITLE_H = 38
  const COL_H   = 26
  const ROW_H   = 32
  const FOOTER_H= 22
  const tableW  = 420
  const H = M + TITLE_H + GAP + COL_H + data.length * ROW_H + FOOTER_H + M
  const W = tableW + M * 2

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(M, M)

  // Título
  ctx.fillStyle = '#1a6b8a'
  roundRect(ctx, 0, 0, tableW, TITLE_H, 8)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 13px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('CHANCES DE GANAR', tableW/2, TITLE_H/2)

  const tY = TITLE_H + GAP
  const cols = [
    { x: 0,   w: 28,  label: 'POS', bg: '#2a2a3a', align: 'center' },
    { x: 28,  w: 160, label: 'JUGADOR', bg: '#2a2a3a', align: 'left' },
    { x: 188, w: 44,  label: 'PTS',    bg: '#2a2a3a', align: 'center' },
    { x: 232, w: 54,  label: 'MÁX',   bg: '#1a6b8a', align: 'center' },
    { x: 286, w: tableW-286, label: 'ESTADO', bg: '#1a6b8a', align: 'center' },
  ]

  cols.forEach(col => {
    ctx.fillStyle = col.bg
    ctx.fillRect(col.x, tY, col.w, COL_H)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 8px Arial'
    ctx.textAlign = col.align === 'left' ? 'left' : 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(col.label, col.align==='left'?col.x+6:col.x+col.w/2, tY+COL_H/2)
  })

  data.forEach((p, i) => {
    const y  = tY + COL_H + i * ROW_H
    ctx.fillStyle = !p.puede ? '#f0f0f0' : i%2===0 ? '#ebebeb' : '#ffffff'
    ctx.fillRect(0, y, tableW, ROW_H)
    const cy = y + ROW_H/2
    ctx.textBaseline = 'middle'

    ctx.fillStyle = p.puede ? '#1a1a1a' : '#aaaaaa'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${i+1}`, cols[0].x+cols[0].w/2, cy)

    const { name: rawName, isElim } = parseEliminado(p.nombre)
    const nombre = rawName.toUpperCase()
    const disp = nombre.length>16?nombre.slice(0,16)+'…':nombre
    ctx.textAlign = 'left'
    const prevFill = ctx.fillStyle
    if (isElim) ctx.fillStyle = '#999999'
    ctx.fillText(disp, cols[1].x+6, cy)
    if (isElim) {
      const w = ctx.measureText(disp).width
      drawStrikethrough(ctx, cols[1].x+6, cy, w)
      drawXBadge(ctx, cols[1].x+6 + w + 10, cy)
      ctx.fillStyle = prevFill
    }

    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'center'
    ctx.fillStyle = p.puede ? '#3d0070' : '#aaaaaa'
    ctx.fillText(`${p.tot}`, cols[2].x+cols[2].w/2, cy)

    ctx.font = '10px Arial'
    ctx.fillStyle = p.puede ? '#1a6b8a' : '#cccccc'
    ctx.fillText(`${p.maxP}`, cols[3].x+cols[3].w/2, cy)

    ctx.font = 'bold 10px Arial'
    ctx.fillStyle = p.puede ? '#1a6b2e' : '#c0392b'
    ctx.fillText(p.puede ? '✓ EN CARRERA' : '✗ ELIMINADO', cols[4].x+cols[4].w/2, cy)
  })

  const footerY = tY + COL_H + data.length * ROW_H
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, footerY, tableW, FOOTER_H)
  const fecha = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'})
  ctx.fillStyle = '#aaaaaa'; ctx.font = '8px Arial'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(`PRODE MUNDIAL 2026  ·  ${fecha}  ·  ${rem} partidos restantes`, tableW/2, footerY+FOOTER_H/2)

  ctx.restore()
  const buf = await canvas.encode('png')
  console.log(`📊 tablaChances: ${data.length} jugadores, ${buf.length} bytes`)
  return buf
}

// ── TABLA PROBABILIDADES ──────────────────────────────────
async function generarTablaProba(results, sims=5000) {
  const M  = 20; const GAP = 12; const LH = 22; const W = 420
  const TITLE_H = 38
  const totalLines = 2 + 2 + results.length + 1 + 2
  const H = M + TITLE_H + GAP + Math.ceil(totalLines)*LH + M + 10

  const canvas = createCanvas(W*S, H*S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)
  ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0,0,W,H)

  ctx.save(); ctx.translate(M, M)
  const tableW = W - M*2

  ctx.fillStyle = '#1a6b8a'
  roundRect(ctx, 0, 0, tableW, TITLE_H, 8)
  ctx.fill()
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px monospace'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('CHANCES DE GANAR', tableW/2, TITLE_H/2)

  let y = TITLE_H + GAP + LH
  ctx.textBaseline = 'alphabetic'
  const fecha = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'})
  ctx.font = '11px monospace'; ctx.fillStyle = '#2a2a2a'; ctx.textAlign = 'left'
  ctx.fillText(`PRODE MUNDIAL 2026  .  ${fecha}`, 0, y); y += LH
  ctx.fillText(`simulacion ${sims.toLocaleString()} torneos`, 0, y); y += LH*1.5

  const xNum=0, xNombre=24, xBar=160, xWin=tableW-48, xEpts=tableW-8
  ctx.font='bold 11px monospace'; ctx.fillStyle='#1a1a1a'
  ctx.fillText('#', xNum, y); ctx.fillText('JUGADOR', xNombre, y)
  ctx.textAlign='right'; ctx.fillText('WIN%',xWin,y); ctx.fillText('E[PTS]',xEpts,y)
  ctx.textAlign='left'; y+=6
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(tableW,y); ctx.stroke(); y+=LH

  const inkLevels=['#1a1a1a','#2a2a2a','#2a2a2a','#3a3a3a','#3a3a3a','#4a4a4a','#4a4a4a','#555555','#666666','#777777','#888888','#999999','#aaaaaa','#aaaaaa','#bbbbbb','#cccccc','#cccccc','#cccccc','#dddddd','#dddddd']
  const maxWin = results[0]?.winPct||1

  results.forEach((p,i)=>{
    const ink=inkLevels[Math.min(i,inkLevels.length-1)]
    const num=String(i+1).padStart(2,' ')
    const { name: rawName, isElim } = parseEliminado(p.nombre)
    const nombre=rawName.toUpperCase()
    const disp=nombre.length>10?nombre.slice(0,10)+'…':nombre
    const barW=60, barH=6, filled=Math.round((p.winPct/maxWin)*barW)
    ctx.fillStyle='#e8e0d0'; ctx.fillRect(xBar,y-10,barW,barH)
    ctx.fillStyle=i===0?'#3d0070':i<3?'#7c3aed':'#aaaaaa'; ctx.fillRect(xBar,y-10,filled,barH)
    ctx.font='12px monospace'; ctx.textAlign='left'
    ctx.fillStyle=ink
    ctx.fillText(num,xNum,y)
    ctx.fillStyle = isElim ? '#999999' : ink
    ctx.fillText(disp,xNombre,y)
    if (isElim) {
      const w = ctx.measureText(disp).width
      drawStrikethrough(ctx, xNombre, y - 4, w)
      drawXBadge(ctx, xNombre + w + 10, y - 4, 4)
      ctx.fillStyle = ink
    }
    ctx.font='bold 12px monospace'; ctx.textAlign='right'
    ctx.fillText(`${p.winPct.toFixed(1)}%`,xWin,y)
    ctx.font='12px monospace'
    ctx.fillText(`${p.expectedPts}`,xEpts,y)
    ctx.textAlign='left'; y+=LH
  })

  y+=4; ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(tableW,y); ctx.stroke(); y+=LH
  ctx.fillStyle='#3a3a3a'; ctx.font='10px monospace'
  ctx.fillText('* basado en odds del mercado',0,y); y+=LH*0.9
  ctx.fillText('* E[PTS] = puntos esperados totales',0,y)

  ctx.restore()
  const buf = await canvas.encode('png')
  return buf
}

async function generarTablaImagen(board, tipo='oficial', extra={}) {
  if (tipo==='nooficial') return generarTablaNoOficial(board, extra.jugados||0, extra.liveMatches||[])
  return generarTablaOficial(board)
}

module.exports = { generarTablaImagen, generarImagenDia, generarTablaProba, generarTablaChances }
