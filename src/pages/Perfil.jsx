import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AccountLayout } from '../components/Layout.jsx'
import ThemeCrop from '../components/ThemeImage.jsx'
import { img, links, svg } from '../assets.js'
import { avatares, acharAvatar } from '../avatares.js'
import { lerSessao, removerFoto, sair, salvarAvatar, salvarFoto } from '../api.js'
import { prepararFoto } from '../fotoPerfil.js'
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

// Balão de conversa com "?" (mesmo verde dos outros ícones)
function SupportIcon() {
  return (
    <svg viewBox="0 0 32 32" className="pf-support" aria-hidden="true">
      <path
        d="M6 7h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H14l-6 5v-5H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 12.6a2.9 2.9 0 1 1 4.2 2.6c-.9.4-1.4 1-1.4 1.9v.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16" cy="20.2" r="1.1" fill="currentColor" />
    </svg>
  )
}

// Símbolo do Wi-Fi (mesmo verde e tamanho do ícone de suporte)
function WifiIcon() {
  return (
    <svg viewBox="0 0 32 32" className="pf-support" aria-hidden="true">
      <path
        d="M4 12.5a17 17 0 0 1 24 0M8.5 17a10.5 10.5 0 0 1 15 0M12.8 21.4a4.4 4.4 0 0 1 6.4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16" cy="25.5" r="1.4" fill="currentColor" />
    </svg>
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
  // Suporte: abre o formulário FAQ (o mesmo do rodapé), sem página própria
  {
    href: links.faq,
    label: 'Suporte',
    icon: (
      <span className="pf-icon">
        <SupportIcon />
      </span>
    ),
  },
  // Trocar a rede das ESP32 sem gravar o código de novo
  {
    to: '/wifi',
    label: 'Wi-Fi das placas',
    icon: (
      <span className="pf-icon">
        <WifiIcon />
      </span>
    ),
  },
]

// Foto do aparelho + grade com as frutas do site para escolher a foto de perfil
function EscolherAvatar({ atual, temFoto, salvando, onEscolher, onArquivo, onRemoverFoto }) {
  return (
    <div className="pf-escolha">
      <p className="pf-escolha-titulo">Escolha sua foto de perfil</p>
      {/* No celular, o "accept=image/*" oferece a galeria e a câmera; no computador, abre os arquivos */}
      <label className={`pf-enviar${salvando ? ' is-disabled' : ''}`}>
        <input
          type="file"
          accept="image/*"
          className="visually-hidden"
          disabled={salvando}
          onChange={(e) => {
            onArquivo(e.target.files?.[0])
            e.target.value = '' // deixa escolher o mesmo arquivo de novo
          }}
        />
        {salvando ? 'Enviando...' : 'Usar uma foto minha'}
      </label>
      {temFoto && (
        <button type="button" className="pf-remover" disabled={salvando} onClick={onRemoverFoto}>
          Remover minha foto
        </button>
      )}
      <p className="pf-escolha-ou">ou escolha uma fruta</p>
      <div className="pf-escolha-grade" role="radiogroup" aria-label="Foto de perfil">
        {avatares.map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={!temFoto && a.id === atual}
            className="pf-opcao"
            title={a.nome}
            disabled={salvando}
            onClick={() => onEscolher(a.id)}
          >
            <ThemeCrop light={a.light} dark={a.dark} alt={a.nome} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Perfil() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(() => lerSessao()?.usuario) // quem fez login (guardado em api.js)
  const avatar = acharAvatar(usuario?.avatar)
  const foto = usuario?.foto // foto enviada do aparelho (tem prioridade sobre a fruta)
  // Sem foto ainda: as opções já aparecem abertas
  const [escolhendo, setEscolhendo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const mostrarOpcoes = usuario && (escolhendo || (!avatar && !foto))

  // Roda a ação (salvar fruta, enviar ou remover foto) e atualiza a tela
  const salvar = async (acao) => {
    setSalvando(true)
    setErro('')
    try {
      await acao()
      setUsuario(lerSessao()?.usuario)
      setEscolhendo(false)
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const escolher = (id) => salvar(() => salvarAvatar(id))
  const enviarArquivo = (arquivo) => arquivo && salvar(async () => salvarFoto(await prepararFoto(arquivo)))
  const tirarFoto = () => salvar(removerFoto)

  const sairDaConta = () => {
    sair()
    navigate('/login')
  }

  return (
    <AccountLayout title="Perfil">
      <section className="profile">
        {foto ? (
          <span className="pf-avatar-foto">
            <img src={foto} alt="Sua foto de perfil" className="pf-foto-propria" />
          </span>
        ) : avatar ? (
          <span className="pf-avatar-foto">
            <ThemeCrop light={avatar.light} dark={avatar.dark} alt={`Foto de perfil: ${avatar.nome}`} />
          </span>
        ) : (
          <ThemeCrop light={img.salamiAvatar} dark={img.salamiAvatarDark} className="pf-avatar" alt="Avatar" />
        )}
        {usuario ? (
          <>
            <h1 className="pf-name">{usuario.nome}</h1>
            <p className="pf-email">{usuario.email}</p>
            {(avatar || foto) && !escolhendo && (
              <button type="button" className="pf-trocar" onClick={() => setEscolhendo(true)}>
                Trocar foto
              </button>
            )}
            {mostrarOpcoes && (
              <EscolherAvatar
                atual={usuario.avatar}
                temFoto={Boolean(foto)}
                salvando={salvando}
                onEscolher={escolher}
                onArquivo={enviarArquivo}
                onRemoverFoto={tirarFoto}
              />
            )}
            {erro && (
              <p className="pf-erro" role="alert">
                {erro}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="pf-name">Você não está logado</h1>
            <Link to="/login" className="pf-entrar">
              ENTRAR
            </Link>
          </>
        )}

        <nav className="pf-menu" aria-label="Menu do perfil">
          {menu.map((m) => {
            const conteudo = (
              <>
                {m.icon}
                <span className="pf-label">
                  {m.label}
                  {m.soon && <span className="pf-soon">em breve</span>}
                </span>
                <img src={svg.chevronRight} alt="" className="pf-chevron" />
              </>
            )
            // Link externo (Suporte) abre em outra aba; os outros navegam dentro do site
            return m.href ? (
              <a key={m.label} href={m.href} target="_blank" rel="noreferrer" className="pf-row">
                {conteudo}
              </a>
            ) : (
              <Link key={m.label} to={m.to} className="pf-row">
                {conteudo}
              </Link>
            )
          })}
        </nav>

        {usuario && (
          <button type="button" className="pf-sair" onClick={sairDaConta}>
            Sair da conta
          </button>
        )}

        <ThemeCrop light={img.logo} dark={img.logoDark} className="pf-logo" />
      </section>
    </AccountLayout>
  )
}
