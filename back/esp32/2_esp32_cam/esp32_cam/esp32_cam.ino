/*
  ============================================================
  Lab Cam - ESP32-CAM (AI Thinker)
  ============================================================
  - Conecta no Wi-Fi.
  - A cada 3 s pergunta ao backend o que fazer (GET /api/comando).
  - Câmera aberta no site (página Relatório): a resposta traz "fotos":true.
    Então, nesta ordem:
      1) liga o relé (GPIO13) e a fita de LED acende;
      2) espera TEMPO_LUZ_MS para a luz estabilizar;
      3) tira uma foto e envia (POST /api/fotos). Ela aparece no site;
      4) tira mais uma foto a cada 10 s enquanto a pessoa estiver na página.
    Quando a pessoa sai da página (ou troca de aba), a resposta volta
    "fotos":false e o relé desliga. Não tem vídeo: só fotos.
  - Botão "Ver câmera" do site ("foto":true): uma foto, com a fita acesa.
  - Foto automática a cada 10 min (também com a fita acesa na hora).
  - Wi-Fi trocado pelo site (página "Wi-Fi das placas"): a cada 1 min
    a placa baixa a lista de redes e guarda na memória. Ao ligar,
    conecta na rede salva que estiver ao alcance. A rede escrita aqui
    no código (WIFI_SSID) continua valendo como reserva.

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
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>

// ================= CONFIGURE AQUI =================
// Rede de reserva. As outras redes são cadastradas pelo site e ficam salvas na placa.
const char* WIFI_SSID     = "NOME_DO_WIFI";
const char* WIFI_PASSWORD = "SENHA_DO_WIFI";

// Endereço do backend, SEM barra no final:
//   na internet (Render): "https://labcam-api.onrender.com"
//   no computador da rede: "http://192.168.0.10:3000" (IP do ipconfig)
const char* SERVIDOR   = "https://labcam-api.onrender.com";
const char* DEVICE_KEY = "labcam-2e6cfb01cf53";                    // igual ao DEVICE_KEY do .env

const unsigned long INTERVALO_COMANDO_MS = 3000;                 // pergunta ao backend (3 s)
const unsigned long INTERVALO_SESSAO_MS  = 10000;                // câmera aberta no site: uma foto a cada 10 s
const unsigned long INTERVALO_FOTO_MS    = 10UL * 60UL * 1000UL; // foto automática (10 min)
const unsigned long INTERVALO_REDES_MS   = 60000;                // pergunta a lista de redes (1 min)

#define USAR_FLASH true   // false = não acende o LED pequeno da placa (GPIO4) na hora da foto

// Relé da fita de LED (fio IN do módulo no GPIO13). Liga ANTES da foto.
#define USAR_RELE          true
#define PINO_RELE          13
#define RELE_ATIVO_EM_LOW  true    // a maioria dos módulos liga com LOW; se a fita acender ao contrário, troque para false
const unsigned long TEMPO_LUZ_MS = 2000;  // depois de ligar o relé, espera a fita acender e a câmera ajustar a luz
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
unsigned long ultimasRedes = 0;
unsigned long ultimaFotoSessao = 0;
bool sessao = false;   // alguém está com a câmera aberta no site

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

// ============================================================
//  Redes Wi-Fi (cadastradas no site, guardadas na memória da placa)
// ============================================================
const char* NOME_PLACA = "camera";   // aparece assim na página do site
const int   MAX_REDES  = 5;          // igual ao MAX_REDES do backend

WiFiMulti wifiMulti;    // conecta na rede conhecida com o sinal mais forte
Preferences memRedes;   // memória que não apaga quando a placa desliga
String versaoRedes = "";

// "Casa da Vó" -> "Casa%20da%20V%C3%B3" (para mandar o nome da rede na URL)
String codificarUrl(const String& texto) {
  String r;
  char hex[4];
  for (size_t i = 0; i < texto.length(); i++) {
    char c = texto[i];
    if (isalnum((unsigned char)c) || c == '-' || c == '_' || c == '.' || c == '~') r += c;
    else { snprintf(hex, sizeof(hex), "%%%02X", (unsigned char)c); r += hex; }
  }
  return r;
}

// Na hora de ligar: a rede do código + as redes que o site mandou da última vez
void carregarRedes() {
  wifiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);
  memRedes.begin("redes", true);
  versaoRedes = memRedes.getString("versao", "");
  int n = memRedes.getInt("n", 0);
  for (int i = 0; i < n && i < MAX_REDES; i++) {
    String ssid  = memRedes.getString(("s" + String(i)).c_str(), "");
    String senha = memRedes.getString(("p" + String(i)).c_str(), "");
    if (ssid.length()) {
      wifiMulti.addAP(ssid.c_str(), senha.c_str());
      Serial.println("[REDES] salva: " + ssid);
    }
  }
  memRedes.end();
}

// ============================================================
//  Conexão com o servidor: HTTPS (internet) ou HTTP (rede local)
// ============================================================
// setInsecure(): a conexão é criptografada, mas a placa não confere o certificado do
// servidor (não precisa atualizar o firmware quando o certificado do Render é renovado).
WiFiClientSecure clienteSeguro;
WiFiClient clienteSimples;

void abrir(HTTPClient& http, const String& url) {
  if (url.startsWith("https://")) {
    clienteSeguro.setInsecure();
    http.begin(clienteSeguro, url);
  } else {
    http.begin(clienteSimples, url);
  }
  // O servidor grátis "dorme" sem uso e leva alguns segundos para acordar
  http.setConnectTimeout(15000);
  http.setTimeout(20000);
}

// Pergunta a lista ao backend. Só grava na memória se ela mudou.
// Formato da resposta (texto):  LABCAM-REDES 1 / versao <v> / <rede>\t<senha> ...
void sincronizarRedes() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  abrir(http, String(SERVIDOR) + "/api/redes/placa?placa=" + NOME_PLACA +
             "&rssi=" + String(WiFi.RSSI()) + "&rede=" + codificarUrl(WiFi.SSID()));
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int status = http.GET();
  String corpo = (status == 200) ? http.getString() : "";
  http.end();
  if (status != 200) { Serial.printf("[REDES] HTTP %d\n", status); return; }
  if (!corpo.startsWith("LABCAM-REDES 1\n")) return;

  int pos = corpo.indexOf('\n') + 1;
  int fim = corpo.indexOf('\n', pos);
  if (fim < 0 || !corpo.substring(pos, fim).startsWith("versao ")) return;
  String versao = corpo.substring(pos + 7, fim);
  if (versao == versaoRedes) return;   // nada mudou

  memRedes.begin("redes", false);
  int n = 0;
  pos = fim + 1;
  while (pos < (int)corpo.length() && n < MAX_REDES) {
    fim = corpo.indexOf('\n', pos);
    if (fim < 0) fim = corpo.length();
    String linha = corpo.substring(pos, fim);
    pos = fim + 1;
    int tab = linha.indexOf('\t');
    if (tab <= 0) continue;
    String ssid = linha.substring(0, tab);
    String senha = linha.substring(tab + 1);
    memRedes.putString(("s" + String(n)).c_str(), ssid);
    memRedes.putString(("p" + String(n)).c_str(), senha);
    wifiMulti.addAP(ssid.c_str(), senha.c_str());   // já vale para a próxima reconexão
    n++;
  }
  memRedes.putInt("n", n);
  memRedes.putString("versao", versao);
  memRedes.end();
  versaoRedes = versao;
  Serial.printf("[REDES] lista nova salva (%d redes)\n", n);
}

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("Procurando as redes salvas...");
  wifiMulti.run(15000);   // entra na rede salva de sinal mais forte
  if (WiFi.status() == WL_CONNECTED) Serial.println("Wi-Fi conectado em \"" + WiFi.SSID() + "\"");
  else Serial.println("Nenhuma rede salva respondeu (tento de novo depois)");
}

// ============================================================
//  Relé da fita de LED e fotos
// ============================================================
bool releLigado = false;
void rele(bool ligar) {
#if USAR_RELE
  if (ligar == releLigado) return;
  digitalWrite(PINO_RELE, (ligar == RELE_ATIVO_EM_LOW) ? LOW : HIGH);
  releLigado = ligar;
  Serial.println(ligar ? "Rele: LIGADO (fita de LED acesa)" : "Rele: desligado (fita apagada)");
#endif
}

// Tira a foto e envia. Quem chama já deixou a fita de LED acesa.
void tirarEEnviarFoto() {
  if (WiFi.status() != WL_CONNECTED) return;

  if (USAR_FLASH) { digitalWrite(FLASH_LED_PIN, HIGH); delay(150); }

  // Descarta os quadros guardados de antes, para a foto ser "de agora"
  for (int i = 0; i < 2; i++) {
    camera_fb_t* velho = esp_camera_fb_get();
    if (velho) esp_camera_fb_return(velho);
  }
  camera_fb_t* fb = esp_camera_fb_get();

  if (USAR_FLASH) digitalWrite(FLASH_LED_PIN, LOW);

  if (!fb) {
    Serial.println("Falha ao capturar a foto");
    return;
  }

  HTTPClient http;
  abrir(http, String(SERVIDOR) + "/api/fotos");
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int status = http.POST(fb->buf, fb->len);
  Serial.printf("Foto enviada (%u bytes) -> HTTP %d\n", fb->len, status);
  if (status == 401) Serial.println("HTTP 401: a DEVICE_KEY daqui está diferente da do backend");
  else if (status < 0) Serial.println("Sem resposta: confira o SERVIDOR (endereço sem barra no final) e o Wi-Fi");
  http.end();

  esp_camera_fb_return(fb);
}

// Foto avulsa (botão do site, automática): 1) liga o relé, 2) espera a luz,
// 3) tira a foto, 4) apaga. Se a fita já está acesa (câmera aberta no site), só tira.
void fotoComLuz() {
  if (releLigado) {
    tirarEEnviarFoto();
    return;
  }
  rele(true);
  delay(TEMPO_LUZ_MS);
  tirarEEnviarFoto();
  rele(false);
}

// Pergunta ao backend o que fazer. Resposta: {"foto":true/false,"fotos":true/false}
//   foto  = pediram UMA foto (botão "Ver câmera")
//   fotos = alguém está com a câmera aberta no site (fotos a cada 10 s)
void perguntarComando(bool& foto, bool& olhando) {
  foto = false;
  olhando = false;
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  abrir(http, String(SERVIDOR) + "/api/comando");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int status = http.GET();
  if (status == 200) {
    String corpo = http.getString();
    foto    = corpo.indexOf("\"foto\":true") >= 0;
    olhando = corpo.indexOf("\"fotos\":true") >= 0;
  } else if (status == 401) {
    Serial.println("HTTP 401: a DEVICE_KEY daqui está diferente da do backend");
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);
#if USAR_RELE
  // começa com a fita apagada (o primeiro rele(false) precisa escrever no pino)
  pinMode(PINO_RELE, OUTPUT);
  releLigado = true;
  rele(false);
#endif

  if (!iniciarCamera()) {
    Serial.println("Confira o cabo da camera e a fonte 5V. Reiniciando em 5 s...");
    delay(5000);
    ESP.restart();
  }

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  carregarRedes();
  conectarWiFi();
  sincronizarRedes();
  ultimasRedes = millis();

  fotoComLuz();          // foto inicial, para testar (liga o relé, foto, apaga)
  ultimaFoto = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    sessao = false;
    rele(false);   // sem Wi-Fi ninguém consegue ver as fotos: apaga a fita
    conectarWiFi();
    delay(2000);
    return;
  }

  // A cada 3 s: tem pedido de foto? alguém está com a câmera aberta no site?
  if (millis() - ultimoComando >= INTERVALO_COMANDO_MS) {
    bool foto, olhando;
    perguntarComando(foto, olhando);
    ultimoComando = millis();

    if (olhando && !sessao) {
      // Abriram a câmera no site: 1º o relé (fita de LED), espera a luz, depois as fotos
      Serial.println("Camera aberta no site: ligando o rele");
      sessao = true;
      rele(true);
      delay(TEMPO_LUZ_MS);
      ultimaFotoSessao = millis() - INTERVALO_SESSAO_MS;   // a primeira foto sai já
    } else if (!olhando && sessao) {
      Serial.println("Ninguem mais na pagina da camera: desligando o rele");
      sessao = false;
      rele(false);
    }

    if (foto && !sessao) {
      Serial.println("Pedido de foto recebido");
      fotoComLuz();
      ultimaFoto = millis();
    }
  }

  // Câmera aberta no site: uma foto a cada 10 s (a fita já está acesa)
  if (sessao && millis() - ultimaFotoSessao >= INTERVALO_SESSAO_MS) {
    ultimaFotoSessao = millis();
    tirarEEnviarFoto();
    ultimaFoto = millis();
  }

  // Foto automática a cada 10 min (quando ninguém está olhando)
  if (!sessao && millis() - ultimaFoto >= INTERVALO_FOTO_MS) {
    fotoComLuz();
    ultimaFoto = millis();
  }

  if (millis() - ultimasRedes >= INTERVALO_REDES_MS) {
    sincronizarRedes();
    ultimasRedes = millis();
  }

  delay(50);
}
