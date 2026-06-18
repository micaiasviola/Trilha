export type CommitType = "feat" | "fix" | "refactor";

export interface Commit {
  hash: string;
  type: CommitType;
  message: string;
  date: string; // ISO (YYYY-MM-DD)
  week: number;
}

export interface RepoMeta {
  branches: number;
  prs: number;
  totalCommits: number;
}

const DEFAULT_OWNER = "micaiasviola";
const MAX_COMMITS = 60;
export const MIN_COMMITS = 10;

// ── Branch tier (generative graph) ───────────────────────────
/**
 * Maps a repo's total commit count (summed across branches, see getRepoMeta) to
 * how many FEATURE branches the generative git graph draws — the "level" of the
 * repo. The main line is always present and is NOT counted here.
 *
 * Calibrated for the summed-commit scale so the real projects spread across the
 * whole range instead of all hitting the ceiling:
 *   total < 1     → 0  (no data / empty repo: just the main line)
 *   total ≥ 1     → 1
 *   total ≥ 50    → 2
 *   total ≥ 150   → 3
 *   total ≥ 500   → 4
 *   total ≥ 1500  → 5
 *
 * Single source of truth shared by GitGraph (diagonal) and GitGraphBanner
 * (horizontal). Tweak these cutoffs here to retune every graph at once.
 */
export function featureBranchCount(total: number): number {
  if (total >= 1500) return 5;
  if (total >= 500) return 4;
  if (total >= 150) return 3;
  if (total >= 50) return 2;
  if (total >= 1) return 1;
  return 0;
}

// ── Shared helpers ───────────────────────────────────────────
function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "TrilhadoDesenvolvimento/1.0",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

function parseRepo(githubRepo: string): [string, string] {
  return githubRepo.includes("/")
    ? (githubRepo.split("/", 2) as [string, string])
    : [DEFAULT_OWNER, githubRepo];
}

/**
 * Parse the last page number from a GitHub `Link` response header.
 * Gives the total item count when combined with per_page=1.
 */
function lastPageFromLink(link: string | null): number {
  if (!link) return 0;
  const m = link.match(/[?&]page=(\d+)>; rel="last"/);
  return m ? parseInt(m[1], 10) : 0;
}

function inferType(firstLine: string): CommitType | null {
  if (/^chore[:(]/i.test(firstLine)) return null;
  if (/agent-log|append automated|\[skip ci\]|^Merge (branch|pull|remote)/i.test(firstLine))
    return null;
  if (/^fix[:(]/i.test(firstLine)) return "fix";
  if (/^refactor[:(]/i.test(firstLine)) return "refactor";
  return "feat";
}

function cleanMessage(raw: string): string {
  return raw
    .replace(/^(feat|fix|refactor|chore|docs|test|build|ci|perf|style)(\([^)]+\))?!?:\s*/i, "")
    .trim();
}

function weekNum(commitDate: string, startDate: string): number {
  const diffMs = new Date(commitDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
}

// ── getRepoMeta ──────────────────────────────────────────────
const BRANCH_SUM_CAP = 25; // safety cap on how many branches we sum commits over

/** Commit count reachable from a branch ref. 0 on failure. */
async function countCommitsOnBranch(
  owner: string,
  repo: string,
  branch: string,
  headers: Record<string, string>,
): Promise<number> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(
        branch,
      )}&per_page=1`,
      { headers, next: { revalidate: 3600 } },
    );
    if (!res.ok) return 0;
    return lastPageFromLink(res.headers.get("Link")) || ((await res.json()) as unknown[]).length;
  } catch {
    return 0;
  }
}

/**
 * Fetches branch count, PR count and total commit count for a repo.
 *
 * `totalCommits` is the SUM of every branch's commit count (capped at
 * BRANCH_SUM_CAP), not just the default branch. This deliberately counts
 * history shared between branches multiple times — the metric reflects total
 * work across the whole repo, so it grows with branching activity and feeds
 * every indicator (graph tiers via featureBranchCount, captions, project
 * detail). Per-branch counts use the per_page=1 + Link-header trick.
 * Returns null on any API failure.
 */
export async function getRepoMeta(githubRepo: string): Promise<RepoMeta | null> {
  const headers = buildHeaders();
  const [owner, repo] = parseRepo(githubRepo);

  try {
    const [branchRes, prRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, {
        headers,
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=1`, {
        headers,
        next: { revalidate: 3600 },
      }),
    ]);

    if (!branchRes.ok) return null;

    const branchNames = ((await branchRes.json()) as Array<{ name: string }>).map((b) => b.name);
    const branches = branchNames.length;

    const prs =
      lastPageFromLink(prRes.headers.get("Link")) ||
      (prRes.ok ? ((await prRes.json()) as unknown[]).length : 0);

    // Sum commits across ALL branches (shared history counted once per branch).
    const perBranch = await Promise.all(
      branchNames.slice(0, BRANCH_SUM_CAP).map((name) =>
        countCommitsOnBranch(owner, repo, name, headers),
      ),
    );
    const totalCommits = perBranch.reduce((sum, n) => sum + n, 0);

    return { branches, prs, totalCommits };
  } catch {
    return null;
  }
}

// ── getRepoBranches ──────────────────────────────────────────
/**
 * Fetches up to `cap` real branch names for a repo. Token-aware via
 * buildHeaders() (uses GITHUB_TOKEN when set). Returns [] on failure.
 * The repo's default branch (main/master) is hoisted to the front when
 * present so the graph can treat the rest as feature offshoots.
 */
export async function getRepoBranches(githubRepo: string, cap = 12): Promise<string[]> {
  const headers = buildHeaders();
  const [owner, repo] = parseRepo(githubRepo);

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=${cap}`,
      { headers, next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ name: string }>;
    const names = data.map((b) => b.name);
    const defIdx = names.findIndex((n) => n === "main" || n === "master");
    if (defIdx > 0) names.unshift(names.splice(defIdx, 1)[0]);
    return names;
  } catch {
    return [];
  }
}

// ── getProjectCommits ────────────────────────────────────────
/**
 * Fetches all commits (up to MAX_COMMITS) for a repo, filtered to
 * feat / fix / refactor types. No date filter — the criterion for
 * whether a repo is worth showing is MIN_COMMITS total commits
 * (checked via getRepoMeta before calling this).
 */
export async function getProjectCommits(
  githubRepo: string,
  startDate: string,
): Promise<Commit[]> {
  const headers = buildHeaders();
  const [owner, repo] = parseRepo(githubRepo);
  const commits: Commit[] = [];
  let page = 1;

  while (commits.length < MAX_COMMITS) {
    let res: Response;
    try {
      res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100&page=${page}`,
        { headers, next: { revalidate: 3600 } },
      );
    } catch {
      break;
    }

    if (!res.ok) {
      console.error(`[commits] ${owner}/${repo} → HTTP ${res.status}`);
      break;
    }

    const data = (await res.json()) as Array<{
      sha: string;
      commit: { message: string; author: { date: string } };
    }>;
    if (!data.length) break;

    for (const item of data) {
      const firstLine = item.commit.message.split("\n")[0].trim();
      const type = inferType(firstLine);
      if (!type) continue;

      commits.push({
        hash: item.sha.slice(0, 7),
        type,
        message: cleanMessage(firstLine),
        date: item.commit.author.date.substring(0, 10),
        week: weekNum(item.commit.author.date.substring(0, 10), startDate),
      });

      if (commits.length >= MAX_COMMITS) break;
    }

    if (data.length < 100) break;
    page++;
  }

  return commits;
}
