import { SiteLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import { SectionTitle } from '../components/Bits.jsx'
import { img, svg } from '../assets.js'
import '../styles/referencias.css'

// Os links são os que estão no Figma (os artigos 3 e 4 apontam para o mesmo site).
const refs = [
  {
    title: '1. PERCEPÇÃO DO CONSUMIDOR EM RELAÇÃO À VALIDADE DE PRODUTOS ALIMENTÍCIOS',
    text: 'O artigo analisa como os consumidores observam e interpretam os prazos de validade nos alimentos industrializados. A pesquisa mostra que a maioria confia nas datas presentes nos rótulos, mas poucos sabem como elas são definidas pelas indústrias.',
    href: 'https://www.vozdocampo.pt',
    fruit: img.blueberry,
  },
  {
    title: '2. CADEIA DO FRIO PARA ALIMENTOS',
    text: 'O trabalho explica a importância da refrigeração e do congelamento na conservação de alimentos. Também destaca como o controle correto da temperatura durante armazenamento e transporte ajuda a evitar contaminações e desperdícios.',
    href: 'https://www.revistaseletronicas.fmu.br/index.php/ASA',
    fruit: img.carrot,
  },
  {
    title: '3. PRAZO DE VALIDADE DE ALIMENTOS INDUSTRIALIZADOS',
    text: 'O livro aborda os principais fatores que influenciam a vida útil dos alimentos industrializados, como embalagem, temperatura e armazenamento. Além disso, compara os prazos de validade de diferentes categorias de produtos.',
    href: 'https://www.eq.ufrj.br',
    fruit: img.salami,
  },
  {
    title: '4. PRAZO DE VALIDADE ALIMENTAR',
    text: 'O artigo explica os diferentes tipos de prazo de validade e os fatores que afetam a conservação dos alimentos. Também destaca a relação entre validade, qualidade e segurança alimentar.',
    href: 'https://www.eq.ufrj.br',
    fruit: img.tomato,
  },
]

export default function Referencias() {
  return (
    <SiteLayout title="Referências">
      <section className="container refs-section">
        <img src={svg.refsBurstLeft} alt="" className="deco refs-burst-left desktop-only" />
        <img src={svg.refsBurstRight} alt="" className="deco refs-burst-right desktop-only" />
        <SectionTitle as="h1" size="sm" login>
          REFERÊNCIAS
        </SectionTitle>
        <ol className="refs-list">
          {refs.map((r, i) => (
            <li key={r.title} className={`ref-item ref-item-${i + 1}`}>
              <article className="card card-soft ref-card">
                <h2>{r.title}</h2>
                <p>{r.text}</p>
                <div className="ref-actions">
                  <a href={r.href} target="_blank" rel="noreferrer" className="btn ref-btn">
                    ARTIGO {i + 1}
                  </a>
                </div>
              </article>
              <Crop s={r.fruit} className="ref-fruit" />
            </li>
          ))}
        </ol>
      </section>
    </SiteLayout>
  )
}
