// ============================================================
//  Lab Cam - AI Voice (Xiaozhi)
// ============================================================
//  O módulo Xiaozhi já ouve, entende e fala sozinho (pelo servidor
//  xiaozhi.me). Este arquivo ensina o Xiaozhi a mexer na geladeira:
//  ele ganha "ferramentas" que consultam e alteram o banco do Lab Cam.
//
//  Como funciona:
//   1. No painel xiaozhi.me existe um endereço MCP (wss://...) do seu
//      agente. Ele vai no .env, em XIAOZHI_MCP_ENDPOINT.
//   2. Este servidor se conecta nesse endereço e diz quais ferramentas
//      ele tem (tools/list).
//   3. Quando alguém pergunta "o que está vencendo?", a IA do Xiaozhi
//      chama a ferramenta (tools/call), este código consulta o banco e
//      devolve um texto. O Xiaozhi fala a resposta.
//
//  O protocolo é o MCP (Model Context Protocol): mensagens JSON-RPC
//  pelo WebSocket. Usa o WebSocket que já vem no Node 22.
//  (código da equipe de robótica, ligado aos módulos deste backend)
// ============================================================
const alimentos = require('./servicos/alimentos');
const { idDaGeladeira } = require('./servicos/geladeira');

// ---------------- Ajudas para montar frases ----------------
function quandoVence(dias) {
  if (dias < -1) return `venceu há ${-dias} dias`;
  if (dias === -1) return 'venceu ontem';
  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'vence amanhã';
  return `vence em ${dias} dias`;
}

function frase(item) {
  const qtd = item.quantidade > 1 ? `${item.quantidade} ` : '';
  return `${qtd}${item.nome} (${quandoVence(item.dias_restantes)})`;
}

const juntar = (lista) => lista.length <= 1 ? lista.join('')
  : `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}`;

// ---------------- Ferramentas que o Xiaozhi pode usar ----------------
// "description" é o que a IA lê para decidir quando usar cada uma.
const FERRAMENTAS = [
  {
    name: 'alimentos_vencendo',
    description: 'Geladeira Lab Cam: lista os alimentos que já venceram ou vão vencer nos próximos dias. '
      + 'Use quando perguntarem o que está vencendo, o que precisa ser consumido logo ou se algo estragou. '
      + 'Responda ao usuário em português do Brasil.',
    inputSchema: {
      type: 'object',
      properties: {
        dias: { type: 'integer', description: 'Quantos dias à frente olhar. Padrão: 3', minimum: 0, maximum: 30 },
      },
    },
    async executar(args, ctx) {
      // A IA pode mandar qualquer número: fica entre 0 e 30, como diz o inputSchema
      const dias = Number.isInteger(args.dias) ? Math.min(30, Math.max(0, args.dias)) : 3;
      const lista = await alimentos.vencendo(ctx.usuarioId, dias, { incluirVencidos: true });
      if (!lista.length) return `Nenhum alimento vence nos próximos ${dias} dias.`;
      return `Vencem até ${dias} dias: ${juntar(lista.map(frase))}.`;
    },
  },
  {
    name: 'listar_alimentos',
    description: 'Geladeira Lab Cam: lista todos os alimentos guardados, com a validade de cada um. '
      + 'Use quando perguntarem o que tem na geladeira ou se tem algum alimento específico.',
    inputSchema: { type: 'object', properties: {} },
    async executar(args, ctx) {
      const lista = await alimentos.listar(ctx.usuarioId);
      if (!lista.length) return 'A geladeira está vazia: nenhum alimento cadastrado.';
      const mostrar = lista.slice(0, 15).map(frase);
      const resto = lista.length > 15 ? ` e mais ${lista.length - 15} itens (veja no site)` : '';
      return `Tem ${lista.length} alimento(s): ${juntar(mostrar)}${resto}.`;
    },
  },
  {
    name: 'cadastrar_alimento',
    description: 'Geladeira Lab Cam: cadastra um alimento que o usuário colocou na geladeira. '
      + 'Use quando disserem, por exemplo, "adiciona leite", "coloquei 6 ovos" ou "guardei frango que vence dia 10". '
      + 'Se o usuário não disser a validade, não pergunte: o sistema usa a validade média do alimento.',
    inputSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome do alimento em português, no singular. Ex.: leite, ovo, frango' },
        quantidade: { type: 'integer', description: 'Quantidade. Padrão: 1', minimum: 1 },
        dias_validade: { type: 'integer', description: 'Daqui a quantos dias vence, se o usuário disser', minimum: 0 },
        data_validade: { type: 'string', description: 'Data de validade no formato AAAA-MM-DD, se o usuário disser uma data' },
      },
      required: ['nome'],
    },
    async executar(args, ctx) {
      const item = await alimentos.cadastrar(ctx.usuarioId, {
        nome: args.nome,
        quantidade: args.quantidade,
        validade_dias: args.dias_validade,
        data_validade: args.data_validade,
        origem: 'voz',
      }, { origemPadrao: 'voz' });
      const aviso = item.validade_estimada ? ' (validade média estimada)' : '';
      return `Cadastrado: ${frase(item)}${aviso}.`;
    },
  },
  {
    name: 'marcar_consumido',
    description: 'Geladeira Lab Cam: marca um alimento como consumido ou jogado fora, tirando ele da lista. '
      + 'Use quando disserem "acabou o leite", "comi o iogurte" ou "joguei o frango fora".',
    inputSchema: {
      type: 'object',
      properties: { nome: { type: 'string', description: 'Nome do alimento' } },
      required: ['nome'],
    },
    async executar(args, ctx) {
      const item = await alimentos.consumirPorNome(ctx.usuarioId, args.nome);
      if (!item) return `Não encontrei "${args.nome}" na geladeira.`;
      return `Pronto, ${item.nome} saiu da lista.`;
    },
  },
];

// ---------------- Protocolo MCP (JSON-RPC) ----------------
async function responder(msg, ctx) {
  // Sem "method" = resposta a algo nosso; sem "id" = só um aviso. Nada a responder.
  if (!msg || typeof msg.method !== 'string' || msg.id === undefined) return null;
  const ok = (result) => ({ jsonrpc: '2.0', id: msg.id, result });
  const erro = (code, message) => ({ jsonrpc: '2.0', id: msg.id, error: { code, message } });

  switch (msg.method) {
    case 'initialize':
      return ok({
        protocolVersion: msg.params?.protocolVersion || '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'labcam', version: '1.0.0' },
      });

    case 'ping':
      return ok({});

    case 'tools/list':
      return ok({
        tools: FERRAMENTAS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      });

    case 'tools/call': {
      const nome = msg.params?.name;
      const ferramenta = FERRAMENTAS.find((f) => f.name === nome);
      if (!ferramenta) return erro(-32602, `Ferramenta desconhecida: ${nome}`);
      try {
        // A voz mexe na mesma geladeira do site e das placas
        const usuarioId = ctx?.usuarioId ?? await idDaGeladeira();
        if (!usuarioId) return ok({ content: [{ type: 'text', text: 'Ainda não tem nenhuma conta criada no site do Lab Cam.' }] });
        const texto = await ferramenta.executar(msg.params?.arguments || {}, { ...ctx, usuarioId });
        console.log(`[voz] ${nome}(${JSON.stringify(msg.params?.arguments || {})}) -> ${texto}`);
        return ok({ content: [{ type: 'text', text: texto }] });
      } catch (e) {
        console.error(`[voz] erro em ${nome}:`, e.message);
        return ok({ content: [{ type: 'text', text: `Erro: ${e.status === 400 ? e.message : 'falha no servidor do Lab Cam'}` }], isError: true });
      }
    }

    default:
      return erro(-32601, `Método não suportado: ${msg.method}`);
  }
}

// ---------------- Conexão com o Xiaozhi ----------------
function iniciarVoz({ endpoint }) {
  if (!endpoint) {
    console.log('[voz] XIAOZHI_MCP_ENDPOINT vazio: assistente de voz desligado');
    return;
  }
  const ctx = {};
  let tentativas = 0;

  // Caiu ou não conectou: tenta de novo em 1 s, 2 s, 4 s... até 1 min
  function tentarDeNovo() {
    const espera = Math.min(60000, 1000 * 2 ** tentativas++);
    console.log(`[voz] Desconectado. Tentando de novo em ${espera / 1000} s`);
    setTimeout(conectar, espera);
  }

  function conectar() {
    let ws;
    try {
      ws = new WebSocket(endpoint);
    } catch (e) {
      // Endereço inválido no .env: sem este try, o erro derrubaria a API inteira
      console.error(`[voz] XIAOZHI_MCP_ENDPOINT inválido (${e.message}). Assistente de voz desligado.`);
      return;
    }

    ws.addEventListener('open', () => {
      tentativas = 0;
      console.log('[voz] Conectado ao Xiaozhi');
    });

    ws.addEventListener('message', async (evento) => {
      const texto = typeof evento.data === 'string' ? evento.data : Buffer.from(evento.data).toString();
      for (const linha of texto.split('\n')) {
        if (!linha.trim()) continue;
        let msg;
        try { msg = JSON.parse(linha); } catch { continue; }
        const lote = Array.isArray(msg) ? msg : [msg];
        for (const m of lote) {
          const resposta = await responder(m, ctx);
          if (resposta && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(resposta));
        }
      }
    });

    ws.addEventListener('close', tentarDeNovo);

    ws.addEventListener('error', (e) => {
      console.error('[voz] Erro na conexão:', e.message || 'verifique o XIAOZHI_MCP_ENDPOINT');
    });
  }

  conectar();
}

module.exports = { iniciarVoz, responder, FERRAMENTAS };
