# Guia SVGator — editar o design do git graph (pra iniciante)

> Feito sob medida pros arquivos deste projeto. Você **nunca usou SVGator? Sem problema** —
> siga na ordem, é mais simples do que parece.

## Antes de tudo: como as peças se encaixam

Você tem **dois** arquivos na pasta `public/`:

| Arquivo | Pra que serve | Onde mexer |
| --- | --- | --- |
| `git-graph.svg` | **Design** (só as formas, sem animação) | **No SVGator** ✏️ |
| `git-graph-animated.svg` | Versão **animada** pronta | No código (eu cuido) 🤖 |

**Regra de ouro:** o SVGator **descarta animação** ao importar. Por isso a animação fica no
código e você usa o SVGator **só pra mexer no visual**. O ciclo é:

```
você edita o design no SVGator  →  exporta o SVG  →  me manda  →  eu reaplico a animação
```

Ou seja: **sempre importe o `git-graph.svg`** (o estático). Nunca o `-animated`.

### Paleta do projeto (pra manter o padrão)
- `feat` (verde): `#34d399`
- `fix` (amarelo): `#fbbf24`
- `refactor` (ciano): `#22d3ee`
- tronco / branches (azul): `#3c72c6`
- fundo (quase preto): `#0a0e14`

---

## Passo 1 — Criar conta
1. Acesse **svgator.com** e crie uma conta grátis (pode usar Google).
2. Você cai no **Dashboard** (lista de projetos).

## Passo 2 — Importar o `git-graph.svg`
1. Clique em **Create New Project** (ou **New Project**).
2. Escolha a opção de **Import SVG** (em vez de começar em branco).
3. Selecione o arquivo `public/git-graph.svg` deste projeto.
   - 💡 Dica: abra antes `http://localhost:3000/git-graph.svg` (com `npm run dev`) ou dê duplo-clique
     no arquivo pra ver como ele é, antes de importar.
4. O desenho aparece no centro da tela. Pronto pra editar.

## Passo 3 — Conhecer a tela (30 segundos)
- **Painel da esquerda** = lista de elementos (as "camadas"). Aqui aparecem os nomes que eu já
  deixei prontos: `trunk`, `branch-pr1`, `commit-main-3`, `merge-pr-1`, etc.
- **Centro** = o canvas (onde o desenho aparece).
- **Painel da direita** = propriedades do que você selecionou (cor de preenchimento, contorno,
  posição, tamanho).
- **Embaixo** = a linha do tempo (timeline). **Só use isso se for animar** (Passo 6, opcional).

> Selecionar pelo **nome na lista da esquerda** é mais fácil do que clicar no canvas, porque os dots
> são pequenos.

## Passo 4 — Editar o design (a parte principal)

### a) Trocar a cor de um commit
1. Na lista da esquerda, clique em **`commit-main-3`** (é o dot amarelo de `fix`).
2. No painel da direita, ache **Fill / Preenchimento** e troque a cor.
   - Quer transformar em `feat`? Use `#34d399`. Em `refactor`? `#22d3ee`.

### b) Mover um commit de lugar
1. Selecione, por exemplo, **`commit-main-5`**.
2. Arraste no canvas **OU** ajuste os campos de posição **X / Y** na direita.
   - Os commits da `main` ficam todos na altura **Y = 180** (o tronco). Mantenha esse Y pra eles
     ficarem alinhados na linha.

### c) Adicionar um commit novo (o jeito fácil: duplicar)
1. Selecione um dot que já existe (ex.: `commit-main-2`).
2. **Duplique** (`Ctrl/Cmd + D`, ou botão direito → Duplicate).
3. Arraste a cópia pra posição nova **sobre o tronco** (Y = 180).
4. Ajuste a cor pelo tipo (verde/amarelo/ciano).
5. (Opcional) Renomeie na lista da esquerda pra algo como `commit-main-7`.

### d) Mudar a cor de uma branch
1. Selecione **`branch-pr1`** na lista.
2. No painel da direita, mexa em **Stroke / Contorno** (cor e espessura).
   - Linhas não têm "Fill", elas têm **Stroke**. Os dots têm **Fill** (e um stroke fininho só de borda).

> ❌ **Não delete** o grupo `background` se quiser ver o desenho sobre o fundo escuro. Se quiser
> exportar sem fundo, aí sim pode escondê-lo/excluí-lo.

## Passo 5 — Exportar e me mandar
1. Clique em **Export** (canto superior direito).
2. Escolha **SVG**.
   - Se você **só editou o design** (não animou), pode baixar o SVG normal.
3. Salve o arquivo e me mande aqui no chat (ou substitua o `public/git-graph.svg` e me avise).
4. Eu **reaplico a animação** e atualizo o `git-graph-animated.svg`. ✅

> 💡 Tente **manter os nomes** dos elementos (`trunk`, `commit-main-1`...). Ajuda a reaplicar a
> animação rapidinho. Mas se mudar, sem pânico — eu reajusto.

---

## Passo 6 — (OPCIONAL) Animar você mesmo no SVGator

Só se você **quiser aprender a animar**. O `git-graph-animated.svg` serve de **referência** do
efeito-alvo — abra ele no navegador pra ver o que vamos recriar:

1. **Linhas se desenhando** (tronco e branches):
   - Selecione `trunk` → clique em **Animate** → adicione o animador **Draw** (desenha o traço).
   - Faça ir de 0% a 100% (começo → fim) ao longo de ~1,2s.
   - Repita em `branch-pr1` e `branch-pr2`, mas começando **um pouco depois** (arraste o início
     deles pra ~0,5s e ~0,9s na timeline), pra entrarem após o tronco passar pelo fork.
2. **Dots aparecendo em cascata**:
   - Selecione um dot → adicione os animadores **Scale** (0 → 1) e **Opacity** (0 → 1).
   - Faça o mesmo nos outros, **escalonando** o início de cada um da esquerda pra direita (uns
     0,1s de diferença). Vários dots selecionados juntos? Procure a opção **Stagger**, que faz isso
     automático.
3. **Merges (anéis)**: mesma ideia dos dots, mas começando depois que a branch deles termina.

Tempos que usei na referência (pra te guiar): tronco 0–1,2s · branch1 0,5–1,4s · branch2 0,9–1,8s ·
dots em cascata 0,2–1,6s · merges ~1,4s e ~1,9s.

> Mesmo que você anime aqui, lembre: pra **voltar a editar o design** depois, você reimporta o
> **estático**. A animação do SVGator não volta a ser editável depois de exportada.

---

## Glossário rápido
- **Canvas**: a área central onde o desenho aparece.
- **Fill / Preenchimento**: cor que enche uma forma (os dots).
- **Stroke / Contorno**: cor e espessura de uma linha (tronco, branches) ou da borda.
- **Animator / Animador**: um efeito aplicado a um elemento (Draw, Scale, Opacity...).
- **Keyframe**: um "ponto no tempo" que guarda um valor (ex.: opacity 0 no início, 1 no fim).
- **Timeline**: a régua de tempo embaixo, onde as animações vivem.
- **Stagger**: atraso automático em sequência quando você anima vários elementos juntos.
