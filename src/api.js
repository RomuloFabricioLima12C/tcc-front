// =====================================================================
// Ligação do site com o backend (pasta back/).
// O endereço da API vem de VITE_API_URL (arquivo .env do site) e, se não
// existir, usa a API rodando no próprio computador.
// =====================================================================
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

const CHAVE_TOKEN = 'labcam-token'
const CHAVE_USUARIO = 'labcam-usuario'

// ---- Sessão (token salvo no navegador depois do login) ----
export function salvarSessao(token, usuario) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token)
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
  } catch {
    // navegador sem acesso ao armazenamento: o login vale só nesta aba
  }
  sessaoMemoria = { token, usuario }
}

let sessaoMemoria = null

export function lerSessao() {
  try {
    const token = localStorage.getItem(CHAVE_TOKEN)
    if (token) return { token, usuario: JSON.parse(localStorage.getItem(CHAVE_USUARIO) || 'null') }
  } catch {
    // sem localStorage
  }
  return sessaoMemoria
}

export function sair() {
  try {
    localStorage.removeItem(CHAVE_TOKEN)
    localStorage.removeItem(CHAVE_USUARIO)
  } catch {
    // nada a fazer
  }
  sessaoMemoria = null
}

// Erro com o status HTTP junto, para a tela saber se precisa voltar ao login (401)
export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem)
    this.status = status
  }
}

// Faz a chamada com fetch, já mandando o token e lendo a resposta em JSON
export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const sessao = lerSessao()
  if (sessao?.token) headers.Authorization = `Bearer ${sessao.token}`

  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi('Não foi possível falar com o servidor. Ele está ligado?', 0)
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new ErroApi(dados.erro || 'Algo deu errado. Tente novamente.', resposta.status)
  return dados
}

// ---- Atalhos para cada rota ----
export const entrar = (email, senha) => api('/api/usuarios/login', { metodo: 'POST', corpo: { email, senha } })
export const cadastrar = (nome, email, senha) =>
  api('/api/usuarios/cadastro', { metodo: 'POST', corpo: { nome, email, senha } })
export const listarAlimentos = () => api('/api/alimentos')
export const listarVencendo = (dias = 3) => api(`/api/alimentos/vencendo?dias=${dias}`)
export const criarAlimento = (alimento) => api('/api/alimentos', { metodo: 'POST', corpo: alimento })
export const apagarAlimento = (id) => api(`/api/alimentos/${id}`, { metodo: 'DELETE' })
