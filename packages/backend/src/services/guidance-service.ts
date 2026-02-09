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
    // Get user profile (with fallback)
    let profile = await this.getUserProfile(userId);
    
    // If no profile found, use guest profile
    if (!profile) {
      profile = {
        userId: userId || 'guest',
        languages: ['JavaScript', 'TypeScript'],
        frameworks: ['React'],
        experienceLevel: 'intermediate' as ExperienceLevel,
        interests: ['web development'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Get repository analysis (from cache or analyze)
    const repository = await this.repositoryService.analyzeRepository(repositoryUrl);

    // Generate contribution path using LLM (with fallback)
    try {
      const contributionPath = await this.llmClient.generateContributionPath(
        profile,
        repository
      );
      return contributionPath;
    } catch (error) {
      // Fallback: Generate basic contribution path
      return this.generateBasicContributionPath(profile, repository);
    }
  }

  /**
   * Generates a basic contribution path when LLM is unavailable
   */
  private generateBasicContributionPath(
    profile: UserProfile,
    repository: RepositoryAnalysis
  ): ContributionPath {
    const steps = [
      {
        order: 1,
        title: 'Read the Documentation',
        description: `Start by reading the README and documentation to understand ${repository.name}'s purpose and architecture.`,
        files: ['README.md', 'CONTRIBUTING.md'].filter(f => 
          repository.entryPoints.some(ep => ep.file.includes(f))
        ),
        concepts: ['Project Overview', 'Setup Instructions'],
        resources: [
          {
            title: 'Repository README',
            url: repository.url,
            type: 'documentation' as const
          }
        ]
      },
      {
        order: 2,
        title: 'Set Up Development Environment',
        description: 'Clone the repository and install dependencies to get the project running locally.',
        files: ['package.json', 'requirements.txt', 'Gemfile'].filter(f =>
          repository.entryPoints.some(ep => ep.file.includes(f))
        ),
        concepts: ['Local Setup', 'Dependencies'],
        resources: []
      },
      {
        order: 3,
        title: 'Explore the Codebase',
        description: `Navigate through the main modules: ${repository.modules.slice(0, 3).map(m => m.name).join(', ')}`,
        files: repository.modules.slice(0, 3).flatMap(m => m.keyFiles.slice(0, 2)),
        concepts: ['Code Structure', 'Module Organization'],
        resources: []
      },
      {
        order: 4,
        title: 'Find Good First Issues',
        description: 'Look for issues labeled "good first issue" or "beginner-friendly" to start contributing.',
        files: [],
        concepts: ['Issue Tracking', 'Contribution Guidelines'],
        resources: [
          {
            title: 'Project Issues',
            url: `${repository.url}/issues`,
            type: 'documentation' as const
          }
        ]
      }
    ];

    return {
      repositoryUrl: repository.url,
      steps,
      estimatedTime: profile.experienceLevel === 'beginner' ? '3-4 hours' : '2-3 hours',
      difficulty: profile.experienceLevel
    };
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
    try {
      // Check if prisma is available
      if (!this.prisma) {
        return null;
      }

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
    } catch (error) {
      // Database unavailable - return null to trigger guest profile fallback
      return null;
    }
  }
}
