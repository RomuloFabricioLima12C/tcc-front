// Prepara a foto de perfil escolhida no celular ou no computador:
// corta um quadrado do meio e reduz para 256x256 em JPEG (uns 20-40 KB),
// assim ela sobe rápido e cabe no banco.
const LADO = 256

export async function prepararFoto(arquivo) {
  if (!arquivo || !arquivo.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem (JPG, PNG...).')
  }

  const url = URL.createObjectURL(arquivo)
  try {
    const imagem = await new Promise((ok, falha) => {
      const el = new Image()
      el.onload = () => ok(el)
      el.onerror = () => falha(new Error('Não consegui abrir essa imagem. Tente uma foto JPG ou PNG.'))
      el.src = url
    })

    const largura = imagem.naturalWidth
    const altura = imagem.naturalHeight
    const lado = Math.min(largura, altura)

    const canvas = document.createElement('canvas')
    canvas.width = LADO
    canvas.height = LADO
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff' // PNG com fundo transparente fica com fundo branco
    ctx.fillRect(0, 0, LADO, LADO)
    // O navegador já gira a foto do celular conforme ela foi tirada (EXIF)
    ctx.drawImage(imagem, (largura - lado) / 2, (altura - lado) / 2, lado, lado, 0, 0, LADO, LADO)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}
