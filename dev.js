// =====================================================================
// "npm run dev": liga a API (back/) e o site (Vite) juntos, no mesmo terminal.
// Ctrl+C desliga os dois. Para ligar só o site: "npm run site".
// =====================================================================
import { execSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.dirname(fileURLToPath(import.meta.url))
const back = path.join(raiz, 'back')

// Projeto copiado para outro PC: instala as dependências que faltarem (só na primeira vez)
for (const pasta of [raiz, back]) {
  if (fs.existsSync(path.join(pasta, 'node_modules'))) continue
  console.log(`Instalando as dependências de ${path.relative(raiz, pasta) || 'tcc-front-main'} (só na primeira vez)...`)
  execSync('npm install', { cwd: pasta, stdio: 'inherit' })
}

// Sem .env na API: cria a partir do modelo para ela conseguir ligar
const env = path.join(back, '.env')
if (!fs.existsSync(env) && fs.existsSync(path.join(back, '.env.example'))) {
  fs.copyFileSync(path.join(back, '.env.example'), env)
  console.log('Criei back/.env a partir do back/.env.example.')
}

const processos = [
  spawn(process.execPath, ['src/server.js'], { cwd: back, stdio: 'inherit' }),
  spawn(process.execPath, [path.join(raiz, 'node_modules', 'vite', 'bin', 'vite.js')], { cwd: raiz, stdio: 'inherit' }),
]

// Se um dos dois parar (erro ou Ctrl+C), desliga o outro também
let saindo = false
for (const filho of processos) {
  filho.on('exit', (codigo) => {
    if (saindo) return
    saindo = true
    for (const outro of processos) if (outro !== filho && outro.exitCode === null) outro.kill('SIGINT')
    process.exitCode = codigo ?? 0
  })
}
// O Ctrl+C chega aos dois filhos pelo terminal; aqui só esperamos eles terminarem
process.on('SIGINT', () => {})
