// =====================================================================
// Fotos da ESP32-CAM e o "pedido de foto".
//
// Quem PEDE uma foto: o site (botão "Ver câmera")
// ou outra placa (POST /api/comando).
// Quem ATENDE: a ESP32-CAM, que pergunta a cada 3 s em GET /api/comando.
// (baseado no backend da equipe de robótica; aqui a foto fica no banco)
//
// "Alguém olhando a câmera": enquanto a seção da câmera do site está aberta,
// ele avisa a cada 3 s (GET /api/camera/ao-vivo). A ESP32-CAM recebe
// "fotos": true no GET /api/comando, liga o relé da fita de LED e tira uma
// foto a cada 10 s. Sem aviso por OLHANDO_MS, ela para e desliga o relé.
// =====================================================================
const { query } = require('../db')

const FOTOS_GUARDADAS = Number(process.env.FOTOS_GUARDADAS) || 30
const OLHANDO_MS = 8000 // sem aviso do site por esse tempo = ninguém olhando a câmera

let olhandoAte = 0

function marcarOlhando() {
  olhandoAte = Date.now() + OLHANDO_MS
}

function alguemOlhando() {
  return Date.now() < olhandoAte
}

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

module.exports = {
  pedirFoto,
  pegarPedido,
  ehJpeg,
  salvarFoto,
  ultimaFotoInfo,
  marcarOlhando,
  alguemOlhando,
}
