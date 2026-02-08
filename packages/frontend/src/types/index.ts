// Core domain types matching backend models

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface RepositoryAnalysis {
  owner: string;
  name: string;
  url: string;
  summary: string;
  architecture: ArchitectureOverview;
  modules: ModuleExplanation[];
  entryPoints: EntryPoint[];
  metadata: RepositoryMetadata;
  analyzedAt: Date;
}

export interface ArchitectureOverview {
  description: string;
  patterns: string[];
  technologies: string[];
  keyComponents: string[];
}

export interface ModuleExplanation {
  path: string;
  name: string;
  purpose: string;
  keyFiles: string[];
  complexity: 'low' | 'medium' | 'high';
}

export interface EntryPoint {
  file: string;
  reason: string;
  difficulty: Difficulty;
}

export interface RepositoryMetadata {
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  languages: Record<string, number>;
  topics: string[];
  lastUpdated: Date;
  license: string | null;
}

export interface UserProfile {
  userId: string;
  languages: string[];
  frameworks: string[];
  experienceLevel: ExperienceLevel;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectRecommendation {
  repository: RepositoryAnalysis;
  score: number;
  reasoning: string;
  matchedSkills: string[];
  matchedInterests: string[];
}

export interface ContributionPath {
  repositoryUrl: string;
  steps: ContributionStep[];
  estimatedTime: string;
  difficulty: Difficulty;
}

export interface ContributionStep {
  order: number;
  title: string;
  description: string;
  files: string[];
  concepts: string[];
  resources: Resource[];
}

export interface Resource {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'example';
}

export interface ClassifiedIssue {
  issue: GitHubIssue;
  difficulty: IssueDifficulty;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  comments: number;
  url: string;
}

export interface IssueDifficulty {
  level: Difficulty;
  reasoning: string;
  signals: ComplexitySignal[];
}

export interface ComplexitySignal {
  type: 'label' | 'description' | 'scope' | 'dependencies';
  value: string;
  impact: 'increases' | 'decreases';
}

// API Request/Response types

export interface AnalyzeRepositoryRequest {
  url: string;
}

export interface CreateProfileResponse {
  id: string;
  profile: UserProfile;
}

export interface RecommendationRequest {
  userId: string;
  limit?: number;
}

export interface GuidanceRequest {
  userId: string;
  repositoryUrl: string;
}

// Error types

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}
