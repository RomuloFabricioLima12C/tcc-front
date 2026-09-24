import { SiteLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import { ThemeSvg } from '../components/ThemeImage.jsx'
import { Button, SectionTitle, Sparkle, Stripes } from '../components/Bits.jsx'
import { img, links, svg } from '../assets.js'
import { useTheme } from '../theme.jsx'
import '../styles/home.css'

const about = [
  {
    n: '01',
    title: 'OBJETIVO',
    text: 'Reduzir o desperdício de alimentos por meio de um sistema prático que ajuda no controle da validade dos produtos. O projeto também incentiva a economia doméstica e hábitos mais sustentáveis.',
    char: img.avocado,
  },
  {
    n: '02',
    title: 'PÚBLICO ALVO',
    text: 'Pessoas que querem organizar melhor os alimentos em casa, evitar desperdícios e facilitar o dia a dia, como famílias, estudantes e pessoas que moram sozinhas.',
    char: img.tomatoGuy,
  },
  {
    n: '03',
    title: 'DIFERENCIAL DO PROJETO',
    mobileTitle: 'DIFERENCIAL',
    text: 'Quando um alimento estiver perto do vencimento, o usuário recebe sugestões de receitas com aquele ingrediente. Assim, o projeto ajuda a aproveitar melhor os alimentos de forma prática e inteligente.',
    char: img.milkGuy,
  },
]

const green = 'rgba(0, 218, 58, 0.41)'
const lime = 'rgba(196, 255, 0, 0.46)'

function Hero() {
  const { theme } = useTheme()
  return (
    <section className="hero container">
      <div className="hero-text">
        <p className="hero-kicker">Nosso TCC é um meio de</p>
        <h1 className="hero-title">
          Controle inteligente{' '}
          <br />
          para sua alimentação
        </h1>
        <p className="hero-lead desktop-only">
          O desperdício de alimentos começa dentro de casa: produtos esquecidos, prazos de validade
          ignorados e falta de organização geram prejuízo e impacto ambiental.
        </p>
        <p className="hero-lead hero-motto desktop-only">Mais controle, menos desperdício.</p>
      </div>
      <div className="hero-art">
        {theme === 'dark' ? (
          <>
            <Crop s={img.cucumberDark} className="hero-cucumber-dark" />
            <img src={svg.dotGreenBig} alt="" className="deco hero-dot hero-dot-1" />
            <img src={svg.dotGreen} alt="" className="deco hero-dot hero-dot-2" />
            <img src={svg.dotGreen} alt="" className="deco hero-dot hero-dot-3" />
          </>
        ) : (
          <Crop s={img.cucumber} className="hero-cucumber" />
        )}
      </div>
      <Sparkle className="hero-sparkle mobile-only" />
      <a href="#sobre" className="hero-scroll desktop-only" aria-label="Ir para Sobre o projeto">
        <ThemeSvg light={svg.chevronDown} dark={svg.chevronDownDark} />
      </a>
    </section>
  )
}

export default function Home() {
  return (
    <SiteLayout>
      <div className="mobile-only">
        <SectionTitle login>SOBRE O PROJETO</SectionTitle>
      </div>

      <Hero />

      <section className="about container" id="sobre" aria-labelledby="sobre-title">
        <ThemeSvg light={svg.burstLeft} dark={svg.burstLeftDark} className="deco about-burst" />
        <img src={svg.heroGlowDark} alt="" className="deco about-glow dark-only" />
        <div className="desktop-only">
          <SectionTitle size="lg" id="sobre-title">
            SOBRE O PROJETO
          </SectionTitle>
        </div>
        <div className="about-list">
          {about.map((item, i) => (
            <article key={item.n} className={`card about-card about-card-${i + 1}`}>
              <h3 className="about-card-title">
                <span className="about-num desktop-only">{item.n}</span>
                <span className="desktop-only">{item.title}</span>
                <span className="mobile-only">{item.mobileTitle ?? item.title}</span>
              </h3>
              <p>{item.text}</p>
              <Sparkle />
              <div className="mobile-only about-extra">
                <Stripes a={green} b={lime} width={64.75} height={41.33} offset={-44} />
                <Crop s={item.char} className="about-char" />
              </div>
            </article>
          ))}
        </div>
        <ThemeSvg light={svg.burstRight} dark={svg.burstRightDark} className="deco services-burst" />
      </section>

      <section className="services container desktop-only" aria-labelledby="servicos-title">
        <SectionTitle size="lg" id="servicos-title">
          NOSSOS SERVIÇOS
        </SectionTitle>
        <div className="services-grid">
          <article className="card promo-card promo-feedback">
            <Stripes a={green} b={lime} />
            <h3>Queremos ouvir você!</h3>
            <p>
              Sua opinião é muito importante para nós e ajuda a melhorar cada vez mais o nosso site. Se
              encontrou algo que pode ser ajustado, teve alguma dificuldade ou simplesmente quer
              compartilhar uma sugestão, envie seu feedback!
            </p>
            <div className="promo-actions">
              <Button href={links.contato}>FEEDBACK</Button>
            </div>
            <Crop s={img.avocado} className="promo-char" />
            <Sparkle />
          </article>

          <article className="card promo-card promo-redes">
            <Stripes a={green} b="rgba(255, 255, 255, 0.65)" />
            <h3>Siga nossas redes sociais</h3>
            <p>
              Seu apoio e acompanhamento fazem toda a diferença nessa jornada acadêmica.
              <br />
              Siga nossas redes e venha acompanhar a evolução do nosso TCC!
            </p>
            <div className="promo-actions">
              <Button to="/quem-somos#redes">SEGUIR</Button>
            </div>
            <Crop s={img.tomatoGuy} className="promo-char" />
            <Sparkle />
          </article>

          <article className="card promo-card promo-contato">
            <Stripes a="#f5f5f5" b="rgba(165, 211, 15, 0.65)" />
            <h3>Entre em contato conosco</h3>
            <p>
              Tem alguma dúvida, sugestão ou deseja saber mais sobre o nosso projeto de TCC? Estamos
              disponíveis para ouvir você e trocar ideias sobre o desenvolvimento do projeto.
            </p>
            <div className="promo-actions">
              <Button href={links.contato}>CONTATO</Button>
            </div>
            <Crop s={img.milkGuy} className="promo-char" />
            <Sparkle />
          </article>
        </div>
      </section>
    </SiteLayout>
  )
}

