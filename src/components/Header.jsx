import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import ThemeCrop from './ThemeImage.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { img, svg } from '../assets.js'
import { mainNav, searchPages } from '../nav.js'
import { lerSessao } from '../api.js'

function SearchBar() {
  const [query, setQuery] = useState('')
  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  const onSubmit = (e) => {
    e.preventDefault()
    const page = searchPages(query)
    if (page) {
      navigate(page.to)
      setQuery('')
      setNotFound(false)
    } else {
      setNotFound(Boolean(query.trim()))
    }
  }

  return (
    <form className="search" role="search" onSubmit={onSubmit}>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setNotFound(false)
        }}
        placeholder="Pesquisar"
        aria-label="Pesquisar no site"
        aria-invalid={notFound || undefined}
        title={notFound ? 'Nenhuma página encontrada' : undefined}
      />
      <button type="submit" aria-label="Pesquisar">
        <img src={svg.search} alt="" />
      </button>
    </form>
  )
}

// Ícone de gráfico do atalho "Relatório"
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="hc-icon">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

// Cabeçalho desktop/tablet (no celular a navegação fica em MobileChrome).
export default function Header() {
  const { pathname } = useLocation()
  // Como no Figma: 5 links, sem o da página atual (nas páginas fora do menu, sai o último).
  const items = mainNav.filter((item) => item.to !== pathname).slice(0, 5)
  const sessao = lerSessao()
  const nome = sessao?.usuario?.nome || sessao?.usuario?.email || 'você'

  return (
    <header className="site-header container">
      <Link to="/" className="brand" aria-label="LightLab — página inicial">
        <ThemeCrop light={img.logo} dark={img.logoDark} className="brand-logo" />
      </Link>
      <nav className="main-nav" aria-label="Principal">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="header-tools">
        <SearchBar />
      </div>
      {/* Lado direito: atalho do Relatório + conta (ou Entrar, sem login) e, abaixo, o tema */}
      <div className="header-side">
        <nav className="header-conta" aria-label="Conta">
          {sessao ? (
            <>
              <NavLink to="/relatorio" className="hc-link">
                <ChartIcon />
                Relatório
              </NavLink>
              <NavLink to="/perfil" className="hc-conta" title={`Logado como ${nome}`}>
                <span className="hc-avatar" aria-hidden="true">
                  {/* Foto enviada pela pessoa; sem foto, a primeira letra do nome */}
                  {sessao.usuario?.foto ? <img src={sessao.usuario.foto} alt="" /> : nome.charAt(0).toUpperCase()}
                </span>
                <span className="hc-nome">{nome.split(/[\s@]/)[0]}</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/cadastro" className="hc-link">
                Cadastrar
              </NavLink>
              <NavLink to="/login" className="hc-entrar">
                Entrar
              </NavLink>
            </>
          )}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
