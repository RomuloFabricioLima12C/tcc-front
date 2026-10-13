// =====================================================================
// Redes Wi-Fi das placas. Usado por routes/redes.js.
//
// O dono da geladeira (DEVICE_USER_ID) cadastra as redes pelo site.
// As placas perguntam a lista de tempos em tempos e guardam na memória
// delas; ao ligar, conectam na rede salva que estiver ao alcance.
// =====================================================================
const crypto = require('crypto')
const { query } = require('../db')

// A placa guarda no máximo este número de redes (igual ao MAX_REDES dos .ino)
const MAX_REDES = 5

function erroUsuario(mensagem) {
  const e = new Error(mensagem)
  e.status = 400
  return e
}

// Regras do Wi-Fi: nome com 1 a 31 bytes (limite do WiFiMulti do ESP32); senha vazia (rede aberta)
// ou de 8 a 63 caracteres (WPA2). Sem quebras de linha nem tabulação, porque a
// placa lê a lista linha por linha.
// eslint-disable-next-line no-control-regex
const temControle = (t) => /[\u0000-\u001f\u007f]/.test(t)

function validarSsid(ssid) {
  if (typeof ssid !== 'string' || !ssid.length) return 'Informe o nome da rede.'
  if (Buffer.byteLength(ssid, 'utf8') > 31) return 'O nome da rede pode ter no máximo 31 caracteres.'
  if (temControle(ssid)) return 'O nome da rede tem caracteres inválidos.'
  return null
}

function validarSenha(senha) {
  if (typeof senha !== 'string') return 'A senha precisa ser um texto.'
  if (senha.length === 0) return null
  if (senha.length < 8 || senha.length > 63) {
    return 'A senha do Wi-Fi precisa ter de 8 a 63 caracteres (ou ficar vazia, se a rede for aberta).'
  }
  if (temControle(senha)) return 'A senha tem caracteres inválidos.'
  return null
}

// Para o site: nunca devolve a senha
const paraSite = ({ id, ssid, senha, criado_em: criadoEm, atualizado_em: atualizadoEm }) => ({
  id,
  ssid,
  tem_senha: senha.length > 0,
  criado_em: criadoEm,
  atualizado_em: atualizadoEm,
})

async function listarCompleto(usuarioId) {
  const { rows } = await query(
    'SELECT id, ssid, senha, criado_em, atualizado_em FROM redes_wifi WHERE usuario_id = $1 ORDER BY id',
    [usuarioId],
  )
  return rows
}

// "Versão" da lista: muda sempre que alguma rede muda. A placa manda a versão
// que tem guardada; assim o site sabe se ela já recebeu a lista nova.
function versaoDe(redes) {
  const texto = JSON.stringify(redes.map((r) => [r.ssid, r.senha]))
  return crypto.createHash('sha1').update(texto).digest('hex').slice(0, 10)
}

async function listar(usuarioId) {
  const redes = await listarCompleto(usuarioId)
  return { redes: redes.map(paraSite), versao: versaoDe(redes), max: MAX_REDES }
}

async function cadastrar(usuarioId, dados) {
  const { ssid } = dados
  const senha = dados.senha ?? ''
  const erro = validarSsid(ssid) || validarSenha(senha)
  if (erro) throw erroUsuario(erro)

  const { rows } = await query('SELECT COUNT(*)::int AS total FROM redes_wifi WHERE usuario_id = $1', [usuarioId])
  if (rows[0].total >= MAX_REDES) {
    throw erroUsuario(`As placas guardam no máximo ${MAX_REDES} redes. Remova uma antes.`)
  }

  try {
    const { rows: novas } = await query(
      `INSERT INTO redes_wifi (usuario_id, ssid, senha) VALUES ($1, $2, $3)
       RETURNING id, ssid, senha, criado_em, atualizado_em`,
      [usuarioId, ssid, senha],
    )
    return paraSite(novas[0])
  } catch (e) {
    if (e.code === '23505') throw erroUsuario('Essa rede já está cadastrada. Para trocar a senha, use "Editar".')
    throw e
  }
}

// Altera o nome e/ou a senha. Senha não enviada = continua a mesma.
async function atualizar(usuarioId, id, dados) {
  const sets = []
  const valores = []
  if (dados.ssid !== undefined) {
    const erro = validarSsid(dados.ssid)
    if (erro) throw erroUsuario(erro)
    valores.push(dados.ssid)
    sets.push(`ssid = $${valores.length}`)
  }
  if (dados.senha !== undefined) {
    const erro = validarSenha(dados.senha)
    if (erro) throw erroUsuario(erro)
    valores.push(dados.senha)
    sets.push(`senha = $${valores.length}`)
  }
  if (!sets.length) throw erroUsuario('Envie o nome ou a senha para alterar.')

  valores.push(id, usuarioId)
  try {
    const { rows } = await query(
      `UPDATE redes_wifi SET ${sets.join(', ')}, atualizado_em = NOW()
        WHERE id = $${valores.length - 1} AND usuario_id = $${valores.length}
        RETURNING id, ssid, senha, criado_em, atualizado_em`,
      valores,
    )
    return rows[0] ? paraSite(rows[0]) : null
  } catch (e) {
    if (e.code === '23505') throw erroUsuario('Já existe outra rede com esse nome.')
    throw e
  }
}

async function remover(usuarioId, id) {
  const { rowCount } = await query('DELETE FROM redes_wifi WHERE id = $1 AND usuario_id = $2', [id, usuarioId])
  return rowCount > 0
}

// ---------------------------------------------------------------------
// Situação de cada placa. Fica só na memória: some se a API reiniciar e
// volta na próxima vez que a placa pedir a lista (em até 2 minutos).
// ---------------------------------------------------------------------
const PLACAS = ['principal', 'camera']
const situacao = new Map()

function registrarPlaca(placa, { rede, rssi, versao }) {
  if (!PLACAS.includes(placa)) return
  const sinal = Number(rssi)
  situacao.set(placa, {
    placa,
    rede: String(rede || '').slice(0, 32),
    rssi: Number.isFinite(sinal) && rssi !== '' ? sinal : null,
    versao: String(versao || '').slice(0, 20),
    visto_em: new Date().toISOString(),
  })
}

const placas = () => PLACAS.map((p) => situacao.get(p) || { placa: p, visto_em: null })

// Lista no formato de texto que a placa lê sem precisar de biblioteca:
//   LABCAM-REDES 1
//   versao <versão>
//   <nome da rede><TAB><senha>
// Devolve também a versão, que a placa passa a ter depois de ler a lista.
async function textoParaPlaca(usuarioId) {
  const redes = await listarCompleto(usuarioId)
  const versao = versaoDe(redes)
  const linhas = ['LABCAM-REDES 1', `versao ${versao}`, ...redes.map((r) => `${r.ssid}\t${r.senha}`)]
  return { texto: `${linhas.join('\n')}\n`, versao }
}

module.exports = { listar, cadastrar, atualizar, remover, registrarPlaca, placas, textoParaPlaca, MAX_REDES }
