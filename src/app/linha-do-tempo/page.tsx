import type { Metadata } from "next";
import { getAllWeeks, getTechnologyCounts } from "@/lib/content";
import { TimelineFilter } from "@/components/TimelineFilter";
import { SplitWords } from "@/components/anim/SplitWords";
import { Reveal } from "@/components/anim/Reveal";

export const metadata: Metadata = {
  title: "Linha do tempo — Trilhado Desenvolvimento",
};

export default function TimelinePage() {
  const weeks = getAllWeeks();
  const technologies = getTechnologyCounts().map((t) => t.name);

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
          Cada semana de desenvolvimento, da mais recente à mais antiga. Filtre
          por tecnologia para seguir um fio específico.
        </Reveal>
      </header>
      <TimelineFilter weeks={weeks} technologies={technologies} />
    </div>
  );
}
