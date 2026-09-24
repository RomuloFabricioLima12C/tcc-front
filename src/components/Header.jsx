import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import ThemeCrop from './ThemeImage.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { img, svg } from '../assets.js'
import { mainNav, searchPages } from '../nav.js'

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

// Cabeçalho desktop/tablet (no celular a navegação fica em MobileChrome).
export default function Header() {
  const { pathname } = useLocation()
  // Como no Figma: 5 links, sem o da página atual (nas páginas fora do menu, sai o último).
  const items = mainNav.filter((item) => item.to !== pathname).slice(0, 5)

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
        <ThemeToggle />
        <Link to="/login" className="pill pill-login">
          LOGIN
        </Link>
      </div>
    </header>
  )
}
