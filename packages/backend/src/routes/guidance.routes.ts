/**
 * Guidance Routes
 * Handles contribution guidance endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { GuidanceService } from '../services/guidance-service.js';
import { RepositoryService } from '../services/repository-service.js';
import { MatchmakingService } from '../services/matchmaking-service.js';
import { GitHubClient } from '../clients/github-client.js';
import { LLMClient } from '../clients/llm-client.js';
import { CacheStore } from '../clients/cache-store.js';
import { prisma } from '../utils/prisma.js';
import { z } from 'zod';
import { ValidationError } from '../types/errors.js';

const guidanceRequestSchema = z.object({
  userId: z.string().uuid(),
  repositoryUrl: z.string().url().regex(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/),
});

export function createGuidanceRouter(): Router {
  const router = Router();

  // Initialize services
  const githubClient = new GitHubClient(process.env.GITHUB_TOKEN);
  const llmClient = new LLMClient({
    provider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic') || 'openai',
    apiKey: process.env.LLM_API_KEY || '',
  });
  const cacheStore = new CacheStore({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });

  const repositoryService = new RepositoryService(githubClient, llmClient, cacheStore);
  const matchmakingService = new MatchmakingService(llmClient, prisma);
  const guidanceService = new GuidanceService(
    prisma,
    llmClient,
    cacheStore,
    repositoryService
  );

  /**
   * POST /api/guidance
   * Generates personalized contribution guidance for a user
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Validate request body
        const result = guidanceRequestSchema.safeParse(req.body);
        if (!result.success) {
          throw new ValidationError('Invalid guidance request', {
            errors: result.error.errors,
          });
        }

        const { userId, repositoryUrl } = result.data;

        // Generate contribution path
        const contributionPath = await guidanceService.generateContributionPath(
          userId,
          repositoryUrl
        );

        res.status(200).json(contributionPath);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
