export type ProjectStatus = "in-progress" | "shipped" | "paused";

export interface Decision {
  title: string;
  rationale: string;
}

export interface Challenge {
  title: string;
  howSolved: string;
}

export interface Week {
  slug: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  title: string;
  summary: string;
  projects: string[];
  technologies: string[];
  deliveries: string[];
  decisions: Decision[];
  challenges: Challenge[];
  learning?: string;
  notes?: string;
  placeholder?: boolean;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  role: string;
  startDate: string;
  technologies: string[];
  highlights: string[];
  placeholder?: boolean;
}
