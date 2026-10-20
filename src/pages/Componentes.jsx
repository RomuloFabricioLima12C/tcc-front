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
    name: 'Expansão ESP32 30 pinos',
    price: 'R$22,90',
    text: 'Base onde o ESP32 é encaixado: facilita a ligação dos fios e distribui 5 V e 3,3 V para os componentes.',
    image: img.expansaoEsp32,
    alt: 'Placa de expansão para ESP32 de 30 pinos',
  },
  {
    name: 'ESP32-CAM',
    price: 'R$55,86',
    text: 'Captura imagens dos alimentos dentro da geladeira para identificação.',
    image: img.esp32cam,
    alt: 'Módulo ESP32-CAM',
  },
  {
    name: 'Fita de LED',
    price: 'R$49,44',
    text: 'Ilumina o interior da geladeira enquanto alguém assiste a câmera ao vivo no site, para a imagem ficar nítida.',
    image: img.fitaLed,
    alt: 'Rolo de fita de LED RGB com controle remoto',
  },
  {
    name: 'Módulo Relé 5V',
    price: 'R$6,40',
    text: 'Funciona como um interruptor controlado pela ESP32-CAM: liga a fita de LED quando alguém abre a câmera no site.',
    image: img.rele,
    alt: 'Módulo relé de 1 canal 5 V',
  },
  {
    name: 'Fonte Chaveada 5V',
    price: 'R$59,90',
    text: 'Transforma a energia da tomada em 5 V para alimentar as placas, o módulo de voz e a fita de LED.',
    image: img.fonte,
    alt: 'Fonte chaveada 5 V de caixa metálica',
  },
  {
    name: 'AI Voice ESP32-S3',
    price: 'R$279,00',
    text: 'Placa ESP32-S3 N16R8 com microfone e alto-falante: permite conversar por voz com a geladeira e ouvir as respostas.',
    image: img.aiVoice,
    alt: 'Placa AI Voice ESP32-S3 N16R8 com alto-falante e cabo USB',
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
