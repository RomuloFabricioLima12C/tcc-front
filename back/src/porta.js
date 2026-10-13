// =====================================================================
// Abre a API na porta do .env sem cair no erro "EADDRINUSE" (porta ocupada).
//
// O caso mais comum: uma API do Lab Cam antiga ficou rodando escondida
// (terminal fechado, VS Code reaberto, outra cópia da pasta do projeto).
// Nesse caso ela é desligada e a nova assume a porta. Se quem ocupa a porta
// é outro programa, mostramos uma mensagem clara de como resolver.
// =====================================================================
const { execFileSync } = require('child_process')

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function escutar(app, porta) {
  return new Promise((resolve, reject) => {
    const servidor = app.listen(porta, () => resolve(servidor))
    servidor.once('error', reject)
  })
}

// Pergunta para quem está na porta se ele é a API do Lab Cam (rota de saúde /api)
async function ehApiLabCam(porta) {
  for (const host of ['127.0.0.1', '[::1]']) {
    try {
      const resposta = await fetch(`http://${host}:${porta}/api`, { signal: AbortSignal.timeout(2000) })
      const dados = await resposta.json()
      if (/Lab Cam|API no ar/.test(dados?.mensagem || '')) return true
    } catch {
      // ninguém respondeu nesse endereço ou não é JSON: tenta o próximo
    }
  }
  return false
}

// Descobre o número (PID) do programa que está escutando na porta
function pidNaPorta(porta) {
  try {
    if (process.platform === 'win32') {
      // netstat existe em todo Windows; o texto "LISTENING" muda com o idioma, então
      // reconhecemos a linha pelo endereço remoto vazio (0.0.0.0:0 ou [::]:0)
      const saida = execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8', windowsHide: true })
      const saidaV6 = execFileSync('netstat', ['-ano', '-p', 'TCPv6'], { encoding: 'utf8', windowsHide: true })
      for (const linha of (saida + saidaV6).split(/\r?\n/)) {
        const m = linha.match(/^\s*TCP\s+\S+:(\d+)\s+(?:0\.0\.0\.0:0|\[::\]:0)\s+\S+\s+(\d+)\s*$/)
        if (m && Number(m[1]) === porta && Number(m[2]) > 0) return Number(m[2])
      }
    } else {
      const saida = execFileSync('lsof', ['-t', `-iTCP:${porta}`, '-sTCP:LISTEN'], { encoding: 'utf8' })
      const pid = Number(saida.trim().split('\n')[0])
      if (pid > 0) return pid
    }
  } catch {
    // sem netstat/lsof ou sem permissão: segue sem saber o PID
  }
  return null
}

function nomeDoPrograma(pid) {
  try {
    if (process.platform === 'win32') {
      const saida = execFileSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], {
        encoding: 'utf8',
        windowsHide: true,
      })
      return saida.split(',')[0].replace(/"/g, '').trim() || null
    }
    return execFileSync('ps', ['-p', String(pid), '-o', 'comm='], { encoding: 'utf8' }).trim() || null
  } catch {
    return null
  }
}

function encerrar(pid) {
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(pid), '/F'], { stdio: 'ignore', windowsHide: true })
    } else {
      process.kill(pid, 'SIGTERM')
    }
    return true
  } catch {
    return false
  }
}

async function abrirPorta(app, porta) {
  try {
    return await escutar(app, porta)
  } catch (erro) {
    if (erro.code !== 'EADDRINUSE') throw erro
  }

  const pid = pidNaPorta(porta)

  if (pid && pid !== process.pid && (await ehApiLabCam(porta))) {
    console.log(`A porta ${porta} estava com uma API do Lab Cam antiga ainda ligada (PID ${pid}). Desligando ela...`)
    if (encerrar(pid)) {
      // espera o Windows liberar a porta (normalmente menos de 1 s)
      for (let tentativa = 0; tentativa < 10; tentativa++) {
        await esperar(500)
        try {
          return await escutar(app, porta)
        } catch (erro) {
          if (erro.code !== 'EADDRINUSE') throw erro
        }
      }
    }
  }

  const quem = pid ? `${nomeDoPrograma(pid) || 'outro programa'} (PID ${pid})` : 'outro programa'
  throw new Error(
    `a porta ${porta} já está sendo usada por ${quem}.\n` +
      `  Feche esse programa e rode "npm start" de novo, ou troque a porta:\n` +
      `  - no back/.env: PORT=3001\n` +
      `  - no site, crie o arquivo tcc-front-main/.env com: VITE_API_URL=http://localhost:3001\n` +
      `  - nas placas ESP32, use a mesma porta nova.`,
  )
}

module.exports = { abrirPorta }
