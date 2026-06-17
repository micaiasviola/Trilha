"use client";

import { useMemo, useState } from "react";
import type { Week } from "@/lib/types";
import { TimelineEntry } from "./TimelineEntry";
import { Reveal } from "./anim/Reveal";

export function TimelineFilter({
  weeks,
  technologies,
}: {
  weeks: Week[];
  technologies: string[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      active ? weeks.filter((w) => w.technologies.includes(active)) : weeks,
    [weeks, active],
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip
          label="Todas"
          active={active === null}
          onClick={() => setActive(null)}
        />
        {technologies.map((tech) => (
          <FilterChip
            key={tech}
            label={tech}
            active={active === tech}
            onClick={() => setActive(active === tech ? null : tech)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-muted">Nenhuma semana com essa tecnologia.</p>
      ) : (
        <div key={active ?? "all"} className="space-y-6">
          {filtered.map((week) => (
            <Reveal key={week.slug} y={50} start="top 90%">
              <TimelineEntry week={week} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-line bg-bg-soft text-ink-muted hover:border-accent/40 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
