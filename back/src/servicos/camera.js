// =====================================================================
// Fotos da ESP32-CAM e o "pedido de foto".
//
// Quem PEDE uma foto: o site (botão "Ver câmera")
// ou outra placa (POST /api/comando).
// Quem ATENDE: a ESP32-CAM, que pergunta a cada 3 s em GET /api/comando.
// (baseado no backend da equipe de robótica; aqui a foto fica no banco)
// =====================================================================
const { query } = require('../db')

const FOTOS_GUARDADAS = Number(process.env.FOTOS_GUARDADAS) || 30

// O pedido fica na memória: é só um "lembrete" para a próxima pergunta da câmera
let pedidoFoto = false

function pedirFoto() {
  pedidoFoto = true
}

// A câmera pega o pedido, e ele é apagado para não tirar foto duas vezes
function pegarPedido() {
  const tinha = pedidoFoto
  pedidoFoto = false
  return tinha
}

// Confere se os bytes são de um JPEG (todo JPEG começa com FF D8)
function ehJpeg(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 100 && buffer[0] === 0xff && buffer[1] === 0xd8
}

// Guarda a foto e apaga as mais antigas (fica só com as últimas FOTOS_GUARDADAS)
async function salvarFoto(usuarioId, imagem) {
  const { rows } = await query(
    'INSERT INTO fotos (usuario_id, imagem, tamanho) VALUES ($1, $2, $3) RETURNING id, tamanho, criado_em',
    [usuarioId, imagem, imagem.length],
  )
  await query(
    `DELETE FROM fotos WHERE usuario_id = $1 AND id NOT IN (
       SELECT id FROM fotos WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2)`,
    [usuarioId, FOTOS_GUARDADAS],
  )
  return rows[0]
}

// Só os dados da última foto (sem a imagem)
async function ultimaFotoInfo(usuarioId) {
  const { rows } = await query(
    'SELECT id, tamanho, criado_em FROM fotos WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1',
    [usuarioId],
  )
  return rows[0] || null
}

// Espera chegar uma foto mais nova que "depoisDe" (usado pela voz)
async function esperarFotoNova(usuarioId, depoisDe, segundos = 15) {
  const limite = Date.now() + segundos * 1000
  while (Date.now() < limite) {
    const foto = await ultimaFotoInfo(usuarioId)
    if (foto && new Date(foto.criado_em) > depoisDe) return foto
    await new Promise((r) => setTimeout(r, 1000))
  }
  return null
}

module.exports = { pedirFoto, pegarPedido, ehJpeg, salvarFoto, ultimaFotoInfo, esperarFotoNova }
