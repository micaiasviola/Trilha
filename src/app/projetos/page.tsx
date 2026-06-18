import type { Metadata } from "next";
import { getAllProjects } from "@/lib/content";
import { ProjectCard } from "@/components/ProjectCard";
import { SplitWords } from "@/components/anim/SplitWords";
import { Reveal } from "@/components/anim/Reveal";
import { Magnetic } from "@/components/anim/Magnetic";

export const metadata: Metadata = {
  title: "Projetos — Trilhado Desenvolvimento",
};

export default function ProjectsPage() {
  const projects = getAllProjects();
  const inProgress = projects.filter((p) => p.status === "in-progress");
  const shipped = projects.filter((p) => p.status === "shipped");

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-14">
        <p className="font-mono text-sm text-accent">// as atrações do parque</p>
        <SplitWords
          as="h1"
          text="Projetos"
          className="mt-2 text-4xl font-bold text-ink"
        />
        <Reveal as="p" className="mt-3 max-w-2xl text-ink-muted">
          Cada projeto é uma atração: tem história própria, decisões técnicas,
          desafios e entregas. Aqui estão os produtos que as semanas constroem.
        </Reveal>

        <Reveal stagger={0.1} y={16} className="mt-6 flex flex-wrap gap-6">
          <span className="font-mono text-sm">
            <span className="text-accent-cyan">{inProgress.length}</span>
            <span className="ml-1.5 text-ink-faint">em andamento</span>
          </span>
          <span className="font-mono text-sm">
            <span className="text-accent">{shipped.length}</span>
            <span className="ml-1.5 text-ink-faint">entregues</span>
          </span>
          <span className="font-mono text-sm">
            <span className="text-ink">{projects.length}</span>
            <span className="ml-1.5 text-ink-faint">total</span>
          </span>
        </Reveal>
      </header>

      {inProgress.length > 0 && (
        <section className="mb-14">
          <Reveal className="mb-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan">
              Em andamento
            </p>
            <span className="h-px flex-1 bg-line" />
          </Reveal>
          <Reveal stagger={0.1} y={60} className="grid gap-5 sm:grid-cols-2">
            {inProgress.map((project, i) => (
              <Magnetic key={project.slug} strength={0.1} className="block h-full">
                <ProjectCard project={project} index={i} />
              </Magnetic>
            ))}
          </Reveal>
        </section>
      )}

      {shipped.length > 0 && (
        <section>
          <Reveal className="mb-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Entregues
            </p>
            <span className="h-px flex-1 bg-line" />
          </Reveal>
          <Reveal stagger={0.1} y={60} className="grid gap-5 sm:grid-cols-2">
            {shipped.map((project, i) => (
              <Magnetic key={project.slug} strength={0.1} className="block h-full">
                <ProjectCard project={project} index={inProgress.length + i} />
              </Magnetic>
            ))}
          </Reveal>
        </section>
      )}
    </div>
  );
}
