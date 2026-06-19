export type ProjectStatus = "in-progress" | "shipped" | "paused";

export interface Decision {
  title: string;
  rationale: string;
}

export interface Challenge {
  title: string;
  howSolved: string;
}

export interface Milestone {
  date: string;
  title: string;
  note?: string;
}

export interface ProjectStory {
  context: string;
  decisions: Decision[];
  challenges: Challenge[];
  deliveries: string[];
  learning?: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  role: string;
  order?: number;
  startDate: string;
  endDate?: string | null;
  technologies: string[];
  highlights: string[];
  cover?: string;
  accentColor?: string;
  story?: ProjectStory;
  milestones?: Milestone[];
  githubRepo?: string;
  /** Caminho em /public do pôster SVG de fundo da atração (ex.: "/trilha-bg.svg"). Vazio/ausente = canvas generativo padrão. */
  posterBg?: string;
  placeholder?: boolean;
}
