import { Link } from 'react-router-dom'
import Crop from './Crop.jsx'
import ThemeCrop from './ThemeImage.jsx'
import { img } from '../assets.js'

// Título de seção com o sublinhado de estrela. `login` mostra o botão LOGIN ao lado
// no celular, como no topo de cada tela mobile.
export function SectionTitle({ children, as: Tag = 'h2', size = 'md', login = false, id }) {
  return (
    <div className={`section-title-row ${login ? 'has-login' : ''}`}>
      <Tag className={`section-title st-${size}`} id={id}>
        <span>{children}</span>
        <ThemeCrop light={img.underline} dark={img.underlineDark} className="st-underline" />
      </Tag>
      {login && (
        <Link to="/login" className="pill pill-login-m mobile-only">
          LOGIN
        </Link>
      )}
    </div>
  )
}

// Faixa quadriculada na base dos cards. `a` e `b` alternam a partir de `offset`.
export function Stripes({ a, b, width = 94, height = 60, offset = -76 }) {
  return (
    <div
      className="stripes"
      aria-hidden="true"
      style={{
        '--sw': `${width}px`,
        '--sh': `${height}px`,
        backgroundImage: `repeating-linear-gradient(90deg, ${b} 0 ${width}px, ${a} ${width}px ${width * 2}px)`,
        backgroundPositionX: `${offset}px`,
      }}
    />
  )
}

export function Sparkle({ className = '' }) {
  return <ThemeCrop light={img.sparkle} dark={img.sparkleDark} className={`sparkle ${className}`} />
}

// Área de vídeo do design (ainda sem vídeo definido): card cinza com o botão de play.
export function VideoCard({ title }) {
  return (
    <div className="video-card" role="img" aria-label={`Vídeo: ${title} (em breve)`}>
      <Crop s={img.play} className="video-play" />
    </div>
  )
}

export function Button({ href, to, children, className = '', ...rest }) {
  if (to) {
    return (
      <Link to={to} className={`btn ${className}`} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`btn ${className}`} {...rest}>
      {children}
    </a>
  )
}
