import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllProjects,
  getProject,
  getWeeksForProject,
} from "@/lib/content";
import { getProjectCommits } from "@/lib/commits";
import { ProjectStage } from "@/components/project/ProjectStage";
import { CommitTimeline } from "@/components/project/CommitTimeline";

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return { title: project ? `${project.name} — Atração` : "Atração" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const weeks = getWeeksForProject(slug);
  const commits = project.githubRepo
    ? await getProjectCommits(project.githubRepo, project.startDate)
    : [];
  const index = getAllProjects().findIndex((p) => p.slug === slug);

  const stats = {
    weeks: weeks.length,
    deliveries: weeks.reduce((s, w) => s + w.deliveries.length, 0),
    decisions: weeks.reduce((s, w) => s + w.decisions.length, 0),
    technologies: project.technologies.length,
  };

  const stageWeeks = weeks.map((w) => ({
    slug: w.slug,
    weekNumber: w.weekNumber,
    title: w.title,
  }));

  return (
    <div className="lg:grid lg:h-[calc(100svh-4rem)] lg:grid-cols-[7fr_3fr]">
      {/* Esquerda (70%) — o palco da atração */}
      <section
        data-lenis-prevent
        className="bg-grid relative min-h-0 overflow-hidden lg:overflow-y-auto scroll-slim"
      >
        <ProjectStage
          project={project}
          index={index}
          stats={stats}
          weeks={stageWeeks}
        />
      </section>

      {/* Direita (30%) — feed rolável de commits */}
      <aside
        data-lenis-prevent
        className="relative min-h-0 border-t border-line lg:overflow-y-auto lg:border-l lg:border-t-0 scroll-slim"
        aria-label="Linha do tempo de commits"
      >
        <CommitTimeline
          commits={commits}
          repo={project.githubRepo ? `micaiasviola/${project.githubRepo}` : `micaiasviola/${slug}`}
          live={!!project.githubRepo}
          technologies={project.technologies}
        />
      </aside>
    </div>
  );
}
