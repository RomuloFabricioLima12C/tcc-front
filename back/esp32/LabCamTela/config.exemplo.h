// =====================================================================
// Configurações do ESP32 da tela touch do Lab Cam.
// Copie este arquivo como "config.h" (na mesma pasta) e preencha.
// O config.h NÃO vai para o GitHub, porque tem a senha do Wi-Fi.
// =====================================================================
#pragma once

// ---- Wi-Fi (precisa ser 2,4 GHz: o ESP32 não conecta em rede 5 GHz) ----
#define WIFI_NOME   "NOME_DA_SUA_REDE"
#define WIFI_SENHA  "SENHA_DA_SUA_REDE"

// ---- API (pasta back/) ----
// Use o IP do computador onde roda o "npm start" (no Windows: comando ipconfig,
// linha "Endereço IPv4"). NÃO use "localhost": no ESP32 isso é o próprio ESP32.
#define API_URL     "http://192.168.0.10:3001"

// Igual ao DEVICE_KEY do arquivo back/.env
#define DEVICE_KEY  "troque-esta-chave-do-esp32"

// ---- Ligações da tela 2,4" (SPI) no ESP32 WROOM ----
// SCK -> 18   MOSI (SDI) -> 23   MISO (SDO) -> 19   (o touch usa os mesmos 3 fios)
// LED -> 3.3V   VCC -> 3.3V   GND -> GND
#define PINO_TFT_CS    15
#define PINO_TFT_DC    2
#define PINO_TFT_RST   4
#define PINO_TOQUE_CS  21   // T_CS do touch

// ---- Ajuste do toque ----
// Se o toque cair no lugar errado, coloque MODO_AJUSTE_TOQUE em 1, grave,
// toque nos 4 cantos da tela e anote os números que aparecem. Depois
// coloque os menores/maiores valores aqui e volte para 0.
#define MODO_AJUSTE_TOQUE  0
#define TOQUE_X_MIN   300
#define TOQUE_X_MAX   3800
#define TOQUE_Y_MIN   300
#define TOQUE_Y_MAX   3800
#define TOQUE_INVERTE_X  0   // 1 se o toque estiver espelhado na horizontal
#define TOQUE_INVERTE_Y  0   // 1 se o toque estiver espelhado na vertical
#define TOQUE_TROCA_XY   0   // 1 se mexer o dedo na horizontal mover na vertical
