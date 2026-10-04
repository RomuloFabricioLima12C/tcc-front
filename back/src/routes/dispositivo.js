// =====================================================================
// Rotas com respostas ENXUTAS para placas com pouca memória.
// Autenticação: cabeçalho "x-device-key" (veja middleware/deviceAuth.js).
// Respostas só com id, nome, data_validade e dias_restantes.
//
// Obs.: a ESP32 principal da robótica usa GET/POST /api/alimentos com a
// chave; estas rotas continuam disponíveis para quem quiser a versão curta.
// =====================================================================
const express = require('express')
const deviceAuth = require('../middleware/deviceAuth')
const alimentos = require('../servicos/alimentos')
const camera = require('../servicos/camera')

const router = express.Router()
router.use(deviceAuth)

const enxuto = ({ id, nome, data_validade: dataValidade, dias_restantes: diasRestantes }) => ({
  id,
  nome,
  data_validade: dataValidade,
  dias_restantes: diasRestantes,
})

// ---------------------------------------------------------------------
// POST /api/dispositivo/alimentos  (cadastro pela tela touch)
// Corpo: { "nome": "Iogurte", "data_validade": "2026-10-05" }
//    ou: { "nome": "Iogurte", "dias_para_vencer": 3 }   (a API calcula a data)
// Resposta: { "id": 7, "nome": "Iogurte", "data_validade": "2026-10-05", "dias_restantes": 3 }
// ---------------------------------------------------------------------
router.post('/alimentos', async (req, res, next) => {
  try {
    const item = await alimentos.cadastrar(req.usuario.id, req.body || {}, { origemPadrao: 'touch' })
    return res.status(201).json(enxuto(item))
  } catch (erro) {
    if (erro.status === 400) return res.status(400).json({ erro: erro.message })
    if (erro.code === '23503') {
      return res.status(500).json({ erro: 'DEVICE_USER_ID não corresponde a um usuário cadastrado.' })
    }
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// GET /api/dispositivo/validades?limite=10
// Lista curta: os que vencem antes primeiro (inclui os já vencidos).
// ---------------------------------------------------------------------
router.get('/validades', async (req, res, next) => {
  try {
    const limite = req.query.limite === undefined ? 10 : Number(req.query.limite)
    if (!Number.isInteger(limite) || limite < 1 || limite > 30) {
      return res.status(400).json({ erro: 'O "limite" precisa ser um número de 1 a 30.' })
    }
    const lista = await alimentos.listar(req.usuario.id)
    return res.json(lista.slice(0, limite).map(enxuto))
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// POST /api/dispositivo/foto  — mesmo que POST /api/fotos (veja routes/comando.js)
// ---------------------------------------------------------------------
router.post(
  '/foto',
  express.raw({ type: ['image/jpeg', 'application/octet-stream'], limit: '3mb' }),
  async (req, res, next) => {
    try {
      if (!camera.ehJpeg(req.body)) {
        return res.status(400).json({ erro: 'Envie uma imagem JPEG com Content-Type: image/jpeg.' })
      }
      const foto = await camera.salvarFoto(req.usuario.id, req.body)
      return res.status(201).json({ id: foto.id, tamanho: foto.tamanho })
    } catch (erro) {
      return next(erro)
    }
  },
)

module.exports = router
