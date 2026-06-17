import Link from "next/link";
import type { Project } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/format";
import { StatusBadge, TechBadge } from "./Badge";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projetos/${project.slug}`}
      className="group flex flex-col rounded-xl border border-line bg-bg-card p-5 transition-all hover:border-accent/40 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink transition-colors group-hover:text-accent">
          {project.name}
        </h3>
        <StatusBadge
          status={project.status}
          label={STATUS_LABEL[project.status] ?? project.status}
        />
      </div>
      <p className="mt-1.5 flex-1 text-sm text-ink-muted">{project.tagline}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.technologies.slice(0, 4).map((t) => (
          <TechBadge key={t} name={t} />
        ))}
        {project.technologies.length > 4 && (
          <span className="text-xs text-ink-faint">
            +{project.technologies.length - 4}
          </span>
        )}
      </div>
    </Link>
  );
}
