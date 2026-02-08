/**
 * Core Domain Models for Onramp
 * These types represent the main data structures used throughout the application
 */

// ============================================================================
// Repository Analysis Models
// ============================================================================

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
  patterns: string[]; // e.g., "MVC", "Microservices", "Layered"
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
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface RepositoryMetadata {
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  languages: Record<string, number>; // language -> bytes
  topics: string[];
  lastUpdated: Date;
  license: string | null;
}

// ============================================================================
// User Profile Models
// ============================================================================

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  userId: string;
  languages: string[]; // e.g., ["JavaScript", "Python"]
  frameworks: string[]; // e.g., ["React", "Django"]
  experienceLevel: ExperienceLevel;
  interests: string[]; // e.g., ["web development", "machine learning"]
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Project Recommendation Models
// ============================================================================

export interface ProjectRecommendation {
  repository: RepositoryAnalysis;
  score: number; // 0-100
  reasoning: string;
  matchedSkills: string[];
  matchedInterests: string[];
}

export interface MatchScore {
  score: number; // 0-100
  reasoning: string;
  languageMatch: number; // 0-100
  frameworkMatch: number; // 0-100
  interestMatch: number; // 0-100
  experienceMatch: number; // 0-100
}

// ============================================================================
// Contribution Path Models
// ============================================================================

export interface ContributionPath {
  repositoryUrl: string;
  steps: ContributionStep[];
  estimatedTime: string; // e.g., "2-3 hours"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
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

// ============================================================================
// Issue Classification Models
// ============================================================================

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
  level: 'beginner' | 'intermediate' | 'advanced';
  reasoning: string;
  signals: ComplexitySignal[];
}

export interface ComplexitySignal {
  type: 'label' | 'description' | 'scope' | 'dependencies';
  value: string;
  impact: 'increases' | 'decreases'; // impact on difficulty
}

// ============================================================================
// File Structure Models
// ============================================================================

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  extension?: string;
}

// ============================================================================
// GitHub API Models
// ============================================================================

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  license: {
    name: string;
  } | null;
}
