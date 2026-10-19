// =====================================================================
// Ligação do site com o backend (pasta back/).
// O endereço da API vem de VITE_API_URL (arquivo .env do site). Se não existir:
// - em "npm run dev", usa o próprio endereço do site (o Vite repassa /api para a API);
// - na versão final, usa a API rodando no próprio computador.
// =====================================================================
export const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000')
).replace(/\/$/, '')

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

// "Esqueceu a senha?": 1) manda o código por e-mail; 2) troca a senha com o código
export const pedirCodigoSenha = (email) => api('/api/usuarios/esqueci-senha', { metodo: 'POST', corpo: { email } })
export const redefinirSenha = (email, codigo, senha) =>
  api('/api/usuarios/redefinir-senha', { metodo: 'POST', corpo: { email, codigo, senha } })

// Salva a fruta escolhida como foto de perfil e atualiza o usuário guardado no navegador
export async function salvarAvatar(avatar) {
  await api('/api/usuarios/avatar', { metodo: 'PUT', corpo: { avatar } })
  const sessao = lerSessao()
  // Escolher uma fruta tira a foto enviada (a API faz o mesmo)
  if (sessao) salvarSessao(sessao.token, { ...sessao.usuario, avatar, foto: null })
}

// Foto do próprio aparelho (já reduzida por fotoPerfil.js), no formato "data:image/jpeg;base64,..."
export async function salvarFoto(foto) {
  await api('/api/usuarios/foto', { metodo: 'PUT', corpo: { foto } })
  const sessao = lerSessao()
  if (sessao) salvarSessao(sessao.token, { ...sessao.usuario, foto })
}

export async function removerFoto() {
  await api('/api/usuarios/foto', { metodo: 'DELETE' })
  const sessao = lerSessao()
  if (sessao) salvarSessao(sessao.token, { ...sessao.usuario, foto: null })
}
export const listarAlimentos = () => api('/api/alimentos')
export const listarVencendo = (dias = 3) => api(`/api/alimentos/vencendo?dias=${dias}`)
export const criarAlimento = (alimento) => api('/api/alimentos', { metodo: 'POST', corpo: alimento })
export const apagarAlimento = (id) => api(`/api/alimentos/${id}`, { metodo: 'DELETE' })

// ---- Wi-Fi das placas (as ESP32 baixam esta lista e guardam na memória) ----
export const listarRedes = () => api('/api/redes')
export const criarRede = (rede) => api('/api/redes', { metodo: 'POST', corpo: rede })
export const editarRede = (id, dados) => api(`/api/redes/${id}`, { metodo: 'PUT', corpo: dados })
export const apagarRede = (id) => api(`/api/redes/${id}`, { metodo: 'DELETE' })

// ---- Vídeo ao vivo ----
// Espera o próximo quadro da câmera mais novo que "depois" (o servidor segura o
// pedido até 5 s). Devolve { id, data, url } ou null se nenhum quadro chegou.
// Enquanto o site pede quadros, a ESP32-CAM continua mandando.
export async function buscarQuadro(depois, sinal) {
  const sessao = lerSessao()
  let resposta
  try {
    resposta = await fetch(`${API_URL}/api/video/quadro?depois=${depois}`, {
      headers: sessao?.token ? { Authorization: `Bearer ${sessao.token}` } : {},
      cache: 'no-store',
      signal: sinal,
    })
  } catch (falha) {
    if (falha.name === 'AbortError') throw falha
    throw new ErroApi('Não foi possível falar com o servidor. Ele está ligado?', 0)
  }
  if (resposta.status === 204) return null
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}))
    throw new ErroApi(dados.erro || 'Não foi possível carregar o vídeo.', resposta.status)
  }
  return {
    id: Number(resposta.headers.get('X-Quadro-Id')),
    data: resposta.headers.get('X-Quadro-Data'),
    url: URL.createObjectURL(await resposta.blob()),
  }
}

// O servidor grátis (Render) "dorme" depois de um tempo sem uso e leva alguns
// segundos para acordar. Chamamos /api assim que o site abre: quando a pessoa for
// fazer login ou ver a câmera, ele já está acordado. Erros são ignorados.
export function acordarServidor() {
  fetch(`${API_URL}/api`, { cache: 'no-store' }).catch(() => {})
}
