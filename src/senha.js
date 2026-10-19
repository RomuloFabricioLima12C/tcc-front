// Regras da senha (as mesmas da API, em back/src/validacao.js). Usadas no Cadastro
// e no "Esqueceu a senha?": cada uma aparece na lista e fica verde quando é cumprida.
export const passwordRules = [
  { id: 'len', label: 'Pelo menos 8 caracteres', test: (s) => s.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula (A-Z)', test: (s) => /[A-Z]/.test(s) },
  { id: 'lower', label: 'Uma letra minúscula (a-z)', test: (s) => /[a-z]/.test(s) },
  { id: 'number', label: 'Um número (0-9)', test: (s) => /\d/.test(s) },
  { id: 'special', label: 'Um caractere especial (!@#$%&*...)', test: (s) => /[^A-Za-z0-9\s]/.test(s) },
  { id: 'space', label: 'Sem espaços', test: (s) => s.length > 0 && !/\s/.test(s) },
]

export const senhaValida = (senha) => passwordRules.every((r) => r.test(senha))
