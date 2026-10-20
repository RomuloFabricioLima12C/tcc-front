-- =====================================================================
-- Banco de dados do Lab Cam
-- Duas tabelas: "usuarios" (quem usa o sistema) e "alimentos" (o que
-- está na geladeira/despensa de cada usuário).
-- Pode rodar este arquivo mais de uma vez: o "IF NOT EXISTS" evita erro.
-- =====================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,                  -- número automático (1, 2, 3...)
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(160) NOT NULL UNIQUE,        -- não deixa repetir e-mail
  senha_hash  VARCHAR(100) NOT NULL,               -- a senha NUNCA é guardada pura, só o hash do bcrypt
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Foto de perfil: o nome da fruta escolhida no site (ex.: 'tomate'). NULL = ainda não escolheu.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar VARCHAR(20);

-- Foto de perfil enviada pela pessoa (do celular ou do computador). O site já manda
-- a imagem pequena (256x256, JPEG) no formato "data:image/jpeg;base64,...".
-- Quando existe, aparece no lugar da fruta.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto TEXT;

CREATE TABLE IF NOT EXISTS alimentos (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                                                   -- FK: todo alimento pertence a um usuário;
                                                   -- se o usuário for apagado, os alimentos dele também são
  nome           VARCHAR(100) NOT NULL,
  categoria      VARCHAR(50),                      -- ex.: Laticínio, Embutido... (opcional)
  quantidade     INTEGER      NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  data_validade  DATE         NOT NULL,
  origem         VARCHAR(10)  NOT NULL DEFAULT 'site'
                 CHECK (origem IN ('site', 'touch', 'voz', 'camera')), -- de onde veio o cadastro
  status         VARCHAR(12)  NOT NULL DEFAULT 'ativo'
                 CHECK (status IN ('ativo', 'consumido')), -- 'consumido' = já saiu da geladeira
  criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Atualiza bancos criados por uma versão anterior deste arquivo
-- (antes não havia "status" e a origem só aceitava 'touch' e 'site').
ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS status VARCHAR(12) NOT NULL DEFAULT 'ativo';
ALTER TABLE alimentos DROP CONSTRAINT IF EXISTS alimentos_origem_check;
ALTER TABLE alimentos ADD CONSTRAINT alimentos_origem_check
  CHECK (origem IN ('site', 'touch', 'voz', 'camera'));
ALTER TABLE alimentos DROP CONSTRAINT IF EXISTS alimentos_status_check;
ALTER TABLE alimentos ADD CONSTRAINT alimentos_status_check
  CHECK (status IN ('ativo', 'consumido'));

-- Índice para deixar rápida a busca "alimentos do usuário X ordenados por validade"
CREATE INDEX IF NOT EXISTS idx_alimentos_usuario_validade
  ON alimentos (usuario_id, data_validade);

-- Fotos tiradas pela ESP32-CAM dentro da geladeira.
-- A imagem (JPEG) fica guardada no próprio banco, no tipo BYTEA (bytes).
-- A API guarda só as últimas fotos de cada usuário para o banco não crescer sem parar.
CREATE TABLE IF NOT EXISTS fotos (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  imagem      BYTEA       NOT NULL,
  tamanho     INTEGER     NOT NULL,              -- em bytes
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fotos_usuario ON fotos (usuario_id, id DESC);

-- Receitas sugeridas para aproveitar o que está perto de vencer (servicos/receitas.js).
-- Valem para todo mundo (não são de um usuário). Em cada ingrediente, "chaves" são as
-- palavras que ligam ele a um alimento cadastrado (ex.: "Peito de frango" tem "frango");
-- "basico": true = item de despensa (sal, azeite...), que não entra na conta.
CREATE TABLE IF NOT EXISTS receitas (
  id             SERIAL PRIMARY KEY,
  nome           VARCHAR(100) NOT NULL UNIQUE,
  tempo_minutos  INTEGER      NOT NULL,
  porcoes        VARCHAR(30)  NOT NULL,
  ingredientes   JSONB        NOT NULL,
  passos         TEXT[]       NOT NULL,
  criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Receitas da apresentação (só entram se ainda não existirem)
INSERT INTO receitas (nome, tempo_minutos, porcoes, ingredientes, passos) VALUES
(
  'Omelete de queijo e tomate', 10, '1 porção',
  '[{"nome":"Ovo","quantidade":"3 ovos","chaves":["ovo","ovos"]},
    {"nome":"Queijo","quantidade":"2 fatias de queijo","chaves":["queijo","mucarela","mussarela"]},
    {"nome":"Tomate","quantidade":"1 tomate picado","chaves":["tomate","tomates"]},
    {"nome":"Cebola","quantidade":"1/2 cebola picada","chaves":["cebola","cebolas"]},
    {"nome":"Sal e azeite","quantidade":"a gosto","basico":true}]',
  ARRAY[
    'Bata os ovos com uma pitada de sal.',
    'Refogue a cebola e o tomate numa frigideira com um fio de azeite.',
    'Despeje os ovos, espalhe o queijo por cima e tampe a frigideira.',
    'Cozinhe em fogo baixo por 4 a 5 minutos, dobre ao meio e sirva.'
  ]
),
(
  'Vitamina de banana com morango', 5, '2 copos',
  '[{"nome":"Leite","quantidade":"400 ml de leite","chaves":["leite"]},
    {"nome":"Banana","quantidade":"2 bananas maduras","chaves":["banana","bananas"]},
    {"nome":"Morango","quantidade":"6 morangos","chaves":["morango","morangos"]},
    {"nome":"Açúcar ou mel","quantidade":"a gosto","basico":true}]',
  ARRAY[
    'Lave os morangos e tire as folhinhas.',
    'Bata no liquidificador o leite, as bananas e os morangos.',
    'Adoce a gosto e sirva gelado.'
  ]
),
(
  'Frango com batata e cenoura', 40, '3 porções',
  '[{"nome":"Frango","quantidade":"500 g de frango em cubos","chaves":["frango"]},
    {"nome":"Batata","quantidade":"3 batatas em cubos","chaves":["batata","batatas"]},
    {"nome":"Cenoura","quantidade":"2 cenouras em rodelas","chaves":["cenoura","cenouras"]},
    {"nome":"Cebola","quantidade":"1 cebola picada","chaves":["cebola","cebolas"]},
    {"nome":"Alho, sal e azeite","quantidade":"a gosto","basico":true}]',
  ARRAY[
    'Tempere o frango com alho e sal.',
    'Doure o frango numa panela com azeite e junte a cebola.',
    'Acrescente a batata, a cenoura e 1 xícara de água.',
    'Tampe e cozinhe por 20 a 25 minutos, até os legumes ficarem macios.'
  ]
)
ON CONFLICT (nome) DO NOTHING;

-- Códigos de "Esqueceu a senha?": um por usuário (pedir de novo troca o anterior).
-- Só o hash do código é guardado, igual à senha. Vale 15 minutos e aceita 5 tentativas.
CREATE TABLE IF NOT EXISTS codigos_senha (
  usuario_id   INTEGER      PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo_hash  VARCHAR(100) NOT NULL,
  expira_em    TIMESTAMPTZ  NOT NULL,
  tentativas   INTEGER      NOT NULL DEFAULT 0,
  criado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Redes Wi-Fi que as placas (ESP32 principal e ESP32-CAM) podem usar.
-- Cadastradas pelo site; as placas baixam a lista e guardam na memória delas,
-- então dá para trocar de rede sem gravar o código de novo.
-- A senha fica guardada como texto porque a placa precisa dela para conectar;
-- o site nunca a devolve (só diz se a rede tem senha).
CREATE TABLE IF NOT EXISTS redes_wifi (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ssid           VARCHAR(32)  NOT NULL,             -- nome da rede
  senha          VARCHAR(63)  NOT NULL DEFAULT '',  -- vazia = rede aberta
  criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, ssid)
);
