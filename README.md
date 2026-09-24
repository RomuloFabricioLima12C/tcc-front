# LightLab — front-end do TCC

Site do projeto LightLab (controle inteligente de validade dos alimentos), feito a partir do Figma
com React + Vite. Tem tema claro/escuro e versão para celular.

## Rodar no computador

```bash
npm install
npm run dev
```

Abra http://localhost:5173 (use `?theme=dark` na URL para abrir direto no tema escuro).

## Gerar a versão final

```bash
npm run build
```

Os arquivos ficam em `dist/`. A Vercel faz isso sozinha a cada push na `main` (ver `vercel.json`).

## Estrutura

- `src/pages/` — uma página por tela do Figma
- `src/components/` — cabeçalho, rodapé, navegação do celular e peças comuns
- `src/styles/` — CSS de cada página; cores dos temas em `global.css`
- `src/assets.js` — recortes das imagens exportadas do Figma (`public/figma/`)
