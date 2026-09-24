// Mostra um recorte de imagem do Figma (ver src/assets.js).
// A largura padrão é a do design; a altura segue a proporção do quadro,
// então basta mudar a largura via CSS (--cw) para redimensionar.
export default function Crop({ s, className = '', style, alt = '' }) {
  const fx = s.flipX ? -1 : 1
  const fy = s.flipY ? -1 : 1
  return (
    <span
      className={`crop ${className}`}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      style={{
        // Tamanho do design; o CSS pode sobrescrever definindo --cw na classe.
        '--cw-native': `${s.w}px`,
        aspectRatio: `${s.w} / ${s.h}`,
        transform: fx !== 1 || fy !== 1 ? `scale(${fx}, ${fy})` : undefined,
        ...style,
      }}
    >
      <img
        src={s.src}
        alt=""
        draggable="false"
        style={{ width: `${s.iw}%`, height: `${s.ih}%`, left: `${s.l}%`, top: `${s.t}%` }}
      />
    </span>
  )
}
