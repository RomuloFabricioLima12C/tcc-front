// =====================================================================
// Rotas de alimentos usadas pelo SITE. Todas precisam de login (token JWT),
// e cada usuário só enxerga e altera os PRÓPRIOS alimentos
// (por isso todo SQL tem "WHERE usuario_id = $...").
// =====================================================================
const express = require('express')
const { query } = require('../db')
const auth = require('../middleware/auth')
const { validarAlimento } = require('../validacao')

const router = express.Router()
router.use(auth) // aplica o login em todas as rotas abaixo

// Colunas devolvidas ao site. "dias_restantes" é calculado pelo próprio banco:
// data de validade menos a data de hoje (negativo = já venceu).
const COLUNAS = `
  id, nome, categoria, quantidade, data_validade, origem, criado_em,
  (data_validade - CURRENT_DATE) AS dias_restantes
`

// Transforma o texto do id da URL em número e confere se é válido
function lerId(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ erro: 'Id inválido.' })
    return null
  }
  return id
}

// ---------------------------------------------------------------------
// GET /api/alimentos  -> todos os alimentos do usuário, os que vencem antes primeiro
// ---------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const resultado = await query(
      `SELECT ${COLUNAS} FROM alimentos WHERE usuario_id = $1 ORDER BY data_validade, nome`,
      [req.usuario.id],
    )
    return res.json(resultado.rows)
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// GET /api/alimentos/vencendo?dias=3
// Alimentos que vencem de hoje até daqui a N dias (padrão: 3).
// IMPORTANTE: esta rota fica ANTES de "/:id", senão o Express acharia que
// "vencendo" é um id.
// ---------------------------------------------------------------------
router.get('/vencendo', async (req, res, next) => {
  try {
    const dias = req.query.dias === undefined ? 3 : Number(req.query.dias)
    if (!Number.isInteger(dias) || dias < 0 || dias > 365) {
      return res.status(400).json({ erro: 'O parâmetro "dias" precisa ser um número inteiro de 0 a 365.' })
    }
    const resultado = await query(
      `SELECT ${COLUNAS} FROM alimentos
        WHERE usuario_id = $1
          AND data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + $2::int
        ORDER BY data_validade, nome`,
      [req.usuario.id, dias],
    )
    return res.json(resultado.rows)
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// POST /api/alimentos
// Corpo: { "nome": "Leite", "categoria": "Laticínio", "quantidade": 2, "data_validade": "2026-10-20" }
// ---------------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const erro = validarAlimento(req.body)
    if (erro) return res.status(400).json({ erro })

    const { nome, categoria, quantidade, data_validade: dataValidade } = req.body
    const resultado = await query(
      `INSERT INTO alimentos (usuario_id, nome, categoria, quantidade, data_validade, origem)
       VALUES ($1, $2, $3, $4, $5, 'site')
       RETURNING ${COLUNAS}`,
      [
        req.usuario.id,
        nome.trim(),
        categoria ? categoria.trim() : null,
        quantidade ? Number(quantidade) : 1,
        dataValidade,
      ],
    )
    return res.status(201).json(resultado.rows[0])
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// PUT /api/alimentos/:id
// Pode mandar só os campos que quer mudar, ex.: { "quantidade": 1 }
// ---------------------------------------------------------------------
router.put('/:id', async (req, res, next) => {
  try {
    const id = lerId(req, res)
    if (id === null) return undefined

    const erro = validarAlimento(req.body, true)
    if (erro) return res.status(400).json({ erro })

    // Monta o "SET" só com os campos enviados. Os NOMES das colunas vêm desta
    // lista fixa (nunca do usuário) e os VALORES vão como parâmetros $n.
    const permitidos = ['nome', 'categoria', 'quantidade', 'data_validade']
    const sets = []
    const valores = []
    for (const campo of permitidos) {
      if (req.body[campo] === undefined) continue
      let valor = req.body[campo]
      if (campo === 'quantidade' && (valor === null || valor === '')) continue
      if (campo === 'nome') valor = valor.trim()
      if (campo === 'categoria') valor = valor ? String(valor).trim() : null
      if (campo === 'quantidade') valor = Number(valor)
      valores.push(valor)
      sets.push(`${campo} = $${valores.length}`)
    }
    if (sets.length === 0) {
      return res.status(400).json({ erro: 'Envie pelo menos um campo para alterar.' })
    }

    valores.push(id, req.usuario.id)
    const resultado = await query(
      `UPDATE alimentos SET ${sets.join(', ')}
        WHERE id = $${valores.length - 1} AND usuario_id = $${valores.length}
        RETURNING ${COLUNAS}`,
      valores,
    )
    if (resultado.rowCount === 0) return res.status(404).json({ erro: 'Alimento não encontrado.' })
    return res.json(resultado.rows[0])
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// DELETE /api/alimentos/:id
// ---------------------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const id = lerId(req, res)
    if (id === null) return undefined

    const resultado = await query('DELETE FROM alimentos WHERE id = $1 AND usuario_id = $2', [
      id,
      req.usuario.id,
    ])
    if (resultado.rowCount === 0) return res.status(404).json({ erro: 'Alimento não encontrado.' })
    return res.json({ mensagem: 'Alimento removido.' })
  } catch (erro) {
    return next(erro)
  }
})

module.exports = router
