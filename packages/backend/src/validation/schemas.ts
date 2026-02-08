/**
 * Zod Validation Schemas for Onramp
 * Provides runtime validation for all data models
 */

import { z } from 'zod';

// ============================================================================
// GitHub Repository URL Validation
// ============================================================================

/**
 * Validates GitHub repository URLs
 * Accepts formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - github.com/owner/repo
 */
export const GitHubUrlSchema = z
  .string()
  .trim()
  .refine(
    (url) => {
      const githubUrlPattern =
        /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/;
      return githubUrlPattern.test(url);
    },
    {
      message:
        'Invalid GitHub repository URL. Expected format: https://github.com/owner/repo',
    }
  );

/**
 * Extracts owner and repo from a GitHub URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const normalized = url.trim().replace(/\.git$/, '');
  const match = normalized.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/
  );

  if (!match) {
    throw new Error('Invalid GitHub URL format');
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}

// ============================================================================
// Experience Level
// ============================================================================

export const ExperienceLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

// ============================================================================
// User Profile Validation
// ============================================================================

export const UserProfileSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  languages: z
    .array(z.string().min(1, 'Language name cannot be empty'))
    .min(1, 'At least one language is required')
    .max(10, 'Maximum 10 languages allowed'),
  frameworks: z
    .array(z.string().min(1, 'Framework name cannot be empty'))
    .max(10, 'Maximum 10 frameworks allowed')
    .default([]),
  experienceLevel: ExperienceLevelSchema,
  interests: z
    .array(z.string().min(1, 'Interest cannot be empty'))
    .min(1, 'At least one interest is required')
    .max(10, 'Maximum 10 interests allowed'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type UserProfileInput = z.infer<typeof UserProfileSchema>;

// ============================================================================
// Repository Analysis Validation
// ============================================================================

export const ArchitectureOverviewSchema = z.object({
  description: z.string().min(10, 'Architecture description must be at least 10 characters'),
  patterns: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  keyComponents: z.array(z.string()).default([]),
});

export const ModuleExplanationSchema = z.object({
  path: z.string().min(1, 'Module path is required'),
  name: z.string().min(1, 'Module name is required'),
  purpose: z.string().min(10, 'Module purpose must be at least 10 characters'),
  keyFiles: z.array(z.string()).default([]),
  complexity: z.enum(['low', 'medium', 'high']),
});

export const EntryPointSchema = z.object({
  file: z.string().min(1, 'Entry point file is required'),
  reason: z.string().min(10, 'Entry point reason must be at least 10 characters'),
  difficulty: ExperienceLevelSchema,
});

export const RepositoryMetadataSchema = z.object({
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  openIssues: z.number().int().nonnegative(),
  language: z.string(),
  languages: z.record(z.string(), z.number().nonnegative()),
  topics: z.array(z.string()).default([]),
  lastUpdated: z.date(),
  license: z.string().nullable(),
});

export const RepositoryAnalysisSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  name: z.string().min(1, 'Repository name is required'),
  url: GitHubUrlSchema,
  summary: z.string().min(20, 'Repository summary must be at least 20 characters'),
  architecture: ArchitectureOverviewSchema,
  modules: z.array(ModuleExplanationSchema).default([]),
  entryPoints: z.array(EntryPointSchema).default([]),
  metadata: RepositoryMetadataSchema,
  analyzedAt: z.date().default(() => new Date()),
});

export type RepositoryAnalysisInput = z.infer<typeof RepositoryAnalysisSchema>;

// ============================================================================
// File Structure Validation
// ============================================================================

export const FileNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    path: z.string().min(1, 'File path is required'),
    name: z.string().min(1, 'File name is required'),
    type: z.enum(['file', 'directory']),
    children: z.array(FileNodeSchema).optional(),
    size: z.number().int().nonnegative().optional(),
    extension: z.string().optional(),
  })
);

// ============================================================================
// Contribution Path Validation
// ============================================================================

export const ResourceSchema = z.object({
  title: z.string().min(1, 'Resource title is required'),
  url: z.string().url('Resource URL must be valid'),
  type: z.enum(['documentation', 'tutorial', 'example']),
});

export const ContributionStepSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(5, 'Step title must be at least 5 characters'),
  description: z.string().min(20, 'Step description must be at least 20 characters'),
  files: z.array(z.string()).default([]),
  concepts: z.array(z.string()).default([]),
  resources: z.array(ResourceSchema).default([]),
});

export const ContributionPathSchema = z.object({
  repositoryUrl: GitHubUrlSchema,
  steps: z
    .array(ContributionStepSchema)
    .min(1, 'At least one step is required')
    .max(10, 'Maximum 10 steps allowed'),
  estimatedTime: z.string().min(1, 'Estimated time is required'),
  difficulty: ExperienceLevelSchema,
});

export type ContributionPathInput = z.infer<typeof ContributionPathSchema>;

// ============================================================================
// Issue Classification Validation
// ============================================================================

export const ComplexitySignalSchema = z.object({
  type: z.enum(['label', 'description', 'scope', 'dependencies']),
  value: z.string().min(1, 'Signal value is required'),
  impact: z.enum(['increases', 'decreases']),
});

export const IssueDifficultySchema = z.object({
  level: ExperienceLevelSchema,
  reasoning: z.string().min(20, 'Difficulty reasoning must be at least 20 characters'),
  signals: z.array(ComplexitySignalSchema).default([]),
});

export const GitHubIssueSchema = z.object({
  id: z.number().int().positive(),
  number: z.number().int().positive(),
  title: z.string().min(1, 'Issue title is required'),
  body: z.string(),
  state: z.enum(['open', 'closed']),
  labels: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  comments: z.number().int().nonnegative(),
  url: z.string().url('Issue URL must be valid'),
});

export const ClassifiedIssueSchema = z.object({
  issue: GitHubIssueSchema,
  difficulty: IssueDifficultySchema,
});

// ============================================================================
// Project Recommendation Validation
// ============================================================================

export const MatchScoreSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string().min(20, 'Match reasoning must be at least 20 characters'),
  languageMatch: z.number().min(0).max(100),
  frameworkMatch: z.number().min(0).max(100),
  interestMatch: z.number().min(0).max(100),
  experienceMatch: z.number().min(0).max(100),
});

export const ProjectRecommendationSchema = z.object({
  repository: RepositoryAnalysisSchema,
  score: z.number().min(0).max(100),
  reasoning: z.string().min(20, 'Recommendation reasoning must be at least 20 characters'),
  matchedSkills: z.array(z.string()).default([]),
  matchedInterests: z.array(z.string()).default([]),
});

// ============================================================================
// API Request Validation
// ============================================================================

export const AnalyzeRepositoryRequestSchema = z.object({
  url: GitHubUrlSchema,
});

export const CreateUserProfileRequestSchema = z.object({
  languages: z
    .array(z.string().min(1))
    .min(1, 'At least one language is required')
    .max(10, 'Maximum 10 languages allowed'),
  frameworks: z.array(z.string().min(1)).max(10, 'Maximum 10 frameworks allowed').default([]),
  experienceLevel: ExperienceLevelSchema,
  interests: z
    .array(z.string().min(1))
    .min(1, 'At least one interest is required')
    .max(10, 'Maximum 10 interests allowed'),
});

export const GenerateRecommendationsRequestSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  limit: z.number().int().positive().max(50).default(10),
});

export const GenerateGuidanceRequestSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  repositoryUrl: GitHubUrlSchema,
});

export const GetIssuesRequestSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  difficulty: ExperienceLevelSchema.optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates data against a schema and returns typed result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validates data and returns success/error result
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
