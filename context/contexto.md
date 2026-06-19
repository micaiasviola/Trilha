# Contexto Arquitetural — Trilhado Desenvolvimento (Trilha)

Referência viva das regras que governam o sistema. Sempre que um agente (IA ou dev)
precisar tomar uma decisão de implementação, este documento é a fonte de verdade do
projeto. Para aprofundar qualquer regra de animação/UI, consulte os treinos mapeados
em `skill.md`.

> **Atualizado** com base no repositório atual: Home unificada no showcase em
> profundidade, integração real com a GitHub API, fundo de pôster por `posterBg` e
> remoção das rotas `/projetos` (grade) e `/linha-do-tempo`.

---

## 1. Stack e configuração

| Camada | Escolha | Arquivo |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript + React 19 | `next.config.mjs` |
| Estilo | Tailwind CSS 3.4 (tokens centrais) | `tailwind.config.ts` |
| Animação | GSAP 3.15 + `@gsap/react` + ScrollTrigger | `src/lib/anim/gsap.ts` |
| WebGL (fundo trilha) | Three.js 0.180 + GPGPU — grid-displacement | `src/components/anim/PosterGridFx.tsx` |
| Scroll suave | Lenis 1.3 | `src/components/anim/SmoothScroll.tsx` |
| Scroll em profundidade | Engine própria (wheel/touch/teclado) | `src/lib/depth/depthScrollEngine.ts` |
| Conteúdo | JSON local em `content/projects/` | `src/lib/content.ts` |
| Dados ao vivo | GitHub API (commits, branches, repos) | `src/lib/commits.ts`, `src/lib/github.ts` |
| Tipos | Centrais em `src/lib/types.ts` | — |

Não há backend próprio: o conteúdo curado é versionado em JSON e os dados de
atividade vêm da GitHub API em tempo de build/request (com fallback silencioso).

---

## 2. Design System — Tokens

Todos os tokens vivem em `tailwind.config.ts`. **Nunca use valores raw de cor no JSX.**
Use sempre os aliases semânticos abaixo.

### Paleta

```ts
bg:        "#0a0e14"   // fundo principal
bg-soft:   "#0f141d"   // camada intermediária
bg-card:   "#131a25"   // superfície de card
line:      "#1e2733"   // divisores, bordas
ink:       "#e6edf3"   // texto principal
ink-muted: "#9aa7b4"   // texto secundário
ink-faint: "#647082"   // texto terciário / labels
accent:    "#34d399"   // verde primário
accent-cyan:"#22d3ee"  // ciano (gradientes, git graph, refactor)
```

### Gradiente de marca

```tsx
className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent"
```

### Sombra de destaque

```ts
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
- `<TechBadge name="React">` — chip de tecnologia (ícone via `src/lib/tech-icons.ts`)

### Card brutalista da atração
Renderizado **dentro do showcase** (`src/components/depth/ProjectsDepthShowcase.tsx`):
borda dura, `bg #0b0b12`, número `NN/total`, status, stack chips e CTA "Ver história".
A antiga grade `/projetos` (`ProjectCard`) foi removida — o card vive só no showcase.

### Constelação de stacks (`src/components/ProjectStack.tsx`)
Anel decorativo de ícones de tecnologia que "salta" do centro do card no hover.

### Stat card (`src/components/StatCard.tsx`)
`rounded-xl border border-line bg-bg-card p-3 text-center` + Odômetro animado.

---

## 4. Sistema de animação

### 4.1 Loop único (Lenis ↔ ticker)
**Regra:** todo movimento baseado em scroll suave roda no `gsap.ticker`. Exceções
pauseáveis por visibilidade: o canvas generativo (§4.7) e a engine de profundidade
(§4.8), que têm RAF próprio.

```ts
// src/components/anim/SmoothScroll.tsx
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### 4.2 Eases canônicos (`src/lib/anim/gsap.ts`)
```ts
EASE.in       = "power4.out"             // entradas
EASE.out      = "power2.in"              // saídas
EASE.wipe     = "power4.inOut"           // cortes/wipes
EASE.magnetic = "elastic.out(1, 0.4)"    // interação física
EASE.liquid   = "elastic.out(1.2, 0.18)" // sublinhas elásticas
```
Nunca invente um ease ad-hoc. Se o efeito não couber nesses cinco, consulte
`TREINO-ANIMACOES §2`.

### 4.3 Propriedades animáveis
**Somente `transform` e `opacity` (autoAlpha)** garantem 60fps. Nunca anime `width`,
`height`, `top`, `left`, `color`, `background`. `filter`/`mask` são exceções pontuais.

### 4.4 Estados iniciais no JS, não no CSS
```ts
// src/components/project/ProjectStage.tsx — dentro do useGSAP
gsap.set(words, { yPercent: 115 });
gsap.set(fades, { autoAlpha: 0, y: 22 });
```
Previne FOUC. O CSS não deve definir estados iniciais de elementos animados.

### 4.5 Word-mask reveal (`src/components/anim/SplitWords.tsx`)
```tsx
<span class="w">           // .w: overflow:hidden, display:inline-block
  <span class="wi" data-wi> // .wi: will-change:transform
    palavra
  </span>
</span>
```
Animação: `yPercent: 115 → 0`, ease `power4.out`, stagger `0.06`.
- Em scroll: `<SplitWords>` (dispara por ScrollTrigger)
- No palco coordenado: `<Words>` controlado no timeline da `onIntroReady`

### 4.6 Coordenação preloader → componentes (`src/lib/anim/signal.ts`)
```ts
markIntroReady()   // chamado pelo Preloader no fim (ou ao pular a intro)
onIntroReady(cb)   // usado por ProjectStage, CommitTimeline, Odometer
```
Toda animação de entrada de página deve ser gateada por `onIntroReady`.

O Preloader (`src/components/anim/Preloader.tsx`) roda a intro **uma vez por sessão**
(via `sessionStorage`) e **pula com qualquer interação** (pointer/teclado/wheel/touch).
Sequência ao concluir: `lenis.start() → ScrollTrigger.refresh() → markIntroReady() → setGone(true)`.

### 4.7 Canvas generativo / torre (`src/components/anim/GenerativeCanvas.tsx`)
RAF próprio, pauseável por `IntersectionObserver`.
- Seed = slug do projeto → torre wireframe 3D única por atração (PRNG mulberry32 + djb2)
- DPR cap `Math.min(devicePixelRatio, 2)`
- `reduced-motion`: 1 frame estático, sem loop
- Usado como fundo da atração (à direita por padrão; à **esquerda** atrás da descrição
  nas atrações com `posterBg` — ver §12)

### 4.8 Scroll em profundidade — a Home (`src/lib/depth/`)
A Home é o **showcase em profundidade**: as atrações são camadas que avançam em Z
conforme o scroll virtual. Substitui a antiga galeria horizontal pinada.

- **Engine** (`depthScrollEngine.ts`): captura `wheel`/`touch`/teclado, mantém
  `progress` (0–1) suavizado, escreve CSS vars (`--depth-progress`, `--depth-velocity`,
  `--depth-pointer-x/y`), dorme quando ocioso (`source:'capture'`) e pausa fora da tela.
  API útil: `setProgress(p)`, `goTo(index)`, `next()/prev()`, callbacks `onUpdate`/`onLayerChange`.
- **Hook** (`useDepthScroll.ts`): instancia/destrói a engine e devolve `{ ref, engine }`.
- **Componente** (`src/components/depth/ProjectsDepthShowcase.tsx`): rende as camadas,
  a timeline lateral (botões `goTo`), e o git-tree (§9). Faz **auto-advance** ping-pong
  quando ocioso e **sincroniza `?projeto=<slug>`** na URL (memória de navegação — §11).

`reduced-motion` é respeitado pela própria engine (ease = 1, sem parallax).

### 4.9 Magnetic (`src/components/anim/Magnetic.tsx`)
```tsx
<Magnetic strength={0.25}>...</Magnetic>
```
Usa `gsap.quickTo` (não `gsap.to`) para `x`/`y`. `willChange:"transform"` inline. Só
em pointer fino + motion permitido (guard interno).

### 4.10 Odômetro (`src/components/anim/Odometer.tsx`)
SSR-safe: inline `transform: translateY(-Xem)` mostra o valor final sem JS; GSAP
sobrescreve com `fromTo`. Sempre gateado por `onIntroReady`.

### 4.11 Holofote sob o cursor (atrações com pôster)
No `ProjectStage`, o pôster/torre é revelado por um "holofote" radial que segue o
cursor (`pointermove` → CSS vars `--mx/--my/--r` num `mask radial-gradient`,
suavizado por lerp em RAF). Sem hover (touch) ou `reduced-motion`: revela por inteiro.

---

## 5. Acessibilidade e performance

### 5.1 Dupla defesa de `prefers-reduced-motion`
1. **JS early-return** antes de qualquer GSAP: `if (prefersReducedMotion()) return;`
   (`src/lib/anim/signal.ts`).
2. **CSS nuclear** em `globals.css`: zera durações de animação/transição e esconde
   `[data-preloader]` sob `@media (prefers-reduced-motion: reduce)`.

### 5.2 No-JS
Inline síncrono no `<head>` troca `no-js → js` antes da pintura (`src/app/layout.tsx`).
`<html>` parte com `className="no-js …"` + `suppressHydrationWarning` (mutação intencional).
`html.no-js [data-preloader] { display: none; }` em `globals.css`.

### 5.3 `will-change` cirúrgico
Somente em elementos que de fato animam: `.wi` (word-mask), `.od-stack` (odômetro),
Magnetic (inline). Nunca em containers estáticos.

### 5.4 `ScrollTrigger.refresh()`
Chamado quando o layout muda após a montagem — já feito após remover o preloader.

---

## 6. Arquitetura React vs ECQUA vanilla

Os treinos foram escritos para vanilla JS (IIFE + `data-*`). A adaptação para
Next.js/React segue este mapeamento:

| ECQUA vanilla | Adaptação React (Trilha) |
|---|---|
| IIFE + guard clauses | `useGSAP` / `useEffect` com early-returns |
| `data-*` como contrato HTML | Props de componente |
| `heroIntro()` callback | `signal.ts` pub-sub (`markIntroReady` / `onIntroReady`) |
| Registro único de plugins | `src/lib/anim/gsap.ts` (roda uma vez, client-side) |
| `main.js` módulo único | Componentes isolados em `src/components/anim/` e `depth/` |

---

## 7. Estrutura de pastas

```
src/
  app/
    layout.tsx              ← html + no-js + Preloader + SmoothScroll + Header + Footer
    globals.css             ← tokens CSS, masks, odômetro, reduced-motion
    page.tsx                ← HOME: ProjectsDepthShowcase (busca git-tree por projeto)
    not-found.tsx           ← 404
    projetos/
      [slug]/page.tsx       ← dual-pane: ProjectStage (70%) + CommitTimeline (30%)
  components/
    anim/
      SmoothScroll.tsx      ← Lenis + ticker bridge (exporta getLenis())
      Preloader.tsx         ← intro 1x/sessão, pula com interação
      Odometer.tsx          ← contador rolante
      GenerativeCanvas.tsx  ← torre 3D wireframe (fundo da atração)
      PosterGridFx.tsx      ← grid-displacement WebGL (fundo da atração trilha)
      Reveal.tsx            ← fade-in por ScrollTrigger
      SplitWords.tsx        ← word-mask reveal (<Words> e <SplitWords>)
      ScrubText.tsx         ← iluminação letra a letra por scrub
      Magnetic.tsx          ← física elástica no cursor
    depth/
      ProjectsDepthShowcase.tsx ← a Home (camadas + timeline + git-tree)
      GitGraph.tsx          ← git-tree diagonal (generativo)
      GitGraphBanner.tsx    ← git-tree horizontal (banner do projeto ativo)
      depthScrollStage.css  ← estilos do palco em profundidade
    project/
      ProjectStage.tsx      ← painel esquerdo 70% (história + fundo posterBg/torre)
      CommitTimeline.tsx    ← painel direito 30% (commits ao vivo + conquistas)
      ProjectGitStrip.tsx   ← faixa compacta de commits
    Header.tsx / Footer.tsx / FooterGate.tsx
    Badge.tsx / StatCard.tsx / ProjectStack.tsx
  lib/
    anim/
      gsap.ts               ← registro central + EASE canônicos
      signal.ts             ← pub-sub preloader → componentes
    depth/
      depthScrollEngine.ts  ← engine de scroll em profundidade
      useDepthScroll.ts     ← hook React da engine
    types.ts                ← Project, ProjectStory, Decision, Challenge, Milestone
    content.ts              ← getAllProjects, getAllProjectsWithGitHub, getProjectFull, getSiteStats
    commits.ts              ← GitHub API: commits, branches, featureBranchCount
    github.ts               ← auto-descoberta de repos + metadados
    format.ts               ← formatLong, formatShort
    tech-icons.ts           ← mapa nome→ícone das stacks
content/
  projects/                 ← *.json (uma atração por arquivo)
context/
  contexto.md               ← este arquivo
  skill.md                  ← mapa dos treinos de front-end
.claude/skills/
  poster-svg-brutalista/    ← skill: gerar fundos SVG tipográficos vetorizados (§12)
PROMPT.md                   ← prompt reutilizável para gerar JSON de conteúdo
```

---

## 8. Convenções de código

- Componentes client: `"use client"` na primeira linha.
- Registro de plugins GSAP: **somente** em `src/lib/anim/gsap.ts`.
- Imports de GSAP/ScrollTrigger/useGSAP: sempre de `@/lib/anim/gsap`.
- `prefersReducedMotion()` e `onIntroReady()`: sempre de `@/lib/anim/signal`.
- Lenis global: sempre via `getLenis()` de `@/components/anim/SmoothScroll`.
- Tipos de domínio: sempre de `@/lib/types`.
- Cores: sempre tokens do Tailwind, nunca hex raw no JSX.
- `gsap.quickTo()` (não `gsap.to()`) para interações de cursor/magnetic.
- `useGSAP({ scope: ref })` para isolamento de seletores.

---

## 9. Conteúdo, dados e GitHub

### Schema
Definido em `src/lib/types.ts`. O tipo central é `Project` (com `story`, `milestones`,
`technologies`, `accentColor`, `githubRepo`, `posterBg?`, `placeholder?`). Cada atração
é um arquivo em `content/projects/`; `content.ts` lê **todo** `.json` da pasta — adicionar
um projeto é criar um arquivo.

### Integração com a GitHub API
- `commits.ts`: busca commits, branches e PRs reais (token-aware via `GITHUB_TOKEN`,
  `User-Agent` setado). `MIN_COMMITS = 10` separa repos "ativos". `featureBranchCount(total)`
  é a **fonte única** que mapeia volume de commits → nº de branches do git-tree.
- `github.ts`: auto-descobre repos do dono (`micaiasviola`) com atividade que ainda
  não têm JSON, e resolve um projeto por slug direto do GitHub.
- **Fallback silencioso:** qualquer falha de rede/rate-limit cai para o conteúdo curado,
  sem quebrar a página (try/catch em `page.tsx` e `content.ts`).

### Git-tree generativo
`GitGraph` (diagonal) e `GitGraphBanner` (horizontal) desenham a árvore a partir de
`featureBranchCount` + os tipos de commit (`feat`/`fix`/`refactor`), sincronizada ao
scroll do showcase.

---

## 10. Navegação e rotas

A Home é o **hub único**. Estrutura:

| Rota | Conteúdo |
|---|---|
| `/` | `ProjectsDepthShowcase` (showcase em profundidade de todas as atrações) |
| `/projetos/[slug]` | detalhe da atração (ProjectStage + CommitTimeline) |
| `/projetos`, `/linha-do-tempo` | **removidas** → redirect 307 para `/` (`next.config.mjs`) |

Princípios (heurísticas de Nielsen):
- **Visibilidade do status:** `Header` tem o item **Home** com estado ativo (`aria-current`).
- **Memória de navegação (reconhecer, não lembrar):** o showcase grava `?projeto=<slug>`
  na URL ao navegar; o back-link da atração volta para `/?projeto=<slug>` (cai no mesmo
  projeto) e o showcase restaura essa posição na montagem, segurando o auto-advance.
- **Controle/liberdade:** logo e "Home" levam ao `/` limpo (recomeço do showcase).
- **Prevenção de erro:** redirects das rotas antigas evitam 404 em links/bookmarks.

---

## 11. Fundo de pôster por `posterBg`

Atrações podem ter um **pôster SVG tipográfico** (texto vetorizado em `<path>`) como
fundo. Mecanismo:
- Campo opcional `posterBg` no `Project`/JSON = caminho do SVG em `/public`
  (ex.: `"/ecqua-360-bg.svg"`). Vazio/ausente → fundo padrão (torre à direita).
- Com `posterBg`, o `ProjectStage` rende 3 camadas: **pôster repetido** (`repeat-y`,
  à direita), **fade** de legibilidade e a **torre** (à esquerda, atrás da descrição),
  com o holofote sob o cursor (§4.11). É o caso do **ECQUA-360**.
- Cores no tema **dark**: o pôster é desenhado em `ink` (`#e6edf3`), não preto.
- **Variante TRILHA** (ramificada pelo slug): em vez do holofote + torre, o pôster
  vira textura de um efeito **grid-displacement** (`PosterGridFx`, Three.js + GPGPU,
  skill `grid-displacement-effect`) — warp fluido sob o cursor + chromatic shift,
  renderizado **escuro** (`opacity ~0.45` + fade reforçado) para a descrição ser o
  foco. Guarda `reduced-motion`/pointer grosso/sem-WebGL → pôster estático escuro.
  O Three entra por `import()` dinâmico (chunk só na página da atração).

Para gerar/replicar esses fundos, use a skill **`.claude/skills/poster-svg-brutalista`**
(SKILL.md + builder.template.js). Armadilhas documentadas lá: `opentype.js@1.3.4`
(a 2.x trunca no "t"), anchoring por `getBoundingBox`, e o `convert` do Windows que
não é o ImageMagick.

---

## 12. Pendências conhecidas

| Item | Referência |
|---|---|
| Conteúdo real das semanas/decisões por projeto | `content/projects/*.json` |
| Marquee reativo à velocidade de scroll | `src/components/anim/` (a criar) |
| Sublinhas líquidas `data-liquid` | TREINO-ANIMACOES §7.2 |

> Resolvidos recentemente: pôster brutalista do TRILHA (`public/trilha-bg.svg`,
> colagem em grade inspirada em `imagens/grid_images_svg.svg`, `posterBg` ligado),
> integração real com a GitHub API (era placeholder), `git init` + histórico, e
> unificação da navegação na Home.
