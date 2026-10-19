import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AccountLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import ThemeCrop from '../components/ThemeImage.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { img } from '../assets.js'
import { cadastrar, entrar, salvarSessao } from '../api.js'
import { PasswordInput, RegrasSenha } from '../components/Senha.jsx'
import { senhaValida } from '../senha.js'
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

export function SpacePanel({ mode }) {
  return (
    <div className={`space-panel space-${mode}`} aria-hidden="true">
      {/* A arte inteira (fundo + planetas) cobre o painel sem distorcer, como object-fit: cover */}
      <div className="space-art">
        <Crop s={img.space} className="space-bg" />
        {mode === 'login' ? (
          <Crop s={img.tomatoPlanet} className="space-tomato" />
        ) : (
          <Crop s={img.tomatoPlanetHalf} className="space-tomato" />
        )}
        <Crop s={img.carrotPlanet} className="space-carrot" />
      </div>
    </div>
  )
}

// Login e Cadastro chamam a API (back/) e guardam o token.
export default function Auth({ mode }) {
  const t = copy[mode]
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrar, setMostrar] = useState(false)
  const [tentou, setTentou] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (mode === 'cadastro') {
      setTentou(true)
      if (!senhaValida(senha)) {
        setErro('A senha ainda não cumpre todas as regras da lista.')
        return
      }
    }
    setEnviando(true)
    try {
      // Login entra na conta; Cadastro cria a conta (o nome vem do começo do e-mail)
      const { token, usuario } =
        mode === 'login' ? await entrar(email, senha) : await cadastrar(email.split('@')[0], email, senha)
      salvarSessao(token, usuario) // guarda o token para as próximas chamadas
      navigate('/relatorio')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
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
            <div className="auth-field">
              <label htmlFor="senha">
                <span>Senha</span>
              </label>
              <PasswordInput
                id="senha"
                value={senha}
                onChange={setSenha}
                show={mostrar}
                onToggle={() => setMostrar((v) => !v)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                describedBy={mode === 'cadastro' ? 'regras-senha' : undefined}
              />
            </div>
            {/* No cadastro, as regras aparecem e ficam verdes enquanto a pessoa digita */}
            {mode === 'cadastro' && <RegrasSenha id="regras-senha" senha={senha} tentou={tentou} />}
            {mode === 'login' && (
              <p className="auth-forgot">
                <Link to="/esqueci-senha">Esqueceu a senha?</Link>
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={enviando}>
              {enviando ? 'ENTRANDO...' : t.submit}
            </button>
            {erro && (
              <p className="auth-error" role="alert">
                {erro}
              </p>
            )}
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
