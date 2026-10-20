// =====================================================================
// Receitas sugeridas: cruza os ingredientes de cada receita (tabela "receitas")
// com os alimentos da geladeira e coloca na frente as que aproveitam o que
// vence primeiro. Alimento já vencido não entra (não dá para cozinhar com ele).
// =====================================================================
const { query } = require('../db')
const alimentos = require('./alimentos')

// "Peito de frango" combina com a chave "frango" (palavra inteira, sem acento)
function combina(nomeAlimento, chaves) {
  const palavras = ` ${alimentos.normalizar(nomeAlimento).replace(/[^a-z0-9]+/g, ' ')} `
  return chaves.some((c) => palavras.includes(` ${alimentos.normalizar(c)} `))
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
  // empate: a que usa mais ingredientes que já tem
  lista.sort((a, b) => {
    if (!a.destaque !== !b.destaque) return a.destaque ? -1 : 1
    if (a.destaque && b.destaque && a.destaque.dias_restantes !== b.destaque.dias_restantes) {
      return a.destaque.dias_restantes - b.destaque.dias_restantes
    }
    return b.usa.length - a.usa.length || a.faltam - b.faltam
  })
  return lista
}

module.exports = { sugestoes, combina }
