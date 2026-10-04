// =====================================================================
// Rotas da câmera usadas pelo SITE (precisam de login / token JWT).
// As fotos chegam pela ESP32-CAM em POST /api/dispositivo/foto.
// =====================================================================
const express = require('express')
const { query } = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// Manda a imagem como JPEG. O id e a hora vão em cabeçalhos para o site mostrar.
function enviarFoto(res, foto) {
  res.set({
    'Content-Type': 'image/jpeg',
    'Content-Length': foto.imagem.length,
    'Cache-Control': 'no-store', // sempre buscar a foto nova
    'X-Foto-Id': String(foto.id),
    'X-Foto-Data': new Date(foto.criado_em).toISOString(),
  })
  res.send(foto.imagem)
}

// ---------------------------------------------------------------------
// GET /api/camera/ultima  -> a foto mais recente (imagem JPEG)
// ---------------------------------------------------------------------
router.get('/ultima', async (req, res, next) => {
  try {
    const resultado = await query(
      'SELECT id, imagem, criado_em FROM fotos WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1',
      [req.usuario.id],
    )
    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'A câmera ainda não mandou nenhuma foto.' })
    }
    return enviarFoto(res, resultado.rows[0])
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// GET /api/camera/fotos  -> lista das fotos guardadas (só id, hora e tamanho)
// ---------------------------------------------------------------------
router.get('/fotos', async (req, res, next) => {
  try {
    const resultado = await query(
      'SELECT id, tamanho, criado_em FROM fotos WHERE usuario_id = $1 ORDER BY id DESC',
      [req.usuario.id],
    )
    return res.json(resultado.rows)
  } catch (erro) {
    return next(erro)
  }
})

// ---------------------------------------------------------------------
// GET /api/camera/fotos/:id  -> uma foto específica (imagem JPEG)
// ---------------------------------------------------------------------
router.get('/fotos/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ erro: 'Id inválido.' })
    const resultado = await query(
      'SELECT id, imagem, criado_em FROM fotos WHERE id = $1 AND usuario_id = $2',
      [id, req.usuario.id],
    )
    if (resultado.rowCount === 0) return res.status(404).json({ erro: 'Foto não encontrada.' })
    return enviarFoto(res, resultado.rows[0])
  } catch (erro) {
    return next(erro)
  }
})

module.exports = router
