# Módulo Depth Scroll — contexto para agentes

> **Leia antes de mexer no scroll da Home.** Este é o sistema que faz a Home ser um
> *showcase em profundidade*: os projetos são camadas que avançam em Z conforme o
> scroll virtual. Substitui a antiga galeria horizontal pinada.
>
> Companion: **[`interacoes-e-decisoes.md`](./interacoes-e-decisoes.md)** — o "porquê"
> das mecânicas de roda discreta e do auto-scroll que para na interação (mudanças
> recentes; leia antes de alterá-las para não desfazer decisões de propósito).

---

## 0. Quando você mexe aqui

- Vai alterar **como o scroll se comporta** na Home (velocidade, snap, 1-card-por-vez).
- Vai mexer no **visual das camadas** (profundidade, crossfade, parallax) → é CSS (§4).
- Vai mudar o **auto-advance** (attract loop) → showcase + §7.2 do companion.
- Vai **reusar a engine** em outra página (ela é genérica, não acoplada à Home).

Se for só editar conteúdo/JSON de projeto, **não** é aqui — veja `PROMPT.md`.

---

## 1. Arquitetura em 30 segundos

A engine **não anima nada diretamente**. Ela transforma input (wheel/touch/teclado)
num `progress` 0→1 suavizado e **escreve CSS custom properties** no elemento-palco. O
**CSS** lê essas vars e posiciona as camadas em profundidade. Esse desacoplamento é o
que mantém 60fps: nenhum re-render do React por frame.

```
wheel / touch / teclado
        │
        ▼
  DepthScrollEngine  ──(RAF próprio, dorme quando ocioso)
        │  lerp(current → targetValue), velocity, pointer
        ▼
  CSS vars no .depth-stage:
    --depth-progress  (0→1)   --depth-velocity (-1..1)   --depth-speed (0..1)
    --depth-pointer-x/y (-1..1)
        │
        ▼
  depthScrollStage.css  →  translateZ + scale + opacity por camada
        │
        └──(callbacks) onUpdate(progress) → nav `--p` (git-graph)
                       onLayerChange(idx) → setActive(idx) (React, baixa frequência)
```

**Regra de ouro:** o caminho scroll→visual é **100% CSS var**. Nunca ligue o `progress`
a `useState` por frame. React só entra quando o **índice da camada ativa muda**
(`onLayerChange`), que é raro.

---

## 2. Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `src/lib/depth/depthScrollEngine.ts` | **A engine** (classe genérica, sem React). Input → progress → CSS vars. |
| `src/lib/depth/useDepthScroll.ts` | Hook React: instancia/destrói a engine, mantém callbacks frescos. |
| `src/components/depth/ProjectsDepthShowcase.tsx` | **A Home.** Configura a engine, rende as camadas, a timeline lateral e o auto-advance. |
| `src/components/depth/depthScrollStage.css` | **O contrato visual.** Lê as CSS vars e desenha a profundidade/crossfade. |
| `src/components/depth/GitGraph.tsx` / `GitGraphBanner.tsx` | Git-tree sincronizado ao scroll via `--p` (consumidor, não faz parte da engine). |

---

## 3. A engine (`depthScrollEngine.ts`)

Classe `DepthScrollEngine`. Sem dependências, sem React, sem GSAP — **RAF próprio**.

### 3.1 Ciclo de vida

- `start()` — liga listeners + começa o loop (`requestAnimationFrame`).
- `destroy()` — cancela RAF, remove listeners, desconecta o IntersectionObserver.
- **Dorme quando ocioso:** em `source:'capture'`, quando tudo está em repouso
  (`_atRest()`), após 1 frame extra o loop **para** (`rafId = null`, `sleeping = true`).
  Qualquer input chama **`_wake()`** para religar. ⚠️ Ver invariante §6.1.
- **Pausa fora da tela:** `IntersectionObserver` (threshold 0) → `_setVisible(false)`
  cancela o RAF; volta a rodar ao reentrar. Também escuta `visibilitychange`.

### 3.2 `source` — de onde vem o progresso

- `'capture'` (a Home): o progresso vem do **input** (wheel/touch/teclado) acumulado em
  `targetValue`. O loop dorme quando ocioso.
- `'page'`: o progresso vem da **posição do elemento na viewport** (`_pageProgress()`),
  estilo ScrollTrigger. Não dorme (segue a página). Não usado hoje, mas suportado.

### 3.3 `captureMode` — quando "roubar" o wheel

- `'always'` — captura sempre (a Home usa este).
- `'while-hovered'` — só com o ponteiro sobre o palco.
- `'until-bounds'` — captura sob hover **até** bater no início/fim; aí solta o wheel
  para a página rolar (default para alvos não-root).

### 3.4 Opções (`DepthScrollOptions`) e defaults

| Opção | Default | O que faz |
|---|---|---|
| `length` | `1000` | "Comprimento" virtual do scroll. O passo entre camadas = `length/(layerCount-1)`. |
| `smoothing` | `0.08` | Fator do `lerp` por frame (current→target). Maior = assenta mais seco. |
| `wheelSpeed` | `1` | Multiplicador do delta da roda (**modo contínuo apenas**). |
| `touchSpeed` | `1.8` | Multiplicador do arrasto por toque. |
| `velocityDamping` | `0.12` | Suavização da velocidade derivada (alimenta `--depth-speed`). |
| `velocityMax` | `1.5` | Clamp da velocidade. |
| `source` | `'capture'` | Ver §3.2. |
| `captureMode` | `isRoot?'always':'until-bounds'` | Ver §3.3. |
| `invert` | `false` | Inverte o sentido do input. |
| `parallax` | `true` | Liga `pointermove` → `--depth-pointer-x/y`. Off em reduced-motion. |
| `snap` | `false` | Snap suave: ao ficar ocioso, arredonda `targetValue` pra camada mais próxima. |
| `snapDelay` | `160` | ms de ociosidade antes do snap suave disparar. |
| `wheelStep` | `false` | **Roda discreta:** 1 gesto de roda = 1 camada. Ver §7.1 do companion. |
| `stepGap` | `220` | ms de pausa entre eventos de roda que separa **um gesto do próximo**. |
| `stepThreshold` | `20` | Delta acumulado (px) antes de um passo disparar (filtra jitter). |
| `keyboard` | `false` | Liga setas/espaço/PageUp-Down → `next()/prev()`. |
| `layerCount` | `0` | Nº de camadas. Habilita `onLayerChange`, snap e steps. |
| `writeCssVars` | `true` | Escreve as CSS vars no alvo. |
| `autoPauseOffscreen` | `true` | IntersectionObserver pausa fora da tela. |
| `onUpdate(s)` | — | Por frame: `{ progress, velocity, velocityAbs, current }`. |
| `onLayerChange(i)` | — | Quando o índice arredondado da camada muda. |

### 3.5 Métodos públicos

- `goTo(index)` — vai pra camada `index` (clampado). Seta `lastInputTime` + `_wake()`.
- `next()` / `prev()` — `goTo(activeLayer ± 1)`.
- `setProgress(p)` — define progresso direto (0–1).
- `setOptions(patch)` — merge raso em `this.o` (ex.: trocar `wheelSpeed` em runtime).
- `get signal` — `{ progress, velocity, pointer }` (snapshot).

### 3.6 CSS vars escritas (o contrato com o CSS)

Escritas em `this.target.style`, com **dedupe** (só toca o DOM se o valor mudou na
precisão escrita — evita recalc de estilo redundante):

| Var | Faixa | Significado |
|---|---|---|
| `--depth-progress` | `0 → 1` | Progresso suavizado. **Principal.** |
| `--depth-velocity` | `-1 → 1` | Velocidade com sinal (direção). |
| `--depth-speed` | `0 → 1` | Velocidade absoluta (atmosfera/intensidade). |
| `--depth-pointer-x` | `-1 → 1` | Ponteiro X normalizado (parallax), lerp 0.08. |
| `--depth-pointer-y` | `-1 → 1` | Ponteiro Y normalizado (parallax), lerp 0.08. |

---

## 4. O contrato CSS (`depthScrollStage.css`)

O palco (`.depth-stage`) tem `perspective: 1200px` e `--count`. Cada `.depth-layer`
recebe seu índice `--i` e se posiciona a partir do progresso:

```css
/* distância (com sinal) da camada até o foco, em unidades de camada */
--rel: calc(var(--i) - var(--depth-progress, 0) * (var(--count) - 1));
--abs-rel: max(var(--rel), calc(var(--rel) * -1));

/* Profundidade: o foco fica à FRENTE (Z=0) e os vizinhos AFUNDAM no fundo
   (Z<0, menores). Ao scrollar, o próximo card "surge do fundo" e cresce até
   o foco; o que sai recua de volta pro fundo. */
transform:
  translateZ(calc(var(--abs-rel) * var(--layer-depth) * -1))  /* afunda ao sair de foco */
  scale(calc(1 - var(--abs-rel) * var(--layer-shrink)))       /* + encolhe ao afundar */
  translate(                                                  /* parallax + arrasto Y */
    calc(var(--depth-pointer-x, 0) * 22px),
    calc(var(--depth-pointer-y, 0) * 14px
         + var(--depth-velocity, 0) * var(--drag-shift)));

/* crossfade com platô (soma 1 no handoff). SEM dim por velocidade: o card em foco
   fica 100% opaco → o GPU oclui o que está atrás (zero overdraw no scroll). */
opacity: clamp(0, calc((var(--fade-end) - var(--abs-rel)) /
                       (var(--fade-end) - var(--fade-start))), 1);
```

Consequência importante para o **snap**: quando o progresso para num índice inteiro
(camada `i` focada), `--rel = 0` → opacidade 1 **e Z = 0 (à frente)**, e os vizinhos
ficam em `|rel| ≥ 1` (fundo, opacidade 0). Ou seja, **parar exatamente numa camada
deixa o card isolado, nítido e à frente** — é por isso que o modo discreto (§7.1) faz
cada projeto "saltar fixamente". A intensidade do **"surgir do fundo"** sai de dois knobs
no `.depth-stage`: **`--layer-depth`** (quão fundo o card vai) e **`--layer-shrink`**
(quanto encolhe ao afundar).

**Arrasto por velocidade** (efeito ao scrollar): a `.depth-layer` lê `--depth-velocity`
para deslocar em Y (`--drag-shift`) *enquanto há scroll*, voltando ao normal ao assentar
(`velocity → 0`). É **transform-only (GPU), sem custo de paint**. O knob vive no `.depth-stage`.

> **Nota de performance (importante):** uma versão anterior também deixava os cards
> **translúcidos** no scroll (`--scroll-fade`) e os **esticava** (`--drag-stretch`/scaleY).
> Ambos foram **removidos**: a translucidez quebra a oclusão do GPU → **overdraw** dos
> gradientes de fundo durante o scroll, e o scaleY borra o texto. O cue de velocidade fica
> só no `::after` (1 elemento, barato). Regra do módulo: **nada que torne uma camada
> translúcida ou force re-raster por frame.**

Outros:
- `.depth-stage::after` — overlay de atmosfera (velocidade) com `opacity: calc(var(--depth-speed)*0.5)` — 1 elemento, barato; é o cue de "scroll".
- `.depth-layer:not([data-active]) { pointer-events: none }` — só a camada ativa clica.
- **reduced-motion:** o CSS zera os transforms, mostra **só** a camada ativa
  (`visibility:hidden` nas outras) e revela o git-tree inteiro. Dupla defesa com o JS —
  logo o arrasto também desaparece em reduced-motion.

---

## 5. O hook (`useDepthScroll.ts`)

```ts
const { ref, engine } = useDepthScroll(options)
```

- Cria a engine no mount, `engine.start()`, e `destroy()` no unmount.
- `ref` → ponha no elemento-palco. `engine` é um `RefObject<DepthScrollEngine>`
  (use `engine.current?.goTo(...)`).
- **Recria a engine** quando mudam: `[length, layerCount, source, captureMode, snap, keyboard]`.
  As demais opções (incl. `wheelStep`, `stepGap`, `smoothing`, callbacks) entram na
  **construção** via `optsRef.current` e ficam **frescas** sem recriar. Se precisar
  trocar uma delas em runtime, use `engine.current?.setOptions({...})`.

---

## 6. Invariantes e armadilhas (não quebre)

### 6.1 Todo caminho de input precisa "acordar" o loop
Como o loop **dorme** quando ocioso (`source:'capture'`), qualquer entrada que mude o
alvo **tem que** chamar `_wake()` — senão o input é ignorado (loop dormindo). `goTo`,
`setProgress`, `_addInput` e o `_onPointerMove` já fazem isso. ⚠️ A roda discreta
**de propósito** *não* acorda em eventos absorvidos (sem mudança de estado) e usa um
"lock" **sem estado persistente** (baseado em timestamp) justamente para não travar
dormindo — ver §7.1 do companion.

### 6.2 O bridge scroll→visual é CSS var, não React state
Nunca ligue `--depth-progress` a `useState`/render por frame. Use `onUpdate` para
escrever vars em nós com `ref` (como a Home faz com `--p` no `<nav>`). React só reage a
`onLayerChange` (mudança de índice, baixa frequência).

### 6.3 Só `transform` e `opacity`
Regra do projeto (`contexto.md` §4.3). O CSS já segue isso. Não introduza animação de
`width/height/top/left/filter` nas camadas.

### 6.4 `prefers-reduced-motion` tem dupla defesa
A engine usa `ease = 1` (sem suavização), desliga parallax e o auto-advance é
desabilitado; o CSS esconde a profundidade. Mantenha as duas pontas.

### 6.5 `data-lenis-prevent` + wheel `passive:false`
O palco tem `data-lenis-prevent` para o Lenis não brigar pela roda, e a engine liga o
listener de `wheel` com `{ passive: false }` para poder `preventDefault()`. Não troque
para passivo, ou o `preventDefault` para de funcionar.

---

## 7. Tuning rápido (config atual da Home)

Na chamada `useDepthScroll({...})` em `ProjectsDepthShowcase.tsx`:

```ts
source: 'capture', captureMode: 'always', keyboard: true,
snap: true, snapDelay: 120,
smoothing: 0.16,          // ↑ assenta mais seco / ↓ mais suave
wheelStep: true,          // 1 gesto de roda = 1 card (ver companion §7.1)
stepGap: 240,             // ↑ exige mais pausa entre cards / ↓ passa mais rápido
stepThreshold: 20,        // sensibilidade ao toque mínimo da roda
length: projects.length * 520,
layerCount: projects.length,
```

Para **voltar ao scroll contínuo** (sem 1-card-por-vez): `wheelStep: false`. Aí valem
`wheelSpeed` + o snap suave (`snap`/`snapDelay`).

---

## 8. Como testar

Não há teste automatizado de scroll. Suba o dev server e valide à mão:

```bash
npm run dev   # http://localhost:3000
```

Checklist: (1) cada notch/gesto de roda avança **1** card e ele para nítido no centro;
(2) girar a roda rápido **não** pula vários cards; (3) o auto-advance roda no load e
**pausa** ao mexer o mouse / rolar (retoma após alguns segundos parado) e **para de
vez** ao selecionar um projeto; (4) ligar
`prefers-reduced-motion` no SO mostra só o card ativo, sem parallax nem auto-advance.

> Verificação de tipos do módulo: `npx tsc --noEmit`. (O projeto **não** tem config de
> ESLint — `next lint` abre setup interativo; não dependa dele em CI.)
