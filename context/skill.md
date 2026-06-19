# Skill — Mapa dos Treinos de Front-End

Este arquivo é o guia de navegação para a suíte de treinos localizada em:

```
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\
```

Os treinos foram escritos para o projeto ECQUA-PAGE (vanilla HTML/CSS/JS) e são
a referência de qualidade do sistema de animação e interação adotado no Trilhado
Desenvolvimento. Use este arquivo para saber **qual treino ler** antes de
implementar qualquer feature de UI/UX.

---

## Estado atual no projeto (jun/2026)

Os treinos são a **referência de qualidade** (escritos para o ECQUA-PAGE vanilla). O
estado real do código vive em `contexto.md` — consulte-o para o que existe hoje. Onde
o projeto evoluiu/divergiu:

- **Home = showcase em profundidade** (`src/lib/depth/depthScrollEngine.ts` +
  `ProjectsDepthShowcase`). Substituiu a galeria horizontal pinada — o `TREINO-SCROLL`
  §9–10 (`pin` + `containerAnimation`) segue válido como teoria, mas **não está em uso**.
- **Canvas generativo** (`TREINO-CANVAS-GENERATIVO`) virou **fundo da atração** e camada
  das atrações com pôster (`posterBg`).
- **Skill local** para fundos SVG tipográficos vetorizados:
  `.claude/skills/poster-svg-brutalista/` (invoque por `/poster-svg-brutalista`) — gera e
  replica os pôsteres, com armadilhas próprias documentadas.
- **Navegação** unificada na Home; rotas `/projetos` e `/linha-do-tempo` removidas.

---

## Índice dos treinos

| # | Arquivo | O que ensina | Quando ler |
|---|---|---|---|
| 0 | `TREINO-INDEX.md` | Porta de entrada, grafo de dependências, workflow de replicação | Sempre primeiro em uma nova sessão |
| 1 | `TREINO-DESIGN-SYSTEM.md` | Tokens, paleta, contraste WCAG, tipografia fluida (`clamp()`), fonte variável | Antes de tocar cores, espaçamentos ou fontes |
| 2 | `TREINO-ANIMACOES.md` | Vocabulário de eases, split-text, padrões IN/OUT, scrub, magnetic, liquid | Antes de implementar qualquer animação |
| 3 | `TREINO-SCROLL.md` | Lenis ↔ `gsap.ticker` ↔ ScrollTrigger, pin horizontal, `matchMedia`, `refresh()` | Antes de qualquer interação com scroll |
| 4 | `TREINO-PRELOADER.md` | Preloader, variantes, `heroIntro()` / disparo do onComplete | Antes de alterar Preloader ou coordenação de entrada |
| 5 | `TREINO-CURSOR.md` | Cursor no ticker, `mix-blend-mode`, estados por classe, failsafe nativo | Antes de mexer no `Cursor.tsx` |
| 6 | `TREINO-SECOES-CONTEUDO.md` | Marquee, odômetros, bento, parallax por seção | Antes de criar novas seções com efeitos |
| 7 | `TREINO-CANVAS-GENERATIVO.md` | Torre 3D no canvas, SVG procedural, loop pauseável | Antes de tocar `GenerativeCanvas.tsx` |
| 8 | `TREINO-RESPONSIVO.md` | Degradação de efeitos no touch/mobile, `pointer`/`hover`, `svh` | Antes de ajustar breakpoints ou mobile |
| 9 | `TREINO-PERFORMANCE-A11Y.md` | 60fps, `will-change`, FOUC, `prefers-reduced-motion`, foco, ARIA | Antes de qualquer otimização ou auditoria a11y |
| 10 | `TREINO-ARQUITETURA-JS.md` | Anatomia do sistema, IIFE, boot, como estender | Antes de reestruturar a camada de animação |
| 11 | `TREINO-NAV.md` | Header scroll-aware, relógio, hambúrguer, overlay | Antes de tocar o Header |

---

## Referência rápida — "quero fazer X"

| Quero implementar… | Treino | Seção |
|---|---|---|
| Word-mask reveal (título sobe palavra a palavra) | ANIMACOES | §4.1 |
| Entrada do hero coordenada pós-preloader | ANIMACOES | §4.4 |
| Texto que ilumina letra a letra via scroll | ANIMACOES + SCROLL | §6.1 + §8 |
| Scroll suave (Lenis + ticker) | SCROLL | §4–5 |
| Showcase em profundidade (a Home, depth scroll) | — | `src/lib/depth/` + `contexto.md §4.8` |
| Galeria horizontal com pin + scrub *(teoria; não usado hoje)* | SCROLL | §9–10 |
| Parallax interno em painel horizontal (`containerAnimation`) *(teoria)* | ANIMACOES | §6.3 |
| `gsap.matchMedia` desktop ≠ mobile | SCROLL | §12 |
| Preloader + orquestração de abertura | PRELOADER | §2–5 |
| Cursor personalizado com lerp | CURSOR | inteiro |
| Efeito magnético no cursor | ANIMACOES | §7.1 |
| Sublinha elástica (liquid) | ANIMACOES | §7.2 |
| Faixa de texto rolante (marquee) | SECOES-CONTEUDO | §2 |
| Contador que rola até o número (odômetro) | SECOES-CONTEUDO | §3 |
| Cards que expandem no hover (bento) | SECOES-CONTEUDO | §4 |
| Parallax de fundo | SECOES-CONTEUDO + SCROLL | §5 + §14 |
| Gráfico 3D no canvas | CANVAS-GENERATIVO | Parte A |
| SVG procedural | CANVAS-GENERATIVO | Parte B |
| Garantir `prefers-reduced-motion` | PERFORMANCE-A11Y | §12 |
| `will-change` correto sem vazar | PERFORMANCE-A11Y | §3 |
| Nav header scroll-aware | NAV | inteiro |
| Tokens, paleta, tipografia | DESIGN-SYSTEM | §2–7 |

---

## Grafo de dependências (resumo)

```
DESIGN-SYSTEM (1) ──► tudo depende dos tokens

ANIMACOES (2) ─┐
               ├──► PRELOADER (4)
SCROLL (3) ────┤    usa lenis.stop + heroIntro
               ├──► CURSOR (5)
               │    no ticker único
               ├──► SECOES-CONTEUDO (6)
               │    scrub, velocity, triggers
               └──► CANVAS-GENERATIVO (7)
                    paleta + RAF próprio
```

Leitura mínima para uma sessão de implementação de UI:
**DESIGN-SYSTEM → ANIMACOES → SCROLL** (nessa ordem).

---

## Como um agente deve usar estes treinos

1. **Antes de implementar** qualquer componente de animação ou interação,
   leia o treino correspondente da tabela acima.
2. **Nunca invente um ease** — use os canônicos de `EASE` em `src/lib/anim/gsap.ts`,
   derivados do TREINO-ANIMACOES §2.
3. **Toda animação deve ter guard** `prefersReducedMotion()` como early-return,
   conforme TREINO-PERFORMANCE-A11Y §12.
4. **Adaptação vanilla → React**: os treinos ensinam vanilla (IIFE, `data-*`).
   O mapeamento para React está documentado em `contexto.md §6`.
5. **Fonte da verdade**: quando os treinos conflitarem com o código atual do projeto,
   o código do projeto manda. Os treinos ensinam o *porquê*, não o estado atual.

---

## Caminho absoluto para leitura direta

```
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-INDEX.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-DESIGN-SYSTEM.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-ANIMACOES.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-SCROLL.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-PRELOADER.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-CURSOR.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-SECOES-CONTEUDO.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-CANVAS-GENERATIVO.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-RESPONSIVO.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-PERFORMANCE-A11Y.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-ARQUITETURA-JS.md
C:\Users\leomi\Desktop\Repositorio GIT\ECQUA-PAGE\ECQUA-PAGE\TREINO-NAV.md
```
