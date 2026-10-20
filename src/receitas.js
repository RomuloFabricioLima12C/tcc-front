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

// "vence hoje" / "vence amanhã" / "vence em 3 dias"
export function quandoVence(dias) {
  if (dias === 0) return 'vence hoje'
  if (dias === 1) return 'vence amanhã'
  return `vence em ${dias} dias`
}

// O alerta aparece quando a receita da vez usa algo que vence em até 3 dias
export const DIAS_ALERTA = 3
