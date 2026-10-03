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
                 CHECK (origem IN ('touch', 'site')), -- de onde veio o cadastro
  criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para deixar rápida a busca "alimentos do usuário X ordenados por validade"
CREATE INDEX IF NOT EXISTS idx_alimentos_usuario_validade
  ON alimentos (usuario_id, data_validade);
