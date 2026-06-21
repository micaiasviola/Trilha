# Contexto Geral — Trilhado Desenvolvimento (comece por aqui)

> **Para novas IAs / devs:** este é o documento de **entrada** do projeto. Leia-o
> inteiro antes de mexer em qualquer coisa — ele dá o panorama completo do site em
> uma passada. Para regras profundas de arquitetura/animação, vá ao
> [`context/contexto.md`](./context/contexto.md) (referência viva e detalhada).

---

## 0. TL;DR (o projeto em 30 segundos)

**Trilhado Desenvolvimento** (codinome **Trilha**) é um **site-diário técnico**: ele
conta a *história* do desenvolvimento que o Micaías faz na **ECQUA Engenharia** —
não como lista de tarefas, mas como narrativa por **projeto** (contexto → decisões →
desafios → entregas → aprendizado).

- **Sem backend.** O conteúdo curado vive em **JSON versionado** (`content/projects/`);
  dados de atividade (commits, branches) vêm da **GitHub API** em build/request, com
  **fallback silencioso** se a rede/rate-limit falhar.
- **Home = showcase em profundidade** (depth-scroll): as atrações (projetos) avançam em
  Z conforme o scroll. Cada projeto tem também uma página de detalhe.
- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + GSAP + Lenis + Three.js.
- **Adicionar um projeto = criar um arquivo** `content/projects/<slug>.json`.

---

## 1. Visão do produto

**O que é:** um site interativo e didático que conta a *história* do desenvolvimento
semana a semana na ECQUA — decisões técnicas, tecnologias, desafios, entregas e
aprendizados — transformado em narrativa navegável.

**Para quem:**
- **Recrutadores / clientes** que querem ver evolução técnica real (não repositórios soltos).
- **O próprio autor**, como diário técnico (dev journal) versionado.
- **Time da ECQUA**, como registro de decisões (mini-ADR).

**Princípios:**
1. **Contar história, não listar tarefas.** Cada projeto tem um arco: contexto → decisões → desafios → entregas → aprendizado.
2. **Didático.** Explicar *por que* algo foi feito, não só *o que*.
3. **Interativo.** Navegação por showcase em profundidade e por página de projeto; git-tree e commits ao vivo.
4. **Versionado.** Conteúdo em arquivos no Git; cada mudança é um commit. *O git é o CMS.*

**Modelo narrativo:** a **unidade é o PROJETO** (não a semana). A narrativa se organiza
por **marcos, decisões e desafios** — sem cadência de calendário.

---

## 2. Modelo mental (como o site funciona)

```
                ┌─────────────────────────────────────────────┐
   conteúdo →   │  content/projects/*.json   (curado, no git)  │
                └───────────────┬─────────────────────────────┘
                                │  lido no servidor (fs, build/request)
   dados vivos →  GitHub API ───┤  (commits/branches/PRs, fallback silencioso)
                                ▼
                ┌─────────────────────────────────────────────┐
   render →     │  /  →  ProjectsDepthShowcase (depth-scroll)  │
                │  /projetos/[slug]  →  ProjectStage + Commits │
                └─────────────────────────────────────────────┘
```

- A **Home** (`/`) é o **hub único**: um *showcase em profundidade* onde cada projeto é
  uma camada que avança em Z conforme o scroll virtual. Tem timeline lateral, git-tree
  generativo e auto-advance ping-pong quando ocioso.
- Cada projeto tem uma **página de detalhe** (`/projetos/[slug]`): painel esquerdo (70%)
  com a história + painel direito (30%) com commits ao vivo do GitHub.
- **Deep-link:** `/?projeto=<slug>` abre o showcase já posicionado naquele projeto; o
  back-link da atração volta para `/?projeto=<slug>` (memória de navegação).

---

## 3. Stack e como rodar

| Camada | Escolha |
|---|---|
| Framework | Next.js **15** (App Router) + TypeScript + React **19** |
| Estilo | Tailwind CSS **3.4** (tokens semânticos centrais) |
| Animação | GSAP **3.15** + `@gsap/react` + ScrollTrigger |
| WebGL | Three.js **0.180** (grid-displacement GPGPU, fundo da atração TRILHA) |
| Scroll suave | Lenis **1.3** |
| Scroll em profundidade | Engine própria (`src/lib/depth/`) |
| Conteúdo | JSON local em `content/projects/` |
| Dados ao vivo | GitHub API (`src/lib/commits.ts`, `src/lib/github.ts`) |

**Não há backend próprio.** Site estático/Server Components; deploy alvo: **Vercel**.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run lint     # next lint
```

> **GitHub API (opcional):** sem `GITHUB_TOKEN` o site funciona via fallback curado;
> com token, os commits/branches reais aparecem sem rate-limit agressivo. Owner padrão
> dos repos auto-descobertos: `micaiasviola`.

---

## 4. Rotas

| Rota | Conteúdo |
|---|---|
| `/` | `ProjectsDepthShowcase` — showcase em profundidade de **todas** as atrações |
| `/projetos/[slug]` | Detalhe da atração: `ProjectStage` (70%) + `CommitTimeline` (30%) |
| `/?projeto=<slug>` | Deep-link: abre o showcase já no projeto indicado |
| `/projetos`, `/linha-do-tempo` | **Removidas** → redirect **307** para `/` (`next.config.mjs`) |
| 404 | `src/app/not-found.tsx` |

> ⚠️ As rotas `/projetos` (grade) e `/linha-do-tempo` **não existem mais** como páginas —
> foram unificadas na Home. Qualquer doc/código que ainda as cite como ativas está
> desatualizado.

---

## 5. Modelo de conteúdo (o que você mais vai mexer)

Cada projeto é **um arquivo** `content/projects/<slug>.json`. O loader (`src/lib/content.ts`)
lê **todo** `.json` da pasta e ordena por `order`, depois `startDate`. **Adicionar um
projeto = criar um arquivo.**

### Schema (`Project` — fonte de verdade em `src/lib/types.ts`)

```jsonc
{
  "slug": "erp-obras",                 // único; vira a URL /projetos/<slug>
  "name": "ERP de Obras",
  "tagline": "Frase curta do que o projeto resolve.",
  "description": "Parágrafo de contexto do projeto na ECQUA.",
  "status": "in-progress",             // "in-progress" | "shipped" | "paused"
  "role": "Tech PM & Full-Stack Dev",
  "order": 1,                          // ordem no showcase (menor = primeiro)
  "startDate": "2026-01-06",
  "endDate": null,                     // data quando shipped/paused; senão null
  "technologies": ["Next.js", "TypeScript", "Supabase", "PostgreSQL"],
  "highlights": ["Destaque 1", "Destaque 2"],
  "accentColor": "#3c72c6",            // cor de acento da camada
  "githubRepo": "erp-obras",           // opcional: nome do repo p/ commits ao vivo
  "posterBg": "/erp-obras-bg.svg",     // opcional: pôster SVG de fundo (ver §6)
  "story": {
    "context": "Por que o projeto existe e o estado inicial.",
    "decisions": [
      { "title": "Decisão", "rationale": "Porquê, alternativas e trade-offs." }
    ],
    "challenges": [
      { "title": "Desafio", "howSolved": "Como resolvi ou estado atual." }
    ],
    "deliveries": ["Entrega 1", "Entrega 2"],
    "learning": "Principal aprendizado do projeto."
  },
  "milestones": [                      // OPCIONAL: marcos reais, sem cadência
    { "date": "2026-02-10", "title": "Marco", "note": "Opcional." }
  ]
}
```

Campos opcionais úteis: `githubRepo` (liga commits/git-tree ao vivo), `posterBg`
(fundo SVG, §6), `cover`, `placeholder` (marca conteúdo de exemplo).

### Loaders (`src/lib/content.ts`)
- `getAllProjects()` — só JSON, ordenados.
- `getProject(slug)` — um projeto por slug (JSON).
- `getAllProjectsWithGitHub()` — JSON + repos auto-descobertos do GitHub (≥10 commits, ainda sem JSON); cai para JSON-only se a API falha.
- `getProjectFull(slug)` — JSON e, se não houver, resolve direto do GitHub.
- `getSiteStats()` — `{ projects, deliveries, technologies }` agregados.

### Projetos atuais (`content/projects/`)
`erp-obras`, `ecqua-360`, `app-vistoria-ecqua`, `helpbox-prototype`, `classifyemail`,
`user-autentication-in-c`, `trilha` (este site).

---

## 6. Dados ao vivo, git-tree e fundos de pôster

- **GitHub API** (`commits.ts` / `github.ts`): busca commits, branches e PRs reais
  (token-aware via `GITHUB_TOKEN`). `MIN_COMMITS = 10` separa repos "ativos".
  `featureBranchCount(total)` é a **fonte única** que mapeia volume de commits → nº de
  branches do git-tree. **Fallback silencioso** em qualquer falha (try/catch).
- **Git-tree generativo:** `GitGraph` (diagonal) e `GitGraphBanner` (horizontal)
  desenham a árvore a partir de `featureBranchCount` + tipos de commit
  (`feat`/`fix`/`refactor`), sincronizada ao scroll do showcase.
- **Git-graph animado (SVGator):** há `public/git-graph.svg` (design estático, editável
  no SVGator) e `public/git-graph-animated.svg` (versão animada, mantida no código). O
  SVGator **descarta a animação** ao importar — por isso edita-se só o **design** lá e a
  animação é reaplicada no código. Passo a passo: [`docs/svgator-guia.md`](./docs/svgator-guia.md).
- **Fundo `posterBg`:** caminho de um SVG tipográfico em `/public` (ex.: `/trilha-bg.svg`,
  `/ecqua-360-bg.svg`). Ausente → fundo padrão (torre generativa). A variante **TRILHA**
  usa o pôster como textura de um efeito **grid-displacement** WebGL. Gerar/replicar:
  skill `.claude/skills/poster-svg-brutalista`.

---

## 7. Princípios de UI/animação (resumo — detalhe em `contexto.md`)

- **Tokens, nunca hex raw no JSX.** Paleta semântica em `tailwind.config.ts`
  (`bg`, `ink`, `accent` `#34d399`, `accent-cyan` `#22d3ee`, …).
- **Só anime `transform` e `opacity`** (60fps). Nunca `width/height/top/left/color/background`.
- **5 eases canônicos** em `src/lib/anim/gsap.ts` — não invente ease ad-hoc.
- **Estados iniciais no JS** (`gsap.set`), não no CSS (previne FOUC).
- **`prefers-reduced-motion`** tem dupla defesa (JS early-return + CSS nuclear).
- **Preloader** roda a intro 1x/sessão e pula com qualquer interação.
- Coordenação preloader → componentes via pub-sub `signal.ts` (`markIntroReady`/`onIntroReady`).

---

## 8. Mapa de documentação (onde aprofundar)

| Documento | Para quê |
|---|---|
| **`PROMPT.md`** (este) | Porta de entrada — panorama do site inteiro |
| [`context/contexto.md`](./context/contexto.md) | **Referência arquitetural viva**: animação, tokens, estrutura de pastas, regras detalhadas |
| [`context/skill_treino_fable.md`](./context/skill_treino_fable.md) | Mapa dos treinos de front-end (regras de animação/UI de origem) |
| [`docs/svgator-guia.md`](./docs/svgator-guia.md) | Editar o design do git-graph no SVGator (passo a passo iniciante) |
| `.claude/skills/poster-svg-brutalista/` | Skill: gerar fundos SVG tipográficos vetorizados (`posterBg`) |
| `.claude/skills/grid-displacement-effect/` | Skill: efeito WebGL grid-displacement (variante TRILHA) |
| `README.md` | Instruções rápidas de execução |

---

## 9. Prompt reutilizável — gerar JSON de projeto a partir de anotações brutas

> Cole este prompt + suas anotações para gerar um arquivo `content/projects/<slug>.json` válido.

```
Você vai converter minhas anotações brutas de trabalho na ECQUA em um arquivo
JSON de PROJETO para o site Trilhado Desenvolvimento.

Regras:
- Tom didático, 1ª pessoa, português do Brasil.
- A unidade é o PROJETO (não a semana). NÃO organize por calendário nem crie
  estrutura semanal. Organize a narrativa por marcos, decisões e desafios.
- Para cada DECISÃO, explique o racional (o porquê) e alternativas descartadas.
- Para cada DESAFIO, explique o problema e como foi resolvido (ou se segue aberto).
- Tecnologias com nomes canônicos (ex.: "Next.js", "Supabase", "PostgreSQL").
- `milestones` é opcional; use só para marcos reais com data, sem cadência.
- `githubRepo` e `posterBg` são opcionais; só inclua se eu informar.
- Não invente fatos; se faltar info, deixe vazio e marque com TODO.
- Saída APENAS no schema JSON de "projeto" descrito abaixo.

Schema de "projeto":
{
  "slug": "erp-obras",
  "name": "ERP de Obras",
  "tagline": "Frase curta do que o projeto resolve.",
  "description": "Parágrafo de contexto do projeto na ECQUA.",
  "status": "in-progress",             // "in-progress" | "shipped" | "paused"
  "role": "Tech PM & Full-Stack Dev",
  "order": 1,                          // ordem na sequência do showcase
  "startDate": "2026-01-06",
  "endDate": null,                     // data quando shipped/paused; senão null
  "technologies": ["Next.js", "TypeScript", "Supabase", "PostgreSQL"],
  "highlights": ["Destaque 1", "Destaque 2"],
  "accentColor": "#3c72c6",            // cor de acento para o fundo da camada
  "githubRepo": "erp-obras",           // opcional: repo para commits ao vivo
  "posterBg": "/erp-obras-bg.svg",     // opcional: pôster SVG de fundo
  "story": {
    "context": "Por que o projeto existe e o estado inicial.",
    "decisions": [
      { "title": "Decisão", "rationale": "Porquê, alternativas e trade-offs." }
    ],
    "challenges": [
      { "title": "Desafio", "howSolved": "Como resolvi ou estado atual." }
    ],
    "deliveries": ["Entrega 1", "Entrega 2"],
    "learning": "Principal aprendizado do projeto."
  },
  "milestones": [                      // OPCIONAL: marcos reais, sem cadência
    { "date": "2026-02-10", "title": "Marco", "note": "Opcional." }
  ]
}

Minhas anotações:
<<COLE AQUI>>
```

> ⚠️ Não commitar segredos, dados de clientes ou credenciais. O conteúdo deve ser uma
> narrativa técnica, **não** dump de dados internos.

---

## 10. Status e próximos passos

- **MVP pronto** com conteúdo parcialmente de exemplo (campos `placeholder`). Próximo
  passo: substituir o conteúdo curado pelos dados reais dos projetos da ECQUA dos
  últimos 6 meses (commits/PRs, quadros de tarefas, notas de reunião, releases).
- Pendências de front-end (marquee reativo, sublinhas líquidas, conteúdo real das
  decisões) estão listadas em [`context/contexto.md`](./context/contexto.md) §12.
