// =====================================================================
// Página "Wi-Fi das placas": troca a rede das ESP32 sem gravar o código
// de novo. As redes ficam no banco (rota /api/redes); as placas baixam a
// lista a cada 1-2 minutos, guardam na memória e, ao ligar, entram na
// rede salva que estiver ao alcance.
// =====================================================================
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteLayout } from '../components/Layout.jsx'
import { SectionTitle } from '../components/Bits.jsx'
import { apagarRede, criarRede, editarRede, lerSessao, listarRedes, sair } from '../api.js'
import '../styles/alimentos.css'
import '../styles/wifi.css'

const NOME_PLACA = { principal: 'Placa principal (tela)', camera: 'ESP32-CAM' }

// Depois deste tempo sem notícias, a placa é mostrada como desligada
const ONLINE_MS = 3 * 60 * 1000

function haQuanto(iso) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000))
  if (s < 60) return 'agora mesmo'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} dias`
}

// Força do sinal (RSSI em dBm) em 1 a 3 barrinhas
function sinal(rssi) {
  if (rssi == null) return null
  if (rssi >= -60) return { barras: 3, texto: 'forte' }
  if (rssi >= -72) return { barras: 2, texto: 'bom' }
  return { barras: 1, texto: 'fraco' }
}

function IconeWifi({ barras = 3, className = '' }) {
  // arcos acesos conforme as barras; os outros ficam apagados
  const arco = (n, d) => (
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity={barras >= n ? 1 : 0.25} />
  )
  return (
    <svg viewBox="0 0 32 32" className={`wf-icone ${className}`} aria-hidden="true">
      {arco(3, 'M4 12.5a17 17 0 0 1 24 0')}
      {arco(2, 'M8.5 17a10.5 10.5 0 0 1 15 0')}
      {arco(1, 'M12.8 21.4a4.4 4.4 0 0 1 6.4 0')}
      <circle cx="16" cy="25.5" r="1.9" fill="currentColor" />
    </svg>
  )
}

const VAZIO = { ssid: '', senha: '' }

export default function Wifi() {
  const navigate = useNavigate()
  const sessao = lerSessao()
  const [dados, setDados] = useState(null) // { redes, versao, max, placas }
  const [semPermissao, setSemPermissao] = useState('')
  const [form, setForm] = useState(VAZIO)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [editando, setEditando] = useState(null) // { id, ssid, senha }
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const tratarErro = useCallback(
    (falha) => {
      if (falha.status === 401) {
        sair()
        navigate('/login')
      } else if (falha.status === 403) {
        setSemPermissao(falha.message)
      } else {
        setErro(falha.message)
      }
    },
    [navigate],
  )

  const carregar = useCallback(async () => {
    try {
      setDados(await listarRedes())
    } catch (falha) {
      tratarErro(falha)
    }
  }, [tratarErro])

  useEffect(() => {
    if (!sessao) {
      navigate('/login')
      return undefined
    }
    carregar()
    // atualiza sozinho: mostra quando as placas recebem a lista nova
    const timer = setInterval(carregar, 10000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const placas = dados?.placas || []
  const online = (p) => p.visto_em && Date.now() - Date.parse(p.visto_em) < ONLINE_MS
  const redesEmUso = new Set(placas.filter(online).map((p) => p.rede))
  const cheio = dados && dados.redes.length >= dados.max

  const onSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setAviso('')
    setSalvando(true)
    try {
      const nova = await criarRede({ ssid: form.ssid, senha: form.senha })
      setAviso(`Rede "${nova.ssid}" salva! As placas recebem em até 2 minutos.`)
      setForm(VAZIO)
      setMostrarSenha(false)
      await carregar()
    } catch (falha) {
      tratarErro(falha)
    } finally {
      setSalvando(false)
    }
  }

  const salvarEdicao = async (e) => {
    e.preventDefault()
    setErro('')
    setAviso('')
    setSalvando(true)
    try {
      const original = dados.redes.find((r) => r.id === editando.id)
      if (!original) {
        // a rede foi removida (em outra aba, por exemplo) enquanto era editada
        setErro('Essa rede não existe mais.')
        setEditando(null)
        return
      }
      const mudancas = {}
      if (editando.ssid !== original.ssid) mudancas.ssid = editando.ssid
      if (editando.trocarSenha) mudancas.senha = editando.senha
      if (Object.keys(mudancas).length) {
        await editarRede(editando.id, mudancas)
        setAviso('Rede alterada! As placas recebem em até 2 minutos.')
      }
      setEditando(null)
      await carregar()
    } catch (falha) {
      tratarErro(falha)
    } finally {
      setSalvando(false)
    }
  }

  const remover = async (rede) => {
    const pergunta = redesEmUso.has(rede.ssid)
      ? `As placas estão usando "${rede.ssid}" agora. Se você remover e elas reiniciarem longe das outras redes salvas, vão ficar sem internet. Remover mesmo assim?`
      : `Remover a rede "${rede.ssid}"?`
    if (!window.confirm(pergunta)) return
    setErro('')
    setAviso('')
    try {
      await apagarRede(rede.id)
      await carregar()
    } catch (falha) {
      tratarErro(falha)
    }
  }

  return (
    <SiteLayout title="Wi-Fi das placas">
      <section className="container al-page wf-page">
        <SectionTitle as="h1">WI-FI DAS PLACAS</SectionTitle>
        <p className="wf-intro">
          Troque a rede da geladeira sem gravar o código de novo. Cadastre a rede nova aqui{' '}
          <strong>enquanto as placas ainda estão na rede antiga</strong>: elas baixam a lista, guardam na
          memória e, quando forem ligadas no lugar novo, entram sozinhas na rede que estiver ao alcance.
        </p>

        <ol className="wf-passos">
          <li>
            <span>1</span>Cadastre a rede nova abaixo.
          </li>
          <li>
            <span>2</span>Espere as placas mostrarem <em>Lista recebida</em> (até 2 min).
          </li>
          <li>
            <span>3</span>Desligue, leve e ligue as placas no lugar novo.
          </li>
        </ol>

        {semPermissao ? (
          <div className="al-card wf-aviso-card" role="alert">
            <h2>Sem acesso</h2>
            <p>{semPermissao}</p>
          </div>
        ) : (
          <>
            <div className="wf-placas">
              {(placas.length ? placas : [{ placa: 'principal' }, { placa: 'camera' }]).map((p) => {
                const ligada = online(p)
                const s = ligada ? sinal(p.rssi) : null
                const recebeu = p.versao && dados && p.versao === dados.versao
                return (
                  <article key={p.placa} className={`al-card wf-placa ${ligada ? 'is-online' : 'is-offline'}`}>
                    <IconeWifi barras={s?.barras ?? 0} className="wf-placa-icone" />
                    <div className="wf-placa-info">
                      <h2>{NOME_PLACA[p.placa] || p.placa}</h2>
                      {!dados ? (
                        <p>Carregando...</p>
                      ) : ligada ? (
                        <>
                          <p>
                            <span className="wf-status is-online">Conectada</span> em <strong>{p.rede || '?'}</strong>
                            {s && ` · sinal ${s.texto}`}
                          </p>
                          <p className="wf-meta">
                            {recebeu ? '✓ Lista recebida' : '⟳ Aguardando a lista nova (até 2 min)'} · visto{' '}
                            {haQuanto(p.visto_em)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            <span className="wf-status is-offline">Sem notícias</span>
                          </p>
                          <p className="wf-meta">
                            {p.visto_em
                              ? `Última vez em "${p.rede}" ${haQuanto(p.visto_em)}`
                              : 'Ainda não falou com o servidor desde que ele ligou'}
                          </p>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="al-grid wf-grid">
              <form className="al-card al-form" onSubmit={onSubmit}>
                <h2>Adicionar rede</h2>
                <label>
                  Nome da rede (SSID) *
                  <input
                    value={form.ssid}
                    onChange={(e) => setForm({ ...form, ssid: e.target.value })}
                    required
                    maxLength={31}
                    placeholder="Ex.: Casa da Vó"
                    autoComplete="off"
                    disabled={cheio}
                  />
                </label>
                <label>
                  Senha
                  <span className="wf-senha">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={form.senha}
                      onChange={(e) => setForm({ ...form, senha: e.target.value })}
                      maxLength={63}
                      placeholder="Vazio se a rede for aberta"
                      autoComplete="new-password"
                      disabled={cheio}
                    />
                    <button
                      type="button"
                      className="wf-olho"
                      onClick={() => setMostrarSenha((v) => !v)}
                      aria-pressed={mostrarSenha}
                    >
                      {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </span>
                </label>
                <p className="wf-dica">
                  Confira maiúsculas e minúsculas: a placa só descobre que a senha está errada quando tentar
                  conectar.
                </p>
                <button type="submit" className="al-btn" disabled={salvando || cheio}>
                  {salvando ? 'Salvando...' : 'Salvar rede'}
                </button>
                {cheio && <p className="al-erro">As placas guardam no máximo {dados.max} redes. Remova uma para adicionar outra.</p>}
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
                  Redes salvas{' '}
                  <span className="al-conta">
                    {dados ? `${dados.redes.length}/${dados.max}` : '…'}
                  </span>
                </h2>
                {!dados ? (
                  <p className="al-vazio">Carregando...</p>
                ) : dados.redes.length === 0 ? (
                  <p className="al-vazio">
                    Nenhuma rede cadastrada ainda. As placas usam só a rede escrita no código.
                  </p>
                ) : (
                  <ul>
                    {dados.redes.map((r) =>
                      editando?.id === r.id ? (
                        <li key={r.id} className="wf-item is-editando">
                          <form className="wf-editar" onSubmit={salvarEdicao}>
                            <label>
                              Nome
                              <input
                                value={editando.ssid}
                                onChange={(e) => setEditando({ ...editando, ssid: e.target.value })}
                                required
                                maxLength={31}
                              />
                            </label>
                            <label className="wf-check">
                              <input
                                type="checkbox"
                                checked={editando.trocarSenha}
                                onChange={(e) => setEditando({ ...editando, trocarSenha: e.target.checked, senha: '' })}
                              />
                              Trocar a senha
                            </label>
                            {editando.trocarSenha && (
                              <label>
                                Nova senha
                                <input
                                  type="text"
                                  value={editando.senha}
                                  onChange={(e) => setEditando({ ...editando, senha: e.target.value })}
                                  maxLength={63}
                                  placeholder="Vazio = rede aberta"
                                  autoComplete="off"
                                />
                              </label>
                            )}
                            <div className="wf-acoes">
                              <button type="submit" className="wf-btn" disabled={salvando}>
                                Salvar
                              </button>
                              <button type="button" className="wf-btn is-secundario" onClick={() => setEditando(null)}>
                                Cancelar
                              </button>
                            </div>
                          </form>
                        </li>
                      ) : (
                        <li key={r.id} className="wf-item">
                          <IconeWifi className="wf-item-icone" />
                          <div className="al-info">
                            <strong>{r.ssid}</strong>
                            <span className="al-meta">
                              {r.tem_senha ? 'Com senha' : 'Rede aberta'} · alterada {haQuanto(r.atualizado_em)}
                            </span>
                          </div>
                          {redesEmUso.has(r.ssid) && <span className="wf-uso">em uso</span>}
                          <div className="wf-acoes">
                            <button
                              type="button"
                              className="wf-btn is-secundario"
                              onClick={() => setEditando({ id: r.id, ssid: r.ssid, senha: '', trocarSenha: false })}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="al-remover"
                              onClick={() => remover(r)}
                              aria-label={`Remover ${r.ssid}`}
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
                <p className="wf-dica wf-reserva">
                  A rede escrita no código das placas continua salva como reserva, mesmo que não apareça aqui.
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </SiteLayout>
  )
}
