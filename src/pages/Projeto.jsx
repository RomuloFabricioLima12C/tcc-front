import { SiteLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import { ThemeSvg } from '../components/ThemeImage.jsx'
import { SectionTitle, VideoCard } from '../components/Bits.jsx'
import { img, svg } from '../assets.js'
import '../styles/projeto.css'

const steps = [
  { name: 'Instale o suporte na geladeira', text: 'Posicione o suporte em um local estratégico dentro da geladeira.' },
  { name: 'Acople a câmera e o LED', text: 'Fixe os componentes para melhorar a captura das imagens dos alimentos.' },
  { name: 'Conecte o sistema ao aplicativo', text: 'Ligue o dispositivo e realize a conexão com o app.' },
  { name: 'Cadastre ou identifique os alimentos', text: 'O sistema registra os produtos e suas datas de validade.' },
  {
    name: 'Receba alertas e receitas',
    text: 'Quando um alimento estiver perto de vencer, o usuário recebe notificações e sugestões de receitas.',
  },
  { name: 'Evite desperdícios', text: 'O usuário aproveita melhor os alimentos, economizando e reduzindo perdas.' },
]

// Decorações em volta do vídeo (estrela, triângulo, "explosão" e bolinhas) — usadas também em Jogo/Câmera.
export function VideoDecor({ plainBurst = false }) {
  return (
    <>
      {plainBurst ? (
        <img src={svg.spikyBurstPlain} alt="" className="deco vd-burst vd-burst-plain" />
      ) : (
        <ThemeSvg light={svg.spikyBurst} dark={svg.spikyBurstDark} className="deco vd-burst" />
      )}
      <img src={svg.dotA} alt="" className="deco vd-dot vd-dot-a" />
      <img src={svg.dotB} alt="" className="deco vd-dot vd-dot-b" />
      <img src={svg.dotC} alt="" className="deco vd-dot vd-dot-c" />
      <img src={svg.triangleLime} alt="" className="deco vd-triangle" />
      <img src={svg.starGreen} alt="" className="deco vd-star" />
    </>
  )
}

export default function Projeto() {
  return (
    <SiteLayout title="Nosso projeto">
      <section className="container video-section">
        <SectionTitle as="h1" login>
          NOSSO PROJETO
        </SectionTitle>
        <div className="video-wrap">
          <VideoDecor />
          <VideoCard title="apresentação do projeto" />
        </div>
      </section>

      <section className="container steps-section" aria-labelledby="passos-title">
        <SectionTitle id="passos-title">PASSO A PASSO</SectionTitle>
        <Crop s={img.onionGuy} className="steps-onion desktop-only" />
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.name} className="step-card">
              <div className="step-head">
                <span className="step-badge" aria-hidden="true">
                  <img src={svg.clover} alt="" className="step-clover desktop-only" />
                  <ThemeSvg
                    light={svg.cloverShadow}
                    dark={svg.cloverShadowDark}
                    className="step-clover-top desktop-only"
                  />
                  <img src={svg.cloverSmall} alt="" className="step-clover-m mobile-only" />
                  <span className="step-num">{i + 1}</span>
                </span>
                <h3>{s.name}</h3>
                <img src={svg.blackDot} alt="" className="step-dot desktop-only" />
              </div>
              <img src={svg.stepLine} alt="" className="step-line" />
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </SiteLayout>
  )
}
