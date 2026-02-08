/**
 * Guidance Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuidanceService } from './guidance-service.js';
import { ILLMClient, ICacheStore, IRepositoryService } from '../types/interfaces.js';
import { ErrorCode } from '../types/errors.js';

// Mock PrismaClient
const mockPrisma = {
  userProfile: {
    findUnique: vi.fn(),
  },
};

describe('GuidanceService', () => {
  let guidanceService: GuidanceService;
  let mockLLMClient: ILLMClient;
  let mockCacheStore: ICacheStore;
  let mockRepositoryService: IRepositoryService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock clients
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

    mockRepositoryService = {
      analyzeRepository: vi.fn(),
      getRepositoryMetadata: vi.fn(),
      getCachedAnalysis: vi.fn(),
      cacheAnalysis: vi.fn(),
    };

    guidanceService = new GuidanceService(
      mockPrisma as any,
      mockLLMClient,
      mockCacheStore,
      mockRepositoryService
    );
  });

  describe('generateContributionPath', () => {
    it('should generate contribution path for a user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const repositoryUrl = 'https://github.com/facebook/react';

      const mockProfile = {
        id: '1',
        userId,
        languages: ['JavaScript'],
        frameworks: ['React'],
        experienceLevel: 'intermediate',
        interests: ['web development'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRepository = {
        owner: 'facebook',
        name: 'react',
        url: repositoryUrl,
        summary: 'A JavaScript library for building user interfaces',
        architecture: {
          description: 'Component-based architecture',
          patterns: ['Component-based'],
          technologies: ['JavaScript', 'React'],
          keyComponents: ['React Core', 'React DOM'],
        },
        modules: [
          {
            path: 'src',
            name: 'src',
            purpose: 'Core source code',
            keyFiles: ['src/index.js'],
            complexity: 'medium' as const,
          },
        ],
        entryPoints: [
          {
            file: 'README.md',
            reason: 'Start here to understand the project',
            difficulty: 'beginner' as const,
          },
        ],
        metadata: {
          stars: 200000,
          forks: 40000,
          openIssues: 500,
          language: 'JavaScript',
          languages: { JavaScript: 1000000 },
          topics: ['javascript', 'react'],
          lastUpdated: new Date(),
          license: 'MIT',
        },
        analyzedAt: new Date(),
      };

      const mockContributionPath = {
        repositoryUrl,
        steps: [
          {
            order: 1,
            title: 'Read the README',
            description: 'Understand the project overview',
            files: ['README.md'],
            concepts: ['React basics'],
            resources: [],
          },
          {
            order: 2,
            title: 'Explore the source code',
            description: 'Look at the main entry point',
            files: ['src/index.js'],
            concepts: ['Component architecture'],
            resources: [],
          },
        ],
        estimatedTime: '2-3 hours',
        difficulty: 'intermediate' as const,
      };

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(mockProfile);
      vi.mocked(mockRepositoryService.analyzeRepository).mockResolvedValue(mockRepository);
      vi.mocked(mockLLMClient.generateContributionPath).mockResolvedValue(
        mockContributionPath
      );

      const result = await guidanceService.generateContributionPath(userId, repositoryUrl);

      expect(result).toBeDefined();
      expect(result.repositoryUrl).toBe(repositoryUrl);
      expect(result.steps.length).toBe(2);
      expect(result.steps[0].order).toBe(1);
      expect(result.steps[1].order).toBe(2);
      expect(result.difficulty).toBe('intermediate');
      expect(result.estimatedTime).toBe('2-3 hours');

      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockRepositoryService.analyzeRepository).toHaveBeenCalledWith(repositoryUrl);
      expect(mockLLMClient.generateContributionPath).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
        mockRepository
      );
    });

    it('should throw error when user profile not found', async () => {
      const userId = 'non-existent';
      const repositoryUrl = 'https://github.com/facebook/react';

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(null);

      await expect(
        guidanceService.generateContributionPath(userId, repositoryUrl)
      ).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
      });

      expect(mockRepositoryService.analyzeRepository).not.toHaveBeenCalled();
      expect(mockLLMClient.generateContributionPath).not.toHaveBeenCalled();
    });

    it('should use repository service to get analysis', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const repositoryUrl = 'https://github.com/vuejs/vue';

      const mockProfile = {
        id: '1',
        userId,
        languages: ['JavaScript'],
        frameworks: ['Vue'],
        experienceLevel: 'beginner',
        interests: ['web development'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRepository = {
        owner: 'vuejs',
        name: 'vue',
        url: repositoryUrl,
        summary: 'Progressive JavaScript framework',
        architecture: {
          description: 'Progressive framework',
          patterns: ['MVVM'],
          technologies: ['JavaScript', 'Vue'],
          keyComponents: ['Vue Core'],
        },
        modules: [],
        entryPoints: [],
        metadata: {
          stars: 150000,
          forks: 30000,
          openIssues: 300,
          language: 'JavaScript',
          languages: {},
          topics: ['javascript', 'vue'],
          lastUpdated: new Date(),
          license: 'MIT',
        },
        analyzedAt: new Date(),
      };

      const mockContributionPath = {
        repositoryUrl,
        steps: [
          {
            order: 1,
            title: 'Getting started',
            description: 'Learn Vue basics',
            files: ['README.md'],
            concepts: ['Vue fundamentals'],
            resources: [],
          },
        ],
        estimatedTime: '1-2 hours',
        difficulty: 'beginner' as const,
      };

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(mockProfile);
      vi.mocked(mockRepositoryService.analyzeRepository).mockResolvedValue(mockRepository);
      vi.mocked(mockLLMClient.generateContributionPath).mockResolvedValue(
        mockContributionPath
      );

      await guidanceService.generateContributionPath(userId, repositoryUrl);

      expect(mockRepositoryService.analyzeRepository).toHaveBeenCalledWith(repositoryUrl);
    });
  });

  describe('identifyEntryPoints', () => {
    const mockRepository = {
      owner: 'test',
      name: 'repo',
      url: 'https://github.com/test/repo',
      summary: 'Test repository',
      architecture: {
        description: 'Test architecture',
        patterns: [],
        technologies: [],
        keyComponents: [],
      },
      modules: [],
      entryPoints: [
        {
          file: 'README.md',
          reason: 'Project overview',
          difficulty: 'beginner' as const,
        },
        {
          file: 'CONTRIBUTING.md',
          reason: 'Contribution guidelines',
          difficulty: 'beginner' as const,
        },
        {
          file: 'src/index.js',
          reason: 'Main entry point',
          difficulty: 'intermediate' as const,
        },
        {
          file: 'src/core/engine.js',
          reason: 'Core engine implementation',
          difficulty: 'advanced' as const,
        },
      ],
      metadata: {
        stars: 1000,
        forks: 100,
        openIssues: 10,
        language: 'JavaScript',
        languages: {},
        topics: [],
        lastUpdated: new Date(),
        license: 'MIT',
      },
      analyzedAt: new Date(),
    };

    it('should return only beginner entry points for beginner users', async () => {
      const result = await guidanceService.identifyEntryPoints(mockRepository, 'beginner');

      expect(result).toHaveLength(2);
      expect(result).toContain('README.md');
      expect(result).toContain('CONTRIBUTING.md');
      expect(result).not.toContain('src/index.js');
      expect(result).not.toContain('src/core/engine.js');
    });

    it('should return beginner and intermediate entry points for intermediate users', async () => {
      const result = await guidanceService.identifyEntryPoints(
        mockRepository,
        'intermediate'
      );

      expect(result).toHaveLength(3);
      expect(result).toContain('README.md');
      expect(result).toContain('CONTRIBUTING.md');
      expect(result).toContain('src/index.js');
      expect(result).not.toContain('src/core/engine.js');
    });

    it('should return all entry points for advanced users', async () => {
      const result = await guidanceService.identifyEntryPoints(mockRepository, 'advanced');

      expect(result).toHaveLength(4);
      expect(result).toContain('README.md');
      expect(result).toContain('CONTRIBUTING.md');
      expect(result).toContain('src/index.js');
      expect(result).toContain('src/core/engine.js');
    });

    it('should return empty array when no suitable entry points exist', async () => {
      const repoWithNoBeginnerPoints = {
        ...mockRepository,
        entryPoints: [
          {
            file: 'src/advanced.js',
            reason: 'Advanced feature',
            difficulty: 'advanced' as const,
          },
        ],
      };

      const result = await guidanceService.identifyEntryPoints(
        repoWithNoBeginnerPoints,
        'beginner'
      );

      expect(result).toHaveLength(0);
    });

    it('should handle repository with no entry points', async () => {
      const repoWithNoEntryPoints = {
        ...mockRepository,
        entryPoints: [],
      };

      const result = await guidanceService.identifyEntryPoints(
        repoWithNoEntryPoints,
        'intermediate'
      );

      expect(result).toHaveLength(0);
    });
  });
});
