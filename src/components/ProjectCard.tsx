import Link from "next/link";
import type { Project } from "@/lib/types";
import { STATUS_LABEL, formatLong } from "@/lib/format";
import { StatusBadge, TechBadge } from "./Badge";

export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index?: number;
}) {
  return (
    <Link
      href={`/projetos/${project.slug}`}
      className="group relative flex flex-col rounded-xl border border-line bg-bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow"
    >
      {/* número + status */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-ink-faint">
          {index !== undefined ? String(index + 1).padStart(2, "0") : "—"}
        </span>
        <StatusBadge
          status={project.status}
          label={STATUS_LABEL[project.status] ?? project.status}
        />
      </div>

      {/* nome */}
      <h3 className="mt-3 text-xl font-bold leading-tight text-ink transition-colors group-hover:text-accent">
        {project.name}
      </h3>

      {/* tagline */}
      <p className="mt-1 text-sm font-medium text-accent-cyan">
        {project.tagline}
      </p>

      {/* descrição (2 linhas) */}
      <p className="mt-2.5 flex-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">
        {project.description}
      </p>

      {/* destaque principal */}
      {project.highlights[0] && (
        <div className="mt-4 rounded-lg border border-line/60 bg-bg-soft px-3 py-2.5">
          <p className="text-xs leading-relaxed text-ink-faint">
            <span className="mr-1.5 font-bold text-accent">→</span>
            {project.highlights[0]}
          </p>
        </div>
      )}

      {/* footer: techs + data */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 3).map((t) => (
            <TechBadge key={t} name={t} />
          ))}
          {project.technologies.length > 3 && (
            <span className="self-center text-xs text-ink-faint">
              +{project.technologies.length - 3}
            </span>
          )}
        </div>
        <span className="whitespace-nowrap font-mono text-xs text-ink-faint">
          {formatLong(project.startDate)}
        </span>
      </div>
    </Link>
  );
}
