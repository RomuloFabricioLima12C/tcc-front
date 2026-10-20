import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { buscarSugestoes, quandoVence, DIAS_ALERTA } from '../receitas.js'
import '../styles/receitas.css'

// Chave do alerta de hoje: fechou ou abriu a receita, só volta amanhã (ou com outra receita/alimento)
const CHAVE = 'labcam-alerta-receita'
const hoje = () => new Date().toLocaleDateString('pt-BR') // dia do Brasil, não do UTC
const idAlerta = (r) => `${hoje()}:${r.id}:${r.destaque.id}`

function jaViu(r) {
  try {
    return localStorage.getItem(CHAVE) === idAlerta(r)
  } catch {
    return false
  }
}
function marcarVisto(r) {
  try {
    localStorage.setItem(CHAVE, idAlerta(r))
  } catch {
    // sem localStorage: o alerta volta na próxima página
  }
}

// Alerta flutuante: "Seu leite vence amanhã! Que tal fazer ...?" -> leva para a receita no Relatório
export default function AlertaReceita() {
  const { pathname } = useLocation()
  const [receita, setReceita] = useState(null)

  useEffect(() => {
    let ativo = true
    buscarSugestoes().then((lista) => {
      const r = lista[0]
      if (ativo && r?.destaque && r.destaque.dias_restantes <= DIAS_ALERTA && !jaViu(r)) setReceita(r)
    })
    return () => {
      ativo = false
    }
  }, [])

  // No próprio Relatório a receita já está na tela
  if (!receita || pathname === '/relatorio') return null

  const fechar = () => {
    marcarVisto(receita)
    setReceita(null)
  }

  return (
    <aside className="alerta-receita" role="status" aria-label="Sugestão de receita">
      <span className="alerta-icone" aria-hidden="true">
        🍳
      </span>
      <div className="alerta-texto">
        <strong>
          {receita.destaque.nome} {quandoVence(receita.destaque.dias_restantes)}!
        </strong>
        <span>Que tal fazer {receita.nome.toLowerCase()}?</span>
        <Link to="/relatorio#receitas" className="alerta-ver" onClick={fechar}>
          VER RECEITA
        </Link>
      </div>
      <button type="button" className="alerta-fechar" onClick={fechar} aria-label="Fechar sugestão">
        ×
      </button>
    </aside>
  )
}
