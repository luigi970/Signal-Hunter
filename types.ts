
export enum Category {
  GOLD_MINE = 'GOLD_MINE',
  NICHE_GEM = 'NICHE_GEM',
  NOISE = 'NOISE'
}

export interface SolutionIdea {
  title: string;
  pitch: string;
  type: 'SaaS' | 'Service';
}

export interface Problem {
  id: string;
  title: string;
  pain_score: number;
  frequency_score: number;
  evidence: string;
  solution_idea: SolutionIdea;
  category: Category;
}

export interface SearchResult {
  id: string;
  query: string;
  problems: Problem[];
  timestamp: string;
  groundingSources: Array<{ uri: string; title: string }>;
}

export interface PipelineStatus {
  stage: 'idle' | 'expanding' | 'hunting' | 'synthesizing' | 'completed' | 'error';
  message: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  credits_used: number;
  is_pro: boolean;
}
