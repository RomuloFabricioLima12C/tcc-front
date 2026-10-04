// =====================================================================
// Banco local automático.
//
// Com BANCO_LOCAL=true no .env, a própria API liga um PostgreSQL de verdade
// (pacote "embedded-postgres"), sem precisar instalar nada no computador.
// Os dados ficam guardados na pasta back/.banco-dados e continuam lá
// quando você desliga e liga a API de novo.
//
// Para usar um PostgreSQL instalado ou na nuvem, coloque BANCO_LOCAL=false
// e preencha DATABASE_URL no .env.
// =====================================================================
const fs = require('fs')
const path = require('path')

const PASTA = process.env.BANCO_LOCAL_PASTA || path.join(__dirname, '..', '.banco-dados')
const PORTA = Number(process.env.BANCO_LOCAL_PORTA) || 5433
const SENHA = 'labcam'

// Tenta conectar: se der certo, o banco local já está ligado (ex.: sobrou de uma
// execução anterior que foi fechada de repente) e é só reaproveitar.
async function bancoJaLigado(url) {
  const { Client } = require('pg')
  const cliente = new Client({ connectionString: url, connectionTimeoutMillis: 1500 })
  try {
    await cliente.connect()
    await cliente.end()
    return true
  } catch {
    return false
  }
}

async function iniciarBancoLocal() {
  const url = `postgres://postgres:${SENHA}@localhost:${PORTA}/labcam`
  if (await bancoJaLigado(url)) return url

  // O pacote é um módulo ES, por isso o import() em vez de require()
  const { default: EmbeddedPostgres } = await import('embedded-postgres')

  const jaExiste = fs.existsSync(path.join(PASTA, 'PG_VERSION'))
  const banco = new EmbeddedPostgres({
    databaseDir: PASTA,
    user: 'postgres',
    password: SENHA,
    port: PORTA,
    persistent: true, // não apaga os dados ao desligar
    initdbFlags: ['--encoding=UTF8', '--locale=C'], // aceita acentos (Rômulo, Requeijão...)
    onLog: () => {}, // esconde as mensagens internas do PostgreSQL
  })

  // Se o computador desligou com a API rodando, sobra um arquivo de "trava"
  // que impediria o banco de ligar. Como só esta API usa a pasta, dá para apagar.
  fs.rmSync(path.join(PASTA, 'postmaster.pid'), { force: true })

  if (!jaExiste) {
    console.log('Criando o banco local pela primeira vez (pode levar alguns segundos)...')
    await banco.initialise()
  }
  try {
    await banco.start()
  } catch {
    throw new Error(`não consegui ligar o banco local na porta ${PORTA}. Ela pode estar ocupada por outro programa.`)
  }
  if (!jaExiste) await banco.createDatabase('labcam')

  // Desliga o banco junto com a API (Ctrl+C no terminal)
  const desligar = async () => {
    await banco.stop().catch(() => {})
    process.exit(0)
  }
  process.on('SIGINT', desligar)
  process.on('SIGTERM', desligar)

  return url
}

module.exports = { iniciarBancoLocal }
