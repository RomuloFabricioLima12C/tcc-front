/*
  ============================================================
  Lab Cam - ESP32 WROOM (placa principal) - CÓDIGO FINAL
  ============================================================
  Tudo o que a placa principal faz, num arquivo só:
    - Tela touch 2,4" ILI9341 (320x240) com o visual do site
      (cores, cards com sombra e as frutinhas do site)
    - Cadastro de alimentos pela tela  -> POST /api/alimentos
    - Lista de validades               -> GET  /api/alimentos
    - Sem sensor de porta e sem relé: a fita de LED (relé) fica na
      ESP32-CAM (GPIO13) e acende antes das fotos da câmera.
    - Wi-Fi trocado pelo site (página "Wi-Fi das placas"): a placa
      baixa a lista de redes e guarda na memória. Ao ligar, conecta
      na rede salva que estiver ao alcance. A rede escrita aqui no
      código (WIFI_SSID) continua valendo como reserva.

  AI Voice (Xiaozhi): é uma placa separada, com o próprio ESP32-S3.
  Ela conversa com o backend pelo Wi-Fi (veja back/src/voz.js).
  O que for cadastrado por voz aparece aqui em até 2 minutos.

  ARQUIVOS DESTA PASTA:
    esp32_principal.ino  -> este código
    imagens.h            -> frutinhas do site convertidas (não mexer)

  BIBLIOTECAS (Ferramentas > Gerenciar Bibliotecas):
    - TFT_eSPI     (Bodmer)
    - ArduinoJson  (Benoit Blanchon), versão 7 ou mais nova

  ANTES DE GRAVAR: copie o User_Setup.h que veio junto para a
  pasta da biblioteca TFT_eSPI (veja o LEIA-ME).

  TOUCH: na primeira vez, a tela pede para tocar nas setas dos
  4 cantos. Fica salvo. Para calibrar de novo: ligue o ESP32
  com o dedo apertando a tela, ou digite "c" no Monitor Serial.
*/

#include <SPI.h>
#include <TFT_eSPI.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <time.h>
#include "imagens.h"

// Tipos usados pelas funções. Ficam aqui em cima porque a Arduino IDE monta a lista das
// funções antes do resto do código, e algumas funções recebem esses tipos.
struct Retangulo { int x, y, w, h; };

struct Alimento {
  const char* tela;   // nome desenhado (a fonte não tem acento)
  const char* nome;   // nome enviado ao backend
  int dias;           // validade média em dias
};

// ================= CONFIGURE AQUI =================
// Rede de reserva. As outras redes são cadastradas pelo site e ficam salvas na placa.
const char* WIFI_SSID     = "NOME_DO_WIFI";
const char* WIFI_PASSWORD = "SENHA_DO_WIFI";

// Endereço do backend, SEM barra no final:
//   na internet (Render): "https://labcam-api.onrender.com"
//   no computador da rede: "http://192.168.0.10:3000" (IP do ipconfig)
const char* SERVIDOR     = "https://labcam-api.onrender.com";
const char* DEVICE_KEY   = "labcam-2e6cfb01cf53";  // igual ao DEVICE_KEY do .env do backend
const int   USUARIO_ID   = 1;

const unsigned long INTERVALO_VERIFICACAO = 2UL * 60UL * 1000UL;  // atualiza a lista a cada 2 min
                                                                  // (pega o que foi cadastrado pela voz ou pelo site)
const uint16_t TOUCH_LIMIAR = 400;  // pressão mínima do toque (diminua se o toque falhar)
// ==================================================

TFT_eSPI tft = TFT_eSPI();
Preferences prefs;

const int W = 320;   // tela 2,8" deitada (rotação 1)
const int H = 240;

// ---------------- Cores do site (global.css) ----------------
uint16_t C_GREEN, C_TEAL, C_DEEP, C_DEEPER, C_LIME, C_SOFT, C_INK;
uint16_t C_BG, C_TAB, C_ROW, C_RED, C_ORANGE, C_WHITE;

uint16_t hex565(uint32_t hex) {
  return tft.color565((hex >> 16) & 0xFF, (hex >> 8) & 0xFF, hex & 0xFF);
}

void carregarCores() {
  C_GREEN  = hex565(0x00BF63);  // --green  (topo)
  C_TEAL   = hex565(0x149D8D);  // --teal   (botões)
  C_DEEP   = hex565(0x0D675C);  // --deep
  C_DEEPER = hex565(0x08423B);  // --deeper (cabeçalho da tabela)
  C_LIME   = hex565(0xB9FF66);  // --lime
  C_SOFT   = hex565(0xD3FF9E);  // --soft   (cards)
  C_INK    = hex565(0x191A23);  // --ink    (texto e sombra)
  C_BG     = hex565(0xFFFFFF);  // fundo claro do site
  C_TAB    = hex565(0xD9D9D9);  // barra de abas do app
  C_ROW    = hex565(0xEEEEEE);
  C_RED    = hex565(0xD64545);
  C_ORANGE = hex565(0xF2A33A);
  C_WHITE  = TFT_WHITE;
}

// ---------------- Alimentos da tela de cadastro ----------------
Alimento alimentos[] = {
  {"Leite",   "Leite",   7},
  {"Ovos",    "Ovos",    21},
  {"Iogurte", "Iogurte", 10},
  {"Pao",     "Pão",     5},
  {"Frango",  "Frango",  3},
  {"Alface",  "Alface",  5},
};
const int TOTAL_ALIMENTOS = sizeof(alimentos) / sizeof(alimentos[0]);

// ---------------- Layout ----------------
const int TOPO_H = 34;
const int ABAS_Y = 204;
const int ABAS_H = H - ABAS_Y;

const int COLS = 3;
const int CARD_W = 94, CARD_H = 56;
const int GAP_X = 9, GAP_Y = 12;
const int GRID_X = (W - (COLS * CARD_W + (COLS - 1) * GAP_X)) / 2;
const int GRID_Y = 70;


bool dentro(int tx, int ty, Retangulo r) {
  return tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty <= r.y + r.h;
}

Retangulo abaCadastrar = {6,   ABAS_Y + 5, 150, ABAS_H - 10};
Retangulo abaValidades = {164, ABAS_Y + 5, 150, ABAS_H - 10};
Retangulo btnConfirmar = {28,  150, 150, 32};
Retangulo btnVoltar    = {190, 150, 102, 32};

// ---------------- Estado ----------------
enum Tela { TELA_CADASTRO, TELA_CONFIRMAR, TELA_VALIDADES };
Tela telaAtual = TELA_CADASTRO;
int alimentoEscolhido = -1;

struct ItemValidade { String nome; int dias; };
const int MAX_ITENS = 20;
ItemValidade itens[MAX_ITENS];
int totalItens = 0;
int alertas = 0;             // itens vencendo em até 2 dias
bool listaCarregada = false;
bool erroLista = false;      // a última busca falhou (servidor fora do ar, chave errada...)

unsigned long ultimaVerificacao = 0;

// ============================================================
//  Imagens (frutinhas do site)
// ============================================================
void imagem(int x, int y, uint16_t w, uint16_t h, const uint16_t* dados) {
  tft.setSwapBytes(true);
  tft.pushImage(x, y, w, h, dados);
  tft.setSwapBytes(false);
}

void frutinhas(int x, int y) {   // mirtilo, cenoura e tomate lado a lado
  imagem(x,       y, img_mirtilo_w, img_mirtilo_h, img_mirtilo);
  imagem(x + 32, y, img_cenoura_w, img_cenoura_h, img_cenoura);
  imagem(x + 64, y, img_tomate_w,  img_tomate_h,  img_tomate);
}

// ============================================================
//  Peças comuns do visual
// ============================================================

// Card do site: fundo verde-claro com sombra escura embaixo
void cardComSombra(int x, int y, int w, int h, int r, uint16_t cor) {
  tft.fillRoundRect(x, y + 4, w, h, r, C_INK);
  tft.fillRoundRect(x, y, w, h, r, cor);
}

// Botão do site: teal, cantos de 7 px, texto branco
void botao(Retangulo b, const char* texto, uint16_t fundo, uint16_t corTexto) {
  tft.fillRoundRect(b.x, b.y, b.w, b.h, 7, fundo);
  tft.setFreeFont(&FreeSansBold9pt7b);
  tft.setTextColor(corTexto);
  tft.setTextDatum(MC_DATUM);
  tft.drawString(texto, b.x + b.w / 2, b.y + b.h / 2);
}

// Barra verde de cima (como o topo do app) com o tomatinho do site
void desenharTopo() {
  tft.fillRect(0, 0, W, TOPO_H, C_GREEN);
  tft.fillRoundRect(6, 2, 28, 30, 7, C_WHITE);
  imagem(10, 3, img_mascote_w, img_mascote_h, img_mascote);

  tft.setFreeFont(&FreeSansBold12pt7b);
  tft.setTextColor(C_WHITE);
  tft.setTextDatum(ML_DATUM);
  tft.drawString("LAB CAM", 42, TOPO_H / 2 + 1);

  bool on = (WiFi.status() == WL_CONNECTED);
  tft.fillCircle(W - 14, TOPO_H / 2, 5, on ? C_LIME : C_RED);
  tft.setFreeFont(&FreeSans9pt7b);
  tft.setTextDatum(MR_DATUM);
  tft.drawString(on ? "online" : "offline", W - 24, TOPO_H / 2);
}

// Título de seção com o "grifo" verde por trás, como no site
void tituloSecao(const char* texto, int y) {
  tft.setFreeFont(&FreeSansBold9pt7b);
  int largura = tft.textWidth(texto);
  tft.fillRoundRect(8, y + 6, largura + 12, 9, 4, C_LIME);
  tft.setTextColor(C_INK);
  tft.setTextDatum(TL_DATUM);
  tft.drawString(texto, 14, y - 2);
}

// Barra de abas de baixo (como a barra do app no celular)
void desenharAbas() {
  tft.fillRect(0, ABAS_Y, W, ABAS_H, C_TAB);
  bool cad = (telaAtual == TELA_CADASTRO || telaAtual == TELA_CONFIRMAR);
  bool val = (telaAtual == TELA_VALIDADES);
  botao(abaCadastrar, "CADASTRAR", cad ? C_TEAL : C_TAB, cad ? C_WHITE : C_DEEP);
  botao(abaValidades, "VALIDADES", val ? C_TEAL : C_TAB, val ? C_WHITE : C_DEEP);

  if (alertas > 0) {   // bolinha vermelha com quantos vencem logo
    int cx = abaValidades.x + abaValidades.w - 10, cy = abaValidades.y + 4;
    tft.fillCircle(cx, cy, 8, C_RED);
    tft.setTextFont(2);
    tft.setTextColor(C_WHITE);
    tft.setTextDatum(MC_DATUM);
    tft.drawString(String(alertas), cx, cy);
  }
}

void limparConteudo() {
  tft.fillRect(0, TOPO_H, W, ABAS_Y - TOPO_H, C_BG);
}

// Aviso rápido acima das abas (verde = ok, vermelho = erro)
void aviso(const char* texto, bool ok) {
  int y = ABAS_Y - 34;
  tft.fillRoundRect(20, y, W - 40, 28, 7, ok ? C_TEAL : C_RED);
  tft.setFreeFont(&FreeSansBold9pt7b);
  tft.setTextColor(C_WHITE);
  tft.setTextDatum(MC_DATUM);
  tft.drawString(texto, W / 2, y + 14);
}

// ============================================================
//  Telas
// ============================================================

void telaInicial() {
  tft.fillScreen(C_BG);
  tft.fillRect(0, 0, W, 8, C_GREEN);
  imagem(28, 70, img_mascote_grande_w, img_mascote_grande_h, img_mascote_grande);
  tft.setFreeFont(&FreeSansBold18pt7b);
  tft.setTextColor(C_INK);
  tft.setTextDatum(ML_DATUM);
  tft.drawString("LAB CAM", 108, 98);
  tft.setFreeFont(&FreeSans9pt7b);
  tft.setTextColor(C_DEEP);
  tft.drawString("Conectando ao Wi-Fi...", 110, 130);
  frutinhas(110, 150);
}

Retangulo retCard(int i) {
  int col = i % COLS, lin = i / COLS;
  return {GRID_X + col * (CARD_W + GAP_X), GRID_Y + lin * (CARD_H + GAP_Y), CARD_W, CARD_H};
}

void telaCadastro() {
  telaAtual = TELA_CADASTRO;
  limparConteudo();
  tituloSecao("CADASTRAR ALIMENTO", 44);
  frutinhas(W - 102, 38);

  for (int i = 0; i < TOTAL_ALIMENTOS; i++) {
    Retangulo r = retCard(i);
    cardComSombra(r.x, r.y, r.w, r.h, 12, C_SOFT);
    tft.setTextDatum(MC_DATUM);
    tft.setFreeFont(&FreeSansBold9pt7b);
    tft.setTextColor(C_INK);
    tft.drawString(alimentos[i].tela, r.x + r.w / 2, r.y + 20);
    tft.setFreeFont(&FreeSans9pt7b);
    tft.setTextColor(C_DEEP);
    tft.drawString(String(alimentos[i].dias) + " dias", r.x + r.w / 2, r.y + 40);
  }
  desenharAbas();
}

void telaConfirmar(int i) {
  telaAtual = TELA_CONFIRMAR;
  alimentoEscolhido = i;
  limparConteudo();
  cardComSombra(16, 42, W - 32, 154, 18, C_SOFT);
  imagem(30, 52, img_pepino_w, img_pepino_h, img_pepino);

  tft.setTextDatum(MC_DATUM);
  tft.setFreeFont(&FreeSans9pt7b);
  tft.setTextColor(C_INK);
  tft.drawString("Adicionar", 200, 66);
  tft.setFreeFont(&FreeSansBold12pt7b);
  tft.drawString(String(alimentos[i].tela) + "?", 200, 92);
  tft.setFreeFont(&FreeSans9pt7b);
  tft.setTextColor(C_DEEP);
  tft.drawString(String("Validade: ") + alimentos[i].dias + " dias", 200, 118);

  botao(btnConfirmar, "CONFIRMAR", C_TEAL, C_WHITE);
  botao(btnVoltar, "VOLTAR", C_INK, C_WHITE);
  desenharAbas();
}

void telaValidades() {
  telaAtual = TELA_VALIDADES;
  limparConteudo();
  tituloSecao("VALIDADES", 44);
  imagem(W - 28, 36, img_mascote_w, img_mascote_h, img_mascote);

  // Tabela no estilo da página Relatório do site
  const int TX = 8, TW = W - 16, TY = 68, CAB_H = 22, LIN_H = 22, LINHAS = 5;
  tft.fillRoundRect(TX, TY, TW, CAB_H + 6, 8, C_DEEPER);
  tft.setFreeFont(&FreeSansBold9pt7b);
  tft.setTextColor(C_LIME);
  tft.setTextDatum(ML_DATUM);
  tft.drawString("ALIMENTO", TX + 10, TY + CAB_H / 2 + 1);
  tft.setTextDatum(MR_DATUM);
  tft.drawString("VENCE EM", TX + TW - 10, TY + CAB_H / 2 + 1);

  int y = TY + CAB_H;
  if (!listaCarregada || totalItens == 0) {
    tft.fillRect(TX, y, TW, 4 * LIN_H, C_SOFT);
    imagem(TX + 12, y + 30, img_mirtilo_w, img_mirtilo_h, img_mirtilo);
    tft.setFreeFont(&FreeSans9pt7b);
    tft.setTextColor(C_INK);
    tft.setTextDatum(ML_DATUM);
    const char* msg = listaCarregada                 ? "Nenhum alimento cadastrado"
                    : WiFi.status() != WL_CONNECTED  ? "Sem Wi-Fi"
                    : erroLista                      ? "Erro ao falar com o servidor"
                    :                                  "Carregando...";
    tft.drawString(msg, TX + 56, y + 2 * LIN_H);
  } else {
    int mostrar = min(totalItens, LINHAS);
    for (int i = 0; i < mostrar; i++) {
      tft.fillRect(TX, y, TW, LIN_H, (i % 2 == 0) ? C_SOFT : C_ROW);
      tft.setFreeFont(&FreeSans9pt7b);
      tft.setTextColor(C_INK);
      tft.setTextDatum(ML_DATUM);
      // Nome comprido: corta com "." para não passar por cima do selo de dias
      String nome = itens[i].nome;
      const int LARGURA_NOME = TW - 82 - 16;
      while (nome.length() > 1 && tft.textWidth(nome) > LARGURA_NOME) nome = nome.substring(0, nome.length() - 2) + ".";
      tft.drawString(nome, TX + 10, y + LIN_H / 2);

      int d = itens[i].dias;
      uint16_t cor = (d <= 0) ? C_RED : (d <= 2) ? C_ORANGE : C_TEAL;
      String txt = (d < 0) ? "vencido" : (d == 0) ? "hoje" : (d == 1) ? "1 dia" : String(d) + " dias";
      tft.fillRoundRect(TX + TW - 82, y + 3, 74, LIN_H - 6, 6, cor);
      tft.setTextFont(2);
      tft.setTextColor(C_WHITE);
      tft.setTextDatum(MC_DATUM);
      tft.drawString(txt, TX + TW - 45, y + LIN_H / 2);
      y += LIN_H;
    }
    if (totalItens > LINHAS) {
      tft.setTextFont(2);
      tft.setTextColor(C_DEEP);
      tft.setTextDatum(MR_DATUM);
      tft.drawString(String("+") + (totalItens - LINHAS) + " no site", W - 34, 50);
    }
  }
  desenharAbas();
}

// ============================================================
//  Data (para calcular validade) - pega a hora da internet
// ============================================================
bool temHora = false;

void iniciarRelogio() {
  configTime(-3 * 3600, 0, "pool.ntp.org", "a.st1.ntp.br");
  struct tm t;
  temHora = getLocalTime(&t, 5000);
}

String dataDaquiA(int dias) {   // "AAAA-MM-DD"
  struct tm t;
  if (!getLocalTime(&t, 100)) return "";
  t.tm_mday += dias;
  t.tm_hour = 12;
  mktime(&t);
  char buf[11];
  strftime(buf, sizeof(buf), "%Y-%m-%d", &t);
  return String(buf);
}

// Dias entre hoje e uma data "AAAA-MM-DD..." (usado se o backend não mandar dias_restantes)
int diasAte(const char* data) {
  struct tm hoje;
  if (!data || strlen(data) < 10 || !getLocalTime(&hoje, 100)) return 9999;
  struct tm alvo = {};
  alvo.tm_year = atoi(data) - 1900;
  alvo.tm_mon  = atoi(data + 5) - 1;
  alvo.tm_mday = atoi(data + 8);
  alvo.tm_hour = 12;
  hoje.tm_hour = 12; hoje.tm_min = 0; hoje.tm_sec = 0;
  double seg = difftime(mktime(&alvo), mktime(&hoje));
  return (int)lround(seg / 86400.0);
}

// ============================================================
//  Backend
// ============================================================
String semAcento(String s) {   // a fonte da tela não tem acentos
  const char* de[]   = {"á","à","â","ã","é","ê","í","ó","ô","õ","ú","ç","Á","À","Â","Ã","É","Ê","Í","Ó","Ô","Õ","Ú","Ç"};
  const char* para[] = {"a","a","a","a","e","e","i","o","o","o","u","c","A","A","A","A","E","E","I","O","O","O","U","C"};
  for (int i = 0; i < 24; i++) s.replace(de[i], para[i]);
  if (s.length() > 24) s = s.substring(0, 23) + ".";
  return s;
}

String urlBase() {
  return String(SERVIDOR);
}

// Abre a conexão certa para o endereço: HTTPS (servidor na internet) ou HTTP (rede local).
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

void cabecalhos(HTTPClient& http) {
  http.addHeader("x-api-key", DEVICE_KEY);      // nome usado no plano do backend
  http.addHeader("x-device-key", DEVICE_KEY);   // nome usado na 1a versão do backend
}

bool enviarAlimento(const Alimento& a) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  abrir(http, urlBase() + "/api/alimentos");
  http.addHeader("Content-Type", "application/json");
  cabecalhos(http);

  JsonDocument doc;
  doc["usuario_id"] = USUARIO_ID;
  doc["nome"] = a.nome;
  doc["quantidade"] = 1;
  doc["validade_dias"] = a.dias;
  String data = dataDaquiA(a.dias);
  if (data.length()) doc["data_validade"] = data;
  doc["origem"] = "touch";
  String corpo;
  serializeJson(doc, corpo);

  int code = http.POST(corpo);
  Serial.printf("[POST] /api/alimentos -> %d\n", code);
  if (code == 401) Serial.println("HTTP 401: a DEVICE_KEY daqui está diferente da do backend");
  http.end();
  return code == 200 || code == 201;
}

// Lê a lista de alimentos. Aceita "dias_restantes" ou "data_validade".
void buscarValidades() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  abrir(http, urlBase() + "/api/alimentos?usuario_id=" + USUARIO_ID);
  cabecalhos(http);
  int code = http.GET();
  Serial.printf("[GET] /api/alimentos -> %d\n", code);
  if (code == 401) Serial.println("HTTP 401: a DEVICE_KEY daqui está diferente da do backend");
  erroLista = true;   // vira false só se a lista chegar inteira

  if (code == 200) {
    JsonDocument doc;
    DeserializationError falha = deserializeJson(doc, http.getString());
    if (falha) Serial.printf("Lista não coube na memória ou veio errada: %s\n", falha.c_str());
    if (!falha) {
      erroLista = false;
      JsonArray lista = doc.is<JsonArray>() ? doc.as<JsonArray>() : doc["alimentos"].as<JsonArray>();
      totalItens = 0;
      alertas = 0;
      for (JsonObject item : lista) {
        if (totalItens >= MAX_ITENS) break;
        const char* status = item["status"] | "";
        if (strcmp(status, "consumido") == 0) continue;

        int dias;
        if (!item["dias_restantes"].isNull()) dias = item["dias_restantes"].as<int>();
        else dias = diasAte(item["data_validade"] | "");
        if (dias == 9999) continue;

        itens[totalItens].nome = semAcento(item["nome"].as<String>());
        itens[totalItens].dias = dias;
        if (dias <= 2) alertas++;
        totalItens++;
      }
      for (int i = 1; i < totalItens; i++) {   // o que vence antes vem primeiro
        ItemValidade t = itens[i];
        int j = i - 1;
        while (j >= 0 && itens[j].dias > t.dias) { itens[j + 1] = itens[j]; j--; }
        itens[j + 1] = t;
      }
      listaCarregada = true;
    }
  }
  http.end();
}

// ============================================================
//  Redes Wi-Fi (cadastradas no site, guardadas na memória da placa)
// ============================================================
const char* NOME_PLACA = "principal";   // aparece assim na página do site
const int   MAX_REDES  = 5;             // igual ao MAX_REDES do backend

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

// Pergunta a lista ao backend. Só grava na memória se ela mudou.
// Formato da resposta (texto):  LABCAM-REDES 1 / versao <v> / <rede>\t<senha> ...
void sincronizarRedes() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  abrir(http, urlBase() + "/api/redes/placa?placa=" + NOME_PLACA +
             "&rssi=" + String(WiFi.RSSI()) + "&rede=" + codificarUrl(WiFi.SSID()));
  cabecalhos(http);
  int code = http.GET();
  String corpo = (code == 200) ? http.getString() : "";
  http.end();
  if (code != 200) { Serial.printf("[REDES] HTTP %d\n", code); return; }
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

// ============================================================
//  Touch
// ============================================================
void calibrarTouch() {
  uint16_t cal[5];
  tft.fillScreen(C_BG);
  tft.fillRect(0, 0, W, TOPO_H, C_GREEN);
  tft.setFreeFont(&FreeSansBold9pt7b);
  tft.setTextColor(C_WHITE);
  tft.setTextDatum(MC_DATUM);
  tft.drawString("CALIBRAR O TOQUE", W / 2, TOPO_H / 2);
  tft.setFreeFont(&FreeSans9pt7b);
  tft.setTextColor(C_INK);
  tft.drawString("Toque na ponta de cada seta", W / 2, H / 2 - 10);
  tft.drawString("(com a unha ou uma caneta)", W / 2, H / 2 + 12);

  tft.setTextFont(1);
  tft.calibrateTouch(cal, C_TEAL, C_BG, 15);
  prefs.putBytes("cal", cal, sizeof(cal));
  tft.setTouch(cal);
  Serial.printf("Calibracao salva: %d, %d, %d, %d, %d\n", cal[0], cal[1], cal[2], cal[3], cal[4]);
}

void iniciarTouch() {
  prefs.begin("labcam", false);
  uint16_t cal[5];
  uint16_t z = tft.getTouchRawZ();
  Serial.printf("Touch: pressao no boot = %d\n", z);

  bool dedoNaTela = z > TOUCH_LIMIAR;
  bool temCalibracao = prefs.getBytesLength("cal") == sizeof(cal);

  if (temCalibracao && !dedoNaTela) {
    prefs.getBytes("cal", cal, sizeof(cal));
    tft.setTouch(cal);
  } else {
    while (tft.getTouchRawZ() > TOUCH_LIMIAR) delay(20);   // espera soltar
    calibrarTouch();
  }
}

// Um toque vale uma vez: só aceita outro depois de soltar o dedo
bool lerToque(uint16_t& x, uint16_t& y) {
  static bool pressionado = false;
  uint16_t tx, ty;
  bool agora = tft.getTouch(&tx, &ty, TOUCH_LIMIAR);
  if (agora && !pressionado) {
    pressionado = true;
    x = tx; y = ty;
    Serial.printf("[TOQUE] x=%d y=%d\n", x, y);
    return true;
  }
  if (!agora) pressionado = false;
  return false;
}

void redesenharTelaAtual() {
  tft.fillScreen(C_BG);
  desenharTopo();
  switch (telaAtual) {
    case TELA_VALIDADES: telaValidades(); break;
    default:             telaCadastro();  break;
  }
}

void tratarToque() {
  uint16_t x, y;
  if (!lerToque(x, y)) return;

  if (dentro(x, y, abaCadastrar)) { telaCadastro(); return; }
  if (dentro(x, y, abaValidades)) {
    listaCarregada = false;
    erroLista = false;
    telaValidades();     // mostra "Carregando..."
    buscarValidades();
    telaValidades();
    return;
  }

  if (telaAtual == TELA_CADASTRO) {
    for (int i = 0; i < TOTAL_ALIMENTOS; i++) {
      if (dentro(x, y, retCard(i))) { telaConfirmar(i); return; }
    }
  } else if (telaAtual == TELA_CONFIRMAR) {
    if (dentro(x, y, btnConfirmar)) {
      botao(btnConfirmar, "ENVIANDO", C_DEEP, C_WHITE);
      bool ok = enviarAlimento(alimentos[alimentoEscolhido]);
      telaCadastro();
      aviso(ok ? "Alimento salvo!" : "Erro ao salvar", ok);
      delay(1500);
      telaCadastro();
      if (ok) {
        buscarValidades();
        desenharAbas();   // atualiza a bolinha de alertas com o alimento novo
      }
    } else if (dentro(x, y, btnVoltar)) {
      telaCadastro();
    }
  }
}

// ============================================================
//  setup / loop
// ============================================================
void conectarWiFi() {
  WiFi.mode(WIFI_STA);
  carregarRedes();
  wifiMulti.run(15000);   // procura as redes salvas e entra na de sinal mais forte
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi conectado em \"" + WiFi.SSID() + "\", IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Sem Wi-Fi (seguindo offline).");
  }
}

void setup() {
  Serial.begin(115200);

  tft.init();
  tft.setRotation(1);   // deitada: 320 x 240
  carregarCores();
  iniciarTouch();

  telaInicial();
  conectarWiFi();
  if (WiFi.status() == WL_CONNECTED) iniciarRelogio();
  sincronizarRedes();
  buscarValidades();
  ultimaVerificacao = millis();

  tft.fillScreen(C_BG);
  desenharTopo();
  telaCadastro();
}

void loop() {
  tratarToque();

  // "c" no Monitor Serial = calibrar o toque de novo
  if (Serial.available() && Serial.read() == 'c') {
    calibrarTouch();
    redesenharTelaAtual();
  }

  // Wi-Fi: atualiza o indicador e reconecta se cair
  static unsigned long ultimoWifi = 0;
  static bool estavaOnline = (WiFi.status() == WL_CONNECTED);
  bool online = (WiFi.status() == WL_CONNECTED);
  if (online != estavaOnline) {
    desenharTopo();
    estavaOnline = online;
    if (online && !temHora) iniciarRelogio();
  }
  // (a cada 60 s: procurar as redes trava a tela por alguns segundos)
  if (!online && millis() - ultimoWifi > 60000) {
    wifiMulti.run(8000);   // tenta todas as redes salvas, não só a última
    ultimoWifi = millis();
  }

  // Checagem periódica das validades (e da lista de redes do site)
  if (millis() - ultimaVerificacao > INTERVALO_VERIFICACAO) {
    sincronizarRedes();
    buscarValidades();
    ultimaVerificacao = millis();
    if (telaAtual == TELA_VALIDADES) telaValidades();
    else desenharAbas();
  }
}
