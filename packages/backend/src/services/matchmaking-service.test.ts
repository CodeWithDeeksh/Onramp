/**
 * Matchmaking Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchmakingService } from './matchmaking-service.js';
import { ILLMClient, ICacheStore } from '../types/interfaces.js';
import { ErrorCode } from '../types/errors.js';

// Mock PrismaClient
const mockPrisma = {
  userProfile: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  repositoryCache: {
    findMany: vi.fn(),
  },
};

describe('MatchmakingService', () => {
  let matchmakingService: MatchmakingService;
  let mockLLMClient: ILLMClient;
  let mockCacheStore: ICacheStore;

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

    matchmakingService = new MatchmakingService(
      mockPrisma as any,
      mockLLMClient,
      mockCacheStore
    );
  });

  describe('saveUserProfile', () => {
    it('should create a new user profile', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
      const profile = {
        userId,
        languages: ['JavaScript', 'Python'],
        frameworks: ['React', 'Django'],
        experienceLevel: 'intermediate' as const,
        interests: ['web development', 'AI'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.userProfile.create).mockResolvedValue({
        id: '1',
        userId,
        languages: profile.languages,
        frameworks: profile.frameworks,
        experienceLevel: profile.experienceLevel,
        interests: profile.interests,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await matchmakingService.saveUserProfile(userId, profile);

      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId,
          languages: profile.languages,
          frameworks: profile.frameworks,
          experienceLevel: profile.experienceLevel,
          interests: profile.interests,
        },
      });
    });

    it('should update an existing user profile', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
      const profile = {
        userId,
        languages: ['JavaScript', 'TypeScript'],
        frameworks: ['React', 'Node.js'],
        experienceLevel: 'advanced' as const,
        interests: ['web development'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingProfile = {
        id: '1',
        userId,
        languages: ['JavaScript'],
        frameworks: ['React'],
        experienceLevel: 'intermediate',
        interests: ['web development'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(existingProfile);
      vi.mocked(mockPrisma.userProfile.update).mockResolvedValue({
        ...existingProfile,
        ...profile,
      });

      await matchmakingService.saveUserProfile(userId, profile);

      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          languages: profile.languages,
          frameworks: profile.frameworks,
          experienceLevel: profile.experienceLevel,
          interests: profile.interests,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error for invalid profile data', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
      const invalidProfile = {
        userId,
        languages: [], // Invalid: empty array
        frameworks: [],
        experienceLevel: 'intermediate' as const,
        interests: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(
        matchmakingService.saveUserProfile(userId, invalidProfile)
      ).rejects.toThrow();
    });
  });

  describe('getUserProfile', () => {
    it('should retrieve an existing user profile', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
      const mockProfile = {
        id: '1',
        userId,
        languages: ['JavaScript', 'Python'],
        frameworks: ['React'],
        experienceLevel: 'intermediate',
        interests: ['web development'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(mockProfile);

      const result = await matchmakingService.getUserProfile(userId);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(userId);
      expect(result?.languages).toEqual(['JavaScript', 'Python']);
      expect(result?.experienceLevel).toBe('intermediate');
    });

    it('should return null for non-existent profile', async () => {
      const userId = 'non-existent';

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(null);

      const result = await matchmakingService.getUserProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for a user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
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

      const mockRepositories = [
        {
          id: '1',
          owner: 'facebook',
          name: 'react',
          url: 'https://github.com/facebook/react',
          analysisData: {
            owner: 'facebook',
            name: 'react',
            url: 'https://github.com/facebook/react',
            summary: 'A JavaScript library for building user interfaces for web development',
            architecture: {
              description: 'Component-based',
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
              languages: { JavaScript: 1000000 },
              topics: ['javascript', 'react', 'frontend', 'web-development'],
              lastUpdated: new Date().toISOString(),
              license: 'MIT',
            },
            analyzedAt: new Date().toISOString(),
          },
          analyzedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
        },
      ];

      const mockMatchScore = {
        score: 85,
        reasoning: 'Great match for JavaScript and React skills',
        languageMatch: 90,
        frameworkMatch: 95,
        interestMatch: 80,
        experienceMatch: 85,
      };

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(mockProfile);
      vi.mocked(mockPrisma.repositoryCache.findMany).mockResolvedValue(mockRepositories);
      vi.mocked(mockLLMClient.scoreRepositoryMatch).mockResolvedValue(mockMatchScore);

      const result = await matchmakingService.generateRecommendations(userId, 10);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].score).toBe(85);
      expect(result[0].reasoning).toBe('Great match for JavaScript and React skills');
      expect(result[0].matchedSkills).toContain('JavaScript');
      expect(result[0].matchedInterests).toContain('web development');
    });

    it('should return empty array when no repositories are cached', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
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

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(mockProfile);
      vi.mocked(mockPrisma.repositoryCache.findMany).mockResolvedValue([]);

      const result = await matchmakingService.generateRecommendations(userId, 10);

      expect(result).toEqual([]);
    });

    it('should throw error when user profile not found', async () => {
      const userId = 'non-existent';

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(null);

      await expect(
        matchmakingService.generateRecommendations(userId, 10)
      ).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('should sort recommendations by score in descending order', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
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

      const mockRepositories = [
        {
          id: '1',
          owner: 'facebook',
          name: 'react',
          url: 'https://github.com/facebook/react',
          analysisData: {
            owner: 'facebook',
            name: 'react',
            url: 'https://github.com/facebook/react',
            summary: 'React library',
            architecture: {
              description: 'Component-based',
              patterns: [],
              technologies: ['JavaScript'],
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
              topics: ['javascript'],
              lastUpdated: new Date().toISOString(),
              license: 'MIT',
            },
            analyzedAt: new Date().toISOString(),
          },
          analyzedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          id: '2',
          owner: 'vuejs',
          name: 'vue',
          url: 'https://github.com/vuejs/vue',
          analysisData: {
            owner: 'vuejs',
            name: 'vue',
            url: 'https://github.com/vuejs/vue',
            summary: 'Vue framework',
            architecture: {
              description: 'Progressive framework',
              patterns: [],
              technologies: ['JavaScript'],
              keyComponents: [],
            },
            modules: [],
            entryPoints: [],
            metadata: {
              stars: 150000,
              forks: 30000,
              openIssues: 300,
              language: 'JavaScript',
              languages: {},
              topics: ['javascript'],
              lastUpdated: new Date().toISOString(),
              license: 'MIT',
            },
            analyzedAt: new Date().toISOString(),
          },
          analyzedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
        },
      ];

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(mockProfile);
      vi.mocked(mockPrisma.repositoryCache.findMany).mockResolvedValue(mockRepositories);

      // Mock different scores for each repository
      vi.mocked(mockLLMClient.scoreRepositoryMatch)
        .mockResolvedValueOnce({
          score: 70,
          reasoning: 'Good match',
          languageMatch: 70,
          frameworkMatch: 70,
          interestMatch: 70,
          experienceMatch: 70,
        })
        .mockResolvedValueOnce({
          score: 90,
          reasoning: 'Excellent match',
          languageMatch: 90,
          frameworkMatch: 90,
          interestMatch: 90,
          experienceMatch: 90,
        });

      const result = await matchmakingService.generateRecommendations(userId, 10);

      expect(result.length).toBe(2);
      expect(result[0].score).toBe(90); // Higher score first
      expect(result[1].score).toBe(70);
    });

    it('should limit recommendations to specified limit', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
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

      // Create 5 mock repositories
      const mockRepositories = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        owner: `owner${i}`,
        name: `repo${i}`,
        url: `https://github.com/owner${i}/repo${i}`,
        analysisData: {
          owner: `owner${i}`,
          name: `repo${i}`,
          url: `https://github.com/owner${i}/repo${i}`,
          summary: `Repository ${i}`,
          architecture: {
            description: 'Test',
            patterns: [],
            technologies: ['JavaScript'],
            keyComponents: [],
          },
          modules: [],
          entryPoints: [],
          metadata: {
            stars: 1000,
            forks: 100,
            openIssues: 10,
            language: 'JavaScript',
            languages: {},
            topics: [],
            lastUpdated: new Date().toISOString(),
            license: 'MIT',
          },
          analyzedAt: new Date().toISOString(),
        },
        analyzedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      }));

      vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue(mockProfile);
      vi.mocked(mockPrisma.repositoryCache.findMany).mockResolvedValue(mockRepositories);
      vi.mocked(mockLLMClient.scoreRepositoryMatch).mockResolvedValue({
        score: 80,
        reasoning: 'Good match',
        languageMatch: 80,
        frameworkMatch: 80,
        interestMatch: 80,
        experienceMatch: 80,
      });

      const result = await matchmakingService.generateRecommendations(userId, 3);

      expect(result.length).toBe(3); // Limited to 3
    });
  });

  describe('scoreRepository', () => {
    it('should return score from LLM client', async () => {
      const profile = {
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        languages: ['JavaScript'],
        frameworks: ['React'],
        experienceLevel: 'intermediate' as const,
        interests: ['web development'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repository = {
        owner: 'facebook',
        name: 'react',
        url: 'https://github.com/facebook/react',
        summary: 'React library',
        architecture: {
          description: 'Component-based',
          patterns: [],
          technologies: ['JavaScript'],
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
          topics: ['javascript'],
          lastUpdated: new Date(),
          license: 'MIT',
        },
        analyzedAt: new Date(),
      };

      const mockMatchScore = {
        score: 85,
        reasoning: 'Great match',
        languageMatch: 90,
        frameworkMatch: 95,
        interestMatch: 80,
        experienceMatch: 85,
      };

      vi.mocked(mockLLMClient.scoreRepositoryMatch).mockResolvedValue(mockMatchScore);

      const result = await matchmakingService.scoreRepository(profile, repository);

      expect(result).toBe(85);
      expect(mockLLMClient.scoreRepositoryMatch).toHaveBeenCalledWith(profile, repository);
    });
  });
});
