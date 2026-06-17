# Prompt — Trilhado Desenvolvimento

> Documento-guia (spec + prompt reutilizável) do projeto.
> Use a **Parte 2** como prompt para transformar anotações brutas do trabalho na
> ECQUA em conteúdo estruturado que alimenta o site.

---

## Parte 1 — Visão do produto

**O que é:** um site interativo e didático que conta a *história* do desenvolvimento
que o Micaías faz semana a semana na **ECQUA Engenharia** — decisões técnicas,
tecnologias usadas, desafios enfrentados, entregas e aprendizados.

**Para quem:**
- Recrutadores / clientes que querem ver evolução técnica real (não só repositórios soltos).
- O próprio autor, como diário técnico (dev journal) versionado.
- Time da ECQUA, como registro de decisões (mini-ADR).

**Princípios:**
1. **Contar história, não listar tarefas.** Cada semana tem um arco: contexto → decisões → desafios → entregas → aprendizado.
2. **Didático.** Explicar *por que* algo foi feito, não só *o que*.
3. **Interativo.** Filtros por tecnologia, navegação por timeline e por projeto.
4. **Versionado.** Conteúdo em arquivos no Git; cada semana é um commit.

**Modelo narrativo (híbrido):**
- **Timeline semanal** é a visão principal (cronológica).
- **Páginas de projeto** agregam as semanas relacionadas a cada projeto da ECQUA.

---

## Parte 2 — Prompt para gerar conteúdo a partir de anotações brutas

Cole este prompt + suas anotações da semana para gerar um arquivo de conteúdo válido.

```
Você vai converter minhas anotações brutas de uma semana de trabalho em um
arquivo JSON de "semana" para o site Trilhado Desenvolvimento.

Regras:
- Tom didático e em 1ª pessoa, português do Brasil.
- Para cada DECISÃO, explique o racional (o "porquê") e alternativas descartadas.
- Para cada DESAFIO, explique o problema e como foi resolvido (ou se segue aberto).
- Liste tecnologias como nomes canônicos (ex.: "Next.js", "Supabase", "PostgreSQL").
- Não invente fatos; se faltar info, deixe o campo vazio e marque com TODO.
- Saída APENAS no schema JSON de "semana" descrito abaixo.

Schema de "semana":
{
  "slug": "2026-w24",                  // ano + número ISO da semana
  "weekNumber": 24,
  "startDate": "2026-06-08",           // segunda-feira (YYYY-MM-DD)
  "endDate": "2026-06-14",             // domingo
  "title": "Título curto e marcante da semana",
  "summary": "1-2 frases resumindo o arco da semana.",
  "projects": ["slug-do-projeto"],     // referência a projetos (Parte 3)
  "technologies": ["Next.js", "Supabase"],
  "deliveries": ["Entrega concreta 1", "Entrega 2"],
  "decisions": [
    { "title": "Decisão tomada", "rationale": "Por quê, alternativas e trade-offs." }
  ],
  "challenges": [
    { "title": "Desafio", "howSolved": "Como resolvi ou estado atual." }
  ],
  "learning": "O principal aprendizado da semana.",
  "notes": "Texto livre opcional (markdown simples)."
}

Minhas anotações:
<<COLE AQUI>>
```

---

## Parte 3 — Schema de "projeto"

Arquivo por projeto em `content/projects/<slug>.json`:

```
{
  "slug": "erp-obras",
  "name": "ERP de Obras",
  "tagline": "Frase curta do que o projeto resolve.",
  "description": "Parágrafo descritivo do projeto e do contexto na ECQUA.",
  "status": "in-progress",             // "in-progress" | "shipped" | "paused"
  "role": "Tech PM & Full-Stack Dev",
  "startDate": "2026-01-06",
  "technologies": ["Next.js", "TypeScript", "Supabase", "PostgreSQL"],
  "highlights": ["Destaque 1", "Destaque 2"]
}
```

---

## Parte 4 — Como coletar os dados dos últimos 6 meses (ECQUA)

Quando formos preencher de verdade, as fontes a varrer:
- Commits/PRs nos repositórios da ECQUA (github.com/micaiasviola e orgs).
- Quadros de tarefas (Jira/Trello/Linear/Notion — confirmar qual).
- Notas de reunião / decisões de arquitetura.
- Releases e changelogs.

Saída esperada: 1 arquivo JSON por semana em `content/weeks/` e 1 por projeto em
`content/projects/`. Período-alvo: **dez/2025 → jun/2026** (~26 semanas).

> ⚠️ Não commitar segredos, dados de clientes ou credenciais. Conteúdo deve ser
> uma narrativa técnica, não dump de dados internos.

---

## Parte 5 — Arquitetura técnica do MVP

- **Next.js (App Router) + TypeScript + Tailwind CSS.**
- Conteúdo em **arquivos JSON** lidos em build time (Server Components + `fs`).
- Rotas:
  - `/` — home (hero, métricas, timeline recente, projetos em destaque)
  - `/linha-do-tempo` — timeline completa com filtro por tecnologia (interativo)
  - `/semanas/[slug]` — detalhe da semana
  - `/projetos` — grade de projetos
  - `/projetos/[slug]` — detalhe do projeto + semanas relacionadas
- Deploy alvo: **Vercel**.

Status atual: **MVP com conteúdo de exemplo** (marcado como placeholder). Próximo
passo: substituir `content/` pelos dados reais da ECQUA.
