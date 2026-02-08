/**
 * Issue Analyzer Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IssueAnalyzerService } from './issue-analyzer-service.js';
import { IGitHubClient, ILLMClient, IRepositoryService } from '../types/interfaces.js';

describe('IssueAnalyzerService', () => {
  let issueAnalyzerService: IssueAnalyzerService;
  let mockGitHubClient: IGitHubClient;
  let mockLLMClient: ILLMClient;
  let mockRepositoryService: IRepositoryService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock clients
    mockGitHubClient = {
      getRepository: vi.fn(),
      getFileStructure: vi.fn(),
      getReadme: vi.fn(),
      getIssues: vi.fn(),
    };

    mockLLMClient = {
      generateRepositorySummary: vi.fn(),
      generateArchitectureOverview: vi.fn(),
      explainModules: vi.fn(),
      scoreRepositoryMatch: vi.fn(),
      generateContributionPath: vi.fn(),
      classifyIssueDifficulty: vi.fn(),
    };

    mockRepositoryService = {
      analyzeRepository: vi.fn(),
      getRepositoryMetadata: vi.fn(),
      getCachedAnalysis: vi.fn(),
      cacheAnalysis: vi.fn(),
    };

    issueAnalyzerService = new IssueAnalyzerService(
      mockGitHubClient,
      mockLLMClient,
      mockRepositoryService
    );
  });

  describe('fetchAndClassifyIssues', () => {
    it('should fetch and classify issues successfully', async () => {
      const owner = 'facebook';
      const repo = 'react';

      const mockIssues = [
        {
          id: 1,
          number: 100,
          title: 'Fix typo in documentation',
          body: 'There is a typo in the README',
          state: 'open' as const,
          labels: ['documentation', 'good first issue'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          comments: 2,
          url: 'https://github.com/facebook/react/issues/100',
        },
        {
          id: 2,
          number: 101,
          title: 'Implement new feature',
          body: 'Add support for concurrent rendering',
          state: 'open' as const,
          labels: ['enhancement'],
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-04'),
          comments: 10,
          url: 'https://github.com/facebook/react/issues/101',
        },
      ];

      const mockRepository = {
        owner,
        name: repo,
        url: `https://github.com/${owner}/${repo}`,
        summary: 'A JavaScript library for building user interfaces',
        architecture: {
          description: 'Component-based architecture',
          patterns: ['Component-based'],
          technologies: ['JavaScript', 'React'],
          keyComponents: ['React Core'],
        },
        modules: [],
        entryPoints: [],
        metadata: {
          stars: 200000,
          forks: 40000,
          openIssues: 500,
          language: 'JavaScript',
          languages: {},
          topics: ['javascript', 'react'],
          lastUpdated: new Date(),
          license: 'MIT',
        },
        analyzedAt: new Date(),
      };

      const mockDifficulties = [
        {
          level: 'beginner' as const,
          reasoning: 'Simple documentation fix',
          signals: [
            {
              type: 'label' as const,
              value: 'good first issue',
              impact: 'decreases' as const,
            },
          ],
        },
        {
          level: 'advanced' as const,
          reasoning: 'Complex feature requiring deep understanding',
          signals: [
            {
              type: 'scope' as const,
              value: 'core architecture change',
              impact: 'increases' as const,
            },
          ],
        },
      ];

      vi.mocked(mockGitHubClient.getIssues).mockResolvedValue(mockIssues);
      vi.mocked(mockRepositoryService.analyzeRepository).mockResolvedValue(mockRepository);
      vi.mocked(mockLLMClient.classifyIssueDifficulty)
        .mockResolvedValueOnce(mockDifficulties[0])
        .mockResolvedValueOnce(mockDifficulties[1]);

      const result = await issueAnalyzerService.fetchAndClassifyIssues(owner, repo);

      expect(result).toHaveLength(2);
      expect(result[0].issue.title).toBe('Fix typo in documentation');
      expect(result[0].difficulty.level).toBe('beginner');
      expect(result[1].issue.title).toBe('Implement new feature');
      expect(result[1].difficulty.level).toBe('advanced');

      expect(mockGitHubClient.getIssues).toHaveBeenCalledWith(owner, repo, 'open');
      expect(mockRepositoryService.analyzeRepository).toHaveBeenCalledWith(
        `https://github.com/${owner}/${repo}`
      );
      expect(mockLLMClient.classifyIssueDifficulty).toHaveBeenCalledTimes(2);
    });

    it('should handle repository with no issues', async () => {
      const owner = 'test';
      const repo = 'empty-repo';

      const mockRepository = {
        owner,
        name: repo,
        url: `https://github.com/${owner}/${repo}`,
        summary: 'Test repository',
        architecture: {
          description: 'Test',
          patterns: [],
          technologies: [],
          keyComponents: [],
        },
        modules: [],
        entryPoints: [],
        metadata: {
          stars: 10,
          forks: 2,
          openIssues: 0,
          language: 'JavaScript',
          languages: {},
          topics: [],
          lastUpdated: new Date(),
          license: 'MIT',
        },
        analyzedAt: new Date(),
      };

      vi.mocked(mockGitHubClient.getIssues).mockResolvedValue([]);
      vi.mocked(mockRepositoryService.analyzeRepository).mockResolvedValue(mockRepository);

      const result = await issueAnalyzerService.fetchAndClassifyIssues(owner, repo);

      expect(result).toHaveLength(0);
      expect(mockLLMClient.classifyIssueDifficulty).not.toHaveBeenCalled();
    });

    it('should classify all issues even if some fail', async () => {
      const owner = 'test';
      const repo = 'test-repo';

      const mockIssues = [
        {
          id: 1,
          number: 1,
          title: 'Issue 1',
          body: 'Description 1',
          state: 'open' as const,
          labels: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          comments: 0,
          url: 'https://github.com/test/test-repo/issues/1',
        },
      ];

      const mockRepository = {
        owner,
        name: repo,
        url: `https://github.com/${owner}/${repo}`,
        summary: 'Test',
        architecture: {
          description: 'Test',
          patterns: [],
          technologies: [],
          keyComponents: [],
        },
        modules: [],
        entryPoints: [],
        metadata: {
          stars: 10,
          forks: 2,
          openIssues: 1,
          language: 'JavaScript',
          languages: {},
          topics: [],
          lastUpdated: new Date(),
          license: 'MIT',
        },
        analyzedAt: new Date(),
      };

      const mockDifficulty = {
        level: 'intermediate' as const,
        reasoning: 'Moderate complexity',
        signals: [],
      };

      vi.mocked(mockGitHubClient.getIssues).mockResolvedValue(mockIssues);
      vi.mocked(mockRepositoryService.analyzeRepository).mockResolvedValue(mockRepository);
      vi.mocked(mockLLMClient.classifyIssueDifficulty).mockResolvedValue(mockDifficulty);

      const result = await issueAnalyzerService.fetchAndClassifyIssues(owner, repo);

      expect(result).toHaveLength(1);
      expect(result[0].difficulty.level).toBe('intermediate');
    });
  });

  describe('classifyIssue', () => {
    it('should classify a single issue', async () => {
      const issue = {
        id: 1,
        number: 100,
        title: 'Add unit tests',
        body: 'We need more test coverage',
        state: 'open' as const,
        labels: ['testing', 'help wanted'],
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: 5,
        url: 'https://github.com/test/repo/issues/100',
      };

      const repository = {
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
        summary: 'Test repository',
        architecture: {
          description: 'Test architecture',
          patterns: [],
          technologies: ['JavaScript'],
          keyComponents: [],
        },
        modules: [],
        entryPoints: [],
        metadata: {
          stars: 100,
          forks: 20,
          openIssues: 10,
          language: 'JavaScript',
          languages: {},
          topics: [],
          lastUpdated: new Date(),
          license: 'MIT',
        },
        analyzedAt: new Date(),
      };

      const mockDifficulty = {
        level: 'intermediate' as const,
        reasoning: 'Requires understanding of testing frameworks',
        signals: [
          {
            type: 'label' as const,
            value: 'testing',
            impact: 'increases' as const,
          },
        ],
      };

      vi.mocked(mockLLMClient.classifyIssueDifficulty).mockResolvedValue(mockDifficulty);

      const result = await issueAnalyzerService.classifyIssue(issue, repository);

      expect(result.level).toBe('intermediate');
      expect(result.reasoning).toBe('Requires understanding of testing frameworks');
      expect(result.signals).toHaveLength(1);
      expect(mockLLMClient.classifyIssueDifficulty).toHaveBeenCalledWith(issue, repository);
    });
  });

  describe('filterIssuesByDifficulty', () => {
    const mockClassifiedIssues = [
      {
        issue: {
          id: 1,
          number: 1,
          title: 'Beginner issue',
          body: 'Easy fix',
          state: 'open' as const,
          labels: ['good first issue'],
          createdAt: new Date(),
          updatedAt: new Date(),
          comments: 0,
          url: 'https://github.com/test/repo/issues/1',
        },
        difficulty: {
          level: 'beginner' as const,
          reasoning: 'Simple fix',
          signals: [],
        },
      },
      {
        issue: {
          id: 2,
          number: 2,
          title: 'Intermediate issue',
          body: 'Moderate complexity',
          state: 'open' as const,
          labels: ['enhancement'],
          createdAt: new Date(),
          updatedAt: new Date(),
          comments: 5,
          url: 'https://github.com/test/repo/issues/2',
        },
        difficulty: {
          level: 'intermediate' as const,
          reasoning: 'Moderate complexity',
          signals: [],
        },
      },
      {
        issue: {
          id: 3,
          number: 3,
          title: 'Advanced issue',
          body: 'Complex feature',
          state: 'open' as const,
          labels: ['core'],
          createdAt: new Date(),
          updatedAt: new Date(),
          comments: 20,
          url: 'https://github.com/test/repo/issues/3',
        },
        difficulty: {
          level: 'advanced' as const,
          reasoning: 'Complex implementation',
          signals: [],
        },
      },
    ];

    it('should filter beginner issues', () => {
      const result = issueAnalyzerService.filterIssuesByDifficulty(
        mockClassifiedIssues,
        'beginner'
      );

      expect(result).toHaveLength(1);
      expect(result[0].issue.title).toBe('Beginner issue');
      expect(result[0].difficulty.level).toBe('beginner');
    });

    it('should filter intermediate issues', () => {
      const result = issueAnalyzerService.filterIssuesByDifficulty(
        mockClassifiedIssues,
        'intermediate'
      );

      expect(result).toHaveLength(1);
      expect(result[0].issue.title).toBe('Intermediate issue');
      expect(result[0].difficulty.level).toBe('intermediate');
    });

    it('should filter advanced issues', () => {
      const result = issueAnalyzerService.filterIssuesByDifficulty(
        mockClassifiedIssues,
        'advanced'
      );

      expect(result).toHaveLength(1);
      expect(result[0].issue.title).toBe('Advanced issue');
      expect(result[0].difficulty.level).toBe('advanced');
    });

    it('should return empty array when no issues match', () => {
      const beginnerOnly = [mockClassifiedIssues[0]];

      const result = issueAnalyzerService.filterIssuesByDifficulty(beginnerOnly, 'advanced');

      expect(result).toHaveLength(0);
    });

    it('should handle empty input array', () => {
      const result = issueAnalyzerService.filterIssuesByDifficulty([], 'beginner');

      expect(result).toHaveLength(0);
    });
  });
});
