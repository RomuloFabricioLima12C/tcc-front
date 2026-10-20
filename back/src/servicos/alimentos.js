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

// Tipo do alimento quando ninguém escolhe (voz, tela touch ou o campo vazio no site).
// Mesmos nomes da lista de categorias do site (src/pages/Alimentos.jsx). Fácil de editar.
const CATEGORIAS = {
  'Laticínio': 'leite iogurte queijo requeijao manteiga nata coalhada mucarela mussarela ricota parmesao cottage',
  Embutido: 'presunto salame mortadela salsicha linguica peru bacon apresuntado calabresa',
  Carne: 'frango carne peixe bife file costela picanha patinho alcatra coxa sobrecoxa tilapia salmao sardinha camarao porco lombo hamburguer atum',
  Fruta: 'banana maca laranja morango uva abacaxi mamao manga melancia melao pera limao kiwi abacate goiaba maracuja tangerina mexerica ameixa pessego amora mirtilo framboesa coco caqui',
  Verdura: 'alface couve rucula espinafre agriao repolho acelga cheiro salsinha cebolinha coentro brocolis',
  Legume: 'tomate cenoura batata cebola alho abobrinha abobora berinjela pepino pimentao beterraba chuchu mandioca aipim inhame milho vagem quiabo ervilha',
  'Grão': 'arroz feijao lentilha grao aveia soja quinoa',
  Padaria: 'pao bolo torrada biscoito bolacha rosca croissant sonho',
  Bebida: 'suco refrigerante refri agua cha cafe cerveja vinho energetico achocolatado',
}
const CATEGORIA_DA_PALAVRA = {}
for (const [categoria, palavras] of Object.entries(CATEGORIAS)) {
  for (const p of palavras.split(' ')) CATEGORIA_DA_PALAVRA[p] = categoria
}

// "Leite integral" -> Laticínio, "Suco de laranja" -> Bebida (vale a 1ª palavra conhecida),
// "Ovos" -> null (sem tipo: o site mostra "Outro")
function categoriaPorNome(nome) {
  const palavras = normalizar(nome).split(/[^a-z0-9]+/).filter(Boolean)
  for (const p of palavras) {
    const achou = CATEGORIA_DA_PALAVRA[p] || CATEGORIA_DA_PALAVRA[p.replace(/s$/, '')]
    if (achou) return achou
  }
  return null
}

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

// Nome: texto de 1 a 100 caracteres (o tamanho da coluna no banco)
function lerNome(valor) {
  if (typeof valor !== 'string' || !valor.trim()) throw erroUsuario('Informe o nome do alimento.')
  const nome = valor.trim()
  if (nome.length > 100) throw erroUsuario('O nome pode ter no máximo 100 caracteres.')
  return nome
}

// Quantidade: inteiro de 1 a 9999 (sem limite, um número enorme estouraria a coluna do banco)
const QUANTIDADE_MAX = 9999
function lerQuantidade(valor) {
  const q = Number(valor)
  if (!Number.isInteger(q) || q < 1 || q > QUANTIDADE_MAX) {
    throw erroUsuario(`A quantidade precisa ser um número inteiro de 1 a ${QUANTIDADE_MAX}.`)
  }
  return q
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
  const nome = lerNome(dados.nome)

  const quantidade = dados.quantidade == null || dados.quantidade === '' ? 1 : lerQuantidade(dados.quantidade)

  // Sem tipo escolhido (voz, tela touch, campo vazio): descobre pelo nome
  const categoria = dados.categoria ? String(dados.categoria).trim().slice(0, 50) : categoriaPorNome(nome)
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

  if (dados.nome !== undefined) add('nome', lerNome(dados.nome))
  if (dados.categoria !== undefined) add('categoria', dados.categoria ? String(dados.categoria).trim().slice(0, 50) : null)
  if (dados.quantidade !== undefined && dados.quantidade !== null && dados.quantidade !== '') {
    add('quantidade', lerQuantidade(dados.quantidade))
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
  const alvo = normalizar(nome)
  // Nome vazio: sem esta checagem, "".includes() acharia o primeiro alimento da lista
  if (!alvo) return null
  const ativos = await listar(usuarioId)
  const achado =
    ativos.find((a) => normalizar(a.nome) === alvo) ||
    ativos.find((a) => normalizar(a.nome).includes(alvo) || alvo.includes(normalizar(a.nome)))
  if (!achado) return null
  return atualizar(usuarioId, achado.id, { status: 'consumido' })
}

// Alimentos que já estão no banco sem tipo (cadastrados antes por voz ou pela tela):
// preenche pelo nome. Roda quando a API liga. Devolve quantos foram arrumados.
async function preencherCategorias() {
  const { rows } = await query('SELECT id, nome FROM alimentos WHERE categoria IS NULL')
  let arrumados = 0
  for (const a of rows) {
    const categoria = categoriaPorNome(a.nome)
    if (!categoria) continue
    await query('UPDATE alimentos SET categoria = $1 WHERE id = $2 AND categoria IS NULL', [categoria, a.id])
    arrumados++
  }
  return arrumados
}

module.exports = {
  listar,
  vencendo,
  cadastrar,
  atualizar,
  remover,
  consumirPorNome,
  validadeMedia,
  normalizar,
  categoriaPorNome,
  preencherCategorias,
}
