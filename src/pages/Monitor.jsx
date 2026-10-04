import { SiteLayout } from '../components/Layout.jsx'
import ThemeCrop from '../components/ThemeImage.jsx'
import { Button, SectionTitle, Sparkle, Stripes } from '../components/Bits.jsx'
import CameraAoVivo from '../components/CameraAoVivo.jsx'
import { VideoDecor } from './Projeto.jsx'
import { InterestCard, green, white } from './Jogo.jsx'
import { img } from '../assets.js'
import '../styles/projeto.css'
import '../styles/jogo.css'

// Telas "Câmera" e "Monitoramento" (mesmo layout no Figma, muda só o título).
export default function Monitor({ title }) {
  return (
    <SiteLayout title={title}>
      <section className="container video-section">
        <SectionTitle as="h1" size={title.length > 8 ? 'md' : 'sm'} login>
          {title.toUpperCase()}
        </SectionTitle>
        <div className="video-wrap">
          <VideoDecor plainBurst />
          <CameraAoVivo />
        </div>
      </section>

      <section className="container game-section">
        <div className="game-card-wrap">
          <article className="card card-soft feature-card is-short">
            <Stripes a={green} b={white} width={161} offset={-42} />
            <h2>MONITORE SEUS ALIMENTOS</h2>
            <p>
              Acompanhar as datas de vencimento dos produtos ajuda a evitar perdas, economizar dinheiro e
              garantir maior segurança alimentar. Com uma organização simples e periódica, é possível
              consumir os alimentos no momento certo, aproveitando melhor cada item e contribuindo para um
              consumo mais consciente e sustentável.
            </p>
            <Sparkle />
          </article>
        </div>

        <div className="interest-row is-monitor">
          <InterestCard
            compact
            text="Confira o relatório para uma análise mais completa dos alimentos monitorados."
            action={<Button to="/relatorio">RELATÓRIO</Button>}
          />
          <ThemeCrop light={img.cucumber} dark={img.cucumberDark} className="monitor-cucumber" />
        </div>
      </section>
    </SiteLayout>
  )
}
