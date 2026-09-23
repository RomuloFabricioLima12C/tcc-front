// Gera dark-pages.css a partir dos CSS das páginas (só troca cores).
const fs = require("fs");
const pages = ["compo", "passo", "quem", "ref", "game", "login", "cadastro"];
const P = 'html[data-theme="dark"] ';
const bgMap = { "#ffffff": "#000000", "#d2ff9e": "#00695c", "#f5f5f5": "#1a1a1a", "#ffffffa6": "#ffffff26", "#a2fdba": "#0b3a34" };
const colorMap = { "#000000": "#ffffff", "black": "#ffffff", "#0c665c": "#b6ff5c", "#232624": "#ffffff", "#191a23": "#ffffff" };
let out = "/* Gerado por gen-dark.js — modo escuro das demais páginas (só cores). */\n";
for (const page of pages) {
  const css = fs.readFileSync(page + ".css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  out += `\n/* ${page} */\n`;
  const re = /([^{}@;]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(css))) {
    const decls = [];
    for (const d of m[2].split(";")) {
      const i = d.indexOf(":"); if (i < 0) continue;
      const prop = d.slice(0, i).trim(); let val = d.slice(i + 1).trim().toLowerCase();
      if (prop === "color" && colorMap[val]) decls.push(`color: ${colorMap[val]}`);
      else if ((prop === "background-color" || prop === "background") && bgMap[val]) decls.push(`background-color: ${bgMap[val]}`);
      else if (prop === "border-color" && val === "#191a23") decls.push("border-color: #ffffff40");
      else if (prop === "border" && /#191a23/.test(val)) decls.push("border: " + val.replace(/#191a23/g, "#ffffff40"));
      else if (prop === "box-shadow" && /#191a23/.test(val)) decls.push("box-shadow: " + val.replace(/#191a23[0-9a-f]{0,2}/g, "#ffffff26"));
    }
    if (!decls.length) continue;
    const sel = m[1].split(",").map(s => P + s.trim()).join(",\n");
    out += `${sel} {\n  ${decls.join(";\n  ")};\n}\n`;
  }
}
fs.writeFileSync("dark-pages.css", out);
