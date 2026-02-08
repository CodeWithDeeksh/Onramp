/**
 * Unit tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  GitHubUrlSchema,
  parseGitHubUrl,
  UserProfileSchema,
  ExperienceLevelSchema,
  RepositoryAnalysisSchema,
  ContributionPathSchema,
  GitHubIssueSchema,
  AnalyzeRepositoryRequestSchema,
  CreateUserProfileRequestSchema,
} from './schemas.js';

describe('GitHubUrlSchema', () => {
  it('should validate correct GitHub URLs', () => {
    const validUrls = [
      'https://github.com/facebook/react',
      'https://github.com/microsoft/vscode',
      'http://github.com/nodejs/node',
      'github.com/torvalds/linux',
      'https://github.com/facebook/react.git',
    ];

    validUrls.forEach((url) => {
      expect(() => GitHubUrlSchema.parse(url)).not.toThrow();
    });
  });

  it('should reject invalid GitHub URLs', () => {
    const invalidUrls = [
      'https://gitlab.com/user/repo',
      'https://github.com/user',
      'https://github.com',
      'not-a-url',
      '',
      'https://github.com/user/repo/extra',
    ];

    invalidUrls.forEach((url) => {
      expect(() => GitHubUrlSchema.parse(url)).toThrow();
    });
  });

  it('should parse GitHub URLs correctly', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  it('should parse GitHub URLs without protocol', () => {
    const result = parseGitHubUrl('github.com/microsoft/vscode');
    expect(result).toEqual({ owner: 'microsoft', repo: 'vscode' });
  });

  it('should handle .git suffix', () => {
    const result = parseGitHubUrl('https://github.com/nodejs/node.git');
    expect(result).toEqual({ owner: 'nodejs', repo: 'node' });
  });
});

describe('ExperienceLevelSchema', () => {
  it('should validate valid experience levels', () => {
    expect(() => ExperienceLevelSchema.parse('beginner')).not.toThrow();
    expect(() => ExperienceLevelSchema.parse('intermediate')).not.toThrow();
    expect(() => ExperienceLevelSchema.parse('advanced')).not.toThrow();
  });

  it('should reject invalid experience levels', () => {
    expect(() => ExperienceLevelSchema.parse('expert')).toThrow();
    expect(() => ExperienceLevelSchema.parse('novice')).toThrow();
    expect(() => ExperienceLevelSchema.parse('')).toThrow();
  });
});

describe('UserProfileSchema', () => {
  it('should validate a complete user profile', () => {
    const validProfile = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      languages: ['JavaScript', 'Python'],
      frameworks: ['React', 'Django'],
      experienceLevel: 'intermediate' as const,
      interests: ['web development', 'machine learning'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() => UserProfileSchema.parse(validProfile)).not.toThrow();
  });

  it('should require at least one language', () => {
    const invalidProfile = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      languages: [],
      frameworks: ['React'],
      experienceLevel: 'beginner' as const,
      interests: ['web development'],
    };

    expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
  });

  it('should require at least one interest', () => {
    const invalidProfile = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      languages: ['JavaScript'],
      frameworks: ['React'],
      experienceLevel: 'beginner' as const,
      interests: [],
    };

    expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
  });

  it('should reject invalid UUID', () => {
    const invalidProfile = {
      userId: 'not-a-uuid',
      languages: ['JavaScript'],
      frameworks: ['React'],
      experienceLevel: 'beginner' as const,
      interests: ['web development'],
    };

    expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
  });

  it('should limit languages to 10', () => {
    const invalidProfile = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      languages: Array(11).fill('JavaScript'),
      frameworks: ['React'],
      experienceLevel: 'beginner' as const,
      interests: ['web development'],
    };

    expect(() => UserProfileSchema.parse(invalidProfile)).toThrow();
  });
});

describe('RepositoryAnalysisSchema', () => {
  it('should validate a complete repository analysis', () => {
    const validAnalysis = {
      owner: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
      summary: 'A JavaScript library for building user interfaces',
      architecture: {
        description: 'Component-based architecture with virtual DOM',
        patterns: ['Component-based', 'Declarative'],
        technologies: ['JavaScript', 'JSX'],
        keyComponents: ['React Core', 'React DOM'],
      },
      modules: [
        {
          path: 'packages/react',
          name: 'react',
          purpose: 'Core React library with component APIs',
          keyFiles: ['React.js', 'ReactElement.js'],
          complexity: 'high' as const,
        },
      ],
      entryPoints: [
        {
          file: 'packages/react/index.js',
          reason: 'Main entry point for React library',
          difficulty: 'intermediate' as const,
        },
      ],
      metadata: {
        stars: 200000,
        forks: 40000,
        openIssues: 800,
        language: 'JavaScript',
        languages: { JavaScript: 5000000, TypeScript: 1000000 },
        topics: ['react', 'javascript', 'ui'],
        lastUpdated: new Date(),
        license: 'MIT',
      },
      analyzedAt: new Date(),
    };

    expect(() => RepositoryAnalysisSchema.parse(validAnalysis)).not.toThrow();
  });

  it('should require minimum summary length', () => {
    const invalidAnalysis = {
      owner: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
      summary: 'Too short',
      architecture: {
        description: 'Component-based architecture',
        patterns: [],
        technologies: [],
        keyComponents: [],
      },
      modules: [],
      entryPoints: [],
      metadata: {
        stars: 200000,
        forks: 40000,
        openIssues: 800,
        language: 'JavaScript',
        languages: {},
        topics: [],
        lastUpdated: new Date(),
        license: 'MIT',
      },
    };

    expect(() => RepositoryAnalysisSchema.parse(invalidAnalysis)).toThrow();
  });
});

describe('ContributionPathSchema', () => {
  it('should validate a complete contribution path', () => {
    const validPath = {
      repositoryUrl: 'https://github.com/facebook/react',
      steps: [
        {
          order: 1,
          title: 'Explore the codebase',
          description: 'Start by reading the README and understanding the project structure',
          files: ['README.md', 'CONTRIBUTING.md'],
          concepts: ['React components', 'Virtual DOM'],
          resources: [
            {
              title: 'React Documentation',
              url: 'https://react.dev',
              type: 'documentation' as const,
            },
          ],
        },
      ],
      estimatedTime: '2-3 hours',
      difficulty: 'intermediate' as const,
    };

    expect(() => ContributionPathSchema.parse(validPath)).not.toThrow();
  });

  it('should require at least one step', () => {
    const invalidPath = {
      repositoryUrl: 'https://github.com/facebook/react',
      steps: [],
      estimatedTime: '2-3 hours',
      difficulty: 'intermediate' as const,
    };

    expect(() => ContributionPathSchema.parse(invalidPath)).toThrow();
  });

  it('should limit steps to 10', () => {
    const invalidPath = {
      repositoryUrl: 'https://github.com/facebook/react',
      steps: Array(11)
        .fill(null)
        .map((_, i) => ({
          order: i + 1,
          title: `Step ${i + 1}`,
          description: 'This is a step description that is long enough',
          files: [],
          concepts: [],
          resources: [],
        })),
      estimatedTime: '2-3 hours',
      difficulty: 'intermediate' as const,
    };

    expect(() => ContributionPathSchema.parse(invalidPath)).toThrow();
  });
});

describe('GitHubIssueSchema', () => {
  it('should validate a complete GitHub issue', () => {
    const validIssue = {
      id: 12345,
      number: 100,
      title: 'Fix bug in component rendering',
      body: 'There is a bug when rendering components with null props',
      state: 'open' as const,
      labels: ['bug', 'help wanted'],
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: 5,
      url: 'https://github.com/facebook/react/issues/100',
    };

    expect(() => GitHubIssueSchema.parse(validIssue)).not.toThrow();
  });
});

describe('API Request Schemas', () => {
  it('should validate analyze repository request', () => {
    const validRequest = {
      url: 'https://github.com/facebook/react',
    };

    expect(() => AnalyzeRepositoryRequestSchema.parse(validRequest)).not.toThrow();
  });

  it('should validate create user profile request', () => {
    const validRequest = {
      languages: ['JavaScript', 'Python'],
      frameworks: ['React', 'Django'],
      experienceLevel: 'intermediate' as const,
      interests: ['web development', 'machine learning'],
    };

    expect(() => CreateUserProfileRequestSchema.parse(validRequest)).not.toThrow();
  });

  it('should reject create user profile request without languages', () => {
    const invalidRequest = {
      languages: [],
      frameworks: ['React'],
      experienceLevel: 'intermediate' as const,
      interests: ['web development'],
    };

    expect(() => CreateUserProfileRequestSchema.parse(invalidRequest)).toThrow();
  });
});
