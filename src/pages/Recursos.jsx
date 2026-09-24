import { Link } from 'react-router-dom'
import { SiteLayout } from '../components/Layout.jsx'
import { SectionTitle, Sparkle } from '../components/Bits.jsx'
import { svg } from '../assets.js'
import '../styles/recursos.css'

const recursos = [
  { to: '/', name: 'HOME', text: 'Veja as principais informações do nosso projeto' },
  { to: '/camera', name: 'CÂMERA', text: 'Monitore sua geladeira via ESP32 CAM' },
  { to: '/relatorio', name: 'RELATÓRIO', text: 'Monitore suas compras e veja as datas de validade' },
]

export default function Recursos() {
  return (
    <SiteLayout title="Recursos">
      <section className="container recursos">
        <SectionTitle as="h1" login>
          RECURSOS
        </SectionTitle>

        <div className="card card-soft rec-intro">
          <h2>NOSSOS RECURSOS</h2>
          <p>Fiquem inteirados nos recursos que nosso projeto disponibiliza</p>
          <Sparkle />
        </div>

        <ul className="rec-grid">
          {recursos.map((r, i) => (
            <li key={r.name}>
              <Link to={r.to} className="rec-card">
                <span className="rec-head">
                  <span className="rec-badge">
                    <img src={svg.cloverRecurso} alt="" />
                    <span>{i + 1}</span>
                  </span>
                  <span className="rec-name">{r.name}</span>
                </span>
                <img src={svg.lineSmall} alt="" className="rec-line" />
                <span className="rec-text">{r.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SiteLayout>
  )
}
