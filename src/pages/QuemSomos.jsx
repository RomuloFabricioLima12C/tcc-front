import { SiteLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import ThemeCrop from '../components/ThemeImage.jsx'
import { Button, SectionTitle, Sparkle, Stripes } from '../components/Bits.jsx'
import { img, links } from '../assets.js'
import '../styles/quemsomos.css'

// `fit` encaixa cada foto numa caixa quadrada com o círculo sempre do mesmo tamanho e
// centralizado (as imagens do Figma têm o círculo em posições diferentes):
// w = largura da imagem, x/y = deslocamento — tudo em frações do tamanho da caixa.
const team = [
  {
    name: 'Laura e Victor',
    role: 'Líder e Desenvolvedor do game',
    photo: img.teamLauraVictor,
    photoDark: img.teamLauraVictorDark,
    fit: { w: 1.3713, x: -0.2907, y: -0.1598 },
  },
  {
    name: 'Enzo B.',
    role: 'Responsável pela robótica',
    photo: img.teamEnzo,
    photoDark: img.teamEnzoDark,
    fit: { w: 1.3683, x: -0.0694, y: -0.0882 },
  },
  {
    name: 'Rômulo',
    role: 'Programador principal de backend',
    photo: img.teamRomulo,
    photoDark: img.teamRomuloDark,
    fit: { w: 1.4079, x: -0.073, y: -0.1651 },
  },
  {
    name: 'Gabriel',
    role: 'Designer',
    photo: img.teamGabriel,
    photoDark: img.teamGabrielDark,
    fit: { w: 1.2438, x: -0.1902, y: -0.0851 },
  },
]

const socials = [
  { label: 'LAURA', href: links.instagram.laura },
  { label: 'VICTOR', href: links.instagram.victor },
  { label: 'ENZO', href: links.instagram.enzo },
  { label: 'RÔMULO', href: links.instagram.romulo },
  { label: 'GABRIEL', href: links.instagram.gabriel },
]

const green = 'rgba(0, 218, 58, 0.41)'
const white = 'rgba(255, 255, 255, 0.65)'

export default function QuemSomos() {
  return (
    <SiteLayout title="Quem somos">
      <section className="container qs-section">
        <SectionTitle as="h1" login>
          QUEM SOMOS
        </SectionTitle>

        <ul className="team">
          {team.map((m) => (
            <li key={m.name} className="team-member">
              <div className="team-photo-box">
                <ThemeCrop
                  light={m.photo}
                  dark={m.photoDark}
                  alt={`Foto de ${m.name}`}
                  className="team-photo"
                  style={{ '--pw': m.fit.w, '--px': m.fit.x, '--py': m.fit.y }}
                />
              </div>
              <div className="team-text">
                <h2>{m.name}</h2>
                <p>{m.role}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="qs-cards">
          <article className="card qs-card qs-redes" id="redes">
            <Stripes a={green} b={white} width={161} offset={-28} />
            <h2>
              <span className="desktop-only">Siga nossas redes sociais</span>
              <span className="mobile-only">Nossas redes</span>
            </h2>
            <div className="qs-redes-text">
              <p className="desktop-only">
                Gostou do nosso projeto? Então acompanhe a gente para ficar por dentro das novidades,
                atualizações e novas funcionalidades que estamos desenvolvendo! Nosso objetivo é tornar o
                controle de alimentos mais prático, inteligente e sustentável.
                <br />
                Seu apoio é muito importante para nós.
              </p>
              <p>
                Nossos @ estarão disponíveis nos botões abaixo para que você possa acompanhar nossa equipe
                e a evolução do projeto nas redes sociais.
              </p>
            </div>
            <div className="qs-socials">
              {socials.map((s) =>
                s.href ? (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="pill qs-pill">
                    {s.label}
                  </a>
                ) : (
                  <span key={s.label} className="pill qs-pill" title="Instagram em breve">
                    {s.label}
                  </span>
                ),
              )}
            </div>
            <Crop s={img.tacoFriends} className="qs-taco desktop-only" />
            <Sparkle />
          </article>
          <Crop s={img.tacoFriendsAlt} className="qs-taco-alt desktop-only" />

          <article className="card qs-card qs-form">
            <Stripes a={green} b={white} width={161} offset={-28} />
            <h2>
              <span className="desktop-only">FORMULÁRIO</span>
              <span className="mobile-only">Formulários</span>
            </h2>
            <div className="qs-form-text">
              <p className="desktop-only">
                Ficou interessado no nosso projeto ou deseja saber mais?
                <br />
                Entre em contato com a nossa equipe! Sua opinião, dúvidas e sugestões são muito importantes
                para o desenvolvimento da nossa ideia.
              </p>
              <p>
                Preencha o formulário de contato abaixo e fale conosco de forma rápida e prática. Teremos
                prazer em responder você!
              </p>
            </div>
            <div className="qs-actions">
              <Button href={links.contato} className="qs-btn">
                FORMULÁRIO
              </Button>
            </div>
            <Sparkle />
          </article>

          <article className="card qs-card qs-faq mobile-only">
            <Stripes a={green} b={white} width={161} offset={-28} />
            <h2>FAQ</h2>
            <p>
              Preencha o formulário FAQ abaixo, caso tenha alguma dúvida ou reclamação. Estaremos lendo suas
              mensagens!
            </p>
            <div className="qs-actions">
              <Button href={links.faq} className="qs-btn">
                SUPORTE
              </Button>
            </div>
            <Sparkle />
          </article>
        </div>
      </section>
    </SiteLayout>
  )
}
