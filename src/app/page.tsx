import { getAllProjects } from "@/lib/content";
import { getRepoGraph, type RepoGraph } from "@/lib/commits";
import { ProjectsDepthShowcase } from "@/components/depth/ProjectsDepthShowcase";

export default async function HomePage() {
  const projects = getAllProjects();

  // Real branch/commit topology per project for the vertical git-tree. Capped
  // (~8 API calls/repo) and token-aware; runs at build/SSG (revalidate 1h), so
  // visitors never wait. Silent null on failure → the tree shows an empty state.
  const repoGraphs: (RepoGraph | null)[] = await Promise.all(
    projects.map((p) =>
      p.githubRepo ? getRepoGraph(p.githubRepo) : Promise.resolve(null),
    ),
  );

  return <ProjectsDepthShowcase projects={projects} repoGraphs={repoGraphs} />;
}
