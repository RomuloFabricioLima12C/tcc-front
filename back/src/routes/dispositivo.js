// =====================================================================
// Rotas usadas pelo DISPOSITIVO (ESP32 com a tela touch).
// Autenticação: cabeçalho "x-device-key" (veja middleware/deviceAuth.js).
//
// O ESP32 tem pouca memória RAM, então as respostas são ENXUTAS:
// só id, nome, data_validade e dias_restantes — nada de categoria,
// datas de criação etc.
// =====================================================================
const express = require('express')
const { query } = require('../db')
const deviceAuth = require('../middleware/deviceAuth')
const { validarAlimento } = require('../validacao')

const router = express.Router()
router.use(deviceAuth)

const COLUNAS_ENXUTAS = 'id, nome, data_validade, (data_validade - CURRENT_DATE) AS dias_restantes'

// ---------------------------------------------------------------------
// POST /api/dispositivo/alimentos  (cadastro pela tela touch)
// Corpo: { "nome": "Iogurte", "data_validade": "2026-10-05" }
//    ou: { "nome": "Iogurte", "dias_para_vencer": 3 }   <- o que a tela touch usa
//   (opcionais: "categoria", "quantidade")
// Resposta: { "id": 7, "nome": "Iogurte", "data_validade": "2026-10-05", "dias_restantes": 3 }
// ---------------------------------------------------------------------
router.post('/alimentos', async (req, res, next) => {
  try {
    // A tela touch pode mandar "dias_para_vencer" (ex.: 5) em vez da data:
    // assim o ESP32 nem precisa saber a data de hoje — quem calcula é o banco.
    const dias = req.body?.dias_para_vencer
    if (dias !== undefined && req.body.data_validade === undefined) {
      const n = Number(dias)
      if (!Number.isInteger(n) || n < 0 || n > 3650) {
        return res.status(400).json({ erro: 'dias_para_vencer precisa ser um número inteiro de 0 a 3650.' })
      }
      const hoje = await query('SELECT (CURRENT_DATE + $1::int)::text AS data', [n])
      req.body.data_validade = hoje.rows[0].data
    }

    const erro = validarAlimento(req.body)
    if (erro) return res.status(400).json({ erro })

    const { nome, categoria, quantidade, data_validade: dataValidade } = req.body
    const resultado = await query(
      `INSERT INTO alimentos (usuario_id, nome, categoria, quantidade, data_validade, origem)
       VALUES ($1, $2, $3, $4, $5, 'touch')
       RETURNING ${COLUNAS_ENXUTAS}`,
      [
        req.usuario.id,
        nome.trim(),
        categoria ? String(categoria).trim() : null,
        quantidade ? Number(quantidade) : 1,
        dataValidade,
      ],
    )
    return res.status(201).json(resultado.rows[0])
  } catch (erro) {
    // Código 23503 = o DEVICE_USER_ID do .env não existe na tabela usuarios
    if (erro.code === '23503') {
      return res.status(500).json({ erro: 'DEVICE_USER_ID não corresponde a um usuário cadastrado.' })
    }
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// GET /api/dispositivo/validades?limite=10
// Lista curta para a tela "VER VALIDADES": os que vencem antes aparecem primeiro.
// Os já vencidos também aparecem (dias_restantes negativo) para o usuário tirar da geladeira.
// ---------------------------------------------------------------------
router.get('/validades', async (req, res, next) => {
  try {
    const limite = req.query.limite === undefined ? 10 : Number(req.query.limite)
    if (!Number.isInteger(limite) || limite < 1 || limite > 30) {
      return res.status(400).json({ erro: 'O "limite" precisa ser um número de 1 a 30.' })
    }
    const resultado = await query(
      `SELECT ${COLUNAS_ENXUTAS} FROM alimentos
        WHERE usuario_id = $1
        ORDER BY data_validade, nome
        LIMIT $2`,
      [req.usuario.id, limite],
    )
    return res.json(resultado.rows)
  } catch (erro) {
    return next(erro)
  }
})

module.exports = router
