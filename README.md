# Trilhado Desenvolvimento

Site interativo e didático que conta a **história do desenvolvimento** que faço
semana a semana na ECQUA Engenharia: decisões, tecnologias, desafios e entregas.

> 📄 A visão completa e os schemas de conteúdo estão em [`PROMPT.md`](./PROMPT.md).

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- Conteúdo em **arquivos JSON** (`content/weeks`, `content/projects`)

## Rodar localmente

```bash
npm install
npm run dev
# abre http://localhost:3000
```

## Estrutura

```
content/
  weeks/      # 1 JSON por semana    (schema na Parte 2 do PROMPT.md)
  projects/   # 1 JSON por projeto   (schema na Parte 3 do PROMPT.md)
src/
  app/        # rotas (App Router)
  components/ # componentes de UI
  lib/        # tipos + carregamento de conteúdo
```

## Status

MVP com **conteúdo de exemplo** (marcado como placeholder). Próximo passo:
substituir `content/` pelos dados reais dos últimos 6 meses.
