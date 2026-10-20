// =====================================================================
// Receitas para o SITE (precisa de login / token JWT).
//   GET /api/receitas/sugestoes -> receitas na ordem do que vence primeiro na geladeira
// =====================================================================
const express = require('express')
const auth = require('../middleware/auth')
const receitas = require('../servicos/receitas')

const router = express.Router()
router.use(auth)

router.get('/sugestoes', async (req, res, next) => {
  try {
    return res.json(await receitas.sugestoes(req.usuario.id))
  } catch (erro) {
    return next(erro)
  }
})

module.exports = router
