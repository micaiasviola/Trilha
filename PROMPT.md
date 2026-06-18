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

## Parte 2 — Prompt para gerar conteúdo de projeto a partir de anotações brutas

Cole este prompt + suas anotações para gerar um arquivo de projeto válido.

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

---

## Parte 3 — Schema de "projeto" (referência rápida)

Arquivo por projeto em `content/projects/<slug>.json`. Ver schema completo na Parte 2.

---

## Parte 4 — Como coletar os dados dos últimos 6 meses (ECQUA)

Quando formos preencher de verdade, as fontes a varrer:
- Commits/PRs nos repositórios da ECQUA (github.com/micaiasviola e orgs).
- Quadros de tarefas (Jira/Trello/Linear/Notion — confirmar qual).
- Notas de reunião / decisões de arquitetura.
- Releases e changelogs.

Saída esperada: 1 arquivo JSON por projeto em `content/projects/`.
Use o prompt da Parte 2 para converter anotações brutas em cada arquivo.

> ⚠️ Não commitar segredos, dados de clientes ou credenciais. Conteúdo deve ser
> uma narrativa técnica, não dump de dados internos.

---

## Parte 5 — Arquitetura técnica atual

- **Next.js (App Router) + TypeScript + Tailwind CSS.**
- Conteúdo em **arquivos JSON** lidos em build time (Server Components + `fs`).
- Rotas:
  - `/` — showcase em profundidade (depth scroll) navegando entre projetos
  - `/linha-do-tempo` — lista acessível de projetos em ordem cronológica
  - `/projetos` — grade de projetos
  - `/projetos/[slug]` — história completa do projeto (contexto, decisões, desafios, entregas, aprendizado, marcos)
- Deep-link: `/?projeto=<slug>` abre diretamente no projeto da home.
- Deploy alvo: **Vercel**.
