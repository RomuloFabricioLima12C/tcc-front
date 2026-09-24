// Páginas do menu principal e palavras usadas pela barra de pesquisa.
export const mainNav = [
  { to: '/', label: 'Página inicial', keywords: 'home inicio início tcc lightlab objetivo publico diferencial servicos' },
  { to: '/projeto', label: 'Nosso projeto', keywords: 'projeto passo a passo video suporte geladeira instalar' },
  { to: '/componentes', label: 'Componentes', keywords: 'componentes lcd display esp32 cam camera led jumpers placa voz preço' },
  { to: '/quem-somos', label: 'Quem somos', keywords: 'quem somos equipe laura victor enzo romulo rômulo gabriel redes formulario' },
  { to: '/referencias', label: 'Referências', keywords: 'referencias referências artigos validade cadeia frio' },
  { to: '/jogo', label: 'Nosso game', keywords: 'jogo game freezer escape rei mofão jogar' },
]

export const extraPages = [
  { to: '/relatorio', label: 'Relatório', keywords: 'relatorio relatório tabela grafico gráfico validade filtros' },
  { to: '/camera', label: 'Câmera', keywords: 'camera câmera monitorar monitore alimentos' },
  { to: '/monitoramento', label: 'Monitoramento', keywords: 'monitoramento monitorar' },
  { to: '/recursos', label: 'Recursos', keywords: 'recursos' },
  { to: '/perfil', label: 'Perfil', keywords: 'perfil conta usuario usuário compras' },
  { to: '/login', label: 'Login', keywords: 'login entrar' },
  { to: '/cadastro', label: 'Cadastro', keywords: 'cadastro cadastrar conta' },
]

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

export function searchPages(query) {
  const q = normalize(query)
  if (!q) return null
  return (
    [...mainNav, ...extraPages].find((p) => normalize(`${p.label} ${p.keywords}`).includes(q)) ?? null
  )
}
