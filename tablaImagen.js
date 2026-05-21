const { createCanvas } = require('@napi-rs/canvas')

const S = 3 // Scale factor — 3x para alta definición al hacer zoom

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

// ── Tabla OFICIAL ─────────────────────────────────────────
async function generarTablaOficial(board) {
  const W = 500
  const HEADER_H = 46
  const COL_H = 26
  const ROW_H = 36
  const FOOTER_H = 24
  const H = HEADER_H + COL_H + board.length * ROW_H + FOOTER_H
  const splitX = Math.floor(W * 0.65)

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Header
  ctx.fillStyle = '#6a0dad'
  ctx.fillRect(0, 0, splitX, HEADER_H)
  ctx.fillStyle = '#27ae60'
  ctx.fillRect(splitX, 0, W - splitX, HEADER_H)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('TABLA OFICIAL', 14, HEADER_H / 2)
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('RESULTADOS', splitX + (W - splitX) / 2, HEADER_H / 2)

  // Columnas
  const cols = [
    { x: 0,   w: 32,  label: 'POS', bg: '#222222', align: 'center' },
    { x: 32,  w: 158, label: 'JUGADOR', bg: '#222222', align: 'left' },
    { x: 190, w: 44,  label: 'PTS', bg: '#222222', align: 'center' },
    { x: 234, w: 36,  label: 'JUG', bg: '#222222', align: 'center' },
    { x: 270, w: 40,  label: '3',   bg: '#27ae60', align: 'center' },
    { x: 310, w: 40,  label: '1',   bg: '#27ae60', align: 'center' },
    { x: 350, w: 40,  label: '0',   bg: '#27ae60', align: 'center' },
    { x: 390, w: 110, label: '%',   bg: '#1a6b8a', align: 'center' },
  ]

  ctx.textBaseline = 'middle'
  cols.forEach(col => {
    ctx.fillStyle = col.bg
    ctx.fillRect(col.x, HEADER_H, col.w, COL_H)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 9px Arial'
    ctx.textAlign = col.align === 'left' ? 'left' : 'center'
    ctx.fillText(col.label, col.align === 'left' ? col.x + 6 : col.x + col.w / 2, HEADER_H + COL_H / 2)
  })

  // Filas
  board.forEach((p, i) => {
    const y = HEADER_H + COL_H + i * ROW_H
    ctx.fillStyle = i % 2 === 0 ? '#d9d9d9' : '#ffffff'
    ctx.fillRect(0, y, W, ROW_H)
    const cy = y + ROW_H / 2
    const nombre = (p.nombre || '').toUpperCase()
    const displayNombre = nombre.length > 14 ? nombre.slice(0, 14) + '…' : nombre

    ctx.textBaseline = 'middle'

    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${i + 1}`, cols[0].x + cols[0].w / 2, cy)

    ctx.textAlign = 'left'
    ctx.fillText(displayNombre, cols[1].x + 6, cy)

    ctx.font = 'bold 15px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${p.tot}`, cols[2].x + cols[2].w / 2, cy)

    ctx.fillStyle = '#666666'
    ctx.font = '10px Arial'
    ctx.fillText(`${p.jug}`, cols[3].x + cols[3].w / 2, cy)

    ctx.fillStyle = '#1a6b2e'
    ctx.font = 'bold 11px Arial'
    ctx.fillText(`${p.ex}`, cols[4].x + cols[4].w / 2, cy)

    ctx.fillStyle = '#b7770d'
    ctx.fillText(`${p.lv}`, cols[5].x + cols[5].w / 2, cy)

    ctx.fillStyle = '#c0392b'
    ctx.fillText(`${p.fail}`, cols[6].x + cols[6].w / 2, cy)

    const pct = p.jug > 0 ? ((p.ex / p.jug) * 100).toFixed(2) + ' %' : '-'
    ctx.fillStyle = '#444444'
    ctx.font = '10px Arial'
    ctx.fillText(pct, cols[7].x + cols[7].w / 2, cy)
  })

  // Footer
  const footerY = HEADER_H + COL_H + board.length * ROW_H
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, footerY, W, FOOTER_H)
  ctx.strokeStyle = '#dddddd'
  ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(W, footerY); ctx.stroke()
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  ctx.fillStyle = '#888888'
  ctx.font = '9px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`PRODE MUNDIAL 2026  |  ${fecha}  |  Exacto=3pts  Levante=1pt`, W / 2, footerY + FOOTER_H / 2)

  const buf = await canvas.encode('png')
  console.log(`📊 tablaOficial: ${board.length} jugadores, ${buf.length} bytes`)
  return buf
}

// ── Tabla NO OFICIAL ──────────────────────────────────────
async function generarTablaNoOficial(board, jugados = 0) {
  const P = 24       // padding
  const LH = 22      // line height
  const W = 500

  const totalLines = 3 + 1 + 2 + board.length + 1 + 2
  const H = P * 2 + totalLines * LH + 10

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  const C = { num: P, name: P + 32, pts: 290, ex: 330, lv: 365, fail: 400 }
  let y = P + LH

  ctx.fillStyle = '#1a1a1a'
  ctx.textBaseline = 'alphabetic'

  ctx.font = 'bold 13px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('⚽ PRODE MUNDIAL 2026', P, y); y += LH

  ctx.font = '12px Arial'
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  ctx.fillText(`TABLA NO OFICIAL · ${fecha}`, P, y); y += LH
  ctx.fillText(`${jugados}/72 partidos jugados`, P, y); y += LH * 1.4

  // Header columnas
  ctx.font = 'bold 11px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('#', C.num, y)
  ctx.fillText('JUGADOR', C.name, y)
  ctx.textAlign = 'right'
  ctx.fillText('PTS', C.pts, y)
  ctx.fillText('3', C.ex, y)
  ctx.fillText('1', C.lv, y)
  ctx.fillText('0', C.fail, y)
  ctx.textAlign = 'left'
  y += 8

  // Separador
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke()
  y += LH

  // Filas
  ctx.font = '12px Arial'
  board.forEach((p, i) => {
    const num = String(i + 1).padStart(2, '0')
    const nombre = (p.nombre || '').toUpperCase()
    const displayNombre = nombre.length > 14 ? nombre.slice(0, 14) + '…' : nombre

    ctx.fillStyle = '#1a1a1a'
    ctx.textAlign = 'left'
    ctx.fillText(num, C.num, y)
    ctx.fillText(displayNombre, C.name, y)
    ctx.textAlign = 'right'
    ctx.fillText(`${p.tot}`, C.pts, y)
    ctx.fillText(`${p.ex}`, C.ex, y)
    ctx.fillText(`${p.lv}`, C.lv, y)
    ctx.fillText(`${p.fail}`, C.fail, y)
    ctx.textAlign = 'left'
    y += LH
  })

  y += 4
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke()
  y += LH

  ctx.font = '11px Arial'
  ctx.fillStyle = '#1a1a1a'
  ctx.fillText('⚡ exacto=3pts   levante=1pt', P, y); y += LH * 0.9
  ctx.fillText('⚠ tabla no oficial', P, y)

  const buf = await canvas.encode('png')
  console.log(`📊 tablaNoOficial: ${board.length} jugadores, ${buf.length} bytes`)
  return buf
}

// ── Imagen del Día ────────────────────────────────────────
async function generarImagenDia(partidos, jugadores, pronosticos, fecha) {
  const P = 24
  const LH = 22
  const nameW = 135
  const nM = partidos.length
  const matchW = nM <= 4 ? 60 : nM <= 6 ? 50 : 44
  const W = Math.max(480, P * 2 + nameW + nM * matchW)
  const totalLines = 2 + 1.4 + 2.6 + 2 + jugadores.length + 1 + 1
  const H = P * 2 + Math.ceil(totalLines) * LH + 20

  const canvas = createCanvas(W * S, H * S)
  const ctx = canvas.getContext('2d')
  ctx.scale(S, S)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#1a1a1a'

  let y = P + LH

  ctx.font = 'bold 13px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('⚽ PRODE MUNDIAL 2026', P, y); y += LH

  const fmtFecha = fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : ''
  ctx.font = '12px Arial'
  ctx.fillText(`RESULTADOS · ${fmtFecha.toUpperCase()}`, P, y); y += LH * 1.4

  // Headers equipos (dos líneas)
  ctx.font = 'bold 10px Arial'
  partidos.forEach((p, j) => {
    const cx = P + nameW + j * matchW + matchW / 2
    ctx.textAlign = 'center'
    ctx.fillText(abbr(p.equipo1), cx, y)
  })
  y += LH * 0.8

  partidos.forEach((p, j) => {
    const cx = P + nameW + j * matchW + matchW / 2
    ctx.textAlign = 'center'
    ctx.fillText(abbr(p.equipo2), cx, y)
  })
  y += LH * 0.6

  // Separador
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke()
  y += LH

  // Fila RESULTADO
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('RESULTADO', P, y)
  partidos.forEach((p, j) => {
    const cx = P + nameW + j * matchW + matchW / 2
    ctx.textAlign = 'center'
    ctx.fillText(p.goles1 !== null ? `${p.goles1}-${p.goles2}` : '-', cx, y)
  })

  y += 6
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 0.5
  ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke()
  y += LH

  // Filas jugadores
  ctx.font = '11px Arial'
  jugadores.forEach((jug, ji) => {
    const num = String(ji + 1).padStart(2, '0')
    const nombre = (jug.nombre || '').toUpperCase()
    const displayNombre = nombre.length > 12 ? nombre.slice(0, 12) + '…' : nombre

    ctx.fillStyle = '#1a1a1a'
    ctx.textAlign = 'left'
    ctx.fillText(`${num} ${displayNombre}`, P, y)

    partidos.forEach((p, pi) => {
      const pred = pronosticos?.find(pr => pr.jugador_id === jug.id && pr.partido_id === p.id)
      const txt = pred && pred.goles1 !== null ? `${pred.goles1}-${pred.goles2}` : '-'
      ctx.textAlign = 'center'
      ctx.fillText(txt, P + nameW + pi * matchW + matchW / 2, y)
    })

    y += LH
  })

  y += 4
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke()
  y += LH

  ctx.font = '11px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('⚠ pronosticos · no incluye pts', P, y)

  const buf = await canvas.encode('png')
  console.log(`📊 imagenDia: ${partidos.length} partidos, ${jugadores.length} jugadores, ${buf.length} bytes`)
  return buf
}

async function generarTablaImagen(board, tipo = 'oficial', extra = {}) {
  if (tipo === 'nooficial') return generarTablaNoOficial(board, extra.jugados || 0)
  return generarTablaOficial(board)
}

module.exports = { generarTablaImagen, generarImagenDia }
