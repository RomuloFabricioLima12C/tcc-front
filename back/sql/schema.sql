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
