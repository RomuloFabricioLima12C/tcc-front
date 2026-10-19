// =====================================================================
// Middleware de autenticação do DISPOSITIVO (ESP32).
//
// O ESP32 não faz login com e-mail e senha. Ele manda uma chave fixa,
// combinada no .env, em todo pedido:
//   x-device-key: <DEVICE_KEY>
// Se a chave estiver certa, os dados vão para a geladeira, que é de todas as
// contas do site (veja servicos/geladeira.js).
// =====================================================================
const crypto = require('crypto')
const { idDaGeladeira } = require('../servicos/geladeira')

// Compara as chaves em "tempo constante" (não dá pistas de quantas letras acertou)
function chavesIguais(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

// true se a requisição veio de uma placa com a chave certa.
// Aceita os dois nomes de cabeçalho que as placas da robótica mandam.
function ehDispositivo(req) {
  const chaveEnviada = req.headers['x-device-key'] || req.headers['x-api-key']
  const chaveCerta = process.env.DEVICE_KEY
  return Boolean(chaveCerta && chaveEnviada && chavesIguais(chaveEnviada, chaveCerta))
}

function deviceAuth(req, res, next) {
  if (!process.env.DEVICE_KEY) {
    return res.status(500).json({ erro: 'DEVICE_KEY não configurada no servidor.' })
  }
  if (!ehDispositivo(req)) {
    return res.status(401).json({ erro: 'Chave do dispositivo inválida.' })
  }

  req.dispositivo = true
  return idDaGeladeira()
    .then((id) => {
      if (!id) {
        return res.status(409).json({ erro: 'Nenhuma conta cadastrada ainda. Crie uma conta no site.' })
      }
      req.usuario = { id }
      return next()
    })
    .catch(next)
}

module.exports = deviceAuth
module.exports.ehDispositivo = ehDispositivo
