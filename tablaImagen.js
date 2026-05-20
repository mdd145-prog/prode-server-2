const { createCanvas } = require('canvas')

async function generarTablaImagen(board, tipo = 'oficial') {
  const isOficial   = tipo === 'oficial'
  const headerBg    = isOficial ? '#6a0dad' : '#1a6b8a'
  const statsBg     = isOficial ? '#27ae60' : '#e67e22'
  const titulo      = isOficial ? 'TABLA OFICIAL' : 'TABLA NO OFICIAL'
  const fecha       = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const W         = 560
  const HEADER_H  = 50
  const COL_H     = 28
  const ROW_H     = 38
  const FOOTER_H  = 26
  const H         = HEADER_H + COL_H + board.length * ROW_H + FOOTER_H

  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  // Fondo blanco completo (evita negros por transparencia en JPEG)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // ── Header ────────────────────────────────────────────
  const splitX = Math.floor(W * 0.68)
  ctx.fillStyle = headerBg
  ctx.fillRect(0, 0, splitX, HEADER_H)
  ctx.fillStyle = statsBg
  ctx.fillRect(splitX, 0, W - splitX, HEADER_H)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(titulo, 14, HEADER_H / 2)

  ctx.font = 'bold 11px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('RESULTADOS', splitX + (W - splitX) / 2, HEADER_H / 2)

  // ── Columnas header ───────────────────────────────────
  const cols = [
    { x: 0,   w: 44,  label: 'POS',     dark: true  },
    { x: 44,  w: 210, label: 'JUGADOR', dark: true, left: true },
    { x: 254, w: 60,  label: 'PTS',     dark: true  },
    { x: 314, w: 48,  label: 'JUG',     dark: true  },
    { x: 362, w: 50,  label: '3',       dark: false },
    { x: 412, w: 50,  label: '1',       dark: false },
    { x: 462, w: 50,  label: '0',       dark: false },
    { x: 512, w: 48,  label: '%',       dark: false },
  ]
  ctx.textBaseline = 'middle'
  cols.forEach(col => {
    ctx.fillStyle = col.dark ? '#1a1a2e' : statsBg
    ctx.fillRect(col.x, HEADER_H, col.w, COL_H)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = col.left ? 'left' : 'center'
    const tx = col.left ? col.x + 8 : col.x + col.w / 2
    ctx.fillText(col.label, tx, HEADER_H + COL_H / 2)
  })

  // ── Filas jugadores ───────────────────────────────────
  board.forEach((p, i) => {
    const y   = HEADER_H + COL_H + i * ROW_H
    const bgRow = i % 2 === 0 ? '#f8f4ff' : '#ffffff'
    ctx.fillStyle = bgRow
    ctx.fillRect(0, y, W, ROW_H)

    // separador
    ctx.strokeStyle = '#e0dff0'
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(0, y + ROW_H); ctx.lineTo(W, y + ROW_H); ctx.stroke()

    const cy = y + ROW_H / 2

    // POS — número con círculo de color
    const posColors = ['#f0c030', '#aaaaaa', '#cd7f32']
    const posColor  = i < 3 ? posColors[i] : '#cccccc'
    const posLabel  = `${i + 1}`
    ctx.fillStyle = posColor
    ctx.beginPath(); ctx.arc(cols[0].x + cols[0].w / 2, cy, 13, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = i < 3 ? '#1a1a2e' : '#ffffff'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(posLabel, cols[0].x + cols[0].w / 2, cy)

    // Nombre
    const nombre = p.nombre ? (p.nombre.length > 18 ? p.nombre.slice(0, 18) + '...' : p.nombre) : '-'
    ctx.fillStyle = '#1a1a2e'
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(nombre, cols[1].x + 8, cy)

    // PTS
    ctx.fillStyle = headerBg
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${p.tot}`, cols[2].x + cols[2].w / 2, cy)

    // JUG
    ctx.fillStyle = '#888888'
    ctx.font = '12px Arial'
    ctx.fillText(`${p.jug}`, cols[3].x + cols[3].w / 2, cy)

    // 3 (exactos)
    ctx.fillStyle = '#1e8449'
    ctx.font = 'bold 12px Arial'
    ctx.fillText(`${p.ex}`, cols[4].x + cols[4].w / 2, cy)

    // 1 (levantes)
    ctx.fillStyle = '#b7770d'
    ctx.fillText(`${p.lv}`, cols[5].x + cols[5].w / 2, cy)

    // 0 (fallados)
    ctx.fillStyle = '#c0392b'
    ctx.fillText(`${p.fail}`, cols[6].x + cols[6].w / 2, cy)

    // %
    ctx.fillStyle = '#555555'
    ctx.font = '11px Arial'
    ctx.fillText(p.pct || '-', cols[7].x + cols[7].w / 2, cy)
  })

  // ── Footer ────────────────────────────────────────────
  const footerY = HEADER_H + COL_H + board.length * ROW_H
  ctx.fillStyle = '#f5f0ff'
  ctx.fillRect(0, footerY, W, FOOTER_H)
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(W, footerY); ctx.stroke()
  ctx.fillStyle = '#888888'
  ctx.font = '10px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`PRODE MUNDIAL 2026  |  ${fecha}  |  Exacto=3pts  Levante=1pt`, W / 2, footerY + FOOTER_H / 2)

  const buffer = canvas.toBuffer('image/png')
  console.log(`📊 tablaImagen: board=${board.length} W=${W} H=${H} bytes=${buffer.length}`)
  return buffer
}

module.exports = { generarTablaImagen }
