// =====================================================================
// Receitas que já vêm no Lab Cam. A API grava as que ainda não existem no banco
// quando liga (servicos/receitas.js -> cadastrarPadrao). Fácil de editar:
//   - "chaves": palavras que ligam o ingrediente a um alimento da geladeira
//     (sem acento; o plural é reconhecido sozinho: "ovos" combina com "ovo");
//   - "basico": true = item de despensa (sal, açúcar, farinha...), que não conta como falta.
// Para mudar uma receita que já está no banco, troque o nome dela (ou apague no banco).
// =====================================================================

const FRUTAS = ['banana', 'maca', 'laranja', 'morango', 'uva', 'manga', 'mamao', 'abacaxi', 'pera', 'melancia', 'melao', 'kiwi', 'goiaba', 'mexerica', 'tangerina']
const PAO = ['pao', 'paes']
const QUEIJO = ['queijo', 'mucarela', 'mussarela']
const OVO = ['ovo']
const LEITE = ['leite']
const FRANGO = ['frango']
const PRESUNTO = ['presunto', 'apresuntado', 'peru']
const CHOCOLATE = ['chocolate', 'achocolatado']

// atalhos para escrever as receitas
const ing = (nome, quantidade, chaves) => ({ nome, quantidade, chaves })
const basico = (nome, quantidade) => ({ nome, quantidade, basico: true })

module.exports = [
  // ---------------- As três primeiras (apresentação) ----------------
  {
    nome: 'Omelete de queijo e tomate',
    tempo_minutos: 10,
    porcoes: '1 porção',
    ingredientes: [
      ing('Ovo', '3 ovos', OVO),
      ing('Queijo', '2 fatias de queijo', QUEIJO),
      ing('Tomate', '1 tomate picado', ['tomate']),
      ing('Cebola', '1/2 cebola picada', ['cebola']),
      basico('Sal e azeite', 'a gosto'),
    ],
    passos: [
      'Bata os ovos com uma pitada de sal.',
      'Refogue a cebola e o tomate numa frigideira com um fio de azeite.',
      'Despeje os ovos, espalhe o queijo por cima e tampe a frigideira.',
      'Cozinhe em fogo baixo por 4 a 5 minutos, dobre ao meio e sirva.',
    ],
  },
  {
    nome: 'Vitamina de banana com morango',
    tempo_minutos: 5,
    porcoes: '2 copos',
    ingredientes: [
      ing('Leite', '400 ml de leite', LEITE),
      ing('Banana', '2 bananas maduras', ['banana']),
      ing('Morango', '6 morangos', ['morango']),
      basico('Açúcar ou mel', 'a gosto'),
    ],
    passos: [
      'Lave os morangos e tire as folhinhas.',
      'Bata no liquidificador o leite, as bananas e os morangos.',
      'Adoce a gosto e sirva gelado.',
    ],
  },
  {
    nome: 'Frango com batata e cenoura',
    tempo_minutos: 40,
    porcoes: '3 porções',
    ingredientes: [
      ing('Frango', '500 g de frango em cubos', FRANGO),
      ing('Batata', '3 batatas em cubos', ['batata']),
      ing('Cenoura', '2 cenouras em rodelas', ['cenoura']),
      ing('Cebola', '1 cebola picada', ['cebola']),
      basico('Alho, sal e azeite', 'a gosto'),
    ],
    passos: [
      'Tempere o frango com alho e sal.',
      'Doure o frango numa panela com azeite e junte a cebola.',
      'Acrescente a batata, a cenoura e 1 xícara de água.',
      'Tampe e cozinhe por 20 a 25 minutos, até os legumes ficarem macios.',
    ],
  },

  // ---------------- Leite ----------------
  {
    nome: 'Panqueca simples',
    tempo_minutos: 20,
    porcoes: '4 panquecas',
    ingredientes: [
      ing('Leite', '1 xícara de leite', LEITE),
      ing('Ovo', '1 ovo', OVO),
      basico('Farinha de trigo', '1 xícara'),
      basico('Sal', '1 pitada'),
    ],
    passos: [
      'Misture o leite, o ovo, a farinha de trigo e o sal até ficar uma massa lisa.',
      'Coloque uma concha da massa numa frigideira untada e doure dos dois lados.',
    ],
  },
  {
    nome: 'Mingau de aveia',
    tempo_minutos: 10,
    porcoes: '1 tigela',
    ingredientes: [
      ing('Leite', '1 xícara de leite', LEITE),
      basico('Aveia', '3 colheres (sopa)'),
      basico('Açúcar', '1 colher (sopa)'),
    ],
    passos: [
      'Coloque o leite, a aveia e o açúcar numa panela.',
      'Aqueça em fogo baixo, mexendo sem parar, até engrossar.',
    ],
  },
  {
    nome: 'Bolo de leite',
    tempo_minutos: 50,
    porcoes: '8 fatias',
    ingredientes: [
      ing('Leite', '1 xícara de leite', LEITE),
      ing('Ovo', '3 ovos', OVO),
      basico('Açúcar', '1 xícara'),
      basico('Farinha de trigo', '2 xícaras'),
      basico('Fermento', '1 colher (sopa)'),
    ],
    passos: [
      'Misture o leite, os ovos e o açúcar.',
      'Junte a farinha e, por último, o fermento.',
      'Asse em forma untada a 180 °C por cerca de 40 minutos, até dourar.',
    ],
  },

  // ---------------- Ovos ----------------
  {
    nome: 'Ovos mexidos',
    tempo_minutos: 5,
    porcoes: '1 porção',
    ingredientes: [
      ing('Ovo', '2 ovos', OVO),
      ing('Manteiga', '1 colher (chá) de manteiga', ['manteiga']),
      basico('Sal', 'a gosto'),
    ],
    passos: ['Bata os ovos e tempere com sal.', 'Cozinhe numa frigideira com a manteiga, mexendo até firmar.'],
  },
  {
    nome: 'Ovo cozido',
    tempo_minutos: 15,
    porcoes: '1 porção',
    ingredientes: [ing('Ovo', '1 ou mais ovos', OVO)],
    passos: [
      'Coloque o ovo com cuidado numa panela com água fervente.',
      'Cozinhe por 9 a 12 minutos e passe para água fria antes de descascar.',
    ],
  },

  // ---------------- Queijo ----------------
  {
    nome: 'Torrada com queijo',
    tempo_minutos: 5,
    porcoes: '1 porção',
    ingredientes: [ing('Pão', '2 fatias de pão', PAO), ing('Queijo', '2 fatias de queijo', QUEIJO)],
    passos: ['Coloque o queijo sobre o pão.', 'Aqueça na frigideira ou no forno até o queijo derreter.'],
  },
  {
    nome: 'Macarrão com queijo',
    tempo_minutos: 20,
    porcoes: '2 porções',
    ingredientes: [
      ing('Macarrão', '200 g de macarrão', ['macarrao']),
      ing('Queijo', '1 xícara de queijo ralado', QUEIJO),
      ing('Leite', '1/2 xícara de leite', LEITE),
    ],
    passos: ['Cozinhe o macarrão e escorra.', 'Misture com o queijo e o leite em fogo baixo até ficar cremoso.'],
  },
  {
    nome: 'Tapioca com queijo',
    tempo_minutos: 10,
    porcoes: '1 tapioca',
    ingredientes: [
      ing('Tapioca', '3 colheres (sopa) de goma de tapioca', ['tapioca']),
      ing('Queijo', '2 fatias de queijo', QUEIJO),
    ],
    passos: [
      'Espalhe a goma numa frigideira quente até formar o disco.',
      'Recheie com o queijo, dobre e aqueça até derreter.',
    ],
  },

  // ---------------- Alface ----------------
  {
    nome: 'Salada simples',
    tempo_minutos: 5,
    porcoes: '2 porções',
    ingredientes: [
      ing('Alface', '1 pé de alface', ['alface']),
      ing('Tomate', '1 tomate', ['tomate']),
      basico('Azeite e sal', 'a gosto'),
    ],
    passos: ['Lave e corte a alface e o tomate.', 'Misture e tempere com azeite e sal.'],
  },
  {
    nome: 'Sanduíche natural',
    tempo_minutos: 15,
    porcoes: '2 sanduíches',
    ingredientes: [
      ing('Pão', '4 fatias de pão', PAO),
      ing('Alface', 'folhas de alface', ['alface']),
      ing('Frango', '1 xícara de frango desfiado', FRANGO),
      ing('Cenoura', '1 cenoura ralada', ['cenoura']),
    ],
    passos: ['Rale a cenoura e desfie o frango cozido.', 'Monte o pão com a alface, o frango e a cenoura.'],
  },
  {
    nome: 'Wrap de alface',
    tempo_minutos: 10,
    porcoes: '2 porções',
    ingredientes: [
      ing('Alface', 'folhas grandes de alface', ['alface']),
      ing('Frango', '1 xícara de frango desfiado', FRANGO),
      ing('Tomate', '1 tomate picado', ['tomate']),
    ],
    passos: [
      'Lave as folhas grandes de alface.',
      'Coloque o frango desfiado e o tomate no meio de cada folha e enrole.',
    ],
  },

  // ---------------- Tomate ----------------
  {
    nome: 'Molho de tomate caseiro',
    tempo_minutos: 25,
    porcoes: '4 porções',
    ingredientes: [
      ing('Tomate', '5 tomates', ['tomate']),
      ing('Cebola', '1 cebola', ['cebola']),
      basico('Alho e sal', 'a gosto'),
    ],
    passos: [
      'Pique o tomate, a cebola e o alho.',
      'Refogue a cebola e o alho, junte o tomate e o sal e cozinhe até desmanchar.',
    ],
  },
  {
    nome: 'Tomate recheado',
    tempo_minutos: 25,
    porcoes: '2 porções',
    ingredientes: [ing('Tomate', '2 tomates grandes', ['tomate']), ing('Queijo', '1/2 xícara de queijo ralado', QUEIJO)],
    passos: [
      'Corte a tampa dos tomates e retire o miolo.',
      'Recheie com o queijo e asse a 200 °C por cerca de 15 minutos.',
    ],
  },
  {
    nome: 'Bruschetta',
    tempo_minutos: 15,
    porcoes: '6 fatias',
    ingredientes: [
      ing('Pão', '6 fatias de pão', PAO),
      ing('Tomate', '2 tomates picados', ['tomate']),
      basico('Azeite, sal e orégano', 'a gosto'),
    ],
    passos: [
      'Torre as fatias de pão.',
      'Tempere o tomate picado com azeite, sal e orégano e coloque sobre o pão.',
    ],
  },

  // ---------------- Frutas ----------------
  {
    nome: 'Salada de frutas',
    tempo_minutos: 15,
    porcoes: '4 porções',
    ingredientes: [ing('Frutas', 'frutas variadas picadas', FRUTAS)],
    passos: ['Lave e pique frutas variadas.', 'Misture tudo numa tigela e sirva gelado.'],
  },
  {
    nome: 'Vitamina de frutas',
    tempo_minutos: 5,
    porcoes: '2 copos',
    ingredientes: [ing('Leite', '400 ml de leite', LEITE), ing('Fruta', '1 banana ou outra fruta', FRUTAS)],
    passos: ['Bata no liquidificador o leite com a banana ou outra fruta.', 'Sirva gelado.'],
  },
  {
    nome: 'Panqueca de banana',
    tempo_minutos: 10,
    porcoes: '2 panquecas',
    ingredientes: [ing('Banana', '1 banana madura', ['banana']), ing('Ovo', '1 ovo', OVO)],
    passos: ['Amasse a banana e misture com o ovo.', 'Cozinhe na frigideira untada, virando para dourar os dois lados.'],
  },

  // ---------------- Pão ----------------
  {
    nome: 'Rabanada',
    tempo_minutos: 20,
    porcoes: '6 fatias',
    ingredientes: [
      ing('Pão', '6 fatias de pão amanhecido', PAO),
      ing('Leite', '1 xícara de leite', LEITE),
      ing('Ovo', '2 ovos', OVO),
      basico('Açúcar e canela', 'a gosto'),
    ],
    passos: [
      'Passe as fatias de pão no leite e depois no ovo batido.',
      'Doure na frigideira e passe no açúcar com canela.',
    ],
  },
  {
    nome: 'Pizza de pão',
    tempo_minutos: 15,
    porcoes: '4 fatias',
    ingredientes: [
      ing('Pão', '4 fatias de pão', PAO),
      ing('Molho de tomate', '4 colheres (sopa) de molho de tomate', ['molho', 'tomate']),
      ing('Queijo', '4 fatias de queijo', QUEIJO),
      basico('Orégano', 'a gosto'),
    ],
    passos: ['Cubra o pão com o molho de tomate, o queijo e o orégano.', 'Leve ao forno até o queijo derreter.'],
  },
  {
    nome: 'Pudim de pão',
    tempo_minutos: 60,
    porcoes: '8 porções',
    ingredientes: [
      ing('Pão', '4 pães amanhecidos', PAO),
      ing('Leite', '2 xícaras de leite', LEITE),
      ing('Ovo', '3 ovos', OVO),
      basico('Açúcar', '1 xícara'),
    ],
    passos: [
      'Desmanche o pão no leite.',
      'Junte os ovos e o açúcar e misture bem.',
      'Asse em forma caramelizada, em banho-maria, até firmar (cerca de 45 minutos).',
    ],
  },

  // ---------------- Frios ----------------
  {
    nome: 'Misto-quente',
    tempo_minutos: 10,
    porcoes: '1 porção',
    ingredientes: [
      ing('Pão', '2 fatias de pão', PAO),
      ing('Presunto', '2 fatias de presunto', PRESUNTO),
      ing('Queijo', '2 fatias de queijo', QUEIJO),
    ],
    passos: ['Recheie o pão com o presunto e o queijo.', 'Aqueça na frigideira ou na sanduicheira até dourar.'],
  },
  {
    nome: 'Omelete com frios',
    tempo_minutos: 10,
    porcoes: '1 porção',
    ingredientes: [
      ing('Ovo', '2 ovos', OVO),
      ing('Presunto', '2 fatias de presunto picado', PRESUNTO),
      ing('Queijo', '2 fatias de queijo', QUEIJO),
    ],
    passos: ['Bata os ovos e misture o presunto picado e o queijo.', 'Cozinhe na frigideira em fogo baixo até firmar.'],
  },
  {
    nome: 'Enroladinho de presunto e queijo',
    tempo_minutos: 40,
    porcoes: '12 unidades',
    ingredientes: [
      ing('Presunto', '6 fatias de presunto', PRESUNTO),
      ing('Queijo', '6 fatias de queijo', QUEIJO),
      basico('Massa simples (de pastel ou de pão)', '1 pacote'),
    ],
    passos: [
      'Abra a massa e corte em tiras.',
      'Enrole uma fatia de presunto e uma de queijo em cada tira.',
      'Asse a 180 °C até dourar (cerca de 25 minutos).',
    ],
  },

  // ---------------- Chocolates ----------------
  {
    nome: 'Brigadeiro',
    tempo_minutos: 20,
    porcoes: '20 unidades',
    ingredientes: [
      ing('Leite condensado', '1 lata de leite condensado', ['condensado']),
      ing('Chocolate', '3 colheres (sopa) de chocolate em pó', CHOCOLATE),
      ing('Manteiga', '1 colher (sopa) de manteiga', ['manteiga']),
    ],
    passos: [
      'Coloque o leite condensado, o chocolate e a manteiga numa panela.',
      'Cozinhe em fogo baixo, mexendo, até desgrudar do fundo.',
      'Espere esfriar e enrole as bolinhas.',
    ],
  },
  {
    nome: 'Chocolate quente',
    tempo_minutos: 10,
    porcoes: '2 xícaras',
    ingredientes: [
      ing('Leite', '2 xícaras de leite', LEITE),
      ing('Chocolate', '3 colheres (sopa) de chocolate em pó', CHOCOLATE),
    ],
    passos: ['Aqueça o leite com o chocolate em pó.', 'Mexa sem parar até ficar cremoso.'],
  },
  {
    nome: 'Morango com chocolate',
    tempo_minutos: 15,
    porcoes: '2 porções',
    ingredientes: [ing('Morango', '10 morangos', ['morango']), ing('Chocolate', '100 g de chocolate', CHOCOLATE)],
    passos: [
      'Derreta o chocolate em banho-maria ou no micro-ondas.',
      'Mergulhe os morangos no chocolate e deixe firmar na geladeira.',
    ],
  },

  // ---------------- Vegetais ----------------
  {
    nome: 'Legumes refogados',
    tempo_minutos: 15,
    porcoes: '2 porções',
    ingredientes: [
      ing('Cenoura', '1 cenoura', ['cenoura']),
      ing('Abobrinha', '1 abobrinha', ['abobrinha']),
      ing('Brócolis', '1 maço de brócolis', ['brocolis']),
      basico('Alho e sal', 'a gosto'),
    ],
    passos: ['Pique a cenoura, a abobrinha e o brócolis.', 'Refogue com alho e sal até ficarem macios.'],
  },
  {
    nome: 'Sopa de legumes',
    tempo_minutos: 40,
    porcoes: '4 porções',
    ingredientes: [
      ing('Batata', '2 batatas', ['batata']),
      ing('Cenoura', '1 cenoura', ['cenoura']),
      ing('Abóbora', '1 pedaço de abóbora', ['abobora']),
      basico('Outros vegetais, água e sal', 'a gosto'),
    ],
    passos: [
      'Corte a batata, a cenoura, a abóbora e outros vegetais em cubos.',
      'Cozinhe em água temperada até ficarem macios (cerca de 30 minutos).',
    ],
  },
  {
    nome: 'Legumes assados',
    tempo_minutos: 40,
    porcoes: '3 porções',
    ingredientes: [
      ing('Legumes', 'legumes variados (batata, cenoura, abobrinha...)', [
        'batata',
        'cenoura',
        'abobrinha',
        'abobora',
        'beterraba',
        'berinjela',
        'pimentao',
        'mandioca',
        'chuchu',
      ]),
      basico('Azeite e sal', 'a gosto'),
    ],
    passos: [
      'Corte os vegetais em pedaços.',
      'Tempere com azeite e sal e asse a 200 °C até ficarem macios (cerca de 30 minutos).',
    ],
  },
]
