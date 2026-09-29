import { Link } from 'react-router-dom'
import { AccountLayout } from '../components/Layout.jsx'
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

// Ícone de câmera no mesmo traço verde dos outros ícones do menu.
function CameraIcon() {
  return (
    <span className="pf-icon">
      <svg className="pf-camera" viewBox="0 0 32 26" fill="none" aria-hidden="true">
        <path
          d="M3 7.5C3 6.4 3.9 5.5 5 5.5h4.2l2-3h9.6l2 3H27c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-14Z"
          stroke="#00BF63"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="14.5" r="5" stroke="#00BF63" strokeWidth="2" />
      </svg>
    </span>
  )
}

const menu = [
  // O projeto de robótica ainda não está pronto: por enquanto leva à página da câmera
  // (com o vídeo de exemplo). Quando a ESP32-CAM estiver no ar, é só apontar para a transmissão.
  { to: '/camera', label: 'Ver câmera', icon: <CameraIcon />, soon: true },
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
        <ThemeCrop light={img.salamiAvatar} dark={img.salamiAvatarDark} className="pf-avatar" alt="Avatar" />
        <h1 className="pf-name">{user.name}</h1>
        <p className="pf-email">{user.email}</p>

        <nav className="pf-menu" aria-label="Menu do perfil">
          {menu.map((m) => (
            <Link key={m.label} to={m.to} className="pf-row">
              {m.icon}
              <span className="pf-label">
                {m.label}
                {m.soon && <span className="pf-soon">em breve</span>}
              </span>
              <img src={svg.chevronRight} alt="" className="pf-chevron" />
            </Link>
          ))}
        </nav>

        <ThemeCrop light={img.logo} dark={img.logoDark} className="pf-logo" />
      </section>
    </AccountLayout>
  )
}
