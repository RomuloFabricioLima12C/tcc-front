import { SiteLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import { Button, SectionTitle, Sparkle, Stripes, VideoCard } from '../components/Bits.jsx'
import { VideoDecor } from './Projeto.jsx'
import { img, links } from '../assets.js'
import '../styles/projeto.css'
import '../styles/jogo.css'

export const green = 'rgba(0, 218, 58, 0.41)'
export const lime = 'rgba(196, 255, 0, 0.46)'
export const white = 'rgba(255, 255, 255, 0.65)'

// Card branco "Ficou interessado?" (Jogo e Câmera/Monitoramento).
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

export default function Jogo() {
  return (
    <SiteLayout title="Nosso game">
      <section className="container video-section">
        <SectionTitle as="h1" size="sm" login>
          NOSSO JOGO
        </SectionTitle>
        <div className="video-wrap">
          <VideoDecor plainBurst />
          <VideoCard title="trailer do Freezer Escape" />
        </div>
      </section>

      <section className="container game-section">
        <div className="game-card-wrap">
          <article className="card card-soft feature-card">
            <Stripes a={green} b={white} width={161} offset={-28} />
            <h2>FREEZER ESCAPE</h2>
            <p>
              Após comprar uma misteriosa geladeira na loja do velho ancião Márcio Marçal, Guilherme começa
              a ouvir sons estranhos vindos da cozinha durante a noite. Ao abrir a porta da geladeira, ele é
              sugado para um mundo escondido entre alimentos e corredores congelados, onde descobre que o
              terrível Rei Mofão está espalhando deterioração e desperdício por toda a geladeira. Para
              conseguir escapar e restaurar o equilíbrio do local, Guilherme precisa atravessar diferentes
              setores — do freezer até a gaveta de legumes — enfrentando criaturas contaminadas e desafios
              inspirados na conservação, validade e armazenamento correto dos alimentos.
            </p>
            <Crop s={img.burgerGuy} className="feature-char" />
          </article>
          <Crop s={img.burger} className="game-burger" />
        </div>

        <div className="interest-row">
          <InterestCard
            text="Entre nessa aventura gelada, enfrente o terrível Rei Mofão e descubra se você consegue salvar a geladeira antes que todos os alimentos sejam perdidos!"
            action={<Button href={links.jogo}>JOGAR</Button>}
          />
          <Crop s={img.characters} alt="Personagens do jogo" className="game-characters" />
        </div>
      </section>
    </SiteLayout>
  )
}
