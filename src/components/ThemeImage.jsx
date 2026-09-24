import Crop from './Crop.jsx'
import { useTheme } from '../theme.jsx'

// Recorte que troca de imagem no tema escuro (logo, estrelas, sublinhados...).
export default function ThemeCrop({ light, dark, ...props }) {
  const { theme } = useTheme()
  return <Crop s={theme === 'dark' && dark ? dark : light} {...props} />
}

// SVG decorativo que troca de arquivo no tema escuro.
export function ThemeSvg({ light, dark, className = '', style }) {
  const { theme } = useTheme()
  return (
    <img
      src={theme === 'dark' && dark ? dark : light}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={className}
      style={style}
    />
  )
}
