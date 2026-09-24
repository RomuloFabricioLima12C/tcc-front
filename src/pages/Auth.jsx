import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AccountLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import ThemeCrop from '../components/ThemeImage.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { img } from '../assets.js'
import '../styles/auth.css'

const copy = {
  login: {
    title: 'Login',
    heading: 'Bom te ver de novo,',
    switchText: 'Não tem uma conta?',
    switchLabel: 'Cadastrar-se',
    switchTo: '/cadastro',
    submit: 'ENTRAR',
  },
  cadastro: {
    title: 'Cadastro',
    heading: 'Seja bem-vindo,',
    switchText: 'Já tem uma conta?',
    switchLabel: 'Login',
    switchTo: '/login',
    submit: 'ENTRAR',
  },
}

function SpacePanel({ mode }) {
  return (
    <div className={`space-panel space-${mode}`} aria-hidden="true">
      <Crop s={img.space} className="space-bg" />
      {mode === 'login' ? (
        <Crop s={img.tomatoPlanet} className="space-tomato" />
      ) : (
        <Crop s={img.tomatoPlanetHalf} className="space-tomato" />
      )}
      <Crop s={img.carrotPlanet} className="space-carrot" />
    </div>
  )
}

// Sem back-end ainda: o formulário valida os campos e leva para a área de recursos.
export default function Auth({ mode }) {
  const t = copy[mode]
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    navigate('/recursos')
  }

  return (
    <AccountLayout title={t.title} desktopHeader={false}>
      <div className={`auth auth-${mode}`}>
        <SpacePanel mode={mode} />
        <div className="auth-side">
          <div className="auth-top desktop-only">
            <Link to="/" className="auth-logo" aria-label="LightLab — página inicial">
              <ThemeCrop light={img.logo} dark={img.logoDark} />
            </Link>
            <ThemeToggle className="auth-toggle" />
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <h1>{t.heading}</h1>
            <p className="auth-sub">Insira suas informações a seguir</p>

            <label className="auth-field">
              <span>E-mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="auth-field">
              <span>Senha</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </label>

            <button type="submit" className="auth-submit">
              {t.submit}
            </button>
            <p className="auth-switch">
              {t.switchText} <Link to={t.switchTo}>{t.switchLabel}</Link>
            </p>
          </form>

          <ThemeCrop light={img.logo} dark={img.logoDark} className="auth-logo-m mobile-only" />
        </div>
      </div>
    </AccountLayout>
  )
}
