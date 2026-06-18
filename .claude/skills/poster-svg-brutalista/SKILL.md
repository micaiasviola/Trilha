---
name: poster-svg-brutalista
description: >
  Use ao criar um BACKGROUND SVG tipográfico brutalista/suíço com texto VETORIZADO
  (Arial → <path> via opentype.js) para uma página de projeto/atração, e integrá-lo
  como camada de fundo. Gatilhos: "cria um pôster de fundo pro projeto X", "gera um
  SVG brutalista com o texto Y", "vetoriza esse texto em SVG", "replica o fundo do
  ECQUA-360 em outra atração". Cobre geração, cor por tema (dark→invertido),
  repetição/camadas e verificação visual via Chrome headless.
---

# Pôster SVG brutalista com texto vetorizado

Gera um pôster tipográfico (estilo suíço/brutalista) onde **todo texto vira `<path>`**
— independente de fonte instalada — e o integra como **fundo de uma atração**.
Arquivo de referência runnable nesta pasta: **`builder.template.js`**.

## O que entrega
- `public/<slug>-bg.svg` — pôster vetorizado, fundo transparente, cor única do tema.
- Integração no `src/components/project/ProjectStage.tsx`, com escopo no `slug`.

## ⚠️ Armadilhas (leia ANTES — cada uma custou tempo)

1. **`opentype.js` TEM que ser `1.3.4`.** A `2.x` tem um bug que **trunca a string no
   primeiro "t" minúsculo** (`"idempotent"` vira `"idempo"`, `"test"` vira vazio).
   Isolado com renders de teste. Em 1.3.4 carregue com `opentype.loadSync(path)`
   (a 2.x usa `opentype.parse(buffer)` e exige ArrayBuffer).
2. **Alinhe pela bounding box real, não por `getAdvanceWidth`.** Nesta lib o
   `getAdvanceWidth` diverge do que o `getPath` desenha → texto `anchor:"end"`/`"middle"`
   estoura. Use `path.getBoundingBox()` (`-bb.x2` para fim, `-(bb.x1+bb.x2)/2` para centro).
3. **`convert` no Windows NÃO é o ImageMagick** — é o conversor de disco FAT→NTFS.
   Para rasterizar SVG use o **`sharp`** que já vem no projeto Next (via `NODE_PATH`).
4. **Tema dark → inverta o "P&B".** O site é dark (`bg:#0a0e14`). Texto preto some.
   Desenhe em `ink` (`#e6edf3`). Confira sempre o `tailwind.config.ts`.

## Ferramentas
- Node + o `sharp` do projeto (`<repo>/node_modules`).
- `opentype.js@1.3.4` instalado numa pasta **temp fora do repo**.
- Fontes Helvetica-like do Windows: `C:/Windows/Fonts/arial.ttf` (+ `arialbd.ttf`).
- Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`) para screenshot headless.

## Passo a passo

1. **Entenda o alvo.** Leia `content/projects/<slug>.json` (name, tagline, description,
   technologies, status, datas, role, accentColor) e `tailwind.config.ts` (cores
   `bg`/`ink`). A copy do pôster sai daí.
2. **Identifique a fonte do alvo** (se houver imagem de referência): rasterize com sharp
   e compare. Grotesca neo-suíça (Helvetica/Akzidenz/Neue Haas) → **Arial** no Windows
   (`arial.ttf` regular, `arialbd.ttf` bold). É o clone métrico.
3. **Setup do gerador** (pasta temp, ex.: `%TEMP%/svgwork`):
   ```bash
   npm init -y && npm install opentype.js@1.3.4
   ```
4. **Copie `builder.template.js`** para a pasta temp, ajuste `CONFIG` (SLUG, OUT_SVG,
   INK, BG) e a seção **COMPOSIÇÃO**. Rode apontando o sharp do projeto:
   ```bash
   NODE_PATH="<repo>/node_modules" node builder.js
   ```
5. **Mapeie os slots → copy.** Direção "mista" (rigor técnico + impacto) funciona bem:
   | Slot | Conteúdo |
   |---|---|
   | Número gigante | nº da atração ou um número-marca (ex.: `360`) |
   | Headline empilhada | frase-herói em 2–3 linhas (`anchor:"start"`) |
   | Palavras soltas | termos do projeto, alternando preenchido/contorno (`stroke`) |
   | Labels verticais | `rotate:-90` nas bordas |
   | Metadados | nome, autor, stack, datas, status |
   | Rodapé | logos/assinaturas + régua (`ln`) |
6. **Itere no preview** (`preview-<slug>.png`) renderizado **no `bg` real** do tema.
   Cheque estouros à direita (bbox), colisões e legibilidade.
7. **Salve em `public/<slug>-bg.svg`** (o builder já escreve em `OUT_SVG`).
8. **Integre** (ver padrão abaixo), com escopo no `slug`.
9. **Verifique** com mock + Chrome headless (ver receita abaixo).

## Padrão de integração (fundo rolável + camadas)

No `ProjectStage.tsx`, ramifique pelo `slug`. Padrão de 3 camadas — pôster **repetido**
até o fim da página, fade de legibilidade e (opcional) a **torre** (`GenerativeCanvas`)
por cima:

```tsx
{project.slug === "<slug>" ? (
  <>
    {/* 1 — pôster repetido até o fim da página */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] opacity-70 lg:block"
      style={{
        backgroundImage: "url(/<slug>-bg.svg)",
        backgroundRepeat: "repeat-y",
        backgroundSize: "100% auto",
      }}
    />
    {/* 2 — fade de legibilidade sobre o texto */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] bg-gradient-to-r from-bg via-bg/40 to-transparent lg:block"
    />
    {/* 3 — torre wireframe sticky (opcional): left-0 = ATRÁS da descrição · right-0 = SOBRE o pôster */}
    <div
      aria-hidden
      className="pointer-events-none sticky top-0 hidden h-[calc(100svh-4rem)] lg:block"
      style={{ marginBottom: "calc(-1 * (100svh - 4rem))" }}
    >
      <GenerativeCanvas seed={project.slug} className="absolute right-0 top-0 h-full w-[54%]" />
    </div>
  </>
) : (
  /* fundo padrão das demais atrações (GenerativeCanvas sticky) */
)}
```

Z-order: pôster → fade → torre → conteúdo (`relative z-10`). Botões de ajuste:
`opacity-*` do pôster (impacto × respiro da torre) e `via-bg/NN` do fade (legibilidade).
Para a torre "saltar" sobre o pôster, experimente `mix-blend-screen` no canvas.

## Receita de verificação visual (sem subir o Next)

Monte um **mock HTML fiel** (mesmas cores do `tailwind.config`, grid `7fr 3fr`, painel
54%, as camadas acima; se houver canvas, **porte o código** de `GenerativeCanvas.tsx` num
`<script>` e chame `frame(2.2)` uma vez) e fotografe:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --no-sandbox --hide-scrollbars --force-device-scale-factor=1 \
  --virtual-time-budget=2500 --window-size=1440,1700 \
  --screenshot="out.png" "file:///<caminho>/mock.html"
```

Depois `sharp` para recortar/ampliar a zona de sobreposição e conferir legibilidade.
Confirme também `npx tsc --noEmit` após editar o componente.

## Replicar em outras atrações
- Rode o builder de novo com outro `SLUG`/COMPOSIÇÃO → `public/<outro-slug>-bg.svg`.
- Adicione outro ramo no `ProjectStage` (ou, para escalar, troque o `===` por um
  **registro** de slugs com pôster, ou um campo `posterBg?: string` no `Project`/JSON
  e renderize condicionalmente).
- Mantenha 1 cor (a `ink` do tema) — fundo transparente, sem `<script>`/`<style>`,
  para o SVG ficar leve e portátil (inclusive em READMEs via `<img>`).
