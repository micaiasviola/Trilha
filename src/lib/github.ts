import type { Project } from "./types";

const OWNER = process.env.GITHUB_OWNER ?? "micaiasviola";
const MIN_COMMITS = 10;

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "TrilhadoDesenvolvimento/1.0",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

function lastPageFromLink(link: string | null): number {
  if (!link) return 0;
  const m = link.match(/[?&]page=(\d+)>; rel="last"/);
  return m ? parseInt(m[1], 10) : 0;
}

function formatName(name: string): string {
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface GitHubRepoRaw {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  archived: boolean;
  fork: boolean;
  pushed_at: string;
  created_at: string;
}

function toProject(repo: GitHubRepoRaw): Project {
  const techs = [repo.language, ...(repo.topics ?? [])]
    .filter(Boolean)
    .map((t) => t as string);

  return {
    slug: repo.name.toLowerCase(),
    name: formatName(repo.name),
    tagline: repo.description ?? "Repositório no GitHub.",
    description: repo.description ?? "Projeto descoberto automaticamente via GitHub.",
    status: repo.archived ? "shipped" : "in-progress",
    role: "Dev",
    order: 9999,
    startDate: repo.created_at.substring(0, 10),
    technologies: [...new Set(techs)],
    highlights: [],
    githubRepo: repo.name,
    placeholder: true,
  };
}

async function fetchCommitCount(repoName: string, headers: Record<string, string>): Promise<number> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repoName}/commits?per_page=1`,
      { headers, next: { revalidate: 3600 } },
    );
    if (!res.ok) return 0;
    return (
      lastPageFromLink(res.headers.get("Link")) ||
      ((await res.json()) as unknown[]).length
    );
  } catch {
    return 0;
  }
}

/**
 * Returns all public, non-fork repos from the GitHub account that have
 * >= MIN_COMMITS total commits and are NOT already tracked in the JSON
 * content system (knownSlugs).
 *
 * Called at build time — results are cached for 1h.
 */
export async function getAutoDiscoveredProjects(
  knownSlugs: Set<string>,
): Promise<Project[]> {
  const headers = buildHeaders();

  let repos: GitHubRepoRaw[] = [];
  try {
    const res = await fetch(
      `https://api.github.com/users/${OWNER}/repos?type=owner&per_page=100&sort=pushed`,
      { headers, next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    repos = (await res.json()) as GitHubRepoRaw[];
  } catch {
    return [];
  }

  // Only consider non-fork repos not already in the JSON content system
  const candidates = repos.filter(
    (r) => !r.fork && !knownSlugs.has(r.name.toLowerCase()),
  );
  if (!candidates.length) return [];

  // Count commits in parallel for all candidates
  const counts = await Promise.all(
    candidates.map((r) => fetchCommitCount(r.name, headers)),
  );

  return candidates
    .filter((_, i) => counts[i] >= MIN_COMMITS)
    .map(toProject);
}

/**
 * Fetches a single GitHub repo by name and converts it to a Project.
 * Used as fallback when no JSON file exists for a given slug.
 * Returns null if the repo doesn't exist, is a fork, or has fewer
 * than MIN_COMMITS commits.
 */
export async function getGitHubProjectBySlug(slug: string): Promise<Project | null> {
  const headers = buildHeaders();

  try {
    const [repoRes, commitRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${OWNER}/${slug}`, {
        headers,
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.github.com/repos/${OWNER}/${slug}/commits?per_page=1`, {
        headers,
        next: { revalidate: 3600 },
      }),
    ]);

    if (!repoRes.ok) return null;
    const repo = (await repoRes.json()) as GitHubRepoRaw;
    if (repo.fork) return null;

    const totalCommits =
      lastPageFromLink(commitRes.headers.get("Link")) ||
      (commitRes.ok ? ((await commitRes.json()) as unknown[]).length : 0);

    if (totalCommits < MIN_COMMITS) return null;

    return toProject(repo);
  } catch {
    return null;
  }
}
