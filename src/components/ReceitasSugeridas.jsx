import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionTitle, Sparkle } from './Bits.jsx'
import { lerSessao } from '../api.js'
import { buscarSugestoes, quandoVence } from '../receitas.js'
import '../styles/receitas.css'

// Seção "Receitas sugeridas" do Relatório (o alerta do site leva para cá: /relatorio#receitas).
// A primeira receita é a que aproveita o alimento que vence antes.
export default function ReceitasSugeridas() {
  const [lista, setLista] = useState(null)
  const logado = Boolean(lerSessao())

  useEffect(() => {
    let ativo = true
    buscarSugestoes().then((l) => ativo && setLista(l))
    return () => {
      ativo = false
    }
  }, [])

  // Veio pelo alerta (/relatorio#receitas): nos primeiros segundos a tabela de cima troca os
  // exemplos pelos alimentos do banco e muda de altura; a seção acompanha para não sair da tela.
  // Para assim que a pessoa mexer na tela (ou depois de 3 s).
  useEffect(() => {
    if (window.location.hash !== '#receitas') return undefined
    const alvo = document.getElementById('receitas')
    const eventos = ['wheel', 'touchstart', 'keydown', 'mousedown']
    const parar = () => {
      clearInterval(timer)
      eventos.forEach((e) => window.removeEventListener(e, parar))
    }
    const timer = setInterval(() => {
      if (alvo && Math.abs(alvo.getBoundingClientRect().top) > 2) alvo.scrollIntoView()
    }, 100)
    const fim = setTimeout(parar, 3000)
    eventos.forEach((e) => window.addEventListener(e, parar, { passive: true }))
    return () => {
      clearTimeout(fim)
      parar()
    }
  }, [])

  return (
    <section className="container receitas-section" id="receitas" aria-labelledby="receitas-title">
      <SectionTitle id="receitas-title">RECEITAS SUGERIDAS</SectionTitle>
      <p className="receitas-intro">
        Receitas que aproveitam os alimentos da sua geladeira, começando pelo que vence primeiro.
      </p>

      {!logado && (
        <p className="report-aviso">
          <Link to="/login">Entre na sua conta</Link> para ver receitas com os seus alimentos.
        </p>
      )}
      {logado && lista === null && <p className="receitas-intro">Carregando receitas...</p>}

      {lista && lista.length > 0 && (
        <ul className="receitas-grid">
          {lista.map((r, i) => (
            <li key={r.id} className={`receita-card${i === 0 && r.destaque ? ' is-destaque' : ''}`}>
              {i === 0 && r.destaque && <span className="receita-selo">Sugestão do dia</span>}
              <h3>{r.nome}</h3>
              <p className="receita-info">
                ⏱ {r.tempo_minutos} min · 🍽 {r.porcoes}
              </p>
              {r.destaque ? (
                <p className="receita-aproveita">
                  Aproveite: <strong>{r.destaque.nome}</strong> ({quandoVence(r.destaque.dias_restantes)})
                </p>
              ) : (
                <p className="receita-aproveita is-vazio">Nenhum ingrediente desta receita está na geladeira.</p>
              )}

              <h4>Ingredientes</h4>
              <ul className="receita-ingredientes">
                {r.ingredientes.map((ing) => (
                  <li key={ing.nome} className={ing.basico ? 'is-basico' : ing.tem ? 'is-tem' : 'is-falta'}>
                    <span className="receita-marca" aria-hidden="true">
                      {ing.basico ? '•' : ing.tem ? '✓' : '+'}
                    </span>
                    {/* item de despensa: "Açúcar ou mel a gosto"; os outros já trazem o nome ("400 ml de leite") */}
                    {ing.basico ? `${ing.nome} ${ing.quantidade}` : ing.quantidade}
                    <span className="visually-hidden">
                      {ing.basico ? ' (de despensa)' : ing.tem ? ' (tem na geladeira)' : ' (falta comprar)'}
                    </span>
                  </li>
                ))}
              </ul>
              {r.faltam > 0 && (
                <p className="receita-falta">
                  Falta{r.faltam > 1 ? 'm' : ''} {r.faltam} ingrediente{r.faltam > 1 ? 's' : ''}.
                </p>
              )}

              <details className="receita-preparo" open={i === 0}>
                <summary>Modo de preparo</summary>
                <ol>
                  {r.passos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              </details>
              {i === 0 && r.destaque && <Sparkle />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
