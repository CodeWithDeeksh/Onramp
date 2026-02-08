/**
 * Guidance Service
 * Generates personalized contribution paths for users
 */

import { PrismaClient } from '@prisma/client';
import {
  IGuidanceService,
  ILLMClient,
  ICacheStore,
  IRepositoryService,
} from '../types/interfaces.js';
import {
  ContributionPath,
  RepositoryAnalysis,
  ExperienceLevel,
  UserProfile,
} from '../types/models.js';
import { ServiceError, ErrorCode } from '../types/errors.js';

export class GuidanceService implements IGuidanceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly llmClient: ILLMClient,
    private readonly cacheStore: ICacheStore,
    private readonly repositoryService: IRepositoryService
  ) {}

  /**
   * Generates a personalized contribution path for a user
   */
  async generateContributionPath(
    userId: string,
    repositoryUrl: string
  ): Promise<ContributionPath> {
    // Get user profile
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new ServiceError(
        ErrorCode.NOT_FOUND,
        `User profile not found for userId: ${userId}`,
        { userId }
      );
    }

    // Get repository analysis (from cache or analyze)
    const repository = await this.repositoryService.analyzeRepository(repositoryUrl);

    // Generate contribution path using LLM
    const contributionPath = await this.llmClient.generateContributionPath(
      profile,
      repository
    );

    return contributionPath;
  }

  /**
   * Identifies entry points suitable for a user's experience level
   */
  async identifyEntryPoints(
    repository: RepositoryAnalysis,
    userLevel: ExperienceLevel
  ): Promise<string[]> {
    // Filter entry points by difficulty level
    const suitableEntryPoints = repository.entryPoints.filter((entryPoint) => {
      switch (userLevel) {
        case 'beginner':
          return entryPoint.difficulty === 'beginner';
        case 'intermediate':
          return (
            entryPoint.difficulty === 'beginner' || entryPoint.difficulty === 'intermediate'
          );
        case 'advanced':
          return true; // All levels suitable for advanced users
        default:
          return false;
      }
    });

    // Return file paths
    return suitableEntryPoints.map((ep) => ep.file);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Retrieves user profile from database
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
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
}
