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
/**
 * Fetches branch count, PR count and total commit count for a repo.
 * Uses per_page=1 + Link header trick to count without fetching all items.
 * Returns null on any API failure.
 */
export async function getRepoMeta(githubRepo: string): Promise<RepoMeta | null> {
  const headers = buildHeaders();
  const [owner, repo] = parseRepo(githubRepo);

  try {
    const [branchRes, prRes, commitRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=1`, {
        headers,
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=1`, {
        headers,
        next: { revalidate: 3600 },
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
        headers,
        next: { revalidate: 3600 },
      }),
    ]);

    if (!branchRes.ok) return null;

    const branches =
      lastPageFromLink(branchRes.headers.get("Link")) ||
      ((await branchRes.json()) as unknown[]).length;

    const prs =
      lastPageFromLink(prRes.headers.get("Link")) ||
      (prRes.ok ? ((await prRes.json()) as unknown[]).length : 0);

    const totalCommits =
      lastPageFromLink(commitRes.headers.get("Link")) ||
      (commitRes.ok ? ((await commitRes.json()) as unknown[]).length : 0);

    return { branches, prs, totalCommits };
  } catch {
    return null;
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
