import type { CSSProperties } from "react";
import { getTechIcon } from "@/lib/tech-icons";

const MAX_ICONS = 6;
/** Achata o anel na vertical — os cards são landscape, então a constelação
 *  acompanha o formato e fica na faixa central aberta, sem vazar. */
const Y_SQUASH = 0.7;

/** Raio do anel por variante: grade de /projetos (card) e card brutalista da home (hero). */
const SIZES = {
  card: { base: 70, step: 5, cap: 100 },
  hero: { base: 88, step: 8, cap: 128 },
} as const;

type StackSize = keyof typeof SIZES;

function ringOffset(index: number, count: number, radius: number) {
  // Distribui a partir do topo (-90°), em sentido horário.
  const angle = ((-90 + (360 / count) * index) * Math.PI) / 180;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * Y_SQUASH,
  };
}

/**
 * Constelação das stacks do projeto que "salta" do centro do card no hover.
 * É puramente decorativa: `aria-hidden` + sem `pointer-events`, então o card
 * inteiro continua sendo um único alvo de clique para o link do projeto.
 *
 * `size="hero"` usa um anel maior para o card brutalista da home.
 */
export function ProjectStack({
  technologies,
  size = "card",
}: {
  technologies: string[];
  size?: StackSize;
}) {
  const techs = technologies.slice(0, MAX_ICONS);
  if (techs.length === 0) return null;

  const count = techs.length;
  const { base, step, cap } = SIZES[size];
  const radius = Math.min(cap, base + count * step);

  return (
    <div
      aria-hidden
      className={`tech-burst${size === "hero" ? " tech-burst--hero" : ""}`}
    >
      {techs.map((name, i) => {
        const icon = getTechIcon(name);
        const { x, y } = ringOffset(i, count, radius);
        const style = {
          "--tx": `${x.toFixed(1)}px`,
          "--ty": `${y.toFixed(1)}px`,
          "--tech-color": icon?.color ?? "#9aa7b4",
          "--tech-delay": `${(i * 0.045).toFixed(3)}s`,
        } as CSSProperties;

        return (
          <span
            key={`${name}-${i}`}
            className="tech-burst__chip"
            style={style}
            title={icon?.label ?? name}
          >
            {icon ? (
              <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
                <path d={icon.path} />
              </svg>
            ) : (
              <span className="tech-burst__fallback">{name.slice(0, 2)}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
