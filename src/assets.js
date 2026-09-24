// Recortes das imagens exportadas do Figma.
// Muitas imagens do design são "folhas" com várias ilustrações; cada recorte guarda
// o tamanho do quadro no Figma (w × h) e como a imagem-fonte é posicionada dentro
// dele (iw/ih = largura/altura em %, l/t = deslocamento em %), exatamente como no arquivo.
const f = (name) => `/figma/${name}`

const crop = (file, w, h, iw, ih, l, t, extra = {}) => ({ src: f(file), w, h, iw, ih, l, t, ...extra })

export const img = {
  // Marca
  logo: crop('eef0f.png', 163, 124, 625.06, 1155.88, -37.46, -113.96),
  logoDark: crop('29bff.png', 214, 158, 447.47, 858.37, -175.32, -216.31),
  logoFooter: crop('ed84f.png', 127, 121, 687.26, 406.41, -288.75, -150),

  // Botão de tema (lua = claro, sol = escuro)
  toggleLight: crop('80213.png', 93, 59, 311.45, 689.66, -104.41, -174.83),
  toggleDark: crop('38ebe.png', 90, 46, 199.15, 549.45, -51.27, -155.22, { flipX: true }),

  // Sublinhado com estrela dos títulos de seção
  underline: crop('c74b2.png', 497, 60, 111.43, 1315.79, -5.75, -305.26, { flipY: true }),
  underlineDark: crop('bda0f.png', 409, 111, 387.4, 2020.2, -149.32, -516.16),

  // Estrelinhas dos cards
  sparkle: crop('4b336.png', 53, 55, 1288.99, 1750.07, -342.77, -443.51),
  sparkleDark: crop('5fbc5.png', 111, 124, 1273.87, 1612.9, -828.83, -293.55),

  // Ilustrações
  cucumber: crop('4b336.png', 689, 575, 212.95, 361.01, -54.37, -41.34),
  cucumberDark: crop('5fbc5.png', 651, 505, 217.2, 396.04, -60.68, -50.1),
  avocado: crop('4fd63.png', 200, 133, 226.6, 484.26, -62.02, -175.54),
  tomatoGuy: crop('acf68.png', 144, 191, 484.25, 516.8, -191.78, -221.96, { flipX: true }),
  milkGuy: crop('829c7.png', 167, 186, 232.18, 294.99, -75.53, -70.8),
  play: crop('cae2a.png', 240, 245, 589.17, 816.33, -244.17, -358.16),
  onionGuy: crop('91916.png', 177, 194, 235.67, 304.88, -64, -101.83),
  tacoFriends: crop('cf429.png', 212, 218, 229.17, 316.46, -70.99, -158.23),
  tacoFriendsAlt: crop('cf429.png', 240, 246, 229.17, 316.46, -42.46, -35.44, { flipX: true }),
  blueberry: crop('028a2.png', 245, 174, 331.92, 662.25, -110.33, -50.99),
  carrot: crop('be9d3.png', 215, 188, 401.7, 649.35, -144.6, -47.4),
  salami: crop('dbf2e.png', 238, 228, 368.23, 543.48, -128.13, -90.22),
  salamiAvatar: crop('dbf2e.png', 118, 111, 427.52, 646.3, -164.86, -126.2),
  tomato: crop('1ac43.png', 236, 211, 376.06, 595.24, -139.1, -373.81),
  burgerGuy: crop('1558c.png', 188, 251, 219.53, 233.15, -61.29, -59.9),
  lyingGuy: crop('1558c.png', 296, 171, 213.6, 523.56, -22.81, -357.33),
  burger: crop('e6910.png', 268, 195, 212.95, 413.22, -43.83, -123.97),
  characters: crop('e7465.png', 515, 340, 210.3, 179.03, -43.37, -29.96),

  // Login / cadastro (painel espacial)
  space: crop('8d02a.png', 765, 1903, 212.56, 120.86, -0.01, -14.45),
  carrotPlanet: crop('8d02a.png', 392, 512, 337.99, 366.02, -209.56, -152.34),
  tomatoPlanet: crop('54f60.png', 466, 365, 346.57, 625, -126.23, -397.5),
  tomatoPlanetHalf: crop('54f60.png', 287, 365, 562.72, 625, -204.95, -397.5),
  whiteStar: crop('5fbc5.png', 179, 200, 1273.87, 1612.9, -828.83, -293.55),

  // Equipe
  teamLauraVictor: crop('d3ebc.png', 322, 294, 175.18, 107.78, -38.87, -7.78),
  teamEnzo: crop('6bd48.png', 324, 286, 156.99, 100, -28.86, 0),
  teamRomulo: crop('df046.png', 343, 307, 159.47, 100, -27.91, 0),
  teamGabriel: crop('c6b01.png', 301, 286, 178.77, 105.68, -40.78, 0),
  // Versões do tema escuro (traços pretos em branco), geradas a partir das originais
  teamLauraVictorDark: crop('d3ebc-escuro.png', 322, 294, 175.18, 107.78, -38.87, -7.78),
  teamEnzoDark: crop('6bd48-escuro.png', 324, 286, 156.99, 100, -28.86, 0),
  teamRomuloDark: crop('df046-escuro.png', 343, 307, 159.47, 100, -27.91, 0),
  teamGabrielDark: crop('c6b01-escuro.png', 301, 286, 178.77, 105.68, -40.78, 0),

  // Componentes
  lcd: crop('aebc9.png', 312, 196, 169.91, 152.11, -34.16, -24.51),
  esp32: crop('3c790.png', 209, 224, 234.15, 122.87, -62.07, -8.08),
  esp32cam: crop('87456.png', 228, 195, 217.69, 143.05, -58.84, -16.56),
  leds: crop('9ed60.png', 343, 204, 140.66, 133.33, -19.93, -10.37),
  aiVoice: crop('bfef8.png', 205, 233, 276.66, 136.71, -90.49, -15.57),

  // Relatório
  chart: crop('f45da.png', 995, 428, 100, 155, 0, -33.75),

  // Mobile
  perfilLabel: crop('d6158.png', 66, 34, 242.12, 657.89, -69.01, -313.16),
  iconProjeto: crop('f4012.png', 32, 32, 942.05, 1315.38, -200.9, -807.69),
  iconComponentes: crop('f4012.png', 32, 33, 942.05, 1315.38, -341.81, -808.97),
  iconQuemSomos: crop('f4012.png', 32, 33, 942.05, 1315.38, -469.93, -818.07),
  iconReferencias: crop('f4012.png', 32, 33, 942.05, 1315.38, -588.68, -812),
  iconGame: crop('f4012.png', 32, 33, 942.05, 1315.38, -719.93, -821.1),
}

// SVGs soltos (ícones e decorações vetoriais)
export const svg = {
  search: f('ab24d.svg'),
  chevronDown: f('30e81.svg'),
  chevronDownDark: f('db500.svg'),
  cardLine: f('a447e.svg'),
  burstLeft: f('ae4ef.svg'),
  burstRight: f('fce05.svg'),
  burstLeftDark: f('61977.svg'),
  burstRightDark: f('3662c.svg'),
  heroGlowDark: f('43dae.svg'),
  dotGreenBig: f('478c5.svg'),
  dotGreen: f('1703d.svg'),
  starGreen: f('219ad.svg'),
  triangleLime: f('dc2c5.svg'),
  spikyBurst: f('6c9a7.svg'),
  spikyBurstDark: f('17ab7.svg'),
  spikyBurstPlain: f('f2e56.svg'),
  dotA: f('b73e6.svg'),
  dotB: f('d0a3a.svg'),
  dotC: f('acef3.svg'),
  clover: f('c6905.svg'),
  cloverWide: f('62c6f.svg'),
  cloverShadow: f('d724c.svg'),
  cloverShadowDark: f('796e8.svg'),
  blackDot: f('df5e6.svg'),
  stepLine: f('7c516.svg'),
  stepLineAlt: f('b084d.svg'),
  priceBurst: f('3e718.svg'),
  refsBurstLeft: f('b545f.svg'),
  refsBurstRight: f('02108.svg'),
  // Relatório
  tableDivider: f('f698c.svg'),
  chartStar: f('1e332.svg'),
  chartTriangle: f('04e20.svg'),
  chartBurst: f('8577d.svg'),
  chartDotA: f('350c0.svg'),
  chartDotB: f('9404a.svg'),
  chartDotC: f('aca9e.svg'),
  chartLineTop: f('6082e.svg'),
  chartLineLeft: f('24a0e.svg'),
  chartLineRight: f('cd639.svg'),
  chartLineBottom: f('e814c.svg'),
  // Mobile
  tabBump: f('4742a.svg'),
  toggleDot: f('7d301.svg'),
  homeHouse: f('4be18.svg'),
  homeDoor: f('d0f81.svg'),
  cloverSmall: f('0d5ed.svg'),
  cloverRecurso: f('699c6.svg'),
  lineSmall: f('eebc1.svg'),
  backArrow: f('ac3a6.svg'),
  backArrowAlt: f('fb8d6.svg'),
  chevronRight: f('596ba.svg'),
  cartWheel: f('5dd1b.svg'),
  cartBody: f('974a0.svg'),
  dash: f('5ffb0.svg'),
  book: f('1d5eb.svg'),
}

export const links = {
  contato:
    'https://docs.google.com/forms/d/e/1FAIpQLSdY4md4Ae555KJaiwJridBaJFBsjwxvO7ZzLC86b0eL7r5lFQ/viewform?usp=publish-editor',
  faq: 'https://docs.google.com/forms/d/e/1FAIpQLSfwXNpS_fgRojmjS0fnF0WOaI9_c9e_ejyEnvuW59xaopeNsQ/viewform?usp=publish-editor',
  jogo: 'https://gd.games/games/65541e20-0dd7-4d96-b6e8-9c42480f8411',
  instagram: {
    laura: 'https://www.instagram.com/laurarodrigues_araujo/',
    victor: 'https://www.instagram.com/oli.fustte/',
    enzo: 'https://www.instagram.com/gfelix270109/',
    romulo: 'https://www.instagram.com/rml.og/',
  },
}
