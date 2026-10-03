// =====================================================================
// Middleware de autenticação do SITE (JWT).
//
// Depois do login, o site recebe um "token" e manda ele em toda requisição:
//   Authorization: Bearer <token>
// Este middleware confere se o token é válido e descobre QUAL usuário está
// chamando. As rotas usam req.usuario.id para só mexer nos dados dele.
// =====================================================================
const jwt = require('jsonwebtoken')

function auth(req, res, next) {
  const cabecalho = req.headers.authorization || ''
  const [tipo, token] = cabecalho.split(' ')

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Faça login para continuar (token não enviado).' })
  }

  try {
    // jwt.verify confere a assinatura com o JWT_SECRET e se o token não expirou
    const dados = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = { id: dados.id, nome: dados.nome, email: dados.email }
    return next() // tudo certo: segue para a rota
  } catch {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' })
  }
}

module.exports = auth
