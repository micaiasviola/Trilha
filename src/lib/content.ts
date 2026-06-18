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

function sortProjects(projects: Project[]): Project[] {
  return projects.sort((a, b) => {
    const oa = a.order ?? Infinity;
    const ob = b.order ?? Infinity;
    if (oa !== ob) return oa - ob;
    return a.startDate.localeCompare(b.startDate);
  });
}

/** Projects from JSON files only, ordered by `order` then `startDate`. */
export function getAllProjects(): Project[] {
  return sortProjects(readJsonDir<Project>("projects"));
}

export function getProject(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

/**
 * Returns all projects: JSON-curated first, then auto-discovered GitHub
 * repos (with 10+ commits, not already in JSON).
 *
 * Silently falls back to JSON-only if the GitHub API is unavailable.
 */
export async function getAllProjectsWithGitHub(): Promise<Project[]> {
  const json = getAllProjects();
  const knownSlugs = new Set(json.map((p) => p.slug));

  try {
    const { getAutoDiscoveredProjects } = await import("./github");
    const github = await getAutoDiscoveredProjects(knownSlugs);
    return sortProjects([...json, ...github]);
  } catch {
    return json;
  }
}

/**
 * Finds a project by slug, falling back to GitHub if no JSON exists.
 */
export async function getProjectFull(slug: string): Promise<Project | undefined> {
  const json = getProject(slug);
  if (json) return json;

  try {
    const { getGitHubProjectBySlug } = await import("./github");
    return (await getGitHubProjectBySlug(slug)) ?? undefined;
  } catch {
    return undefined;
  }
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
