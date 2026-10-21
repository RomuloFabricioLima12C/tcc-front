// =====================================================================
// Receitas sugeridas: cruza os ingredientes de cada receita (tabela "receitas")
// com os alimentos da geladeira e coloca na frente as que aproveitam o que
// vence primeiro. Alimento já vencido não entra (não dá para cozinhar com ele).
// =====================================================================
const { query } = require('../db')
const alimentos = require('./alimentos')

// "Peito de frango" combina com a chave "frango" (palavra inteira, sem acento).
// O plural também vale: "Ovos" combina com "ovo", "Maçãs" com "maca".
function combina(nomeAlimento, chaves) {
  const palavras = alimentos.normalizar(nomeAlimento).split(/[^a-z0-9]+/).filter(Boolean)
  const procuradas = new Set(chaves.map((c) => alimentos.normalizar(c)))
  return palavras.some((p) => procuradas.has(p) || procuradas.has(p.replace(/s$/, '')))
}

// Grava no banco as receitas de receitasPadrao.js que ainda não existem (pelo nome).
// Roda quando a API liga. Devolve quantas foram cadastradas agora.
async function cadastrarPadrao() {
  let novas = 0
  for (const r of require('./receitasPadrao')) {
    const { rowCount } = await query(
      `INSERT INTO receitas (nome, tempo_minutos, porcoes, ingredientes, passos)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (nome) DO NOTHING`,
      [r.nome, r.tempo_minutos, r.porcoes, JSON.stringify(r.ingredientes), r.passos],
    )
    novas += rowCount
  }
  return novas
}

async function sugestoes(usuarioId) {
  const [{ rows: receitas }, naGeladeira] = await Promise.all([
    query('SELECT id, nome, tempo_minutos, porcoes, ingredientes, passos FROM receitas ORDER BY id'),
    alimentos.listar(usuarioId),
  ])
  // já vem em ordem de validade; tira os vencidos
  const disponiveis = naGeladeira.filter((a) => Number(a.dias_restantes) >= 0)

  const lista = receitas.map((r) => {
    const ingredientes = r.ingredientes.map((ing) => {
      if (ing.basico) return { nome: ing.nome, quantidade: ing.quantidade, basico: true, tem: true, alimento: null }
      const achado = disponiveis.find((a) => combina(a.nome, ing.chaves || [ing.nome]))
      return {
        nome: ing.nome,
        quantidade: ing.quantidade,
        basico: false,
        tem: Boolean(achado),
        alimento: achado ? { id: achado.id, nome: achado.nome, dias_restantes: Number(achado.dias_restantes) } : null,
      }
    })
    const usa = ingredientes
      .filter((i) => i.alimento)
      .map((i) => i.alimento)
      .sort((a, b) => a.dias_restantes - b.dias_restantes)
    const principais = ingredientes.filter((i) => !i.basico)
    return {
      id: r.id,
      nome: r.nome,
      tempo_minutos: r.tempo_minutos,
      porcoes: r.porcoes,
      ingredientes,
      passos: r.passos,
      usa,
      destaque: usa[0] || null, // o alimento que vence primeiro entre os da receita
      faltam: principais.filter((i) => !i.tem).length,
    }
  })

  // Primeiro as que usam algo da geladeira; entre elas, a que aproveita o que vence antes;
  // empate: a que dá para fazer agora (falta menos) e, depois, a que usa mais coisas da geladeira
  lista.sort((a, b) => {
    if (!a.destaque !== !b.destaque) return a.destaque ? -1 : 1
    if (a.destaque && b.destaque && a.destaque.dias_restantes !== b.destaque.dias_restantes) {
      return a.destaque.dias_restantes - b.destaque.dias_restantes
    }
    return a.faltam - b.faltam || b.usa.length - a.usa.length
  })
  return lista
}

module.exports = { sugestoes, combina, cadastrarPadrao }
