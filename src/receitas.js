// Ajudas das receitas sugeridas, usadas pelo alerta (AlertaReceita) e pela página Relatório.
import { lerSessao, sugestoesReceitas } from './api.js'

// Uma busca só, reaproveitada por 1 minuto (o alerta e o Relatório pedem juntos)
let cache = null
export function buscarSugestoes() {
  if (!lerSessao()) return Promise.resolve([])
  if (!cache || Date.now() - cache.em > 60000) {
    cache = { em: Date.now(), promessa: sugestoesReceitas().catch(() => ((cache = null), [])) }
  }
  return cache.promessa
}

// A geladeira mudou (ex.: retirou um alimento): a próxima busca pega as receitas de novo
export function esquecerSugestoes() {
  cache = null
}

// "vence hoje" / "vence amanhã" / "vence em 3 dias"; com o nome no plural ("Ovos"), "vencem"
export function quandoVence(dias, nome = '') {
  const verbo = /s$/i.test(nome.trim()) ? 'vencem' : 'vence'
  if (dias === 0) return `${verbo} hoje`
  if (dias === 1) return `${verbo} amanhã`
  return `${verbo} em ${dias} dias`
}

// O alerta aparece quando a receita da vez usa algo que vence em até 3 dias
export const DIAS_ALERTA = 3
