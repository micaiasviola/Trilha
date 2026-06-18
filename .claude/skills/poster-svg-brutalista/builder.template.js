/**
 * TEMPLATE — gerador de pôster SVG brutalista com texto VETORIZADO (Arial → <path>).
 *
 * Uso:
 *   1. Copie este arquivo para uma pasta temp FORA do repo (ex.: %TEMP%/svgwork).
 *   2. Nessa pasta:  npm init -y && npm install opentype.js@1.3.4
 *   3. Ajuste o bloco CONFIG e a seção COMPOSIÇÃO.
 *   4. Rode (sharp vem do projeto Next via NODE_PATH):
 *        NODE_PATH="<repo>/node_modules" node builder.js
 *
 * ⚠️ ARMADILHAS (detalhe no SKILL.md) — não pule:
 *   - opentype.js DEVE ser 1.3.4. A 2.x TRUNCA a string no primeiro "t" minúsculo.
 *   - Alinhe (anchor) pela path.getBoundingBox(), NÃO por getAdvanceWidth (divergem).
 *   - Use o `sharp` do projeto (via NODE_PATH). O `convert` do Windows NÃO é ImageMagick.
 *   - Tema dark? Inverta o "P&B": texto CLARO (ink) sobre o fundo escuro, senão some.
 */
const opentype = require("opentype.js");
const sharp = require("sharp");
const fs = require("fs");

// ── CONFIG ──────────────────────────────────────────────────────────────────
const SLUG = "ecqua-360"; // slug do projeto (vira public/<SLUG>-bg.svg)
const OUT_SVG = `C:/Users/leomi/Desktop/Repositorio GIT/Git Hub Pessoal/TrilhadoDesenvolvimento/public/${SLUG}-bg.svg`;
const PREVIEW = `./preview-${SLUG}.png`;
const INK = "#e6edf3"; // = `ink` do tailwind.config.ts (tema dark → claro)
const BG = "#0a0e14"; // = `bg` do tailwind.config.ts (só para o preview)
const W = 1200, H = 1850; // tela retrato (bom para fundo rolável)

const reg = opentype.loadSync("C:/Windows/Fonts/arial.ttf"); // Helvetica-like
const bold = opentype.loadSync("C:/Windows/Fonts/arialbd.ttf");
// ─────────────────────────────────────────────────────────────────────────────

const fontFor = (w) => (w === "bold" ? bold : reg);
const P = [];
const r = (n) => Math.round(n * 10) / 10;

/** text(str, {x,y,size,weight:'bold'|'regular',rotate,anchor:'start'|'middle'|'end',fill,stroke,sw}) */
function text(str, o) {
  const size = o.size || 40, weight = o.weight || "regular";
  const rotate = o.rotate || 0, anchor = o.anchor || "start";
  const x = o.x || 0, y = o.y || 0;
  const path = fontFor(weight).getPath(str, 0, 0, size);
  const d = path.toPathData(1);
  let dx = 0;
  if (anchor !== "start") {
    const bb = path.getBoundingBox(); // ← bbox REAL do desenho, não getAdvanceWidth
    dx = anchor === "end" ? -bb.x2 : -(bb.x1 + bb.x2) / 2;
  }
  const t = `translate(${r(x)},${r(y)}) rotate(${rotate}) translate(${r(dx)},0)`;
  const style = o.stroke
    ? `fill="none" stroke="${o.stroke}" stroke-width="${o.sw || 2}"` // outline
    : `fill="${o.fill || INK}"`;
  P.push(`<path d="${d}" transform="${t}" ${style}/>`);
}
function block(lines, o) {
  const lh = o.lh || (o.size || 24) * 1.3;
  lines.forEach((l, i) => text(l, Object.assign({}, o, { y: (o.y || 0) + i * lh })));
}
function sq(x, y, s) { P.push(`<rect x="${r(x)}" y="${r(y)}" width="${s}" height="${s}" fill="${INK}"/>`); }
function ln(x1, y1, x2, y2, w) { P.push(`<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${INK}" stroke-width="${w || 2}"/>`); }

// ── COMPOSIÇÃO (edite por projeto) ───────────────────────────────────────────
// Slots clássicos do pôster suíço/brutalista. Misture filled + outline (stroke),
// labels verticais (rotate:-90) e marcas de registro (sq/ln) para o ar "técnico".

// marcas de canto
[[40, 40, 1], [1160, 40, -1]].forEach(([cx, cy, s]) => { ln(cx, cy, cx + 30 * s, cy, 2); ln(cx, cy, cx, cy + 30, 2); });
[[40, 1810, 1], [1160, 1810, -1]].forEach(([cx, cy, s]) => { ln(cx, cy, cx + 30 * s, cy, 2); ln(cx, cy, cx, cy - 30, 2); });

// metadados (canto superior esquerdo / direito)
text("ECQUA 360", { x: 64, y: 96, size: 30, weight: "bold" });
block(["CRM COMERCIAL INTERNO", "MICAÍAS VIOLA — TECH PM & FULL-STACK DEV"], { x: 64, y: 130, size: 20, lh: 26 });
block(["EM DESENVOLVIMENTO", "INÍCIO 27.05.2026", "ATRAÇÃO 02 // 360"], { x: 1136, y: 96, size: 20, lh: 26, anchor: "end" });

// número gigante + headline empilhada
text("360", { x: 1140, y: 486, size: 430, weight: "bold", anchor: "end" });
text("DO LEAD", { x: 60, y: 660, size: 150, weight: "bold" });
text("AO", { x: 60, y: 806, size: 150, weight: "bold" });
text("FECHAMENTO", { x: 60, y: 952, size: 150, weight: "bold" });

// labels verticais (rotate -90)
text("CRM INTERNO · KANBAN DE LEADS · RLS", { x: 1180, y: 960, size: 23, weight: "bold", rotate: -90 });
text("SEM RACE CONDITION", { x: 1156, y: 1380, size: 30, weight: "bold", rotate: -90 });

// palavras disruptivas (alterne preenchido / contorno)
text("IDEMPOTENTE", { x: 58, y: 1110, size: 120, weight: "bold", stroke: INK, sw: 3 });
text("ATÔMICO", { x: 58, y: 1240, size: 120, weight: "bold" });
text("VERSIONADO", { x: 58, y: 1366, size: 120, weight: "bold", stroke: INK, sw: 3 });
text("ZERO ESTADO DUPLICADO", { x: 58, y: 1470, size: 66, weight: "bold" });

// stack + "coordenadas"-código
text("// STACK", { x: 64, y: 1560, size: 22, weight: "bold" });
block(["NEXT.JS", "TYPESCRIPT", "SUPABASE", "POSTGRESQL", "TAILWIND CSS"], { x: 64, y: 1592, size: 20, lh: 26 });
block(["ACID · RLS POR user_id", "move_lead() // idempotent", "1 drag = 1 versão rastreada"], { x: 1136, y: 1560, size: 20, lh: 26, anchor: "end" });
text("ARRASTE SEM MEDO", { x: 1136, y: 1700, size: 46, weight: "bold", anchor: "end" });

// rodapé
ln(64, 1762, 1136, 1762, 2);
text("ECQUA ENGENHARIA", { x: 64, y: 1804, size: 26, weight: "bold" });
text("TRILHADO DEV", { x: 600, y: 1804, size: 26, weight: "bold", anchor: "middle" });
text("© 2026", { x: 1136, y: 1804, size: 22, anchor: "end" });

// marcas de registro espalhadas (em zonas vazias)
[[540, 150], [300, 470], [1010, 700], [1060, 1300], [720, 1620], [470, 1715]].forEach(([x, y]) => sq(x, y, 12));
ln(300, 250, 360, 250, 2); ln(1100, 560, 1100, 620, 2); ln(620, 1505, 680, 1505, 2);
// ─────────────────────────────────────────────────────────────────────────────

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n${P.join("\n")}\n</svg>\n`;
fs.writeFileSync(OUT_SVG, svg);
sharp(Buffer.from(svg)).flatten({ background: BG }).resize({ width: 820 }).png()
  .toFile(PREVIEW)
  .then((i) => console.log("OK", i.width + "x" + i.height, "| paths:", P.length, "| ->", OUT_SVG))
  .catch((e) => { console.error("ERR", e.message); process.exit(1); });
