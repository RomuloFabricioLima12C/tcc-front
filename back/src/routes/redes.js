// =====================================================================
// Redes Wi-Fi das placas (veja servicos/redes.js).
//
//   Site (token; só a conta dona da geladeira):
//     GET    /api/redes        lista (sem senhas) + situação das placas
//     POST   /api/redes        { "ssid": "Casa", "senha": "12345678" }
//     PUT    /api/redes/:id    { "ssid": "...", "senha": "..." } (mande só o que muda)
//     DELETE /api/redes/:id
//
//   Placas (x-device-key):
//     GET /api/redes/placa?placa=principal&rede=Casa&rssi=-60
//       -> lista em texto, com as senhas, para a placa guardar
// =====================================================================
const express = require('express')
const auth = require('../middleware/auth')
const deviceAuth = require('../middleware/deviceAuth')
const redes = require('../servicos/redes')

const router = express.Router()

// ---------------------------------------------------------------------
// GET /api/redes/placa  (ESP32) — fica ANTES das rotas do site, que pedem login
// ---------------------------------------------------------------------
router.get('/placa', deviceAuth, async (req, res, next) => {
  try {
    const { placa, rede, rssi } = req.query
    const { texto, versao } = await redes.textoParaPlaca(req.usuario.id)
    // a placa grava a lista que recebe, então passa a ter esta versão
    redes.registrarPlaca(String(placa || ''), { rede, rssi, versao })
    res.type('text/plain; charset=utf-8').send(texto)
  } catch (erro) {
    next(erro)
  }
})

// Daqui para baixo: site. Toda conta é dona da geladeira, então qualquer conta
// com login pode ver e trocar o Wi-Fi das placas.
router.use(auth)

function lerId(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    res.status(400).json({ erro: 'Id inválido.' })
    return null
  }
  return id
}

function tratar(erro, res, next) {
  if (erro.status === 400) return res.status(400).json({ erro: erro.message })
  return next(erro)
}

// GET /api/redes -> { redes: [...], versao, max, placas: [...] }
router.get('/', async (req, res, next) => {
  try {
    res.json({ ...(await redes.listar(req.usuario.id)), placas: redes.placas() })
  } catch (erro) {
    next(erro)
  }
})

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await redes.cadastrar(req.usuario.id, req.body || {}))
  } catch (erro) {
    tratar(erro, res, next)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = lerId(req, res)
    if (id === null) return undefined
    const rede = await redes.atualizar(req.usuario.id, id, req.body || {})
    if (!rede) return res.status(404).json({ erro: 'Rede não encontrada.' })
    return res.json(rede)
  } catch (erro) {
    return tratar(erro, res, next)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = lerId(req, res)
    if (id === null) return undefined
    const ok = await redes.remover(req.usuario.id, id)
    if (!ok) return res.status(404).json({ erro: 'Rede não encontrada.' })
    return res.json({ mensagem: 'Rede removida.' })
  } catch (erro) {
    return next(erro)
  }
})

module.exports = router
