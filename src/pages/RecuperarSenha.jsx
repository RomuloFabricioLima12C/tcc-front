import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountLayout } from '../components/Layout.jsx'
import ThemeCrop from '../components/ThemeImage.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { SpacePanel } from './Auth.jsx'
import { img, links } from '../assets.js'
import '../styles/auth.css'

// Regras da nova senha — cada uma aparece na lista e fica verde quando é cumprida.
const passwordRules = [
  { id: 'len', label: 'Pelo menos 8 caracteres', test: (s) => s.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula (A-Z)', test: (s) => /[A-Z]/.test(s) },
  { id: 'lower', label: 'Uma letra minúscula (a-z)', test: (s) => /[a-z]/.test(s) },
  { id: 'number', label: 'Um número (0-9)', test: (s) => /\d/.test(s) },
  { id: 'special', label: 'Um caractere especial (!@#$%&*...)', test: (s) => /[^A-Za-z0-9\s]/.test(s) },
  { id: 'space', label: 'Sem espaços', test: (s) => s.length > 0 && !/\s/.test(s) },
]

function PasswordInput({ id, value, onChange, show, onToggle, describedBy }) {
  return (
    <span className="auth-pass">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy}
      />
      <button type="button" className="auth-eye" onClick={onToggle} aria-pressed={show}>
        {show ? 'Ocultar' : 'Mostrar'}
      </button>
    </span>
  )
}

// A API ainda não troca a senha (para isso ela precisaria mandar um e-mail confirmando
// que a conta é de quem pediu). A página valida as regras e, no fim, explica isso e
// manda para o Suporte, em vez de dizer que a senha foi trocada.
export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [show, setShow] = useState(false)
  const [tentou, setTentou] = useState(false)
  const [pronto, setPronto] = useState(false)

  const results = passwordRules.map((r) => ({ ...r, ok: r.test(senha) }))
  const regrasOk = results.every((r) => r.ok)
  const iguais = confirma.length > 0 && confirma === senha
  const valido = regrasOk && iguais

  const onSubmit = (e) => {
    e.preventDefault()
    setTentou(true)
    if (valido) setPronto(true)
  }

  return (
    <AccountLayout title="Nova senha" desktopHeader={false}>
      <div className="auth auth-login auth-reset">
        <SpacePanel mode="login" />
        <div className="auth-side">
          <div className="auth-top desktop-only">
            <Link to="/" className="auth-logo" aria-label="LightLab — página inicial">
              <ThemeCrop light={img.logo} dark={img.logoDark} />
            </Link>
            <ThemeToggle className="auth-toggle" />
          </div>

          {pronto ? (
            <div className="auth-form reset-done" role="status">
              <h1>Quase lá!</h1>
              <p className="auth-sub">
                A troca de senha pelo site ainda não está disponível, então a senha de{' '}
                <strong>{email}</strong> <strong>não foi alterada</strong>. Peça a troca pelo{' '}
                <a href={links.faq} target="_blank" rel="noreferrer">
                  Suporte
                </a>{' '}
                e continue entrando com a senha antiga até lá.
              </p>
              <Link to="/login" className="auth-submit reset-back">
                VOLTAR AO LOGIN
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={onSubmit}>
              <h1>Esqueceu a senha?</h1>
              <p className="auth-sub">Crie uma nova senha para a sua conta</p>

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
                <label htmlFor="nova-senha">
                  <span>Nova senha</span>
                </label>
                <PasswordInput
                  id="nova-senha"
                  value={senha}
                  onChange={setSenha}
                  show={show}
                  onToggle={() => setShow((v) => !v)}
                  describedBy="regras-senha"
                />
              </div>

              <ul className="pass-rules" id="regras-senha" aria-label="Regras da senha">
                {results.map((r) => (
                  <li key={r.id} className={r.ok ? 'is-ok' : tentou ? 'is-bad' : ''}>
                    <span className="pass-mark" aria-hidden="true">
                      {r.ok ? '✓' : '•'}
                    </span>
                    {r.label}
                    <span className="visually-hidden">{r.ok ? ' — cumprida' : ' — pendente'}</span>
                  </li>
                ))}
              </ul>

              <div className="auth-field">
                <label htmlFor="confirma-senha">
                  <span>Confirmar nova senha</span>
                </label>
                <PasswordInput
                  id="confirma-senha"
                  value={confirma}
                  onChange={setConfirma}
                  show={show}
                  onToggle={() => setShow((v) => !v)}
                  describedBy="confirma-msg"
                />
                <p
                  id="confirma-msg"
                  className={`pass-match ${confirma ? (iguais ? 'is-ok' : 'is-bad') : ''}`}
                  aria-live="polite"
                >
                  {confirma ? (iguais ? '✓ As senhas são iguais' : '✗ As senhas não são iguais') : ''}
                </p>
              </div>

              {tentou && !valido && (
                <p className="pass-error" role="alert">
                  Confira as regras da senha antes de continuar.
                </p>
              )}

              <button type="submit" className="auth-submit reset-submit">
                REDEFINIR
              </button>
              <p className="auth-switch">
                Lembrou a senha? <Link to="/login">Login</Link>
              </p>
            </form>
          )}

          <ThemeCrop light={img.logo} dark={img.logoDark} className="auth-logo-m mobile-only" />
        </div>
      </div>
    </AccountLayout>
  )
}
