// =====================================================================
// Funções de validação usadas pelas rotas.
// Cada uma devolve uma mensagem de erro (texto) ou null se estiver tudo certo.
// =====================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mesmas regras de senha da página "Esqueceu a senha?" do site
function validarSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (!/[A-Z]/.test(senha)) return 'A senha precisa ter uma letra maiúscula.'
  if (!/[a-z]/.test(senha)) return 'A senha precisa ter uma letra minúscula.'
  if (!/\d/.test(senha)) return 'A senha precisa ter um número.'
  if (!/[^A-Za-z0-9\s]/.test(senha)) return 'A senha precisa ter um caractere especial (!@#$%&*...).'
  if (/\s/.test(senha)) return 'A senha não pode ter espaços.'
  return null
}

function validarEmail(email) {
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) return 'Informe um e-mail válido.'
  if (email.trim().length > 160) return 'O e-mail pode ter no máximo 160 caracteres.' // tamanho da coluna no banco
  return null
}

// Confere se é uma data real no formato AAAA-MM-DD (ex.: 2026-10-15)
function dataValida(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const [a, m, d] = texto.split('-').map(Number)
  const data = new Date(Date.UTC(a, m - 1, d))
  return data.getUTCFullYear() === a && data.getUTCMonth() === m - 1 && data.getUTCDate() === d
}

// Valida os campos de um alimento.
// "parcial = true" é usado na edição (PUT): só confere os campos que vieram.
function validarAlimento(corpo, parcial = false) {
  const { nome, categoria, quantidade, data_validade: dataValidade } = corpo || {}

  if (!parcial || nome !== undefined) {
    if (typeof nome !== 'string' || !nome.trim()) return 'Informe o nome do alimento.'
    if (nome.trim().length > 100) return 'O nome pode ter no máximo 100 caracteres.'
  }
  if (!parcial || dataValidade !== undefined) {
    if (!dataValida(dataValidade)) return 'Informe a data de validade no formato AAAA-MM-DD.'
  }
  if (quantidade !== undefined && quantidade !== null && quantidade !== '') {
    const q = Number(quantidade)
    if (!Number.isInteger(q) || q < 1) return 'A quantidade precisa ser um número inteiro maior que zero.'
  }
  if (categoria !== undefined && categoria !== null && typeof categoria !== 'string') {
    return 'A categoria precisa ser um texto.'
  }
  if (typeof categoria === 'string' && categoria.trim().length > 50) {
    return 'A categoria pode ter no máximo 50 caracteres.'
  }
  return null
}

module.exports = { validarSenha, validarEmail, validarAlimento, dataValida }
