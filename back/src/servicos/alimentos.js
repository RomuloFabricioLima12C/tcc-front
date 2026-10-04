// =====================================================================
// Regras dos alimentos, num lugar só. Usado por:
//   - rotas do site e das placas (routes/alimentos.js e routes/dispositivo.js)
//   - assistente de voz Xiaozhi (voz.js)
// (baseado no backend da equipe de robótica, adaptado a este projeto)
// =====================================================================
const { query } = require('../db')
const { dataValida } = require('../validacao')

// Validade média (em dias) quando ninguém informa a data — usada pela voz
// ("adiciona leite") e pela tela touch. Fácil de editar.
const VALIDADE_MEDIA = {
  leite: 7, ovo: 21, ovos: 21, iogurte: 10, pao: 5, frango: 3, carne: 3,
  'carne moida': 2, peixe: 2, alface: 5, tomate: 7, banana: 6, maca: 21,
  laranja: 14, cenoura: 21, batata: 30, queijo: 15, presunto: 5, manteiga: 30,
  requeijao: 10, suco: 5, arroz: 4, feijao: 4, morango: 4, uva: 7, cebola: 30,
}
const VALIDADE_PADRAO = 7
const ORIGENS = ['site', 'touch', 'voz', 'camera']

// "Pão Francês" -> "pao frances" (para comparar nomes)
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function validadeMedia(nome) {
  const n = normalizar(nome)
  if (VALIDADE_MEDIA[n]) return VALIDADE_MEDIA[n]
  for (const [chave, dias] of Object.entries(VALIDADE_MEDIA)) {
    if (n.startsWith(`${chave} `) || n.endsWith(` ${chave}`)) return dias
  }
  return VALIDADE_PADRAO
}

// Erro causado por dado errado (as rotas devolvem 400 com esta mensagem)
function erroUsuario(mensagem) {
  const e = new Error(mensagem)
  e.status = 400
  return e
}

// Colunas devolvidas. "dias_restantes" é calculado pelo banco (negativo = venceu).
const COLUNAS = `id, nome, categoria, quantidade, data_validade, origem, status, criado_em,
                 (data_validade - CURRENT_DATE) AS dias_restantes`

// Lista os alimentos (por padrão só os que ainda estão na geladeira)
async function listar(usuarioId, { incluirConsumidos = false } = {}) {
  const { rows } = await query(
    `SELECT ${COLUNAS} FROM alimentos
      WHERE usuario_id = $1 ${incluirConsumidos ? '' : "AND status = 'ativo'"}
      ORDER BY data_validade, nome`,
    [usuarioId],
  )
  return rows
}

// Vencem nos próximos "dias" dias. incluirVencidos = true também traz os já vencidos.
async function vencendo(usuarioId, dias = 3, { incluirVencidos = false } = {}) {
  const { rows } = await query(
    `SELECT ${COLUNAS} FROM alimentos
      WHERE usuario_id = $1 AND status = 'ativo'
        AND data_validade <= CURRENT_DATE + $2::int
        ${incluirVencidos ? '' : 'AND data_validade >= CURRENT_DATE'}
      ORDER BY data_validade, nome`,
    [usuarioId, dias],
  )
  return rows
}

// Cadastra um alimento.
// A validade pode vir de 3 jeitos (nesta ordem de prioridade):
//   data_validade "AAAA-MM-DD"  >  validade_dias / dias_para_vencer  >  validade média do alimento
async function cadastrar(usuarioId, dados, { origemPadrao = 'site' } = {}) {
  const nome = String(dados.nome ?? '').trim()
  if (!nome) throw erroUsuario('Informe o nome do alimento.')
  if (nome.length > 100) throw erroUsuario('O nome pode ter no máximo 100 caracteres.')

  const quantidade = dados.quantidade == null || dados.quantidade === '' ? 1 : Number(dados.quantidade)
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    throw erroUsuario('A quantidade precisa ser um número inteiro maior que zero.')
  }

  const categoria = dados.categoria ? String(dados.categoria).trim().slice(0, 50) : null
  const origem = ORIGENS.includes(dados.origem) ? dados.origem : origemPadrao

  let dataSql
  let valorData
  let estimada = false
  if (dados.data_validade) {
    if (!dataValida(dados.data_validade)) throw erroUsuario('Informe a data de validade no formato AAAA-MM-DD.')
    dataSql = '$5::date'
    valorData = dados.data_validade
  } else {
    let dias = dados.validade_dias ?? dados.dias_para_vencer
    if (dias == null || dias === '') {
      dias = validadeMedia(nome)
      estimada = true
    }
    dias = Number(dias)
    if (!Number.isInteger(dias) || dias < 0 || dias > 3650) {
      throw erroUsuario('Os dias de validade precisam ser um número inteiro de 0 a 3650.')
    }
    dataSql = 'CURRENT_DATE + $5::int'
    valorData = dias
  }

  const { rows } = await query(
    `INSERT INTO alimentos (usuario_id, nome, categoria, quantidade, data_validade, origem)
     VALUES ($1, $2, $3, $4, ${dataSql}, $6)
     RETURNING ${COLUNAS}`,
    [usuarioId, nome, categoria, quantidade, valorData, origem],
  )
  return { ...rows[0], validade_estimada: estimada }
}

// Altera só os campos enviados: nome, categoria, quantidade, data_validade, status
async function atualizar(usuarioId, id, dados) {
  const sets = []
  const valores = []
  const add = (coluna, valor) => {
    valores.push(valor)
    sets.push(`${coluna} = $${valores.length}`)
  }

  if (dados.nome !== undefined) {
    const nome = String(dados.nome ?? '').trim()
    if (!nome) throw erroUsuario('Informe o nome do alimento.')
    if (nome.length > 100) throw erroUsuario('O nome pode ter no máximo 100 caracteres.')
    add('nome', nome)
  }
  if (dados.categoria !== undefined) add('categoria', dados.categoria ? String(dados.categoria).trim().slice(0, 50) : null)
  if (dados.quantidade !== undefined && dados.quantidade !== null && dados.quantidade !== '') {
    const q = Number(dados.quantidade)
    if (!Number.isInteger(q) || q < 1) throw erroUsuario('A quantidade precisa ser um número inteiro maior que zero.')
    add('quantidade', q)
  }
  if (dados.data_validade !== undefined) {
    if (!dataValida(dados.data_validade)) throw erroUsuario('Informe a data de validade no formato AAAA-MM-DD.')
    add('data_validade', dados.data_validade)
  }
  if (dados.status !== undefined) {
    if (!['ativo', 'consumido'].includes(dados.status)) throw erroUsuario('O status precisa ser "ativo" ou "consumido".')
    add('status', dados.status)
  }
  if (sets.length === 0) throw erroUsuario('Envie pelo menos um campo para alterar.')

  valores.push(id, usuarioId)
  const { rows } = await query(
    `UPDATE alimentos SET ${sets.join(', ')}
      WHERE id = $${valores.length - 1} AND usuario_id = $${valores.length}
      RETURNING ${COLUNAS}`,
    valores,
  )
  return rows[0] || null
}

async function remover(usuarioId, id) {
  const { rowCount } = await query('DELETE FROM alimentos WHERE id = $1 AND usuario_id = $2', [id, usuarioId])
  return rowCount > 0
}

// Marca como consumido o alimento com esse nome que vence primeiro (usado pela voz)
async function consumirPorNome(usuarioId, nome) {
  const ativos = await listar(usuarioId)
  const alvo = normalizar(nome)
  const achado =
    ativos.find((a) => normalizar(a.nome) === alvo) ||
    ativos.find((a) => normalizar(a.nome).includes(alvo) || alvo.includes(normalizar(a.nome)))
  if (!achado) return null
  return atualizar(usuarioId, achado.id, { status: 'consumido' })
}

module.exports = { listar, vencendo, cadastrar, atualizar, remover, consumirPorNome, validadeMedia, normalizar }
