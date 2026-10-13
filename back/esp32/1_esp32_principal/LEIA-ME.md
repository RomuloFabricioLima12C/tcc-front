# Lab Cam — código final do ESP32 principal (tela 2,4")

## Arquivos
- `esp32_principal/esp32_principal.ino` → código final da placa principal (tela com as abas Cadastrar e Validades, touch, relé e sensor de porta)
- `esp32_principal/imagens.h` → frutinhas do site convertidas para a tela (deixe na mesma pasta do .ino)
- `User_Setup.h` → configuração da tela para a biblioteca TFT_eSPI
- `previa_telas_2_4.png` → como as telas ficam

## Passo a passo
1. Na Arduino IDE, instale as bibliotecas **TFT_eSPI** (Bodmer) e **ArduinoJson** (Benoit Blanchon, versão 7 ou mais nova).
2. Copie o **`User_Setup.h`** por cima de `Documentos/Arduino/libraries/TFT_eSPI/User_Setup.h`.
3. Abra `esp32_principal.ino` e preencha no topo: Wi-Fi, senha e `DEVICE_KEY`.
4. Placa: **ESP32 Dev Module**. Grave.
5. Na primeira vez, toque na ponta das **setas dos 4 cantos** (use a unha ou uma caneta sem tinta). A calibração fica salva.
   - Para calibrar de novo: ligue o ESP32 com o dedo apertando a tela, **ou** digite `c` no Monitor Serial (115200).

## Ligação da tela 2,4" (ILI9341) no ESP32

| Pino da tela | ESP32 |
|---|---|
| VCC | 3.3V |
| GND | GND |
| CS | GPIO15 |
| RESET | GPIO4 |
| DC/RS | GPIO2 |
| SDI (MOSI) | GPIO23 |
| SCK | GPIO18 |
| LED | 3.3V |
| **SDO (MISO)** | **NÃO LIGAR** ⚠️ |
| T_CLK | GPIO18 (junto com SCK) |
| T_CS | GPIO21 |
| T_DIN | GPIO23 (junto com MOSI) |
| T_DO | GPIO19 |
| T_IRQ | não precisa (pode deixar solto) |

⚠️ **Por que o SDO da tela fica desligado:** o código nunca lê nada da tela, e em várias dessas placas vermelhas esse pino atrapalha o sinal do touch no GPIO19. No GPIO19 vai **só o T_DO**.

> A tela de 2,8" usa o mesmo chip (ILI9341, 320×240), então este código serve para as duas.

## Outras ligações

| Peça | Pino | ESP32 |
|---|---|---|
| Relé (fita de LED) | IN | GPIO26 |
| Relé | VCC / GND | 5V da fonte / GND |
| Sensor de porta (reed switch), opcional | um fio | GPIO32 |
| Sensor de porta | outro fio | GND |

Se o relé estiver ligado na ESP32-CAM e não aqui, mude `USAR_RELE` para `false` no topo do código.

## Se o touch não responder
1. Abra o Monitor Serial (115200). Ao ligar, aparece `Touch: pressao no boot = ...`. Ao tocar, deve aparecer `[TOQUE] x=... y=...`.
2. Se nada aparece: confira **T_CS (21)** e **T_DO (19)**, e se o **SDO da tela está desligado**.
3. Se só funciona apertando forte: diminua `TOUCH_LIMIAR` no topo do código (por exemplo, 250).
4. Se toca num lugar e reage em outro: calibre de novo (digite `c` no Monitor Serial).

## O que a tela faz
- **CADASTRAR:** 6 alimentos. Toque → confirmação → envia para `POST /api/alimentos` (manda `nome`, `quantidade`, `validade_dias`, `data_validade` e `origem: "touch"`).
- **VALIDADES:** lista do backend (`GET /api/alimentos`), aceita `dias_restantes` ou `data_validade`. Selo vermelho, laranja ou verde. A bolinha vermelha na aba mostra quantos vencem em até 2 dias. Atualiza sozinha a cada 2 minutos (pega o que foi cadastrado pela voz ou pelo site).
- **Porta abriu** (se tiver o sensor): acende a fita de LED por 15 s e pede uma foto à ESP32-CAM (`POST /api/comando {acao:"foto"}`). Isso acontece por trás, sem aparecer na tela.
- O AI Voice (Xiaozhi) é outra placa e não liga fio aqui. Ele conversa com o backend (`back/src/voz.js`).
