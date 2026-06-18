import type { Metadata } from "next";
import Link from "next/link";
import { getAllProjects } from "@/lib/content";
import { StatusBadge, TechBadge } from "@/components/Badge";
import { STATUS_LABEL, formatLong } from "@/lib/format";
import { SplitWords } from "@/components/anim/SplitWords";
import { Reveal } from "@/components/anim/Reveal";

export const metadata: Metadata = {
  title: "Linha do tempo — Trilhado Desenvolvimento",
};

export default function TimelinePage() {
  const projects = getAllProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-10">
        <p className="font-mono text-sm text-accent">// a trilha completa</p>
        <SplitWords
          as="h1"
          text="Linha do tempo"
          className="mt-2 text-4xl font-bold text-ink"
        />
        <Reveal as="p" className="mt-3 max-w-2xl text-ink-muted">
          Todos os projetos em ordem cronológica. Cada um tem sua história
          completa — contexto, decisões, desafios e aprendizados.
        </Reveal>
      </header>

      <ol className="space-y-6">
        {projects.map((project, i) => (
          <Reveal key={project.slug} as="li" y={40} start="top 90%">
            <article className="relative pl-8">
              {/* linha do tempo */}
              <span className="absolute left-0 top-2 grid h-4 w-4 -translate-x-1/2 place-items-center">
                <span className="h-3 w-3 rounded-full border-2 border-accent bg-bg" />
              </span>
              {i < projects.length - 1 && (
                <div className="absolute bottom-0 left-0 top-6 -translate-x-1/2 border-l border-line" />
              )}

              <Link
                href={`/projetos/${project.slug}`}
                className="group block rounded-xl border border-line bg-bg-card p-5 transition-all hover:border-accent/40 hover:shadow-glow"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-ink-faint">
                    {formatLong(project.startDate)}
                    {project.endDate
                      ? ` → ${formatLong(project.endDate)}`
                      : " → presente"}
                  </span>
                  <StatusBadge
                    status={project.status}
                    label={STATUS_LABEL[project.status] ?? project.status}
                  />
                </div>

                <h2 className="mt-1 text-lg font-semibold text-ink transition-colors group-hover:text-accent">
                  {project.name}
                </h2>
                <p className="mt-1.5 text-sm font-medium text-accent-cyan">
                  {project.tagline}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
                  {project.story?.context ?? project.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 4).map((t) => (
                    <TechBadge key={t} name={t} />
                  ))}
                  {project.technologies.length > 4 && (
                    <span className="self-center text-xs text-ink-faint">
                      +{project.technologies.length - 4}
                    </span>
                  )}
                </div>
              </Link>
            </article>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
