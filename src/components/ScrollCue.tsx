// Dica de scroll decorativa: "SCROLL" na vertical (1 caractere por linha) + seta
// para baixo, pulsando. Sugere o scroll em profundidade da Home. aria-hidden
// (puramente visual); a animação cede a prefers-reduced-motion via motion-reduce.

const LETTERS = ["S", "C", "R", "O", "L", "L"];

export function ScrollCue({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none select-none ${className}`}>
      <div className="flex animate-pulse flex-col items-center gap-2 motion-reduce:animate-none">
        {/* tipografia vertical — 1 caractere por linha */}
        <div className="flex flex-col items-center gap-1 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-ink-faint">
          {LETTERS.map((ch, i) => (
            <span key={i} className="leading-none">
              {ch}
            </span>
          ))}
        </div>
        {/* seta para baixo — bobeia indicando a direção */}
        <span className="animate-bounce text-base leading-none text-accent motion-reduce:animate-none">
          ↓
        </span>
      </div>
    </div>
  );
}
