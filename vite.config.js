import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Porta da API: a mesma do PORT em back/.env (padrão 3000)
function portaDaApi() {
  try {
    const env = fs.readFileSync(new URL('./back/.env', import.meta.url), 'utf8')
    return Number(env.match(/^\s*PORT\s*=\s*(\d+)/m)?.[1]) || 3000
  } catch {
    return 3000
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em "npm run dev" o site chama /api no próprio endereço e o Vite repassa para a
    // API. Assim funciona também quando o site é aberto de outro PC ou celular da rede.
    proxy: {
      '/api': `http://localhost:${portaDaApi()}`,
    },
  },
})
