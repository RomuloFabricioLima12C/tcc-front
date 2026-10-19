// =====================================================================
// Vídeo ao vivo da ESP32-CAM (veja servicos/video.js).
//
//   GET  /api/video/quadro?depois=12   site (token): próximo quadro JPEG
//   POST /api/video/quadro             ESP32-CAM (chave): manda um quadro
// =====================================================================
const express = require('express')
const auth = require('../middleware/auth')
const deviceAuth = require('../middleware/deviceAuth')
const camera = require('../servicos/camera')
const video = require('../servicos/video')

const router = express.Router()

// ---------------------------------------------------------------------
// GET /api/video/quadro?depois=12  (site)
// Responde com o primeiro quadro mais novo que o id "depois" (imagem JPEG,
// id no cabeçalho X-Quadro-Id). Se nenhum chegar em 5 s: 204 sem corpo, e o
// site pergunta de novo. Enquanto o site pergunta, a câmera continua mandando.
// ---------------------------------------------------------------------
router.get('/quadro', auth, async (req, res, next) => {
  try {
    // Toda conta é dona da geladeira, então qualquer conta com login vê a câmera
    const depois = Number(req.query.depois) || 0
    const quadro = await video.esperarQuadro(depois)
    if (!quadro) return res.status(204).end()

    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-store',
      'X-Quadro-Id': String(quadro.id),
      'X-Quadro-Data': quadro.em.toISOString(),
    })
    return res.send(quadro.imagem)
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// POST /api/video/quadro  (ESP32-CAM)
// Corpo: JPEG puro (Content-Type: image/jpeg).
// Resposta: { "continuar": true/false, "foto": true/false }
//   continuar = ainda tem alguém assistindo
//   foto      = alguém pediu uma foto (para guardar) enquanto o vídeo rodava
// ---------------------------------------------------------------------
router.post(
  '/quadro',
  deviceAuth,
  express.raw({ type: ['image/jpeg', 'application/octet-stream'], limit: '1mb' }),
  (req, res) => {
    if (!camera.ehJpeg(req.body)) {
      return res.status(400).json({ erro: 'Envie o quadro com Content-Type: image/jpeg.' })
    }
    video.receberQuadro(req.body)
    return res.json({ continuar: video.alguemAssistindo(), foto: camera.pegarPedido() })
  },
)

module.exports = router
