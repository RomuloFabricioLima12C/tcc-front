import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountLayout } from '../components/Layout.jsx'
import ThemeCrop from '../components/ThemeImage.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { SpacePanel } from './Auth.jsx'
import { img } from '../assets.js'
import { pedirCodigoSenha, redefinirSenha } from '../api.js'
import { PasswordInput, RegrasSenha } from '../components/Senha.jsx'
import { senhaValida } from '../senha.js'
import '../styles/auth.css'

// Duas etapas: 1) a pessoa informa o e-mail e a API manda um código de 6 dígitos;
// 2) ela digita o código e a nova senha, e a API troca a senha.
// O código prova que a conta é de quem pediu.
export default function RecuperarSenha() {
  const [etapa, setEtapa] = useState('email') // 'email' -> 'codigo' -> 'pronto'
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [show, setShow] = useState(false)
  const [tentou, setTentou] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  const regrasOk = senhaValida(senha)
  const iguais = confirma.length > 0 && confirma === senha
  const codigoOk = /^\d{6}$/.test(codigo)
  const valido = regrasOk && iguais && codigoOk

  // Etapa 1 (e o botão "Reenviar código")
  const pedirCodigo = async (e) => {
    e?.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const { mensagem } = await pedirCodigoSenha(email)
      setAviso(mensagem)
      setEtapa('codigo')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  // Etapa 2
  const onSubmit = async (e) => {
    e.preventDefault()
    setTentou(true)
    setErro('')
    if (!valido) return
    setEnviando(true)
    try {
      await redefinirSenha(email, codigo, senha)
      setEtapa('pronto')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
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

          {etapa === 'pronto' ? (
            <div className="auth-form reset-done" role="status">
              <h1>Senha alterada!</h1>
              <p className="auth-sub reset-info">
                A senha de <strong>{email}</strong> foi trocada. Entre com a senha nova.
              </p>
              <Link to="/login" className="auth-submit reset-back">
                IR PARA O LOGIN
              </Link>
            </div>
          ) : etapa === 'email' ? (
            <form className="auth-form" onSubmit={pedirCodigo}>
              <h1>Esqueceu a senha?</h1>
              <p className="auth-sub reset-info">Informe o e-mail da conta. Vamos mandar um código para ele.</p>

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

              {erro && (
                <p className="auth-error" role="alert">
                  {erro}
                </p>
              )}

              <button type="submit" className="auth-submit reset-submit" disabled={enviando}>
                {enviando ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
              </button>
              <p className="auth-switch">
                Lembrou a senha? <Link to="/login">Login</Link>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={onSubmit}>
              <h1>Crie a nova senha</h1>
              <p className="auth-sub reset-info" role="status">
                {aviso} Confira também a caixa de spam. Não chegou?{' '}
                <button type="button" className="auth-link" onClick={pedirCodigo} disabled={enviando}>
                  Reenviar código
                </button>
              </p>

              <label className="auth-field">
                <span>Código de 6 números</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
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

              <RegrasSenha id="regras-senha" senha={senha} tentou={tentou} />

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
                  {codigoOk ? 'Confira as regras da senha antes de continuar.' : 'Digite o código de 6 números.'}
                </p>
              )}
              {erro && (
                <p className="auth-error" role="alert">
                  {erro}
                </p>
              )}

              <button type="submit" className="auth-submit reset-submit" disabled={enviando}>
                {enviando ? 'SALVANDO...' : 'REDEFINIR'}
              </button>
              <p className="auth-switch">
                E-mail errado?{' '}
                <button type="button" className="auth-link" onClick={() => setEtapa('email')}>
                  Trocar e-mail
                </button>
              </p>
            </form>
          )}

          <ThemeCrop light={img.logo} dark={img.logoDark} className="auth-logo-m mobile-only" />
        </div>
      </div>
    </AccountLayout>
  )
}
