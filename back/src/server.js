// =====================================================================
// Ponto de entrada da API do Lab Cam.
//   npm start   -> liga o banco (se BANCO_LOCAL=true), cria as tabelas, abre a API e liga a voz
//   npm run dev -> igual, mas reinicia sozinho quando um arquivo muda
// =====================================================================
const fs = require('fs')
const path = require('path')

// Lê o arquivo .env (na pasta back/) e coloca os valores em process.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { iniciarBancoLocal } = require('./bancoLocal')

async function main() {
  // 1) Banco: liga o PostgreSQL local ou usa o endereço do .env
  if (process.env.BANCO_LOCAL === 'true') {
    process.env.DATABASE_URL = await iniciarBancoLocal()
  }

  // Aceita também os nomes do .env do backend da robótica (4_backend/.env.exemplo)
  const APELIDOS = { DISPOSITIVO_USUARIO_ID: 'DEVICE_USER_ID', DB_SSL: 'DATABASE_SSL', SITE_ORIGEM: 'CORS_ORIGIN' }
  for (const [nomeRobotica, nome] of Object.entries(APELIDOS)) {
    if (!process.env[nome] && process.env[nomeRobotica]) process.env[nome] = process.env[nomeRobotica]
  }

  // Avisa logo de cara se faltar alguma configuração importante no .env
  for (const nome of ['DATABASE_URL', 'JWT_SECRET', 'DEVICE_KEY']) {
    if (!process.env[nome]) {
      console.error(`Falta a variável ${nome} no arquivo .env (veja o .env.example).`)
      process.exit(1)
    }
  }

  // Só agora carregamos o db.js, porque ele precisa do DATABASE_URL já definido
  const express = require('express')
  const cors = require('cors')
  const { pool } = require('./db')

  // 2) Cria as tabelas se ainda não existirem (o schema.sql pode rodar várias vezes)
  const schema = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8')
  await pool.query(schema)

  // 3) Conta da casa (opcional): se o banco não tem nenhum usuário e o .env tem
  //    CONTA_EMAIL e CONTA_SENHA, cria essa conta. Sem isso, a primeira conta
  //    criada no site guarda os dados da geladeira (toda conta vê e mexe neles).
  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM usuarios')
  if (rows[0].total === 0 && process.env.CONTA_EMAIL && process.env.CONTA_SENHA) {
    const bcrypt = require('bcryptjs')
    await pool.query('INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3)', [
      process.env.CONTA_NOME || 'Lab Cam',
      process.env.CONTA_EMAIL.trim().toLowerCase(),
      await bcrypt.hash(process.env.CONTA_SENHA, 10),
    ])
    console.log(`Conta da casa criada: ${process.env.CONTA_EMAIL}`)
  }

  const app = express()

  // ---- CORS: quais sites podem chamar esta API pelo navegador ----
  const origens = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim())
  // exposedHeaders: deixa o site ler o id e a hora da foto (cabeçalhos X-Foto-...)
  app.use(
    cors({
      origin: origens.includes('*') ? true : origens,
      exposedHeaders: ['X-Foto-Id', 'X-Foto-Data', 'X-Quadro-Id', 'X-Quadro-Data'],
    }),
  )

  // ---- Lê o corpo das requisições em JSON (limite pequeno: ninguém precisa mandar mais que isso) ----
  // A foto de perfil (já reduzida pelo site) é a única exceção: até 250 KB
  app.use('/api/usuarios/foto', express.json({ limit: '250kb' }))
  app.use(express.json({ limit: '20kb' }))

  // ---- Rota de saúde: serve para ver se a API e o banco estão no ar ----
  app.get('/api', async (req, res) => {
    try {
      await pool.query('SELECT 1')
      res.json({ status: 'ok', mensagem: 'API do Lab Cam funcionando', banco: 'conectado' })
    } catch {
      res.status(503).json({ status: 'erro', mensagem: 'API no ar, mas sem conexão com o banco' })
    }
  })

  // ---- Rotas ----
  app.use('/api/usuarios', require('./routes/usuarios'))
  app.use('/api/alimentos', require('./routes/alimentos'))
  app.use('/api/dispositivo', require('./routes/dispositivo'))
  app.use('/api/camera', require('./routes/camera'))
  app.use('/api/video', require('./routes/video'))
  app.use('/api/redes', require('./routes/redes'))
  app.use('/api', require('./routes/comando')) // /api/fotos e /api/comando (robótica)

  // ---- Rota que não existe ----
  app.use((req, res) => {
    res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` })
  })

  // ---- Tratamento de erros: qualquer erro não previsto cai aqui ----
  // (o Express reconhece que é o tratador de erros porque a função tem 4 parâmetros)
  // eslint-disable-next-line no-unused-vars
  app.use((erro, req, res, next) => {
    if (erro.type === 'entity.parse.failed') {
      return res.status(400).json({ erro: 'O corpo da requisição não é um JSON válido.' })
    }
    if (erro.type === 'entity.too.large') {
      return res.status(413).json({ erro: 'Requisição grande demais.' })
    }
    // 22021 / 22P05 = o texto tem caracteres que o banco não consegue guardar
    // (ex.: acento enviado com a codificação errada). É erro de quem mandou, não do servidor.
    if (erro.code === '22021' || erro.code === '22P05') {
      return res.status(400).json({ erro: 'O texto enviado tem caracteres inválidos. Envie em UTF-8.' })
    }
    console.error('Erro inesperado:', erro)
    return res.status(500).json({ erro: 'Erro interno no servidor. Tente novamente.' })
  })

  // Se a porta estiver ocupada por uma API do Lab Cam antiga, ela é desligada (ver porta.js)
  const PORTA = Number(process.env.PORT) || 3000
  await require('./porta').abrirPorta(app, PORTA)
  console.log(`API do Lab Cam rodando em http://localhost:${PORTA}/api`)

  // 4) Assistente de voz (Xiaozhi). Fica desligado se XIAOZHI_MCP_ENDPOINT estiver vazio.
  require('./voz').iniciarVoz({ endpoint: process.env.XIAOZHI_MCP_ENDPOINT })
}

main().catch((erro) => {
  console.error('Não foi possível ligar a API:', erro?.message || erro)
  process.exit(1)
})
