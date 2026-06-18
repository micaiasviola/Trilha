import fs from "node:fs";
import path from "node:path";
import type { Project } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJsonDir<T>(dir: string): T[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(full, f), "utf-8")) as T);
}

/** Projetos ordenados por `order` (numérico), com fallback em `startDate`. */
export function getAllProjects(): Project[] {
  return readJsonDir<Project>("projects").sort((a, b) => {
    const oa = a.order ?? Infinity;
    const ob = b.order ?? Infinity;
    if (oa !== ob) return oa - ob;
    return a.startDate.localeCompare(b.startDate);
  });
}

export function getProject(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

export interface SiteStats {
  projects: number;
  deliveries: number;
  technologies: number;
}

export function getSiteStats(): SiteStats {
  const projects = getAllProjects();
  const techSet = new Set<string>();
  let deliveries = 0;
  for (const p of projects) {
    deliveries += p.story?.deliveries.length ?? 0;
    for (const t of p.technologies) techSet.add(t);
  }
  return {
    projects: projects.length,
    deliveries,
    technologies: techSet.size,
  };
}
