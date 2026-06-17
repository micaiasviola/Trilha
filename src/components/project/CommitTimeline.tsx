"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/anim/gsap";
import { onIntroReady, prefersReducedMotion } from "@/lib/anim/signal";
import { formatShort } from "@/lib/format";
import type { Commit, CommitType } from "@/lib/commits";

const TYPE: Record<CommitType, { label: string; cls: string }> = {
  feat: { label: "feat", cls: "text-accent border-accent/40" },
  fix: { label: "fix", cls: "text-amber-400 border-amber-400/40" },
  refactor: { label: "refactor", cls: "text-accent-cyan border-accent-cyan/40" },
};

export function CommitTimeline({
  commits,
  repo,
}: {
  commits: Commit[];
  repo: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;

      const items = el.querySelectorAll("[data-commit]");
      gsap.set(items, { autoAlpha: 0, x: 18 });

      const run = () =>
        gsap.to(items, {
          autoAlpha: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.05,
          clearProps: "transform",
        });

      const unsub = onIntroReady(run);
      return () => unsub();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex min-h-full flex-col">
      {/* Cabeçalho fixo do painel */}
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <GitHubMark className="h-4 w-4" />
            {repo}
          </span>
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-ink-faint">
            GitHub em breve
          </span>
        </div>
        <h2 className="mt-3 text-lg font-semibold text-ink">Commits</h2>
        <p className="text-xs text-ink-faint">
          linha do tempo · derivada das semanas
        </p>
      </header>

      {/* Feed rolável */}
      <div className="relative flex-1 px-5 py-6">
        {commits.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nenhum commit registrado ainda.
          </p>
        ) : (
          <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
            {commits.map((c) => {
              const t = TYPE[c.type];
              return (
                <li
                  key={c.hash}
                  data-commit
                  className="relative pl-7"
                >
                  <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-accent bg-bg" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent-cyan">
                      {c.hash}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-px font-mono text-[0.6rem] ${t.cls}`}
                    >
                      {t.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-snug text-ink">
                    {c.message}
                  </p>
                  <p className="mt-1 font-mono text-[0.65rem] text-ink-faint">
                    semana {c.week} · {formatShort(c.date)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-8 rounded-xl border border-dashed border-line p-4 text-center">
          <p className="text-xs text-ink-muted">
            Em breve: commits reais sincronizados do GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
