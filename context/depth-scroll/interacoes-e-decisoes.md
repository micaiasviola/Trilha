# Depth Scroll — Interações e decisões

> Companion do [`README.md`](./README.md). Aqui ficam as **duas mecânicas de input** da
> Home e o **porquê** de cada decisão. Se você for mudar o comportamento do scroll ou do
> auto-advance, leia isto antes — várias escolhas são de propósito e fáceis de desfazer
> sem querer.

Contexto: ambas nasceram de um pedido do dono do projeto —
> 1. "o scroll automático deve **parar** ao mover o mouse ou selecionar um cartão";
> 2. "ao rolar a roda, cada projeto deve **saltar fixamente**, 1 cartão por vez, sem
>    rolar direto para o próximo".

---

## 7.1 Roda discreta — `wheelStep` (1 gesto = 1 card)

### Objetivo
Cada **gesto** de roda avança **exatamente uma** camada e ela assenta nítida no centro.
Girar rápido (ou a inércia do trackpad) **não** pode pular vários cards.

### Onde
- Engine: `depthScrollEngine.ts` → opção `wheelStep` + `_onWheel()` (ramo discreto) +
  `_stepBy()`.
- Home: `ProjectsDepthShowcase.tsx` → `wheelStep: true`, `stepGap: 240`, `stepThreshold: 20`.

### Como funciona (debounce por *gap*, sem estado persistente)
Um "gesto" é uma rajada de eventos de `wheel`. A engine separa um gesto do próximo pelo
**intervalo de tempo** entre eventos:

```
no wheel:
  dir = sinal(delta)               // respeita `invert`
  se !shouldCapture(dir): return   // em until-bounds, solta o wheel na borda
  preventDefault()
  gap = now - _wheelLastTs
  se gap >= stepGap:               // passou tempo demais → NOVO gesto
      _wheelAccum = 0; _wheelFired = false
  _wheelLastTs = now
  _wheelAccum += delta
  se !_wheelFired e |_wheelAccum| >= stepThreshold:
      _stepBy(sinal(_wheelAccum))  // → goTo(curIdx ± 1) → _wake()
      _wheelFired = true           // 1 passo por gesto; resto é absorvido
```

- **Giro rápido / inércia de trackpad** → eventos chegam com `gap < stepGap`, então
  ficam no **mesmo gesto** → só o primeiro dispara, o resto é absorvido. Resultado: 1 card.
- **Para avançar de novo** o usuário pausa `> stepGap` (240ms) e rola outra vez.
- `_stepBy` calcula o índice a partir de `targetValue` (o alvo, não o `current` que ainda
  está deslizando), então passos sucessivos são exatos.

### A decisão crítica: o "lock" é por timestamp, não por booleano
Tentação natural seria um `wheelLocked = true` liberado por um timer. **Não faça isso
aqui.** O loop **dorme** quando ocioso (README §3.1/§6.1); um booleano de lock pode
ficar **preso `true`** depois que o loop dorme, e como eventos absorvidos *não* religam
o loop, você cria um **deadlock**: a roda para de responder até um reload.

A solução em uso é **stateless no tempo**: o "lock" é implícito — só existe enquanto os
eventos chegam com `gap < stepGap`. Como depende só de `_wheelLastTs` (um timestamp),
**nunca fica preso** após o sono: o próximo evento real vê um `gap` enorme e inicia um
gesto novo. Mantenha essa propriedade se for refatorar.

### Tuning
- `stepGap` (240ms): ↑ = exige mais pausa entre cards (mais "travado", mais deliberado);
  ↓ = gestos sucessivos passam mais rápido. **Cuidado abaixo de ~180ms:** a cauda da
  inércia do trackpad pode ser lida como gesto novo e dar **passo duplo**. O
  `stepThreshold` protege parcialmente (a cauda tem delta pequeno), mas não force.
- `stepThreshold` (20px): filtra micro-jitter e acumula arrasto lento de trackpad até
  cruzar o limiar.
- `smoothing` (0.16 na Home): o quão seco a camada assenta depois do passo.

### Reverter
`wheelStep: false` → volta ao **scroll contínuo** com snap suave (`snap`/`snapDelay`).
Touch e teclado **não** usam este ramo: toque é contínuo+snap; teclado já é 1 card via
`next()/prev()`.

### Armadilhas
- Mantenha o `wheel` **não-passivo** (README §6.5), senão `preventDefault()` falha e a
  página rola junto.
- Em `captureMode:'always'` (a Home), nas bordas o passo vira `goTo(além)` → clamp →
  sem movimento. É inofensivo (sem jitter), só um no-op.

---

## 7.2 Auto-advance que **para** na interação (attract loop)

### Objetivo
O carrossel automático é só um **chamariz** (mostra que há vários projetos). Assim que o
usuário dá **qualquer** sinal de engajamento, ele **para de vez** na sessão e devolve o
controle.

### Onde
`ProjectsDepthShowcase.tsx`: `autoStoppedRef`, `stopAuto()`, o `setInterval` de
auto-advance e os handlers que chamam `stopAuto`.

### Comportamento (modelo híbrido: pausa vs. parada)
- Antes da 1ª interação: ping-pong entre projetos a cada `AUTO_INTERVAL_MS` (5s), via
  `dirRef` + `engine.goTo()`.
- **`pauseAuto()`** — *adia* o avanço (grava `lastInteractRef = now`); o loop **retoma**
  após `AUTO_IDLE_MS` (5s) sem interação. Dispara em:
  - **mover o mouse** sobre o palco ou a nav (`onPointerMove`);
  - **rolar / tocar / pressionar** (`onWheel`, `onTouchStart`, `onPointerDown`);
  - **teclado** de navegação (setas/espaço/PageUp-Down) — listener em `window`.
- **`stopAuto()`** — *para de vez* na sessão (`autoStoppedRef = true`). Dispara **só ao
  selecionar um projeto**:
  - foco no CTA "Ver história" (`onFocus`) ou clique na **timeline** lateral (`onClick`);
  - **deep-link** `?projeto=<slug>` (idx>0): chegou num projeto de propósito.
- O intervalo avança só quando `!autoStoppedRef` **e** já passou `AUTO_IDLE_MS` desde a
  última interação.
- `prefers-reduced-motion`: o auto-advance **nem inicia**.

### A decisão: híbrido (mouse pausa, parada só na seleção)
O pedido foi "parar ao mover o mouse **ou** selecionar um card". Duas leituras — o dono
escolheu o **híbrido**:

| Modelo | Comportamento | Status |
|---|---|---|
| **Híbrido** ✅ (atual) | Mouse / roda / toque **pausam** (retomam após ocioso); selecionar projeto **para** de vez | Escolhido: mantém o chamariz vivo se o usuário sair, mas nunca "rouba" a tela enquanto ele está presente e mexendo. |
| Parada permanente | Qualquer interação desliga até o reload | Mais literal a "pare", mas deixa o auto-advance quase vestigial. Foi a 1ª versão; trocada a pedido. |

**Para voltar à parada permanente:** faça os handlers de mouse/roda/toque/teclado
chamarem `stopAuto` (em vez de `pauseAuto`) e remova a checagem de `AUTO_IDLE_MS` no
intervalo — aí qualquer interação desliga o loop de vez.

### Armadilhas
- `onPointerMove` dispara **muito**, mas `stopAuto` só escreve um `ref` (sem re-render) e
  é idempotente — custo desprezível.
- Não confunda com o `pointermove` de **parallax** da engine (escreve `--depth-pointer`):
  são listeners independentes no mesmo palco e coexistem.
- O auto-advance lê `engine.current?.activeLayer` para o ping-pong; ele só existe com
  `layerCount > 0`.

---

## Histórico
- **2026-06-20** — Criadas ambas as mecânicas (roda discreta `wheelStep` + auto-advance).
  `smoothing` da Home subiu 0.12 → 0.16 (assentamento seco). O auto-advance começou como
  **parada permanente** e, no mesmo dia e a pedido do dono, virou **híbrido** (mouse/roda
  pausam; selecionar projeto para de vez). Documentado aqui e no README do módulo.
