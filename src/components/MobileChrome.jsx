import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Crop from './Crop.jsx'
import ThemeCrop from './ThemeImage.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { img, svg } from '../assets.js'

// Topo verde do app no celular: logo no centro, tema e atalho do jogo à direita.
export function MobileTop() {
  return (
    <div className="m-top">
      <Link to="/" className="m-brand" aria-label="LightLab — página inicial">
        <ThemeCrop light={img.logo} dark={img.logoDark} className="m-brand-logo" />
      </Link>
      <div className="m-top-tools">
        <ThemeToggle className="m-toggle" />
        <Link to="/jogo" className="m-game" aria-label="Nosso game">
          <Crop s={img.iconGame} />
        </Link>
      </div>
    </div>
  )
}

// Topo das telas de conta no celular (seta de voltar + título).
export function MobileTitleBar({ title }) {
  const navigate = useNavigate()
  return (
    <div className="m-titlebar">
      <button type="button" className="m-back" onClick={() => navigate(-1)} aria-label="Voltar">
        <img src={svg.backArrow} alt="" />
      </button>
      <h1>{title}</h1>
    </div>
  )
}

function HomeIcon() {
  return (
    <span className="home-icon" aria-hidden="true">
      <img src={svg.homeHouse} alt="" />
      <img src={svg.homeDoor} alt="" className="home-door" />
    </span>
  )
}

const tabs = [
  { to: '/projeto', label: 'Projeto', icon: img.iconProjeto },
  { to: '/componentes', label: 'Componentes', icon: img.iconComponentes },
  { to: '/quem-somos', label: 'Quem somos', icon: img.iconQuemSomos },
  { to: '/referencias', label: 'Referências', icon: img.iconReferencias },
]

// Barra inferior do celular. A aba da página atual vira "Home", como no design.
export function MobileTabBar() {
  const { pathname } = useLocation()
  const items = tabs.map((t) => (t.to === pathname ? { to: '/', label: 'Home', home: true } : t))
  const left = items.slice(0, 2)
  const right = items.slice(2)

  const renderTab = (t) => (
    <NavLink key={t.to} to={t.to} className="m-tab">
      {t.home ? <HomeIcon /> : <Crop s={t.icon} className="m-tab-icon" />}
      <span>{t.label}</span>
    </NavLink>
  )

  return (
    <nav className="m-tabbar" aria-label="Navegação">
      {left.map(renderTab)}
      <Link to="/perfil" className="m-perfil" aria-label="Perfil">
        {/* "calombo" da superfície (#eee no design) — em CSS para acompanhar o tema */}
        <span className="m-perfil-bump" aria-hidden="true" />
        <Crop s={img.perfilLabel} className="m-perfil-label" />
        <span className="m-perfil-berry">
          <Crop s={img.blueberry} />
        </span>
      </Link>
      {right.map(renderTab)}
    </nav>
  )
}
