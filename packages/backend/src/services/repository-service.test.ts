/**
 * Repository Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RepositoryService } from './repository-service.js';
import {
  IGitHubClient,
  ILLMClient,
  ICacheStore,
} from '../types/interfaces.js';
import { ErrorCode } from '../types/errors.js';

describe('RepositoryService', () => {
  let repositoryService: RepositoryService;
  let mockGitHubClient: IGitHubClient;
  let mockLLMClient: ILLMClient;
  let mockCacheStore: ICacheStore;

  beforeEach(() => {
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

    mockCacheStore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    };

    repositoryService = new RepositoryService(
      mockGitHubClient,
      mockLLMClient,
      mockCacheStore
    );
  });

  describe('analyzeRepository', () => {
    it('should analyze a repository successfully', async () => {
      const url = 'https://github.com/facebook/react';
      const mockRepo = {
        id: 1,
        name: 'react',
        full_name: 'facebook/react',
        owner: { login: 'facebook' },
        html_url: url,
        description: 'A JavaScript library for building user interfaces',
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 500,
        language: 'JavaScript',
        topics: ['javascript', 'react', 'frontend'],
        updated_at: '2024-01-15T10:00:00Z',
        license: { name: 'MIT' },
      };

      const mockFileStructure = [
        {
          path: 'README.md',
          name: 'README.md',
          type: 'file' as const,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory' as const,
          children: [
            {
              path: 'src/index.js',
              name: 'index.js',
              type: 'file' as const,
            },
          ],
        },
      ];

      const mockReadme = '# React\n\nA JavaScript library for building user interfaces';
      const mockSummary = 'React is a JavaScript library for building user interfaces';
      const mockArchitecture = JSON.stringify({
        description: 'Component-based architecture',
        patterns: ['Component-based'],
        technologies: ['JavaScript', 'JSX'],
        keyComponents: ['React Core', 'React DOM'],
      });
      const mockModules = [
        {
          path: 'src',
          name: 'src',
          purpose: 'Core source code',
          keyFiles: ['src/index.js'],
          complexity: 'medium' as const,
        },
      ];

      vi.mocked(mockCacheStore.get).mockResolvedValue(null);
      vi.mocked(mockGitHubClient.getRepository).mockResolvedValue(mockRepo);
      vi.mocked(mockGitHubClient.getFileStructure).mockResolvedValue(mockFileStructure);
      vi.mocked(mockGitHubClient.getReadme).mockResolvedValue(mockReadme);
      vi.mocked(mockLLMClient.generateRepositorySummary).mockResolvedValue(mockSummary);
      vi.mocked(mockLLMClient.generateArchitectureOverview).mockResolvedValue(
        mockArchitecture
      );
      vi.mocked(mockLLMClient.explainModules).mockResolvedValue(mockModules);

      const result = await repositoryService.analyzeRepository(url);

      expect(result).toBeDefined();
      expect(result.owner).toBe('facebook');
      expect(result.name).toBe('react');
      expect(result.url).toBe(url);
      expect(result.summary).toBe(mockSummary);
      expect(result.architecture).toEqual(JSON.parse(mockArchitecture));
      expect(result.modules).toEqual(mockModules);
      expect(result.entryPoints.length).toBeGreaterThan(0);
      expect(result.metadata.stars).toBe(200000);
      expect(result.analyzedAt).toBeInstanceOf(Date);

      // Verify cache was set
      expect(mockCacheStore.set).toHaveBeenCalledWith(
        'repo_analysis:facebook/react',
        result,
        3600
      );
    });

    it('should return cached analysis if available', async () => {
      const url = 'https://github.com/facebook/react';
      const cachedAnalysis = {
        owner: 'facebook',
        name: 'react',
        url,
        summary: 'Cached summary',
        architecture: {
          description: 'Cached architecture',
          patterns: [],
          technologies: [],
          keyComponents: [],
        },
        modules: [],
        entryPoints: [],
        metadata: {
          stars: 200000,
          forks: 40000,
          openIssues: 500,
          language: 'JavaScript',
          languages: {},
          topics: [],
          lastUpdated: new Date('2024-01-15'),
          license: 'MIT',
        },
        analyzedAt: new Date('2024-01-15'),
      };

      vi.mocked(mockCacheStore.get).mockResolvedValue(cachedAnalysis);

      const result = await repositoryService.analyzeRepository(url);

      expect(result).toEqual(cachedAnalysis);
      expect(mockGitHubClient.getRepository).not.toHaveBeenCalled();
      expect(mockLLMClient.generateRepositorySummary).not.toHaveBeenCalled();
    });

    it('should throw error for invalid repository URL', async () => {
      const invalidUrl = 'https://example.com/invalid';

      await expect(repositoryService.analyzeRepository(invalidUrl)).rejects.toThrow();
      await expect(repositoryService.analyzeRepository(invalidUrl)).rejects.toMatchObject({
        code: ErrorCode.INVALID_REPOSITORY_URL,
      });
    });

    it('should throw error for malformed GitHub URL', async () => {
      const malformedUrl = 'https://github.com/owner';

      await expect(repositoryService.analyzeRepository(malformedUrl)).rejects.toThrow();
    });
  });

  describe('getRepositoryMetadata', () => {
    it('should retrieve repository metadata', async () => {
      const mockRepo = {
        id: 1,
        name: 'react',
        full_name: 'facebook/react',
        owner: { login: 'facebook' },
        html_url: 'https://github.com/facebook/react',
        description: 'A JavaScript library',
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 500,
        language: 'JavaScript',
        topics: ['javascript', 'react'],
        updated_at: '2024-01-15T10:00:00Z',
        license: { name: 'MIT' },
      };

      vi.mocked(mockGitHubClient.getRepository).mockResolvedValue(mockRepo);

      const result = await repositoryService.getRepositoryMetadata('facebook', 'react');

      expect(result).toBeDefined();
      expect(result.stars).toBe(200000);
      expect(result.forks).toBe(40000);
      expect(result.openIssues).toBe(500);
      expect(result.language).toBe('JavaScript');
      expect(result.topics).toEqual(['javascript', 'react']);
      expect(result.license).toBe('MIT');
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle repository with no language', async () => {
      const mockRepo = {
        id: 1,
        name: 'test',
        full_name: 'owner/test',
        owner: { login: 'owner' },
        html_url: 'https://github.com/owner/test',
        description: null,
        stargazers_count: 10,
        forks_count: 2,
        open_issues_count: 1,
        language: null,
        topics: [],
        updated_at: '2024-01-15T10:00:00Z',
        license: null,
      };

      vi.mocked(mockGitHubClient.getRepository).mockResolvedValue(mockRepo);

      const result = await repositoryService.getRepositoryMetadata('owner', 'test');

      expect(result.language).toBe('Unknown');
      expect(result.license).toBeNull();
    });
  });

  describe('getCachedAnalysis', () => {
    it('should retrieve cached analysis', async () => {
      const cachedData = {
        owner: 'facebook',
        name: 'react',
        url: 'https://github.com/facebook/react',
        summary: 'Test summary',
        architecture: {
          description: 'Test',
          patterns: [],
          technologies: [],
          keyComponents: [],
        },
        modules: [],
        entryPoints: [],
        metadata: {
          stars: 100,
          forks: 10,
          openIssues: 5,
          language: 'JavaScript',
          languages: {},
          topics: [],
          lastUpdated: '2024-01-15T10:00:00Z',
          license: 'MIT',
        },
        analyzedAt: '2024-01-15T10:00:00Z',
      };

      vi.mocked(mockCacheStore.get).mockResolvedValue(cachedData);

      const result = await repositoryService.getCachedAnalysis('facebook', 'react');

      expect(result).toBeDefined();
      expect(result?.owner).toBe('facebook');
      expect(result?.analyzedAt).toBeInstanceOf(Date);
      expect(result?.metadata.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return null if no cache exists', async () => {
      vi.mocked(mockCacheStore.get).mockResolvedValue(null);

      const result = await repositoryService.getCachedAnalysis('facebook', 'react');

      expect(result).toBeNull();
    });
  });

  describe('cacheAnalysis', () => {
    it('should cache analysis with correct TTL', async () => {
      const analysis = {
        owner: 'facebook',
        name: 'react',
        url: 'https://github.com/facebook/react',
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
          stars: 100,
          forks: 10,
          openIssues: 5,
          language: 'JavaScript',
          languages: {},
          topics: [],
          lastUpdated: new Date(),
          license: 'MIT',
        },
        analyzedAt: new Date(),
      };

      await repositoryService.cacheAnalysis('facebook', 'react', analysis);

      expect(mockCacheStore.set).toHaveBeenCalledWith(
        'repo_analysis:facebook/react',
        analysis,
        3600
      );
    });
  });
});
