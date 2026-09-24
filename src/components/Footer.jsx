import { Link } from 'react-router-dom'
import Crop from './Crop.jsx'
import { img, links } from '../assets.js'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Link to="/" aria-label="LightLab — página inicial">
          <Crop s={img.logoFooter} className="footer-logo" />
        </Link>
        <div className="footer-col">
          <h2>Início</h2>
          <Link to="/">Home</Link>
          <Link to="/componentes">Componentes</Link>
        </div>
        <div className="footer-col">
          <h2>Sobre Nós</h2>
          <Link to="/quem-somos">Quem somos?</Link>
          <Link to="/projeto">Nosso projeto</Link>
        </div>
        <div className="footer-col">
          <h2>Suporte</h2>
          <a href={links.contato} target="_blank" rel="noreferrer">
            Contatos
          </a>
          <a href={links.faq} target="_blank" rel="noreferrer">
            FAQ
          </a>
        </div>
      </div>
    </footer>
  )
}
