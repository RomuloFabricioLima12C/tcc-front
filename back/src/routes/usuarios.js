// =====================================================================
// Rotas de usuários: cadastro, login e "quem sou eu".
// =====================================================================
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query } = require('../db')
const auth = require('../middleware/auth')
const { validarSenha, validarEmail } = require('../validacao')

const router = express.Router()

// Quanto maior, mais difícil de quebrar o hash (e mais lento para calcular). 10 é o padrão.
const RODADAS_BCRYPT = 10

// Cria o token JWT com os dados básicos do usuário (nunca coloque a senha aqui!)
function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

// ---------------------------------------------------------------------
// POST /api/usuarios/cadastro
// Corpo: { "nome": "Rômulo", "email": "romulo@email.com", "senha": "Tcc@2026" }
// ---------------------------------------------------------------------
router.post('/cadastro', async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body || {}

    if (typeof nome !== 'string' || !nome.trim()) {
      return res.status(400).json({ erro: 'Informe o seu nome.' })
    }
    if (nome.trim().length > 100) {
      return res.status(400).json({ erro: 'O nome pode ter no máximo 100 caracteres.' })
    }
    const erroEmail = validarEmail(email)
    if (erroEmail) return res.status(400).json({ erro: erroEmail })
    const erroSenha = validarSenha(senha)
    if (erroSenha) return res.status(400).json({ erro: erroSenha })

    const emailNormal = email.trim().toLowerCase()

    // Confere se o e-mail já existe antes de cadastrar
    const existe = await query('SELECT id FROM usuarios WHERE email = $1', [emailNormal])
    if (existe.rowCount > 0) {
      return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail.' })
    }

    // bcrypt transforma a senha num "hash": dá para conferir depois, mas não dá para voltar à senha
    const senhaHash = await bcrypt.hash(senha, RODADAS_BCRYPT)

    const resultado = await query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, avatar, criado_em`,
      [nome.trim(), emailNormal, senhaHash],
    )
    const usuario = resultado.rows[0]

    return res.status(201).json({ usuario, token: gerarToken(usuario) })
  } catch (erro) {
    // Dois cadastros com o mesmo e-mail ao mesmo tempo: o segundo cai aqui (UNIQUE do banco)
    if (erro.code === '23505') return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail.' })
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// POST /api/usuarios/login
// Corpo: { "email": "romulo@email.com", "senha": "Tcc@2026" }
// Resposta: { "token": "...", "usuario": { id, nome, email } }
// ---------------------------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body || {}
    if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' })
    }

    const resultado = await query(
      'SELECT id, nome, email, avatar, senha_hash FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()],
    )
    const usuario = resultado.rows[0]

    // Mesma mensagem para "e-mail não existe" e "senha errada":
    // assim ninguém descobre quais e-mails estão cadastrados.
    const senhaCerta = usuario && (await bcrypt.compare(senha, usuario.senha_hash))
    if (!senhaCerta) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' })
    }

    const dados = { id: usuario.id, nome: usuario.nome, email: usuario.email, avatar: usuario.avatar }
    return res.json({ token: gerarToken(dados), usuario: dados })
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// GET /api/usuarios/eu  (precisa de token)
// Devolve os dados de quem está logado — o site usa para mostrar "Olá, Fulano".
// ---------------------------------------------------------------------
router.get('/eu', auth, async (req, res, next) => {
  try {
    const resultado = await query('SELECT id, nome, email, avatar, criado_em FROM usuarios WHERE id = $1', [
      req.usuario.id,
    ])
    if (resultado.rowCount === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' })
    return res.json(resultado.rows[0])
  } catch (erro) {
    return next(erro)
  }
})

// Frutas que o site oferece como foto de perfil (mesmos nomes de src/avatares.js no site)
const AVATARES = ['salame', 'tomate', 'cenoura', 'mirtilo', 'abacate', 'pepino', 'cebola']

// ---------------------------------------------------------------------
// PUT /api/usuarios/avatar  (precisa de token)
// Corpo: { "avatar": "tomate" }
// ---------------------------------------------------------------------
router.put('/avatar', auth, async (req, res, next) => {
  try {
    const { avatar } = req.body || {}
    if (!AVATARES.includes(avatar)) {
      return res.status(400).json({ erro: 'Escolha uma das frutas da lista.' })
    }

    const resultado = await query('UPDATE usuarios SET avatar = $1 WHERE id = $2 RETURNING avatar', [
      avatar,
      req.usuario.id,
    ])
    if (resultado.rowCount === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' })
    return res.json({ avatar: resultado.rows[0].avatar })
  } catch (erro) {
    return next(erro)
  }
})

module.exports = router
