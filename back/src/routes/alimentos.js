// =====================================================================
// Rotas de alimentos. Usadas pelo SITE (token JWT) e também pela
// ESP32 principal da robótica (chave x-device-key).
// Cada usuário só enxerga e altera os PRÓPRIOS alimentos.
// As regras ficam em servicos/alimentos.js.
// =====================================================================
const express = require('express')
const { siteOuDispositivo } = require('../middleware/auth')
const alimentos = require('../servicos/alimentos')

const router = express.Router()
router.use(siteOuDispositivo)

// Transforma o texto do id da URL em número e confere se é válido
function lerId(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    res.status(400).json({ erro: 'Id inválido.' })
    return null
  }
  return id
}

// Erros de dado errado (status 400) viram resposta; os outros vão para o tratador geral
function tratar(erro, res, next) {
  if (erro.status === 400) return res.status(400).json({ erro: erro.message })
  return next(erro)
}

// ---------------------------------------------------------------------
// GET /api/alimentos  -> alimentos na geladeira, os que vencem antes primeiro
//   ?todos=1 inclui também os já consumidos
// ---------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    res.json(await alimentos.listar(req.usuario.id, { incluirConsumidos: req.query.todos === '1' }))
  } catch (erro) {
    tratar(erro, res, next)
  }
})

// ---------------------------------------------------------------------
// GET /api/alimentos/vencendo?dias=3
// Alimentos que vencem de hoje até daqui a N dias (padrão: 3).
//   &vencidos=1 inclui também os que já venceram
// (esta rota fica ANTES de "/:id", senão o Express acharia que "vencendo" é um id)
// ---------------------------------------------------------------------
router.get('/vencendo', async (req, res, next) => {
  try {
    const dias = req.query.dias === undefined ? 3 : Number(req.query.dias)
    if (!Number.isInteger(dias) || dias < 0 || dias > 365) {
      return res.status(400).json({ erro: 'O parâmetro "dias" precisa ser um número inteiro de 0 a 365.' })
    }
    return res.json(await alimentos.vencendo(req.usuario.id, dias, { incluirVencidos: req.query.vencidos === '1' }))
  } catch (erro) {
    return tratar(erro, res, next)
  }
})

// ---------------------------------------------------------------------
// POST /api/alimentos
// Site:  { "nome": "Leite", "categoria": "Laticínio", "quantidade": 2, "data_validade": "2026-10-20" }
// Placa: { "nome": "Leite", "quantidade": 1, "validade_dias": 7, "origem": "touch" }
// Sem data nem dias, usa a validade média do alimento.
// ---------------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const dados = { ...(req.body || {}) }
    // O site sempre grava "site"; a placa pode dizer a origem (padrão "touch")
    if (!req.dispositivo) dados.origem = 'site'
    const item = await alimentos.cadastrar(req.usuario.id, dados, {
      origemPadrao: req.dispositivo ? 'touch' : 'site',
    })
    res.status(201).json(item)
  } catch (erro) {
    if (erro.code === '23503') {
      return res.status(500).json({ erro: 'DEVICE_USER_ID não corresponde a um usuário cadastrado.' })
    }
    return tratar(erro, res, next)
  }
})

// ---------------------------------------------------------------------
// PUT /api/alimentos/:id
// Mande só o que quer mudar, ex.: { "quantidade": 1 } ou { "status": "consumido" }
// ---------------------------------------------------------------------
router.put('/:id', async (req, res, next) => {
  try {
    const id = lerId(req, res)
    if (id === null) return undefined
    const item = await alimentos.atualizar(req.usuario.id, id, req.body || {})
    if (!item) return res.status(404).json({ erro: 'Alimento não encontrado.' })
    return res.json(item)
  } catch (erro) {
    return tratar(erro, res, next)
  }
})

// ---------------------------------------------------------------------
// DELETE /api/alimentos/:id
// ---------------------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const id = lerId(req, res)
    if (id === null) return undefined
    const ok = await alimentos.remover(req.usuario.id, id)
    if (!ok) return res.status(404).json({ erro: 'Alimento não encontrado.' })
    return res.json({ mensagem: 'Alimento removido.' })
  } catch (erro) {
    return tratar(erro, res, next)
  }
})

module.exports = router
