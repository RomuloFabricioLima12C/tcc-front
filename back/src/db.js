// =====================================================================
// Conexão com o PostgreSQL usando a biblioteca "pg" (sem ORM).
// Escrevemos o SQL "na mão", o que deixa claro o que o banco está fazendo.
// =====================================================================
const { Pool, types } = require('pg')

// Por padrão o "pg" transforma colunas DATE em objetos Date do JavaScript, o que
// pode mudar o dia por causa do fuso horário. Aqui pedimos para ele devolver o
// texto puro "AAAA-MM-DD", exatamente como está no banco.
// (1082 é o código interno do tipo DATE no PostgreSQL)
types.setTypeParser(1082, (valor) => valor)

// "Hoje" para o banco precisa ser o dia do Brasil, senão as contas de
// "dias restantes" podem errar por 1 dia perto da meia-noite.
const FUSO = (process.env.DB_TIMEZONE || 'America/Sao_Paulo').replace(/[^\w/+-]/g, '')

// O "Pool" mantém algumas conexões abertas e reaproveita entre as requisições,
// em vez de abrir uma conexão nova a cada pedido (que seria lento).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  options: `-c TimeZone=${FUSO}`, // cada conexão já abre no fuso do Brasil
})

// Função curta para rodar uma consulta. Sempre use parâmetros ($1, $2...)
// em vez de juntar texto: isso protege contra "SQL injection".
//   Exemplo: query('SELECT * FROM usuarios WHERE email = $1', [email])
function query(sql, params) {
  return pool.query(sql, params)
}

module.exports = { pool, query }
