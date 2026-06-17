import fs from "node:fs";
import path from "node:path";
import type { Project, Week } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJsonDir<T>(dir: string): T[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(full, f), "utf-8")) as T);
}

/** Semanas ordenadas da mais recente para a mais antiga. */
export function getAllWeeks(): Week[] {
  return readJsonDir<Week>("weeks").sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );
}

export function getWeek(slug: string): Week | undefined {
  return getAllWeeks().find((w) => w.slug === slug);
}

export function getAllProjects(): Project[] {
  return readJsonDir<Project>("projects").sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getProject(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

export function getWeeksForProject(slug: string): Week[] {
  return getAllWeeks().filter((w) => w.projects.includes(slug));
}

/** Todas as tecnologias citadas em semanas, com contagem, da mais usada à menos. */
export function getTechnologyCounts(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const week of getAllWeeks()) {
    for (const tech of week.technologies) {
      counts.set(tech, (counts.get(tech) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export interface SiteStats {
  weeks: number;
  projects: number;
  deliveries: number;
  technologies: number;
}

export function getSiteStats(): SiteStats {
  const weeks = getAllWeeks();
  return {
    weeks: weeks.length,
    projects: getAllProjects().length,
    deliveries: weeks.reduce((sum, w) => sum + w.deliveries.length, 0),
    technologies: getTechnologyCounts().length,
  };
}
