import { Link } from 'react-router-dom'
import { AccountLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import ThemeCrop from '../components/ThemeImage.jsx'
import { img, svg } from '../assets.js'
import '../styles/perfil.css'

function CartIcon() {
  return (
    <span className="pf-icon pf-cart">
      <img src={svg.cartBody} alt="" className="pf-cart-body" />
      <img src={svg.cartWheel} alt="" className="pf-cart-wheel" />
      <img src={svg.cartWheel} alt="" className="pf-cart-wheel pf-cart-wheel-2" />
    </span>
  )
}

const menu = [
  { to: '/relatorio', label: 'Minhas compras', icon: <CartIcon /> },
  {
    to: '/',
    label: 'Inicio',
    icon: (
      <span className="pf-icon">
        <img src={svg.dash} alt="" className="pf-dash" />
      </span>
    ),
  },
  {
    to: '/componentes',
    label: 'Componentes',
    icon: (
      <span className="pf-icon">
        <img src={svg.book} alt="" className="pf-book" />
      </span>
    ),
  },
]

// Usuário de exemplo do Figma — substituir pelos dados reais quando houver login de verdade.
const user = { name: 'João Pedro', email: 'joaopedro@gmail.com' }

export default function Perfil() {
  return (
    <AccountLayout title="Perfil">
      <section className="profile">
        <Crop s={img.salamiAvatar} className="pf-avatar" alt="Avatar" />
        <h1 className="pf-name">{user.name}</h1>
        <p className="pf-email">{user.email}</p>

        <nav className="pf-menu" aria-label="Menu do perfil">
          {menu.map((m) => (
            <Link key={m.label} to={m.to} className="pf-row">
              {m.icon}
              <span className="pf-label">{m.label}</span>
              <img src={svg.chevronRight} alt="" className="pf-chevron" />
            </Link>
          ))}
        </nav>

        <ThemeCrop light={img.logo} dark={img.logoDark} className="pf-logo" />
      </section>
    </AccountLayout>
  )
}
