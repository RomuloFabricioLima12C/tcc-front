// =====================================================================
// A geladeira do Lab Cam é UMA só, e toda conta criada no site é dona dela.
//
// No banco, os alimentos, fotos e redes Wi-Fi ficam guardados em nome de uma
// conta "da casa": a do DEVICE_USER_ID (padrão 1) ou, se ela não existir, a
// conta mais antiga. Quem entra no site com qualquer conta, as placas e a voz
// usam essa mesma conta, então tudo aparece para todos.
// =====================================================================
const { query } = require('../db')

let guardado = null

// Devolve o id da conta da casa, ou null se ainda não existe nenhuma conta
async function idDaGeladeira() {
  if (guardado) return guardado
  const preferido = Number(process.env.DEVICE_USER_ID) || 1
  const { rows } = await query('SELECT id FROM usuarios ORDER BY (id = $1) DESC, id LIMIT 1', [preferido])
  guardado = rows[0]?.id ?? null
  return guardado
}

module.exports = { idDaGeladeira }
