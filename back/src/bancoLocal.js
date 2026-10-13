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
const { spawn } = require('child_process')

const PASTA = process.env.BANCO_LOCAL_PASTA || path.join(__dirname, '..', '.banco-dados')
const PORTA = Number(process.env.BANCO_LOCAL_PORTA) || 5433
const SENHA = 'labcam'

// Compara pastas ignorando barras e maiúsculas (no Windows "C:\a" e "c:/a" são a mesma)
const mesmaPasta = (a, b) => {
  const normalizar = (p) => path.resolve(p).replace(/\\/g, '/').replace(/\/$/, '').toLowerCase()
  return normalizar(a) === normalizar(b)
}

// Tenta conectar. Devolve a pasta de dados do banco que respondeu, ou null se
// ninguém respondeu. Se for a nossa pasta, o banco já está ligado (sobrou de uma
// execução anterior fechada de repente) e é só reaproveitar.
async function pastaDoBancoLigado(url) {
  const { Client } = require('pg')
  const cliente = new Client({ connectionString: url.replace(/\/labcam$/, '/postgres'), connectionTimeoutMillis: 1500 })
  try {
    await cliente.connect()
    const { rows } = await cliente.query('SHOW data_directory')
    await cliente.end()
    return rows[0].data_directory
  } catch {
    await cliente.end().catch(() => {})
    return null
  }
}

// Roda o pg_ctl e espera ele terminar. stdio "ignore": o PostgreSQL que ele liga
// continua rodando, e com a saída ligada a nós o Node esperaria por ele para sempre.
function rodarPgCtl(pgCtl, args) {
  return new Promise((resolve) => {
    const processo = spawn(pgCtl, args, { stdio: 'ignore', windowsHide: true })
    processo.on('error', () => resolve(1))
    processo.on('exit', (codigo) => resolve(codigo))
  })
}

// Liga o PostgreSQL pelo pg_ctl (Windows). Devolve a função que desliga.
async function ligarComPgCtl() {
  const { pg_ctl: pgCtl } = await import('@embedded-postgres/windows-x64')
  const arquivoLog = path.join(PASTA, 'postgres.log')
  // -w: espera o banco ficar pronto; -l: mensagens do PostgreSQL vão para o arquivo de log
  const codigo = await rodarPgCtl(pgCtl, ['start', '-w', '-D', PASTA, '-o', `-p ${PORTA}`, '-l', arquivoLog])
  if (codigo !== 0) {
    const fimDoLog = fs.existsSync(arquivoLog) ? fs.readFileSync(arquivoLog, 'utf8').trim().split('\n').slice(-3).join(' ') : ''
    throw new Error(
      `não consegui ligar o banco local na porta ${PORTA}. Ela pode estar ocupada por outro programa ` +
        `(nesse caso, coloque BANCO_LOCAL_PORTA=5434 no back/.env).` +
        (fimDoLog ? ` Detalhe: ${fimDoLog}` : ''),
    )
  }
  return () => rodarPgCtl(pgCtl, ['stop', '-m', 'fast', '-D', PASTA])
}

// Cria o banco "labcam" se ele ainda não existir. Confere sempre (e não só na
// primeira vez), porque se a primeira vez foi interrompida a pasta existe mas o banco não.
async function criarBancoSeFaltar(url) {
  const { Client } = require('pg')
  const cliente = new Client({ connectionString: url.replace(/\/labcam$/, '/postgres') })
  await cliente.connect()
  try {
    const { rowCount } = await cliente.query("SELECT 1 FROM pg_database WHERE datname = 'labcam'")
    if (rowCount === 0) await cliente.query('CREATE DATABASE labcam')
  } finally {
    await cliente.end()
  }
}

async function iniciarBancoLocal() {
  const url = `postgres://postgres:${SENHA}@localhost:${PORTA}/labcam`
  const pastaLigada = await pastaDoBancoLigado(url)
  if (pastaLigada && mesmaPasta(pastaLigada, PASTA)) {
    await criarBancoSeFaltar(url)
    return url
  }
  if (pastaLigada) {
    // É o banco de OUTRA cópia do projeto (ex.: a pasta foi movida ou copiada e a
    // antiga ficou ligada). Usar ele misturaria os dados, então desligamos.
    console.log(`A porta ${PORTA} estava com o banco de outra cópia do projeto (${pastaLigada}). Desligando ele...`)
    if (process.platform === 'win32' && fs.existsSync(pastaLigada)) {
      const { pg_ctl: pgCtl } = await import('@embedded-postgres/windows-x64')
      await rodarPgCtl(pgCtl, ['stop', '-w', '-m', 'fast', '-D', pastaLigada])
    }
    if (await pastaDoBancoLigado(url)) {
      throw new Error(
        `a porta ${PORTA} está com o banco de outra cópia do projeto (${pastaLigada}). ` +
          `Desligue a API dessa cópia ou coloque BANCO_LOCAL_PORTA=5434 no back/.env.`,
      )
    }
  }

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
  // No Windows liga pelo pg_ctl (programa oficial do PostgreSQL que vem junto): ele
  // funciona mesmo quando tudo roda como administrador (ex.: Windows com o UAC
  // desligado), caso em que o PostgreSQL se recusa a ligar do jeito normal.
  let parar
  if (process.platform === 'win32') {
    parar = await ligarComPgCtl()
  } else {
    try {
      await banco.start()
    } catch {
      throw new Error(`não consegui ligar o banco local na porta ${PORTA}. Ela pode estar ocupada por outro programa.`)
    }
    parar = () => banco.stop()
  }
  await criarBancoSeFaltar(url)

  // Desliga o banco junto com a API (Ctrl+C no terminal)
  const desligar = async () => {
    await Promise.resolve(parar()).catch(() => {})
    process.exit(0)
  }
  process.on('SIGINT', desligar)
  process.on('SIGTERM', desligar)

  return url
}

module.exports = { iniciarBancoLocal }
