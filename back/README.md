# Lab Cam — Backend (API) + códigos das placas

Backend do **Lab Cam**, o dispositivo IoT para geladeiras e despensas que ajuda a monitorar a validade
dos alimentos e reduzir o desperdício. **Um servidor só** atende todo mundo:

| Quem | Como se identifica | O que usa |
| ---- | ------------------ | --------- |
| **Site** | token JWT (login) | usuários, alimentos, câmera, Wi-Fi das placas |
| **ESP32 principal** (tela touch) | `x-device-key` | `GET/POST /api/alimentos`, `GET /api/redes/placa` |
| **ESP32-CAM** | `x-device-key` | `GET /api/comando`, `POST /api/fotos`, `GET /api/redes/placa` |
| **AI Voice (Xiaozhi)** | conexão MCP aberta pelo servidor | `src/voz.js` |

```
 ESP32 principal (tela) ──┐
 ESP32-CAM (fotos) ───────┼──Wi-Fi──> API (Node + PostgreSQL) <──── Site
 Xiaozhi (voz) ── xiaozhi.me ─────────┘   (src/voz.js se conecta ao xiaozhi.me)
```

Tudo o que é cadastrado pela tela, pela voz ou pelo site vai para o **mesmo banco** e aparece nos três.

## Tecnologias

| Parte          | Usado |
| -------------- | ----- |
| Servidor       | Node.js 22 + Express |
| Banco          | PostgreSQL com a biblioteca `pg` (SQL puro, sem ORM); `embedded-postgres` liga o banco local |
| Senhas         | `bcryptjs` (guarda só o hash, nunca a senha) |
| Login do site  | `jsonwebtoken` (JWT) |
| Voz            | MCP (JSON-RPC por WebSocket, nativo do Node 22) |
| Configuração   | `dotenv` (arquivo `.env`) |

## Estrutura

```
back/
  src/
    server.js              liga banco, tabelas, rotas, voz e tratamento de erros
    db.js                  conexão com o PostgreSQL (pool do "pg")
    bancoLocal.js          liga o PostgreSQL local sozinho (BANCO_LOCAL=true)
    validacao.js           regras dos campos (senha, e-mail, data)
    voz.js                 AI Voice: ferramentas do Xiaozhi (MCP)
    servicos/
      alimentos.js         regras dos alimentos (site, placas e voz usam as mesmas)
      camera.js            fotos e "pedido de foto"
    routes/
      usuarios.js          cadastro, login e "quem sou eu"
      alimentos.js         alimentos (site com token ou placa com chave)
      camera.js            fotos para o site
      comando.js           /api/fotos e /api/comando (ESP32-CAM e ESP32 principal)
      dispositivo.js       versões enxutas para placas com pouca memória
    middleware/
      auth.js              token JWT do site (e "site ou placa")
      deviceAuth.js        chave x-device-key das placas
  sql/schema.sql           tabelas usuarios, alimentos e fotos (roda sozinho ao ligar)
  esp32/                   códigos da equipe de robótica (Arduino IDE)
    1_esp32_principal/     tela touch 2,4"
    2_esp32_cam/           câmera: fotos, vídeo ao vivo e o relé da fita de LED (GPIO13)
    3_ai_voice_xiaozhi/    como configurar o módulo de voz
  .env.example             modelo das configurações
```

## Como ligar

Precisa só do **Node.js 22**. **Não precisa instalar o PostgreSQL**: com `BANCO_LOCAL=true` no `.env`,
a própria API liga um PostgreSQL de verdade e guarda os dados em `back/.banco-dados`.
As tabelas são criadas (e atualizadas) sozinhas.

1. Instale as dependências (só na primeira vez):
   ```bash
   cd back
   npm install
   ```
2. Confira o `.env` (se não existir: `copy .env.example .env` no Windows). Troque `JWT_SECRET` e
   `DEVICE_KEY` por frases suas.
3. Ligue (dentro de `back`, ou na pasta principal `tcc-front-main`, que também aceita `npm start`):
   ```bash
   npm start
   ```
   Deve aparecer `API do Lab Cam rodando em http://localhost:3000/api`. Para desligar: **Ctrl+C**.

**Toda conta é dona da geladeira.** Quem faz o **Cadastro** no site já vê e mexe em tudo o que vem
das placas e da voz (alimentos, fotos, vídeo e Wi-Fi das placas), sem configurar nada. No banco, esses
dados ficam guardados em nome da conta `DEVICE_USER_ID` (padrão 1) ou, se ela não existir, da conta
mais antiga (`src/servicos/geladeira.js`). Opcional: `CONTA_EMAIL` e `CONTA_SENHA` no `.env` criam uma
"conta da casa" no primeiro `npm start`.

No Windows o banco local liga pelo `pg_ctl` (que vem junto), então funciona mesmo com o terminal como
administrador ou com o UAC do Windows desligado. As mensagens do PostgreSQL ficam em
`back/.banco-dados/postgres.log`.

O `.env` do backend da robótica (`4_backend/.env.exemplo`) também funciona aqui: os nomes
`DISPOSITIVO_USUARIO_ID`, `DB_SSL` e `SITE_ORIGEM` são aceitos no lugar de `DEVICE_USER_ID`,
`DATABASE_SSL` e `CORS_ORIGIN`.

**Usar outro PostgreSQL** (instalado, no servidor da equipe ou na nuvem): `BANCO_LOCAL=false` e
preencha `DATABASE_URL` (com `DATABASE_SSL=true` se for na nuvem).

## Placas (códigos da robótica)

Os códigos ficam em `esp32/` e **funcionam com esta API sem mudar a lógica deles**. (No
`esp32_principal.ino` só subimos as definições `Retangulo` e `Alimento` para o topo, porque sem isso
ele não compilava na Arduino IDE.) Os passos de cada placa
estão nos `LEIA-ME.md` de cada pasta. Em **todos**, use:

- o **mesmo `DEVICE_KEY`** configurado no servidor (no Render: *Environment*; no computador: `back/.env`). Os `.ino` já vêm com a chave do projeto, `labcam-2e6cfb01cf53`;
- o **endereço do servidor** em `SERVIDOR`, sem barra no final.

| Arquivo | O que preencher |
| ------- | --------------- |
| `esp32/1_esp32_principal/esp32_principal/esp32_principal.ino` | `WIFI_SSID`, `WIFI_PASSWORD` (`SERVIDOR` e `DEVICE_KEY` já vêm certos) |
| `esp32/2_esp32_cam/esp32_cam/esp32_cam.ino` | `WIFI_SSID`, `WIFI_PASSWORD` (`SERVIDOR` e `DEVICE_KEY` já vêm certos) |

`SERVIDOR` aceita os dois jeitos:
- **Na internet (Render):** `https://labcam-api.onrender.com` (já vem assim). As placas funcionam
  em qualquer Wi-Fi com internet. A conexão é HTTPS (criptografada); a placa não confere o
  certificado (`setInsecure()`), assim não precisa regravar quando o Render renovar o certificado.
- **No computador da rede:** `http://192.168.0.10:3000` (IP do `ipconfig`, linha "Endereço IPv4").
  **Não use `localhost`**: na placa isso é a própria placa. Computador e placas na **mesma rede**,
  e na primeira vez que rodar `npm start` libere o Node.js no firewall do Windows.

Dicas:
- Rede Wi-Fi de **2,4 GHz** (o ESP32 não conecta em 5 GHz).
- **Não mande para o GitHub** os `.ino` com a senha do Wi-Fi preenchida.

### O que acontece quando...
- **Toca num alimento na tela:** ele é cadastrado e aparece no site e na voz.
- **A câmera tira uma foto** (botão do site, automática a cada 10 min ou ao ligar): a fita de LED acende só na hora da foto (relé no GPIO13 da ESP32-CAM) e apaga logo depois. O vídeo ao vivo não acende a fita.
- **Alguém toca em "Ver câmera"** no site: a câmera tira a foto em até 3 s.
- **Fala "adiciona leite":** cadastra; aparece no site na hora e na tela em até 2 min.

## Servidor na internet (Render)

A API publicada fica em **https://labcam-api.onrender.com** (teste: `/api` deve responder
`"banco":"conectado"`). O site da Vercel usa esse endereço pelo arquivo `.env.production` da raiz
(`VITE_API_URL`), então não precisa configurar nada no painel da Vercel.

- **Sempre acordado:** o plano grátis do Render desliga a API depois de 15 min sem uso. O
  "despertador" em `.github/workflows/manter-api-acordada.yml` acessa `/api` a cada 10 min (dá para
  ver na aba *Actions* do GitHub), e o site também chama `/api` assim que abre.
- **Variáveis no Render** (*Environment*): `DATABASE_URL`, `DATABASE_SSL=true`, `BANCO_LOCAL=false`,
  `JWT_SECRET`, `DEVICE_KEY=labcam-2e6cfb01cf53` (a mesma das placas), `CORS_ORIGIN` (endereço do
  site) e, para a voz, `XIAOZHI_MCP_ENDPOINT`.

## AI Voice (Xiaozhi)

Passo a passo em `esp32/3_ai_voice_xiaozhi/LEIA-ME.md`. No fim, cole o endereço MCP (`wss://...`)
do painel xiaozhi.me em `XIAOZHI_MCP_ENDPOINT` no `.env` e reinicie: deve aparecer
`[voz] Conectado ao Xiaozhi`. Quem abre a conexão é o servidor, então não precisa abrir porta no roteador.

| Frase | Ferramenta |
| ----- | ---------- |
| "O que está vencendo?" | `alimentos_vencendo` (inclui os já vencidos) |
| "O que tem na geladeira?" | `listar_alimentos` |
| "Adiciona leite" / "Coloquei 6 ovos" / "Guardei frango que vence dia 10" | `cadastrar_alimento` (sem data, usa a validade média) |
| "Acabou o leite" / "Joguei o frango fora" | `marcar_consumido` |

A tabela de validade média fica em `src/servicos/alimentos.js` (fácil de editar).

## Rotas

Respostas em JSON (menos as fotos, que são JPEG). Erros sempre assim: `{ "erro": "mensagem em português" }`.
O **site** manda `Authorization: Bearer <token>`; as **placas** mandam `x-device-key: <DEVICE_KEY>`.

### Usuários

| Método | Rota | Corpo → resposta |
| ------ | ---- | ---------------- |
| POST | `/api/usuarios/cadastro` | `{nome, email, senha}` → `201 {usuario, token}` |
| POST | `/api/usuarios/login` | `{email, senha}` → `{usuario, token}` |
| GET | `/api/usuarios/eu` | dados de quem está logado |
| PUT | `/api/usuarios/avatar` | `{avatar}` (uma das frutas) → tira a foto enviada, se tiver |
| PUT | `/api/usuarios/foto` | `{foto: "data:image/jpeg;base64,..."}` — foto do aparelho (o site reduz para 256x256; máx. 150 KB) |
| DELETE | `/api/usuarios/foto` | tira a foto enviada (volta a fruta) |
| POST | `/api/usuarios/esqueci-senha` | `{email}` → manda um código de 6 dígitos por e-mail (resposta igual exista a conta ou não) |
| POST | `/api/usuarios/redefinir-senha` | `{email, codigo, senha}` → troca a senha |

A senha precisa de 8+ caracteres, maiúscula, minúscula, número e caractere especial, sem espaços.

**Esqueceu a senha?** O código vale 15 minutos, aceita 5 tentativas e só um pode ser pedido por minuto;
no banco fica só o hash dele (tabela `codigos_senha`). O e-mail sai pelo **Brevo** (grátis, 300 por dia),
pela API HTTPS, porque o Render grátis bloqueia SMTP. Preencha `BREVO_API_KEY` e `EMAIL_REMETENTE`
(um e-mail confirmado em Brevo > Senders). Sem a chave, o código aparece só no terminal/log da API.

```json
// POST /api/usuarios/login
{ "email": "romulo@labcam.com", "senha": "Tcc@2026" }
// resposta 200
{ "token": "eyJhbGciOiJIUzI1NiIs...", "usuario": { "id": 1, "nome": "Rômulo", "email": "romulo@labcam.com" } }
```

### Alimentos — site (token) ou placa (chave)

| Método | Rota | Para quê |
| ------ | ---- | -------- |
| GET | `/api/alimentos` | os que estão na geladeira (`?todos=1` inclui consumidos) |
| GET | `/api/alimentos/vencendo?dias=3` | vencem de hoje até N dias (`&vencidos=1` inclui vencidos) |
| POST | `/api/alimentos` | cadastra |
| PUT | `/api/alimentos/:id` | altera `nome`, `categoria`, `quantidade`, `data_validade` ou `status` |
| DELETE | `/api/alimentos/:id` | apaga |

```json
// POST pelo site
{ "nome": "Leite", "categoria": "Laticínio", "quantidade": 2, "data_validade": "2026-10-20" }
// POST pela tela touch (como o esp32_principal.ino manda)
{ "nome": "Leite", "quantidade": 1, "validade_dias": 7, "origem": "touch" }

// resposta 201
{
  "id": 4, "nome": "Leite", "categoria": "Laticínio", "quantidade": 2,
  "data_validade": "2026-10-20", "origem": "site", "status": "ativo",
  "criado_em": "2026-10-04T13:47:44.044Z", "dias_restantes": 16, "validade_estimada": false
}

// PUT /api/alimentos/4  -> tira da lista sem apagar
{ "status": "consumido" }
```

Quando quem chama o `GET /api/alimentos` é uma **placa** (chave), a resposta vem enxuta para caber na
memória da ESP32: só `id`, `nome`, `data_validade`, `dias_restantes` e `status`, e só os 20 que vencem
antes (o máximo que a tela mostra). O site continua recebendo a lista completa.

Validade: `data_validade` > `validade_dias` > validade média do alimento. `dias_restantes` é calculado
pelo banco (negativo = já venceu). `origem`: `site`, `touch`, `voz` ou `camera`.

### Receitas sugeridas — site (token)

| Método | Rota | Para quê |
| ------ | ---- | -------- |
| GET | `/api/receitas/sugestoes` | receitas na ordem do que vence primeiro na geladeira |

As receitas ficam na tabela `receitas` (as 3 da apresentação são criadas pelo `schema.sql`). Cada
ingrediente tem `chaves` (palavras que ligam ele a um alimento: "Peito de frango" combina com `frango`).
Alimento vencido não entra. Cada receita volta com `ingredientes` (com `tem` e o alimento achado),
`passos`, `usa`, `destaque` (o que vence primeiro) e `faltam`. No site, um alerta ("Banana vence
amanhã! Que tal...?") aparece quando a 1ª receita usa algo que vence em até 3 dias e leva para
`/relatorio#receitas`.

### Câmera

| Método | Rota | Quem | Para quê |
| ------ | ---- | ---- | -------- |
| POST | `/api/fotos` | ESP32-CAM | envia a foto: corpo = JPEG puro, `Content-Type: image/jpeg` |
| GET | `/api/comando` | ESP32-CAM | pergunta o que fazer: `{ "foto": true/false, "video": true/false }` |
| POST | `/api/comando` | placa (chave) | pede uma foto: `{ "acao": "foto" }` (era usada pelo sensor de porta, que saiu do projeto) |
| POST | `/api/comando/foto` | site | botão "Ver câmera" |
| GET | `/api/camera/ultima` | site | a foto mais recente (JPEG; hora no cabeçalho `X-Foto-Data`) |
| GET | `/api/camera/fotos` | site | lista das fotos guardadas (as últimas 30) |
| GET | `/api/camera/fotos/:id` | site | uma foto específica (JPEG) |

```json
// resposta do POST /api/fotos
{ "ok": true, "id": 12, "tamanho": 45210, "criado_em": "2026-10-04T13:47:44.044Z" }
```

### Vídeo ao vivo (página Relatório)

| Método | Rota | Quem | Para quê |
| ------ | ---- | ---- | -------- |
| GET | `/api/video/quadro?depois=<id>` | site | próximo quadro JPEG (id em `X-Quadro-Id`); espera até 5 s, senão `204` |
| POST | `/api/video/quadro` | ESP32-CAM | manda um quadro (JPEG puro) → `{ "continuar": true/false, "foto": true/false }` |

Enquanto o site pede quadros, o `GET /api/comando` responde `"video": true` e a ESP32-CAM manda
quadros seguidos. Uns 8 s depois que ninguém mais assiste (saiu da página, pausou ou trocou de aba), a
resposta vira `"continuar": false` e a câmera volta a só tirar fotos. Os quadros ficam só na memória
(não vão para o banco), e qualquer conta com login vê o vídeo.

### Wi-Fi das placas (página `/wifi` do site)

Troca a rede das placas sem gravar o código de novo.

| Método | Rota | Quem | Para quê |
| ------ | ---- | ---- | -------- |
| GET | `/api/redes` | site (login) | redes salvas (sem senhas), versão da lista e situação das placas |
| POST | `/api/redes` | site (login) | `{ "ssid": "Casa", "senha": "12345678" }` (senha vazia = rede aberta) |
| PUT | `/api/redes/:id` | site (login) | troca o nome e/ou a senha (mande só o que muda) |
| DELETE | `/api/redes/:id` | site (login) | remove a rede |
| GET | `/api/redes/placa?placa=principal&rede=Casa&rssi=-60` | placas | lista em texto, com as senhas |

Resposta para as placas (texto, lido sem biblioteca):

```
LABCAM-REDES 1
versao 3019400433
Casa<TAB>senha-da-casa
```

As placas pedem a lista ao ligar e depois de tempos em tempos (principal: 2 min, câmera: 1 min). Se a
versão mudou, gravam as redes na memória (`Preferences`). Ao ligar, o `WiFiMulti` entra na rede salva de
sinal mais forte; a rede escrita no código (`WIFI_SSID`) continua como reserva. Para mudar de lugar:
cadastre a rede nova **enquanto as placas ainda estão na rede antiga**, espere a página mostrar "Lista
recebida" e só então leve as placas. No máximo 5 redes; qualquer conta com login
 mexe nelas. As senhas ficam no banco como texto, porque a placa precisa delas.

### Versões enxutas (opcionais) — chave

Para placas com pouca memória: respostas só com `id`, `nome`, `data_validade`, `dias_restantes`.

| Método | Rota | Corpo |
| ------ | ---- | ----- |
| POST | `/api/dispositivo/alimentos` | `{ "nome": "Iogurte", "dias_para_vencer": 3 }` ou com `data_validade` |
| GET | `/api/dispositivo/validades?limite=10` | — |
| POST | `/api/dispositivo/foto` | JPEG (mesmo que `/api/fotos`) |

## Ligação com o site

- O site lê o endereço da API em `VITE_API_URL` (arquivo `.env` na raiz do site). Sem isso, usa
  `http://localhost:3000`.
- Login e Cadastro chamam a API e guardam o token. A página **Meus alimentos** (`/alimentos`) lista,
  cadastra e remove, e mostra de onde veio cada item (tela touch, voz). A página **Câmera** mostra a
  última foto, atualiza a cada 10 s e tem o botão **Ver câmera**.
- Se o site estiver em **https** (Vercel), o navegador só aceita uma API também em **https**
  (por exemplo, hospedada no Render ou no Railway).

## Segurança (o que foi feito)

- Senhas guardadas só como **hash bcrypt**.
- Todo SQL usa **parâmetros** (`$1`, `$2`...), o que evita SQL injection.
- Site com **token JWT**; cada usuário só acessa os próprios alimentos e fotos.
- Placas com **chave do dispositivo** (comparada em tempo constante).
- Campos e formatos validados, com mensagens de erro em português. Fotos conferidas (precisam ser JPEG).
- O `.env` (senhas e chaves) e a pasta do banco **não vão para o GitHub**.
