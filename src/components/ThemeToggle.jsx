import Crop from './Crop.jsx'
import { img } from '../assets.js'
import { useTheme } from '../theme.jsx'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
    >
      <Crop s={dark ? img.toggleDark : img.toggleLight} />
    </button>
  )
}
