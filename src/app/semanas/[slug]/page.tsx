import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllWeeks, getProject, getWeek } from "@/lib/content";
import { formatRange } from "@/lib/format";
import { TechBadge } from "@/components/Badge";
import { Reveal } from "@/components/anim/Reveal";
import { SplitWords } from "@/components/anim/SplitWords";

export function generateStaticParams() {
  return getAllWeeks().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const week = getWeek(slug);
  return { title: week ? `${week.title} — Semana ${week.weekNumber}` : "Semana" };
}

export default async function WeekPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const week = getWeek(slug);
  if (!week) notFound();

  const relatedProjects = week.projects
    .map((p) => getProject(p))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Link
        href="/linha-do-tempo"
        className="text-sm text-ink-muted transition-colors hover:text-ink"
      >
        ← Linha do tempo
      </Link>

      <header className="mt-6 border-b border-line pb-8">
        <div className="flex items-center gap-3 font-mono text-sm text-accent-cyan">
          <span>Semana {week.weekNumber}</span>
          <span className="text-ink-faint">·</span>
          <span className="text-ink-faint">
            {formatRange(week.startDate, week.endDate)}
          </span>
        </div>
        <SplitWords
          as="h1"
          text={week.title}
          className="mt-2 text-3xl font-bold tracking-tight text-ink"
        />
        <p className="mt-3 text-lg text-ink-muted">{week.summary}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {week.technologies.map((t) => (
            <TechBadge key={t} name={t} />
          ))}
        </div>
      </header>

      <div className="mt-10 space-y-10">
        <Section title="📦 Entregas">
          <ul className="space-y-2">
            {week.deliveries.map((d, i) => (
              <li key={i} className="flex gap-2 text-ink-muted">
                <span className="text-accent">▸</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="🧭 Decisões">
          <div className="space-y-4">
            {week.decisions.map((d, i) => (
              <div
                key={i}
                className="rounded-xl border border-line bg-bg-card p-4"
              >
                <h3 className="font-semibold text-ink">{d.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{d.rationale}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="⚡ Desafios">
          <div className="space-y-4">
            {week.challenges.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-line bg-bg-card p-4"
              >
                <h3 className="font-semibold text-ink">{c.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{c.howSolved}</p>
              </div>
            ))}
          </div>
        </Section>

        {week.learning && (
          <Section title="💡 Aprendizado">
            <blockquote className="border-l-2 border-accent pl-4 text-lg italic text-ink">
              {week.learning}
            </blockquote>
          </Section>
        )}

        {relatedProjects.length > 0 && (
          <Section title="🔗 Projetos relacionados">
            <div className="flex flex-wrap gap-2">
              {relatedProjects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/projetos/${p.slug}`}
                  className="rounded-lg border border-line bg-bg-card px-4 py-2 text-sm text-ink transition-colors hover:border-accent/40"
                >
                  {p.name} →
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal as="section" y={40}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h2>
      {children}
    </Reveal>
  );
}
