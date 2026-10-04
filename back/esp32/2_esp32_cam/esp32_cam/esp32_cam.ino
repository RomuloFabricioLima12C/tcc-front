/*
  ============================================================
  Lab Cam - ESP32-CAM (AI Thinker)
  ============================================================
  - Conecta no Wi-Fi.
  - A cada 3 s pergunta ao backend se alguém pediu foto
    (GET /api/comando). Quem pede: o site, a ESP32 principal
    quando a porta abre, ou o AI Voice ("tira uma foto da geladeira").
  - Tira uma foto automática a cada 10 min.
  - Envia a foto para o backend (POST /api/fotos). Ela aparece no site.

  A fita de LED (relé) fica na ESP32 principal. Aqui só usamos o
  flash pequeno da própria placa (GPIO4), que pode ser desligado.

  Arduino IDE:
    Placa: "AI Thinker ESP32-CAM"
    Partition Scheme: "Huge APP (3MB No OTA)"
    Não precisa de biblioteca extra.

  Para gravar (adaptador FTDI/USB-serial):
    GPIO0 ligado no GND -> aperte RESET -> Carregar.
    Depois tire o fio do GPIO0 e aperte RESET de novo.
*/

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ================= CONFIGURE AQUI =================
const char* WIFI_SSID     = "NOME_DO_WIFI";
const char* WIFI_PASSWORD = "SENHA_DO_WIFI";

const char* SERVIDOR   = "http://benserverplex.ddns.net:3000";  // endereço do backend
const char* DEVICE_KEY = "sua-chave-secreta";                    // igual ao DEVICE_KEY do .env

const unsigned long INTERVALO_FOTO_MS    = 10UL * 60UL * 1000UL; // foto automática (10 min)
const unsigned long INTERVALO_COMANDO_MS = 3000;                 // pergunta por pedido (3 s)

#define USAR_FLASH true   // false = não acende o LED da placa na foto
// ==================================================

// Pinos da câmera na placa AI Thinker (já ligados de fábrica, não mexer)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
#define FLASH_LED_PIN      4

unsigned long ultimaFoto = 0;
unsigned long ultimoComando = 0;

bool iniciarCamera() {
  camera_config_t config = {};
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size   = FRAMESIZE_VGA;   // 640x480: boa para o site e leve (30-80 KB)
    config.jpeg_quality = 12;              // 10 = melhor, 20 = mais leve
    config.fb_count     = 2;
    config.fb_location  = CAMERA_FB_IN_PSRAM;
    config.grab_mode    = CAMERA_GRAB_LATEST;
  } else {
    config.frame_size   = FRAMESIZE_QVGA;  // sem PSRAM: foto menor
    config.jpeg_quality = 15;
    config.fb_count     = 1;
    config.fb_location  = CAMERA_FB_IN_DRAM;
    config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Erro ao iniciar a camera: 0x%x\n", err);
    return false;
  }
  return true;
}

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Conectando ao Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " ok" : " falhou (tento de novo depois)");
}

void tirarEEnviarFoto() {
  if (WiFi.status() != WL_CONNECTED) return;

  if (USAR_FLASH) { digitalWrite(FLASH_LED_PIN, HIGH); delay(150); }

  // Descarta um quadro antigo para a foto ser "de agora"
  camera_fb_t* fb = esp_camera_fb_get();
  if (fb) esp_camera_fb_return(fb);
  fb = esp_camera_fb_get();

  if (USAR_FLASH) digitalWrite(FLASH_LED_PIN, LOW);

  if (!fb) {
    Serial.println("Falha ao capturar a foto");
    return;
  }

  HTTPClient http;
  http.begin(String(SERVIDOR) + "/api/fotos");
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.setTimeout(15000);
  int status = http.POST(fb->buf, fb->len);
  Serial.printf("Foto enviada (%u bytes) -> HTTP %d\n", fb->len, status);
  http.end();

  esp_camera_fb_return(fb);
}

// Pergunta ao backend se alguém pediu uma foto. Resposta: {"foto":true} ou {"foto":false}
bool temPedidoDeFoto() {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  http.begin(String(SERVIDOR) + "/api/comando");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.setTimeout(5000);
  int status = http.GET();
  bool pedido = false;
  if (status == 200) {
    String corpo = http.getString();
    pedido = corpo.indexOf("\"foto\":true") >= 0;
  } else if (status == 401) {
    Serial.println("HTTP 401: a DEVICE_KEY daqui está diferente da do backend");
  }
  http.end();
  return pedido;
}

void setup() {
  Serial.begin(115200);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  if (!iniciarCamera()) {
    Serial.println("Confira o cabo da camera e a fonte 5V. Reiniciando em 5 s...");
    delay(5000);
    ESP.restart();
  }

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  conectarWiFi();

  tirarEEnviarFoto();          // foto inicial, para testar
  ultimaFoto = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
    delay(2000);
    return;
  }

  if (millis() - ultimoComando >= INTERVALO_COMANDO_MS) {
    ultimoComando = millis();
    if (temPedidoDeFoto()) {
      Serial.println("Pedido de foto recebido");
      delay(500);  // dá tempo da fita de LED (na principal) acender
      tirarEEnviarFoto();
      ultimaFoto = millis();
    }
  }

  if (millis() - ultimaFoto >= INTERVALO_FOTO_MS) {
    tirarEEnviarFoto();
    ultimaFoto = millis();
  }

  delay(50);
}
