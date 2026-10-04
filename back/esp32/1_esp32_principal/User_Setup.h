// ============================================================
//  Lab Cam - configuração da biblioteca TFT_eSPI
//  Tela: 2,4" SPI vermelha, ILI9341, 240x320, touch XPT2046
//  (serve também para a versão de 2,8", que usa o mesmo chip)
// ------------------------------------------------------------
//  COMO USAR: copie este arquivo por cima do User_Setup.h que fica em
//    Documentos/Arduino/libraries/TFT_eSPI/User_Setup.h
//  (faça um backup do original antes). Toda vez que atualizar a
//  biblioteca TFT_eSPI, copie de novo, porque a atualização apaga.
// ============================================================

#define USER_SETUP_INFO "Lab Cam ILI9341 2.4"

// ---------- Driver da tela ----------
#define ILI9341_DRIVER

#define TFT_WIDTH  240
#define TFT_HEIGHT 320

// Se vermelho e azul saírem trocados, tire o // da linha abaixo:
// #define TFT_RGB_ORDER TFT_BGR
// Se tudo sair invertido (branco virando preto), tire o // de UMA das linhas:
// #define TFT_INVERSION_ON
// #define TFT_INVERSION_OFF

// ---------- Pinos (ESP32 WROOM) ----------
#define TFT_MISO 19   // aqui vai o T_DO do touch. O SDO(MISO) da tela pode
                      // ficar desligado: o código nunca lê da tela, e assim
                      // ele não atrapalha o touch.
#define TFT_MOSI 23   // tela SDI(MOSI)  e  touch T_DIN
#define TFT_SCLK 18   // tela SCK        e  touch T_CLK
#define TFT_CS   15   // tela CS
#define TFT_DC    2   // tela DC
#define TFT_RST   4   // tela RESET

#define TOUCH_CS 21   // touch T_CS (sem esta linha o touch NÃO funciona)
// T_IRQ não é usado pela biblioteca (pode ficar no GPIO27 ou solto).

// ---------- Fontes ----------
#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4
#define LOAD_GFXFF     // fontes FreeSans usadas no layout
#define SMOOTH_FONT

// ---------- Velocidades do SPI ----------
#define SPI_FREQUENCY        40000000
#define SPI_READ_FREQUENCY   16000000
#define SPI_TOUCH_FREQUENCY   2500000
