// =====================================================================
// Quadro da câmera: mostra a última foto mandada pela ESP32-CAM da robótica,
// atualiza sozinho a cada 10 s e tem o botão "Ver câmera". Sem login, mostra o quadro do design
// com um convite para entrar.
// =====================================================================
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { VideoCard } from './Bits.jsx'
import { buscarUltimaFoto, lerSessao, pedirFoto, sair } from '../api.js'

const hora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function CameraAoVivo() {
  const logado = Boolean(lerSessao())
  const [foto, setFoto] = useState(null)
  const [estado, setEstado] = useState(logado ? 'carregando' : 'sem-login')
  const [erro, setErro] = useState('')
  const urlAnterior = useRef(null)
  const atualizarRef = useRef(() => {})
  const [pedindo, setPedindo] = useState(false)

  useEffect(() => {
    if (!logado) return undefined
    let ativo = true

    async function atualizar() {
      try {
        const nova = await buscarUltimaFoto()
        if (!ativo) return
        if (!nova) {
          setEstado('sem-foto')
          return
        }
        // libera da memória a foto anterior antes de trocar
        if (urlAnterior.current) URL.revokeObjectURL(urlAnterior.current)
        urlAnterior.current = nova.url
        setFoto(nova)
        setEstado('ok')
      } catch (falha) {
        if (!ativo) return
        if (falha.status === 401) {
          sair()
          setEstado('sem-login')
          return
        }
        setErro(falha.message)
        setEstado('erro')
      }
    }

    atualizarRef.current = atualizar
    atualizar()
    const timer = setInterval(atualizar, 10000)
    return () => {
      ativo = false
      clearInterval(timer)
      if (urlAnterior.current) URL.revokeObjectURL(urlAnterior.current)
    }
  }, [logado])

  // Botão "Ver câmera": pede uma foto nova e busca de novo depois de alguns segundos
  const tirarAgora = async () => {
    setPedindo(true)
    try {
      await pedirFoto()
      setTimeout(() => atualizarRef.current(), 5000)
      setTimeout(() => {
        atualizarRef.current()
        setPedindo(false)
      }, 9000)
    } catch (falha) {
      setErro(falha.message)
      setPedindo(false)
    }
  }

  const botao = logado && estado !== 'sem-login' && (
    <button type="button" className="cam-botao" onClick={tirarAgora} disabled={pedindo}>
      {pedindo ? 'Abrindo a câmera...' : 'Ver câmera'}
    </button>
  )

  if (estado === 'ok' && foto) {
    return (
      <figure className="cam-foto">
        <img src={foto.url} alt={`Foto da geladeira tirada em ${hora(foto.data)}`} />
        <figcaption>
          <span className="cam-ponto" aria-hidden="true" /> Foto de {hora(foto.data)} · atualiza sozinha
        </figcaption>
        {botao}
      </figure>
    )
  }

  const avisos = {
    'sem-login': (
      <>
        <Link to="/login">Entre na sua conta</Link> para ver a câmera da sua geladeira.
      </>
    ),
    carregando: 'Carregando a última foto...',
    'sem-foto': 'A câmera ainda não mandou nenhuma foto. Ligue a ESP32-CAM ou toque em “Ver câmera”.',
    erro,
  }

  return (
    <div className="cam-vazia">
      <VideoCard title="imagem da câmera" />
      <p className="cam-aviso" role="status">
        {avisos[estado]}
      </p>
      {botao}
    </div>
  )
}
