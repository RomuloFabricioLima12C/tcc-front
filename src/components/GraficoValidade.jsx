// =====================================================================
// Gráfico "Datas de vencimento" da página Relatório.
// Linha do tempo com um cartão por alimento, em ordem de validade.
// Recebe os itens já filtrados (os mesmos da tabela), então muda junto
// com os filtros e com os dados que chegam do banco.
// Clicar num cartão destaca o alimento (e a linha dele na tabela).
// =====================================================================
import IconeAlimento from './IconeAlimento.jsx'

// Situação de cada alimento conforme os dias que faltam.
// A cor nunca aparece sozinha: o cartão também mostra o texto da situação.
const SITUACOES = [
  { classe: 'vencido', texto: 'Vencido', teste: (d) => d < 0 },
  { classe: 'urgente', texto: 'Vence em até 3 dias', teste: (d) => d <= 3 },
  { classe: 'atencao', texto: 'Vence em até 7 dias', teste: (d) => d <= 7 },
  { classe: 'ok', texto: 'No prazo', teste: () => true },
]

const situacao = (dias) => SITUACOES.find((s) => s.teste(dias))

export default function GraficoValidade({ itens, selecionado, onSelecionar }) {
  const ordenados = [...itens].sort((a, b) => a.iso.localeCompare(b.iso) || a.nome.localeCompare(b.nome))
  // Onde fica o marcador "Hoje": antes do primeiro alimento que ainda não venceu
  const posHoje = ordenados.findIndex((i) => i.dias >= 0)
  const indiceHoje = posHoje === -1 ? ordenados.length : posHoje
  const contagem = SITUACOES.map((s) => ({ ...s, total: itens.filter((i) => situacao(i.dias) === s).length }))
  const atual = ordenados.find((i) => i.id === selecionado)

  return (
    <figure className="chart-card" aria-labelledby="chart-card-title">
      <figcaption id="chart-card-title" className="chart-card-title">
        Datas de Vencimento
      </figcaption>

      <ul className="chart-legend" aria-label="Legenda">
        {contagem.map((s) => (
          <li key={s.classe} className={`is-${s.classe}`}>
            <span className="chart-legend-dot" aria-hidden="true" />
            {s.texto} <strong>{s.total}</strong>
          </li>
        ))}
      </ul>

      {ordenados.length === 0 ? (
        <p className="chart-vazio">Nenhum alimento para mostrar.</p>
      ) : (
        <div className="chart-scroll">
          <ol className="chart-timeline">
            {ordenados.map((item, i) => {
              const s = situacao(item.dias)
              const ativo = item.id === selecionado
              return [
                i === indiceHoje && <MarcadorHoje key="hoje" />,
                <li key={item.id} className={`chart-item is-${s.classe}${ativo ? ' is-ativo' : ''}`}>
                  <button
                    type="button"
                    className="chart-food"
                    aria-pressed={ativo}
                    aria-label={`${item.nome}, ${item.tipo}, vence em ${item.validade}, ${item.restante}. ${s.texto}.`}
                    onClick={() => onSelecionar(ativo ? null : item.id)}
                  >
                    <span className="chart-food-nome">{item.nome}</span>
                    <span className="chart-food-icone">
                      <IconeAlimento item={item} />
                    </span>
                    <span className="chart-food-tipo">{item.tipo}</span>
                    <span className="chart-food-data">{item.validade}</span>
                    <span className="chart-food-tag">{item.restante}</span>
                  </button>
                  <span className="chart-dot" aria-hidden="true" />
                  <span className="chart-axis-label" aria-hidden="true">
                    {item.validade.slice(0, 5)}
                  </span>
                </li>,
              ]
            })}
            {indiceHoje === ordenados.length && <MarcadorHoje />}
          </ol>
        </div>
      )}

      <p className="chart-detalhe" aria-live="polite">
        {atual ? (
          <>
            <strong>{atual.nome}</strong> · {atual.tipo} · vence em {atual.validade} · {atual.restante} ·{' '}
            {situacao(atual.dias).texto}
          </>
        ) : (
          'Clique em um alimento para destacá-lo na tabela.'
        )}
      </p>
    </figure>
  )
}

// Marcador "Hoje" entre os que já venceram e os que ainda vão vencer
function MarcadorHoje() {
  return (
    <li className="chart-hoje">
      <span>Hoje</span>
    </li>
  )
}
