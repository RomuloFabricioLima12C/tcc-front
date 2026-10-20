import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SiteLayout } from '../components/Layout.jsx'
import { SectionTitle, Sparkle, Stripes } from '../components/Bits.jsx'
import CameraVideo from '../components/CameraVideo.jsx'
import GraficoValidade from '../components/GraficoValidade.jsx'
import ReceitasSugeridas from '../components/ReceitasSugeridas.jsx'
import { green, white } from './Jogo.jsx'
import { svg } from '../assets.js'
import { lerSessao, listarAlimentos, marcarConsumido, voltarParaGeladeira } from '../api.js'
import { esquecerSugestoes } from '../receitas.js'
import '../styles/jogo.css'
import '../styles/relatorio.css'

// ---------------------------------------------------------------------
// Dados de EXEMPLO. Aparecem enquanto o site não está ligado ao banco
// (sem login ou com o servidor desligado). A validade é contada a partir
// de HOJE ("dias"), então os exemplos sempre mostram todas as situações:
// vencido, vencendo, atenção e no prazo. Ficam na ordem em que seriam cadastrados.
// ---------------------------------------------------------------------
const EXEMPLOS = [
  { nome: 'Leite integral', tipo: 'Laticínio', dias: 3 },
  { nome: 'Presunto fatiado', tipo: 'Embutido', dias: 1 },
  { nome: 'Alface', tipo: 'Verdura', dias: 4 },
  { nome: 'Iogurte natural', tipo: 'Laticínio', dias: -2 },
  { nome: 'Peito de frango', tipo: 'Carne', dias: 2 },
  { nome: 'Queijo muçarela', tipo: 'Laticínio', dias: 6 },
  { nome: 'Morango', tipo: 'Fruta', dias: 3 },
  { nome: 'Peito de peru', tipo: 'Embutido', dias: 5 },
  { nome: 'Pão de forma', tipo: 'Padaria', dias: 5 },
  { nome: 'Cenoura', tipo: 'Legume', dias: 12 },
  { nome: 'Suco de laranja', tipo: 'Bebida', dias: 7 },
  { nome: 'Salame', tipo: 'Embutido', dias: 30 },
  { nome: 'Manteiga', tipo: 'Laticínio', dias: 45 },
  { nome: 'Molho de tomate', tipo: 'Industrializado', dias: 180 },
  { nome: 'Feijão', tipo: 'Grão', dias: 240 },
]

// Data de hoje + N dias, no formato "AAAA-MM-DD" (horário local)
function isoDaqui(dias) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function exemplos() {
  return EXEMPLOS.map((e, i) => {
    const iso = isoDaqui(e.dias)
    return { ...e, id: `exemplo-${i}`, iso, validade: iso.split('-').reverse().join('/'), restante: textoRestante(e.dias) }
  })
}

// "Tempo restante" a partir dos dias que faltam
function textoRestante(dias) {
  if (dias < 0) return dias === -1 ? 'Venceu ontem' : `Venceu há ${-dias} dias`
  if (dias === 0) return 'Vence hoje'
  if (dias === 1) return '1 dia'
  if (dias < 14) return `${dias} dias`
  if (dias < 60) return `${Math.round(dias / 7)} semanas`
  const meses = Math.round(dias / 30)
  return meses === 1 ? '1 mês' : `${meses} meses`
}

// Converte um alimento da API (GET /api/alimentos) para o formato da tabela e do gráfico
function doBanco(a) {
  const iso = String(a.data_validade).slice(0, 10)
  const dias = Number(a.dias_restantes)
  return {
    id: a.id,
    nome: a.nome,
    tipo: a.categoria || 'Outro',
    iso,
    validade: iso.split('-').reverse().join('/'),
    dias,
    restante: textoRestante(dias),
  }
}

// De quanto em quanto tempo o relatório busca de novo no banco
// (assim aparece o que a tela touch, a voz ou a câmera cadastrarem)
const ATUALIZAR_MS = 30000

// Busca os alimentos no banco. Sem login ou sem servidor, fica com os exemplos.
// `recarregar` busca de novo na hora (ex.: depois de retirar um alimento).
function useAlimentos() {
  const [estado, setEstado] = useState(() => ({ itens: exemplos(), exemplo: true }))
  const ativo = useRef(true)

  const recarregar = useCallback(
    () =>
      listarAlimentos()
        .then((lista) => ativo.current && setEstado({ itens: lista.map(doBanco), exemplo: false }))
        .catch(() => {
          // servidor desligado ou login expirado: mantém o que já está na tela
        }),
    [],
  )

  useEffect(() => {
    ativo.current = true
    if (!lerSessao()) return undefined
    recarregar()
    const timer = setInterval(recarregar, ATUALIZAR_MS)
    return () => {
      ativo.current = false
      clearInterval(timer)
    }
  }, [recarregar])

  return { ...estado, recarregar }
}

export default function Relatorio() {
  const { itens, exemplo, recarregar } = useAlimentos()
  const [showFilters, setShowFilters] = useState(false)
  const [draft, setDraft] = useState({ tipo: 'Todos', ordem: 'padrao' })
  const [applied, setApplied] = useState(draft)
  const [selecionado, setSelecionado] = useState(null)
  const [retirando, setRetirando] = useState(null) // id do alimento sendo retirado
  const [retirado, setRetirado] = useState(null) // último retirado: { id, nome } (para "Desfazer")
  const [erroRetirar, setErroRetirar] = useState('')
  const [versao, setVersao] = useState(0) // muda quando a geladeira muda: as receitas atualizam

  // Depois de mudar a geladeira: busca a tabela de novo e atualiza as receitas
  const geladeiraMudou = async () => {
    esquecerSugestoes()
    await recarregar()
    setVersao((v) => v + 1)
  }

  // "Retirar": marca como consumido (sai da geladeira, mas não é apagado)
  const retirar = async (r) => {
    setErroRetirar('')
    setRetirando(r.id)
    try {
      await marcarConsumido(r.id)
      setRetirado({ id: r.id, nome: r.nome })
      if (selecionado === r.id) setSelecionado(null)
      await geladeiraMudou()
    } catch (falha) {
      setErroRetirar(falha.message)
    } finally {
      setRetirando(null)
    }
  }

  const desfazer = async () => {
    if (!retirado) return
    setErroRetirar('')
    try {
      await voltarParaGeladeira(retirado.id)
      setRetirado(null)
      await geladeiraMudou()
    } catch (falha) {
      setErroRetirar(falha.message)
    }
  }

  // O aviso de "retirado" some sozinho depois de 8 s
  useEffect(() => {
    if (!retirado) return undefined
    const timer = setTimeout(() => setRetirado(null), 8000)
    return () => clearTimeout(timer)
  }, [retirado])

  const tipos = useMemo(() => ['Todos', ...new Set(itens.map((i) => i.tipo))], [itens])

  // Um tipo que sumiu (ex.: era dos exemplos e chegaram os dados do banco) volta para "Todos"
  const tipoAtivo = tipos.includes(applied.tipo) ? applied.tipo : 'Todos'
  let rows = tipoAtivo === 'Todos' ? itens : itens.filter((i) => i.tipo === tipoAtivo)
  if (applied.ordem === 'validade') rows = [...rows].sort((a, b) => a.iso.localeCompare(b.iso))
  // A API manda em ordem de validade; o id cresce a cada cadastro, então ordena por ele.
  // (os exemplos já estão na ordem de cadastro)
  else if (!exemplo) rows = [...rows].sort((a, b) => a.id - b.id)

  return (
    <SiteLayout title="Relatório">
      <section className="container report-section">
        <SectionTitle as="h1" login>
          RELATÓRIO
        </SectionTitle>

        <div className="report-toolbar">
          <button
            type="button"
            className="report-btn"
            aria-expanded={showFilters}
            aria-controls="report-filters"
            onClick={() => setShowFilters((v) => !v)}
          >
            FILTROS
          </button>
          <button type="button" className="report-btn report-apply" onClick={() => setApplied(draft)}>
            APLICAR
          </button>
        </div>

        {showFilters && (
          <div className="report-filters" id="report-filters">
            <label>
              Tipo
              <select value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value })}>
                {tipos.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Ordenar
              <select value={draft.ordem} onChange={(e) => setDraft({ ...draft, ordem: e.target.value })}>
                <option value="padrao">Ordem de cadastro</option>
                <option value="validade">Validade mais próxima</option>
              </select>
            </label>
          </div>
        )}

        {exemplo && (
          <p className="report-aviso">Dados de exemplo — entre na sua conta para ver os alimentos do banco.</p>
        )}

        {retirado && (
          <p className="report-retirado" role="status">
            <span>
              <strong>{retirado.nome}</strong> saiu da geladeira (marcado como consumido).
            </span>
            <button type="button" className="report-desfazer" onClick={desfazer}>
              Desfazer
            </button>
          </p>
        )}
        {erroRetirar && (
          <p className="report-erro" role="alert">
            {erroRetirar}
          </p>
        )}

        <div className="report-table-wrap">
          <table className={`report-table${exemplo ? '' : ' com-retirar'}`}>
            <thead>
              <tr>
                <th scope="col">Validade</th>
                <th scope="col">Tempo restante</th>
                <th scope="col">Tipo</th>
                <th scope="col">Nome</th>
                {/* Só com os alimentos do banco (com login): os exemplos não são de verdade */}
                {!exemplo && (
                  <th scope="col" className="report-col-retirar">
                    Retirar
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={r.id === selecionado ? 'is-selecionado' : undefined}
                  onClick={() => setSelecionado(r.id === selecionado ? null : r.id)}
                >
                  {/* data-label: no celular a tabela vira cartões e o nome da coluna aparece em cada valor */}
                  <td data-label="Validade">{r.validade}</td>
                  <td data-label="Tempo restante">{r.restante}</td>
                  <td data-label="Tipo">{r.tipo}</td>
                  <td data-label="Nome">{r.nome}</td>
                  {!exemplo && (
                    <td className="report-col-retirar">
                      <button
                        type="button"
                        className="report-retirar"
                        disabled={retirando === r.id}
                        // não seleciona a linha no gráfico ao clicar no botão
                        onClick={(e) => {
                          e.stopPropagation()
                          retirar(r)
                        }}
                        aria-label={`Retirar ${r.nome} da geladeira (consumido)`}
                      >
                        {retirando === r.id ? '...' : '✓ Consumido'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={exemplo ? 4 : 5} className="report-vazio">
                    Nenhum alimento com esse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* O alerta de receita do site leva para cá (/relatorio#receitas) */}
      <ReceitasSugeridas versao={versao} />

      <section className="container cam-video-section" aria-labelledby="camera-title">
        <SectionTitle id="camera-title">CÂMERA AO VIVO</SectionTitle>
        <CameraVideo />

        <div className="report-monitor">
          <article className="card card-soft feature-card is-short">
            <Stripes a={green} b={white} width={161} offset={-42} />
            <h2>MONITORE SEUS ALIMENTOS</h2>
            <p>
              Acompanhar as datas de vencimento dos produtos ajuda a evitar perdas, economizar dinheiro e
              garantir maior segurança alimentar. Com uma organização simples e periódica, é possível
              consumir os alimentos no momento certo, aproveitando melhor cada item e contribuindo para um
              consumo mais consciente e sustentável.
            </p>
            <Sparkle />
          </article>
        </div>
      </section>

      <section className="container chart-section" aria-labelledby="grafico-title">
        <SectionTitle id="grafico-title">GRÁFICO</SectionTitle>
        <div className="chart-wrap">
          <img src={svg.chartLineTop} alt="" className="deco chart-line-top" />
          <img src={svg.chartLineLeft} alt="" className="deco chart-line-left" />
          <img src={svg.chartLineRight} alt="" className="deco chart-line-right" />
          <img src={svg.chartLineBottom} alt="" className="deco chart-line-bottom" />
          <img src={svg.chartStar} alt="" className="deco chart-star" />
          <img src={svg.chartTriangle} alt="" className="deco chart-triangle" />
          <img src={svg.chartBurst} alt="" className="deco chart-burst" />
          <img src={svg.chartDotA} alt="" className="deco chart-dot-a" />
          <img src={svg.chartDotB} alt="" className="deco chart-dot-b" />
          <img src={svg.chartDotC} alt="" className="deco chart-dot-c" />
          <GraficoValidade
            itens={rows}
            selecionado={selecionado}
            onSelecionar={setSelecionado}
          />
        </div>
      </section>
    </SiteLayout>
  )
}
