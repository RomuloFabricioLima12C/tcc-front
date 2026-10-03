// =====================================================================
// Página "Meus alimentos": cadastro pelo site + lista com destaque para o
// que está perto de vencer. Usa a API do back/ (precisa estar logado).
// Os alimentos cadastrados pela tela touch do ESP32 aparecem aqui também.
// =====================================================================
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteLayout } from '../components/Layout.jsx'
import {
  apagarAlimento,
  criarAlimento,
  lerSessao,
  listarAlimentos,
  listarVencendo,
  sair,
} from '../api.js'
import '../styles/alimentos.css'

const CATEGORIAS = ['Laticínio', 'Embutido', 'Carne', 'Fruta', 'Verdura', 'Legume', 'Grão', 'Padaria', 'Bebida', 'Outro']

// Texto e cor de cada alimento conforme os dias que faltam
function situacao(dias) {
  if (dias < 0) return { classe: 'vencido', texto: dias === -1 ? 'Venceu ontem' : `Venceu há ${-dias} dias` }
  if (dias === 0) return { classe: 'urgente', texto: 'Vence hoje' }
  if (dias === 1) return { classe: 'urgente', texto: 'Vence amanhã' }
  if (dias <= 3) return { classe: 'atencao', texto: `Vence em ${dias} dias` }
  return { classe: 'ok', texto: `${dias} dias` }
}

// "2026-10-05" -> "05/10/2026"
const dataBr = (iso) => iso.split('-').reverse().join('/')

const VAZIO = { nome: '', categoria: '', quantidade: 1, data_validade: '' }

export default function Alimentos() {
  const navigate = useNavigate()
  const sessao = lerSessao()
  const [alimentos, setAlimentos] = useState([])
  const [vencendo, setVencendo] = useState([]) // vem da rota /api/alimentos/vencendo?dias=3
  const [form, setForm] = useState(VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  // Se a API disser que o login expirou (401), volta para a tela de login
  const tratarErro = useCallback(
    (falha) => {
      if (falha.status === 401) {
        sair()
        navigate('/login')
        return
      }
      setErro(falha.message)
    },
    [navigate],
  )

  const carregar = useCallback(async () => {
    try {
      // as duas chamadas saem ao mesmo tempo
      const [todos, proximos] = await Promise.all([listarAlimentos(), listarVencendo(3)])
      setAlimentos(todos)
      setVencendo(proximos)
    } catch (falha) {
      tratarErro(falha)
    } finally {
      setCarregando(false)
    }
  }, [tratarErro])

  useEffect(() => {
    if (!sessao) {
      navigate('/login')
      return
    }
    carregar()
    // atualiza sozinho a cada 15 s: assim aparece o que foi cadastrado pela tela touch
    const timer = setInterval(carregar, 15000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setAviso('')
    setSalvando(true)
    try {
      const novo = await criarAlimento({
        nome: form.nome,
        categoria: form.categoria || null,
        quantidade: Number(form.quantidade) || 1,
        data_validade: form.data_validade,
      })
      setAviso(`${novo.nome} cadastrado!`)
      setForm(VAZIO)
      await carregar()
    } catch (falha) {
      tratarErro(falha)
    } finally {
      setSalvando(false)
    }
  }

  const remover = async (alimento) => {
    if (!window.confirm(`Remover "${alimento.nome}" da lista?`)) return
    try {
      await apagarAlimento(alimento.id)
      await carregar()
    } catch (falha) {
      tratarErro(falha)
    }
  }

  const sairDaConta = () => {
    sair()
    navigate('/login')
  }

  const vencidos = alimentos.filter((a) => a.dias_restantes < 0)

  return (
    <SiteLayout title="Meus alimentos">
      <section className="container al-page">
        <header className="al-top">
          <div>
            <h1>Meus alimentos</h1>
            {sessao?.usuario && <p className="al-ola">Olá, {sessao.usuario.nome}!</p>}
          </div>
          <button type="button" className="al-sair" onClick={sairDaConta}>
            Sair
          </button>
        </header>

        {(vencendo.length > 0 || vencidos.length > 0) && (
          <div className="al-alerta" role="status">
            {vencidos.length > 0 && (
              <p>
                <strong>{vencidos.length}</strong> alimento(s) já venceram.
              </p>
            )}
            {vencendo.length > 0 && (
              <p>
                <strong>{vencendo.length}</strong> alimento(s) vencem nos próximos 3 dias:{' '}
                {vencendo.map((a) => a.nome).join(', ')}.
              </p>
            )}
          </div>
        )}

        <div className="al-grid">
          <form className="al-card al-form" onSubmit={onSubmit}>
            <h2>Cadastrar alimento</h2>
            <label>
              Nome *
              <input value={form.nome} onChange={mudar('nome')} required maxLength={100} placeholder="Ex.: Leite" />
            </label>
            <label>
              Categoria
              <select value={form.categoria} onChange={mudar('categoria')}>
                <option value="">Escolha (opcional)</option>
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="al-linha">
              <label>
                Quantidade
                <input type="number" min="1" step="1" value={form.quantidade} onChange={mudar('quantidade')} />
              </label>
              <label>
                Validade *
                <input type="date" value={form.data_validade} onChange={mudar('data_validade')} required />
              </label>
            </div>
            <button type="submit" className="al-btn" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Cadastrar'}
            </button>
            {aviso && (
              <p className="al-ok" role="status">
                {aviso}
              </p>
            )}
            {erro && (
              <p className="al-erro" role="alert">
                {erro}
              </p>
            )}
          </form>

          <div className="al-card al-lista">
            <h2>
              Na geladeira <span className="al-conta">{alimentos.length}</span>
            </h2>
            {carregando ? (
              <p className="al-vazio">Carregando...</p>
            ) : alimentos.length === 0 ? (
              <p className="al-vazio">Nenhum alimento ainda. Cadastre pelo formulário ou pela tela touch.</p>
            ) : (
              <ul>
                {alimentos.map((a) => {
                  const s = situacao(a.dias_restantes)
                  return (
                    <li key={a.id} className={`al-item is-${s.classe}`}>
                      <div className="al-info">
                        <strong>{a.nome}</strong>
                        <span className="al-meta">
                          {a.categoria || 'Sem categoria'} · {a.quantidade} un. · vence {dataBr(a.data_validade)}
                          {a.origem === 'touch' && <span className="al-tag">tela touch</span>}
                        </span>
                      </div>
                      <span className={`al-badge is-${s.classe}`}>{s.texto}</span>
                      <button
                        type="button"
                        className="al-remover"
                        onClick={() => remover(a)}
                        aria-label={`Remover ${a.nome}`}
                      >
                        ✕
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
