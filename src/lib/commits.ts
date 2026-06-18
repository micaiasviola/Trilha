export type CommitType = "feat" | "fix" | "refactor";

export interface Commit {
  hash: string;
  type: CommitType;
  message: string;
  date: string; // ISO (YYYY-MM-DD)
  week: number;
}

const OWNER = "micaiasviola";
const MAX_COMMITS = 60;

function inferType(firstLine: string): CommitType | null {
  if (/^chore[:(]/i.test(firstLine)) return null;
  if (/agent-log|append automated|\[skip ci\]|^Merge (branch|pull|remote)/i.test(firstLine)) return null;
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

export async function getProjectCommits(
  githubRepo: string,
  startDate: string,
): Promise<Commit[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "TrilhadoDesenvolvimento/1.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const commits: Commit[] = [];
  let page = 1;

  while (commits.length < MAX_COMMITS) {
    let res: Response;
    try {
      res = await fetch(
        `https://api.github.com/repos/${OWNER}/${githubRepo}/commits?per_page=100&page=${page}`,
        { headers, next: { revalidate: 3600 } },
      );
    } catch {
      break;
    }

    if (!res.ok) break;

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
