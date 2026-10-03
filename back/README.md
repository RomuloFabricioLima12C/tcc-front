# Lab Cam — Backend (API)

API do **Lab Cam**, o dispositivo IoT para geladeiras/despensas que ajuda a monitorar a validade dos
alimentos e reduzir o desperdício.

A mesma API atende dois "clientes":

- **o site** (pasta raiz do repositório), com login por **JWT**;
- **o ESP32 com a tela touch**, com uma **chave fixa** no cabeçalho `x-device-key`.

Os alimentos cadastrados pelos dois caminhos vão para o **mesmo banco** e aparecem nos dois lugares.

```
 [Tela touch ESP32] --x-device-key--> \
                                        [API Express] --> [PostgreSQL]
 [Site React]      ----token JWT----> /
```

## Tecnologias

| Parte          | Usado                                      |
| -------------- | ------------------------------------------ |
| Servidor       | Node.js + Express                          |
| Banco          | PostgreSQL com a biblioteca `pg` (SQL puro, sem ORM); `embedded-postgres` liga o banco local |
| Senhas         | `bcryptjs` (guarda só o hash, nunca a senha) |
| Login do site  | `jsonwebtoken` (JWT)                        |
| Configuração   | `dotenv` (arquivo `.env`)                   |

## Estrutura

```
back/
  src/
    server.js            liga o Express, CORS, rotas e tratamento de erros
    db.js                conexão com o PostgreSQL (pool do "pg")
    bancoLocal.js        liga o PostgreSQL local sozinho (BANCO_LOCAL=true)
    validacao.js         regras dos campos (senha, e-mail, alimento, data)
    routes/
      usuarios.js        cadastro, login e "quem sou eu"
      alimentos.js       CRUD de alimentos do site + "vencendo"
      dispositivo.js     rotas do ESP32 (respostas enxutas)
    middleware/
      auth.js            confere o token JWT do site
      deviceAuth.js      confere a chave x-device-key do ESP32
  sql/schema.sql         criação das tabelas usuarios e alimentos (roda sozinho ao ligar)
  esp32/LabCamTela/     firmware da tela touch (abrir na Arduino IDE)
    LabCamTela.ino       programa do ESP32
    config.exemplo.h     modelo das configurações (Wi-Fi, IP da API, chave)
  .env.example           modelo das configurações
```

## Como ligar

Precisa só do **Node.js 18 ou mais novo**. **Não precisa instalar o PostgreSQL**: com
`BANCO_LOCAL=true` no `.env`, a própria API liga um PostgreSQL de verdade e guarda os dados na pasta
`back/.banco-dados`. As tabelas são criadas sozinhas na primeira vez.

1. Instale as dependências (só na primeira vez):
   ```bash
   cd back
   npm install
   ```
2. Confira o arquivo `.env`. Se não existir, copie o modelo (no Windows: `copy .env.example .env`)
   e troque `JWT_SECRET` e `DEVICE_KEY` por frases suas.
3. Ligue:
   ```bash
   npm start
   ```
   Deve aparecer `API do Lab Cam rodando em http://localhost:3001/api`. Para desligar: **Ctrl+C**.

**Primeiro usuário = dono da geladeira:** a primeira conta criada (pela tela **Cadastro** do site)
recebe o `id` 1. É para ela que vão os alimentos cadastrados pela tela touch (`DEVICE_USER_ID=1`).

**Usar outro PostgreSQL** (instalado ou na nuvem, como Neon ou Supabase): coloque
`BANCO_LOCAL=false` e preencha `DATABASE_URL` (com `DATABASE_SSL=true` se for na nuvem). As tabelas
são criadas sozinhas do mesmo jeito: o `sql/schema.sql` roda a cada partida, sem apagar nada.

## Rotas

Todas as respostas são JSON. Erros sempre vêm assim: `{ "erro": "mensagem em português" }`.

### Usuários

#### `POST /api/usuarios/cadastro`
A senha precisa ter 8+ caracteres, maiúscula, minúscula, número e caractere especial, sem espaços.
```json
// requisição
{ "nome": "Rômulo", "email": "romulo@labcam.com", "senha": "Tcc@2026" }

// resposta 201
{
  "usuario": { "id": 1, "nome": "Rômulo", "email": "romulo@labcam.com", "criado_em": "2026-10-02T22:53:52.402Z" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```
Erros: `400` (campo inválido), `409` (e-mail já cadastrado).

#### `POST /api/usuarios/login`
```json
// requisição
{ "email": "romulo@labcam.com", "senha": "Tcc@2026" }

// resposta 200
{ "token": "eyJhbGciOiJIUzI1NiIs...", "usuario": { "id": 1, "nome": "Rômulo", "email": "romulo@labcam.com" } }
```
Erro: `401` → `{ "erro": "E-mail ou senha incorretos." }`

#### `GET /api/usuarios/eu` *(precisa de token)*
Devolve os dados de quem está logado.

### Alimentos (site) — todas precisam do cabeçalho `Authorization: Bearer <token>`

Cada usuário só vê e altera os **próprios** alimentos. `dias_restantes` é calculado pelo banco
(negativo = já venceu).

#### `GET /api/alimentos`
```json
[
  {
    "id": 4, "nome": "Pão", "categoria": "Padaria", "quantidade": 2,
    "data_validade": "2026-10-01", "origem": "site",
    "criado_em": "2026-10-02T22:54:03.120Z", "dias_restantes": -1
  }
]
```

#### `GET /api/alimentos/vencendo?dias=3`
Mesmo formato, só com os que vencem de **hoje** até daqui a `dias` dias (padrão 3).

#### `POST /api/alimentos`
```json
// requisição (categoria e quantidade são opcionais; quantidade padrão = 1)
{ "nome": "Leite", "categoria": "Laticínio", "quantidade": 2, "data_validade": "2026-10-20" }

// resposta 201: o alimento criado (com "origem": "site" e "dias_restantes")
```

#### `PUT /api/alimentos/:id`
Mande só o que quer mudar:
```json
{ "quantidade": 1, "data_validade": "2026-10-22" }
```
Resposta `200` com o alimento atualizado, ou `404` se não for seu / não existir.

#### `DELETE /api/alimentos/:id`
```json
{ "mensagem": "Alimento removido." }
```

### Dispositivo (ESP32) — todas precisam do cabeçalho `x-device-key: <DEVICE_KEY>`

Respostas **enxutas** (só `id`, `nome`, `data_validade`, `dias_restantes`) porque o ESP32 tem pouca memória.

#### `POST /api/dispositivo/alimentos` — botão **CADASTRAR** da tela
```json
// requisição (categoria e quantidade opcionais)
{ "nome": "Iogurte", "data_validade": "2026-10-05" }

// ou, sem precisar saber a data de hoje (é o que a tela touch usa):
{ "nome": "Iogurte", "categoria": "Laticínio", "dias_para_vencer": 3 }

// resposta 201
{ "id": 7, "nome": "Iogurte", "data_validade": "2026-10-05", "dias_restantes": 3 }
```

#### `GET /api/dispositivo/validades?limite=10` — botão **VER VALIDADES** da tela
Os que vencem antes vêm primeiro (inclusive os já vencidos). `limite` de 1 a 30, padrão 10.
```json
[
  { "id": 5, "nome": "Queijo", "data_validade": "2026-10-04", "dias_restantes": 2 },
  { "id": 7, "nome": "Iogurte", "data_validade": "2026-10-05", "dias_restantes": 3 }
]
```

## ESP32 com a tela touch (firmware)

O programa da tela fica em `esp32/LabCamTela/`. Ele tem as duas opções da tela:

- **CADASTRAR**: escolhe o alimento numa grade (Leite, Iogurte, Queijo, Presunto, Frango, Carne,
  Fruta, Verdura), ajusta em quantos dias vence (-1, +1, +7, +30) e toca em **SALVAR**.
  Ele manda `dias_para_vencer` e a API calcula a data — assim o ESP32 não precisa de relógio.
- **VER VALIDADES**: mostra os 6 que vencem primeiro, com cor (vermelho = vencido, laranja = hoje,
  amarelo = até 3 dias, verde = ok).

### Hardware
ESP32 WROOM + tela TFT 2,4" SPI (ILI9341) com touch (XPT2046). Ligações:

| Tela        | ESP32 |
| ----------- | ----- |
| VCC / LED   | 3.3V  |
| GND         | GND   |
| CS          | 15    |
| RESET       | 4     |
| DC          | 2     |
| SDI (MOSI) e T_DIN | 23 |
| SCK e T_CLK | 18    |
| SDO (MISO) e T_DO  | 19 |
| T_CS        | 21    |

Os pinos podem ser trocados no `config.h`.

### Gravar
1. Instale a **Arduino IDE** e o pacote **esp32** (Espressif) pelo Gerenciador de Placas.
2. Pelo Gerenciador de Bibliotecas, instale: **Adafruit ILI9341**, **XPT2046_Touchscreen** e **ArduinoJson**.
3. Abra `esp32/LabCamTela/LabCamTela.ino`.
4. No `config.h` (se não existir, copie o `config.exemplo.h` com esse nome) preencha o **Wi-Fi**
   (rede de 2,4 GHz), o **IP do computador** onde roda a API (`ipconfig` → Endereço IPv4) e a
   **DEVICE_KEY** igual à do `back/.env`.
5. Placa: **ESP32 Dev Module** → escolha a porta → **Carregar**.

Dicas:
- Computador e ESP32 precisam estar **na mesma rede**. Na primeira vez que rodar `npm start`, o
  Windows pergunta se libera o Node.js no firewall: clique em **Permitir** (redes privadas).
- A bolinha no canto da tela fica **verde** com Wi-Fi e **vermelha** sem.
- Se o toque cair no lugar errado, use `MODO_AJUSTE_TOQUE` no `config.h` (as instruções estão lá).
- O `config.h` tem a senha do Wi-Fi e **não vai para o GitHub**.

## Ligação com o site

- O site lê o endereço da API em `VITE_API_URL` (arquivo `.env` na raiz do site). Sem isso, usa
  `http://localhost:3001`.
- Coloque o endereço do site em `CORS_ORIGIN` no `.env` da API (ex.: `http://localhost:5173`).
- O login do site chama `POST /api/usuarios/login`, guarda o token no navegador e abre a página
  **Meus alimentos** (`/alimentos`), que lista, cadastra e remove alimentos e destaca os que vencem
  em até 3 dias.

## Segurança (o que foi feito)

- Senhas guardadas só como **hash bcrypt**.
- Todo SQL usa **parâmetros** (`$1`, `$2`...), o que evita SQL injection.
- Rotas do site exigem **token JWT**; cada usuário só acessa os próprios alimentos.
- Rotas do ESP32 exigem a **chave do dispositivo**.
- Campos obrigatórios e formatos são validados, com mensagens de erro em português.
- O `.env` (com senhas e chaves) **não vai para o GitHub**.
