import Link from "next/link";
import { getAllProjects, getAllWeeks, getSiteStats } from "@/lib/content";
import { StatCard } from "@/components/StatCard";
import { TimelineEntry } from "@/components/TimelineEntry";
import { Hero } from "@/components/Hero";
import { HorizontalAttractions } from "@/components/HorizontalAttractions";
import { Reveal } from "@/components/anim/Reveal";
import { SplitWords } from "@/components/anim/SplitWords";
import { ScrubText } from "@/components/anim/ScrubText";
import { Magnetic } from "@/components/anim/Magnetic";

export default function HomePage() {
  const stats = getSiteStats();
  const recentWeeks = getAllWeeks().slice(0, 3);
  const projects = getAllProjects();

  return (
    <div>
      <Hero />

      <div className="mx-auto max-w-5xl px-4">
        {/* Métricas */}
        <Reveal
          stagger={0.1}
          y={40}
          className="-mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard value={stats.weeks} label="Semanas" />
          <StatCard value={stats.projects} label="Atrações" />
          <StatCard value={stats.deliveries} label="Entregas" />
          <StatCard value={stats.technologies} label="Tecnologias" />
        </Reveal>

        {/* Manifesto com scrub */}
        <section className="py-28 sm:py-36">
          <ScrubText
            as="p"
            text="Não é um portfólio de prints. É a trilha real do que eu construo: as decisões que tomei, o que deu errado e como resolvi, semana após semana."
            className="mx-auto max-w-3xl text-center text-2xl font-semibold leading-snug sm:text-4xl"
          />
        </section>
      </div>

      {/* Atrações em scroll horizontal (a montanha-russa) */}
      <HorizontalAttractions projects={projects} />

      <div className="mx-auto max-w-5xl px-4">
        {/* Prévia da trilha */}
        <section className="py-20">
          <div className="mb-10">
            <p className="font-mono text-sm text-accent">// a trilha</p>
            <SplitWords
              as="h2"
              text="Últimas semanas"
              className="mt-2 text-3xl font-bold text-ink"
            />
            <Reveal as="p" className="mt-1 text-ink-muted">
              O fio mais recente da jornada.
            </Reveal>
          </div>

          <div className="space-y-6">
            {recentWeeks.map((week) => (
              <Reveal key={week.slug} y={50} start="top 90%">
                <TimelineEntry week={week} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10 flex justify-center">
            <Magnetic strength={0.3}>
              <Link
                href="/linha-do-tempo"
                className="inline-block rounded-lg border border-line px-6 py-3 font-medium text-ink transition-colors hover:border-accent/40"
              >
                Percorrer a trilha completa →
              </Link>
            </Magnetic>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
