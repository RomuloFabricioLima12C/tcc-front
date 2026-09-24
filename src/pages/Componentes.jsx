import { SiteLayout } from '../components/Layout.jsx'
import Crop from '../components/Crop.jsx'
import { SectionTitle, Sparkle } from '../components/Bits.jsx'
import { img, svg } from '../assets.js'
import '../styles/componentes.css'

const parts = [
  {
    name: 'LCD / Display TFT',
    price: 'R$130,03',
    text: 'Mostra informações, alertas e receitas diretamente no sistema do projeto.',
    image: img.lcd,
    alt: 'Display LCD TFT',
  },
  {
    name: 'ESP32',
    price: 'R$ 55,72',
    text: 'Controla o funcionamento principal do projeto.',
    image: img.esp32,
    alt: 'Placa ESP32',
    tilt: 'esp32',
  },
  {
    name: 'ESP32-CAM',
    price: 'R$55,86',
    text: 'Captura imagens dos alimentos dentro da geladeira para identificação.',
    image: img.esp32cam,
    alt: 'Módulo ESP32-CAM',
  },
  {
    name: 'LEDs e Jumpers',
    price: 'R$35,00',
    text: 'Os LEDs iluminam a geladeira para melhorar a captura das imagens, enquanto os jumpers realizam a conexão entre os componentes do sistema.',
    image: img.leds,
    alt: 'Pacote de LEDs e cabos jumper',
    tilt: 'leds',
    tall: true,
  },
  {
    name: 'Placa AI Voice',
    price: 'R$120,20',
    text: 'Permite interação por voz, reprodução de áudio e respostas inteligentes no projeto.',
    image: img.aiVoice,
    alt: 'Placa AI Voice com alto-falante',
    tall: true,
  },
]

export default function Componentes() {
  return (
    <SiteLayout title="Componentes">
      <section className="container comp-section">
        <SectionTitle as="h1" login>
          COMPONENTES
        </SectionTitle>

        <div className="card card-soft comp-intro">
          <h2>PRINCIPAIS COMPONENTES</h2>
          <p>
            Nosso projeto utiliza diferentes componentes eletrônicos que trabalham juntos para garantir o
            funcionamento do sistema.
            <br />A seguir, os principais componentes estarão disponíveis em cards com suas respectivas
            funções.
          </p>
          <Sparkle />
        </div>

        <ul className="comp-grid">
          {parts.map((p) => (
            <li key={p.name} className={`comp-card ${p.tall ? 'is-tall' : ''}`}>
              <div className="comp-head">
                <span className="comp-price">
                  <img src={svg.priceBurst} alt="" />
                  <span>{p.price}</span>
                </span>
                <h3>{p.name}</h3>
                <Crop s={img.sparkle} className="sparkle comp-sparkle" />
              </div>
              <img src={svg.stepLineAlt} alt="" className="comp-line" />
              <div className={`comp-media ${p.tilt ? `tilt-${p.tilt}` : ''}`}>
                <Crop s={p.image} alt={p.alt} />
              </div>
              <p>{p.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </SiteLayout>
  )
}
