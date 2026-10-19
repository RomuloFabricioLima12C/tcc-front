// =====================================================================
// Middleware de autenticação do SITE (JWT).
//
// Depois do login, o site recebe um "token" e manda ele em toda requisição:
//   Authorization: Bearer <token>
// Este middleware confere se o token é válido e descobre QUAL conta está chamando.
//
// Toda conta é dona da geladeira (veja servicos/geladeira.js):
//   req.conta.id   = a conta que fez login (nome, avatar...)
//   req.usuario.id = a geladeira (alimentos, fotos, vídeo, Wi-Fi das placas)
// =====================================================================
const jwt = require('jsonwebtoken')
const { idDaGeladeira } = require('../servicos/geladeira')

async function auth(req, res, next) {
  const cabecalho = req.headers.authorization || ''
  const [tipo, token] = cabecalho.split(' ')

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Faça login para continuar (token não enviado).' })
  }

  let dados
  try {
    // jwt.verify confere a assinatura com o JWT_SECRET e se o token não expirou
    dados = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' })
  }

  try {
    req.conta = { id: dados.id, nome: dados.nome, email: dados.email }
    req.usuario = { ...req.conta, id: (await idDaGeladeira()) ?? dados.id }
    return next() // tudo certo: segue para a rota
  } catch (erro) {
    return next(erro)
  }
}

// Deixa passar quem tem login (site) OU a chave das placas (ESP32 da robótica).
// Usado em /api/alimentos e /api/comando, que as placas também chamam.
function siteOuDispositivo(req, res, next) {
  // require aqui dentro para evitar dependência circular entre os middlewares
  const deviceAuth = require('./deviceAuth')
  if (deviceAuth.ehDispositivo(req)) return deviceAuth(req, res, next)
  return auth(req, res, next)
}

module.exports = auth
module.exports.siteOuDispositivo = siteOuDispositivo
