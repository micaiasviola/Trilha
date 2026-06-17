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

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-10">
        <p className="font-mono text-sm text-accent">// as atrações</p>
        <SplitWords
          as="h1"
          text="Projetos"
          className="mt-2 text-4xl font-bold text-ink"
        />
        <Reveal as="p" className="mt-3 max-w-2xl text-ink-muted">
          Os produtos que as semanas de desenvolvimento constroem.
        </Reveal>
      </header>
      <Reveal stagger={0.12} y={60} className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <Magnetic key={project.slug} strength={0.1} className="block h-full">
            <ProjectCard project={project} />
          </Magnetic>
        ))}
      </Reveal>
    </div>
  );
}
