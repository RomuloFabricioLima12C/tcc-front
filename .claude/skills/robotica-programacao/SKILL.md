---
name: robotica-programacao
description: Robótica e programação do Lab Cam — firmware das placas (ESP32 WROOM com tela touch ILI9341; relé da fita de LED na ESP32-CAM; ESP32-CAM AI Thinker; módulo de voz Xiaozhi), ligações elétricas e pinagem, e a integração das placas com o backend Node/Express + PostgreSQL. Use sempre que a tarefa envolver arquivos .ino/.h, Arduino IDE, ESP32, sensores, atuadores, GPIO, fiação, Wi-Fi das placas, x-device-key, rotas /api/comando, /api/fotos, /api/dispositivo, src/voz.js (MCP do Xiaozhi), ou quando alguém pedir para criar/depurar um recurso novo de hardware ou explicar como o dispositivo funciona.
---

# Robótica e programação — Lab Cam

O Lab Cam é um dispositivo IoT para geladeira/despensa que controla validade de alimentos.
Quatro partes, **nenhuma placa ligada à outra por fio de dados** — tudo passa pelo backend via Wi-Fi:

```
 ESP32 principal (tela) ──┐
 ESP32-CAM (fotos) ───────┼──Wi-Fi──> BACKEND (Node 22 + PostgreSQL) <──── Site (React/Vite)
 Xiaozhi (voz) ── xiaozhi.me ─────────┘   (back/src/voz.js abre a conexão MCP)
```

| Parte | Onde está | Ferramenta |
|---|---|---|
| ESP32 principal | `back/esp32/1_esp32_principal/` | Arduino IDE, placa "ESP32 Dev Module" |
| ESP32-CAM | `back/esp32/2_esp32_cam/` | Arduino IDE, placa "AI Thinker ESP32-CAM", partição "Huge APP (3MB No OTA)" |
| Voz Xiaozhi | `back/esp32/3_ai_voice_xiaozhi/` | só configuração no xiaozhi.me |
| Backend | `back/src/` | Node 22 + Express, `pg` com SQL puro |
| Site | `src/` (raiz) | React 19 + Vite |

Antes de mexer, **leia o arquivo real** (o `.ino`, a rota, o `LEIA-ME.md` da pasta). Esta skill resume
convenções; o código é a fonte da verdade.

## Convenções do projeto

**Idioma:** tudo em português — nomes de funções/variáveis (`telaCadastro`, `acenderLedPorUmTempo`),
comentários, mensagens do Serial e erros da API (`{ "erro": "mensagem em português" }`). A fonte da
tela TFT não tem acento: texto desenhado na tela vai sem acento; o que vai para o backend vai com.

**Firmware (.ino):**
- Bloco `// ===== CONFIGURE AQUI =====` no topo com Wi-Fi, servidor, `DEVICE_KEY`, pinos e tempos.
  Recurso opcional = `#define USAR_XXX true/false` (ex.: `USAR_RELE`, `USAR_SENSOR_PORTA`, `USAR_FLASH`).
- Comentário de cabeçalho explicando o que a placa faz, bibliotecas e como gravar.
- `struct`s usadas como parâmetro ficam **no topo**, antes das funções (o pré-processador da Arduino
  IDE gera protótipos e não compila se o tipo vier depois).
- Nada de `delay()` longo no `loop()`: use `millis()` com intervalos `unsigned long` (`2UL * 60UL * 1000UL`).
  A tela e o touch precisam continuar respondendo.
- Tempos e limites como constantes nomeadas (`TEMPO_LED_MS`, `TOUCH_LIMIAR`, `INTERVALO_COMANDO_MS`).
- Dados persistentes (calibração do touch) em `Preferences`.
- JSON com `ArduinoJson`; HTTP com `HTTPClient`. Sempre `http.end()` e conferir o código de status.
- Bibliotecas usadas: TFT_eSPI (Bodmer, com o `User_Setup.h` do projeto) e ArduinoJson. A ESP32-CAM
  usa só `esp_camera.h`. Não adicione biblioteca nova sem necessidade — avise no `LEIA-ME.md` se adicionar.

**Backend:**
- CommonJS (`require`), Express, SQL **sempre parametrizado** (`$1, $2`), sem ORM.
- Regras de negócio em `src/servicos/` (site, placas e voz usam as mesmas funções); rotas em `src/routes/`.
- Placas se autenticam com o cabeçalho `x-device-key` (também aceita `x-api-key`) via
  `src/middleware/deviceAuth.js`; os dados ficam com a geladeira (`src/servicos/geladeira.js`: conta `DEVICE_USER_ID` ou a mais antiga), e toda conta do site é dona dela. Site usa JWT.
- Tabelas em `sql/schema.sql` (roda sozinho ao ligar; alterações precisam ser idempotentes,
  ex.: `ADD COLUMN IF NOT EXISTS`).
- `origem` de um alimento: `site`, `touch`, `voz` ou `camera`.

## Contrato placa ↔ backend

| Placa | Chamada | Corpo / resposta |
|---|---|---|
| ESP32 principal | `GET /api/alimentos` | lista com `dias_restantes` e `data_validade` |
| ESP32 principal | `POST /api/alimentos` | `{nome, quantidade, validade_dias, origem:"touch"}` |
| ESP32-CAM | `GET /api/comando` (a cada 3 s) | `{foto:true/false, video:true/false}` |
| ESP32-CAM | `POST /api/fotos` | JPEG puro, `Content-Type: image/jpeg` (até 3 MB) |
| ESP32-CAM | `POST /api/video/quadro` (vídeo ao vivo) | JPEG puro → `{continuar, foto}`; site lê em `GET /api/video/quadro?depois=<id>` |
| Placas com pouca RAM | `/api/dispositivo/*` | respostas enxutas (`id, nome, data_validade, dias_restantes`) |
| Voz | ferramentas MCP em `src/voz.js` | `alimentos_vencendo`, `listar_alimentos`, `cadastrar_alimento`, `marcar_consumido` (a voz não pede foto) |

Ao mudar um lado do contrato, **mude o outro na mesma tarefa** e atualize o `back/README.md`.
Prefira mudanças compatíveis (campo novo opcional) — placas já gravadas não se atualizam sozinhas.

## Pinagem atual (ESP32 principal)

| Peça | GPIO |
|---|---|
| Tela ILI9341: CS / RESET / DC | 15 / 4 / 2 |
| MOSI + T_DIN / SCK + T_CLK | 23 / 18 |
| T_DO / T_CS | 19 / 21 |
| **SDO (MISO) da tela** | **não ligar** — atrapalha o touch no GPIO19 |
| Relé da fita de LED | **mudou para a ESP32-CAM (GPIO13)**; aqui `USAR_RELE false` (era o 26) |

Alimentação: fonte chaveada 5 V comum, **todos os GND juntos**.

### Ao escolher um pino novo no ESP32 WROOM
- Evite **6–11** (flash interna) e cuidado com os de boot: **0, 2, 12, 15** (12 em HIGH no boot quebra a inicialização).
- **34, 35, 36, 39** são só entrada e não têm pull-up interno.
- ADC2 (GPIOs 0, 2, 4, 12–15, 25–27) não lê analógico com o Wi-Fi ligado — para sensor analógico use ADC1 (32–39).
- Lógica é **3,3 V**: sensor de 5 V precisa de divisor de tensão ou conversor de nível.
- Motor, solenoide, fita de LED: nunca direto no GPIO — use relé/transistor/MOSFET com diodo de roda livre em carga indutiva.

### ESP32-CAM (AI Thinker)
- Quase todos os pinos já são da câmera e do cartão SD; o GPIO4 é o flash. Sem cartão SD sobram 12, 13, 14 e 15.
- **Relé da fita de LED: GPIO13** (`PINO_RELE`, aciona em LOW por padrão). Liga só na hora da foto: `tirarEEnviarFoto()` liga, espera `TEMPO_LUZ_MS` (600 ms), descarta 2 quadros antigos, captura e desliga antes de enviar. O vídeo ao vivo não acende a fita.
- Gravar: GPIO0 no GND → RESET → Carregar → tirar o fio do GPIO0 → RESET.
- Precisa de 5 V com corrente boa; queda de tensão causa "Brownout detector was triggered".

## Fluxo para criar um recurso novo de hardware

1. Entenda o que a placa deve fazer e **qual placa** cuida disso (lembre que elas não se falam por fio).
2. Confira pinos livres e limites elétricos (seção acima). Diga a ligação em tabela, como nos `LEIA-ME.md`.
3. No `.ino`: constantes no bloco CONFIGURE AQUI, `#define USAR_...` se for opcional, lógica não bloqueante com `millis()`.
4. Se precisar do backend: serviço em `src/servicos/`, rota em `src/routes/` com `deviceAuth`, validação com mensagem em português, SQL parametrizado.
5. Se fizer sentido por voz: ferramenta nova em `src/voz.js` reaproveitando o mesmo serviço.
6. Documente: `LEIA-ME.md` da placa (ligação + passo a passo), `back/README.md` (rota) e o `LEIA-ME.md` geral se mudar a montagem.

## Depuração

- **Placa não fala com o servidor:** confira `SERVIDOR` no `.ino` (sem barra no final). Na internet: `https://labcam-api.onrender.com` (conexão por `WiFiClientSecure` com `setInsecure()`, na função `abrir()`). Na rede local: `http://IPv4-do-computador:3000` — nunca `localhost`; liberar o Node no firewall do Windows. Rede **2,4 GHz**; mesma `DEVICE_KEY` no `.ino` e no servidor (Render → Environment, ou `back/.env`).
- **401 "Chave do dispositivo inválida":** `DEVICE_KEY` diferente ou vazia; `500 "DEVICE_KEY não configurada"`: falta no `.env`.
- **409 "Nenhuma conta cadastrada ainda":** o banco está vazio — criar uma conta pelo Cadastro do site.
- **Touch não responde:** Monitor Serial 115200, procurar `[TOQUE] x=... y=...`; checar T_CS (21), T_DO (19) e SDO desligado; baixar `TOUCH_LIMIAR`; recalibrar digitando `c`.
- **Reinicia sozinha / brownout:** fonte fraca ou GND não comum.
- **Testar a API sem placa:** simule com curl:
  ```bash
  curl -H "x-device-key: SUA_CHAVE" http://localhost:3000/api/alimentos
  curl -X POST -H "x-device-key: SUA_CHAVE" -H "Content-Type: application/json" \
       -d '{"acao":"foto"}' http://localhost:3000/api/comando
  ```
- Não é possível compilar/gravar firmware daqui sem `arduino-cli` instalado: revise o código com cuidado e diga ao usuário o que conferir no Monitor Serial.

## Segurança

- Os `.ino` já trazem a `DEVICE_KEY` do projeto (`labcam-2e6cfb01cf53`, a mesma do Render). Nunca deixar a senha do Wi-Fi real em `.ino` que vá para o GitHub; use `NOME_DO_WIFI` / `SENHA_DO_WIFI`.
- O `.env` e `back/.banco-dados` não vão para o repositório.
- Ao trabalhar com tensão da rede (127/220 V) em relé, avise o usuário sobre isolamento e peça supervisão de um professor.
