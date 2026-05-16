const { createCanvas } = require('canvas')

async function generarTablaImagen(board, tipo = 'oficial') {
  const isOficial = tipo === 'oficial'
  const headerColor = isOficial ? '#6a0dad' : '#1a6b8a'
  const statsColor = isOficial ? '#27ae60' : '#e67e22'
  const titulo = isOficial ? 'TABLA OFICIAL' : 'TABLA NO OFICIAL'
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const rowH = 38
  const headerH = 56
  const subHeaderH = 30
  const titleH = 50
  const footerH = 28
  const width = 560
  const height = titleH + subHeaderH + (board.length * rowH) + footerH + 4

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Fondo blanco
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Título header
  ctx.fillStyle = headerColor
  ctx.fillRect(0, 0, width * 0.68, titleH)
  ctx.fillStyle = statsColor
  ctx.fillRect(width * 0.68, 0, width * 0.32, titleH)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px Arial'
  ctx.fillText(titulo, 14, 32)
  ctx.font = 'bold 13px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('RESULTADOS', width * 0.84, 32)
  ctx.textAlign = 'left'

  // Sub-header columnas
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, titleH, width, subHeaderH)

  const cols = [
    { x: 6,   w: 38,  label: 'POS',  align: 'center' },
    { x: 48,  w: 210, label: 'JUGADOR', align: 'left' },
    { x: 262, w: 60,  label: 'PTS',  align: 'center' },
    { x: 322, w: 52,  label: 'JUG',  align: 'center' },
    { x: 374, w: 46,  label: '3',    align: 'center', bg: statsColor },
    { x: 420, w: 46,  label: '1',    align: 'center', bg: statsColor },
    { x: 466, w: 46,  label: '0',    align: 'center', bg: statsColor },
    { x: 512, w: 48,  label: '%',    align: 'center', bg: statsColor },
  ]

  cols.forEach(col => {
    if (col.bg) {
      ctx.fillStyle = col.bg
      ctx.fillRect(col.x, titleH, col.w, subHeaderH)
    }
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px Arial'
    if (col.align === 'center') {
      ctx.textAlign = 'center'
      ctx.fillText(col.label, col.x + col.w / 2, titleH + 20)
    } else {
      ctx.textAlign = 'left'
      ctx.fillText(col.label, col.x + 4, titleH + 20)
    }
  })

  // Filas
  board.forEach((p, i) => {
    const y = titleH + subHeaderH + i * rowH
    const bg = i % 2 === 0 ? '#f5f5f5' : '#ffffff'
    ctx.fillStyle = bg
    ctx.fillRect(0, y, width, rowH)

    // Borde inferior
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, y + rowH)
    ctx.lineTo(width, y + rowH)
    ctx.stroke()

    // Posición / medalla
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
    ctx.fillStyle = '#888'
    ctx.font = i < 3 ? '18px Arial' : 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(medal, cols[0].x + cols[0].w / 2, y + rowH - 10)

    // Nombre
    ctx.fillStyle = '#1a1a2e'
    ctx.font = 'bold 13px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(p.nombre.length > 18 ? p.nombre.slice(0, 18) + '…' : p.nombre, cols[1].x + 4, y + rowH - 10)

    // Puntos
    ctx.fillStyle = '#6a0dad'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(p.tot, cols[2].x + cols[2].w / 2, y + rowH - 10)

    // JUG
    ctx.fillStyle = '#999'
    ctx.font = '12px Arial'
    ctx.fillText(p.jug, cols[3].x + cols[3].w / 2, y + rowH - 10)

    // 3 (exactos)
    ctx.fillStyle = '#1e8449'
    ctx.font = 'bold 12px Arial'
    ctx.fillText(p.ex, cols[4].x + cols[4].w / 2, y + rowH - 10)

    // 1 (levantes)
    ctx.fillStyle = '#b7770d'
    ctx.fillText(p.lv, cols[5].x + cols[5].w / 2, y + rowH - 10)

    // 0 (fallados)
    ctx.fillStyle = '#c0392b'
    ctx.fillText(p.fail, cols[6].x + cols[6].w / 2, y + rowH - 10)

    // %
    ctx.fillStyle = '#666'
    ctx.font = '11px Arial'
    ctx.fillText(p.pct, cols[7].x + cols[7].w / 2, y + rowH - 10)
  })

  // Footer
  const footerY = titleH + subHeaderH + board.length * rowH
  ctx.fillStyle = '#f9f9f9'
  ctx.fillRect(0, footerY, width, footerH)
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, footerY)
  ctx.lineTo(width, footerY)
  ctx.stroke()
  ctx.fillStyle = '#888'
  ctx.font = '10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`PRODE MUNDIAL 2026 · ${fecha}`, width / 2, footerY + 18)

  return canvas.toBuffer('image/jpeg', { quality: 0.95 })
}

module.exports = { generarTablaImagen }
