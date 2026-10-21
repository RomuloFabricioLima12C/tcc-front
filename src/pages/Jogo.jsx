import { SiteLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import { useEffect, useRef, useState } from 'react'
import { Button, SectionTitle, Sparkle, Stripes } from '../components/Bits.jsx'
import { VideoDecor } from './Projeto.jsx'
import { img, links } from '../assets.js'
import '../styles/projeto.css'
import '../styles/jogo.css'

export const green = 'rgba(0, 218, 58, 0.41)'
export const lime = 'rgba(196, 255, 0, 0.46)'
export const white = 'rgba(255, 255, 255, 0.65)'

// Card branco "Ficou interessado?" (página do Jogo).
export function InterestCard({ text, action, compact = false }) {
  return (
    <article className={`card interest-card ${compact ? 'is-compact' : ''}`}>
      <Stripes a={green} b={lime} />
      <h2>Ficou interessado?</h2>
      <p>{text}</p>
      <div className="interest-actions">{action}</div>
      <Crop s={img.lyingGuy} className="interest-char" />
      <Sparkle />
    </article>
  )
}

// O jogo "Frutas Podres" é um HTML separado (public/jogos/frutas-podres.html).
// Ele roda dentro de um iframe, e a altura acompanha o tamanho do jogo
// (no celular os botões ficam embaixo da tela e ele fica mais alto).
function GameFrame() {
  const frame = useRef(null)
  const [altura, setAltura] = useState(640)

  useEffect(() => {
    const el = frame.current
    let observador
    const medir = () => {
      const doc = el?.contentDocument
      if (doc?.body) setAltura(doc.body.scrollHeight)
    }
    const aoCarregar = () => {
      medir()
      observador = new ResizeObserver(medir)
      observador.observe(el.contentDocument.body)
    }
    el.addEventListener('load', aoCarregar)
    if (el.contentDocument?.readyState === 'complete') aoCarregar()
    return () => {
      el.removeEventListener('load', aoCarregar)
      observador?.disconnect()
    }
  }, [])

  return (
    <iframe
      ref={frame}
      src={links.jogo}
      title="Jogo Frutas Podres"
      className="game-frame"
      style={{ height: altura }}
      allow="autoplay; fullscreen"
    />
  )
}

export default function Jogo() {
  return (
    <SiteLayout title="Nosso game">
      <section className="container video-section">
        <SectionTitle as="h1" size="sm" login>
          NOSSO JOGO
        </SectionTitle>
        <div className="video-wrap">
          <VideoDecor plainBurst />
          <GameFrame />
        </div>
      </section>

      {/* Trailer: preload="metadata" baixa só o começo; o vídeo inteiro (7,9 MB) carrega ao dar play */}
      <section className="container trailer-section" aria-labelledby="trailer-title">
        <SectionTitle id="trailer-title">TRAILER</SectionTitle>
        <video className="trailer-video" src={links.trailer} controls playsInline preload="metadata">
          Seu navegador não consegue mostrar o vídeo. <a href={links.trailer}>Baixe o trailer</a>.
        </video>
      </section>

      <section className="container game-section">
        <div className="game-card-wrap">
          <article className="card card-soft feature-card">
            <Stripes a={green} b={white} width={161} offset={-28} />
            <h2>FRUTAS PODRES</h2>
            <p>
              No Campo do Chorume, as frutas que ninguém comeu apodrecem... e ganham vida! Guilherme chega ao
              laboratório do Professor Benones, escolhe sua primeira fruta podre e parte em uma aventura pela
              Vila do Chorume, pela Floresta Azeda, pelo Litoral do Sal e pelo Vale do Açúcar. Ande pelo mato
              alto para encontrar frutas selvagens, capture-as com potes de vidro, monte uma equipe de até
              seis criaturas e enfrente os líderes dos ginásios — Seu Mané, o Rei da Xepa, o Prof. Márcio e o
              Prof. Petermann — para conquistar as três insígnias e virar o Campeão do Chorume. Uma aventura
              cheia de golpes divertidos que mostra, brincando, o que acontece com a comida que a gente
              esquece e desperdiça.
            </p>
            <Crop s={img.burgerGuy} className="feature-char" />
          </article>
          <Crop s={img.burger} className="game-burger" />
        </div>

        <div className="interest-row">
          <InterestCard
            text="Escolha sua fruta podre, capture todas as criaturas do Chorume, vença os três ginásios e descubra quem te espera na Vila do Chorume, onde tudo começou!"
            action={<Button href={links.jogo}>JOGAR EM TELA CHEIA</Button>}
          />
          <Crop s={img.characters} alt="Personagens do jogo" className="game-characters" />
        </div>
      </section>
    </SiteLayout>
  )
}
