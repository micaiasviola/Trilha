# Trilhado Desenvolvimento

Site interativo e didático que conta a **história do desenvolvimento** que faço
semana a semana na ECQUA Engenharia: decisões, tecnologias, desafios e entregas.

> 📄 **Comece pelo [`PROMPT.md`](./PROMPT.md)** — documento de contexto principal do
> site (visão, stack, rotas e modelo de conteúdo). Arquitetura detalhada em
> [`context/contexto.md`](./context/contexto.md).

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19** + **Tailwind CSS**
- Animação: **GSAP** + **Lenis** + **Three.js** (sem backend próprio)
- Conteúdo curado em **arquivos JSON** (`content/projects/`) + dados ao vivo da **GitHub API** (com fallback)

## Rodar localmente

```bash
npm install
npm run dev
# abre http://localhost:3000
```

## Estrutura

```
content/
  projects/   # 1 JSON por projeto   (schema no §5 do PROMPT.md)
src/
  app/        # rotas (App Router): / (showcase) e /projetos/[slug]
  components/ # componentes de UI (anim, depth, project)
  lib/        # tipos, carregamento de conteúdo e GitHub API
```

## Status

MVP com **conteúdo de exemplo** (marcado como placeholder). Próximo passo:
substituir `content/` pelos dados reais dos últimos 6 meses.
