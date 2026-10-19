# AI Voice (Xiaozhi) — como montar e configurar

O módulo é uma placa separada (ESP32-S3), com microfone, amplificador e alto-falante. Ele **já vem com o programa dele** e conversa pela internet. **Não se grava código Arduino nele.**

O "código" do AI Voice do Lab Cam está no backend: **`back/src/voz.js`**. Ele dá ao Xiaozhi as ferramentas para consultar e mexer na geladeira.

```
 [Pessoa] --voz--> [Xiaozhi] --internet--> [servidor xiaozhi.me (IA)]
                                                   |
                                     chama as ferramentas (MCP)
                                                   v
                                     [backend Lab Cam: src/voz.js]
                                                   |
                                     [PostgreSQL] [ESP32-CAM]
```

## 1. Ligar e configurar (uma vez só)
1. Alimente o módulo com **5 V pelo USB-C** (pode ser a fonte chaveada do projeto).
2. Na primeira vez, ele cria uma rede Wi-Fi própria (normalmente "Xiaozhi-xxxx"). Conecte o celular nela e escolha o Wi-Fi da casa ou da escola.
3. Depois de conectado, ele **fala um código de 6 dígitos**. Entre em **xiaozhi.me**, crie a conta e adicione o aparelho com esse código.
4. No painel, abra as configurações do agente (papel/personalidade) e cole:
   > Você é o assistente da geladeira inteligente Lab Cam. Fale sempre em português do Brasil, com frases curtas. Para qualquer pergunta sobre alimentos, validade, ou o que tem na geladeira, use as ferramentas do Lab Cam.
5. No mesmo painel, copie o **endereço MCP** (começa com `wss://`; aparece como "MCP接入点" ou "MCP endpoint"). Cole no `.env` do backend:
   ```
   XIAOZHI_MCP_ENDPOINT=wss://...
   ```
6. Reinicie o backend. No terminal deve aparecer **`[voz] Conectado ao Xiaozhi`**.

> Se ele ligar e não falar nada nem criar a rede Wi-Fi, o programa não veio gravado. Me mandem o link de compra do módulo, que eu acho o firmware certo dessa placa.

## 2. Como o cliente usa
1. Aperta o botão verde **FALAR** (é o botão BOOT da placa).
2. Fala, por exemplo: **"o que está vencendo?"**
3. Ouve a resposta pelo alto-falante.
4. Ajusta o volume nos botões brancos **+** e **−**.

| Frase | O que acontece |
|---|---|
| "O que está vencendo?" | lista o que vence em até 3 dias (e o que já venceu) |
| "O que tem na geladeira?" | lista tudo com a validade |
| "Adiciona leite" / "Coloquei 6 ovos" / "Guardei frango que vence dia 10" | cadastra (sem data, usa a validade média) |
| "Acabou o leite" / "Joguei o frango fora" | tira da lista |

O que for cadastrado por voz aparece na **tela touch em até 2 minutos** e no site na hora.

> A palavra de ativação de fábrica é em chinês ("Nǐ hǎo Xiǎozhì"). Para o TCC, usem o **botão**.

## 3. Botões grandes do painel (R13-507, furo de 16 mm)
**Atenção:** compre a versão **pulsante / sem trava**.

| Botão do painel | Liga em paralelo com o botão da placa |
|---|---|
| Verde — FALAR | **BOOT** |
| Branco — VOLUME + | **volume+** |
| Branco — VOLUME − | **volume−** |

Como ligar cada um:
- Solde 2 fios nas perninhas do botão grande.
- Solde as outras pontas nas 2 perninhas do botãozinho da placa que **fecham quando ele é apertado**. Para achá-las, use o multímetro no modo continuidade (o que apita): as certas apitam só com o botão apertado.
- Use fios de até 20 cm.

Nada muda no código: apertar o botão grande é igual a apertar o pequeno.

## 4. Na caixa (veja `painel_frente.png`)
- O **canto do microfone** da placa fica encostado nos 5 furinhos de 2 mm.
- O **alto-falante** fica colado atrás da grade de furos de 3 mm.
- **Não tampe o microfone** e não coloque o módulo dentro da geladeira (frio e umidade).
