// Peças de senha usadas no Login, no Cadastro e no "Esqueceu a senha?".
import { passwordRules } from '../senha.js'

// Campo de senha com o botão Mostrar/Ocultar
export function PasswordInput({ id, value, onChange, show, onToggle, describedBy, autoComplete = 'new-password' }) {
  return (
    <span className="auth-pass">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required
        autoComplete={autoComplete}
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

// Lista das regras; "tentou" pinta de vermelho as que faltam depois que a pessoa tentou enviar
export function RegrasSenha({ id, senha, tentou }) {
  return (
    <ul className="pass-rules" id={id} aria-label="Regras da senha">
      {passwordRules.map((r) => {
        const ok = r.test(senha)
        return (
          <li key={r.id} className={ok ? 'is-ok' : tentou ? 'is-bad' : ''}>
            <span className="pass-mark" aria-hidden="true">
              {ok ? '✓' : '•'}
            </span>
            {r.label}
            <span className="visually-hidden">{ok ? ' — cumprida' : ' — pendente'}</span>
          </li>
        )
      })}
    </ul>
  )
}
