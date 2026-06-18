"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { gsap, useGSAP, EASE } from "@/lib/anim/gsap";
import { onIntroReady, prefersReducedMotion } from "@/lib/anim/signal";
import { formatShort } from "@/lib/format";
import type { Commit, CommitType } from "@/lib/commits";

// ── Commit type display ─────────────────────────────────────
const TYPE: Record<CommitType, { label: string; cls: string }> = {
  feat:     { label: "feat",     cls: "text-accent border-accent/40" },
  fix:      { label: "fix",      cls: "text-amber-400 border-amber-400/40" },
  refactor: { label: "refactor", cls: "text-accent-cyan border-accent-cyan/40" },
};

// ── Achievement system ──────────────────────────────────────
type Rarity = "common" | "rare" | "epic" | "legendary";

interface Achievement {
  id: string;
  name: string;
  lore: string;
  rarity: Rarity;
  check: (commits: Commit[]) => boolean;
}

const uniqueWeeks = (c: Commit[]) => new Set(c.map((x) => x.week)).size;
const countType   = (c: Commit[], t: CommitType) => c.filter((x) => x.type === t).length;

// ── SVG video game icons (one per achievement) ──────────────
const ICONS: Record<string, ReactNode> = {
  // Sword — first commit, first step
  "primeiro-passo": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="9" y1="15" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="4.5" cy="19.5" r="1.5" fill="currentColor"/>
    </svg>
  ),
  // Arrow / crossbow bolt — hunting bugs
  "cacador-sombras": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 19l4-1-3-3-1 4z" fill="currentColor"/>
      <path d="M19 5l-4 2 2 2 2-4z" fill="currentColor"/>
      <line x1="9" y1="15" x2="5" y2="11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  // Potion flask — refactor transmutation
  "toque-alquimista": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M9 3h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 3v5L5 15a5 5 0 0014 0L14 8V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="15" r="1" fill="currentColor" opacity="0.7"/>
      <circle cx="13.5" cy="12.5" r="0.7" fill="currentColor" opacity="0.45"/>
    </svg>
  ),
  // Blacksmith hammer — forging features
  "ferreiro-features": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <rect x="2" y="4" width="12" height="8" rx="2" fill="currentColor" opacity="0.85"/>
      <path d="M11 12L20 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  // Skull — banishing bugs
  "exorcista": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M12 3C7.5 3 4 6.5 4 11c0 2.6 1.1 5 3 6.5V19h10v-1.5c1.9-1.5 3-3.9 3-6.5C20 6.5 16.5 3 12 3z"
        stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="9" cy="11" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="11" r="1.5" fill="currentColor"/>
      <line x1="9"  y1="19" x2="9"  y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15" y1="19" x2="15" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  // Gem / diamond — philosopher's stone
  "pedra-filosofal": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M12 2l8 6-8 14L4 8l8-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M4 8h16M8 8L12 2M16 8L12 2" stroke="currentColor" strokeWidth="1" opacity="0.45"/>
    </svg>
  ),
  // Shield with checkmark — fortress guardian
  "guardiao-fortaleza": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M12 2L3 6v6c0 5.25 4.05 9.75 9 11C17 21.75 21 17.25 21 12V6L12 2z"
        stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Crossed swords — knight of the triad
  "cavaleiro-triada": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <line x1="4" y1="20" x2="20" y2="4"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="4"  x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4 20l2-2M18 6l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 4l2 2M18 18l2 2"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  // Compass rose — wanderer of eras
  "andarilho-eras": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      <path d="M12 5l3 7-3 7-3-7 3-7z" fill="currentColor" opacity="0.9"/>
    </svg>
  ),
  // Crown — living legend
  "lenda-viva": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 20V10l5 4 4-8 4 8 5-4v10"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="7.5"  cy="13.5" r="1" fill="currentColor"/>
      <circle cx="12"   cy="10"   r="1" fill="currentColor"/>
      <circle cx="16.5" cy="13.5" r="1" fill="currentColor"/>
    </svg>
  ),
  // Hourglass — the eternal
  "eterno": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M5 2h14M5 22h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 2l5 9M17 2l-5 9"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 22l5-9M17 22l-5-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 11h4" stroke="currentColor" strokeWidth="1" opacity="0.45"/>
    </svg>
  ),
  // Magic orb — architect of infinity
  "arquiteto-infinito": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1"   fill="none" opacity="0.5"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
    </svg>
  ),
  // Quill pen — TypeScript strict scribe
  "escriba-rigoroso": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M20 3C14 3 8 9 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 18l-3 3"           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 18c1-2 3-4 6-5"   stroke="currentColor" strokeWidth="1"   strokeLinecap="round" opacity="0.5"/>
      <path d="M20 3l-8 9"           stroke="currentColor" strokeWidth="1"   strokeLinecap="round" opacity="0.35"/>
    </svg>
  ),
  // Lightning bolt — Supabase Realtime
  "vassalo-realtime": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  // Stacked containers — Docker forge
  "forja-containers": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <rect x="3" y="15" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="3" y="9"  width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="3" y="3"  width="18" height="6" rx="1" fill="currentColor" opacity="0.75"/>
      <line x1="7" y1="9"  x2="7" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
      <line x1="7" y1="15" x2="7" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
    </svg>
  ),
  // Map scroll — React Native explorer
  "explorador-reinos": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <line x1="9"  y1="3"  x2="9"  y2="18" stroke="currentColor" strokeWidth="1" opacity="0.45"/>
      <line x1="15" y1="6"  x2="15" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.45"/>
    </svg>
  ),
  // Database cylinder — PostgreSQL lord
  "senhor-banco": (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-full w-full">
      <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M3 5v14a9 3 0 0018 0V5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M3 12a9 3 0 0018 0"     stroke="currentColor" strokeWidth="1"   opacity="0.45"/>
    </svg>
  ),
};

// ── Base achievements ────────────────────────────────────────
const BASE_ACHIEVEMENTS: Achievement[] = [
  // — Aprendiz —
  {
    id: "primeiro-passo",
    name: "Primeiro Passo",
    lore: "Todo herói começa do zero. Este commit é o fio que tece a lenda.",
    rarity: "common",
    check: (c) => c.length >= 1,
  },
  {
    id: "cacador-sombras",
    name: "Caçador de Sombras",
    lore: "O primeiro bug caiu diante de você. As trevas aprenderam a temer.",
    rarity: "common",
    check: (c) => c.some((x) => x.type === "fix"),
  },
  {
    id: "toque-alquimista",
    name: "Toque do Alquimista",
    lore: "Código impuro transmutado. O primeiro refactor sempre revela o que o caos escondeu.",
    rarity: "common",
    check: (c) => c.some((x) => x.type === "refactor"),
  },
  // — Aventureiro —
  {
    id: "ferreiro-features",
    name: "Ferreiro de Features",
    lore: "5 habilidades forjadas no calor do código. A fortaleza ganha novas muralhas.",
    rarity: "rare",
    check: (c) => countType(c, "feat") >= 5,
  },
  {
    id: "exorcista",
    name: "Exorcista",
    lore: "5 entidades malignas banidas para o void. O repositório respira novamente.",
    rarity: "rare",
    check: (c) => countType(c, "fix") >= 5,
  },
  {
    id: "pedra-filosofal",
    name: "Pedra Filosofal",
    lore: "3 transmutações concluídas. O segredo da refatoração começa a se revelar.",
    rarity: "rare",
    check: (c) => countType(c, "refactor") >= 3,
  },
  // — Herói —
  {
    id: "guardiao-fortaleza",
    name: "Guardião da Fortaleza",
    lore: "10 commits. Uma sentinela permanente habita este repositório. Ele nunca cairá.",
    rarity: "epic",
    check: (c) => c.length >= 10,
  },
  {
    id: "cavaleiro-triada",
    name: "Cavaleiro da Tríade",
    lore: "feat, fix e refactor — os três pilares do código virtuoso, todos invocados.",
    rarity: "epic",
    check: (c) =>
      c.some((x) => x.type === "feat") &&
      c.some((x) => x.type === "fix") &&
      c.some((x) => x.type === "refactor"),
  },
  {
    id: "andarilho-eras",
    name: "Andarilho das Eras",
    lore: "Commits em 3 semanas distintas. Apenas os heróis verdadeiros mantêm a jornada.",
    rarity: "epic",
    check: (c) => uniqueWeeks(c) >= 3,
  },
  // — Lendário —
  {
    id: "lenda-viva",
    name: "Lenda Viva",
    lore: "25 commits. Os bardos já cantam este nome nas tavernas do código.",
    rarity: "legendary",
    check: (c) => c.length >= 25,
  },
  {
    id: "eterno",
    name: "O Eterno",
    lore: "Commits em 5 semanas distintas. Este repositório nunca foi abandonado.",
    rarity: "legendary",
    check: (c) => uniqueWeeks(c) >= 5,
  },
  {
    id: "arquiteto-infinito",
    name: "Arquiteto do Infinito",
    lore: "10 feat · 5 fix · 3 refactor. Os três pilares erguidos em escala épica.",
    rarity: "legendary",
    check: (c) =>
      countType(c, "feat") >= 10 &&
      countType(c, "fix") >= 5 &&
      countType(c, "refactor") >= 3,
  },
];

// ── Tech-specific achievements ───────────────────────────────
const TECH_ACHIEVEMENTS: Record<string, Achievement> = {
  TypeScript: {
    id: "escriba-rigoroso",
    name: "Escriba Rigoroso",
    lore: "TypeScript em modo estrito. Cada tipo é um escudo; cada interface, um pacto de honra.",
    rarity: "legendary",
    check: (c) => countType(c, "feat") >= 3,
  },
  Supabase: {
    id: "vassalo-realtime",
    name: "Vassalo Realtime",
    lore: "Supabase Realtime invocado. Dados fluem como rios encantados sem polling.",
    rarity: "legendary",
    check: (c) => c.some((x) => /realtime|supabase/i.test(x.message)) || c.length >= 5,
  },
  Docker: {
    id: "forja-containers",
    name: "Forja de Contêineres",
    lore: "Docker domado. Fortalezas portáteis. Deploy sem medo, infraestrutura como código.",
    rarity: "legendary",
    check: (c) => c.some((x) => /docker|container|deploy/i.test(x.message)) || c.length >= 3,
  },
  "React Native": {
    id: "explorador-reinos",
    name: "Explorador de Reinos",
    lore: "Além do browser, além do desktop — o herói que domina terras móveis é raro.",
    rarity: "epic",
    check: (c) => c.length >= 1,
  },
  PostgreSQL: {
    id: "senhor-banco",
    name: "Senhor do Banco",
    lore: "PostgreSQL, RLS, PLpgSQL — as runas do banco de dados dominadas.",
    rarity: "rare",
    check: (c) => countType(c, "feat") >= 2,
  },
};

function buildAchievements(technologies: string[]): Achievement[] {
  const extras = technologies
    .map((t) => TECH_ACHIEVEMENTS[t])
    .filter(Boolean) as Achievement[];
  return [...BASE_ACHIEVEMENTS, ...extras];
}

// ── Rarity metadata ─────────────────────────────────────────
const RARITY_LABEL: Record<Rarity, string> = {
  common:    "Aprendiz",
  rare:      "Aventureiro",
  epic:      "Herói",
  legendary: "Lendário",
};

const RARITY_UNLOCKED: Record<Rarity, string> = {
  common:    "border-line bg-bg-card text-ink-muted",
  rare:      "border-accent-cyan/50 bg-accent-cyan/5 text-accent-cyan",
  epic:      "border-accent/50 bg-accent/5 text-accent",
  legendary: "border-amber-400/50 bg-amber-400/5 text-amber-400",
};

const RARITY_GLOW: Record<Rarity, string> = {
  common:    "",
  rare:      "shadow-[0_0_14px_-4px_rgba(34,211,238,0.45)]",
  epic:      "shadow-[0_0_14px_-4px_rgba(52,211,153,0.45)]",
  legendary: "shadow-[0_0_18px_-4px_rgba(251,191,36,0.55)]",
};

const RARITY_HOVER_GLOW: Record<Rarity, string> = {
  common:    "hover:shadow-sm",
  rare:      "hover:shadow-[0_0_22px_-2px_rgba(34,211,238,0.65)]",
  epic:      "hover:shadow-[0_0_22px_-2px_rgba(52,211,153,0.65)]",
  legendary: "hover:shadow-[0_0_28px_-2px_rgba(251,191,36,0.7)]",
};

const RARITY_DOT: Record<Rarity, string> = {
  common:    "bg-ink-faint",
  rare:      "bg-accent-cyan",
  epic:      "bg-accent",
  legendary: "bg-amber-400",
};

const RARITY_TAG: Record<Rarity, string> = {
  common:    "text-ink-faint",
  rare:      "text-accent-cyan",
  epic:      "text-accent",
  legendary: "text-amber-400",
};

const RARITY_ICON_BG: Record<Rarity, string> = {
  common:    "border-line/40 bg-ink-faint/[0.06]",
  rare:      "border-accent-cyan/30 bg-accent-cyan/10",
  epic:      "border-accent/30 bg-accent/10",
  legendary: "border-amber-400/30 bg-amber-400/10",
};

// ── AchievementBadge ────────────────────────────────────────
function AchievementBadge({
  id,
  name,
  rarity,
  unlocked,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string;
  name: string;
  rarity: Rarity;
  unlocked: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      data-achievement
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={`${unlocked ? "" : "[Bloqueado] "}${name} — ${RARITY_LABEL[rarity]}`}
      className={[
        "flex w-16 shrink-0 select-none flex-col items-center rounded-xl border",
        "px-2 py-3 transition-all duration-200",
        unlocked
          ? [
              "is-unlocked cursor-default",
              RARITY_UNLOCKED[rarity],
              RARITY_GLOW[rarity],
              RARITY_HOVER_GLOW[rarity],
              "hover:scale-110 hover:-translate-y-1",
            ].join(" ")
          : "is-locked cursor-not-allowed border-line/30 bg-bg-soft opacity-25 grayscale",
      ].join(" ")}
    >
      {/* Icon area with depth */}
      <div
        className={[
          "flex h-9 w-9 items-center justify-center rounded-lg border",
          unlocked
            ? RARITY_ICON_BG[rarity]
            : "border-line/20 bg-bg/40",
        ].join(" ")}
      >
        <div className="h-5 w-5">{ICONS[id]}</div>
      </div>

      <span className="mt-1.5 text-center font-mono text-[0.5rem] uppercase leading-tight tracking-wide">
        {name}
      </span>

      {unlocked ? (
        <>
          <span
            className={`mt-1.5 h-px w-5 ${RARITY_DOT[rarity]}`}
            style={{ opacity: 0.6 }}
          />
          <span className={`mt-1 font-mono text-[0.45rem] uppercase tracking-widest ${RARITY_TAG[rarity]}`}>
            {RARITY_LABEL[rarity]}
          </span>
        </>
      ) : (
        <span className="mt-1.5 font-mono text-[0.45rem] uppercase tracking-widest text-ink-faint">
          bloqueado
        </span>
      )}
    </div>
  );
}

// ── CommitTimeline ───────────────────────────────────────────
export function CommitTimeline({
  commits,
  repo,
  live = false,
  technologies = [],
}: {
  commits: Commit[];
  repo: string;
  live?: boolean;
  technologies?: string[];
}) {
  const root      = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Scroll horizontal with mouse wheel — no Shift required
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (!e.deltaY) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const allAchievements = buildAchievements(technologies);
  const evaluated       = allAchievements.map((a) => ({ ...a, unlocked: a.check(commits) }));
  const unlockedCount   = evaluated.filter((a) => a.unlocked).length;
  const hoveredData     = hoveredId ? (evaluated.find((a) => a.id === hoveredId) ?? null) : null;

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;

      const items  = el.querySelectorAll("[data-commit]");
      const allAch = el.querySelectorAll("[data-achievement]");

      gsap.set(items,  { autoAlpha: 0, x: 18 });
      gsap.set(allAch, { autoAlpha: 0, y: 10, scale: 0.82 });

      const run = () => {
        const unlockedEl = el.querySelectorAll("[data-achievement].is-unlocked");
        const lockedEl   = el.querySelectorAll("[data-achievement].is-locked");

        if (unlockedEl.length) {
          gsap.to(unlockedEl, {
            autoAlpha: 1, y: 0, scale: 1,
            duration: 0.8,
            ease: EASE.magnetic,
            stagger: 0.07,
            clearProps: "transform",
          });
        }

        gsap.to(lockedEl, {
          autoAlpha: 1, y: 0, scale: 1,
          duration: 0.45,
          ease: "power2.out",
          stagger: 0.04,
          delay: 0.15,
          clearProps: "transform",
        });

        gsap.to(items, {
          autoAlpha: 1, x: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.05,
          clearProps: "transform",
          delay: 0.45,
        });
      };

      const unsub = onIntroReady(run);
      return () => unsub();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex min-h-full flex-col">
      {/* Fixed header */}
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-xs text-ink-muted">
            <GitHubMark className="h-4 w-4" />
            {repo}
          </span>
          {live ? (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-accent">
              GitHub
            </span>
          ) : (
            <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-ink-faint">
              placeholder
            </span>
          )}
        </div>
        <h2 className="mt-3 text-lg font-semibold text-ink">Commits</h2>
        <p className="text-xs text-ink-faint">
          {live ? "histórico real · GitHub API" : "derivado das semanas"}
        </p>
      </header>

      {/* Scrollable feed */}
      <div className="relative flex-1 px-5 py-6">

        {/* ── Achievements ───────────────────────────────── */}
        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-faint">
              Conquistas
            </p>
            <p className="font-mono text-[0.6rem] text-ink-faint">
              <span className="text-accent">{unlockedCount}</span>
              <span className="mx-0.5">/</span>
              {allAchievements.length}
            </p>
          </div>

          {/* Badge scroll row */}
          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {evaluated.map((a) => (
                <AchievementBadge
                  key={a.id}
                  id={a.id}
                  name={a.name}
                  rarity={a.rarity}
                  unlocked={a.unlocked}
                  onMouseEnter={() => setHoveredId(a.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-bg to-transparent" />
          </div>

          {/* Tooltip panel — fixed height, opacity-only transition (no layout shift) */}
          <div className="mt-3 h-24">
            <div
              className={[
                "h-full overflow-hidden rounded-xl border transition-all duration-150",
                hoveredData
                  ? [
                      "translate-y-0 opacity-100",
                      hoveredData.unlocked
                        ? "border-line/50 bg-bg-card"
                        : "border-line/30 bg-bg-soft",
                    ].join(" ")
                  : "pointer-events-none translate-y-1 border-transparent opacity-0",
              ].join(" ")}
            >
              {hoveredData && (
                <div className="flex h-full items-center gap-3 px-3">
                  {/* Icon */}
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                      hoveredData.unlocked
                        ? RARITY_ICON_BG[hoveredData.rarity]
                        : "border-line/20 bg-bg/40 grayscale opacity-40",
                    ].join(" ")}
                  >
                    <div className={`h-6 w-6 ${hoveredData.unlocked ? RARITY_TAG[hoveredData.rarity] : "text-ink-faint"}`}>
                      {ICONS[hoveredData.id]}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[0.55rem] uppercase tracking-widest ${
                          hoveredData.unlocked
                            ? RARITY_TAG[hoveredData.rarity]
                            : "text-ink-faint"
                        }`}
                      >
                        {RARITY_LABEL[hoveredData.rarity]}
                      </span>
                      <span
                        className={[
                          "rounded-full border px-1.5 py-px font-mono text-[0.5rem] uppercase",
                          hoveredData.unlocked
                            ? "border-accent/30 bg-accent/10 text-accent"
                            : "border-line/50 text-ink-faint",
                        ].join(" ")}
                      >
                        {hoveredData.unlocked ? "desbloqueado" : "bloqueado"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold leading-tight text-ink">
                      {hoveredData.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                      {hoveredData.lore}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mb-6 h-px bg-line" />

        {/* ── Commits ────────────────────────────────────── */}
        {commits.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhum commit registrado ainda.</p>
        ) : (
          <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
            {commits.map((c) => {
              const t = TYPE[c.type];
              return (
                <li key={c.hash} data-commit className="relative pl-7">
                  <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-accent bg-bg" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent-cyan">{c.hash}</span>
                    <span className={`rounded border px-1.5 py-px font-mono text-[0.6rem] ${t.cls}`}>
                      {t.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-snug text-ink">{c.message}</p>
                  <p className="mt-1 font-mono text-[0.65rem] text-ink-faint">
                    semana {c.week} · {formatShort(c.date)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}

        {!live && (
          <div className="mt-8 rounded-xl border border-dashed border-line p-4 text-center">
            <p className="text-xs text-ink-muted">
              Commits gerados a partir das anotações das semanas.
            </p>
          </div>
        )}
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
