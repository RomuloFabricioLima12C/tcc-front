// =====================================================================
// Vídeo ao vivo da ESP32-CAM (página Relatório do site).
//
// Como funciona:
//   1. O site pede quadros em GET /api/video/quadro. Isso marca que alguém
//      está assistindo.
//   2. A ESP32-CAM pergunta em GET /api/comando a cada 3 s; a resposta traz
//      "video": true enquanto alguém assiste. Ela passa a mandar quadros
//      JPEG seguidos em POST /api/video/quadro.
//   3. Ninguém pediu quadro por ASSISTINDO_MS: a resposta da câmera diz
//      "continuar": false e ela volta a só tirar fotos.
//
// Os quadros ficam só na memória (o último). Não vão para o banco: as
// fotos guardadas continuam sendo as de POST /api/fotos.
// =====================================================================
const { EventEmitter } = require('events')

const ASSISTINDO_MS = 8000 // sem pedido do site por esse tempo = ninguém assistindo
const ESPERA_MAX_MS = 5000 // quanto o site espera por um quadro novo antes de perguntar de novo
const QUADRO_RECENTE_MS = 3000

const avisos = new EventEmitter()
avisos.setMaxListeners(0) // um ouvinte por aba aberta no Relatório

let ultimoQuadro = null // { id, imagem, em }
let proximoId = 1
let assistindoAte = 0

function marcarAssistindo() {
  assistindoAte = Date.now() + ASSISTINDO_MS
}

function alguemAssistindo() {
  return Date.now() < assistindoAte
}

// A câmera mandou um quadro: guarda e avisa quem está esperando
function receberQuadro(imagem) {
  ultimoQuadro = { id: proximoId++, imagem, em: new Date() }
  avisos.emit('quadro', ultimoQuadro)
}

// Devolve um quadro mais novo que "depoisDe". Se ainda não tem, espera até
// ESPERA_MAX_MS por um (assim o site recebe cada quadro assim que ele chega).
// Devolve null se nenhum chegou nesse tempo.
function esperarQuadro(depoisDe) {
  marcarAssistindo()
  // Quadro que sobrou de outra vez (mais velho que QUADRO_RECENTE_MS) não conta como "ao vivo"
  const recente = ultimoQuadro && Date.now() - ultimoQuadro.em < QUADRO_RECENTE_MS
  if (recente && ultimoQuadro.id > depoisDe) return Promise.resolve(ultimoQuadro)

  return new Promise((resolve) => {
    const terminar = (quadro) => {
      clearTimeout(timer)
      avisos.off('quadro', terminar)
      resolve(quadro)
    }
    const timer = setTimeout(() => terminar(null), ESPERA_MAX_MS)
    avisos.on('quadro', terminar)
  })
}

module.exports = { marcarAssistindo, alguemAssistindo, receberQuadro, esperarQuadro }
