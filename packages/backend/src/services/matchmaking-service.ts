/**
 * Matchmaking Service
 * Generates project recommendations based on user profiles
 */

import { PrismaClient } from '@prisma/client';
import {
  IMatchmakingService,
  ILLMClient,
  ICacheStore,
} from '../types/interfaces.js';
import {
  UserProfile,
  ProjectRecommendation,
  RepositoryAnalysis,
  ExperienceLevel,
} from '../types/models.js';
import { ServiceError, ErrorCode } from '../types/errors.js';
import { UserProfileSchema } from '../validation/schemas.js';

export class MatchmakingService implements IMatchmakingService {
  private readonly CACHE_KEY_PREFIX = 'repo_analysis:';

  constructor(
    private readonly prisma: PrismaClient,
    private readonly llmClient: ILLMClient,
    private readonly cacheStore: ICacheStore
  ) {}

  /**
   * Generates project recommendations for a user
   */
  async generateRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<ProjectRecommendation[]> {
    // Get user profile
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new ServiceError(
        ErrorCode.NOT_FOUND,
        `User profile not found for userId: ${userId}`,
        { userId }
      );
    }

    // Get all cached repository analyses
    const repositories = await this.getAllCachedRepositories();

    if (repositories.length === 0) {
      return [];
    }

    // Score each repository against user profile
    const scoredRepos = await Promise.all(
      repositories.map(async (repo) => {
        const matchScore = await this.llmClient.scoreRepositoryMatch(profile, repo);

        return {
          repository: repo,
          score: matchScore.score,
          reasoning: matchScore.reasoning,
          matchedSkills: this.findMatchedSkills(profile, repo),
          matchedInterests: this.findMatchedInterests(profile, repo),
        };
      })
    );

    // Sort by score (descending) and limit results
    const recommendations = scoredRepos
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Scores a repository against a user profile
   */
  async scoreRepository(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): Promise<number> {
    const matchScore = await this.llmClient.scoreRepositoryMatch(profile, repository);
    return matchScore.score;
  }

  /**
   * Saves or updates a user profile
   */
  async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    // Validate profile
    UserProfileSchema.parse(profile);

    // Check if profile exists
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      // Update existing profile
      await this.prisma.userProfile.update({
        where: { userId },
        data: {
          languages: profile.languages,
          frameworks: profile.frameworks,
          experienceLevel: profile.experienceLevel,
          interests: profile.interests,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new profile
      await this.prisma.userProfile.create({
        data: {
          userId,
          languages: profile.languages,
          frameworks: profile.frameworks,
          experienceLevel: profile.experienceLevel,
          interests: profile.interests,
        },
      });
    }
  }

  /**
   * Retrieves a user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    return {
      userId: profile.userId,
      languages: profile.languages,
      frameworks: profile.frameworks,
      experienceLevel: profile.experienceLevel as ExperienceLevel,
      interests: profile.interests,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Retrieves all cached repository analyses from cache store
   */
  private async getAllCachedRepositories(): Promise<RepositoryAnalysis[]> {
    // Get all repository cache entries from database
    const cacheEntries = await this.prisma.repositoryCache.findMany({
      where: {
        expiresAt: {
          gt: new Date(), // Only get non-expired entries
        },
      },
      orderBy: {
        analyzedAt: 'desc',
      },
    });

    // Convert to RepositoryAnalysis objects
    return cacheEntries.map((entry) => {
      const analysis = entry.analysisData as any;
      return {
        ...analysis,
        analyzedAt: new Date(analysis.analyzedAt),
        metadata: {
          ...analysis.metadata,
          lastUpdated: new Date(analysis.metadata.lastUpdated),
        },
      };
    });
  }

  /**
   * Finds skills that match between user profile and repository
   */
  private findMatchedSkills(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): string[] {
    const matched: string[] = [];

    // Match languages
    const repoLanguages = [
      repository.metadata.language,
      ...Object.keys(repository.metadata.languages),
    ].map((lang) => lang.toLowerCase());

    for (const lang of profile.languages) {
      if (repoLanguages.includes(lang.toLowerCase())) {
        matched.push(lang);
      }
    }

    // Match frameworks (check in technologies)
    const repoTechnologies = repository.architecture.technologies.map((tech) =>
      tech.toLowerCase()
    );

    for (const framework of profile.frameworks) {
      if (repoTechnologies.includes(framework.toLowerCase())) {
        matched.push(framework);
      }
    }

    return matched;
  }

  /**
   * Finds interests that match between user profile and repository
   */
  private findMatchedInterests(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): string[] {
    const matched: string[] = [];

    // Match against repository topics and summary
    const repoTopics = repository.metadata.topics.map((topic) => topic.toLowerCase());
    const repoSummary = repository.summary.toLowerCase();

    for (const interest of profile.interests) {
      const interestLower = interest.toLowerCase();

      // Check if interest matches any topic
      if (repoTopics.some((topic) => topic.includes(interestLower))) {
        matched.push(interest);
        continue;
      }

      // Check if interest appears in summary
      if (repoSummary.includes(interestLower)) {
        matched.push(interest);
      }
    }

    return matched;
  }
}
