# Contexto Arquitetural — Trilhado Desenvolvimento

Referência viva das regras que governam o sistema. Sempre que um agente (IA ou dev)
precisar tomar uma decisão de implementação, este documento é a fonte de verdade do
projeto. Para aprofundar qualquer regra, consulte os treinos mapeados em `skill.md`.

---

## 1. Stack e configuração

| Camada | Escolha | Arquivo |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript | `next.config.mjs` |
| Estilo | Tailwind CSS (tokens centrais) | `tailwind.config.ts` |
| Animação | GSAP 3.15 + `@gsap/react` + ScrollTrigger | `src/lib/anim/gsap.ts` |
| Scroll suave | Lenis 1.3 | `src/components/anim/SmoothScroll.tsx` |
| Conteúdo | JSON local em `content/weeks/` e `content/projects/` | `src/lib/content.ts` |
| Tipos | Centrais em `src/lib/types.ts` | — |

---

## 2. Design System — Tokens

Todos os tokens vivem em `tailwind.config.ts`. **Nunca use valores raw de cor no JSX.**
Use sempre os aliases semânticos abaixo.

### Paleta

```ts
// tailwind.config.ts — linha 7–23
bg:       "#0a0e14"   // fundo principal
bg-soft:  "#0f141d"   // camada intermediária
bg-card:  "#131a25"   // superfície de card
line:     "#1e2733"   // divisores, bordas
ink:      "#e6edf3"   // texto principal
ink-muted:"#9aa7b4"   // texto secundário
ink-faint:"#647082"   // texto terciário / labels
accent:   "#34d399"   // verde primário
accent-cyan:"#22d3ee" // ciano, gradientes + commit refactor
```

### Gradiente de marca

```tsx
// padrão em vários componentes
className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent"
```

### Sombra de destaque

```ts
// tailwind.config.ts linha 26–28
shadow-glow: "0 0 0 1px rgba(52,211,153,0.15), 0 8px 40px -12px rgba(34,211,238,0.25)"
```

### Tipografia

```ts
font-sans: var(--font-inter)   // Inter (Google Fonts)
font-mono: var(--font-mono)    // JetBrains Mono
```

Carregadas em `src/app/layout.tsx` via `next/font/google` e expostas como variáveis CSS.

---

## 3. Design System — Componentes visuais

### Badges (`src/components/Badge.tsx`)

- `<StatusBadge status={project.status} label="…">` — in-progress / shipped / paused
- `<TechBadge name="React">` — chip de tecnologia

### Cards de atração (`src/components/ProjectCard.tsx`)

Layout padronizado com `bg-card`, `border-line`, hover `border-accent/40`.

### Entrada semanal (`src/components/TimelineEntry.tsx`)

Representa uma semana na timeline. Usa o mesmo vocabulário de bordas e mono.

### Stat card (`src/components/StatCard.tsx`)

`rounded-xl border border-line bg-bg-card p-3 text-center` + Odômetro animado.

---

## 4. Sistema de animação

### 4.1 Loop único

**Regra:** Todo movimento roda no `gsap.ticker`. Nunca crie um `requestAnimationFrame`
fora do ticker, exceto o canvas (que é pauseável por visibilidade — ver §4.7).

```ts
// src/components/anim/SmoothScroll.tsx linha 27–29
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### 4.2 Eases canônicos

```ts
// src/lib/anim/gsap.ts linha 15–21
EASE.in       = "power4.out"          // entradas
EASE.out      = "power2.in"           // saídas
EASE.wipe     = "power4.inOut"        // cortes/wipes
EASE.magnetic = "elastic.out(1, 0.4)" // interação física
EASE.liquid   = "elastic.out(1.2, 0.18)" // sublinhas elásticas
```

Nunca invente um ease ad-hoc. Se o efeito não se encaixar nesses cinco, consulte
`TREINO-ANIMACOES §2`.

### 4.3 Propriedades animáveis

**Somente `transform` e `opacity` (autoAlpha)** garantem 60fps.
Nunca anime `width`, `height`, `top`, `left`, `color`, `background`.
`filter` é exceção pontual (bento/hover).

### 4.4 Estados iniciais no JS, não no CSS

```ts
// Padrão — src/components/project/ProjectStage.tsx linha 55–56
gsap.set(words, { yPercent: 115 });
gsap.set(fades, { autoAlpha: 0, y: 22 });
```

Isso previne FOUC. O CSS não deve definir estados iniciais de elementos animados.

### 4.5 Word-mask reveal

Estrutura HTML obrigatória gerada por `<Words text="…">`:

```tsx
// src/components/anim/SplitWords.tsx linha 8–22
<span class="w">          // .w: overflow:hidden, display:inline-block
  <span class="wi" data-wi>// .wi: will-change:transform
    palavra
  </span>
</span>
```

Animação: `yPercent: 115 → 0`, ease `power4.out`, stagger `0.06`.
- Em scroll: use `<SplitWords>` (dispara por ScrollTrigger)
- No hero/palco coordenado: use `<Words>` e controle no timeline da `onIntroReady`

### 4.6 Coordenação preloader → componentes

```ts
// src/lib/anim/signal.ts
markIntroReady()   // chamado pelo Preloader no onComplete
onIntroReady(cb)   // usado por Hero, ProjectStage, CommitTimeline, Odometer
```

Toda animação de entrada de página deve ser gateada por `onIntroReady`. Nunca dispare
animações de entrada diretamente no `useGSAP` sem esse gate.

Sequência do Preloader (`src/components/anim/Preloader.tsx` linha 34–38):
```ts
lenis.start() → ScrollTrigger.refresh() → markIntroReady() → setGone(true)
```

### 4.7 Canvas generativo (`src/components/anim/GenerativeCanvas.tsx`)

Exceção ao loop único: tem RAF próprio porque é pauseável por `IntersectionObserver`.
- Seed = slug do projeto → torre wireframe única por atração (PRNG mulberry32 + djb2)
- DPR cap `Math.min(devicePixelRatio, 2)`
- `reduced-motion`: renderiza 1 frame estático, sem loop

### 4.8 Scroll horizontal (atrações)

```ts
// src/components/HorizontalAttractions.tsx linha 28–29
mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
  // pin + scrub horizontal
```

Ativado por `gsap.matchMedia()` — nunca use media query CSS para controlar o modo pinned.
A troca `carrossel ↔ pinned` é feita via `section.dataset.mode = "pinned"` no JS;
o CSS em `globals.css` linha 39–68 reage a esse atributo.

Parallax interno de cada painel usa `containerAnimation` (TREINO-ANIMACOES §6.3):
```ts
// HorizontalAttractions.tsx linha 66–78
scrollTrigger: { containerAnimation: tween, scrub: true }
```

### 4.9 Magnetic

```tsx
// src/components/anim/Magnetic.tsx
<Magnetic strength={0.25}>...</Magnetic>
```

Usa `gsap.quickTo` (não `gsap.to`) para `x`/`y`. `willChange: "transform"` no inline
style. Só funciona em pointer fino + motion permitido (guard interno).

### 4.10 Odômetro

```tsx
// src/components/anim/Odometer.tsx
<Odometer value={42} className="text-2xl font-bold text-accent" />
```

SSR-safe: inline `transform: translateY(-${10 + digit}em)` mostra o valor final sem JS.
GSAP faz `fromTo(stack, { y: "0em" }, { y: "-Xem" })` sobrescrevendo o inline.
Sempre gateado por `onIntroReady`.

### 4.11 Cursor personalizado

```tsx
// src/components/anim/Cursor.tsx
// Ligado SOMENTE se: pointer:fine + !prefersReducedMotion
// Estado delegado: element.closest(HOT) → classList.add("is-active")
// CSS em globals.css linha 100–152
```

Adiciona `has-fine-pointer` no `<html>` quando ativo → CSS esconde cursor nativo.

---

## 5. Acessibilidade e performance

### 5.1 Dupla defesa de `prefers-reduced-motion`

Toda animação tem dois escudos:

1. **JS early-return** (antes de qualquer GSAP):
```ts
if (prefersReducedMotion()) return; // src/lib/anim/signal.ts linha 29–31
```

2. **CSS nuclear** em `globals.css` linha 190–206:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001s !important;
    transition-duration: 0.001s !important;
  }
  .cursor, [data-preloader] { display: none !important; }
}
```

### 5.2 No-JS

Inline síncrono no `<head>` (antes da pintura):
```tsx
// src/app/layout.tsx linha 32–35
<script dangerouslySetInnerHTML={{ __html:
  "document.documentElement.classList.replace('no-js','js')"
}} />
```

`<html>` parte com `className="no-js …"` e recebe `suppressHydrationWarning`
(linha 27) — mutação intencional, não um bug.

```css
/* globals.css linha 186–188 */
html.no-js [data-preloader] { display: none; }
```

### 5.3 `will-change` cirúrgico

Somente em elementos que de fato animam:
- `.wi` (word-mask inners) — `globals.css` linha 180
- `.od-stack` (odômetro) — `globals.css` linha 169
- Magnetic — `willChange: "transform"` inline no componente

Nunca coloque `will-change` em containers estáticos.

### 5.4 `ScrollTrigger.refresh()`

Deve ser chamado sempre que o layout mudar após a montagem:
- Após o preloader ser removido (já feito no `Preloader.tsx` linha 36)
- Após conteúdo dinâmico inserido no DOM

---

## 6. Arquitetura React vs ECQUA vanilla

O sistema de treinos foi escrito para vanilla JS (IIFE + `data-*`). A adaptação para
Next.js/React segue este mapeamento:

| ECQUA vanilla | Adaptação React (Trilhado) |
|---|---|
| IIFE + guard clauses | `useGSAP` / `useEffect` com early-returns |
| `data-*` como contrato HTML | Props de componente |
| `heroIntro()` callback | `signal.ts` pub-sub (`markIntroReady` / `onIntroReady`) |
| Registro único de plugins | `src/lib/anim/gsap.ts` (roda uma vez, client-side) |
| `main.js` módulo único | Componentes isolados em `src/components/anim/` |

---

## 7. Estrutura de pastas

```
src/
  app/
    layout.tsx            ← html + no-js + Preloader + Cursor + SmoothScroll
    globals.css           ← tokens CSS, masks, cursor, odômetro, reduced-motion
    page.tsx              ← homepage
    linha-do-tempo/       ← timeline semanal (client component para filtros)
    semanas/[slug]/       ← detalhe de semana
    projetos/
      page.tsx            ← lista de atrações
      [slug]/page.tsx     ← dual-pane: ProjectStage (70%) + CommitTimeline (30%)
  components/
    anim/
      SmoothScroll.tsx    ← Lenis + ticker bridge (exporta getLenis())
      Preloader.tsx       ← orquestrador da abertura
      Cursor.tsx          ← cursor global
      Odometer.tsx        ← contador rolante
      GenerativeCanvas.tsx← torre 3D wireframe
      Reveal.tsx          ← fade-in por ScrollTrigger
      SplitWords.tsx      ← word-mask reveal
      ScrubText.tsx       ← iluminação letra a letra por scrub
      Magnetic.tsx        ← física elástica no cursor
    project/
      ProjectStage.tsx    ← painel esquerdo 70%
      CommitTimeline.tsx  ← painel direito 30%
    Header.tsx / Footer.tsx / Badge.tsx / ProjectCard.tsx / …
  lib/
    anim/
      gsap.ts             ← registro central + EASE canônicos
      signal.ts           ← pub-sub preloader → componentes
    types.ts              ← Week, Project, Decision, Challenge
    content.ts            ← getAllWeeks, getAllProjects, getSiteStats …
    format.ts             ← formatLong, formatShort
    commits.ts            ← getProjectCommits (placeholder determinístico)
content/
  weeks/                  ← *.json (schema em PROMPT.md)
  projects/               ← *.json (schema em PROMPT.md)
context/
  contexto.md             ← este arquivo
  skill.md                ← mapa dos treinos de front-end
PROMPT.md                 ← spec + prompt reutilizável para gerar JSON de conteúdo
```

---

## 8. Convenções de código

- Componentes client: `"use client"` na primeira linha.
- Registro de plugins GSAP: somente em `src/lib/anim/gsap.ts` (nunca em componentes).
- Imports de GSAP/ScrollTrigger/useGSAP: sempre de `@/lib/anim/gsap`.
- `prefersReducedMotion()` e `onIntroReady()`: sempre de `@/lib/anim/signal`.
- Lenis global: sempre via `getLenis()` de `@/components/anim/SmoothScroll`.
- Tipos de domínio: sempre de `@/lib/types`.
- Nunca use `gsap.to()` para interações de cursor/magnetic — use `gsap.quickTo()`.
- `useGSAP({ scope: ref })` em todos os componentes para isolamento de seletores.

---

## 9. Conteúdo e dados

### Schema

Definido em `src/lib/types.ts`. Os dois tipos centrais são `Week` e `Project`.
O campo `placeholder: true` marca conteúdo de exemplo — pode ser filtrado ou
exibido diferentemente.

### Geração de conteúdo

Ver `PROMPT.md` na raiz — contém o prompt reutilizável para transformar anotações
brutas de semana em JSON válido.

### Commits placeholder

`src/lib/commits.ts`: entregas → `feat`, desafios → `fix`, decisões → `refactor`.
Hash determinístico via djb2. Mantém o formato `Commit` para que a integração
real com GitHub seja um drop-in.

---

## 10. Pendências conhecidas

| Item | Arquivo de referência |
|---|---|
| GitHub API real (substituir commits placeholder) | `src/lib/commits.ts` |
| Conteúdo real das 26 semanas (dez/2025–jun/2026) | `content/weeks/*.json` |
| Marquee reativo à velocidade de scroll | `src/components/anim/` (a criar) |
| Sublinhas líquidas `data-liquid` | TREINO-ANIMACOES §7.2 |
| `git init` + primeiro commit | — |
