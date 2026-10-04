// =====================================================================
// Rotas usadas pela robótica para a câmera:
//
//   POST /api/fotos          ESP32-CAM manda a foto (corpo = JPEG puro)
//   GET  /api/comando        ESP32-CAM pergunta a cada 3 s: tem pedido de foto?
//   POST /api/comando        ESP32 principal pede foto quando a porta abre: { "acao": "foto" }
//   POST /api/comando/foto   site pede foto (botão "Ver câmera")
//
// Este arquivo é montado em "/api", por isso os caminhos começam com /fotos e /comando.
// =====================================================================
const express = require('express')
const deviceAuth = require('../middleware/deviceAuth')
const { siteOuDispositivo } = require('../middleware/auth')
const camera = require('../servicos/camera')

const router = express.Router()

// ---------------------------------------------------------------------
// POST /api/fotos  (ESP32-CAM)
// Cabeçalhos: Content-Type: image/jpeg  e  x-device-key
// Resposta: { "ok": true, "id": 12, "tamanho": 45210, "criado_em": "..." }
// ---------------------------------------------------------------------
router.post(
  '/fotos',
  deviceAuth,
  express.raw({ type: ['image/jpeg', 'application/octet-stream'], limit: '3mb' }),
  async (req, res, next) => {
    try {
      if (!camera.ehJpeg(req.body)) {
        return res.status(400).json({ erro: 'Envie a foto com Content-Type: image/jpeg.' })
      }
      const foto = await camera.salvarFoto(req.usuario.id, req.body)
      return res.status(201).json({ ok: true, ...foto })
    } catch (erro) {
      if (erro.code === '23503') {
        return res.status(500).json({ erro: 'DEVICE_USER_ID não corresponde a um usuário cadastrado.' })
      }
      return next(erro)
    }
  },
)

// ---------------------------------------------------------------------
// GET /api/comando  (ESP32-CAM)  -> { "foto": true } ou { "foto": false }
// ---------------------------------------------------------------------
router.get('/comando', deviceAuth, (req, res) => {
  res.json({ foto: camera.pegarPedido() })
})

// ---------------------------------------------------------------------
// POST /api/comando  (ESP32 principal ou site)  corpo: { "acao": "foto" }
// ---------------------------------------------------------------------
router.post('/comando', siteOuDispositivo, (req, res) => {
  if ((req.body || {}).acao !== 'foto') {
    return res.status(400).json({ erro: 'Ação desconhecida. Use { "acao": "foto" }.' })
  }
  camera.pedirFoto()
  return res.json({ ok: true })
})

// ---------------------------------------------------------------------
// POST /api/comando/foto  (site)
// ---------------------------------------------------------------------
router.post('/comando/foto', siteOuDispositivo, (req, res) => {
  camera.pedirFoto()
  res.json({ ok: true, mensagem: 'Pedido enviado. A câmera tira a foto em até 3 segundos.' })
})

module.exports = router
