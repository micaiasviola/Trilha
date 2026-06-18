import Link from "next/link";
import type { Week } from "@/lib/types";
import { formatRange } from "@/lib/format";
import { TechBadge } from "./Badge";

export function TimelineEntry({ week }: { week: Week }) {
  return (
    <article className="relative pl-8">
      {/* linha + nó */}
      <span className="absolute left-0 top-2 grid h-4 w-4 -translate-x-1/2 place-items-center">
        <span className="h-3 w-3 rounded-full border-2 border-accent bg-bg" />
      </span>
      <div className="absolute bottom-0 left-0 top-6 -translate-x-1/2 border-l border-line" />

      <Link
        href={`/semanas/${week.slug}`}
        className="group block rounded-xl border border-line bg-bg-card p-5 transition-all hover:border-accent/40 hover:shadow-glow"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-xs text-accent-cyan">
            Semana {week.weekNumber}
          </span>
          <span className="text-xs text-ink-faint">
            {formatRange(week.startDate, week.endDate)}
          </span>
        </div>
        <h3 className="mt-1 text-lg font-semibold text-ink transition-colors group-hover:text-accent">
          {week.title}
        </h3>
        <p className="mt-1.5 text-sm text-ink-muted">{week.summary}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {week.technologies.map((t) => (
            <TechBadge key={t} name={t} />
          ))}
        </div>

        <div className="mt-3 flex gap-4 text-xs text-ink-faint">
          <span>
            <span className="font-medium text-accent">{week.deliveries.length}</span>
            {" "}entregas
          </span>
          <span>
            <span className="font-medium text-accent-cyan">{week.decisions.length}</span>
            {" "}decisões
          </span>
          <span>
            <span className="font-medium text-ink-muted">{week.challenges.length}</span>
            {" "}desafios
          </span>
        </div>
      </Link>
    </article>
  );
}
