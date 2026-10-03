// =====================================================================
// Lab Cam — firmware da tela touch (ESP32 WROOM + TFT 2,4" ILI9341 + touch XPT2046)
//
// A tela tem só duas opções:
//   CADASTRAR      -> escolhe o alimento, escolhe em quantos dias vence e salva
//                     (POST /api/dispositivo/alimentos)
//   VER VALIDADES  -> mostra os alimentos que vencem primeiro
//                     (GET /api/dispositivo/validades)
//
// Bibliotecas (Arduino IDE > Ferramentas > Gerenciar Bibliotecas):
//   - Adafruit ILI9341        (instala junto a Adafruit GFX)
//   - XPT2046_Touchscreen     (de Paul Stoffregen)
//   - ArduinoJson             (de Benoit Blanchon, versão 7)
// Placa: "ESP32 Dev Module" (pacote esp32 da Espressif)
//
// Antes de gravar: preencha o Wi-Fi no arquivo config.h (mesma pasta).
// =====================================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <XPT2046_Touchscreen.h>
#include "config.h"

// ---------------------------------------------------------------------
// Tela e toque
// ---------------------------------------------------------------------
Adafruit_ILI9341 tela(PINO_TFT_CS, PINO_TFT_DC, PINO_TFT_RST);
XPT2046_Touchscreen toque(PINO_TOQUE_CS);

const int LARGURA = 320;  // tela deitada (rotação 1)
const int ALTURA = 240;

// Cores do site (convertidas para o formato de 16 bits da tela)
const uint16_t COR_VERDE   = 0x05EC;  // #00BF63
const uint16_t COR_ESCURO  = 0x0B2B;  // #0D675C
const uint16_t COR_LIMAO   = 0xBFEC;  // #B9FF66
const uint16_t COR_FUNDO   = 0xEF7D;  // #EEEEEE
const uint16_t COR_TEXTO   = ILI9341_BLACK;
const uint16_t COR_VERMELHO = 0xD984; // #D93025
const uint16_t COR_LARANJA = 0xF3E0;  // #F57C00
const uint16_t COR_AMARELO = 0xF5A5;  // #F0B429

// ---------------------------------------------------------------------
// Alimentos que aparecem no botão CADASTRAR.
// "rotulo" é o que aparece na tela (a fonte da tela não tem acentos);
// "nome" e "categoria" são o que vai para o banco.
// ---------------------------------------------------------------------
struct Opcao {
  const char* rotulo;
  const char* nome;
  const char* categoria;
};

const Opcao ALIMENTOS[] = {
  {"Leite",    "Leite",    "Laticínio"},
  {"Iogurte",  "Iogurte",  "Laticínio"},
  {"Queijo",   "Queijo",   "Laticínio"},
  {"Presunto", "Presunto", "Embutido"},
  {"Frango",   "Frango",   "Carne"},
  {"Carne",    "Carne",    "Carne"},
  {"Fruta",    "Fruta",    "Fruta"},
  {"Verdura",  "Verdura",  "Verdura"},
};
const int QTD_ALIMENTOS = sizeof(ALIMENTOS) / sizeof(ALIMENTOS[0]);

// ---------------------------------------------------------------------
// Botões: um retângulo com texto. "dentro()" diz se o toque caiu nele.
// ---------------------------------------------------------------------
struct Botao {
  int x, y, w, h;
  const char* texto;
  uint16_t cor;
  uint16_t corTexto;
  bool dentro(int tx, int ty) const { return tx >= x && tx < x + w && ty >= y && ty < y + h; }
};

// Telas possíveis
enum Tela { MENU, ESCOLHER, DIAS, VALIDADES };
Tela telaAtual = MENU;

int escolhido = 0;      // índice do alimento escolhido
int diasParaVencer = 7; // valor que aparece na tela DIAS

// Botões de cada tela (posições em pixels, tela deitada 320x240)
const Botao BT_CADASTRAR = {20, 60, 280, 70, "CADASTRAR", COR_VERDE, ILI9341_WHITE};
const Botao BT_VALIDADES = {20, 145, 280, 70, "VER VALIDADES", COR_ESCURO, ILI9341_WHITE};
const Botao BT_VOLTAR    = {10, 200, 100, 34, "VOLTAR", ILI9341_DARKGREY, ILI9341_WHITE};
const Botao BT_ATUALIZAR = {210, 200, 100, 34, "ATUALIZAR", COR_ESCURO, ILI9341_WHITE};
const Botao BT_MENOS     = {10, 110, 70, 50, "-1", COR_ESCURO, ILI9341_WHITE};
const Botao BT_MAIS      = {90, 110, 70, 50, "+1", COR_ESCURO, ILI9341_WHITE};
const Botao BT_MAIS7     = {170, 110, 70, 50, "+7", COR_ESCURO, ILI9341_WHITE};
const Botao BT_MAIS30    = {250, 110, 60, 50, "+30", COR_ESCURO, ILI9341_WHITE};
const Botao BT_CANCELAR  = {10, 190, 140, 44, "CANCELAR", ILI9341_DARKGREY, ILI9341_WHITE};
const Botao BT_SALVAR    = {170, 190, 140, 44, "SALVAR", COR_VERDE, ILI9341_WHITE};

// Posição do botão do alimento i (grade de 4 colunas x 2 linhas)
Botao botaoAlimento(int i) {
  int col = i % 4, lin = i / 4;
  return {8 + col * 78, 42 + lin * 76, 72, 70, ALIMENTOS[i].rotulo, COR_LIMAO, COR_TEXTO};
}

// ---------------------------------------------------------------------
// Desenho
// ---------------------------------------------------------------------
void textoCentro(const char* texto, int cx, int cy, int tamanho, uint16_t cor) {
  int16_t x1, y1;
  uint16_t w, h;
  tela.setTextSize(tamanho);
  tela.getTextBounds(texto, 0, 0, &x1, &y1, &w, &h);
  tela.setCursor(cx - w / 2, cy - h / 2);
  tela.setTextColor(cor);
  tela.print(texto);
}

void desenharBotao(const Botao& b, int tamanhoTexto = 2) {
  tela.fillRoundRect(b.x, b.y, b.w, b.h, 10, b.cor);
  textoCentro(b.texto, b.x + b.w / 2, b.y + b.h / 2, tamanhoTexto, b.corTexto);
}

// Barra de cima: nome do projeto + bolinha do Wi-Fi (verde = conectado)
void desenharTopo(const char* titulo) {
  tela.fillScreen(COR_FUNDO);
  tela.fillRect(0, 0, LARGURA, 34, COR_VERDE);
  textoCentro(titulo, LARGURA / 2, 17, 2, ILI9341_WHITE);
  tela.fillCircle(LARGURA - 16, 17, 6, WiFi.status() == WL_CONNECTED ? COR_LIMAO : COR_VERMELHO);
}

// Mensagem rápida no meio da tela (ex.: "Salvando...", "Erro")
void mensagem(const char* linha1, const char* linha2, uint16_t cor) {
  tela.fillRoundRect(20, 70, 280, 100, 12, cor);
  textoCentro(linha1, LARGURA / 2, 105, 2, ILI9341_WHITE);
  if (linha2) textoCentro(linha2, LARGURA / 2, 140, 1, ILI9341_WHITE);
}

// A fonte da tela não tem acentos: troca "Pão" por "Pao", "Requeijão" por "Requeijao"...
String semAcento(const char* texto) {
  String saida;
  for (const uint8_t* p = (const uint8_t*)texto; *p; p++) {
    if (*p == 0xC3 && p[1]) {
      uint8_t c = *++p;
      if (c >= 0xA0 && c <= 0xA5) saida += 'a';
      else if (c == 0xA7) saida += 'c';
      else if (c >= 0xA8 && c <= 0xAB) saida += 'e';
      else if (c >= 0xAC && c <= 0xAF) saida += 'i';
      else if (c >= 0xB2 && c <= 0xB6) saida += 'o';
      else if (c >= 0xB9 && c <= 0xBC) saida += 'u';
      else if (c >= 0x80 && c <= 0x85) saida += 'A';
      else if (c == 0x87) saida += 'C';
      else if (c >= 0x88 && c <= 0x8B) saida += 'E';
      else if (c >= 0x8C && c <= 0x8F) saida += 'I';
      else if (c >= 0x92 && c <= 0x96) saida += 'O';
      else if (c >= 0x99 && c <= 0x9C) saida += 'U';
      else saida += '?';
    } else if (*p < 0x80) {
      saida += (char)*p;
    }
  }
  return saida;
}

// ---------------------------------------------------------------------
// Telas
// ---------------------------------------------------------------------
void telaMenu() {
  telaAtual = MENU;
  desenharTopo("LAB CAM");
  desenharBotao(BT_CADASTRAR, 3);
  desenharBotao(BT_VALIDADES, 3);
}

void telaEscolher() {
  telaAtual = ESCOLHER;
  desenharTopo("O QUE VAI GUARDAR?");
  for (int i = 0; i < QTD_ALIMENTOS; i++) desenharBotao(botaoAlimento(i), 1);
  desenharBotao(BT_VOLTAR);
}

void telaDias() {
  telaAtual = DIAS;
  desenharTopo(ALIMENTOS[escolhido].rotulo);
  textoCentro("Vence em quantos dias?", LARGURA / 2, 52, 2, COR_TEXTO);

  char numero[24];
  if (diasParaVencer == 0) snprintf(numero, sizeof(numero), "HOJE");
  else if (diasParaVencer == 1) snprintf(numero, sizeof(numero), "1 dia");
  else snprintf(numero, sizeof(numero), "%d dias", diasParaVencer);
  tela.fillRect(0, 66, LARGURA, 38, COR_FUNDO);
  textoCentro(numero, LARGURA / 2, 86, 3, COR_ESCURO);

  desenharBotao(BT_MENOS);
  desenharBotao(BT_MAIS);
  desenharBotao(BT_MAIS7);
  desenharBotao(BT_MAIS30);
  desenharBotao(BT_CANCELAR);
  desenharBotao(BT_SALVAR);
}

// ---------------------------------------------------------------------
// Conversa com a API
// ---------------------------------------------------------------------
bool garantirWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.disconnect();
  WiFi.begin(WIFI_NOME, WIFI_SENHA);
  for (int i = 0; i < 20 && WiFi.status() != WL_CONNECTED; i++) delay(500);
  return WiFi.status() == WL_CONNECTED;
}

// CADASTRAR: manda nome, categoria e dias_para_vencer. A API calcula a data.
void salvarAlimento() {
  mensagem("Salvando...", nullptr, COR_ESCURO);
  if (!garantirWifi()) {
    mensagem("Sem Wi-Fi", "Confira o nome e a senha no config.h", COR_VERMELHO);
    delay(2500);
    telaDias();
    return;
  }

  JsonDocument corpo;
  corpo["nome"] = ALIMENTOS[escolhido].nome;
  corpo["categoria"] = ALIMENTOS[escolhido].categoria;
  corpo["dias_para_vencer"] = diasParaVencer;
  String json;
  serializeJson(corpo, json);

  HTTPClient http;
  http.begin(String(API_URL) + "/api/dispositivo/alimentos");
  http.setTimeout(6000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);
  int status = http.POST(json);
  String resposta = http.getString();
  http.end();

  if (status == 201) {
    // A resposta vem enxuta: { id, nome, data_validade: "2026-10-05", dias_restantes }
    JsonDocument doc;
    deserializeJson(doc, resposta);
    const char* data = doc["data_validade"] | "";
    char linha2[40] = "";
    if (strlen(data) == 10) snprintf(linha2, sizeof(linha2), "Vence em %.2s/%.2s/%.4s", data + 8, data + 5, data);
    mensagem("SALVO!", linha2, COR_VERDE);
    delay(1800);
    telaMenu();
  } else {
    char linha2[48];
    if (status < 0) snprintf(linha2, sizeof(linha2), "API fora do ar? Veja o IP no config.h");
    else if (status == 401) snprintf(linha2, sizeof(linha2), "DEVICE_KEY diferente do back/.env");
    else snprintf(linha2, sizeof(linha2), "Erro %d da API", status);
    mensagem("NAO SALVOU", linha2, COR_VERMELHO);
    delay(2800);
    telaDias();
  }
}

// VER VALIDADES: pega até 6 alimentos (os que vencem antes vêm primeiro)
void telaValidades() {
  telaAtual = VALIDADES;
  desenharTopo("VALIDADES");
  textoCentro("Carregando...", LARGURA / 2, 110, 2, COR_TEXTO);

  int status = -1;
  String resposta;
  if (garantirWifi()) {
    HTTPClient http;
    http.begin(String(API_URL) + "/api/dispositivo/validades?limite=6");
    http.setTimeout(6000);
    http.addHeader("x-device-key", DEVICE_KEY);
    status = http.GET();
    resposta = http.getString();
    http.end();
  }

  tela.fillRect(0, 34, LARGURA, 164, COR_FUNDO);
  JsonDocument lista;
  if (status != 200 || deserializeJson(lista, resposta)) {
    textoCentro(status < 0 ? "Sem conexao com a API" : "Erro ao buscar", LARGURA / 2, 110, 2, COR_VERMELHO);
  } else if (lista.as<JsonArray>().size() == 0) {
    textoCentro("Nada cadastrado ainda", LARGURA / 2, 110, 2, COR_TEXTO);
  } else {
    int y = 40;
    for (JsonObject a : lista.as<JsonArray>()) {
      int dias = a["dias_restantes"] | 0;
      const char* data = a["data_validade"] | "";

      // Cor e texto da situação
      uint16_t cor = COR_VERDE;
      char situacao[16];
      if (dias < 0) { cor = COR_VERMELHO; snprintf(situacao, sizeof(situacao), "VENCIDO"); }
      else if (dias == 0) { cor = COR_LARANJA; snprintf(situacao, sizeof(situacao), "HOJE"); }
      else if (dias <= 3) { cor = COR_AMARELO; snprintf(situacao, sizeof(situacao), "%d dia%s", dias, dias == 1 ? "" : "s"); }
      else snprintf(situacao, sizeof(situacao), "%d dias", dias);

      tela.fillRoundRect(6, y, LARGURA - 12, 24, 6, ILI9341_WHITE);
      tela.fillRect(6, y, 6, 24, cor);

      String nome = semAcento(a["nome"] | "?");
      if (nome.length() > 13) nome = nome.substring(0, 12) + ".";
      tela.setTextSize(2);
      tela.setTextColor(COR_TEXTO);
      tela.setCursor(18, y + 5);
      tela.print(nome);

      // data no formato dd/mm
      if (strlen(data) == 10) {
        char dm[6];
        snprintf(dm, sizeof(dm), "%.2s/%.2s", data + 8, data + 5);
        tela.setTextSize(1);
        tela.setCursor(180, y + 9);
        tela.print(dm);
      }

      int16_t x1, y1;
      uint16_t w, h;
      tela.setTextSize(1);
      tela.getTextBounds(situacao, 0, 0, &x1, &y1, &w, &h);
      tela.fillRoundRect(LARGURA - 18 - w - 10, y + 4, w + 10, 16, 6, cor);
      tela.setTextColor(dias >= 1 && dias <= 3 ? COR_TEXTO : ILI9341_WHITE);
      tela.setCursor(LARGURA - 18 - w - 5, y + 8);
      tela.print(situacao);

      y += 26;
    }
  }
  desenharBotao(BT_VOLTAR);
  desenharBotao(BT_ATUALIZAR);
}

// ---------------------------------------------------------------------
// Toque: devolve true e a posição na tela quando alguém toca
// ---------------------------------------------------------------------
bool lerToque(int& x, int& y) {
  if (!toque.touched()) return false;
  TS_Point p = toque.getPoint();
  int rx = p.x, ry = p.y;
  if (TOQUE_TROCA_XY) { int t = rx; rx = ry; ry = t; }
  x = map(rx, TOQUE_X_MIN, TOQUE_X_MAX, 0, LARGURA);
  y = map(ry, TOQUE_Y_MIN, TOQUE_Y_MAX, 0, ALTURA);
  if (TOQUE_INVERTE_X) x = LARGURA - x;
  if (TOQUE_INVERTE_Y) y = ALTURA - y;
  x = constrain(x, 0, LARGURA - 1);
  y = constrain(y, 0, ALTURA - 1);

  while (toque.touched()) delay(10);  // espera soltar o dedo (evita toque duplo)
  return true;
}

// Mostra os números "crus" do toque para ajustar o config.h
void modoAjusteToque() {
  tela.fillScreen(ILI9341_WHITE);
  textoCentro("Toque nos 4 cantos", LARGURA / 2, 40, 2, COR_TEXTO);
  while (true) {
    if (toque.touched()) {
      TS_Point p = toque.getPoint();
      char linha[40];
      snprintf(linha, sizeof(linha), "x=%d  y=%d", p.x, p.y);
      tela.fillRect(0, 100, LARGURA, 40, ILI9341_WHITE);
      textoCentro(linha, LARGURA / 2, 120, 2, COR_ESCURO);
      Serial.println(linha);
      delay(150);
    }
  }
}

// ---------------------------------------------------------------------
// Arduino
// ---------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  tela.begin();
  tela.setRotation(1);   // tela deitada (320 x 240)
  toque.begin();
  toque.setRotation(1);

  if (MODO_AJUSTE_TOQUE) modoAjusteToque();

  // Liga o Wi-Fi
  desenharTopo("LAB CAM");
  textoCentro("Conectando ao Wi-Fi...", LARGURA / 2, 120, 2, COR_TEXTO);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_NOME, WIFI_SENHA);
  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) delay(500);
  Serial.print("Wi-Fi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "nao conectou");

  telaMenu();
}

void loop() {
  int x, y;
  if (!lerToque(x, y)) return;

  switch (telaAtual) {
    case MENU:
      if (BT_CADASTRAR.dentro(x, y)) telaEscolher();
      else if (BT_VALIDADES.dentro(x, y)) telaValidades();
      break;

    case ESCOLHER:
      if (BT_VOLTAR.dentro(x, y)) { telaMenu(); break; }
      for (int i = 0; i < QTD_ALIMENTOS; i++) {
        if (botaoAlimento(i).dentro(x, y)) {
          escolhido = i;
          diasParaVencer = 7;
          telaDias();
          break;
        }
      }
      break;

    case DIAS:
      if (BT_MENOS.dentro(x, y) && diasParaVencer > 0) { diasParaVencer--; telaDias(); }
      else if (BT_MAIS.dentro(x, y)) { diasParaVencer = min(diasParaVencer + 1, 3650); telaDias(); }
      else if (BT_MAIS7.dentro(x, y)) { diasParaVencer = min(diasParaVencer + 7, 3650); telaDias(); }
      else if (BT_MAIS30.dentro(x, y)) { diasParaVencer = min(diasParaVencer + 30, 3650); telaDias(); }
      else if (BT_CANCELAR.dentro(x, y)) telaMenu();
      else if (BT_SALVAR.dentro(x, y)) salvarAlimento();
      break;

    case VALIDADES:
      if (BT_VOLTAR.dentro(x, y)) telaMenu();
      else if (BT_ATUALIZAR.dentro(x, y)) telaValidades();
      break;
  }
}
