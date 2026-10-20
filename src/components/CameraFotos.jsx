// =====================================================================
// Câmera da geladeira (página Relatório): fotos, sem vídeo.
// Enquanto esta seção está aberta, avisa o servidor a cada 3 s (api.js → olharCamera).
// A ESP32-CAM então liga o relé (fita de LED), espera a luz e tira uma foto a cada 10 s.
// Ao sair da página ou trocar de aba, os avisos param: a câmera para e apaga a fita.
// =====================================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { baixarFoto, lerSessao, olharCamera, sair } from '../api.js'
import '../styles/camera-video.css'

const AVISO_MS = 3000 // de quanto em quanto tempo avisa o servidor (e procura foto nova)
const SEM_SINAL_MS = 30000 // sem foto nova por esse tempo = câmera desligada ou fora do Wi-Fi

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR')

export default function CameraFotos() {
  const logado = Boolean(lerSessao())
  // ligando = esperando a 1ª foto nova | ok | sem-sinal | erro | sem-login
  const [estado, setEstado] = useState(logado ? 'ligando' : 'sem-login')
  const [foto, setFoto] = useState(null) // { id, data, url, nova }
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!logado) return undefined
    const controle = new AbortController()
    let timer
    let idInicial = null // a última foto que já existia ao abrir: as de id maior são novas
    let idAtual = 0
    let urlAtual = null
    let ultimaNovaEm = Date.now()
    let chegouNova = false

    async function avisar() {
      // Aba escondida: não avisa, e a câmera para sozinha em alguns segundos
      if (document.hidden) {
        timer = setTimeout(avisar, 1000)
        ultimaNovaEm = Date.now()
        return
      }
      try {
        const info = await olharCamera()
        if (controle.signal.aborted) return
        if (idInicial === null) idInicial = info?.id ?? 0
        if (info && info.id !== idAtual) {
          const url = await baixarFoto(info.id, controle.signal)
          if (controle.signal.aborted) {
            URL.revokeObjectURL(url) // saiu da página enquanto a foto chegava
            return
          }
          if (urlAtual) URL.revokeObjectURL(urlAtual) // libera da memória a foto anterior
          urlAtual = url
          idAtual = info.id
          const nova = info.id > idInicial
          if (nova) {
            chegouNova = true
            ultimaNovaEm = Date.now()
          }
          setFoto({ id: info.id, data: info.criado_em, url, nova })
        }
        setErro('')
        if (Date.now() - ultimaNovaEm > SEM_SINAL_MS) setEstado('sem-sinal')
        else setEstado(chegouNova ? 'ok' : 'ligando')
      } catch (falha) {
        if (controle.signal.aborted) return
        if (falha.status === 401) {
          sair()
          setEstado('sem-login')
          return
        }
        setErro(falha.message)
        setEstado('erro')
      }
      if (!controle.signal.aborted) timer = setTimeout(avisar, AVISO_MS)
    }

    avisar()
    return () => {
      controle.abort()
      clearTimeout(timer)
      if (urlAtual) URL.revokeObjectURL(urlAtual)
      setFoto(null)
    }
  }, [logado])

  const situacao = {
    ligando: 'Acendendo a luz e tirando uma foto nova...',
    ok: 'Uma foto nova a cada 10 segundos enquanto você estiver nesta página.',
    'sem-sinal': 'A câmera não está mandando fotos. Confira se a ESP32-CAM está ligada e no Wi-Fi.',
    erro,
  }

  if (estado !== 'sem-login' && foto) {
    return (
      <figure className="cam-video">
        <img src={foto.url} alt="Foto de dentro da geladeira" />
        <figcaption>
          <span className={`cam-video-selo${foto.nova ? '' : ' is-antiga'}`}>
            <span className="cam-video-ponto" aria-hidden="true" /> {foto.nova ? 'FOTO NOVA' : 'FOTO ANTERIOR'}
          </span>
          Foto de {hora(foto.data)}
          <span className="cam-video-situacao" role="status">
            {situacao[estado]}
          </span>
        </figcaption>
      </figure>
    )
  }

  const avisos = {
    'sem-login': (
      <>
        <Link to="/login">Entre na sua conta</Link> para ver as fotos da sua geladeira.
      </>
    ),
    ...situacao,
  }

  return (
    <div className="cam-video">
      <div className="cam-video-tela">
        <p role="status">{avisos[estado]}</p>
      </div>
    </div>
  )
}
