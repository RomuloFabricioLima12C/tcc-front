import { useState } from 'react'
import { SiteLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import { SectionTitle } from '../components/Bits.jsx'
import { img, svg } from '../assets.js'
import '../styles/relatorio.css'

// Dados de exemplo do Figma — no sistema real virão da câmera/ESP32.
const items = [
  { validade: '31/08/2026', restante: '1 semana', tipo: 'Laticínio', nome: 'Queijo' },
  { validade: '04/09/2026', restante: '4 Meses', tipo: 'Laticínio', nome: 'Queijo azul' },
  { validade: '01/09/2026', restante: '2 semanas', tipo: 'Industrializado', nome: 'Manteiga' },
  { validade: '07/09/2026', restante: '4 semanas', tipo: 'Embutido', nome: 'Peito de peru' },
  { validade: '10/09/2026', restante: '5 semanas', tipo: 'Embutido', nome: 'Presunto' },
]

const tipos = ['Todos', ...new Set(items.map((i) => i.tipo))]

const toDate = (s) => {
  const [d, m, y] = s.split('/').map(Number)
  return new Date(y, m - 1, d)
}

export default function Relatorio() {
  const [showFilters, setShowFilters] = useState(false)
  const [draft, setDraft] = useState({ tipo: 'Todos', ordem: 'padrao' })
  const [applied, setApplied] = useState(draft)

  let rows = applied.tipo === 'Todos' ? items : items.filter((i) => i.tipo === applied.tipo)
  if (applied.ordem === 'validade') rows = [...rows].sort((a, b) => toDate(a.validade) - toDate(b.validade))

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

        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th scope="col">Validade</th>
                <th scope="col">Tempo restante</th>
                <th scope="col">Tipo</th>
                <th scope="col">Nome</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.nome}>
                  <td>{r.validade}</td>
                  <td>{r.restante}</td>
                  <td>{r.tipo}</td>
                  <td>{r.nome}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4}>Nenhum alimento com esse filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
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
          <Crop
            s={img.chart}
            className="chart-img"
            alt="Linha do tempo de validade: Queijo 31/08, Queijo 04/09, Manteiga 01/09, Peito de peru 07/09 e Presunto 10/09 de 2026"
          />
        </div>
      </section>
    </SiteLayout>
  )
}
