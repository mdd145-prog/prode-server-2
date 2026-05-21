const { createCanvas } = require('@napi-rs/canvas')

const S = 3 // 3x para alta definición al hacer zoom

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
const abbr = n => TEAM_ABBR[n] || n.slice(0, 3).toUpperCase()

// ── TABLA OFICIAL ─────────────────────────────────────────
async function generarTablaOficial(board) {
  const M  = 20  // margen exterior blanco
  const P  = 12  // padding interior tabla
  const HEADER_H = 40
  const COL_H    = 24
  const ROW_H    = 34
  const FOOTER_H = 22
  const tableW   = 460
  const tableH   = HEADER_H + COL_H + board.length * ROW_H + FOOTER_H
  const W = tableW + M * 2
  const H = tableH + M * 2

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  // Fondo blanco total
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Tabla con offset M
  ctx.save()
  ctx.translate(M, M)

  // Header oscuro
  ctx.fillStyle = '#3d0070'
  ctx.fillRect(0, 0, tableW, HEADER_H)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TABLA OFICIAL', tableW / 2, HEADER_H / 2)

  // Cols config
  const cols = [
    { x: 0,   w: 28,  label: 'POS', bg: '#7c3aed', align: 'center' },
    { x: 28,  w: 150, label: 'JUGADOR', bg: '#7c3aed', align: 'left' },
    { x: 178, w: 42,  label: 'PTS', bg: '#7c3aed', align: 'center' },
    { x: 220, w: 34,  label: 'JUG', bg: '#7c3aed', align: 'center' },
    { x: 254, w: 38,  label: '3',   bg: '#27ae60', align: 'center' },
    { x: 292, w: 38,  label: '1',   bg: '#27ae60', align: 'center' },
    { x: 330, w: 38,  label: '0',   bg: '#27ae60', align: 'center' },
    { x: 368, w: tableW - 368, label: '%', bg: '#1a6b8a', align: 'center' },
  ]

  // Headers columnas
  cols.forEach(col => {
    ctx.fillStyle = col.bg
    ctx.fillRect(col.x, HEADER_H, col.w, COL_H)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 8px Arial'
    ctx.textAlign = col.align === 'left' ? 'left' : 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(col.label, col.align === 'left' ? col.x + 6 : col.x + col.w / 2, HEADER_H + COL_H / 2)
  })

  // Filas
  board.forEach((p, i) => {
    const y  = HEADER_H + COL_H + i * ROW_H
    const bg = i % 2 === 0 ? '#ebebeb' : '#ffffff'
    ctx.fillStyle = bg
    ctx.fillRect(0, y, tableW, ROW_H)
    const cy = y + ROW_H / 2
    ctx.textBaseline = 'middle'

    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${i + 1}`, cols[0].x + cols[0].w / 2, cy)

    const nombre = (p.nombre || '').toUpperCase()
    const displayNombre = nombre.length > 14 ? nombre.slice(0, 14) + '…' : nombre
    ctx.textAlign = 'left'
    ctx.fillText(displayNombre, cols[1].x + 6, cy)

    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${p.tot}`, cols[2].x + cols[2].w / 2, cy)

    ctx.fillStyle = '#888888'
    ctx.font = '9px Arial'
    ctx.fillText(`${p.jug}`, cols[3].x + cols[3].w / 2, cy)

    ctx.fillStyle = '#1a6b2e'
    ctx.font = 'bold 10px Arial'
    ctx.fillText(`${p.ex}`, cols[4].x + cols[4].w / 2, cy)

    ctx.fillStyle = '#b7770d'
    ctx.fillText(`${p.lv}`, cols[5].x + cols[5].w / 2, cy)

    ctx.fillStyle = '#c0392b'
    ctx.fillText(`${p.fail}`, cols[6].x + cols[6].w / 2, cy)

    const pct = p.jug > 0 ? ((p.ex / p.jug) * 100).toFixed(2) + ' %' : '-'
    ctx.fillStyle = '#555555'
    ctx.font = '9px Arial'
    ctx.fillText(pct, cols[7].x + cols[7].w / 2, cy)
  })

  // Footer
  const footerY = HEADER_H + COL_H + board.length * ROW_H
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, footerY, tableW, FOOTER_H)
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  ctx.fillStyle = '#aaaaaa'
  ctx.font = '8px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`PRODE MUNDIAL 2026  ·  ${fecha}  ·  exacto=3pts  levante=1pt`, tableW / 2, footerY + FOOTER_H / 2)

  ctx.restore()

  const buf = await canvas.encode('png')
  console.log(`📊 tablaOficial: ${board.length} jugadores, ${buf.length} bytes`)
  return buf
}

// ── TABLA NO OFICIAL (maquina de escribir) ────────────────
async function generarTablaNoOficial(board, jugados = 0) {
  const M  = 28   // margen exterior crema
  const LH = 22   // line height
  const W  = 400  // más angosta

  const totalLines = 3 + 1.5 + 2 + board.length + 1 + 2
  const H = M * 2 + Math.ceil(totalLines) * LH + 10

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'alphabetic'

  // Columnas: nombre corto + aire entre números
  const xNum    = M
  const xNombre = M + 28
  const xPts    = W - M - 68
  const xEx     = W - M - 46
  const xLv     = W - M - 26
  const xFail   = W - M - 6

  let y = M + LH

  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 13px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('PRODE MUNDIAL 2026', xNum, y); y += LH

  ctx.font = '12px monospace'
  ctx.fillStyle = '#2a2a2a'
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  ctx.fillText(`TABLA NO OFICIAL . ${fecha}`, xNum, y); y += LH
  ctx.fillText(`${jugados}/72 partidos jugados`, xNum, y); y += LH * 1.5

  ctx.font = 'bold 11px monospace'
  ctx.fillStyle = '#1a1a1a'
  ctx.textAlign = 'left'
  ctx.fillText('#', xNum, y)
  ctx.fillText('JUGADOR', xNombre, y)
  ctx.textAlign = 'right'
  ctx.fillText('PTS', xPts, y)
  ctx.fillText('3', xEx, y)
  ctx.fillText('1', xLv, y)
  ctx.fillText('0', xFail, y)
  ctx.textAlign = 'left'
  y += 6

  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke()
  y += LH

  const inkLevels = ['#1a1a1a','#2a2a2a','#2a2a2a','#3a3a3a','#3a3a3a','#3a3a3a','#4a4a4a','#4a4a4a','#4a4a4a','#555555','#666666','#666666','#666666','#777777','#777777','#888888','#888888','#888888','#999999','#aaaaaa']

  board.forEach((p, i) => {
    const ink = inkLevels[Math.min(i, inkLevels.length - 1)]
    const num = String(i + 1).padStart(2, ' ')
    const nombre = (p.nombre || '').toUpperCase()
    const displayNombre = nombre.length > 12 ? nombre.slice(0, 12) + '…' : nombre

    ctx.fillStyle = ink
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(num, xNum, y)
    ctx.fillText(displayNombre, xNombre, y)
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${p.tot}`, xPts, y)
    ctx.font = '12px monospace'
    ctx.fillText(`${p.ex}`, xEx, y)
    ctx.fillText(`${p.lv}`, xLv, y)
    ctx.fillText(`${p.fail}`, xFail, y)
    ctx.textAlign = 'left'
    y += LH
  })

  y += 4
  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke()
  y += LH

  ctx.fillStyle = '#3a3a3a'
  ctx.font = '11px monospace'
  ctx.fillText('* exacto=3pts   levante=1pt', M, y); y += LH * 0.9
  ctx.fillText('* tabla no oficial', M, y)

  const buf = await canvas.encode('png')
  console.log(`📊 tablaNoOficial: ${board.length} jugadores, ${buf.length} bytes`)
  return buf
}

// ── IMAGEN DEL DÍA ────────────────────────────────────────
async function generarImagenDia(partidos, jugadores, pronosticos, fecha) {
  const M      = 16   // margen exterior blanco
  const P      = 14   // padding interior
  const nM     = partidos.length
  const nameW  = 90
  const matchW = nM <= 4 ? 58 : nM <= 6 ? 50 : 44
  const HEADER_H = 36
  const DATE_H   = 46
  const COUNTRY_H= 32
  const RES_H    = 28
  const ROW_H    = 26

  const tableW = nameW + nM * matchW + P * 2
  const W = tableW + M * 2
  const tableH = HEADER_H + DATE_H + COUNTRY_H + RES_H + jugadores.length * ROW_H + P
  const H = tableH + M * 2

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(M, M)

  // Header RESULTADOS (violeta oscuro)
  ctx.fillStyle = '#3d0070'
  ctx.fillRect(0, 0, tableW, HEADER_H)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('RESULTADOS', tableW / 2, HEADER_H / 2)

  // Fila fecha (violeta muy claro) + headers países (violeta medio)
  const fmtFecha = fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).toUpperCase() : ''

  // Celda fecha
  ctx.fillStyle = '#f0e8ff'
  ctx.fillRect(0, HEADER_H, P + nameW, DATE_H + COUNTRY_H)
  ctx.fillStyle = '#3d0070'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(fmtFecha, P + nameW / 2, HEADER_H + (DATE_H + COUNTRY_H) / 2)

  // Headers países (violeta medio)
  partidos.forEach((p, j) => {
    const cx = P + nameW + j * matchW + matchW / 2
    // Top half: equipo1
    ctx.fillStyle = '#7c3aed'
    ctx.fillRect(P + nameW + j * matchW, HEADER_H, matchW, DATE_H)
    // Bottom half: equipo2
    ctx.fillStyle = '#6d28d9'
    ctx.fillRect(P + nameW + j * matchW, HEADER_H + DATE_H, matchW, COUNTRY_H)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 9px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(abbr(p.equipo1), cx, HEADER_H + DATE_H / 2)
    ctx.fillText(abbr(p.equipo2), cx, HEADER_H + DATE_H + COUNTRY_H / 2)
  })

  // Fila RESULTADO (violeta claro)
  const resY = HEADER_H + DATE_H + COUNTRY_H
  ctx.fillStyle = '#ddd0f5'
  ctx.fillRect(0, resY, tableW, RES_H)
  ctx.fillStyle = '#3d0070'
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('RESULTADO', P + 4, resY + RES_H / 2)
  partidos.forEach((p, j) => {
    const cx = P + nameW + j * matchW + matchW / 2
    ctx.textAlign = 'center'
    ctx.font = 'bold 11px Arial'
    ctx.fillText(p.goles1 !== null ? `${p.goles1}-${p.goles2}` : '-', cx, resY + RES_H / 2)
  })

  // Filas jugadores
  jugadores.forEach((jug, ji) => {
    const y  = resY + RES_H + ji * ROW_H
    const bg = ji % 2 === 0 ? '#ebebeb' : '#ffffff'
    ctx.fillStyle = bg
    ctx.fillRect(0, y, tableW, ROW_H)
    const cy = y + ROW_H / 2

    const num = String(ji + 1).padStart(2, ' ')
    const nombre = (jug.nombre || '').toUpperCase()
    const displayNombre = nombre.length > 9 ? nombre.slice(0, 9) + '…' : nombre

    ctx.fillStyle = '#1a1a1a'
    ctx.font = '10px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${num} ${displayNombre}`, P + 4, cy)

    partidos.forEach((p, pi) => {
      const pred = pronosticos?.find(pr => pr.jugador_id === jug.id && pr.partido_id === p.id)
      const txt  = pred && pred.goles1 !== null ? `${pred.goles1}-${pred.goles2}` : '-'
      ctx.textAlign = 'center'
      ctx.font = '10px Arial'
      ctx.fillText(txt, P + nameW + pi * matchW + matchW / 2, cy)
    })
  })

  ctx.restore()

  const buf = await canvas.encode('png')
  console.log(`📊 imagenDia: ${partidos.length} partidos, ${jugadores.length} jugadores, ${buf.length} bytes`)
  return buf
}

async function generarTablaImagen(board, tipo = 'oficial', extra = {}) {
  if (tipo === 'nooficial') return generarTablaNoOficial(board, extra.jugados || 0)
  return generarTablaOficial(board)
}


// ── TABLA PROBABILIDADES ──────────────────────────────────
async function generarTablaProba(results, sims = 5000) {
  const M  = 28
  const LH = 22
  const W  = 420

  const totalLines = 3 + 1.5 + 2 + results.length + 1 + 2
  const H = M * 2 + Math.ceil(totalLines) * LH + 10

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'alphabetic'

  const xNum    = M
  const xNombre = M + 28
  const xBar    = M + 160
  const xWin    = W - M - 58
  const xEpts   = W - M - 8

  let y = M + LH

  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 13px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('PRODE MUNDIAL 2026', xNum, y); y += LH

  ctx.font = '12px monospace'
  ctx.fillStyle = '#2a2a2a'
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  ctx.fillText(`CHANCES DE GANAR . ${fecha}`, xNum, y); y += LH
  ctx.fillText(`simulacion ${sims.toLocaleString()} torneos`, xNum, y); y += LH * 1.5

  // Header
  ctx.font = 'bold 11px monospace'
  ctx.fillStyle = '#1a1a1a'
  ctx.textAlign = 'left'
  ctx.fillText('#', xNum, y)
  ctx.fillText('JUGADOR', xNombre, y)
  ctx.textAlign = 'right'
  ctx.fillText('WIN%', xWin, y)
  ctx.fillText('E[PTS]', xEpts, y)
  ctx.textAlign = 'left'
  y += 6

  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke()
  y += LH

  const inkLevels = ['#1a1a1a','#2a2a2a','#2a2a2a','#3a3a3a','#3a3a3a','#3a3a3a','#4a4a4a','#4a4a4a','#4a4a4a','#555555','#666666','#666666','#666666','#777777','#777777','#888888','#888888','#888888','#999999','#aaaaaa']
  const maxWin = results[0]?.winPct || 1

  results.forEach((p, i) => {
    const ink = inkLevels[Math.min(i, inkLevels.length - 1)]
    const num = String(i + 1).padStart(2, ' ')
    const nombre = (p.nombre || '').toUpperCase()
    const displayNombre = nombre.length > 10 ? nombre.slice(0, 10) + '…' : nombre

    // Barra proporcional
    const barW = 60
    const barH = 6
    const filled = Math.round((p.winPct / maxWin) * barW)
    const barY = y - 10

    ctx.fillStyle = '#e8e0d0'
    ctx.fillRect(xBar, barY, barW, barH)
    ctx.fillStyle = i === 0 ? '#3d0070' : i < 3 ? '#7c3aed' : '#aaaaaa'
    ctx.fillRect(xBar, barY, filled, barH)

    ctx.fillStyle = ink
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(num, xNum, y)
    ctx.fillText(displayNombre, xNombre, y)
    ctx.textAlign = 'right'
    ctx.font = 'bold 12px monospace'
    ctx.fillText(`${p.winPct.toFixed(1)}%`, xWin, y)
    ctx.font = '12px monospace'
    ctx.fillText(`${p.expectedPts}`, xEpts, y)
    ctx.textAlign = 'left'
    y += LH
  })

  y += 4
  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke()
  y += LH

  ctx.fillStyle = '#3a3a3a'
  ctx.font = '11px monospace'
  ctx.fillText('* basado en odds del mercado', M, y); y += LH * 0.9
  ctx.fillText('* E[PTS] = puntos esperados totales', M, y)

  const buf = await canvas.encode('png')
  console.log(`📊 tablaProba: ${results.length} jugadores, ${buf.length} bytes`)
  return buf
}

module.exports = { generarTablaImagen, generarImagenDia, generarTablaProba }
