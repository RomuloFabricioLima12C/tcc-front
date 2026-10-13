// =====================================================================
// Ícone de cada tipo de alimento (laticínio, embutido, carne...),
// desenhado em SVG. Usado no gráfico do Relatório.
// A categoria vem do banco; se não houver (ou for desconhecida),
// tenta adivinhar pelo nome ("Presunto" -> embutido).
// =====================================================================

const ICONES = {
  laticinio: (
    <>
      <path d="M6 27 L33 13 Q40 15 42 27 Z" fill="#ffd95a" />
      <path d="M6 27 H42 V38 Q42 40 40 40 H8 Q6 40 6 38 Z" fill="#f5b52e" />
      <circle cx="14" cy="33" r="2.6" fill="#d9921c" />
      <circle cx="26" cy="35" r="1.8" fill="#d9921c" />
      <circle cx="35" cy="32" r="2.3" fill="#d9921c" />
      <ellipse cx="31" cy="21" rx="2.2" ry="1.4" fill="#e9a62a" />
    </>
  ),
  embutido: (
    <>
      <path d="M9 31 C12 17 36 17 39 31" fill="none" stroke="#c94a3f" strokeWidth="11" strokeLinecap="round" />
      <path d="M14 24 C19 19 29 19 34 24" fill="none" stroke="#e88a7c" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="28" r="1.3" fill="#f6d2c8" />
      <circle cx="27" cy="25" r="1.3" fill="#f6d2c8" />
      <circle cx="32" cy="30" r="1.3" fill="#f6d2c8" />
      <path d="M6 37 L9 33 M42 37 L39 33" stroke="#7a3227" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  carne: (
    <>
      <path
        d="M9 22 C9 12 25 7 34 13 C43 19 41 34 30 37 C22 39 20 31 14 31 C10 31 9 27 9 22 Z"
        fill="#c0392b"
        stroke="#f4d3c6"
        strokeWidth="2.5"
      />
      <circle cx="29" cy="23" r="4.5" fill="#f7ebe1" />
      <circle cx="29" cy="23" r="2" fill="#e0cfc2" />
    </>
  ),
  fruta: (
    <>
      <path d="M24 16 C18 11 8 14 8 25 C8 35 16 42 24 40 C32 42 40 35 40 25 C40 14 30 11 24 16 Z" fill="#e74c3c" />
      <path d="M24 16 L26 8" stroke="#6d4c2f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 11 C30 6 36 6 37 8 C35 12 30 13 27 11 Z" fill="#4caf50" />
      <ellipse cx="15" cy="23" rx="2.5" ry="4" fill="#f28b80" />
    </>
  ),
  verdura: (
    <>
      <path d="M9 39 C9 20 22 9 40 8 C40 27 29 39 9 39 Z" fill="#4caf50" />
      <path d="M9 39 L33 15 M17 31 L17 23 M23 25 L30 25" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  legume: (
    <>
      <path d="M29 13 L36 20 L13 40 Q9 42 8 38 Z" fill="#f39c12" />
      <path d="M22 22 L25 25 M17 28 L20 31 M27 18 L29 20" stroke="#d35400" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 15 L36 5 M34 16 L44 11 M33 15 L41 7" stroke="#43a047" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  grao: (
    <>
      <path d="M24 43 V9" stroke="#b8862f" strokeWidth="2.5" strokeLinecap="round" />
      {[12, 19, 26, 33].map((y) => (
        <g key={y} fill="#e0b04f">
          <ellipse cx="19.5" cy={y} rx="4" ry="2.4" transform={`rotate(-35 19.5 ${y})`} />
          <ellipse cx="28.5" cy={y} rx="4" ry="2.4" transform={`rotate(35 28.5 ${y})`} />
        </g>
      ))}
      <ellipse cx="24" cy="7" rx="2.4" ry="3.6" fill="#e0b04f" />
    </>
  ),
  padaria: (
    <>
      <path d="M7 27 C7 15 41 15 41 27 V36 Q41 39 38 39 H10 Q7 39 7 36 Z" fill="#d9963b" />
      <path d="M9 26 C9 18 39 18 39 26" fill="none" stroke="#efc27a" strokeWidth="2" />
      <path d="M16 21 L20 27 M24 20 L28 26 M32 21 L35 26" stroke="#a8692a" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  bebida: (
    <>
      <rect x="19" y="5" width="10" height="6" rx="1.5" fill="#1e6fb8" />
      <path d="M17 15 Q17 11 21 11 H27 Q31 11 31 15 L34 19 V40 Q34 43 31 43 H17 Q14 43 14 40 V19 Z" fill="#3fa9f5" />
      <rect x="14" y="25" width="20" height="9" fill="#ffffff" opacity="0.85" />
      <circle cx="24" cy="29.5" r="2.6" fill="#f39c12" />
    </>
  ),
  industrializado: (
    <>
      <path d="M11 13 H37 V37 Q37 41 24 41 Q11 41 11 37 Z" fill="#9aa5ad" />
      <ellipse cx="24" cy="13" rx="13" ry="4" fill="#cfd6db" />
      <ellipse cx="24" cy="13" rx="9" ry="2.4" fill="#b3bcc2" />
      <rect x="11" y="20" width="26" height="12" fill="#e74c3c" />
      <path d="M17 26 H31" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  outro: (
    <>
      <circle cx="26" cy="26" r="15" fill="#eceff1" stroke="#b0bec5" strokeWidth="2" />
      <circle cx="26" cy="26" r="9" fill="none" stroke="#cfd8dc" strokeWidth="2" />
      <path d="M7 10 V22 M4 10 V16 Q4 19 7 19 Q10 19 10 16 V10" stroke="#78909c" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
}

// Palavras do nome que indicam a categoria (quando o banco não diz)
const PELO_NOME = {
  laticinio: ['leite', 'queijo', 'iogurte', 'manteiga', 'requeijao', 'nata', 'creme de leite'],
  embutido: ['presunto', 'peito de peru', 'salame', 'salsicha', 'mortadela', 'linguica', 'bacon'],
  carne: ['carne', 'frango', 'peixe', 'bife', 'file', 'costela'],
  fruta: ['maca', 'banana', 'laranja', 'morango', 'uva', 'manga', 'mamao', 'abacaxi', 'limao'],
  verdura: ['alface', 'couve', 'rucula', 'espinafre', 'agriao', 'repolho'],
  legume: ['cenoura', 'batata', 'tomate', 'cebola', 'abobrinha', 'beterraba', 'pepino'],
  grao: ['arroz', 'feijao', 'lentilha', 'grao de bico', 'milho', 'aveia'],
  padaria: ['pao', 'bolo', 'torrada', 'biscoito'],
  bebida: ['suco', 'refrigerante', 'agua', 'cha', 'cerveja'],
  industrializado: ['molho', 'enlatado', 'lata', 'conserva', 'atum', 'sardinha'],
}

const normalizar = (t) =>
  String(t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

function categoria(item) {
  const tipo = normalizar(item.tipo)
  if (ICONES[tipo] && tipo !== 'outro') return tipo
  const nome = normalizar(item.nome)
  const achada = Object.entries(PELO_NOME).find(([, palavras]) => palavras.some((p) => nome.startsWith(p)))
  return achada ? achada[0] : 'outro'
}

export default function IconeAlimento({ item, className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {ICONES[categoria(item)]}
    </svg>
  )
}
