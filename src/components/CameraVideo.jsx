// =====================================================================
// Vídeo ao vivo da ESP32-CAM (página Relatório).
// Pede quadro após quadro ao backend (api.js → buscarQuadro). Enquanto esta
// tela pede, a câmera continua mandando; ao sair da página, pausar ou trocar
// de aba, os pedidos param e a câmera desliga o vídeo sozinha em alguns segundos.
// =====================================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarQuadro, lerSessao, sair } from '../api.js'
import '../styles/camera-video.css'

const SEM_SINAL_MS = 15000 // sem quadro novo por esse tempo = câmera desligada ou longe do Wi-Fi

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR')

export default function CameraVideo() {
  const logado = Boolean(lerSessao())
  const [estado, setEstado] = useState(logado ? 'conectando' : 'sem-login')
  const [quadro, setQuadro] = useState(null) // { id, data, url }
  const [erro, setErro] = useState('')
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (!logado || pausado) return undefined
    const controle = new AbortController()
    let ultimoId = 0
    let ultimoQuadroEm = Date.now()
    let urlAtual = null

    async function rodar() {
      while (!controle.signal.aborted) {
        // Aba escondida: para de pedir, e a câmera desliga o vídeo sozinha
        if (document.hidden) {
          await esperar(1000)
          ultimoQuadroEm = Date.now()
          continue
        }
        try {
          const novo = await buscarQuadro(ultimoId, controle.signal)
          if (controle.signal.aborted) {
            if (novo) URL.revokeObjectURL(novo.url) // saiu da página enquanto o quadro chegava
            return
          }
          if (novo) {
            ultimoId = novo.id
            ultimoQuadroEm = Date.now()
            if (urlAtual) URL.revokeObjectURL(urlAtual) // libera da memória o quadro anterior
            urlAtual = novo.url
            setQuadro(novo)
            setEstado('ao-vivo')
          } else if (Date.now() - ultimoQuadroEm > SEM_SINAL_MS) {
            setEstado('sem-sinal')
          }
        } catch (falha) {
          if (controle.signal.aborted) return
          if (falha.status === 401) {
            sair()
            setEstado('sem-login')
            return
          }
          setErro(falha.message)
          setEstado('erro')
          await esperar(5000) // tenta de novo daqui a pouco
        }
      }
    }

    rodar()
    return () => {
      controle.abort()
      if (urlAtual) URL.revokeObjectURL(urlAtual)
      setQuadro(null)
    }
  }, [logado, pausado])

  const alternarPausa = () => {
    if (pausado) setEstado('conectando') // vai voltar a pedir quadros
    setPausado(!pausado)
  }

  const botao = logado && estado !== 'sem-login' && (
    <button type="button" className="cam-video-botao" onClick={alternarPausa}>
      {pausado ? 'Continuar vídeo' : 'Pausar vídeo'}
    </button>
  )

  if (!pausado && estado === 'ao-vivo' && quadro) {
    return (
      <figure className="cam-video">
        <img src={quadro.url} alt="Vídeo ao vivo de dentro da geladeira" />
        <figcaption>
          <span className="cam-video-selo">
            <span className="cam-video-ponto" aria-hidden="true" /> AO VIVO
          </span>
          Quadro de {hora(quadro.data)}
        </figcaption>
        {botao}
      </figure>
    )
  }

  const avisos = {
    'sem-login': (
      <>
        <Link to="/login">Entre na sua conta</Link> para ver o vídeo da sua geladeira.
      </>
    ),
    conectando: 'Ligando a câmera... o vídeo começa em alguns segundos.',
    'sem-sinal': 'A câmera não está mandando imagem. Confira se a ESP32-CAM está ligada e no Wi-Fi.',
    erro,
  }

  return (
    <div className="cam-video">
      <div className="cam-video-tela">
        <p role="status">{pausado ? 'Vídeo pausado.' : avisos[estado]}</p>
      </div>
      {botao}
    </div>
  )
}
