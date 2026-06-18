import { getAllProjects } from "@/lib/content";
import {
  getProjectCommits,
  getRepoMeta,
  getRepoBranches,
  MIN_COMMITS,
} from "@/lib/commits";
import {
  ProjectsDepthShowcase,
  type ProjectGraphData,
} from "@/components/depth/ProjectsDepthShowcase";

const EMPTY: ProjectGraphData = { total: 0, branches: 0, branchNames: [], commits: [] };

export default async function HomePage() {
  const projects = getAllProjects();

  // Build the git-tree data per project — real commits + branches via the
  // GitHub API (token-aware, cached 1h). Degrades to an empty node on failure.
  const graph: ProjectGraphData[] = await Promise.all(
    projects.map(async (p): Promise<ProjectGraphData> => {
      if (!p.githubRepo) return EMPTY;
      try {
        const [commits, meta, branchNames] = await Promise.all([
          getProjectCommits(p.githubRepo, p.startDate),
          getRepoMeta(p.githubRepo),
          getRepoBranches(p.githubRepo),
        ]);
        const active = meta ? meta.totalCommits >= MIN_COMMITS : false;
        if (!active) return { ...EMPTY, branches: meta?.branches ?? 0, branchNames };
        return {
          total: meta?.totalCommits ?? commits.length,
          branches: meta?.branches ?? branchNames.length,
          branchNames,
          // newest 5, oldest→newest so the latest commit lands nearest the node
          commits: commits
            .slice(0, 5)
            .reverse()
            .map((c) => ({ type: c.type, message: c.message, date: c.date })),
        };
      } catch {
        return EMPTY;
      }
    }),
  );

  return <ProjectsDepthShowcase projects={projects} graph={graph} />;
}
