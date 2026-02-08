/**
 * Service Interfaces for Onramp
 * Defines contracts for all service implementations
 */

import {
  RepositoryAnalysis,
  RepositoryMetadata,
  UserProfile,
  ProjectRecommendation,
  ContributionPath,
  ClassifiedIssue,
  GitHubIssue,
  IssueDifficulty,
  FileNode,
  GitHubRepository,
  ModuleExplanation,
  MatchScore,
  ExperienceLevel,
} from './models.js';

// ============================================================================
// Repository Service Interface
// ============================================================================

export interface IRepositoryService {
  analyzeRepository(url: string): Promise<RepositoryAnalysis>;
  getRepositoryMetadata(owner: string, repo: string): Promise<RepositoryMetadata>;
  getCachedAnalysis(owner: string, repo: string): Promise<RepositoryAnalysis | null>;
  cacheAnalysis(owner: string, repo: string, analysis: RepositoryAnalysis): Promise<void>;
}

// ============================================================================
// Matchmaking Service Interface
// ============================================================================

export interface IMatchmakingService {
  generateRecommendations(userId: string, limit: number): Promise<ProjectRecommendation[]>;
  scoreRepository(profile: UserProfile, repository: RepositoryAnalysis): Promise<number>;
  saveUserProfile(userId: string, profile: UserProfile): Promise<void>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
}

// ============================================================================
// Guidance Service Interface
// ============================================================================

export interface IGuidanceService {
  generateContributionPath(userId: string, repositoryUrl: string): Promise<ContributionPath>;
  identifyEntryPoints(
    repository: RepositoryAnalysis,
    userLevel: ExperienceLevel
  ): Promise<string[]>;
}

// ============================================================================
// Issue Analyzer Service Interface
// ============================================================================

export interface IIssueAnalyzerService {
  fetchAndClassifyIssues(owner: string, repo: string): Promise<ClassifiedIssue[]>;
  classifyIssue(
    issue: GitHubIssue,
    repositoryContext: RepositoryAnalysis
  ): Promise<IssueDifficulty>;
  filterIssuesByDifficulty(
    issues: ClassifiedIssue[],
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): ClassifiedIssue[];
}

// ============================================================================
// GitHub Client Interface
// ============================================================================

export interface IGitHubClient {
  getRepository(owner: string, repo: string): Promise<GitHubRepository>;
  getFileStructure(owner: string, repo: string): Promise<FileNode[]>;
  getReadme(owner: string, repo: string): Promise<string>;
  getIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all'
  ): Promise<GitHubIssue[]>;
}

// ============================================================================
// LLM Client Interface
// ============================================================================

export interface ILLMClient {
  generateRepositorySummary(readme: string, structure: FileNode[]): Promise<string>;
  generateArchitectureOverview(structure: FileNode[], readme: string): Promise<string>;
  explainModules(structure: FileNode[], readme: string): Promise<ModuleExplanation[]>;
  scoreRepositoryMatch(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): Promise<MatchScore>;
  generateContributionPath(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): Promise<ContributionPath>;
  classifyIssueDifficulty(
    issue: GitHubIssue,
    repositoryContext: RepositoryAnalysis
  ): Promise<IssueDifficulty>;
}

// ============================================================================
// Cache Store Interface
// ============================================================================

export interface ICacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}
