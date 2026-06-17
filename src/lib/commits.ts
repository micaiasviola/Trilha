import { getWeeksForProject } from "./content";

export type CommitType = "feat" | "fix" | "refactor";

export interface Commit {
  hash: string;
  type: CommitType;
  message: string;
  date: string; // ISO (YYYY-MM-DD)
  week: number;
}

/** Hash curto determinístico (djb2) — SSR-safe, sem Math.random. */
function shortHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

/**
 * PLACEHOLDER até a integração com o GitHub.
 * Sintetiza "commits" a partir das entregas/desafios/decisões das semanas do
 * projeto, para já dar vida à linha do tempo da direita. Determinístico.
 *
 * Quando a integração existir, basta trocar a fonte por chamadas à API do
 * GitHub mantendo o mesmo formato `Commit`.
 */
export function getProjectCommits(slug: string): Commit[] {
  const weeks = getWeeksForProject(slug);
  const commits: Commit[] = [];

  for (const w of weeks) {
    for (const d of w.deliveries) {
      commits.push({
        hash: shortHash(w.slug + d),
        type: "feat",
        message: d,
        date: w.endDate,
        week: w.weekNumber,
      });
    }
    for (const c of w.challenges) {
      commits.push({
        hash: shortHash(w.slug + c.title),
        type: "fix",
        message: c.title,
        date: w.endDate,
        week: w.weekNumber,
      });
    }
    for (const dec of w.decisions) {
      commits.push({
        hash: shortHash(w.slug + dec.title),
        type: "refactor",
        message: dec.title,
        date: w.endDate,
        week: w.weekNumber,
      });
    }
  }

  return commits.sort(
    (a, b) => b.date.localeCompare(a.date) || a.hash.localeCompare(b.hash),
  );
}
