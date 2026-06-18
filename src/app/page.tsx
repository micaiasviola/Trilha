import { getAllProjects } from "@/lib/content";
import { ProjectsDepthShowcase } from "@/components/depth/ProjectsDepthShowcase";

export default function HomePage() {
  const projects = getAllProjects();
  return <ProjectsDepthShowcase projects={projects} />;
}
